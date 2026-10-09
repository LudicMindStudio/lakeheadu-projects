// Renders authored text as paragraphs, split on blank lines.
export default function Prose({ text, className }) {
  const classes = ["prose", className].filter(Boolean).join(" ");
  return text.split("\n\n").map((paragraph, index) => (
    <p key={index} className={classes}>
      {paragraph}
    </p>
  ));
}
