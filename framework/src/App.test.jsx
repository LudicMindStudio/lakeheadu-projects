import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import App from "./App.jsx";
import { domains } from "./content.js";

function renderAt(path) {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return view;
}

test("renders the landing page with the wheel and the start button", () => {
  const { container } = renderAt("/");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    /evaluating a digital mental health technology/i,
  );
  const wheel = within(container.querySelector('[data-variant="wheel"]'));
  expect(wheel.getByRole("link", { name: /Type of technology — part 1 of 3/ })).toHaveAttribute(
    "href",
    "/evaluate",
  );
  expect(
    wheel.getByRole("link", { name: /Quality of technology — part 2 of 3/ }),
  ).toHaveAttribute("href", "/evaluate/quality");
  expect(
    wheel.getByRole("link", { name: /User considerations — part 3 of 3/ }),
  ).toHaveAttribute("href", "/evaluate/user-considerations");
  expect(screen.getByRole("button", { name: "Begin" })).toBeInTheDocument();
  expect(screen.getByText(/no wrong answers/i)).toBeInTheDocument();
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

test("begin opens the first part", () => {
  renderAt("/");
  fireEvent.click(screen.getByRole("button", { name: "Begin" }));
  expect(screen.getByText(`Part 1 of ${domains.length}`)).toBeInTheDocument();
});

test("clicking a wheel wedge opens that part", () => {
  const { container } = renderAt("/");
  const wheel = within(container.querySelector('[data-variant="wheel"]'));
  fireEvent.click(wheel.getByRole("link", { name: /Quality of technology — part 2 of 3/ }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    domains.find((domain) => domain.key === "quality").name,
  );
});

test("the current part is marked in both renders of the parts nav", () => {
  const { container } = renderAt("/evaluate/quality");
  const currents = container.querySelectorAll('[aria-current="page"]');
  expect(currents.length).toBe(2); // the wheel and the narrow-screen bar
  for (const element of currents) {
    expect(element.getAttribute("aria-label")).toContain("Quality of technology");
  }
});

test("unknown domains fall back to the hub field", () => {
  const { container } = renderAt("/nope");
  expect(container.querySelector(".app").getAttribute("data-field")).toBe("hub");
});

test("each part page sits in its own color field", () => {
  const quality = renderAt("/evaluate/quality");
  expect(quality.container.querySelector(".app").getAttribute("data-field")).toBe("p2");
  const user = renderAt("/evaluate/user-considerations");
  expect(user.container.querySelector(".app").getAttribute("data-field")).toBe("p3");
});
