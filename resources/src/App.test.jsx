import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { expect, test, vi } from "vitest";
import App from "./App.jsx";
import { ENTRIES } from "./lib/entries.js";

const TOTAL = ENTRIES.length;

function LocationSpy() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationSpy />
    </MemoryRouter>,
  );
}

function stage(view) {
  return view.container.querySelector(".stage");
}

// The grid: ring, morph, and list

test("the grid opens as a ring on a fresh visit", () => {
  const view = renderAt("/");
  expect(stage(view).dataset.state).toBe("ring");
  expect(screen.getByRole("heading", { level: 1, name: "Resources & tools" })).toBeInTheDocument();
  expect(screen.getByText(/in one searchable place/)).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(8);
  expect(screen.getByRole("link", { name: "Browse everything" })).toBeInTheDocument();
  expect(screen.getByLabelText("Search resources")).toBeInTheDocument();
});

test("typing morphs the ring into the list and captures the query", () => {
  const view = renderAt("/");
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "sleep" } });
  expect(stage(view).dataset.state).toBe("list");
  expect(screen.getByRole("status")).toHaveTextContent(`2 of ${TOTAL} resources`);
  expect(screen.getByTestId("location")).toHaveTextContent("q=sleep");
});

test("clearing the search returns to the ring", () => {
  const view = renderAt("/");
  const input = screen.getByLabelText("Search resources");
  fireEvent.change(input, { target: { value: "sleep" } });
  expect(stage(view).dataset.state).toBe("list");
  fireEvent.change(input, { target: { value: "" } });
  expect(stage(view).dataset.state).toBe("ring");
  expect(screen.getByText(/in one searchable place/)).toBeInTheDocument();
  expect(screen.getByTestId("location")).not.toHaveTextContent("q=");
});

test("clearing the search keeps the list while a filter is active", () => {
  const view = renderAt("/?q=sleep&kind=tool");
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "" } });
  expect(stage(view).dataset.state).toBe("list");
  expect(screen.getByTestId("location")).toHaveTextContent("kind=tool");
  expect(screen.getByTestId("location")).not.toHaveTextContent("q=");
});

test("clearing the last filter returns to the ring", () => {
  const view = renderAt("/?kind=video");
  expect(stage(view).dataset.state).toBe("list");
  fireEvent.click(screen.getByRole("button", { name: "Remove filter: Videos" }));
  expect(stage(view).dataset.state).toBe("ring");
  expect(screen.getByTestId("location")).not.toHaveTextContent("kind=");
});

test("a fresh arrival opens the ring again", () => {
  const first = renderAt("/");
  fireEvent.change(screen.getByLabelText("Search resources"), { target: { value: "sleep" } });
  first.unmount();

  const second = renderAt("/");
  expect(stage(second).dataset.state).toBe("ring");
});

test("the ring's browse link opens the list at /browse", () => {
  const view = renderAt("/");
  fireEvent.click(screen.getByRole("link", { name: "Browse everything" }));
  expect(screen.getByTestId("location")).toHaveTextContent("/browse");
  expect(stage(view).dataset.state).toBe("list");
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
});

test("browse opens the list directly", () => {
  const view = renderAt("/browse");
  expect(stage(view).dataset.state).toBe("list");
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings).toHaveLength(TOTAL);
  expect(headings[0]).toHaveTextContent("Sleep Habits Check-In");
  expect(headings[TOTAL - 1]).toHaveTextContent("Northwood Calm for Teens");
});

test("the header carries the sample marker", () => {
  renderAt("/");
  expect(screen.getByText("Sample content", { selector: ".sample-pill" })).toBeInTheDocument();
});

// Searching, filters, sorting

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

// Cards and entries

