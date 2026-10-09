import content from "./data/content.json";

export const meta = content.meta;
export const domains = content.domains;
export const stepCount = domains.length;

// The first question of the first domain is the technology picker. Its
// answers define the types that gate other questions.
export const pickerQuestion = domains[0].questions[0];

export function domainByKey(key) {
  return domains.find((domain) => domain.key === key) ?? null;
}

export function stepNumberFor(domain) {
  return domains.indexOf(domain) + 1;
}

export function partNumberFor(domain) {
  return stepNumberFor(domain);
}

export function pathForDomain(domain) {
  return domains.indexOf(domain) === 0 ? "/evaluate" : `/evaluate/${domain.key}`;
}

export function nextPathFor(domain) {
  const index = domains.indexOf(domain);
  const next = domains[index + 1];
  return next ? `/evaluate/${next.key}` : "/evaluate/guidance";
}

export function currentTypeSlug(answers) {
  const label = answers[pickerQuestion.id];
  if (!label) return null;
  const option = pickerQuestion.options.find((o) => o.label === label);
  return option?.slug ?? null;
}

export function visibleQuestions(domain, typeSlug) {
  return domain.questions.filter(
    (question) => !question.types || (typeSlug && question.types.includes(typeSlug)),
  );
}

export function chosenOption(question, answers) {
  const label = answers[question.id];
  if (!label) return null;
  return question.options.find((o) => o.label === label) ?? null;
}

// Progress for one part: answered against the questions actually visible,
// so gated questions adjust the counts with the chosen type.
export function countsFor(domain, answers) {
  const questions = visibleQuestions(domain, currentTypeSlug(answers));
  const answered = questions.filter((question) => answers[question.id]).length;
  return { answered, total: questions.length };
}

export function isDomainComplete(domain, answers) {
  const { answered, total } = countsFor(domain, answers);
  return total > 0 && answered >= total;
}

// The part's notes: the text carried by each answered, visible question.
export function notesFor(domain, answers, typeSlug) {
  const notes = [];
  for (const question of visibleQuestions(domain, typeSlug)) {
    const option = chosenOption(question, answers);
    if (option?.note) notes.push({ id: question.id, text: option.note });
  }
  return notes;
}

// The same notes for the assessment, each with the question it came from,
// so the page reads as a record of the evaluation.
export function findingsFor(domain, answers, typeSlug) {
  const findings = [];
  for (const question of visibleQuestions(domain, typeSlug)) {
    const option = chosenOption(question, answers);
    if (option?.note) {
      findings.push({ id: question.id, question: question.text, note: option.note });
    }
  }
  return findings;
}

export function hasAnyAnswers(answers) {
  return Object.keys(answers).length > 0;
}

// Where Continue goes: the first part with questions left open, or the
// assessment when every part is done.
export function firstIncompletePath(answers) {
  const incomplete = domains.find((domain) => !isDomainComplete(domain, answers));
  return incomplete ? pathForDomain(incomplete) : "/evaluate/guidance";
}
