# Resources — design note

Draft, v0. First design pass for the Resources app (`resources/`).

**Find trusted resources and tools on digital mental health technology, in one searchable place.**

## The app

A searchable database indexing reliable sources of information about, and readily applicable tools for, digital mental health technologies. It serves educators, students, and other stakeholders who want to know what is out there and where to start with it.

Entry kinds: libraries, lesson plans, videos, podcasts, organizations & websites, articles (non-research), articles (research), tools & checklists — plus mHealth apps, drawn from three collections: our library, the MHCC mHealth directory, and MindApps.org.

## Pages

| Route | Page | Job |
|---|---|---|
| `/` | Landing | Say what this is in one line and open the door. |
| `/browse` | Browse & search | Search, filter, sort, scan results. |
| `/entry/:id` | Entry detail | Everything about one entry, in place. |
| `*` | Not found | Quiet, with a way back. |

Routes are defaults. Browse state lives in the URL (query, filters, sort) so the back button and shared links restore the exact view.

## Browse flow

1. **Arrive.** Browse opens with a warm question — "What would you like to find?" — then the search field, then results. All entries are visible on arrival, newest first. No gated empty state.
2. **Narrow.** Type to search — instant, multi-term, matching across title, description, tags, and source, with matches highlighted and the count updating live. Or open Filters and check what fits.
3. **Refine.** Active filters collect as removable chips, with a Clear all action. Sort reorders the list (see Sorting).
4. **Scan.** Single-column cards: format badge, title, two-line snippet, and a meta row (source, age, date).
5. **Open.** A card opens its entry: format badge, title, source, full description, meta (who it's for, published, added), topic tags, and an Open resource action. A quiet back link returns to the list with search and filters intact.

Empty state, honest:

> No matches yet. Nothing fits all of those together — try removing a filter, or search for something else. [Clear all filters]

## Filters

Three groups from the client notes. Within a group, selections combine (OR). Across groups, they narrow (AND). Each option shows a live count, and the whole set sits behind one quiet "Filters (n)" control in the results row (a sheet on narrow screens).

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

## Sorting

| Sort | Rule | Default when |
|---|---|---|
| Newest first | `published_date` descending; entries without one fall back to `added_date`; undated last. | Browsing (no query). |
| Best match | Relevance to the query — title ×3, tags ×2, description ×1, source ×1; ties break by recency. Disabled while the field is empty. | Searching (query present). |

The person's own choice sticks until they change it or clear the query.

## Entry data

Entries are editable data, not component code: one file (`src/data/entries.json`), read in one place, so content can be replaced later without touching components. Field shape:

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable slug; used in `/entry/:id` |
| `title` | string | |
| `format` | enum | one of the eight kinds above, or `app` |
| `collection` | enum, nullable | apps only: `our-library`, `mhcc-directory`, `mindapps` |
| `source` | string | who made or published it |
| `url` | string | sample entries carry no live links (see below) |
| `description` | string | one to three plain sentences: what it is, why it may help |
| `age_groups` | array | subset of the four age keys |
| `tags` | array | short topic words (anxiety, sleep, screen time, privacy, …) |
| `published_date` | date, nullable | drives Newest first |
| `added_date` | date | fallback for sorting |

## Sample content

About 12 entries, with every filter value covered at least once. Sources are fictional or neutral (no invented details for real organizations); real place names are fine. Marked as sample everywhere it could be mistaken for real: a small "Sample content" marker in the header, and a plain note instead of any dead link on entry details.

Coverage: each of the eight kinds at least once; each app collection at least once; each age value at least once; dates spread so recency sorting reads; a handful of topic tags.

## Design direction

- Professional, calm, content-first. Quiet chrome, one restrained accent, flat surfaces with hairlines over shadows, and a real type scale: page question ~28–40px, section heads ~15px, body 16–17px, meta 13px.
- Accessible by construction: semantic HTML (one h1 per page, real landmarks, labeled controls), visible focus states, AA contrast, `aria-live` on the result count.
- No gimmicks and no decorative motion; state feedback only; `prefers-reduced-motion` respected.
- System font stack by default: fast, native, nothing to license. A client-approved face can land later.

## Open questions

Each with a stated default. The build proceeds on defaults unless corrected.

1. **"Libraries" meaning** — default: curated collections or archives of materials, one kind among the eight.
2. **The app trio** — default: three checkboxes that filter app entries by collection. Alternative: simple links out to the two external directories. (Either way the data model above holds.)
3. **Age values** — default: All ages, Under 18, 18–65, 65+ (consistent with the services directory). Finer youth splits possible.
4. **Age inclusivity** — default: inclusive (an age choice also shows All ages entries). Alternative: strict matching.
5. **Landing wording** — default: "Resources & tools", one line of what this is, one Browse resources action. Final wording is the client's content.
6. **Type face** — default: system stack. A client-approved face can replace it later.

## The design pass will land

Landing, browse, and entry detail, with the sample data above and a first stylesheet. Verified with `npm run lint`, `npm test`, `npm run build`, and console-clean captures of each surface.
