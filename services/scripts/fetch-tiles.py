#!/usr/bin/env python3
"""Refresh the vendored map tiles under public/tiles/.

Downloads the raster pyramid for the Northwestern Ontario region from the
Esri Light Gray Canvas base service (the app itself makes no external
requests at runtime), recolors it at build time to the app's warm paper /
soft teal palette, lays a subtle hillshade under the palette, and writes
public/tiles/{z}/{x}/{y}.webp.

The pyramid: z6-z9 across the framed region with a few screens of margin,
z10 across the map's pan bounds (padded), and z11 windows around the
service towns (town detail stays crisp at the entry-view zoom). The pads
and the extra z11 ring keep panning inside the fetched set.

Build-time tool only. Run from services/ with network access, Pillow, and
numpy:

    python3 scripts/fetch-tiles.py

After a refresh, bump the tile version in src/data/mapConfig.js so browsers
refetch the set.

Base map (c) Esri, HERE, Garmin, (c) OpenStreetMap contributors.
"""

import io
import math
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image

BOUNDS = {"west": -95.5, "east": -85.5, "south": 47.75, "north": 51.8}
PAD = {6: (2, 2), 7: (3, 4), 8: (2, 3), 9: (2, 2)}  # extra tiles per side, per zoom
EAST_BONUS = {6: 1, 9: 1}  # east columns keep deep-zoom panning in coverage

# z10 covers the map's pan bounds so the whole reachable map stays sharp.
BOUNDS_10 = {"west": -95.9, "east": -83.5, "south": 47.15, "north": 52.4}
PAD_10 = (1, 1)  # extra tiles per side at z10

# z11 windows around each service town (dx, dy tiles each side of town tile).
TOWNS = [
    ("Atikokan", -91.62, 48.75, 4, 3),
    ("Dryden", -92.83, 49.78, 4, 3),
    ("Emo", -93.83, 48.63, 4, 3),
    ("Fort Frances", -93.40, 48.61, 4, 3),
    ("Geraldton", -86.95, 49.72, 4, 3),
    ("Kenora", -94.49, 49.77, 4, 3),
    ("Marathon", -86.38, 48.72, 4, 3),
    ("Nipigon", -88.27, 49.01, 4, 3),
    ("Red Lake", -93.83, 51.06, 4, 4),
    ("Sioux Lookout", -91.92, 50.09, 4, 3),
    ("Terrace Bay", -87.10, 48.78, 4, 3),
    ("Thunder Bay", -89.25, 48.38, 5, 4),
]

BASE = (
    "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/"
    "World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
)
HILLSHADE = (
    "https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/"
    "World_Hillshade/MapServer/tile/{z}/{y}/{x}"
)
OUT = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "tiles")
)
UA = {"User-Agent": "lakeheadu-services-tiles"}
QUALITY = 84
WORKERS = 6
HILLSHADE_AMOUNT = 0.10


# --- the palette ------------------------------------------------------------

# Warm neutral ramp: paper light through warm mids to deep warm gray. Land
# sits at L 239 (paper), urban blocks and shoreline blends in the 200s.
WARM_CTRL = [
    (0.0, (74, 65, 54)),
    (100.0, (110, 98, 80)),
    (140.0, (142, 128, 106)),
    (170.0, (168, 152, 126)),
    (190.0, (196, 178, 148)),
    (205.0, (215, 199, 170)),
    (214.0, (225, 211, 185)),
    (224.0, (234, 223, 201)),
    (232.0, (241, 231, 213)),
    (239.0, (246, 241, 231)),
    (246.0, (250, 247, 240)),
    (255.0, (253, 252, 248)),
]

# Teal water ramp: soft desaturated teal that sits under the app accent.
TEAL_CTRL = [
    (100.0, (85, 111, 108)),
    (140.0, (109, 137, 133)),
    (170.0, (136, 163, 159)),
    (190.0, (160, 185, 181)),
    (200.0, (176, 199, 194)),
    (204.0, (188, 210, 205)),
    (208.0, (200, 219, 214)),
    (214.0, (219, 231, 228)),
    (225.0, (235, 242, 240)),
]


def _ramps():
    def build(ctrl):
        xs = np.array([c[0] for c in ctrl], dtype=np.float32)
        cols = [np.array([c[1][i] for c in ctrl], dtype=np.float32) for i in range(3)]
        return xs, cols

    return build(WARM_CTRL), build(TEAL_CTRL)


(WARM_X, WARM_C), (TEAL_X, TEAL_C) = _ramps()


