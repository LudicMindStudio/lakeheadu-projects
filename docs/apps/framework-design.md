# Digital Mental Health Technology Decision Framework — app design (v3)

`framework/` · lakeheadu-projects · Design note · October 9, 2026

Sources: client notes (`docs/source/website-format-draft.md`, first section),
repo decisions (`docs/decisions.md`), and the earlier interactive prototype of
this tool — the wheel — kept as the feel reference for this pass.

The v3 material is the presentation plan at the end of this document: how the
wheel assembles on arrival, moves into its dock, and carries navigation while
the questions run in the center. Where the addendum and the text before it
differ, the addendum wins.

This revision keeps everything the v1 pass got right and gives the app a
character of its own: one wheel, three colored parts, movement between them,
and guidance that grows where you answer. Richer and more playful than the
first pass, far short of a 3D scene. No backend; the content pipeline stays.

## What this is

The framework app helps educators, students, and other stakeholders evaluate
a digital mental health technology (an mHealth app, a chatbot, social media,
a forum or group chat) before trusting it to support someone's mental health.
The person doing the evaluation names what they are looking at, works through
questions grouped into three parts, and gets plain-language guidance at the
end of each part, gathered into a final assessment.

One-line promise:

> **A guided evaluation of a digital mental health technology — questions in
> plain language, and guidance at the end of every part.**

## The idea — midway between a page and a scene

The v1 pass was a clean questionnaire. The earlier prototype was a full 3D
scene. This pass lands the midway.

- The **wheel** returns as the app's one instrument — a real, two-dimensional
  diagram of the three parts, rendered as inline SVG. It shows where you are,
  how far along each part is, and it is how you move. No canvas, no camera,
  no scene.
- Each part is a **place with its own light**: the page backdrop takes the
  part's color as a soft wash, and moving between parts moves the light.
  Text always sits on white.
- **Guidance grows where you answer**, in place, the way the prototype's cells
  grew — but as a plain content reveal, not choreography.
- The evaluation is **about a real thing**: the person arrives with a
  technology in hand. They can name it, and it rides along through the
  walkthrough into the final assessment.

The character: confident, calm, a little warm. Nothing bounces, nothing
idles, nothing moves without being asked — and nothing is left to chance.
Motion is used deliberately: short beats between parts, and two set pieces —
the wheel's arrival, and its handoff into the dock when the evaluation
starts. The presentation plan at the end specifies both.

## Who arrives here

- An educator or school staff member, vetting a tool before recommending it
  or allowing it in a classroom.
- A student, checking something they found before using it.
- A parent, counsellor, or program lead, deciding what to allow or support.

All arrive with the same thing in hand: a specific technology, and a need for
a short process that ends in something actionable — not a reading list.

## Pages

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | The hub | What this is, the wheel, name what you're evaluating, start (or continue) |
| `/evaluate` | Part 1 — Type of technology | Pick the kind of technology |
| `/evaluate/quality` | Part 2 — Quality of technology | Credibility, evidence, safety, privacy, persuasion |
| `/evaluate/user-considerations` | Part 3 — User considerations | The person using it: risk, recourse, age, supervision, time |
| `/evaluate/guidance` | Your assessment | Everything the walkthrough surfaced, in one place |

Routes are unchanged from v1 and stay real: back, refresh, and direct links
behave, and any part can be opened first. The existing "page not found"
fallback stays. On screen the three domains are called **parts** (part of the
wheel); their own names carry the meaning.

## The wheel

One component, one element, present across the app — it lives in the app
shell and survives navigation, so its moves can span a route change without
a reset. Its presentation is the addendum at the end: it assembles
full-screen on arrival, holds the intro and the name in its center, then
docks to the bottom of the screen with the current part centered at the top
of its visible half. The three parts, the links, and the arcs below carry
through unchanged; the earlier rail and narrow-screen bar retire — the dock
scales to every width.

**Progress, never a score.** Each wedge carries a hairline arc along its
outer edge that fills as questions are answered — a visible "some of this is
done" for each part. The same fact appears as quiet text where parts are
named — the open part's eyebrow ("4 of 6 answered") and the other parts'
protrusion labels ("Complete" when a part is finished). Nothing is graded,
and nothing is ever locked.

**Behavior notes.**

