# Services: design

Design note for the services app: a map-first directory of mental health services in Northwestern Ontario. October 2026, revision 3.

Filter vocabulary and sort criteria follow the project notes in `docs/source/website-format-draft.md`.

**Promise**

> Find services across Northwestern Ontario, and the first step to get started.

## What this is

A public directory built on a map. Someone puts in what they need, and what is available for them appears on the map and in the list: what the service is, what it costs, and the exact first step to get started. The same path serves the person seeking help and the person helping them (family, friends, educators, frontline staff).

Every listing answers three questions:

- What is offered, and who it is for
- What it costs
- How to start, and who to contact

The map is not a feature beside the app. It is the surface the app lives on: it is under every browsing moment, pins carry the listings, and opening a service happens as an animated split of the same window, the map on one side and the details on the other.

## Surfaces

| Route | Surface | Role |
|---|---|---|
| `/` | The map | Fullscreen. Landing state: the promise, a large search, and categories over the map. Browsing state: the map with the results rail. |
| `/entry/:slug` | Entry view | One service, opened as an animated split over the map. The first step leads. |
| `/directory` | Redirect | Redirects to `/`. The map is the directory; one canonical address for the browse experience. |
| `/admin` | Admin | Entry management, behind a login. Present when the app is served with its server. |
| `*` | Not found | Plain message and a link back to the map. |

The browse state (query, categories, filters, sort, town, map area) lives in the URL, so a view can be shared and the back button works.

## The map

The map fills the viewport and stays under the whole browsing experience, edge to edge. It paints immediately, pins included, before any interaction: the app opens on a live view of the region, not on an empty state.

