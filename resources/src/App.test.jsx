import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, test } from "vitest";
import App from "./App.jsx";
import { ENTRIES } from "./lib/entries.js";

const TOTAL = ENTRIES.length;

function LocationSpy() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationSpy />
    </MemoryRouter>,
  );
}

test("landing page leads to browse", () => {
  renderAt("/");
  expect(screen.getByRole("heading", { level: 1, name: "Resources & tools" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse resources" })).toHaveAttribute("href", "/browse");
});

test("every surface carries the sample marker", () => {
  renderAt("/");
  expect(screen.getByText("Sample content", { selector: ".sample-pill" })).toBeInTheDocument();
});

test("browse lists every sample entry, newest first", () => {
  renderAt("/browse");
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings).toHaveLength(TOTAL);
  expect(headings[0]).toHaveTextContent("Sleep Habits Check-In");
  expect(headings[TOTAL - 1]).toHaveTextContent("Northwood Calm for Teens");
});

test("search narrows, highlights, and keeps the query in the field", () => {
  renderAt("/browse?q=sleep");
  expect(screen.getByRole("status")).toHaveTextContent(`2 of ${TOTAL} resources`);
  expect(screen.getByLabelText("Search resources")).toHaveValue("sleep");
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings[0]).toHaveTextContent("Harbourlight — Mood and Sleep Journal");
  expect(document.querySelectorAll("mark").length).toBeGreaterThan(0);
});

test("typing updates the address", () => {
  renderAt("/browse");
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "anxiety" } });
  expect(screen.getByTestId("location")).toHaveTextContent("q=anxiety");
  expect(screen.getByRole("status")).toHaveTextContent(`2 of ${TOTAL} resources`);
});

test("clearing the query also ends an explicit sort choice", () => {
  renderAt("/browse?q=sleep&sort=newest");
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "" } });
  const location = screen.getByTestId("location");
  expect(location).not.toHaveTextContent("q=");
  expect(location).not.toHaveTextContent("sort=");
});

test("filters collect as removable chips", () => {
  renderAt("/browse?kind=video");
  expect(screen.getByRole("status")).toHaveTextContent(`1 of ${TOTAL} resources`);
  fireEvent.click(screen.getByRole("button", { name: "Remove filter: Videos" }));
  expect(screen.queryByRole("button", { name: "Remove filter: Videos" })).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
});

test("the filters control carries the active count", () => {
  renderAt("/browse?kind=video&who=under-18");
  expect(screen.getByRole("button", { name: "Filters (2)" })).toBeInTheDocument();
});

test("best match is available only while searching", () => {
  renderAt("/browse");
  const select = screen.getByRole("combobox", { name: "Sort" });
  expect(within(select).getByRole("option", { name: "Best match" })).toBeDisabled();
});

test("opening the panel shows live counts and toggles filters", () => {
  renderAt("/browse");
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  const panel = document.getElementById("filters-panel");
  expect(panel).not.toHaveAttribute("hidden");
  expect(within(panel).getByText("What kind of resource?")).toBeInTheDocument();
  const videoRow = within(panel).getByRole("checkbox", { name: "Videos" }).closest("label");
  expect(videoRow.querySelector(".filter-count")).toHaveTextContent("1");
  fireEvent.click(within(panel).getByRole("checkbox", { name: "Videos" }));
  expect(screen.getByTestId("location")).toHaveTextContent("kind=video");
});

test("empty state offers a way out", () => {
  renderAt("/browse?kind=podcast&who=65-plus");
  expect(screen.getByText("No matches yet.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
});

test("an entry page carries the way back to the search", () => {
  renderAt("/entry/sleep-habits-check-in?q=sleep");
  expect(
    screen.getByRole("heading", { level: 1, name: "Sleep Habits Check-In" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to browse" })).toHaveAttribute(
    "href",
    "/browse?q=sleep",
  );
  expect(document.querySelector(".sample-note").textContent).toContain("Sample content.");
});

test("entry meta shows age, dates, and topics", () => {
  renderAt("/entry/sleep-habits-check-in");
  expect(screen.getByText("Who it’s for")).toBeInTheDocument();
  expect(screen.getByText("All ages")).toBeInTheDocument();
  expect(screen.getByText("Aug 2025")).toBeInTheDocument();
  expect(screen.queryByText("Published")).toBeNull();
});

test("apps show the collection they are listed in", () => {
  renderAt("/entry/stillbrook-app");
  expect(screen.getByText("Listed in")).toBeInTheDocument();
  expect(screen.getByText("MHCC mHealth directory")).toBeInTheDocument();
});

test("unknown entry shows a quiet not-found", () => {
  renderAt("/entry/nope");
  expect(screen.getByRole("heading", { level: 1, name: "Entry not found" })).toBeInTheDocument();
});

test("unknown route shows the not-found page", () => {
  renderAt("/nowhere");
  expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
});
