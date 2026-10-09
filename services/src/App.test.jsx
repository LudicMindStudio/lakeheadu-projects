import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import App from "./App.jsx";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("renders the landing page", () => {
  renderAt("/");
  expect(screen.getByRole("heading", { level: 1, name: "Services" })).toBeInTheDocument();
});

test("renders the directory page", () => {
  renderAt("/directory");
  expect(screen.getByRole("heading", { level: 1, name: "Directory" })).toBeInTheDocument();
});

test("renders the entry page", () => {
  renderAt("/entry/example");
  expect(screen.getByRole("heading", { level: 1, name: "Service entry" })).toBeInTheDocument();
});