- The wheel is the navigation: each wedge is a real link to its part,
  labelled for assistive tech ("Quality of technology — part 2 of 3, 4 of 6
  answered"), with `aria-current="page"` on the current part. Keyboard: tab
  to a wedge, Enter opens it; focus draws a ring on the wedge.
- Answered counts follow the questions actually visible: when a
  technology-type answer hides a gated question, counts adjust with it.
- On the assessment page the dock stays, all three arcs full — the
  evaluation's own map, one click from any part.

## The walkthrough

1. **Arrival.** The wheel assembles full-screen while a short intro line
   types itself out in its center, over the name field and one primary
   button. Enter works, and an empty name is fine. On a fresh visit:
   **Begin** (opens Part 1). On a return visit the wheel is already
   assembled: **Continue** (goes to the first unfinished part, or
   straight to the assessment) plus a quiet **Start over**. The full
   choreography is in the addendum.

2. **A part page.** A quiet "← All parts" link, then "Part 2 of 3 · Quality
   of technology" as the eyebrow. The part's intro in one or two sentences.
   Then its questions.

3. **Answering.** Each question is a prompt with a small answer set —
   mostly Yes / Not sure / No. When an answer carries a note (authored next
   to the option), choosing it reveals the note directly under the question,
   expanding in place. Choosing a different answer swaps the note. Every
   question is skippable; "Not sure" is a first-class answer everywhere.

4. **The wrap-up.** At the end of the part: its guidance panel — the base
   guidance plus a "Based on your answers" list of the notes the part
   produced, updating live as answers change. When the last question in the
   part is answered, the panel settles: a deeper edge and a touch of lift,
   and the wheel's arc closes for that part. A quiet moment, never a gate —
   the guidance is readable the whole time.

5. **Your assessment.** The finished map (the wheel, all parts showing their
   state) and then, per part: its guidance, and the findings — each waiting
   note shown with the question it came from, so the page reads as a record
   of the evaluation rather than a list of remarks. If a technology was
   named, the page is titled "Your assessment of [name]". One quiet control:
   Start over.

**How an answer leads to guidance** (the chain, unchanged):

1. An answer option may carry a short **note** (authored next to the option).
2. Choosing it shows the note under the question.
3. The part's **guidance panel** gathers that part's notes under its base
   guidance.
4. The **assessment** repeats the chain per part, with the question text for
   context.

No score, no verdict, no red/green meaning. Guidance is text authors write.
The app composes it.

**Persistence and returning.** Answers and the subject stay in the browser
(one local record). A refresh loses nothing; a return visit offers Continue.
Start over clears the record and resets the app. The walkthrough never
blocks: Next is always available, gated questions stay hidden until a
technology type is chosen, and switching type hides or shows gated questions
without discarding answers.

## Motion

Small, deliberate, and finished quickly. Nothing animates on a loop; nothing
moves that wasn't asked to move; no animation is ever load-bearing (state
never depends on an animation completing).

| Moment | What happens | Time / feel |
| --- | --- | --- |
| Wheel hover / focus | One wedge lifts (a few percent bigger, a few pixels out); its neighbors dip slightly | ~160ms, ease-out |
| "Begin" / opening a part | The backdrop color glides from the hub's blend to the part's wash while the content sheet settles in (fade + a small rise, blocks staggered a touch) | ~420ms together; one beat |
| Between parts | Same move, new light: backdrop color glides, sheet re-settles, the wheel's current wedge steps out | ~420ms |
| Choosing an answer | The note expands in place under the question; the option row tints | ~240ms |
| Wrap-up settles | When a part completes, its guidance panel lifts and deepens; the wheel arc closes | ~320ms, quiet |
| First load (landing) | The full arrival: slices fly in and lock, labels appear, the intro line types; a gentle spin settles out | ~2.3s one-shot — see the addendum |

**Budget:** everyday transitions finish in under half a second; the set
pieces are one-shot and bounded — the arrival runs about 2.3 seconds to
interactive, the handoff about 1.1, a part-to-part turn about 0.8. No
parallax, no scroll effects, no idle motion once the arrival settles. With
`prefers-reduced-motion`, every beat collapses to an instant state change
(colors still change; nothing moves).

## Design language — v2

