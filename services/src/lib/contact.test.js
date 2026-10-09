import { describe, expect, it } from "vitest";
import { composeContact, splitContact } from "./contact.js";

describe("contact line", () => {
  it("joins the channel and the number", () => {
    expect(composeContact("Phone", "807-555-0121")).toBe("Phone · 807-555-0121");
  });

  it("keeps a single part when one side is empty", () => {
    expect(composeContact("Front desk", "")).toBe("Front desk");
    expect(composeContact("", "807-555-0121")).toBe("807-555-0121");
    expect(composeContact("  ", "  ")).toBe("");
  });

  it("splits a composed line back into its parts", () => {
    expect(splitContact("Phone · 807-555-0121")).toEqual({
      text: "Phone",
      value: "807-555-0121",
    });
  });

  it("leaves a legacy single-part line in the text side", () => {
    expect(splitContact("Call the intake line at 807-555-0121")).toEqual({
      text: "Call the intake line at 807-555-0121",
      value: "",
    });
  });

  it("round-trips", () => {
    const line = composeContact("Text", "807-555-0112");
    const parts = splitContact(line);
    expect(composeContact(parts.text, parts.value)).toBe(line);
  });
});
