import { fireEvent, render, screen } from "@testing-library/react";
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

test("renders the landing page with the promise and a way in", () => {
  renderAt("/");
  expect(
    screen.getByRole("heading", { level: 1, name: /Find services across Northwestern Ontario/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse services" })).toHaveAttribute(
    "href",
    "/directory",
  );
});

test("lists all sample services on the directory page", () => {
  renderAt("/directory");
  expect(screen.getByRole("heading", { level: 1, name: "Find services" })).toBeInTheDocument();
  expect(screen.getByText("12 services")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
  expect(screen.getByText("Sample listings, not real services yet.")).toBeInTheDocument();
});

test("search narrows the list", () => {
  renderAt("/directory");
  fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "Kenora" } });
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Individual Counselling")).toBeInTheDocument();
  expect(screen.getByText("1 of 12 services")).toBeInTheDocument();
});

test("filters narrow the list and chips remove them", () => {
  renderAt("/directory");
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  fireEvent.click(screen.getByLabelText("By phone"));
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("Peer Support Line")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Remove filter: By phone" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
});

test("empty state clears back to the full list", () => {
  renderAt("/directory");
  fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "zzzz" } });
  expect(screen.getByText("No services match your search.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(12);
});

test("closest-first mode asks for a town and reports distances", () => {
  renderAt("/directory");
  fireEvent.change(screen.getByLabelText(/Sort by/), { target: { value: "closest" } });
  expect(screen.getByText("Choose a town to sort by distance.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Closest to/), { target: { value: "Kenora" } });
  const first = screen.getAllByRole("listitem")[0];
  expect(first).toHaveTextContent("Individual Counselling");
  expect(first).toHaveTextContent("In Kenora");
});

test("opens a service entry with the first step leading", () => {
  renderAt("/entry/kestrel-app");
  expect(screen.getByRole("heading", { level: 1, name: "Kestrel App" })).toBeInTheDocument();
  expect(
    screen.getByText(
      "Download the Kestrel app and start the first module with no referral needed.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("September 22, 2026")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Back to the directory/ })).toBeInTheDocument();
});

test("shows a not-found message for an unknown entry", () => {
  renderAt("/entry/unknown-slug");
  expect(screen.getByRole("heading", { level: 1, name: "Service not found" })).toBeInTheDocument();
});

test("shows the not-found page for unknown routes", () => {
  renderAt("/nope");
  expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
});
