import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { expect, test, vi } from "vitest";
import App from "./App.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import { ENTRIES } from "./lib/entries.js";
import { EntriesContext } from "./lib/useEntries.js";

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
  expect(view.container.querySelector(".masthead-notes")).toBeNull();
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

test("browse opens the list directly", () => {
  const view = renderAt("/browse");
  expect(stage(view).dataset.state).toBe("list");
  expect(screen.getByRole("status")).toHaveTextContent(`${TOTAL} resources`);
  const headings = screen.getAllByRole("heading", { level: 2 });
  expect(headings).toHaveLength(TOTAL);
  expect(headings[0]).toHaveTextContent("Sleep Habits Check-In");
  expect(headings[TOTAL - 1]).toHaveTextContent("Northwood Calm for Teens");
});

test("the header carries a visible way into managing entries", () => {
  renderAt("/");
  const manage = document.querySelector(".app-header .manage-button");
  expect(manage).toHaveAttribute("href", "/admin");
  expect(manage).toHaveTextContent("Manage entries");
  expect(document.querySelector(".sample-pill")).toBeNull();
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

test("a half-second hover opens the card, and closing turns hover off", () => {
  vi.useFakeTimers();
  try {
    renderAt("/browse");
    const card = screen
      .getByRole("heading", { level: 2, name: /Sleep Habits Check-In/ })
      .closest(".card");

    // A hover shorter than half a second leaves the card closed.
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.mouseLeave(card);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(within(card).getByRole("button", { name: "Show details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Half a second opens it, and it stays open.
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(600);
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
  const back = screen.getByRole("link", { name: "Back to the list" });
  expect(back).toHaveAttribute("href", "/?q=sleep");
  expect(back).toHaveClass("back-button");
  expect(document.querySelector(".sample-note")).toBeNull();
});

test("an entry with a clip embeds the player and its banner", () => {
  const view = renderAt("/entry/how-apps-track-mood");
  const videos = view.container.querySelectorAll("video");
  expect(videos).toHaveLength(2);
  expect(view.container.querySelector(".embed-video")).toBeTruthy();
  expect(view.container.querySelector(".entry-hero video")).toBeTruthy();
  expect(screen.getByText("The full explainer")).toBeInTheDocument();
});

test("an entry with several media items renders each one in order", () => {
  const multi = {
    id: "multi",
    title: "Multi Media Entry",
    format: "video",
    collection: null,
    source: "Test Source",
    url: null,
    description: "An entry with more than one piece of media.",
    age_groups: ["all-ages"],
    tags: ["media"],
    published_date: null,
    added_date: "2025-01-01",
    banner: null,
    embeds: [
      { kind: "video", url: "/media/video/one.mp4", title: "The clip" },
      { kind: "pdf", url: "/media/docs/two.pdf", title: "The document" },
    ],
  };
  const view = render(
    <MemoryRouter initialEntries={["/entry/multi"]}>
      <EntriesContext.Provider value={[multi]}>
        <Routes>
          <Route path="/entry/:id" element={<EntryPage />} />
        </Routes>
      </EntriesContext.Provider>
    </MemoryRouter>,
  );
  const items = view.container.querySelectorAll(".embed-item");
  expect(items).toHaveLength(2);
  expect(items[0].querySelector(".embed-video")).toBeTruthy();
  expect(items[0].textContent).toContain("The clip");
  expect(items[1].querySelector(".embed-frame-doc")).toBeTruthy();
  expect(items[1].textContent).toContain("The document");
  expect(view.container.querySelector(".entry-hero .entry-media-plain")).toBeTruthy();
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

test("entry quick banner shows age, dates, and topics", () => {
  renderAt("/entry/sleep-habits-check-in");
  const quick = document.querySelector(".entry-quick");
  expect(quick).toBeTruthy();
  expect(quick).toHaveTextContent("All ages");
  expect(quick).toHaveTextContent("Aug 2025");
  expect(quick).toHaveTextContent("sleep");
  expect(quick).not.toHaveTextContent("Published");
  expect(document.querySelector(".entry-meta")).toBeNull();
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

function mockAdminApi(overrides = {}) {
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
    if (path === "/api/uploads" && options.method === "POST") {
      return respond(overrides.upload ?? { src: "/uploads/shot-abc.png" }, 201);
    }
    return respond({ error: "not mocked" }, 404);
  };
}

async function signIn() {
  const password = await screen.findByLabelText("Password");
  fireEvent.change(password, { target: { value: "hunter-two" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByRole("button", { name: "Add entry" });
}

test("the admin page says plainly when the server is away", async () => {
  renderAt("/admin");
  expect(await screen.findByText(/management server is not running/i)).toBeInTheDocument();
});

test("the admin page signs in, lists entries, and opens the editor", async () => {
  mockAdminApi();
  const view = renderAt("/admin");
  await signIn();
  expect(screen.getByText("Alpha Entry")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Add entry" }));
  expect(screen.getByLabelText("Title")).toBeInTheDocument();
  expect(screen.getByText("Banner media")).toBeInTheDocument();
  expect(screen.getByText("Embedded media")).toBeInTheDocument();
  expect(view.container.querySelector(".admin-fields")).toBeTruthy();
});

test("the editor derives the id from the title, with a manual override", async () => {
  mockAdminApi();
  renderAt("/admin");
  await signIn();
  fireEvent.click(screen.getByRole("button", { name: "Add entry" }));

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Sleep and Screen Time" },
  });
  const id = screen.getByLabelText("Id");
  expect(id).toHaveValue("sleep-and-screen-time");
  expect(id).toHaveAttribute("readonly");

  fireEvent.click(screen.getByRole("button", { name: "Set manually" }));
  expect(id).not.toHaveAttribute("readonly");
  fireEvent.change(id, { target: { value: "custom-id" } });
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Something else" } });
  expect(id).toHaveValue("custom-id");
});

test("the editor uploads a banner image to the server", async () => {
  mockAdminApi();
  renderAt("/admin");
  await signIn();
  fireEvent.click(screen.getByRole("button", { name: "Add entry" }));

  fireEvent.change(screen.getByLabelText("Kind"), { target: { value: "image" } });
  const file = new File(["png-bytes"], "shot.png", { type: "image/png" });
  fireEvent.change(document.querySelector("input[type='file']"), {
    target: { files: [file] },
  });
  expect(await screen.findByText("shot-abc.png")).toBeInTheDocument();
});

test("embedded media is a list the editor can keep adding to", async () => {
  mockAdminApi();
  renderAt("/admin");
  await signIn();
  fireEvent.click(screen.getByRole("button", { name: "Add entry" }));

  expect(screen.getByText(/No embedded media yet/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add media" }));
  fireEvent.click(screen.getByRole("button", { name: "Add media" }));
  expect(document.querySelectorAll(".admin-media-row")).toHaveLength(2);
  fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
  expect(document.querySelectorAll(".admin-media-row")).toHaveLength(1);
});
