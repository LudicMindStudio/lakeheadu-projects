#!/usr/bin/env node
/**
 * Build the framework app's content data.
 *
 * Reads the markdown files in content/ and writes src/data/content.json,
 * the single file the app reads. Questions, answers, and guidance never
 * live in code. Zero dependencies.
 *
 *   npm run content          build (writes src/data/content.json)
 *   npm run content:check    validate without writing
 *   npm run build            runs the build first, then Vite
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentDir = join(root, "content");
const outFile = join(root, "src", "data", "content.json");
const checkOnly = process.argv.includes("--check");

const errors = [];
const fail = (file, line, message) => errors.push(`${file}:${line}: ${message}`);

function splitLines(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/^\uFEFF/, "")
    .split("\n");
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function distance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const rows = [];
  for (let i = 0; i <= a.length; i += 1) rows.push([i, ...new Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

function closest(value, candidates) {
  let best = candidates[0];
  let bestDist = Infinity;
  for (const candidate of candidates) {
    const d = distance(value, candidate);
    if (d < bestDist) {
      best = candidate;
      bestDist = d;
    }
  }
  return best;
}

function joinParagraphs(lines) {
  const paragraphs = [];
  let current = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (current.length) paragraphs.push(current.join(" "));
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs.join("\n\n");
}

function parseMeta(file, text) {
  const meta = { sample: false, about: null, disclaimer: null };
  splitLines(text).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || /^<!--.*-->$/.test(line)) return;
    if (line.startsWith("<!--") || line.includes("-->")) {
      fail(file, index + 1, "comments must open and close on the same line");
      return;
    }
    const match = line.match(/^([a-z][a-z-]*):\s*(.*)$/);
    if (!match) {
      fail(file, index + 1, `unrecognized line "${line}" — expected a setting like "sample: true"`);
      return;
    }
    const [, key, value] = match;
    if (key === "sample") {
      if (value === "true" || value === "false") meta.sample = value === "true";
      else fail(file, index + 1, `sample must be true or false (got "${value}")`);
    } else if (key === "about" || key === "disclaimer") {
      if (!value) fail(file, index + 1, `${key}: is empty — write a sentence or two after the colon`);
      else if (meta[key] !== null) fail(file, index + 1, `more than one ${key}: line`);
      else meta[key] = value;
    } else {
      fail(file, index + 1, `unknown setting "${key}"`);
    }
  });
  return meta;
}

function parseDomain(file, text) {
  const domain = { file, name: null, intro: null, questions: [], guidance: null };
  let current = null;
  let note = null;
  let guidance = null;
  let sawTitle = false;

  const finalizeNote = () => {
    if (!note) return;
    const body = joinParagraphs(note.lines);
    if (!body) {
      fail(file, note.line, `"### If answered: ${note.label}" has no note text under it`);
    } else if (current) {
      const option = current.options.find((o) => o.label === note.label);
      if (!option) {
        const suggestion = closest(
          note.label,
          current.options.map((o) => o.label),
        );
        fail(
          file,
          note.line,
          `"### If answered: ${note.label}" does not match any answer — closest is "${suggestion}"`,
        );
      } else if (option.note) {
        fail(file, note.line, `answer "${note.label}" already has a note`);
      } else {
        option.note = body;
      }
    }
    note = null;
  };

  const finalizeQuestion = () => {
    finalizeNote();
    if (!current) return;
    if (current.options.length === 0) {
      fail(file, current.line, `question "${current.text}" has no answers`);
    } else {
      domain.questions.push(current);
    }
    current = null;
  };

  const finalizeGuidance = () => {
    if (!guidance) return;
    const body = joinParagraphs(guidance.lines);
    if (!body) fail(file, guidance.line, "## Guidance section is empty");
    else domain.guidance = body;
    guidance = null;
  };

  splitLines(text).forEach((raw, index) => {
    const lineNo = index + 1;
    const line = raw.trim();

    if (line.startsWith("<!--")) {
      if (!/^<!--.*-->$/.test(line))
        fail(file, lineNo, "comments must open and close on the same line");
      return;
    }
    if (line.includes("-->")) {
      fail(file, lineNo, "comment closes without an opening <!--");
      return;
    }

    if (!line) {
      // Blank lines mark paragraph breaks inside notes and guidance.
      // Elsewhere they are ignored.
      if (note) note.lines.push("");
      else if (guidance) guidance.lines.push("");
      return;
    }

    if (line.startsWith("### If answered:")) {
      if (guidance) {
        fail(file, lineNo, '"### If answered:" cannot appear after ## Guidance');
        return;
      }
      finalizeNote();
      if (!current) {
        fail(file, lineNo, '"### If answered:" must come after a question and its answers');
        return;
      }
      const label = line.slice("### If answered:".length).trim();
      if (!label) {
        fail(file, lineNo, '"### If answered:" needs the answer text after the colon');
        return;
      }
      note = { label, line: lineNo, lines: [] };
      return;
    }

    if (line.startsWith("### ")) {
      fail(
        file,
        lineNo,
        `unrecognized line — for an answer note, write "### If answered: <answer>"`,
      );
      return;
    }

    if (/^## Guidance\s*$/.test(line)) {
      finalizeQuestion();
      if (domain.guidance || guidance) {
        fail(file, lineNo, "only one ## Guidance section per file");
        return;
      }
      guidance = { line: lineNo, lines: [] };
      return;
    }

    if (line.startsWith("## ")) {
      if (guidance) {
        fail(file, lineNo, "questions cannot appear after ## Guidance");
        return;
      }
      finalizeQuestion();
      const questionText = line.slice(3).trim();
      if (!questionText) {
        fail(file, lineNo, "question is missing its text");
        return;
      }
      current = { text: questionText, line: lineNo, types: null, typesLine: 0, options: [] };
      return;
    }

    if (line.startsWith("# ")) {
      if (!sawTitle && !domain.questions.length && !current && !domain.intro) {
        domain.name = line.slice(2).trim();
        if (!domain.name) fail(file, lineNo, "title is empty");
        sawTitle = true;
      } else {
        fail(file, lineNo, "# title must be the first line of the file");
      }
      return;
    }

    if (line.startsWith("intro:")) {
      if (domain.intro !== null) {
        fail(file, lineNo, "file has more than one intro:");
        return;
      }
      if (domain.questions.length || current || guidance) {
        fail(file, lineNo, "intro: must come before the questions");
        return;
      }
      const introText = line.slice("intro:".length).trim();
      if (!introText) {
        fail(file, lineNo, "intro: is empty");
        return;
      }
      domain.intro = introText;
      return;
    }

    if (line.startsWith("types:")) {
      if (guidance) {
        fail(file, lineNo, '"types:" cannot appear after ## Guidance');
        return;
      }
      if (!current) {
        fail(file, lineNo, '"types:" must come after a question');
        return;
      }
      if (current.types) {
        fail(file, lineNo, "question has more than one types: line");
        return;
      }
      const values = line
        .slice("types:".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (!values.length) {
        fail(file, lineNo, '"types:" lists no technology types');
        return;
      }
      current.types = values;
      current.typesLine = lineNo;
      return;
    }

    if (line.startsWith("- ")) {
      if (guidance) {
        fail(
          file,
          lineNo,
          "answer options are not supported inside ## Guidance — write plain text",
        );
        return;
      }
      if (!current) {
        fail(file, lineNo, "answer option before any question");
        return;
      }
      if (note) {
        fail(file, lineNo, "answer options must come before the ### If answered: notes");
        return;
      }
      const label = line.slice(2).trim();
      if (!label) {
        fail(file, lineNo, "answer option is empty");
        return;
      }
      if (current.options.some((o) => o.label === label)) {
        fail(file, lineNo, `duplicate answer "${label}"`);
        return;
      }
      current.options.push({ label, line: lineNo });
      return;
    }

    if (note) {
      note.lines.push(line);
      return;
    }
    if (guidance) {
      guidance.lines.push(line);
      return;
    }
    fail(
      file,
      lineNo,
      `unrecognized line — expected a marker (#, ##, ###, types:, intro:, or "- ")`,
    );
  });

  finalizeQuestion();
  finalizeGuidance();

  if (!domain.name) fail(file, 1, "file is missing its # title");
  return domain;
}

function build() {
  if (!existsSync(contentDir)) {
    console.error(`✖ content build failed — no content directory at ${contentDir}`);
    process.exit(1);
  }

  const metaFile = join(contentDir, "meta.md");
  if (!existsSync(metaFile)) {
    fail("content/meta.md", 1, 'missing — create it with at least "sample: false"');
  }
  const meta = existsSync(metaFile)
    ? parseMeta("content/meta.md", readFileSync(metaFile, "utf8"))
    : { sample: false };

  const domainFiles = [];
  for (const name of readdirSync(contentDir).sort()) {
    if (name === "meta.md" || name === "GUIDE.md") continue;
    if (!name.endsWith(".md")) continue;
    const match = name.match(/^(\d+)-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
    if (!match) {
      fail(`content/${name}`, 1, "files must be named NN-name.md (for example 04-new-domain.md)");
      continue;
    }
    domainFiles.push({ name, order: Number(match[1]), key: match[2] });
  }
  domainFiles.sort((a, b) => a.order - b.order);
  domainFiles.forEach((entry, index) => {
    if (index > 0 && domainFiles[index - 1].order === entry.order) {
      fail(`content/${entry.name}`, 1, `duplicate order number ${entry.order}`);
    }
  });

  const domains = [];
  const keys = new Set();
  for (const entry of domainFiles) {
    if (keys.has(entry.key)) {
      fail(`content/${entry.name}`, 1, `duplicate domain key "${entry.key}"`);
      continue;
    }
    if (entry.key === "guidance") {
      fail(
        `content/${entry.name}`,
        1,
        '"guidance" is reserved for the summary page — rename the file',
      );
      continue;
    }
    keys.add(entry.key);
    const parsed = parseDomain(
      `content/${entry.name}`,
      readFileSync(join(contentDir, entry.name), "utf8"),
    );
    parsed.key = entry.key;
    parsed.order = entry.order;
    domains.push(parsed);
  }

  if (!domains.length) {
    fail("content/", 1, "no domain files found — expected NN-name.md files");
  }

  const picker = domains[0]?.questions[0];
  if (picker) {
    const seenSlugs = new Set();
    for (const option of picker.options) {
      const slug = slugify(option.label);
      if (!slug)
        fail(
          picker.file,
          option.line,
          `answer "${option.label}" does not produce a usable technology type`,
        );
      else if (seenSlugs.has(slug))
        fail(picker.file, option.line, `two answers produce the same technology type "${slug}"`);
      else option.slug = slug;
      seenSlugs.add(slug);
    }
  } else if (domains[0]) {
    fail(
      `content/${domainFiles[0] ? domainFiles[0].name : "01-*.md"}`,
      1,
      "the first domain needs its first question (the technology picker)",
    );
  }

  const knownTypes = picker ? picker.options.map((o) => o.slug).filter(Boolean) : [];
  for (const domain of domains) {
    for (const question of domain.questions) {
      if (!question.types) continue;
      for (const value of question.types) {
        if (!knownTypes.includes(value)) {
          const suggestion = knownTypes.length
            ? ` — closest is "${closest(value, knownTypes)}"`
            : "";
          fail(
            domain.file,
            question.typesLine,
            `unknown technology type "${value}"${suggestion}. Known types: ${knownTypes.join(", ")}`,
          );
        }
      }
    }
  }

  const payload = {
    meta: {
      sample: meta.sample,
      ...(meta.about ? { about: meta.about } : {}),
      ...(meta.disclaimer ? { disclaimer: meta.disclaimer } : {}),
    },
    domains: domains.map((domain) => ({
      key: domain.key,
      name: domain.name,
      ...(domain.intro ? { intro: domain.intro } : {}),
      questions: domain.questions.map((question, questionIndex) => ({
        id: `${domain.key}-q${questionIndex + 1}`,
        text: question.text,
        ...(question.types ? { types: question.types } : {}),
        options: question.options.map((option) => ({
          label: option.label,
          ...(option.slug ? { slug: option.slug } : {}),
          ...(option.note ? { note: option.note } : {}),
        })),
      })),
      ...(domain.guidance ? { guidance: domain.guidance } : {}),
    })),
  };

  const output = `${JSON.stringify(payload, null, 2)}\n`;
  const questionCount = payload.domains.reduce((n, d) => n + d.questions.length, 0);
  const noteCount = payload.domains.reduce(
    (n, d) => n + d.questions.reduce((m, q) => m + q.options.filter((o) => o.note).length, 0),
    0,
  );
  const summary = `${payload.domains.length} domains, ${questionCount} questions, ${noteCount} notes`;

  if (errors.length) {
    console.error(
      `✖ content build failed — ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
    );
    for (const error of errors) console.error(`  ${error}`);
    process.exit(1);
  }

  if (checkOnly) {
    console.log(`✓ content check passed — ${summary} (nothing written)`);
    return;
  }

  const previous = existsSync(outFile) ? readFileSync(outFile, "utf8") : null;
  if (previous === output) {
    console.log(`✓ content build — ${summary} → src/data/content.json (unchanged)`);
    return;
  }
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, output);
  console.log(`✓ content build — ${summary} → src/data/content.json (written)`);
}

build();
