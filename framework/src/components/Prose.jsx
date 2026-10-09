// Renders authored text as paragraphs. A blank line in the source splits
// paragraphs; the build joins each paragraph's lines into one string.
export default function Prose({ text, className }) {
  const classes = ["prose", className].filter(Boolean).join(" ");
  return text.split("\n\n").map((paragraph, index) => (
    <p key={index} className={classes}>
      {paragraph}
    </p>
  ));
}
