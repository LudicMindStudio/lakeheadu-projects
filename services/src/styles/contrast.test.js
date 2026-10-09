// @vitest-environment node

// Contrast gates: every text pair used in the app holds 4.5:1 or better.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FILTER_GROUPS } from "../data/filters.js";

const css = readFileSync(fileURLToPath(new URL("./base.css", import.meta.url)), "utf8");

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  expect(match, `token --${name} is missing`).toBeTruthy();
  return match[1];
}

function luminance(hex) {
  const channel = (value) => {
    const c = parseInt(value, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(hex.slice(1, 3));
  const g = channel(hex.slice(3, 5));
  const b = channel(hex.slice(5, 7));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const CONCERNS = FILTER_GROUPS.find((group) => group.id === "concerns").options;

describe("contrast gates", () => {
  for (const option of CONCERNS) {
    it(`category ${option.value} holds 4.5:1 on its wash`, () => {
      const pair = ratio(token(`cat-${option.value}-ink`), token(`cat-${option.value}-wash`));
      expect(pair).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const status of ["accepting", "call", "wait"]) {
    it(`status ${status} holds 4.5:1 on its wash`, () => {
      const pair = ratio(token(`status-${status}-ink`), token(`status-${status}-wash`));
      expect(pair).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("core text pairs hold 4.5:1", () => {
    expect(ratio(token("ink"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("ink-soft"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("muted"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("accent"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("accent-ink"), token("accent-tint"))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(token("danger-ink"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
