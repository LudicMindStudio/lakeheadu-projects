import { Link } from "react-router-dom";

export default function DirectoryPage() {
  return (
    <>
      <h1>Directory</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/entry/example">Example entry</Link>
      </p>
    </>
  );
}
