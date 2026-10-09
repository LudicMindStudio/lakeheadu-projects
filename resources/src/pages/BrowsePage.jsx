import { Link } from "react-router-dom";

export default function BrowsePage() {
  return (
    <>
      <h1>Browse</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/entry/example">Example entry</Link>
      </p>
    </>
  );
}
