# Digital Mental Health Technology Decision Framework — app design

`framework/` · lakeheadu-projects · Draft for review · October 9, 2026

Sources: client notes (`docs/source/website-format-draft.md`, first section)
and repo decisions (`docs/decisions.md`).

## What this is

The framework app helps educators, students, and other stakeholders evaluate
a digital mental health technology (an mHealth app, a chatbot, social media,
a forum or group chat) before trusting it to support someone's mental health.
The person doing the evaluation picks what they are looking at, works through
questions grouped into three domains, and gets plain-language guidance at the
end of each domain, gathered into a final summary.

One-line promise:

> **A guided evaluation of a digital mental health technology — questions in
> plain language, and guidance at the end of every domain.**

## Who arrives here

- An educator or school staff member, vetting a tool before recommending it
  or allowing it in a classroom.
- A student, checking something they found before using it.
- A parent, counsellor, or program lead, deciding what to allow or support.

All arrive with the same need: a short process that ends in something
actionable, not a reading list.

## Pages

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | Landing | What this is, how the walkthrough works, one start button |
| `/evaluate` | Type of technology | Pick the kind of technology |
| `/evaluate/quality` | Quality of technology | Credibility, evidence, safety, privacy, persuasion |
| `/evaluate/user-considerations` | User considerations | The person using it: risk, recourse, age, supervision, time |
| `/evaluate/guidance` | Your guidance | Everything the walkthrough surfaced, in one place |

Steps are real routes, so the back button, refresh, and direct links behave.
The existing "page not found" fallback stays.

## The evaluation flow

1. **Landing.** One plain-language question as the headline, a one-line
   explanation, three quiet "how it works" steps, one primary button
   (Start), and one honesty line: no account, answers stay in the browser.
   Draft copy:

   > **Evaluating a digital mental health technology?**
   > A short, guided way to weigh its safety and usefulness, for yourself or
   > for the people you support. (1) Say what you're evaluating.
   > (2) Answer questions about its quality and about the person using it.
   > (3) Get guidance you can act on.

   The primary action is **Start**, which opens `/evaluate`.

2. **Type of technology.** A single pick-one question: mHealth app ·
   Chatbot · Social media · Forum or group chat · Something else. Choosing
   one shows a short note about that kind of technology. Next.

3. **Quality of technology.** An intro line, then the questions:
   credibility, evidence, safety, privacy, persuasive design, plus the
   chatbot-gated safety question. Each question is a prompt with a small
   answer set, mostly Yes / Not sure / No. Questions can be restricted to a
   technology type. The client notes' own example carries into the sample:
   the human-in-the-loop question shows only for chatbots. When an answer
   carries a note, the note appears directly under the question. At the end
   of the page: the domain's guidance panel, its base guidance plus a
   "Based on your answers" list. Next.

4. **User considerations.** Same shape: risk awareness, recourse options,
   age and vulnerability, adult supervision, extent of engagement.

5. **Your guidance.** The summary: what was evaluated, then each domain's
   guidance with the notes the walkthrough produced. One quiet control:
   Start over.

**How an answer leads to guidance.** The chain, in order:

1. An answer option may carry a short **note** (authored next to the option).
2. Selecting it shows the note under the question.
3. The domain's **guidance panel** gathers that domain's notes under its base
   guidance.
4. The **summary** repeats the chain per domain, so the final screen carries
   every note the walkthrough produced.

No score, no verdict, no red/green meaning. Guidance is text authors write.
The app composes it.

Walkthrough behavior: a quiet "Step N of 3" line above each page heading.
Answers persist in the browser so a refresh does not lose work (Start over
clears them). The walkthrough never blocks: Not sure is a first-class answer
everywhere and Next is always available. A step can be opened directly, and
type-restricted questions stay hidden if no type is chosen. Switching type
afterwards hides or shows gated questions without discarding answers.

## Content and data shape — questions, answers, guidance as editable data

Authors write markdown. A one-command build turns it into JSON the app reads.
No question, answer, or guidance text lives in code.

**Authoring format.** One file per domain under `framework/content/`
(numeric prefix = order):

```md
# Quality of technology
intro: One or two plain sentences on what this domain covers.

## Is it clear who made this technology, and why?
- Yes
- Not sure
- No
### If answered: No
Treat the claims with extra caution. If it is unclear who is behind the
product, ...
### If answered: Not sure
Spend a few minutes finding out who is behind it before going further.

## For a chatbot: when it can't help, does a real person take over?
types: chatbot
- Yes
- No
### If answered: Yes
Proceed with caution: a human safeguard is a good sign, but keep working
through the questions.
### If answered: No
Look for an MHCC-certified chatbot instead. One without a human safeguard
cannot catch it when things go wrong.

## Guidance
The base guidance for this domain, shown at the end of the step, written for
the person doing the evaluation.
```

Markers, in full:

- `# Name` — first line. The domain's display name and the step heading.
- `intro:` — one line, the domain's framing sentence.
- `## Question` — a question, in user language.
- `types: chatbot, forum-group-chat` — optional, restricts the question to
  those technology types. Missing means shown for every type.
- `- Answer` — answer options, in order.
- `### If answered: <answer text>` — a note for that answer. The label must
  match an option exactly.
- `## Guidance` — reserved final section that holds the domain's base
  guidance.
- `<!-- comment -->` — single-line team notes. The build skips them.

A one-line `content/meta.md` carries app-level flags: `sample: true` drives
the visible sample-content marking (below).

**Generated data.** `framework/scripts/build-content.mjs` (zero dependencies)
validates the markdown and writes `framework/src/data/content.json`
(committed). Same sources, byte-identical output. Errors cite file and line,
with a closest-match suggestion for a stray `### If answered:` label.
`--check` validates without writing.

