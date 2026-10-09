# Digital Mental Health Technology Decision Framework — app design (v2)

`framework/` · lakeheadu-projects · Design note · October 9, 2026

Sources: client notes (`docs/source/website-format-draft.md`, first section),
repo decisions (`docs/decisions.md`), and the earlier interactive prototype of
this tool — the wheel — kept as the feel reference for this pass.

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
loops, nothing moves without being asked. Motion is allowed now — it is used
deliberately, in short beats, to make moving between parts feel like moving.

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

One component, three sizes, present on every page:

- **The hub (landing, hero):** a large wheel, centered, with the three part
  names around it and a legend below. Hovering a wedge lifts it slightly and
  dims its neighbors; clicking a wedge opens that part. A quiet line under
  the wheel: "Click a part to start — no wrong answers."
- **The rail (part pages, wide screens):** a smaller wheel, sticky in a left
  rail, with the subject line and a plain list of the three parts beneath it
  (name + count). The current part's wedge sits slightly out from the wheel
  and carries a deeper edge; the others stay clean and clickable.
- **The bar (part pages, narrow screens):** the wheel unrolled — three
  segments in a row, each with its part color and count; the current segment
  is tinted. Still links; still the same three targets.

**Progress, never a score.** Each wedge carries a hairline arc along its
outer edge that fills as questions are answered — a visible "some of this is
done" for each part. The same fact appears as quiet text in the legend and
the rail list ("4 of 6 answered"; "Complete" when a part is finished).
Nothing is graded, and nothing is ever locked.

**Behavior notes.**

- The wheel is the navigation: each wedge is a real link to its part,
  labelled for assistive tech ("Quality of technology — part 2 of 3, 4 of 6
  answered"), with `aria-current="page"` on the current part. Keyboard: tab
  to a wedge, Enter opens it; focus draws a ring on the wedge.
- Answered counts follow the questions actually visible: when a
  technology-type answer hides a gated question, counts adjust with it.
- On the assessment page the wheel appears once more as the hero, showing
  the finished state of all three parts — the evaluation's own map.

## The walkthrough

1. **The hub (landing).** The promise line, then the wheel. Under it: "What
   are you evaluating?" — one optional line to name the technology
   ("an app, a chatbot, a website — name it if you like") and the note that
   it stays on this device. Then one primary button. On a fresh visit:
   **Begin** (opens Part 1). On a return visit: **Continue** (goes to the
   first unfinished part, or straight to the assessment) plus a quiet
   **Start over**. Below, the legend of the three parts and one honesty
   line: "No account needed — your answers stay in your browser."

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
| First load (landing) | The wheel settles in once (a small rise and fade); never repeats | ~600ms, one-shot |

**Budget:** each transition finishes in under half a second; at most one
"cinematic" beat (a part change) per interaction; no parallax, no scroll
effects, no idle motion. With `prefers-reduced-motion`, every transition
collapses to an instant state change (colors still change; nothing moves).

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
- **Chrome.** The quiet top bar stays, plus two small things: on part pages
  a subject chip ("Assessing: [name]", linking back to the hub) when a name
  exists, and the "← All parts" link above the part heading. The sample
  footer line stays exactly as it is.

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
   Default: yes — one optional line on the hub, stored on the device, shown
   as a quiet chip and in the assessment title. If dropped, only the field,
   chip, and title change.
2. **The wheel as navigation.** Clickable parts everywhere it appears?
   Default: yes — wheel on wide screens, a three-segment bar on narrow ones;
   parts can be opened in any order. The alternative is a wheel that only
   shows state.
3. **Part colors.** The three-hue system carried from the earlier prototype
   (quiet blue / soft green / warm amber)?
   Default: yes, tuned for contrast. Alternative if it reads as too much on
   review: monochrome surfaces with a single accent.
4. **Motion budget.** The set in §Motion (~160–420ms beats, one-shot load,
   reduced-motion path)?
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
- No looping or idle animation; no scroll effects; nothing that moves
  without being asked.
- Export, print, or sharing an evaluation.
- Accounts or any backend. The app is static and nothing leaves the browser.
- Links to the resources or services apps. The apps stay fully separate.
- Crisis chrome of any kind (per `docs/decisions.md`).
- Translation, analytics, or additional themes.
- No content-pipeline changes and no new dependencies.

## Build plan

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
