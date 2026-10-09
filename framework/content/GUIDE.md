# Content guide

Every question, answer, and piece of guidance in this app lives in this
folder as markdown. Nothing is written in code. Edit these files, run one
command, and the app updates.

## Files

- `meta.md`: app-level settings. `sample: true` marks the content as
  sample drafts (kept in the data for the team, never shown on the page);
  set it to `false` when real content ships. `about:` and `disclaimer:`
  are one paragraph each and feed the About popup on the landing page.
- `NN-name.md`: one file per domain, in the order they appear (`01-`,
  `02-`, `03-`). The number controls the order; the rest of the file name is
  the domain's key, used in links and saved answers, so rename files with
  care.

## The markers

| Line | What it does |
| --- | --- |
| `# Name` | The domain's name. Must be the first line of the file. |
| `intro: ...` | One or two sentences that open the domain's page. |
| `## Question` | A question, written in plain language. |
| `types: chatbot` | Optional. Shows the question only for the listed technology types. Values are the picker answers, lowercased with dashes: "Forum or group chat" becomes `forum-or-group-chat`. |
| `- Answer` | An answer choice. Put them right under the question, in order. |
| `### If answered: Answer` | A note shown under the question when that answer is chosen, and gathered into the end-of-step guidance. The text after the colon must match an answer exactly. |
| `## Guidance` | The last section of the file. Shown at the end of the step and in the summary. |
| `<!-- comment -->` | A single-line note for the team. The build skips it. |

Notes and guidance can run to several lines. A blank line starts a new
paragraph.

## A full example

```md
# Quality of technology
intro: Look at what stands behind the technology.

## Is it clear who made this technology, and why?
- Yes
- Not sure
- No
### If answered: No
Treat its claims with extra caution. An unclear maker means no one is
accountable when something goes wrong.

## For a chatbot: when it cannot help, does a real person take over?
types: chatbot
- Yes
- No
### If answered: No
Consider a chatbot with a certification you can verify instead.

## Guidance
Look at the pattern across your answers, not any single one.
```

## The technology picker

The first question of the first file is the picker. Its answers define the
technology types that `types:` lines can use, so add or rename picker
answers first when you add a new kind of technology.

## Building

Run these from the `framework` folder:

    npm run content          rebuild src/data/content.json from these files
    npm run content:check    check the files without writing anything

`npm run build` runs the content build first, so a deploy always carries the
latest content.

## When something is wrong

The build names the file, the line, and what it expected. For example:

    ✖ content build failed: 2 errors:
      content/02-quality.md:24: "### If answered: Nope" does not match any answer; closest is "No"
      content/02-quality.md:31: unknown technology type "chatpot"; closest is "chatbot". Known types: mhealth-app, chatbot, social-media, forum-or-group-chat, something-else

Fix the line the message names and run it again. Nothing is written until
every file passes.
