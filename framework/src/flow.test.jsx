import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App.jsx";
import { domains, pickerQuestion, visibleQuestions } from "./content.js";
import { LEGACY_KEY, STORAGE_KEY } from "./state/answers-context.js";

const quality = domains.find((domain) => domain.key === "quality");
const userConsiderations = domains.find((domain) => domain.key === "user-considerations");
const gatedQuestion = quality.questions.find((q) => q.types && q.types.includes("chatbot"));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function frameHeading() {
  return within(document.querySelector(".page-frame")).getByRole("heading", { level: 1 });
}

function seedRecord(answers, subject = "") {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ subject, answers }));
}

function seedLegacy(answers) {
  window.localStorage.setItem(LEGACY_KEY, JSON.stringify(answers));
}

function storedRecord() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
}

function questionGroup(text) {
  return screen.getByRole("group", { name: text });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("picking a technology shows its note under the question", () => {
  const chatbot = pickerQuestion.options.find((o) => o.label === "Chatbot");
  renderAt("/evaluate");
  expect(screen.queryByText(chatbot.note)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "Chatbot" }));
  expect(screen.getByText(chatbot.note)).toBeInTheDocument();
});

test("chatbot-only question stays hidden when no technology is chosen", () => {
  renderAt("/evaluate/quality");
  expect(screen.queryByRole("group", { name: gatedQuestion.text })).not.toBeInTheDocument();
  const ungatedCount = quality.questions.filter((q) => !q.types).length;
  expect(screen.getAllByRole("group")).toHaveLength(ungatedCount);
});

test("chatbot-only question appears when a chatbot is chosen", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  expect(screen.getByRole("group", { name: gatedQuestion.text })).toBeInTheDocument();
});

test("switching the technology hides gated questions without discarding answers", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot", [gatedQuestion.id]: "Yes" });
  renderAt("/evaluate");
  fireEvent.click(screen.getByRole("radio", { name: "Social media" }));
  fireEvent.click(screen.getByRole("link", { name: "Next part" }));
  advance(200);
  expect(frameHeading()).toHaveTextContent(quality.name);
  expect(screen.queryByRole("group", { name: gatedQuestion.text })).not.toBeInTheDocument();
  expect(storedRecord().answers[gatedQuestion.id]).toBe("Yes");
});

test("the guidance panel composes notes from the answers", () => {
  const [first, second] = quality.questions;
  const noNote = first.options.find((o) => o.label === "No").note;
  const unsureNote = second.options.find((o) => o.label === "Not sure").note;
  seedRecord({
    [pickerQuestion.id]: "Chatbot",
    [first.id]: "No",
    [second.id]: "Not sure",
  });
  renderAt("/evaluate/quality");
  const panel = screen.getByRole("region", { name: "Guidance" });
  expect(within(panel).getByText(noNote)).toBeInTheDocument();
  expect(within(panel).getByText(unsureNote)).toBeInTheDocument();
  expect(within(questionGroup(first.text)).getByRole("radio", { name: "No" })).toBeChecked();
});

test("the panel shows only base guidance before any answers", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  const panel = screen.getByRole("region", { name: "Guidance" });
  expect(within(panel).getByText(quality.guidance)).toBeInTheDocument();
  expect(within(panel).queryByText(/based on your answers/i)).not.toBeInTheDocument();
});

