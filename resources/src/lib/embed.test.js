import { describe, expect, test } from "vitest";
import { resolveEmbed } from "./embed.js";

describe("embed resolution", () => {
  test("keeps local files as they are", () => {
    expect(resolveEmbed({ kind: "video", url: "/media/video/x.mp4" })).toEqual({
      mode: "video",
      src: "/media/video/x.mp4",
    });
    expect(resolveEmbed({ kind: "pdf", url: "/media/docs/x.pdf" })).toEqual({
      mode: "pdf",
      src: "/media/docs/x.pdf",
    });
  });

  test("converts common video host links to players", () => {
    expect(resolveEmbed({ kind: "video", url: "https://youtu.be/abc123XYZ" }).src).toBe(
      "https://www.youtube-nocookie.com/embed/abc123XYZ",
    );
    expect(
      resolveEmbed({ kind: "video", url: "https://www.youtube.com/watch?v=abc123XYZ" }).src,
    ).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ");
    expect(resolveEmbed({ kind: "video", url: "https://vimeo.com/123456" }).src).toBe(
      "https://player.vimeo.com/video/123456",
    );
  });

  test("falls back to a plain link, and to nothing at all", () => {
    expect(resolveEmbed({ kind: "video", url: "https://example.com/media" }).mode).toBe("link");
    expect(resolveEmbed(null)).toBeNull();
    expect(resolveEmbed({ kind: "video", url: "" })).toBeNull();
  });
});
