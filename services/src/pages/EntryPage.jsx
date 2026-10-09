import { useParams } from "react-router-dom";

export default function EntryPage() {
  const { slug } = useParams();

  return (
    <>
      <h1>Service entry</h1>
      <p className="muted">Entry: {slug}</p>
    </>
  );
}
