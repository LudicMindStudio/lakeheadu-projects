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
  expect(screen.getByRole("heading", { level: 1, name: "Framework" })).toBeInTheDocument();
});

test("renders the service page", () => {
  renderAt("/evaluate");
  expect(screen.getByRole("heading", { level: 1, name: "Evaluate" })).toBeInTheDocument();
});
