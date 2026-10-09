import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import App from "./App.jsx";
import { domains } from "./content.js";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("renders the landing page with the start link", () => {
  renderAt("/");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    /evaluating a digital mental health technology/i,
  );
  expect(screen.getByRole("link", { name: "Start" })).toHaveAttribute("href", "/evaluate");
});

test("renders the first step with the step indicator", () => {
  renderAt("/evaluate");
  expect(screen.getByText(`Step 1 of ${domains.length}`)).toBeInTheDocument();
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

test("start opens the first step", () => {
  renderAt("/");
  fireEvent.click(screen.getByRole("link", { name: "Start" }));
  expect(screen.getByText(`Step 1 of ${domains.length}`)).toBeInTheDocument();
});
