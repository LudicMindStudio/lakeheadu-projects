import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <p>
        <Link to="/directory">Go to the directory</Link>
      </p>
    </>
  );
}