- **Engine:** MapLibre GL JS (open source, no token required; the one added runtime dependency). **Tiles by default:** a vendored raster tile set committed with the app (z6–z10 across the region with a panning margin, plus z11 windows around the service towns), recolored at build time to the app's warm paper-and-teal palette with a subtle hillshade, so the map renders crisp with zero external requests in any setting, online or offline. Tile URLs carry a version; when the tile fetcher rewrites the set, the version bump makes browsers fetch the new tiles. Swap paths: live key-free tiles, a vendored vector-tile archive, or Mapbox GL with a token (open question 1).
- **Coverage and movement:** the region frames on load; the map is never locked, so panning and zooming work in every state, from the landing to an open entry. Zoom range from just above the region frame to just past town detail (max zoom 10.6). Town names render as quiet pill labels; the major lakes in italic muted type (carried from the earlier map).
- **Pins:** one per entry, at the entry's coordinates. Round, solid, deep teal at rest, larger and higher contrast than the earlier pass, so they read as points before anything is clicked. Same-town pins spread on a small deterministic fan so they never stack. Pins settle in with a short staggered entrance on first load (reduced motion: instant), and that settling is the only springy moment in the app.
- **Pin states:** rest; hover/focus (scale up, preview opens); selected (ring, in the entry view); category-colored (when a category is active, matching pins take that category's hue); ghosted (filtered out, pins fade to a faint trace so the map keeps its geography while the result reads clearly).
- **Hover preview:** hovering or focusing a pin opens a small preview card near the pin: the program name with a status bubble beside it, the organization and town, and the short first step with its raising-hands mark. Tooltips carry the full step sentence and the status words. Hover has a short intent delay (~80 ms) so the card doesn't flicker while the pointer travels. Clicking the pin opens the entry view.
- **Controls:** zoom controls (quiet), "Search this area" (carried from the earlier map: a small pill appears once the view drifts from the framed region while browsing, and refilters results to the viewport), and a small "Manage services" link that leads to `/admin`. The required map credit is not a floating corner control; it renders as fine print in the intro block.

## Landing: the map with an intro

On first arrival, over the live map:

1. The heading, stating the promise.
2. A large search field, the primary action, sized as intro text, not chrome.
3. A category row: **"I want help with:"** with the seven categories as counted chips (counts come from the current data), each carrying its category color. An "All services" text link sits at the end of the row.
4. A fine-print line carrying the map credit.

The intro block is generous (up to ~720 px wide, upper third of the view) and reads as part of the map, not as a page section. Behind it, the whole region is already visible with every pin placed.

The intro recedes on the first real interaction, whichever comes first: typing in the search, choosing a category, dragging or zooming the map, clicking a pin, or choosing "All services". It fades and lifts away; the browsing state takes over. It does not come back in the same visit (reload restores it). The Services wordmark returns to the start from anywhere: it clears the search and filters, closes an entry, re-frames the region, and brings the intro back.

## Browsing: the map and the results rail

- **Composition:** fullscreen map, with the results rail floating over it on the right (~400 px, full height, its own scroll). The rail is a floating layer (rounded, hairline border, soft shadow), so the window reads as map with a panel, never as a page with a map in it. The map keeps the whole left side.
- **Rail header:** result count; a compact search field (the intro's search, same query); the seven category chips again (counted, and a chip toggles its category on and off); a sort menu (with the "Closest to" town menu when closest first is chosen); a Filters control that opens the full six-group filter panel as a floating layer. Active filters stay visible as removable chips under the header.
- **Rows:** compact and comparable. Organization (small), program name (strong) with a status bubble beside it (color plus tooltip), a facts line (cost, ways to get help, referral, and distance when sorting), and the first-step mark: the raising-hands icon plus the short step. **No description sentences in the list view**; descriptions live on the entry view. Rows are hairline-separated inside the rail; the rail, not each row, carries the shadow.
- **Sync:** hovering a row highlights its pin; hovering a pin highlights its row. Clicking either opens the entry view. Rows are keyboard-reachable links and pins are focusable with visible focus states.
- **Sorts:** relevance (default), closest first (with the "Closest to" town menu; distances are straight-line estimates, labeled as such), cost (free first). Carried as built.
- **Empty state:** a plain "No services match" message with a clear-filters action (carried).

## Entry view: the split

Opening a service is a pseudo page: it has its own address (`/entry/:slug`) and behaves like a page (deep links, back button), but it renders as an animated state of the map surface, not a page swap. The window splits in two:

- **One side, the map:** the camera flies to the entry's pin and settles at town zoom (≈ 10), eased over about a second. The pin lands centered in the open map area (left of where the card will rest) and keeps a selection ring. A faint flat scrim over the map separates the panes (no blur, crisp edges). The map stays interactive while the entry is open: zoom and pan work.
- **Other side, the card:** the details card slides in from the right edge as a floating sub-window (rounded, shadowed, its own scroll, a quiet header with the close control). It carries:

  1. **First step.** The strongest block in the app: the raising-hands mark, the short step (a number or a few action words, five words at most), and the referral note beneath, on an accent-tinted panel with an accent edge. The full step sentence rides the block's tooltip; screen readers hear "Your first step".
  2. Title block: organization (small), program name (title), the status line in its color.
  3. Description.
  4. Details, as chips and quiet rows: cost, ways to get help, ages, designed with consideration for, I want help with (tags carry category color), where, availability, last verified.
  5. Contact.

Closing reverses the motion: the card slides out, the map eases back, and the previous browse state is restored. A direct link to an entry frames the region briefly, then performs the same split (about a second end to end); with reduced motion, everything lands instantly with no flight.

On small screens the split becomes stacked: the card comes up as a full-height sheet over the map, same content, same hero.

## The first step

The first step is the reason this app exists, so it is the loudest element on every surface it appears on, always in the same shape: the raising-hands mark plus a number or up to five action words. The full sentence stays available on hover and to screen readers.

- **Entry view:** the hero block above, the strongest accent treatment in the app.
- **Rail rows:** the mark plus the short step in full ink, distinct from the muted meta.
- **Pin preview:** the same mark and short step in the hover card.

Everything else on any screen supports this block.

## Color

One interactive accent (the deep desaturated teal carried from the current build) plus three brief color roles:

- **Categories.** The seven options of "I want help with" are the app's categories, the shorthand people actually arrive with. Each carries a quiet, desaturated hue (indigo, teal, green, plum, slate, rose, amber family, tuned to stay calm, not candy). The hues appear on the category chips, on pins when a category is active, and on the tags in entry cards.
- **Status (the brief content that changes decisions).** Carried from the earlier services work: *Accepting new clients* (soft green), *Call to check* (soft amber), *Waitlist* (neutral). Shown as a small colored bubble beside the title on rail rows and pin previews, with the words in the tooltip, and as the status line in the entry title block. A bubble or a wash, never a saturated block.
- **Cost.** Free entries carry a quiet "Free" tag (carried from the earlier list); fee entries stay neutral.

All text pairs hold 4.5:1 or better; graphic elements hold 3:1. Where a hue can't carry text legibly, the pattern is a color dot plus ink text. Status and category color never carry meaning alone: the words stay available in the label or the tooltip, and the color reinforces them.

## Motion

Motion is part of this revision: transitions between states are animated, tastefully and never for their own sake. Nothing loops, nothing plays at rest, and every transition is short enough to never block a decision.

| Transition | What moves | Timing |
|---|---|---|
| Intro recedes → browsing | Intro fades and lifts; rail slides in from the right | 240–320 ms, ease-out |
| Pin / row hover | Preview card fades and rises ~6 px; pin scales up | 120–160 ms, short intent delay |
| Pin entrance on load | Pins settle in, staggered ~45 ms apart | 500 ms, single gentle overshoot |
| Open entry | Map flies to the pin (eased); card slides in from the right; scrim fades in | Flight ≤ 1.2 s; card 320 ms; scrim 240 ms |
| Close entry | Card slides out; scrim fades; map eases back | 240 ms |
| Return to start | Camera eases back to the region; the intro returns | 700 ms |
| Filter / sort / query change | Rows crossfade; pins update (matching stay, others ghost) | 200 ms |
| Search this area appears | Fades in when the view drifts | 160 ms |

Rules: motion always indicates a state change, never decoration; no blur anywhere (crisp over soft); all motion respects `prefers-reduced-motion` (removing flights and slides, keeping only instant state swaps).

## Layout and density

Desktop-first: the app fills the screen with the fullscreen map and floating rail and cards, no narrow centered column. The intro block, rail, and cards size generously (rail ~400 px, entry card 480–540 px) while prose inside them keeps a readable measure. Shadows exist only on floating layers (intro block, rail, entry card, preview cards, filter panel) and on hover lift; structure inside them is hairlines. On mobile the map keeps the top of the view and panels become full-width sheets.

Accessibility throughout: semantic structure and labeled fields, visible focus states, full keyboard operation (pins and rows are focusable, Esc closes the entry view, and focus moves into the card and back where it came from). Contrast gates: text 4.5:1 or better, graphics 3:1.

## Design-language references

The visual language is carried from the project's earlier services work (kept for reference, re-implemented in this stack, never copied):

- The map's pin and hover behavior, town labels, and "Search this area", from the earlier map iteration.
- Counted category chips, the status treatment on rows, cost tags, and the first-step block, from the earlier list and detail pages.
- The single-source token sheet (washes, radii, one overlay shadow, a 4 px spacing grid), the token discipline this build extends with category hues and the motion set.

## Entry data shape

One entry is one program offered by one organization. Every displayed fact reads from a field. Nothing is written into page markup, so the admin editor (below) can change any field without touching display code.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | URL id, kebab-case. Built from the program name in the editor; editable on creation. |
| `org` | string | Organization name. |
| `program` | string | Program or service name. |
| `description` | string | One or two plain sentences. Entry view only, never shown in list views. |
| `cost` | `free` or `not-free` | Client vocabulary, binary. |
| `nature` | list | `in-person`, `group-programming`, `individual-programming`, `remote`, `phone`, `video-call-individual`, `video-call-group`, `mhealth-app`, `text-based`. One or more. |
| `referral` | `self` or `required` | Self-referral: yes or no. |
| `considerations` | list | `indigenous`, `women`, `lgbtq-plus`. Zero or more. |
| `ages` | list | `under-18`, `18-65`, `65-plus`. One or more. |
| `concerns` | list | `depression`, `anxiety`, `stress`, `trauma`, `sleep`, `relationships`, `substance-use`. One or more. These are the categories. |
| `contact` | string | One line, made from two parts the editor asks for: a short channel word ("Phone", "Text", "Email") and the number or address, stored joined. |
| `region` | string | Real place name (town). |
| `lat`, `lng` | number | The entry's point on the map, near the town centre with a small spread so pins don't stack. |
| `firstStep` | string | One sentence. The precise first action, including the point of contact. Required on every entry. |
| `firstStepShort` | string | The same step in a number or up to five action words ("Call 807-555-0121"). This is the form the app shows, everywhere, with the raising-hands mark. |
| `availability` | string | Optional one-line note ("Accepting new clients", "Drop-in, no appointment"). Pairs with the status badge; the editor asks for it once. |
| `status` | `accepting` · `call-first` · `waitlist` | Machine form of the availability state, drives the status color. Optional; absent means no badge. |
| `lastVerified` | date | When the listing was last checked. Shown to readers. |

Editable-data flow:

- The sample dataset ships with the app and is the default when the site is served statically, so the app stays a working artifact with no server.
- When the app runs with its server, entries load from the server's store instead, and the admin edits that store. The public site reads the result; nothing else changes between the two modes.

## Filters

The client's terms stay as the data vocabulary. On-screen labels (carried, as built):

| Group | On-screen header | Options |
|---|---|---|
| Cost | Cost | Free · Has a fee |
| Nature of resource | Ways to get help | In person · Group program · One-on-one · Remote · By phone · Video call (one-on-one) · Video call (group) · App · Text-based |
| Self-referral | Do I need a referral? | No, I can reach out directly · Yes, a referral is needed |
| Special consideration | Designed with consideration for | Indigenous people · Women · LGBTQ+ |
| Age range | Age range | Under 18 · 18 to 65 · 65 and over |
| I want help with | I want help with | Depression · Anxiety · Stress · Trauma · Sleep · Relationships · Substance use |

Rules (carried):

- OR within a group, AND across groups. Leave a group untouched to ignore it.
- Category chips appear in both places: on the landing as counted entry points, and on the browsing rail as toggles into the same filter state.
- Non-matching pins ghost rather than disappear, so the map keeps its shape while a filter is on.

## Sorting

- **Relevance** (default). Entries matched in the program or organization name rank above entries matched in description or concerns. Ties break alphabetically. With no query, alphabetical by program.
- **Closest first.** Straight-line distance from the reader's town, estimated from town centres and labeled "estimated". Choosing this sort opens the "Closest to" town menu.
- **Cost (free first).** Free entries first, then fee-based entries. Ties break alphabetically.

## Search

Plain words, matched case-insensitively across organization, program, description, concerns, town, and the display facts (cost, ways to get help, ages), so queries like "free" and "phone" work. Every word in the query must appear somewhere in the entry. Empty results show the plain empty state. "Search this area" narrows the same result set to the current viewport and composes with the other filters.

## Admin and backend

Entry management is a small staff surface, locked behind a login. It is deliberately basic: one password, one editor, no accounts per person.

**Server.** A zero-dependency Node server in `server/` (plain `node:http`), started with an npm script. It serves:

- the built app (static),
- a small JSON API: public read (`GET` entries) and admin routes for login and entry create/update/delete (auth-gated),
- nothing else. No database server: entries live in a JSON file with write-through storage (written atomically on every change), seeded from the sample dataset on first run.

**Auth.** A single admin password from an environment variable; never stored in the repo (`.env`-style files stay ignored, and the README documents the variable names only). Signing in sets a signed, httpOnly session cookie (HMAC-signed, SameSite, expires ~12 h); signing out clears it; failed attempts are slowed. Without the password set, the editor stays off and the public site works normally.

**Admin UI.** At `/admin` in the app: a login screen, then an entries table with a create/edit form covering every field in the shape above. Location has three ways in: a town menu, latitude and longitude fields with a "use town centre" helper, and a small pin-placement map (click it to set the pin, and the coordinate fields follow). The address slug builds from the program name and stays editable on creation; existing entries keep their address. Contact is entered as two parts (a channel word and the number or address) and stored as one line. Availability is asked once: a status badge (or none) plus an optional note. A "Manage services" link in the map chrome leads here, and delete asks to confirm first.

**Modes.** The public site keeps working while the server runs, and the static build stays the artifact: hosted statically it serves the bundled sample dataset; hosted with the server it serves the live store. No new runtime dependencies beyond MapLibre (the map library) and no build-tool changes for the app itself.

## Sample content plan

- About 12 entries, all clearly sample: fictional organizations in real Northwestern Ontario places (Thunder Bay, Kenora, Dryden, Fort Frances, Sioux Lookout, Marathon, and others), each with coordinates.
- Every filter value appears at least once (checklist below, verified by a test). Every status value appears at least once, and every entry carries coordinates inside the region bounds (also verified by tests).
- Contact details in samples: reserved-for-fiction numbers only (807-555-01xx), no street addresses, no opening hours. No listing names a real organization, product, or certification.
- The UI carries no sample markings; the data itself stays plainly fictional. The set is documented as sample content here and in the app README.

Coverage checklist, each value needs at least one entry:

| Group | Values |
|---|---|
| Cost | free, not-free |
| Nature | in-person, group-programming, individual-programming, remote, phone, video-call-individual, video-call-group, mhealth-app, text-based |
| Referral | self, required |
| Considerations | indigenous, women, lgbtq-plus |
| Ages | under-18, 18-65, 65-plus |
| Concerns | depression, anxiety, stress, trauma, sleep, relationships, substance-use |
| Status | accepting, call-first, waitlist |

## Open questions, with defaults

Build follows these defaults unless they are corrected.

1. **Map stack.** Default: MapLibre GL JS with a vendored, key-free tile set (warm palette; z6–z10 across the region plus z11 town windows), so the map renders with no token and no external requests. Named swap paths: live key-free tiles, a vendored vector-tile archive (assessed as the offline path; a later spike), or Mapbox GL with a token if one arrives.
2. **Category vocabulary.** Default: the seven "I want help with" options are the categories that carry color. Alternative later: color pins by a stored primary category.
3. **Entry card side.** Default: card on the right, map flies so the pin centers in the open left area. Alternative: left, if the lab prefers it.
4. **Route consolidation.** Default: `/directory` redirects to `/`; the map is the single browse address. Alternative: keep a separate directory route.
5. **Intro lifetime.** Default: the intro recedes on first interaction; reload restores it, and the wordmark brings it back from anywhere. Alternative: a quiet control to bring it back in place.
6. **Non-matching pins.** Default: ghost to a faint trace. Alternative: hide entirely while filtered.
7. **Closest first without a location.** Default: the "Closest to" town menu (carried); browser location remains a later opt-in, never demanded.
8. **Admin scope.** Default: one password, create/edit/delete, every field, ~12 h sessions. Alternative: narrower scope or shorter sessions if the lab wants it.
9. **Search this area.** Default: keep, as a small map pill (carried). Drop if it reads as clutter once the map is the primary search.

## Out of scope

- Per-organization accounts and self-serve partner editing. The admin covers staff management; the data shape already anticipates richer partners later.
- Map drawing and area selection tools. "Search this area" covers viewport filtering.
- Real service data. The lab's content replaces the samples later.
- Localization and additional languages.

## Build plan

1. Map foundation: MapLibre wired into the app, vendored tiles committed, coordinates added to the sample data, pins, labels, spread, hover previews.
2. Design pass on tokens: category hues, status treatments, shadow elevations, motion timings, the filled desktop composition.
3. Landing intro and browsing: intro block with search and counted category chips, recede behavior, results rail with trimmed rows, filter panel, sorts, URL state, area search.
4. Entry view: the split (flight, card, hero first step), deep links, close/back, mobile sheet.
5. Server and admin: zero-dependency server, JSON store, auth, `/admin` editor, static fallback mode.
6. Sample data and gates: ~12 entries covering every filter and status value with coordinates; coverage tests extended; lint, tests, and build green; clean-console screenshots of every surface.

Checks stay green at every step: lint, tests, build.
