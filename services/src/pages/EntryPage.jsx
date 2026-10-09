import { useParams } from "react-router-dom";

export default function EntryPage() {
  const { id } = useParams();

  return (
    <>
      <h1>Service entry</h1>
      <p className="muted">Entry: {id}</p>
    </>
  );
}
