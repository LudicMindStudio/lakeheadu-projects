import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import App from "./App.jsx";

// The map itself runs in a real browser (MapLibre + WebGL). These tests
// cover everything layered over it.
vi.mock("./components/map/MapCanvas.jsx", () => ({
  default: function MockMapCanvas() {
    return null;
  },
}));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test("lands on the map with the promise, search, and counted categories", async () => {
  renderAt("/");
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: /Find services across Northwestern Ontario/,
    }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Search services")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Anxiety, 9 services/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All services" })).toBeInTheDocument();
});

test("typing in the intro search recedes the intro and narrows the rail", async () => {
  renderAt("/");
  const search = await screen.findByLabelText("Search services");
  fireEvent.change(search, { target: { value: "Kenora" } });
  expect(await screen.findByText("1 of 12 services")).toBeInTheDocument();
  expect(screen.getByText("Individual Counselling")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
});

test("a category chip recedes and narrows the results", async () => {
  renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: /Anxiety, 9 services/ }));
  expect(await screen.findByText("9 of 12 services")).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(9);
});

test("filters narrow the rail and chips remove them", async () => {
  renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "All services" }));
  expect(await screen.findByText("12 services")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  fireEvent.click(screen.getByLabelText("By phone"));
  expect(await screen.findByText("1 of 12 services")).toBeInTheDocument();
  expect(screen.getByText("Peer Support Line")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Remove filter: By phone" }));
  expect(await screen.findByText("12 services")).toBeInTheDocument();
});

test("empty state clears back to the full list", async () => {
  renderAt("/");
  const search = await screen.findByLabelText("Search services");
  fireEvent.change(search, { target: { value: "zzzz" } });
  expect(await screen.findByText("No services match your search.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
  expect(await screen.findByText("12 services")).toBeInTheDocument();
});

test("closest first asks for a town and reports distances", async () => {
  renderAt("/");
  fireEvent.click(await screen.findByRole("button", { name: "All services" }));
  fireEvent.change(await screen.findByLabelText(/Sort/), { target: { value: "closest" } });
  expect(screen.getByText("Choose a town to sort by distance.")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Closest to/), { target: { value: "Kenora" } });
  const first = (await screen.findAllByRole("listitem"))[0];
  expect(first).toHaveTextContent("Individual Counselling");
  expect(first).toHaveTextContent("In Kenora");
});

test("opens a service entry with the first step leading", async () => {
  renderAt("/entry/kestrel-app");
  expect(await screen.findByRole("heading", { level: 1, name: "Kestrel App" })).toBeInTheDocument();
  expect(screen.getByText("Your first step")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Download the Kestrel app and start the first module with no referral needed.",
    ),
  ).toBeInTheDocument();
  expect(screen.getByText("September 22, 2026")).toBeInTheDocument();
});

test("closing the entry returns to the browsed map", async () => {
  renderAt("/entry/kestrel-app");
  fireEvent.click(await screen.findByRole("button", { name: "Close service details" }));
  expect(await screen.findByText("12 services")).toBeInTheDocument();
});

test("shows a not-found card for an unknown entry", async () => {
  renderAt("/entry/unknown-slug");
  expect(
    await screen.findByRole("heading", { level: 1, name: "Service not found" }),
  ).toBeInTheDocument();
});

test("shows the not-found page for unknown routes", async () => {
  renderAt("/nope");
  expect(
    await screen.findByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeInTheDocument();
});

test("the old directory route redirects to the map", async () => {
  renderAt("/directory");
  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: /Find services across Northwestern Ontario/,
    }),
  ).toBeInTheDocument();
});
