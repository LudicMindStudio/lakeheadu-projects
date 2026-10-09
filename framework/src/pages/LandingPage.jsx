import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <>
      <h1>Framework</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/evaluate">Start</Link>
      </p>
    </>
  );
}
