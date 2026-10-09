import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <>
      <h1>Services</h1>
      <p className="muted">Placeholder content.</p>
      <p>
        <Link to="/directory">Browse</Link>
      </p>
    </>
  );
}