The v1 base stays: near-white page, near-black ink, hairline rules, system
font stack, plain language. What's added is warmth and light.

- **The field.** Each part has a soft wash of its own color behind
  everything — strongest near the top of the page, dissolving into the page
  as you read down. The hub (landing) shows all three colors faintly blended
  — the wheel's own light. On part pages the wash is that part's color.
  Text always sits on white; the field is atmosphere, never a surface for
  reading.
- **The sheet.** Content rests on a white sheet with a low, soft shadow and
  gentle corners — one surface per page, the field showing around it. The
  v1 pass was deliberately flat; this pass lifts slightly ("a bit of pop"),
  and stays crisp about it: short shadows, no blur tricks, no glass.
- **The palette.** Three part colors, carried from the earlier prototype and
  tuned for readability on white. Part 1 is a quiet blue, Part 2 a soft
  green, Part 3 a warm amber. Each color exists as: a wash (page field), a
  mid tone (wheel fill, accents like the wedge arc and part eyebrow), and a
  deep tone (text-safe accents and the wedge's current edge). The deep
  tones are tuned to hold at least 4.5:1 on white and on the washes; the
  amber deep is darkened one step from the prototype's to get there.
  Ink stays the color of action and selection; the three hues are
  wayfinding — they tell you where you are, not what to press.

  | Token | Start value | Use |
  | --- | --- | --- |
  | `--part-1-soft` / `--part-1-deep` | `#93a5d8` / `#4a63b0` | Part 1 wash, arc, eyebrow |
  | `--part-2-soft` / `--part-2-deep` | `#82b09a` / `#3f7a5e` | Part 2 wash, arc, eyebrow |
  | `--part-3-soft` / `--part-3-deep` | `#d9b273` / `#94651a` | Part 3 wash, arc, eyebrow |
  | `--wash-strength` | ~8% at top, 0 by mid-page | The field's fade |
  | `--shadow-sheet` / `--shadow-lift` | low, short | Sheet at rest; wheel lift and settled panel |

- **Type and measure.** Keep the system stack and the 400/600 weights. One
  step up in scale: the landing headline grows, part headings get room, and
  the reading measure widens from 640px to about 860px on wide screens so
  the app fills the screen instead of hugging a column. Long prose still
  caps near 65 characters where it matters.
- **Chrome.** The quiet top bar stays, plus two things: on part pages the
  subject rides as a centered top banner (per the addendum; previously a
  small chip), and the "← All parts" link above the part heading. The
  sample footer line stays.

## Content and data shape — unchanged pipeline

Authors write markdown; one command turns it into JSON the app reads. This
pass changes nothing about that: same files under `framework/content/`
(`01-type-of-technology.md` … `03-user-considerations.md`, `meta.md`,
`GUIDE.md`), same markers (`#`, `intro:`, `##`, `types:`, `- `,
`### If answered:`, `## Guidance`), same zero-dependency
`scripts/build-content.mjs` → committed `src/data/content.json`, same
validation errors. The app reads only the JSON.

What's new is all app-side, no authoring impact:

- **Part colors** are app tokens mapped to parts by key, not content — the
  lab never picks colors.
- **Counts and completion** are derived from answers against the part's
  visible questions (nothing precomputed).
- **The subject** is user input, stored in the browser only. One local
  record now holds `{ subject, answers }` under a versioned key; records
  saved by the v1 build are read across once, so nobody loses answers.
- **The assessment's findings** use the question text that already ships in
  the JSON — no new fields.

`meta.sample` keeps driving the visible sample marking. The content
vocabulary (client terms, "I want help with"-style register) is untouched.

**The authoring story** stays exactly as v1 described it: staff edit only
the markdown files and run `npm run content` (`npm run build` runs it
first); `content/GUIDE.md` carries the markers, a copy-paste example, the
command, and what errors look like.

## Accessibility

- Semantic structure as v1: one h1 per page, header / main / footer
  landmarks, questions as fieldsets with the question text as legend,
  answers as native radio inputs, notes as plain text.
- The wheel is a nav: real links, named with part and progress, example:
  "Quality of technology — part 2 of 3, 4 of 6 answered"; `aria-current`
  marks the open part; visible focus ring on the wedge or segment. The
  narrow-screen bar carries the same links.
- Color is never the only signal: part names, counts, and state all appear
  as text; the current part is marked by position and label, not hue alone.
- Text contrast: body text ≥ 4.5:1 (the deep part tones are tuned for this),
  meaningful borders and focus rings ≥ 3:1. The build verifies every new
  pair and reports the numbers.
- Motion: everything above has a `prefers-reduced-motion` path that removes
  movement and keeps the state changes.
- Keyboard and screen reader pass in the capture set: tab through the wheel,
  open a part, answer, reach the assessment.

## Sample content plan

Unchanged from v1, plus one small note:

- Three parts, twelve questions in the sample (one picker, six in Quality of
  technology including the chatbot-gated one, five in User considerations).
- Every option is written; notes appear on a healthy share of options so the
  answer → note → panel → assessment chain is visible everywhere.
- The client notes' human-in-the-loop chatbot logic stays the gated-question
  proof case.
- No fabricated organizations or services; the only real reference is MHCC,
  carried from the notes as guidance text authors can rewrite.
- The subject examples in the placeholder text ("an app, a chatbot, a
  website") are sample chrome, like the footer line; nothing personal is
  ever suggested.

## Open questions — each with a current default

1. **Subject naming.** Name the technology you're evaluating?
   Default: yes — one optional field on the hub, stored on the device, shown
   as a top banner (v3) and in the assessment title. If dropped, only the
   field, banner, and title change.
2. **The wheel as navigation.** Clickable parts everywhere it appears?
   Default: yes — the wheel is the navigation at every width (v3: the
   docked wheel; see the addendum); parts can be opened in any order. The
   alternative is a wheel that only shows state.
3. **Part colors.** The three-hue system carried from the earlier prototype
   (quiet blue / soft green / warm amber)?
   Default: yes, tuned for contrast. Alternative if it reads as too much on
   review: monochrome surfaces with a single accent.
4. **Motion budget.** The set in §Motion plus the v3 set pieces (arrival,
   handoff, part turn — see the addendum)?
   Default: as designed. Character check: calm confidence, never bouncy.
5. **The completion settle.** When a part's last question is answered, the
   guidance panel settles and the arc closes?
   Default: yes — a moment, never a gate; guidance stays visible throughout.
6. **Counts under type gating.** Counts follow the visible questions (a
   gated question hidden by the chosen type doesn't count)?
   Default: yes.
7. **"Not sure" as a to-check list.** Highlight "Not sure" answers as items
   to revisit in the assessment ("things to check")?
   Default: no this pass — the notes already say what to do; revisit later
   if the lab wants a checklist feel.
8. **Start over scope.** Clears both answers and the subject name?
   Default: yes — a clean start; the name is one short line to retype.

## Out of scope for this pass

- No 3D, no canvas, no WebGL, no scene: no camera, no physics, no voronoi
  partitions, no springs, no fog, no dev-hook forest. The wheel is a
  diagram. (This line is the midway's guardrail.)
- No idle animation after the arrival settles; no scroll effects; nothing
  that moves without being asked (the arrival and the handoff are one-shot
  set pieces, specified in the addendum).
- Export, print, or sharing an evaluation.
- Accounts or any backend. The app is static and nothing leaves the browser.
- Links to the resources or services apps. The apps stay fully separate.
- Crisis chrome of any kind (per `docs/decisions.md`).
- Translation, analytics, or additional themes.
- No content-pipeline changes and no new dependencies.

## Build plan

*(v2, as built. The v3 build plan at the end of this document supersedes
this section.)*

Constraints: React + JavaScript with the existing dependencies only (no new
packages). Static build, no runtime network calls. System font stack.

1. **Foundation:** tokens (part colors, washes, shadows, motion timings,
   radii) and shell (field layer, sheet, header/chip, widths). Extend
   `src/styles/base.css` in labeled sections. Tests: none broken.
   [FIRST BUILD STEP]
2. **The wheel:** the SVG component (wedges as links, current state, arcs,
   legend counts) and the narrow-screen bar. Tests: link names, counts
   derive correctly, current marking, gated-count behavior.
3. **The hub:** landing rebuild — hero composition, subject line, Begin /
   Continue / Start over, legend. State: the versioned local record with
   v1 carry-over. Tests: resume logic, clearing, persistence.
4. **Part pages:** rail layout, field-color transition between parts, note
   expansion, wrap-up settle, subject chip. Tests: counts, settle state,
   transitions in reduced-motion mode.
5. **Assessment:** the finished map, per-part guidance, findings with
   question context, subject title. Tests: composition with and without a
   subject; empty state.
6. **Verification pass:** lint, tests, and build green; headless,
   console-clean captures of every surface (including mobile widths, the
   reduced-motion path, and a keyboard pass) into `internal/captures/`; a
   contrast receipt for every new text/background pair.

---

## The presentation plan (v3 addendum)

The guided tour stands; this plan is the presentation around it. The wheel
now assembles full-screen when the app opens, holds the intro line and the
name in its center, hands off into a dock at the bottom of the screen, and
stays there as the navigation while the questions run in the center.

Nothing else moves: routes, content pipeline, part colors, copy register,
and accessibility standards are untouched. No new dependencies; still no
canvas, no 3D.

### Coverage, point by point

| # | What was asked | Where it stands |
| --- | --- | --- |
| A | The wheel assembles full-screen on load; slices fly in from off screen and lock one by one; each gets its label and a soft glow; a slight spin runs through it; the wheel takes the screen height with a thin margin. | **New.** The part colors, arcs, and links carry over; the earlier single "settle" is replaced by the full arrival. |
| B | In the wheel's center, the intro text types itself in character by character — shorter and punchier — with the name line in the middle. | **New.** The intro copy and the subject line move from around the wheel into its center; the copy shortens. |
| C | On name submit or empty Enter: the center fades, the name becomes a top banner, and the wheel grows, stops spinning, and slides down until its center anchors to the bottom edge — only the top half shows. | **New.** The stored name and the resume logic carry; the chip is replaced by the banner. |
| D | The current part sits centered at the top of the visible half; the other parts are clickable at their small protrusions at the bottom edge (as in the earlier prototype); starting a part rotates the wheel so that part is on top. | **New.** Wedges-as-links and the accessible naming carry; the rail and the bar retire; dock, protrusions, and rotation are new. |
| E | The walkthrough continues in the center of the screen — questions, guidance, next section — per part, as it does now. | **Already true — built as the guided tour.** New: it runs in the center with the dock behind it, and the rail is gone. |
| F | Remove the explanation chrome ("Click a part to start — no wrong answers.", "Optional, and it stays on this device", similar lines); show, don't tell; icons and tooltips instead of text. | **New.** The copy trim — a full pass, below. |
| G | The name placeholder: three words at most, and it must fit the field. | **New.** The placeholder becomes "App, chatbot, site…"; the full wording moves to the accessible name. |

### One wheel element, four states

The wheel lives in the app shell, not inside any page, so it survives
navigation — its moves can span a route change without a reset or a flash.
Presentation states:

- **Arrival** — full-screen wheel, assembling; the center card holds the
  typed intro and the name line (`/`, fresh visit).
- **At rest** — assembled, centered, still; the card offers Begin or
  Continue (`/`; also where Start over returns).
- **Handoff** — the move between the two: grow, slide, stop, align.
- **Docked** — the bottom half-wheel; the walkthrough runs in the center
  (part pages and the assessment).

Flights, spin, and glow are a one-shot sequence inside the wheel component.
The handoff and the part-to-part turn are driven by the route context in
the shell.

### Geometry

```
arrival:  a centered wheel — diameter min(82vh, 90vw), capped near 1100px,
          the card in its middle
docked:   the wheel's center pinned to the bottom edge; only the top half
          shows — the current part spans ±60° at the top, and each other
          part keeps a 30° sliver at a bottom corner (the protrusions)
```

- **Arrival.** The wheel takes the screen height with a thin margin: it is
  centered between the header and the footer, about 2.5vh of margin each
  side. The hub disc is about 0.45 of the wheel's radius; the center card
  floats over it. Card width: `min(460px, 64% of the wheel)`; on narrow
  screens the card is sized to the viewport (88vw) so its line wraps
  cleanly.
- **Docked.** Radius `min(60vh, 48vw)`; the center point is pinned to the
  bottom edge of the screen and stays there while the content scrolls
  above it. Only the top half shows, by construction.
- **Clearance.** The dock is fixed; the content column keeps about 160px
  of bottom padding so nothing sits under the protrusion zone.

### Arrival, beat by beat

Values are starting points; the build tunes constants against captures.

| t | Beat | What happens | Time / easing |
| --- | --- | --- | --- |
| 0.00s | Ground | The part's light and a hairline track circle — the wheel's own outline — fade in: an empty wheel, waiting. | 250ms, ease-out |
| 0.15s | First slice | Slice 1 flies in from fully off screen along its own bisector (first from above, then from lower right, then lower left), fading in over the first half of the flight, decelerating into place. | 520ms, ease-out |
| +0.00s | Lock | The slice settles its last two percent — a crisp snap into the wheel. | 110ms |
| +0.12s | Label | The part's name fades in and rises 4px, seated on the slice. | 240ms, ease-out |
| +0.12s | Glow | A soft radial light in the slice's color blooms from the slice outward past the rim, then relaxes to nothing. | bloom 300ms, relax 650ms |
| 0.41s / 0.67s | Slices 2 and 3 | The same flight, lock, label, glow — one at a time, 260ms apart. | as above |
| throughout | The spin | The whole wheel drifts clockwise, easing from about 2.2°/s toward 0.8°/s; the total drift stays small (a few degrees). Landed slices ride the spin. | continuous, decelerating |
| ~1.45s | The line types | The intro line writes itself: one character at a time, each popping in — fading in as it rises 4px and scales in 6%. The full text is present from the start for screen readers; this is visual only. | per character 120ms, 27ms apart |
| ~1.95s | Card at rest | The name line, the button, and the honesty line fade in together; the spin eases out; the wheel goes still. | 280ms, ease-out |
| any | Skip | The first user input — key, click, or touch — jumps straight to the resting state. | instant |

About 2.3 seconds to interactive; one-shot; it never repeats mid-session.

### The center card (the intro line and the name)

A white card sits in the wheel's center — text on white, as everywhere.

- **The typed line** (the page's h1): default copy **"Is it safe and
  useful?"** — alternates: "Let's look, part by part." / "Weigh it before
  you trust it." Five or six words, one or two lines at the card's width;
  1.5–2rem, weight 600.
- **The name field:** placeholder only, three words — **"App, chatbot,
  site…"** — sized to fit the field at every width; the accessible name
  carries the full wording. One line, stored on the device as today.
- **The button:** **Begin** — a real form submit, so Enter in the field
  works; an empty name submits fine. On a return visit the card offers
  **Continue**, with a quiet **Start over** beside it.
- **The device note:** one small hairline icon beside the field carries
  "Your answers stay on this device" as a tooltip — on hover and on
  focus, tied by `aria-describedby`. No sentence.
- **Focus:** when the card settles, focus moves to the name field unless
  the person has already interacted. Nothing about the animation gates
  input.

### The handoff (submit into the dock)

| t | Beat | What happens | Time |
| --- | --- | --- | --- |
| 0.00s | The center bows out | The card fades — opacity and a 2% scale. | 240ms |
| 0.15s | The move | One continuous move, 900ms: the wheel grows (arrival → dock radius, about 1.4×), slides until its center lands on the bottom edge, the spin comes to a full stop, and the target part rotates up to the top. Gentle ease-in-out. | 900ms |
| ~0.40s | The route commits | Under the move, the target part's page takes over; the wheel is shell-level, so nothing resets or flashes. | — |
| 0.25s | The banner | The name fades in, centered at the top, rising 8px. An empty or whitespace name reads **"Your evaluation"**. Long names truncate with an ellipsis; the full name stays in the accessible text. | 320ms |
| 0.55s | The content settles | The part's sheet fades in and rises into place beneath the moving wheel. | 420ms |
| 1.05s | At rest | Docked; the walkthrough is live. | — |

### The dock (protrusions and the turn)

- **Anatomy.** The dome is the current part, ±60° around the top, filled
  with the part's soft tone, with the hairline progress arc along its rim
  (the arc sits on a thin light separation so its deep tone holds against
  both the fill and the page). The two other parts keep their 30° corner
  slivers; each carries a small pill at the bottom edge — name and count
  ("User considerations · 4 of 6"; "Complete" when the part is finished).
  Sliver plus pill is one link.
- **Hit targets.** The whole sliver and its pill click together; the
  target never drops below 48px, at any width. At narrow widths the
  slivers may extend past the viewport — the pills carry the interaction
  from their fixed bottom corners.
- **Hover and focus.** The sliver lifts 3px along its own bisector and its
  label brightens — 160ms, ease-out. Focus draws a ring around the sliver
  and pill. Same semantics as today: real links, named for assistive
  tech, `aria-current` on the open part.
- **The turn.** Activating a protrusion rotates the wheel 120° so that
  part's bisector lands at the top — clicking the right protrusion turns
  the wheel counterclockwise (that part rises up the right side), the
  left protrusion clockwise — 700ms gentle ease-in-out plus a 120ms
  settle. The pills fade out as the turn starts and the new pair fades in
  as it lands; the current part's arc becomes the visible arc; the
  content crossfades (out 180ms, in 420ms) and the route commits under
  the turn. Clicks are ignored while a turn runs. **Next part** in the
  flow runs the same turn; **See your assessment** just swaps the content
  — the dock already shows the finished map. **← All parts** returns to
  the hub: the wheel glides back to center on a quick 420ms reverse, the
  card offering Continue.
- **The assessment** keeps the dock: all three arcs full, any part one
  click away.

### The walkthrough in the center — what changes, what doesn't

- **Unchanged (already built):** the three parts as real routes; the
  question flow with notes that reveal under the question; the per-part
  guidance panel — base guidance plus "Based on your answers"; the
  wrap-up settle; Next; browser persistence and Start over; type gating
  and count behavior; the not-found page.
- **Changed:** the left rail and the narrow-screen bar retire — the dock
  is the navigation everywhere, scaled to the viewport. The content
  column centers over the dome, and the part's light gains a second
  voice: the quiet wash at the top stays, and the docked wheel adds the
  part's stronger light below. The eyebrow gains the quiet count
  ("Part 2 of 3 · 4 of 6 answered") since the rail's list is gone.
- **Narrow screens:** the dock takes `min(52vh, 62vw)`; the pills carry
  the navigation at full target size; the slivers stay as tint. The same
  links, the same behaviors.

### The copy trim — show, don't tell

A pass over every string in the app, landing together with the
presentation work. The rule: interface chrome never explains itself in
sentences. If a fact has to survive, an icon carries it and a tooltip
says it on hover or focus. If it only reassures, it goes.

What goes:

- The wheel hint ("Click a part to start — no wrong answers.") — the
  slices show they are clickable: they lift on hover, ring on focus, and
  the pointer changes. No line.
- The line under the name field ("Optional, and it stays on this
  device.") — replaced by one small icon beside the field, its tooltip
  reading "Your answers stay on this device."
- The landing honesty line ("No account needed — your answers stay in
  your browser.") — same fact, same icon; the sentence goes.
- Any line that explains what a control does or reassures the person
  ("no wrong answers"; "name it if you like"). The flow itself shows it.

What stays:

- Functional labels and navigation: buttons, "← All parts", the eyebrow
  ("Part 2 of 3"), counts, part names, question text, notes, guidance,
  "Based on your answers".
- The sample footer line — it is a marking, not an explanation.
- Authored content: part intros, questions, notes, guidance — the trim
  does not touch what the lab writes.

Mechanics: hairline icons drawn inline (no icon library), muted tone,
about 16px; tooltips appear on hover and keyboard focus, tied by
`aria-describedby`, never the only home for a fact. The name field's
placeholder is three words and is sized to fit the field at every width.

At the end of the build, one sweep across all surfaces for stragglers —
any sentence that explains the interface instead of being part of it.

### Motion summary — and the reduced-motion path

| Beat | Standard | Reduced motion |
| --- | --- | --- |
| Arrival: flights, locks, labels, glow | per the table above | assembled wheel and full text at once — a 150ms fade |
| The spin | eases out as the card settles | none |
| The typed line | character by character | the full line, no typing |
| The handoff | the 900ms move | the docked state, instantly |
| The part turn | 120° in 700ms + settle | instant reframe |
| Protrusion hover | 3px lift, 160ms | none |
| The earlier beats (note reveal, wrap-up settle, sheet settle) | as built | as built |

**The reduced-motion path, in full.** With `prefers-reduced-motion:
reduce`, nothing in the arrival moves — no flight, no lock, no glow, no
spin — and the typed line is simply present; the skip-on-input behavior
is moot because the resting state is immediate. Submitting produces an
instant state change: the wheel is docked, the banner and content are in
place, and every element still announces itself the same way. Part
changes reframe instantly. All state changes — color, position, current
marking — survive; only movement goes.

### Copy defaults

| Slot | Default |
| --- | --- |
| Typed line | "Is it safe and useful?" (alternates above) |
| Name placeholder | "App, chatbot, site…" — three words, sized to the field; full wording in the accessible name |
| Device note | icon + tooltip: "Your answers stay on this device" |
| Button | "Begin" — "Continue" on returns |
| Banner, empty name | "Your evaluation" |
| Protrusion pill | "[Part name] · 4 of 6" — "Complete" at full |

### Open questions — each with a default

1. **Replaying the arrival.** Default: the full arrival on a fresh visit
   (no saved answers) and after Start over; a return visit shows the
   assembled wheel. (Replay-every-visit is a one-flag flip.)
2. **The spin at rest.** Default: the spin eases out when the intro line
   finishes — the wheel is still while the person reads and types. (The
   alternative is a very slow drift, about 0.5°/s, while waiting.)
3. **Dock anchoring.** Default: pinned to the bottom of the screen —
   always reachable while the content scrolls. (A page-end anchor would
   scroll the navigation away; not recommended.)
4. **The banner.** Default: the name, centered, on every evaluate surface
   and the assessment; empty falls back to "Your evaluation".
5. **Pre-name part clicks.** Default: once the assembly finishes, a wedge
   click still opens that part directly — the handoff plays, the banner
   falls back.
6. **Protrusion labels carry counts.** Default: yes ("4 of 6";
   "Complete").
7. **Narrow screens.** Default: the scaled dock; the bar stays retired.
   (If it reads cramped around 390px, the bar returns for ≤640px.)
8. **The assessment keeps the dock.** Default: yes, all three arcs full.
9. **Sizing and fill tuning.** Default: arrival capped near 1100px; dock
   radius `min(60vh, 48vw)`; the dome fill is the part's soft tone —
   lightened toward the wash if it ever reads heavy behind content.
10. **Tooltips.** Default: one lightweight in-app tooltip (hover and
    focus, `aria-describedby`) for the device note and any later icon
    notes; no tooltip library. Native `title` only as a fallback.

### Out of scope

- No canvas, WebGL, or 3D — the wheel stays inline SVG with CSS and JS
  transforms (the midway guardrail holds).
- No new dependencies, no backend, no content-pipeline changes; the
  routes and their direct-link behavior are untouched.
- No audio; no second animation style — one character, applied
  consistently.

### Build plan (v3)

1. **The wheel surface + state machine.** Move the wheel into the app
   shell (it survives navigation); add geometry tokens (arrival radius,
   dock radius, anchoring); make the sequence an explicit state machine —
   arrival → at rest → handoff → docked — with skip and reduced-motion as
   first-class inputs.
2. **The arrival.** Flights, locks, labels, glow, spin; skip on first
   input; reduced-motion shows the assembled state at once.
3. **The center card.** The typed line, the name field (three-word
   placeholder, the icon note), Begin/Continue, and the focus rules.
4. **The handoff and the banner.** The 900ms move; the route commit
   beneath it; the banner fade; the empty-name fallback.
5. **The dock, protrusions, and the turn.** Dome geometry and fills;
   arcs; pills and hover; the 120° turn; the content crossfade; Next and
   back integration; the rail and bar retired; the narrow-screen dock.
6. **The copy trim.** The pass across every surface — the flagged lines
   out, an icon and tooltip where a fact survives, the placeholder sized
   — plus a sweep for stragglers at the end.
7. **Verification.** Lint, tests, and build green — with tests for the
   state machine (arrival completes and skips; the handoff lands docked;
   the turn aligns and reframes; reduced-motion equivalents; answer and
   subject carry-over kept). Headless, console-clean captures of the new
   surfaces: mid-flight, assembled at rest, the handoff mid-move, a
   docked part, a turned part, the assessment, a narrow screen, and the
   reduced-motion set. A contrast receipt for the new pairs: the banner,
   the pills on the part tones, the arc against the fill.