test("changing an answer updates the note and the panel", () => {
  const first = quality.questions[0];
  const noNote = first.options.find((o) => o.label === "No").note;
  seedRecord({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  const group = questionGroup(first.text);
  const panel = screen.getByRole("region", { name: "Guidance" });
  expect(within(panel).queryByText(noNote)).not.toBeInTheDocument();
  fireEvent.click(within(group).getByRole("radio", { name: "No" }));
  expect(within(group).getByText(noNote)).toBeInTheDocument();
  expect(within(panel).getByText(noNote)).toBeInTheDocument();
  fireEvent.click(within(group).getByRole("radio", { name: "Yes" }));
  expect(within(group).queryByText(noNote)).not.toBeInTheDocument();
  expect(within(panel).queryByText(noNote)).not.toBeInTheDocument();
});

test("the wrap-up settles when the part's visible questions are answered", () => {
  const visible = visibleQuestions(quality, null);
  const answers = {};
  for (const question of visible) {
    answers[question.id] = question.options[0].label;
  }
  seedRecord(answers);
  const { container } = renderAt("/evaluate/quality");
  expect(container.querySelector(".guidance--settled")).not.toBeNull();
});

test("the wrap-up stays unsettled while questions are open", () => {
  seedRecord({ [quality.questions[0].id]: "Yes" });
  const { container } = renderAt("/evaluate/quality");
  expect(container.querySelector(".guidance--settled")).toBeNull();
});

test("answers persist in the browser across remounts", () => {
  const { unmount } = renderAt("/evaluate");
  fireEvent.click(screen.getByRole("radio", { name: "Chatbot" }));
  unmount();
  renderAt("/evaluate");
  expect(screen.getByRole("radio", { name: "Chatbot" })).toBeChecked();
});

test("records saved by the v1 build are read across so nobody loses answers", () => {
  seedLegacy({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate");
  expect(screen.getByRole("radio", { name: "Chatbot" })).toBeChecked();
  expect(storedRecord().answers[pickerQuestion.id]).toBe("Chatbot");
});

test("the landing offers Continue once there are answers", () => {
  seedLegacy({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/");
  expect(screen.queryByRole("button", { name: "Begin" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  advance(400);
  expect(frameHeading()).toHaveTextContent(quality.name);
});

test("the wheel carries per-part progress in its names", () => {
  seedRecord({
    [quality.questions[0].id]: "Yes",
    [quality.questions[1].id]: "No",
    [userConsiderations.questions[0].id]: "Yes",
  });
  renderAt("/");
  const wheel = within(document.querySelector(".wheel-nav"));
  expect(
    wheel.getByRole("link", { name: /Quality of technology — part 2 of 3, 2 of 5 answered/ }),
  ).toBeInTheDocument();
  expect(
    wheel.getByRole("link", { name: /User considerations — part 3 of 3, 1 of 5 answered/ }),
  ).toBeInTheDocument();
});

test("naming the technology carries it into the walkthrough", () => {
  renderAt("/");
  advance(2300);
  fireEvent.change(screen.getByLabelText("What are you evaluating?"), {
    target: { value: "Calm Harbour" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Begin" }));
  advance(400);
  expect(screen.getByText("Calm Harbour")).toBeInTheDocument();
  advance(650);
  expect(document.querySelector(".wheel-stage").getAttribute("data-stage")).toBe("dock");
});

test("an empty name reads Your evaluation on the banner", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  expect(screen.getByText("Your evaluation")).toBeInTheDocument();
});

test("the assessment is titled with the subject", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot" }, "Calm Harbour");
  renderAt("/evaluate/guidance");
  expect(frameHeading()).toHaveTextContent("Your assessment of Calm Harbour");
});

test("the assessment gathers guidance and findings with their questions", () => {
  const noNote = quality.questions[0].options.find((o) => o.label === "No").note;
  const gatedNote = gatedQuestion.options.find((o) => o.label === "Yes").note;
  const userNote = userConsiderations.questions[0].options.find((o) => o.label === "No").note;
  seedRecord({
    [pickerQuestion.id]: "Chatbot",
    [quality.questions[0].id]: "No",
    [gatedQuestion.id]: "Yes",
    [userConsiderations.questions[0].id]: "No",
  });
  renderAt("/evaluate/guidance");
  expect(frameHeading()).toHaveTextContent("Your assessment");
  expect(screen.getByRole("heading", { name: "What was evaluated" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: `Part 2 · ${quality.name}` })).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: `Part 3 · ${userConsiderations.name}` }),
  ).toBeInTheDocument();
  expect(screen.getByText(noNote)).toBeInTheDocument();
  expect(screen.getByText(gatedNote)).toBeInTheDocument();
  expect(screen.getByText(userNote)).toBeInTheDocument();
  // each note shows the question it came from
  expect(screen.getByText(quality.questions[0].text)).toBeInTheDocument();
  expect(screen.getByText(gatedQuestion.text)).toBeInTheDocument();
});

test("Start over clears the walkthrough and replays the arrival", () => {
  seedRecord({ [pickerQuestion.id]: "Chatbot" }, "Calm Harbour");
  renderAt("/evaluate/guidance");
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  expect(storedRecord()).toEqual({ subject: "", answers: {} });
  expect(document.querySelector(".wheel-stage").getAttribute("data-stage")).toBe("arrival");
  advance(2300);
  expect(screen.getByRole("button", { name: "Begin" })).toBeEnabled();
});

test("an empty assessment invites the walkthrough", () => {
  renderAt("/evaluate/guidance");
  expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start the evaluation" })).toHaveAttribute(
    "href",
    "/evaluate",
  );
});
