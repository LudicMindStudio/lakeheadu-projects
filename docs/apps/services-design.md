# Services — design

Design note for the services app: a searchable directory of mental health services in Northwestern Ontario. October 2026.

Filter vocabulary and sort criteria follow the project notes in `docs/source/website-format-draft.md`.

**Promise**

> Find services across Northwestern Ontario, and the first step to get started.

## What this is

A public directory. Someone puts in what they need, and what is available for them appears: what the service is, what it costs, and the exact first step to get started. The same path serves the person seeking help and the person helping them (family, friends, educators, frontline staff).

Every listing answers three questions:

- What is offered, and who it is for
- What it costs
- How to start, and who to contact

## Pages

| Route | Page | Role |
|---|---|---|
| `/` | Landing | The promise, one primary action into the directory, and a short note on what you'll find there. |
| `/directory` | Directory | Search, filters, sorting, results. The working surface. |
| `/entry/:slug` | Entry detail | One service in full. The first step leads. |
| `*` | Not found | Plain message and a link back to the directory. |

Route names are defaults, kept from the current scaffold. "Entry" means one service listing.

The directory keeps its state (query, filters, sort, town) in the URL, so a view can be shared and the back button works.

Proposed landing copy: the heading states the promise; the lede reads "Browse services across the region. See what each one offers, what it costs, and how to get started." Primary action: "Browse services".

### Entry page, top to bottom

1. Back link to the directory.
2. Organization (small), program name (title).
3. **First step**: the strongest block on the page. A short label, the action sentence, and the referral note.
4. Description.
5. Details: cost, ways to get help, ages, designed with consideration for, I want help with, where, availability, last verified.
6. Contact.
7. Sample tag.

## The find-help flow

1. **Arrive.** The landing says what this is and what to do. One primary action leads into the directory.
2. **Search or filter.** A search box takes plain words ("counselling for teens in Kenora", "free"). Filters narrow by the six groups below.
3. **Narrow.** Options combine with OR inside a group ("in person" or "by phone") and AND across groups ("in person" and "free" and "under 18"). Active filters stay visible as removable chips.
4. **Compare.** Each result row carries the comparable facts: organization, program, one-line description, cost, ways to get help, referral, town, and a one-line preview of the first step.
5. **Open.** The entry page leads with the first step and carries the full listing.
6. **Act.** The reader follows the first step: call, book, drop in, or ask a professional for a referral.

## Entry data shape

One entry is one program offered by one organization. Every displayed fact reads from a field. Nothing is written into the page markup, so a partner editing flow can edit any field later without touching the display code.

| Field | Type | Notes |
|---|---|---|
| `slug` | string | URL id, kebab-case. |
| `org` | string | Organization name. |
| `program` | string | Program or service name. |
| `description` | string | One or two plain sentences. |
| `cost` | `free` or `not-free` | Client vocabulary, binary. |
| `nature` | list | `in-person`, `group-programming`, `individual-programming`, `remote`, `phone`, `video-call-individual`, `video-call-group`, `mhealth-app`, `text-based`. One or more. |
| `referral` | `self` or `required` | Self-referral: yes or no. |
| `considerations` | list | `indigenous`, `women`, `lgbtq-plus`. Zero or more. |
| `ages` | list | `under-18`, `18-65`, `65-plus`. One or more. |
| `concerns` | list | `depression`, `anxiety`, `stress`, `trauma`, `sleep`, `relationships`, `substance-use`. One or more. |
| `contact` | string | Point of contact: channel plus identifier. |
| `region` | string | Real place name (town). |
| `firstStep` | string | One sentence. The precise first action, including the point of contact. Required on every entry. |
| `availability` | string | Short plain sentence, for example "Accepting new clients" or "Drop-in, no appointment". |
| `lastVerified` | date | When the listing was last checked. Shown to readers. |

For the first build, entries ship as a plain data module in the app, shaped exactly like the table above.

## Filters

The client's terms stay as the data vocabulary. Proposed on-screen labels:

| Group | On-screen header | Options |
|---|---|---|
| Cost | Cost | Free · Has a fee |
| Nature of resource | Ways to get help | In person · Group program · One-on-one · Remote · By phone · Video call (one-on-one) · Video call (group) · App · Text-based |
| Self-referral | Do I need a referral? | No, I can reach out directly · Yes, a referral is needed |
| Special consideration | Designed with consideration for | Indigenous people · Women · LGBTQ+ |
| Age range | Age range | Under 18 · 18 to 65 · 65 and over |
| I want help with | I want help with | Depression · Anxiety · Stress · Trauma · Sleep · Relationships · Substance use |

