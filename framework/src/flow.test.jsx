import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import App from "./App.jsx";
import { domains, pickerQuestion } from "./content.js";
import { STORAGE_KEY } from "./state/answers-context.js";

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

function seedAnswers(answers) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

function storedAnswers() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
}

function questionGroup(text) {
  return screen.getByRole("group", { name: text });
}

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
  seedAnswers({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  expect(screen.getByRole("group", { name: gatedQuestion.text })).toBeInTheDocument();
});

test("switching the technology hides gated questions without discarding answers", () => {
  seedAnswers({ [pickerQuestion.id]: "Chatbot", [gatedQuestion.id]: "Yes" });
  renderAt("/evaluate");
  fireEvent.click(screen.getByRole("radio", { name: "Social media" }));
  fireEvent.click(screen.getByRole("link", { name: "Next" }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(quality.name);
  expect(screen.queryByRole("group", { name: gatedQuestion.text })).not.toBeInTheDocument();
  expect(storedAnswers()[gatedQuestion.id]).toBe("Yes");
});

test("the guidance panel composes notes from the answers", () => {
  const [first, second] = quality.questions;
  const noNote = first.options.find((o) => o.label === "No").note;
  const unsureNote = second.options.find((o) => o.label === "Not sure").note;
  seedAnswers({
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
  seedAnswers({ [pickerQuestion.id]: "Chatbot" });
  renderAt("/evaluate/quality");
  const panel = screen.getByRole("region", { name: "Guidance" });
  expect(within(panel).getByText(quality.guidance)).toBeInTheDocument();
  expect(within(panel).queryByText(/based on your answers/i)).not.toBeInTheDocument();
});

test("changing an answer updates the note and the panel", () => {
  const first = quality.questions[0];
  const noNote = first.options.find((o) => o.label === "No").note;
  seedAnswers({ [pickerQuestion.id]: "Chatbot" });
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

test("answers persist in the browser across remounts", () => {
  const { unmount } = renderAt("/evaluate");
  fireEvent.click(screen.getByRole("radio", { name: "Chatbot" }));
  unmount();
  renderAt("/evaluate");
  expect(screen.getByRole("radio", { name: "Chatbot" })).toBeChecked();
});

test("the summary gathers every domain's guidance and notes", () => {
  const noNote = quality.questions[0].options.find((o) => o.label === "No").note;
  const gatedNote = gatedQuestion.options.find((o) => o.label === "Yes").note;
  const userNote = userConsiderations.questions[0].options.find((o) => o.label === "No").note;
  seedAnswers({
    [pickerQuestion.id]: "Chatbot",
    [quality.questions[0].id]: "No",
    [gatedQuestion.id]: "Yes",
    [userConsiderations.questions[0].id]: "No",
  });
  renderAt("/evaluate/guidance");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your guidance");
  expect(screen.getByRole("heading", { name: "What was evaluated" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: quality.name })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: userConsiderations.name })).toBeInTheDocument();
  expect(screen.getByText(noNote)).toBeInTheDocument();
  expect(screen.getByText(gatedNote)).toBeInTheDocument();
  expect(screen.getByText(userNote)).toBeInTheDocument();
});

test("Start over clears the walkthrough and returns to the first step", () => {
  seedAnswers({ [pickerQuestion.id]: "Chatbot", [quality.questions[0].id]: "No" });
  renderAt("/evaluate/guidance");
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  expect(screen.getByText(`Step 1 of ${domains.length}`)).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(domains[0].name);
  expect(storedAnswers()).toEqual({});
});

test("an empty summary invites the walkthrough", () => {
  renderAt("/evaluate/guidance");
  expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start the evaluation" })).toHaveAttribute(
    "href",
    "/evaluate",
  );
});
