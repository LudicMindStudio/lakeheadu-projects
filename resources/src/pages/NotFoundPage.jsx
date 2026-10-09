import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found · Resources & tools";
  }, []);

  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <p className="not-found-action">
        <Link className="button-secondary" to="/browse">
          Browse resources
        </Link>
      </p>
    </div>
  );
}