def recolor(image):
    a = np.asarray(image.convert("RGB"), dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    cast = b - r

    warm = [np.interp(luma, WARM_X, c) for c in WARM_C]
    teal = [np.interp(luma, TEAL_X, c) for c in TEAL_C]

    # Water reads as slightly darker pixels carrying a blue cast; weight the
    # teal ramp by both so shoreline blends stay smooth.
    weight = (
        np.clip((228.0 - luma) / 17.0, 0.0, 1.0) * np.clip((cast + 2.0) / 5.5, 0.0, 1.0)
    )[..., None]

    out = np.stack(warm, axis=-1) * (1 - weight) + np.stack(teal, axis=-1) * weight
    return np.clip(out, 0, 255).astype(np.uint8)


def shade(rgb, hill):
    """Lay a subtle warm hillshade under the recolored tile."""
    shade_map = np.asarray(hill.convert("L"), dtype=np.float32) / 255.0
    factor = 1.0 - HILLSHADE_AMOUNT * (1.0 - np.clip(shade_map, 0.0, 1.0))
    return np.clip(rgb.astype(np.float32) * factor[..., None], 0, 255).astype(np.uint8)


# --- the plan ---------------------------------------------------------------


def tile_xy(lon, lat, z):
    x = int((lon + 180) / 360 * 2**z)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**z)
    return x, y


def rect(bounds, z, pad=0):
    x0 = int((bounds["west"] + 180) / 360 * 2**z) - pad
    x1 = int((bounds["east"] + 180) / 360 * 2**z) + pad
    y0 = int((1 - math.asinh(math.tan(math.radians(bounds["north"]))) / math.pi) / 2 * 2**z) - pad
    y1 = int((1 - math.asinh(math.tan(math.radians(bounds["south"]))) / math.pi) / 2 * 2**z) + pad
    return x0, x1, y0, y1


def plan():
    tiles = {}
    for z in (6, 7, 8, 9):
        px, py = PAD[z]
        x0, x1, y0, y1 = rect(BOUNDS, z)
        tiles[z] = {(x, y) for x in range(x0 - px, x1 + px + EAST_BONUS.get(z, 0) + 1) for y in range(y0 - py, y1 + py + 1)}
    px, py = PAD_10
    x0, x1, y0, y1 = rect(BOUNDS_10, 10)
    tiles[10] = {
        (x, y) for x in range(x0 - px, x1 + px + 1) for y in range(y0 - py, y1 + py + 1)
    }
    windows = set()
    for _, lon, lat, dx, dy in TOWNS:
        tx, ty = tile_xy(lon, lat, 11)
        windows |= {(x, y) for x in range(tx - dx, tx + dx + 1) for y in range(ty - dy, ty + dy + 1)}
    tiles[11] = windows
    return tiles


def tile_lat(y, z):
    n = math.pi - 2.0 * math.pi * y / (2**z)
    return math.degrees(math.atan(math.sinh(n)))


def tile_lng(x, z):
    return x / (2**z) * 360.0 - 180.0


# --- fetching ---------------------------------------------------------------


def fetch(url, attempts=4):
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(request, timeout=25) as response:
                return response.read()
        except Exception:
            pass
        import time

        time.sleep(0.8 * (attempt + 1))
    return None


def build_tile(job):
    z, x, y = job
    raw = fetch(BASE.format(z=z, x=x, y=y))
    if raw is None:
        return z, x, y, None, "base"
    hill_raw = fetch(HILLSHADE.format(z=z, x=x, y=y))
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        rgb = recolor(image)
        if hill_raw is not None:
            rgb = shade(rgb, Image.open(io.BytesIO(hill_raw)))
        target = os.path.join(OUT, str(z), str(x), f"{y}.webp")
        os.makedirs(os.path.dirname(target), exist_ok=True)
        Image.fromarray(rgb, "RGB").save(target, "WEBP", quality=QUALITY, method=6)
    except Exception as exc:  # noqa: BLE001 - report and continue
        return z, x, y, None, f"convert: {exc}"
    return z, x, y, os.path.getsize(target), None


def main():
    tiles = plan()
    total = sum(len(v) for v in tiles.values())
    print(f"tiles to build: {total} ({', '.join(f'z{z}: {len(v)}' for z, v in sorted(tiles.items()))})")

    written = 0
    total_bytes = 0
    failed = []
    per_zoom = {}

    jobs = sorted((z, x, y) for z, ts in tiles.items() for (x, y) in ts)
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for z, x, y, size, error in pool.map(build_tile, jobs):
            if size is None:
                failed.append(f"{z}/{x}/{y} ({error})")
            else:
                written += 1
                total_bytes += size
                count, bytes_ = per_zoom.get(z, (0, 0))
                per_zoom[z] = (count + 1, bytes_ + size)

    for z in sorted(per_zoom):
        count, bytes_ = per_zoom[z]
        print(f"z{z}: {count} tiles, {bytes_ / 1024:.0f} KiB")

    print(f"tiles written: {written} of {total} ({total_bytes / 1024 / 1024:.1f} MiB)")
    if failed:
        print("failed tiles:")
        for line in failed:
            print("  ", line)
        sys.exit(1)
    x0, x1, y0, y1 = rect(BOUNDS_10, 10)
    print(
        "coverage: lng {:.2f}..{:.2f}, lat {:.2f}..{:.2f}".format(
            tile_lng(x0, 10),
            tile_lng(x1 + 1, 10),
            tile_lat(y1 + 1, 10),
            tile_lat(y0, 10),
        )
    )


if __name__ == "__main__":
    main()