```json
{
  "meta": { "sample": true },
  "domains": [
    {
      "key": "quality",
      "name": "Quality of technology",
      "intro": "...",
      "questions": [
        {
          "id": "quality-q3",
          "text": "For a chatbot: when it can't help, does a real person take over?",
          "types": ["chatbot"],
          "options": [
            { "label": "Yes", "note": "Proceed with caution: ..." },
            { "label": "No", "note": "Look for an MHCC-certified chatbot instead. ..." }
          ]
        }
      ],
      "guidance": "..."
    }
  ]
}
```

- The app reads only this file. Each question's `id` is `<domain>-q<n>`
  (position within the domain). Saved answers are keyed by it.
- Step 1 uses the same model: `01-type-of-technology.md` holds one question,
  the picker, whose five options each carry a note.
- Questions without `types` show for every type. Options without `note`
  contribute nothing to the guidance panels.
- Page routes map to domains by key, so adding a domain, question, answer,
  or note never touches code.

**The authoring story.** Content staff edit only the markdown files and run
the one build command (`npm run content`, and `npm run build` runs it first).
A short authoring guide ships alongside (`framework/content/GUIDE.md`):
the markers, a copy-paste example, the command, and what errors look like.

## Design language — this pass

- **Vibe.** White page, near-black ink, generous whitespace, hairline rules.
  Flat surfaces: no shadows, minimal rounding. One restrained accent (a
  quiet desaturated blue) reserved for selected answers and focus rings.
  Primary buttons are solid ink, not color.
- **Type.** System font stack (already in place) with a real scale: small,
  body, lead, domain heading, page heading. Weights 400 and 600 only. Long
  text capped near 65 characters per line.
- **Structure.** Questions are hairline-separated blocks, not floating
  cards. Answers are full-width rows with native radio controls and labels.
  A selected answer may reveal its note directly underneath. Each step ends
  with a guidance panel: faint tint, hairline border, "Guidance" heading,
  base text, then "Based on your answers" entries. The step indicator is
  small muted text above the page heading.
- **Chrome.** A quiet top bar with the short working name ("Technology
  Decision Framework"). The full name leads the landing. One shared
  header / main / footer shell.
- **Sample marking.** Every page carries a quiet footer line: "Sample
  content: questions and guidance are drafts." Driven by `meta.sample`.
- **Motion.** None beyond default hover and focus state changes. Nothing
  animates on load.

## Accessibility

- Semantic structure: one h1 per page, header / main / footer landmarks,
  questions as fieldsets with the question text as legend, answers as native
  radio inputs. Keyboard and screen reader friendly by default.
- Visible focus outlines on every control. Logical tab order.
- Text contrast at least 4.5:1 and meaningful borders at least 3:1. Nothing
  is conveyed by color alone. Notes are plain text.
- No animation, so no reduced-motion path is needed beyond the default.

## Sample content plan

- Three domains, twelve questions in the sample: one picker, six in Quality
  of technology (including the chatbot-gated one), five in User
  considerations.
- Every option is written. Notes appear on a healthy share of options so the
  answer → note → panel → summary chain is visible in review.
- The client notes' human-in-the-loop chatbot logic is the gated-question
  proof case (chatbot only: Yes means proceed with caution, No means
  recommend an MHCC-certified chatbot).
- Nothing here fabricates organizations or services: the app names no real
  products, hours, or phone numbers. The only real reference is MHCC,
  carried from the notes as guidance text authors can rewrite.
- Visible sample marking on every page.

## Open questions — each with a current default

1. **Completion gating.** Must every question be answered to move on?
   Default: no. The walkthrough never blocks, and "Not sure" is a real
   answer everywhere.
2. **Type gating.** Does the chosen type hide questions? Default: yes, via
   the `types:` marker. Untagged questions always show.
3. **Answer vocabulary.** One fixed set everywhere, or per question?
   Default: per question, used sparingly. Most are Yes / Not sure / No, and
   one sample question uses A little / A fair amount / A lot / Not sure.
4. **Content build timing.** Ship the markdown-to-JSON build with this pass,
   or hand-maintain JSON first? Default: ship it. It is small,
   zero-dependency, and it is the authoring story. The app reads generated
   JSON either way.
5. **Persistence.** Remember answers between visits? Default: yes, browser
   storage only, with a visible Start over. The alternative is session-only
   memory.
6. **Type list.** The notes say "others tbd". Default: ship the five known
   options, including "Something else". The list is content, so it changes
   without code.

## Out of scope for this pass

- Export, print, or sharing an evaluation.
- Accounts and saved evaluations. The app is static and nothing leaves the
  browser.
- Links to the resources or services apps. The apps stay fully separate.
- Crisis chrome of any kind (per `docs/decisions.md`).
- Translation, analytics, or additional themes.

## Build plan

Constraints: React + JavaScript with the existing dependencies only (no new
packages). Static build, no runtime network calls. System font stack.

1. Content first: sample markdown (three domains, `01-type-of-technology.md`
   through `03-user-considerations.md`) + `scripts/build-content.mjs` +
   generated `src/data/content.json` + the short authoring guide.
   [FIRST BUILD STEP]
2. Design tokens and base styles: extend `src/styles/base.css`, tokens at
   the top, surface rules below in labeled sections.
3. Surfaces: landing, step 1, steps 2 and 3 with type gating, answer notes,
   and guidance panels, plus the summary with Start over and browser
   persistence.
4. Tests and checks: update the scaffold tests to the real copy, add flow
   tests (gating, note reveal, guidance composition, start over). Lint,
   tests, and build all green.
5. Capture pass: headless captures of every surface, console-clean, for
   review.
