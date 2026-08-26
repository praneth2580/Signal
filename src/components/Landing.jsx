import { SignalField } from "./SignalField.jsx";

const STEPS = [
  {
    title: "A case generates",
    body: "Each situation is built from a hidden truth plus ordinary noise and deliberate red herrings.",
  },
  {
    title: "You investigate",
    body: "Search people, events, messages, and metrics. Decide what matters — nothing is highlighted for you.",
  },
  {
    title: "You explain",
    body: "Form a hypothesis, pin supporting evidence, and get scored on accuracy, evidence quality, and focus.",
  },
];

export function Landing({ onEnter }) {
  return (
    <div className="landing">
      <section className="landing-hero" aria-label="Signal">
        <div className="landing-atmosphere" aria-hidden="true">
          <SignalField className="landing-field" seed="landing-field" />
          <div className="landing-scan" />
        </div>

        <div className="landing-copy">
          <p className="eyebrow landing-eyebrow">procedural analysis</p>
          <h1 className="landing-brand">SIGNAL</h1>
          <p className="landing-tag">Find what the data is actually saying.</p>
          <p className="landing-support">
            Investigate generated cases. Separate signal from noise. Submit an
            evidence-backed analysis.
          </p>
          <div className="landing-cta">
            <button type="button" className="landing-go" onClick={onEnter}>
              Enter the desk
            </button>
          </div>
        </div>
      </section>

      <section className="landing-how" aria-labelledby="landing-how-title">
        <h2 id="landing-how-title">How a case works</h2>
        <ol className="landing-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="landing-step-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="landing-foot">
        <a
          href="https://github.com/praneth2580/Signal"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
