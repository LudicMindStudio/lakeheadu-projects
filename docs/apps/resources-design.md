# Resources — design note

Draft v3 — 2026-10-09. Third design pass for the Resources app: the ring fills the window and returns whenever the search clears, with one clean, animated wash between the two states; media-forward cards expand from a quiet arrow that also opens on a long hover; full pages embed video and documents; and the shelf stays editable behind a password. The first pass's search, filters, sorts, and data carry forward.

**Find trusted resources and tools on digital mental health technology, in one searchable place.**

## The app

A searchable database indexing reliable sources of information about, and readily applicable tools for, digital mental health technologies. It serves educators, students, and other stakeholders who want to know what is out there and where to start with it.

Entry kinds: libraries, lesson plans, videos, podcasts, organizations & websites, articles (non-research), articles (research), tools & checklists — plus mHealth apps, drawn from three collections: our library, the MHCC mHealth directory, and MindApps.org.

## What this revision changes

- Landing and browse become one surface: a grid that opens as a ring on arrival and morphs into the list when a search starts.
- Cards grow up: media leads, titles get large, each card carries an expandable section. Full pages stay.
- Entries can carry a banner (image or video), and full pages can embed a video or a document.
- The site gains a small server and a single-password management surface at `/admin`.
- Taste returns: color families, soft depth, a little pop, a proper type pair — carried from the earlier iteration, retuned for calm.

## Routes

| Route | Surface | Job |
|---|---|---|
| `/` | The grid | The ring whenever nothing is active; the list once a search, filter, or sort is set. |
| `/browse` | The list, directly | Skips the ring; opens the list with the full control row. |
| `/entry/:id` | Full page | One entry, everything, embeds included. |
| `/admin` | Management | Sign in; add, edit, and remove entries. |
| `*` | Not found | Quiet, with a way back. |

Route names are defaults. Landing and browse are one surface, not two pages: the grid holds both states, and the morph between them is the app's signature moment. Browse state (query, filters, sort) lives in the URL, so back, refresh, and shared links restore the exact view.

## The ring (arrival)

A fresh arrival at `/` with nothing typed opens the grid as a ring:

On desktop the ring fills the window — edge to edge and header to footer, with one consistent gutter — instead of sitting in its own fixed frame.

- **The center.** A quiet panel at the center of the surface carries, in order: the app's one-line promise, the search field, and two lines of instruction ("Type to search, or browse the shelf around you. Filters for kind, age, and app directory appear with the results."). This is the page's single focal point. A small "Browse everything" link goes straight to the list.
- **The shelf around it.** The eight latest entries sit in the cells of a box around the center — three across, three down, the middle reserved for the panel. Each cell is a full media card (see Cards).
- **The drift.** The cards keep their boxed formation and translate very slightly along the ring's path on one slow shared cycle: a few pixels, minutes long, staggered per card. It should read as the ring gently turning, never as cards wandering. The drift pauses off-tab and stops entirely under reduced motion.

The ring is the resting state, not a one-time door. It opens on every arrival at `/` with nothing active, and it comes back whenever the search clears — the surface settles into the shelf again. A search, a filter, or the browse link takes it into the list; clearing everything brings it home.

Narrow screens stack the composition: the center panel first — promise, search, instructions — then the cards in a single column beneath it. No drift below the ring width; a soft staggered entrance instead.

## The search morph

When the search field takes its first characters, the surface changes shape:

1. The search bar animates to the top of the page and settles as the list's top bar. It settles there while the list is showing, and glides back to the center when the ring returns.
2. The ring loosens: cards glide out of the box formation and expand into wide bands — two per row on desktop, the first screen landing two rows of results.
3. The count, the "Filters (n)" control, and the sort control slide in beneath the search bar; results step into place with a small stagger.

Typing stays live throughout: matches highlight, the count updates as you type, and filters and chips work as before. Clearing the query — or removing the last active filter — brings the ring back, and both swaps animate in both directions: the leaving surface fades as it lifts, the arriving one rises into place. From `/browse`, search is already at the top, so typing only narrows.

## Cards

One card anatomy across the app, media first:

- **Media leads.** The entry's banner (image, or a video where one exists) carries the card. In the ring, it fills the cell and the badge and title sit over a soft scrim; in the list, it runs as the left panel of the wide band, with the info panel beside it. Media can lead without shouting — sample art is calm, in the format's color family.
- **Info in front.** A color-coded format badge, the title in the display face at a generous size, the source, and a quiet meta row (age, dates). While a search is active, a one-line snippet shows under the title with the match highlighted.
- **Expandable section.** A small arrow opens the card's details in place: the description, topic tags, and a "More" link to the full page. Hovering a card for two full seconds opens it on its own and it stays open; closing it with the arrow turns that hover-open off for the card. Panels animate open and push the grid gently; nothing overlays. The title, the media, and the "More" link all go to the full page, so the full page per entry stays exactly as it should.
- **Alive, not jumpy.** Hover lifts the card a few pixels with the pop shadow; the media eases in a hair. That is the whole budget for a card.

