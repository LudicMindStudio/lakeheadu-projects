import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing">
      <h1>Find services across Northwestern Ontario, and the first step to get started.</h1>
      <p className="lede">
        Browse services across the region. See what each one offers, what it costs, and how to get
        started.
      </p>
      <p className="landing-action">
        <Link className="btn" to="/directory">
          Browse services
        </Link>
      </p>
    </div>
  );
}
