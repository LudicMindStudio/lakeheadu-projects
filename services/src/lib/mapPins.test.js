import { describe, expect, it } from "vitest";
import { fanIndices, fanOffset, fanScale } from "./mapPins.js";

describe("map pin fan", () => {
  it("numbers pins within their town group, in data order", () => {
    const entries = [
      { slug: "a", region: "Thunder Bay" },
      { slug: "b", region: "Kenora" },
      { slug: "c", region: "Thunder Bay" },
      { slug: "d", region: "Thunder Bay" },
    ];
    const indices = fanIndices(entries);
    expect(indices.get("a")).toBe(0);
    expect(indices.get("c")).toBe(1);
    expect(indices.get("d")).toBe(2);
    expect(indices.get("b")).toBe(0);
  });

  it("gives every slot a distinct offset, with the first at rest", () => {
    const offsets = [0, 1, 2, 3].map((index) => fanOffset(index));
    expect(offsets[0]).toEqual([0, 0]);
    const seen = new Set(offsets.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`));
    expect(seen.size).toBe(4);
  });

  it("eases the fan out above town scale", () => {
    expect(fanScale(6.5)).toBe(1);
    expect(fanScale(9.3)).toBeGreaterThan(0);
    expect(fanScale(9.3)).toBeLessThan(1);
    expect(fanScale(10.4)).toBe(0);
  });
});
