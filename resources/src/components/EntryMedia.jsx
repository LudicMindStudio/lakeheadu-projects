import { useReducedMotion } from "../lib/motion.js";

// The card or hero media for an entry: a clip where one exists, otherwise the
// banner image. Under reduced motion the poster stands in for the clip.
export default function EntryMedia({ entry, className = "" }) {
  const reduced = useReducedMotion();
  const banner = entry?.banner;

  if (!banner?.src) return null;

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
  if (!src) return null;
  return <img className={`entry-media ${className}`.trim()} src={src} alt={banner.alt ?? ""} />;
}