test("a card opens its details in place", () => {
  renderAt("/browse");
  const card = screen
    .getByRole("heading", { level: 2, name: /Sleep Habits Check-In/ })
    .closest(".card");
  const toggle = within(card).getByRole("button", { name: "Show details" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(toggle);
  expect(within(card).getByRole("button", { name: "Hide details" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(within(card).getByRole("link", { name: "More" })).toBeInTheDocument();
  expect(card.querySelector(".card-sample")).toBeNull();
  expect(card.textContent).not.toContain("Sample entry");
});

test("a two-second hover opens the card, and closing turns hover off", () => {
  vi.useFakeTimers();
  try {
    renderAt("/browse");
    const card = screen
      .getByRole("heading", { level: 2, name: /Sleep Habits Check-In/ })
      .closest(".card");

    // A hover shorter than two seconds leaves the card closed.
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    fireEvent.mouseLeave(card);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(within(card).getByRole("button", { name: "Show details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Two full seconds open it, and it stays open.
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    fireEvent.mouseLeave(card);
    expect(within(card).getByRole("button", { name: "Hide details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Closing it by hand turns hover-open off for the card.
    fireEvent.click(within(card).getByRole("button", { name: "Hide details" }));
    expect(within(card).getByRole("button", { name: "Show details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(within(card).getByRole("button", { name: "Show details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  } finally {
    vi.useRealTimers();
  }
});

test("every card leads to its full page", () => {
  renderAt("/browse?q=sleep");
  const card = screen.getByRole("heading", { level: 2, name: /Harbourlight/ }).closest(".card");
  expect(card.querySelector(".card-media img, .card-media video")).toBeTruthy();
  expect(within(card).getByRole("link", { name: /Harbourlight/ })).toHaveAttribute(
    "href",
    "/entry/harbourlight-app?q=sleep",
  );
});

test("an entry page carries the way back to the search", () => {
  renderAt("/entry/sleep-habits-check-in?q=sleep");
  expect(
    screen.getByRole("heading", { level: 1, name: "Sleep Habits Check-In" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to the list" })).toHaveAttribute(
    "href",
    "/?q=sleep",
  );
  expect(document.querySelector(".sample-note").textContent).toContain("Sample content.");
});

test("an entry with a clip embeds the player and its banner", () => {
  const view = renderAt("/entry/how-apps-track-mood");
  const videos = view.container.querySelectorAll("video");
  expect(videos).toHaveLength(2);
  expect(view.container.querySelector(".embed-video")).toBeTruthy();
  expect(view.container.querySelector(".entry-hero video")).toBeTruthy();
  expect(screen.getByText("The full explainer")).toBeInTheDocument();
});

test("an entry with a document embeds the viewer", () => {
  const view = renderAt("/entry/sleep-habits-check-in");
  const frame = view.container.querySelector(".embed-frame-doc");
  expect(frame.tagName).toBe("OBJECT");
  expect(frame.getAttribute("data")).toBe("/media/docs/sleep-habits-check-in.pdf");
  expect(frame.getAttribute("title")).toBe("The check-in page");
  expect(frame.querySelector("a").getAttribute("href")).toBe(
    "/media/docs/sleep-habits-check-in.pdf",
  );
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

// Management

test("the admin page says plainly when the server is away", async () => {
  renderAt("/admin");
  expect(await screen.findByText(/management server is not running/i)).toBeInTheDocument();
});

test("the admin page signs in, lists entries, and opens the editor", async () => {
  let authed = false;
  const respond = (data, status = 200) => ({
    ok: status < 400,
    status,
    headers: { get: () => "application/json" },
    json: async () => data,
  });
  globalThis.fetch = async (path, options = {}) => {
    if (path === "/api/auth/status") return respond({ authed, configured: true });
    if (path === "/api/auth/login" && options.method === "POST") {
      authed = true;
      return respond({ ok: true });
    }
    if (path === "/api/entries") {
      return respond({
        entries: [
          {
            id: "alpha-entry",
            title: "Alpha Entry",
            format: "video",
            source: "Open Lens Media",
            added_date: "2025-01-01",
          },
        ],
      });
    }
    return respond({ error: "not mocked" }, 404);
  };

  const view = renderAt("/admin");
  const password = await screen.findByLabelText("Password");
  fireEvent.change(password, { target: { value: "hunter-two" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Alpha Entry")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add entry" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Add entry" }));
  expect(screen.getByLabelText("Title")).toBeInTheDocument();
  expect(screen.getByText("Banner media")).toBeInTheDocument();
  expect(screen.getByText("Embedded media")).toBeInTheDocument();
  expect(view.container.querySelector(".admin-fields")).toBeTruthy();
});