## Full page (`/entry/:id`)

- A wide hero banner (the entry's media; a clip plays muted where the banner is a video), the title, source, and meta (who it is for, published, added), then the description and tags.
- **Embedded media** when the entry carries one: a video player for clips (native player for files, framed player for common hosts) or a document viewer for PDFs, sized to read, with a calm fallback link. Embedding a video or a PDF is a paste-the-link edit in the admin; nothing to code per entry.
- An "Open resource" action when a live URL exists. Sample entries show a plain note instead — no dead links.
- Back returns to the exact list, search and filters intact.

## Media as data

Entries carry their media as editable fields, in the same single data file as everything else:

| Field | Shape | Notes |
|---|---|---|
| `banner` | `{ kind: "image" \| "video", src, poster?, alt }`, nullable | Card lead and hero. Video banners are muted, looping, inline; the poster replaces the clip under reduced motion or when it cannot play. |
| `embed` | `{ kind: "video" \| "pdf", url, title }`, nullable | Rendered on the full page only. |

Sample media is generated locally — abstract art per format family, plus one short clip — committed with the app, and marked in the same sample language as everything else. No external media references anywhere in the sample data.

## Look — carried from the earlier iteration, retuned

The first pass read a touch synthetic. This one brings back the earlier iteration's craft, tastefully:

- **Palette.** Warm paper (#f4f2ee), ink (#22261f), white surfaces, hairline interior rules. One accent family per format kind: soft blue for videos and podcasts, green for lesson plans and tools, amber for articles, neutral for libraries and organizations, ink solid for apps. Color appears as tinted badges, media hues, and small accents — meaning-bearing, never decoration. Search matches keep the warm amber highlight.
- **Depth.** Soft drop shadows where surfaces need to float: cards on a wide low-opacity blur, hover lifting to the pop shadow, fields on their own quiet shadow. Hairlines stay for rules inside surfaces. Not flat, not heavy.
- **Shape and type.** 18px cards, 16px fields, pill badges. A display face for titles (Space Grotesk) and a humanist body face (Source Sans 3), both self-hosted (about 75 KB, OFL) so no external font requests are made; the system stack stands by as fallback.
- **Desktop fill.** The surface breathes to the window — up to about 1520px wide, generous gutters — instead of hugging a narrow column. The full page keeps a calm reading measure for prose while the banner runs wide.
- **Pop, budgeted.** Staggered card entrances, springy chips, hover lifts, the morph, the drift. Small moments, all of which yield to `prefers-reduced-motion`.

Accessible by construction: semantic HTML (one h1 per page, real landmarks, labeled controls), visible focus states, AA contrast (badge tints included), `aria-live` on the result count, keyboard order that follows the focal order (search first, cards after), and banners that never autoplay sound or demand motion.

## Motion

One grammar, carried from the earlier iteration: settles on a soft ease, micro-pops on a light spring. About 120–200ms for micro moments, 400–560ms for layout changes, nothing longer.

- **The drift** — the ring's slow turn, paused off-tab.
- **The morph** — one native transition carries each swap: the cards glide between the ring's cells and the list's wide bands, the search bar travels between the center and the top, and the rest of the surface crosses with a clean fade and a small vertical step. It runs on every swap between the two states, never on every keystroke. If a browser drops the native transition, the swap falls back to the same fade and step as a plain entrance, so the surface never cuts.
- **Screen changes** — opening an entry and coming back feel continuous: the browser's native view transitions carry the card into the page where the browser supports them, with a calm cross-fade as the fallback. No white-blink cuts.
- **Micro** — hover lift, chip pop, count tick. No spinners, no bounces, no scroll effects.

All motion is CSS and platform APIs. No animation libraries, no new dependencies.

## Filters and sorting (carried)

Three groups from the client notes. Within a group, selections combine (OR). Across groups, they narrow (AND). Each option shows a live count; the set sits behind one quiet "Filters (n)" control in the results row (a sheet on narrow screens); active filters collect as removable chips with a Clear all action.

**What kind of resource?**

| Client term | Label | Key |
|---|---|---|
| Libraries | Libraries | `library` |
| Lesson plans | Lesson plans | `lesson-plan` |
| Videos | Videos | `video` |
| Podcasts | Podcasts | `podcast` |
| Organizations and websites | Organizations & websites | `organization-website` |
| Articles (non-research) | Articles (non-research) | `article-nonresearch` |
| Articles (research) | Articles (research) | `article-research` |
| Tools (e.g., checklists) | Tools & checklists | `tool` |

**Who it's for?**

| Client term | Label | Key |
|---|---|---|
| Age group | All ages | `all-ages` |
| Age group | Under 18 | `under-18` |
| Age group | 18–65 | `18-65` |
| Age group | 65+ | `65-plus` |

**mHealth apps**

| Client term | Label | Key |
|---|---|---|
| mHealth apps (our library) | Our library | `our-library` |
| MHCC mHealth directory | MHCC mHealth directory | `mhcc-directory` |
| MindApps.org | MindApps.org | `mindapps` |

Notes:

- The app trio is a `collection` field on entries whose format is `app`; the group filters apps by collection.
- Labels are proposals in plain, user-first language. Final wording is the client's content.
- Age reads inclusively: choosing "Under 18" or "65+" also surfaces "All ages" entries, so universal resources stay findable.

**Sorting**

| Sort | Rule | Default when |
|---|---|---|
| Newest first | `published_date` descending; entries without one fall back to `added_date`; undated last. | Browsing (no query). |
| Best match | Relevance to the query — title ×3, tags ×2, description ×1, source ×1; ties break by recency. Disabled while the field is empty. | Searching (query present). |

The person's own choice sticks until they change it or clear the query.

## Management — a small server and `/admin`

The site keeps working as a static build; with its server running it gains a management surface.

- **Server.** A zero-dependency Node server (`server/`, plain `node:http`, started with `npm run server`, port from `PORT`, default 5210). It serves the built app, a small JSON API, and the admin session. Storage is the app's own JSON file, written through on every change with an atomic swap, one `.bak` generation kept. First run seeds it from the shipped data.
- **Sign-in.** One admin password from the environment; a signed, http-only session cookie; constant-time comparison; secrets never in the repo (env or a git-ignored file). Sign out clears the session.
- **`/admin`.** A quiet in-app page. Signed out: one password field. Signed in: a plain table of entries — title, format, source, updated — with add, edit, and remove. The edit form covers every field an entry has, banner and embed included, so the whole database is editable without touching code. When the site runs without its server, `/admin` says so in one plain line instead of pretending.
- **The way in.** A small "Manage resources" link in the footer of every page. Quiet, standard, always in the same spot.
- **Data flow.** The app renders from its bundled data immediately and refreshes from the API when the server is present, so edits appear on the public site without a rebuild. Without the server, nothing changes for a visitor.

No new dependencies anywhere: the server is plain Node, and motion is CSS and platform APIs.

## Entry data

Entries are editable data, not component code: one file (`src/data/entries.json`), read in one place, so content can be replaced later without touching components. Field shape (search, filters, sorting, and admin all read from this):

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable slug; used in `/entry/:id` |
| `title` | string | |
| `format` | enum | one of the eight kinds above, or `app` |
| `collection` | enum, nullable | apps only: `our-library`, `mhcc-directory`, `mindapps` |
| `source` | string | who made or published it |
| `url` | string, nullable | sample entries carry no live links (see Sample content) |
| `description` | string | one to three plain sentences: what it is, why it may help |
| `age_groups` | array | subset of the four age keys |
| `tags` | array | short topic words (anxiety, sleep, screen time, privacy, …) |
| `published_date` | date, nullable | drives Newest first |
| `added_date` | date | fallback for sorting |
| `banner` | object, nullable | see Media as data |
| `embed` | object, nullable | see Media as data |

## Sample content

About 12 entries, every filter value covered at least once. Sources are fictional or neutral (no invented details for real organizations); real place names are fine. Marked as sample everywhere it could be mistaken for real: a small "Sample content" marker in the header, and a plain note instead of any dead link on entry details.

Coverage: each of the eight kinds at least once; each app collection at least once; each age value at least once; dates spread so recency sorting reads; a handful of topic tags; a banner for every entry; one video banner; two embeds — one clip, one document — to prove both media paths end to end. All sample media is local and generated; nothing is fetched.

## Open questions

Each with a stated default. The build proceeds on defaults unless corrected.

1. **Ring re-show** — resolved: the ring returns whenever the search box is empty and nothing else is active, and every fresh arrival at `/` opens it.
2. **Ring contents** — default: the eight newest entries. Alternative: a curated flag later.
3. **List geometry** — default: wide bands, two per row, two rows landing in the first screen on desktop; one per row below about 1100px. Tune on sight.
4. **Video banners** — default: muted, looping, inline, poster-first; the poster replaces the clip under reduced motion.
5. **Admin media** — default: URLs and paths only (no file uploads this pass).
6. **Manage link** — default: footer, every page, always visible; `/admin` explains unavailability when the server is not running.
7. **Type faces** — default: vendor Space Grotesk and Source Sans 3 (self-hosted, OFL) as the earlier iteration had them. Alternative: system stack throughout.
8. **"Libraries" meaning** — default (carried): curated collections or archives of materials, one kind among the eight.
9. **The app trio** — default (carried): the three mHealth collections filter app entries by collection; the data model is unchanged.

## The pass will land

The ring landing, the morph, the list, media cards, full pages with embeds, and `/admin` with its server — verified with `npm run lint`, `npm test`, `npm run build`, server checks (sign-in plus a create/edit/remove round-trip), and console-clean captures of every surface and state.
