import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <>
      <h1>Resources</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/browse">Browse</Link>
      </p>
    </>
  );
}
