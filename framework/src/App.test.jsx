import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App.jsx";
import { domains } from "./content.js";

const quality = domains.find((domain) => domain.key === "quality");

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

function stageOf() {
  return document.querySelector(".wheel-stage").getAttribute("data-stage");
}

function frameHeading() {
  return within(document.querySelector(".page-frame")).getByRole("heading", { level: 1 });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("the wheel assembles on a fresh visit and settles into rest", () => {
  const { container } = renderAt("/");
  expect(stageOf()).toBe("arrival");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Is your technology safe and useful?",
  );
  expect(container.querySelectorAll(".wedge-link")).toHaveLength(3);
  advance(2300);
  expect(stageOf()).toBe("rest");
  expect(screen.getByRole("button", { name: "Begin" })).toBeEnabled();
});

test("a first input skips the assembly", () => {
  renderAt("/");
  expect(stageOf()).toBe("arrival");
  fireEvent.keyDown(window, { key: "a" });
  expect(stageOf()).toBe("rest");
});

test("Begin plays the handoff and lands in the docked walkthrough", () => {
  renderAt("/");
  advance(2300);
  fireEvent.click(screen.getByRole("button", { name: "Begin" }));
  expect(stageOf()).toBe("handoff");
  advance(400);
  expect(frameHeading()).toHaveTextContent(domains[0].name);
  advance(650);
  expect(stageOf()).toBe("dock");
  const current = document.querySelector('.wedge-link[aria-current="page"]');
  expect(current?.getAttribute("aria-label")).toContain(domains[0].name);
});

test("a wedge click before a name opens that part", () => {
  renderAt("/");
  advance(2300);
  const link = within(document.querySelector(".wheel-nav")).getByRole("link", {
    name: /Quality of technology — part 2 of 3/,
  });
  fireEvent.click(link);
  expect(stageOf()).toBe("handoff");
  advance(1050);
  expect(stageOf()).toBe("dock");
  expect(frameHeading()).toHaveTextContent(quality.name);
});

test("the current part is marked on the wheel and the rail and bar are gone", () => {
  const { container } = renderAt("/evaluate/quality");
  const currents = container.querySelectorAll('[aria-current="page"]');
  expect(currents.length).toBe(1);
  expect(currents[0].getAttribute("aria-label")).toContain(quality.name);
  expect(container.querySelector(".rail")).toBeNull();
  expect(container.querySelector(".parts-bar")).toBeNull();
});

test("clicking a protrusion turns the wheel and swaps the part", () => {
  const { container } = renderAt("/evaluate");
  const right = container.querySelector(".protrusion--right");
  expect(within(right).getByText(quality.name)).toBeInTheDocument();
  fireEvent.click(right);
  expect(document.querySelector(".wheel-stage").getAttribute("data-turning")).toBe("true");
  advance(820);
  expect(document.querySelector(".wheel-rotor").style.transform).toContain("rotate(-120deg)");
  expect(frameHeading()).toHaveTextContent(quality.name);
  expect(container.querySelector(".protrusion--left .protrusion-label")).toHaveTextContent(
    domains[0].name,
  );
});

test("the assessment keeps the dock with every part a click away", () => {
  renderAt("/evaluate/guidance");
  const right = document.querySelector(".protrusion--right");
  expect(right).not.toBeNull();
  expect(within(right).getByText(quality.name)).toBeInTheDocument();
});

test("reduced motion assembles at once and moves without beats", () => {
  const media = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: String(query).includes("prefers-reduced-motion"),
    media: String(query),
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
  try {
    renderAt("/");
    expect(stageOf()).toBe("rest");
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));
    expect(stageOf()).toBe("dock");
    expect(frameHeading()).toHaveTextContent(domains[0].name);
    expect(document.querySelector(".wheel-rotor").style.transform).toContain("rotate(0deg)");
  } finally {
    window.matchMedia = media;
  }
});

test("interface chrome no longer explains itself", () => {
  renderAt("/");
  advance(2300);
  expect(screen.queryByText(/no wrong answers/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/optional, and it stays/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/no account needed/i)).not.toBeInTheDocument();
  const input = screen.getByLabelText("What are you evaluating?");
  expect(input).toHaveAttribute("placeholder", "Technology name...");
  expect(screen.getByText("Your answers stay on this device")).toBeInTheDocument();
});

test("the About note explains the tool and carries the disclaimer", () => {
  renderAt("/");
  advance(2300);
  fireEvent.click(screen.getByRole("button", { name: "About this framework" }));
  const dialog = screen.getByRole("dialog", { name: "About this framework" });
  expect(dialog).toHaveTextContent(/guided way to look at a digital mental health technology/);
  expect(dialog).toHaveTextContent(/general information, not medical advice/);
  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  expect(dialog.open).toBe(false);
});

test("the Next control wears the next part's tone", () => {
  const first = renderAt("/evaluate");
  expect(first.getByRole("link", { name: "Next part" }).className).toContain("button--next-2");
  first.unmount();
  const last = renderAt("/evaluate/user-considerations");
  expect(last.getByRole("link", { name: "See your assessment" }).className).toContain(
    "button--finish",
  );
});

test("the part eyebrow carries the quiet count", () => {
  renderAt("/evaluate/quality");
  expect(screen.getByText("Part 2 of 3")).toBeInTheDocument();
  expect(screen.getByText("0 of 5 answered")).toBeInTheDocument();
});

test("renders the first part with the eyebrow", () => {
  renderAt("/evaluate");
  expect(screen.getByText(`Part 1 of ${domains.length}`)).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(domains[0].name);
});

test("renders an unknown path as not found", () => {
  renderAt("/nope");
  expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
});

test("renders an unknown step key as not found", () => {
  renderAt("/evaluate/not-a-domain");
  expect(screen.getByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
});

test("unknown domains fall back to the hub field", () => {
  const { container } = renderAt("/nope");
  expect(container.querySelector(".app").getAttribute("data-field")).toBe("hub");
});

test("each part page sits in its own color field", () => {
  const qualityView = renderAt("/evaluate/quality");
  expect(qualityView.container.querySelector(".app").getAttribute("data-field")).toBe("p2");
  const user = renderAt("/evaluate/user-considerations");
  expect(user.container.querySelector(".app").getAttribute("data-field")).toBe("p3");
});
