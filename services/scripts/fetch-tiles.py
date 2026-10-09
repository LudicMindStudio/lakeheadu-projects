#!/usr/bin/env python3
"""Refresh the vendored map tiles under public/tiles/.

Downloads the z6-z9 raster pyramid for the Northwestern Ontario region from
the Esri Light Gray Canvas service (the app itself makes no external requests
at runtime), converts each tile to WebP, and writes
public/tiles/{z}/{x}/{y}.webp.

Build-time tool only. Run from services/ with network access and Pillow:

    python3 scripts/fetch-tiles.py
"""

import io
import math
import os
import time
import urllib.request

from PIL import Image

BOUNDS = {"west": -95.5, "east": -85.5, "south": 47.75, "north": 51.8}
PAD = {6: (1, 0), 7: (1, 1), 8: (2, 1), 9: (1, 1)}  # extra tiles per side, per zoom
EAST_BONUS = {9: 2}  # east columns keep deep-zoom panning in coverage
BASE = (
    "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/"
    "World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
)
OUT = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "tiles")
)
UA = {"User-Agent": "lakeheadu-services-tiles"}
QUALITY = 84


def tile_lat(y, z):
    n = math.pi - 2.0 * math.pi * y / (2**z)
    return math.degrees(math.atan(math.sinh(n)))


def tile_lng(x, z):
    return x / (2**z) * 360.0 - 180.0


def plan():
    tiles = {}
    for z in (6, 7, 8, 9):
        x0 = int((BOUNDS["west"] + 180) / 360 * 2**z)
        x1 = int((BOUNDS["east"] + 180) / 360 * 2**z)
        y0 = int((1 - math.asinh(math.tan(math.radians(BOUNDS["north"]))) / math.pi) / 2 * 2**z)
        y1 = int((1 - math.asinh(math.tan(math.radians(BOUNDS["south"]))) / math.pi) / 2 * 2**z)
        px, py = PAD[z]
        tiles[z] = (x0 - px, x1 + px + EAST_BONUS.get(z, 0), y0 - py, y1 + py)
    return tiles


def fetch(url, attempts=4):
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(request, timeout=25) as response:
                return response.read()
        except Exception:
            time.sleep(1.2 * (attempt + 1))
    return None


def main():
    written = 0
    failed = []
    total_bytes = 0
    for z, (xa, xb, ya, yb) in plan().items():
        for x in range(xa, xb + 1):
            for y in range(ya, yb + 1):
                directory = os.path.join(OUT, str(z), str(x))
                os.makedirs(directory, exist_ok=True)
                target = os.path.join(directory, f"{y}.webp")
                raw = fetch(BASE.format(z=z, y=y, x=x))
                if raw is None:
                    failed.append(f"{z}/{x}/{y}")
                    continue
                image = Image.open(io.BytesIO(raw)).convert("RGB")
                image.save(target, "WEBP", quality=QUALITY, method=6)
                written += 1
                total_bytes += os.path.getsize(target)
        print(f"z{z}: done", flush=True)
    print(f"tiles written: {written} ({total_bytes / 1024:.0f} KiB)")
    if failed:
        print("failed tiles:", " ".join(failed))
    print(
        "coverage: lng {:.2f}..{:.2f}, lat {:.2f}..{:.2f}".format(
            tile_lng(plan()[6][0], 6),
            tile_lng(plan()[6][1] + 1, 6),
            tile_lat(plan()[6][3] + 1, 6),
            tile_lat(plan()[6][2], 6),
        )
    )


if __name__ == "__main__":
    main()
