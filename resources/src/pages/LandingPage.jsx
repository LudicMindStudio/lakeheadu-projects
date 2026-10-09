import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  useEffect(() => {
    document.title = "Resources & tools";
  }, []);

  return (
    <section className="landing">
      <h1>Resources &amp; tools</h1>
      <p className="lede">
        Find trusted resources and tools on digital mental health technology. Browse libraries,
        lesson plans, videos, podcasts, articles, and checklists in one searchable place.
      </p>
      <p className="landing-cta">
        <Link className="button" to="/browse">
          Browse resources
        </Link>
      </p>
    </section>
  );
}
