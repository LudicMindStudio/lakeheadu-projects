import { familyFor } from "../lib/entries.js";
import { useReducedMotion } from "../lib/motion.js";

// The media block for an entry: the banner clip or image where one exists,
// otherwise a quiet gradient in the entry's format color.
export default function EntryMedia({ entry, className = "" }) {
  const reduced = useReducedMotion();
  const banner = entry?.banner;
  const plain =
    `entry-media entry-media-plain plain-${familyFor(entry?.format)} ${className}`.trim();

  if (!banner?.src) return <span className={plain} aria-hidden="true" />;

  if (banner.kind === "video" && !reduced) {
    return (
      <video
        className={`entry-media ${className}`.trim()}
        src={banner.src}
        poster={banner.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={banner.alt || entry.title}
      />
    );
  }

  const src = banner.kind === "video" ? banner.poster : banner.src;
  if (!src) return <span className={plain} aria-hidden="true" />;
  return (
    <img className={`entry-media ${className}`.trim()} src={src} alt={banner.alt || entry.title} />
  );
}
