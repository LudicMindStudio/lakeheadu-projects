import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <article className="landing">
      <h1>Evaluating a digital mental health technology?</h1>
      <p className="lead">
        A short, guided way to weigh its safety and usefulness — for yourself, or for the people you
        support.
      </p>
      <ol className="how">
        <li>Say what you're evaluating.</li>
        <li>Answer questions about its quality and about the person using it.</li>
        <li>Get guidance you can act on.</li>
      </ol>
      <p className="cta">
        <Link className="button" to="/evaluate">
          Start
        </Link>
      </p>
      <p className="fine-line">No account needed — your answers stay in your browser.</p>
    </article>
  );
}