Rules:

- OR within a group, AND across groups. Leave a group untouched to ignore it.
- "I want help with" keeps the client's own words. They already read user-first.
- Note: "Remote" stays its own option beside phone, video, text, and app, matching the client's list. If the lab treats "remote" as an umbrella term, the content pass can fold it in. Default: keep all nine options.

## Sorting

- **Relevance** (default). Entries matched in the program or organization name rank above entries matched in description or concerns. Ties break alphabetically. With no query, alphabetical by program.
- **Closest first.** Straight-line distance from the reader's town, estimated from town centres. The distance is labeled "estimated". Choosing this sort opens a "Closest to" town menu.
- **Cost (free first).** Free entries first, then fee-based entries. Ties break alphabetically.

## Search

Plain words, matched case-insensitively across organization, program, description, concerns, and town. Every word in the query must appear somewhere in the entry for it to match. Empty results show a plain "No services match" message with a clear-filters action.

## Design direction

- Professional, calm, content-first. The directory is the product; the chrome stays quiet.
- Flat surfaces and hairline dividers instead of shadows. One restrained accent, a deep desaturated teal, reserved for interactive elements and the first-step block. Ink on near-white.
- Real type scale: 13 to 14 for meta text, 16 for body, 20 to 22 for sections, 28 to 34 for page titles. System font stack for now; a shared face can layer in with the house style pass.
- Results render as hairline-separated rows, one service per row, generous spacing.
- Accessibility: semantic HTML, labeled form fields, visible focus states, text contrast at 4.5:1 or better, full keyboard operation, minimal motion.
- The first-step block is the loudest element on any screen. Everything else supports it.

## Sample content plan

- About 12 entries, all clearly sample: fictional organizations in real Northwestern Ontario places (Thunder Bay, Kenora, Dryden, Fort Frances, Sioux Lookout, Marathon, and others).
- Every filter value appears at least once (checklist below, verified by a test).
- Contact details in samples: reserved-for-fiction numbers only (807-555-01xx), no street addresses, no opening hours. Real organizations never appear with invented details.
- Visible sample tag on every surface: "Sample listings, not real services yet."
- No opening-hours field exists. "Availability" carries that weight, so no fabricated hours are ever needed.

Coverage checklist, each value needs at least one entry:

| Group | Values |
|---|---|
| Cost | free, not-free |
| Nature | in-person, group-programming, individual-programming, remote, phone, video-call-individual, video-call-group, mhealth-app, text-based |
| Referral | self, required |
| Considerations | indigenous, women, lgbtq-plus |
| Ages | under-18, 18-65, 65-plus |
| Concerns | depression, anxiety, stress, trauma, sleep, relationships, substance-use |

## Open questions, with defaults

Build follows these defaults unless they are corrected.

1. **Cost sorting over a binary field.** The notes say "least → most", but cost is free or not free. Default: free first. A later content pass can add cost levels (free, low cost, full fee) while the filter stays binary.
2. **Closest-first needs a starting point.** Default: a "Closest to" town menu beside the sort control; distances are straight-line between town centres, labeled "estimated". Alternative: hide location sorting until a map exists.
3. **Sample contact convention.** Default: fictional organizations may show 807-555-01xx numbers; otherwise contact is described by channel ("intake line", "online form"). Alternative: no digits anywhere.
4. **Filter wording.** Default: labels as proposed here; final wording belongs to the lab. The data vocabulary stays as in the notes.
5. **URL state.** Default: query, filters, sort, and town live in URL parameters. Alternative: in-memory only.
6. **Partner logins and map search.** Later phases. Default: the data shape already carries everything a partner would edit, including availability and last verified. A map reads the same `region` field and is additive.

## Out of scope

- Partner or provider logins, and any editing interface. The data shape anticipates them.
- Map-based search. Location sorting covers distance for now.
- Real service data. The lab's content replaces the samples later.
- Localization and additional languages.

## Build plan

1. Data module with the sample entries, plus the coverage checklist as a test.
2. Directory logic as pure functions: search, filter, sort. Unit tested.
3. Directory page: question, search, quiet control row, results; filter panel with chips; sort control; town menu.
4. Entry page: first-step block first, details below.
5. Landing and not-found pages; styles and tokens; accessibility pass.
6. Checks stay green: lint, tests, build.
