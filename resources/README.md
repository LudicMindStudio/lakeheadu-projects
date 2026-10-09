# Resources

Searchable database of mental health resources and tools.

Entries are editable data: `src/data/entries.json`, read through `src/lib/entries.js`.
Browse, search, filter, and sort state live in the URL. Banner and embed media
are local files under `public/media/`.

Part of the lakeheadu-projects repository. See the root README for commands.

## The management server

The static build stands alone. With the bundled server running, the same app
gains a sign-in and an editing surface at `/admin`, and renders from the
server's copy of the data.

```sh
npm run build
ADMIN_PASSWORD=choose-a-password npm run server
```

The server is plain Node with no dependencies. On first run it copies the
shipped data to `server/data/entries.json` (kept out of git) and writes every
change through with an atomic swap, keeping one `.bak` generation.

| Variable         | Default                    | Purpose               |
| ---------------- | -------------------------- | --------------------- |
| `PORT`           | `5210`                     | Port to listen on     |
| `HOST`           | `127.0.0.1`                | Interface to bind     |
| `ADMIN_PASSWORD` | none                       | Required to sign in   |
| `SESSION_SECRET` | random per start           | Signs session cookies |
| `DATA_FILE`      | `server/data/entries.json` | Storage path          |
