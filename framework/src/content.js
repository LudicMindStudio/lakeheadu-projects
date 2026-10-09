import content from "./data/content.json";

export const meta = content.meta;
export const domains = content.domains;
export const stepCount = domains.length;

// By convention, the first question of the first domain is the technology
// picker. Its answers define the types that gate other questions.
export const pickerQuestion = domains[0].questions[0];

export function domainByKey(key) {
  return domains.find((domain) => domain.key === key) ?? null;
}

export function stepNumberFor(domain) {
  return domains.indexOf(domain) + 1;
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

// The notes the walkthrough has produced for a domain, one per answered
// question that carries a note. Only visible questions contribute.
export function notesFor(domain, answers, typeSlug) {
  const notes = [];
  for (const question of visibleQuestions(domain, typeSlug)) {
    const option = chosenOption(question, answers);
    if (option?.note) notes.push({ id: question.id, text: option.note });
  }
  return notes;
}

export function hasAnyAnswers(answers) {
  return Object.keys(answers).length > 0;
}
