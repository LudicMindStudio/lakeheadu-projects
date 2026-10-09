import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <>
      <h1>Resources</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/entry/example">Example entry</Link>
      </p>
    </>
  );
}
