import { formatElapsed, formatMoney } from "../game/format.js";
import { skillLabel } from "../game/tutorial.js";

export function ScoreReveal({ result, tutorial, onReplay }) {
  const isTutorial = Boolean(tutorial);
  const passed = Boolean(result.accurate);
  const remaining = tutorial?.remaining ?? 0;
  const finishedPath = isTutorial && passed && remaining === 0;

  let cta = "Next case";
  if (isTutorial) {
    if (!passed) cta = `Retry · ${skillLabel(tutorial.moduleId)}`;
    else if (finishedPath) cta = "Enter the field";
    else cta = `Next · ${remaining} module${remaining === 1 ? "" : "s"} left`;
  }

  return (
    <div className="reveal">
      <div className="reveal-panel">
        <p className="eyebrow">{isTutorial ? tutorial.label : "truth"}</p>
        <h2>{result.accurate ? "You caught the signal." : "The noise won this round."}</h2>
        <p className="narrative">{result.narrative}</p>
        {isTutorial ? (
          <p className="narrative">
            {!passed
              ? "This module stays on your path until you solve it. Use Help on the coach if you get stuck."
              : finishedPath
                ? "Training path complete. Live cases are larger, noisier, and pay desk cash when you solve them cleanly."
                : "Module cleared. Only the skills you still need will appear next."}
          </p>
        ) : null}
        <ol>
          {result.lines.map((line) => (
            <li key={line.label}>
              <span>{line.label}</span>
              <strong data-neg={line.delta < 0}>{line.delta > 0 ? `+${line.delta}` : line.delta}</strong>
            </li>
          ))}
        </ol>
        <p className="total">
          Score <strong>{result.total}</strong>
        </p>
        <p className="payout-line">
          Case pay{" "}
          <strong data-neg={isTutorial || result.payout <= 0}>
            {isTutorial ? formatMoney(0) : result.payout > 0 ? `+${formatMoney(result.payout)}` : formatMoney(0)}
          </strong>
          <span>
            {formatElapsed(result.elapsedMs)} of {formatElapsed(result.allottedMs)} allotted
            {isTutorial ? " · training" : ""}
          </span>
        </p>
        <button type="button" onClick={onReplay}>
          {cta}
        </button>
      </div>
    </div>
  );
}
