import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="page-inner">
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <p>
          <Link to="/">Back to the map</Link>
        </p>
      </div>
      <footer className="page-footer">Sample listings, not real services yet.</footer>
    </div>
  );
}
