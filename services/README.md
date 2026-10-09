# Services

A map-first directory of mental health services in Northwestern Ontario. Someone
puts in what they need, and what is available for them appears on the map and in
the results rail: what the service is, what it costs, and the exact first step
to get started.

Part of the lakeheadu-projects repository. The design note lives at
`docs/apps/services-design.md`.

## Commands

    npm install       install dependencies
    npm run dev       start the Vite dev server
    npm run build     production build to dist/
    npm run preview   serve the production build (static)
    npm run serve     serve the build with the app's server (see below)
    npm test          run the test suite
    npm run lint      run oxlint
    npm run format    run Prettier

## Serving it

Two modes, one app:

- **Static hosting:** `npm run preview`, or any static host serving `dist/`.
  The app reads the sample dataset bundled with it.
- **With the server:** `npm run serve` serves the built app, a small JSON API,
  and the entry editor. The public site reads the live entries store instead of
  the bundled samples.

The server has no dependencies (plain `node:http`). Environment variables:

| Variable                  | Meaning                                                 |
| ------------------------- | ------------------------------------------------------- |
| `PORT`                    | port to listen on (default 5175)                        |
| `SERVICES_ADMIN_PASSWORD` | admin password; unset, the editor stays off             |
| `SERVICES_DATA_FILE`      | entries store path (default `server/data/entries.json`) |

The entries store is a JSON file created on first run (seeded from the sample
dataset) and written atomically on every change. It is never part of the
repository, and `.env`-style files are ignored. The editor lives at `/admin`:
sign in, then create, edit, and delete entries; changes publish to the store
the public site reads.

## The map

The map is MapLibre GL JS over a vendored tile set under `public/tiles/`
(raster, z6–z10 across the region with panning margin, plus z11 around the
towns; recolored at build time to the app's warm palette with a subtle
hillshade), so the app renders with no external requests at runtime. The
tile URL carries a version (`?v=` in `src/data/mapConfig.js`); bump it
whenever `scripts/fetch-tiles.py` rewrites the tile set so browsers fetch
the new tiles. The fetcher is a build-time tool that needs network access,
Pillow, and numpy. The typefaces under `public/fonts/` are self-hosted
subsets.

Base map © Esri, HERE, Garmin, © OpenStreetMap contributors.

## Sample content

Listings are sample content: organizations are fictional, place names are real,
and contact details use reserved-for-fiction numbers (807-555-01xx). Nothing
here describes a real service.

## Tests

Vitest covers the directory logic, the sample-data gates (filter and status
coverage, coordinates, contact conventions), pin layout, colour-contrast gates,
the app flows, and the server (store, auth, HTTP).
