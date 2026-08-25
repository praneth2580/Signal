import { formatElapsed, formatMoney } from "../game/format.js";
import { TUTORIAL_ROUND_COUNT } from "../game/tutorial.js";

export function ScoreReveal({ result, tutorial, onReplay }) {
  const isTutorial = Boolean(tutorial);
  const lastRound = isTutorial && tutorial.round + 1 >= TUTORIAL_ROUND_COUNT;
  const cta = !isTutorial
    ? "Next case"
    : lastRound
      ? "Enter the field"
      : `Next training (${tutorial.round + 2}/${TUTORIAL_ROUND_COUNT})`;

  return (
    <div className="reveal">
      <div className="reveal-panel">
        <p className="eyebrow">{isTutorial ? tutorial.label : "truth"}</p>
        <h2>{result.accurate ? "You caught the signal." : "The noise won this round."}</h2>
        <p className="narrative">{result.narrative}</p>
        {isTutorial ? (
          <p className="narrative">
            {lastRound
              ? "Training complete. Live cases are larger, noisier, and pay desk cash when you solve them cleanly."
              : "Score lines work the same on live cases: right hypothesis, critical pins, avoid decoys, watch the allotment."}
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
