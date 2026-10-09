// Embed resolution for entry media. Sample entries point at local files. The
// same fields can carry a pasted link to a file or a common video host.

export function resolveEmbed(embed) {
  if (!embed || !embed.url) return null;
  const { url, kind } = embed;

  if (kind === "pdf") return { mode: "pdf", src: url };

  if (kind === "video") {
    if (/\.(mp4|webm|ogv|ogg|mov|m4v)([?#]|$)/i.test(url)) return { mode: "video", src: url };
    const youtube = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
    );
    if (youtube)
      return { mode: "iframe", src: `https://www.youtube-nocookie.com/embed/${youtube[1]}` };
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return { mode: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
    return { mode: "link", src: url };
  }

  return { mode: "link", src: url };
}
