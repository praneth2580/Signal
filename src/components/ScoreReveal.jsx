import { formatElapsed, formatMoney } from "../game/format.js";
import { skillLabel } from "../game/tutorial.js";

export function ScoreReveal({
  result,
  tutorial,
  shift,
  rank,
  streak,
  onReplay,
  onEndShift,
}) {
  const isTutorial = Boolean(tutorial);
  const passed = Boolean(result.accurate);
  const remaining = tutorial?.remaining ?? 0;
  const finishedPath = isTutorial && passed && remaining === 0;
  const lesson = result.lesson;
  const shiftDone = shift?.complete;

  let cta = "Next case";
  if (isTutorial) {
    if (!passed) cta = `Retry · ${skillLabel(tutorial.moduleId)}`;
    else if (finishedPath) cta = "Start a shift";
    else cta = `Next · ${remaining} module${remaining === 1 ? "" : "s"} left`;
  } else if (shiftDone) {
    cta = "View shift summary";
  } else if (shift?.active) {
    cta = `Next case · ${shift.casesDone}/${shift.target}`;
  }

  return (
    <div className="reveal">
      <div className="reveal-panel debrief-panel">
        <p className="eyebrow">{isTutorial ? tutorial.label : "debrief"}</p>
        <h2 data-ok={passed || undefined}>
          {passed ? "Case closed — signal caught." : "Case closed — misread."}
        </h2>
        <p className="narrative">{result.narrative}</p>

        {lesson ? (
          <div className="lesson-block">
            <h3>{lesson.title}</h3>
            <p>{lesson.body}</p>
            <ol className="lesson-chain">
              {lesson.chain.map((beat) => (
                <li key={beat.id}>
                  <span>{beat.label}</span>
                  <strong>{beat.id}</strong>
                  <em>{beat.detail}</em>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {isTutorial ? (
          <p className="narrative">
            {!passed
              ? "This module stays on your path until you solve it. Use Help on the coach if you get stuck."
              : finishedPath
                ? "Training path complete. Take a shift — three live cases, pay, and clearance."
                : "Module cleared. Only the skills you still need will appear next."}
          </p>
        ) : (
          <p className="narrative">
            {rank ? `${rank.label}` : "Analyst"}
            {streak > 0 ? ` · streak ${streak}` : ""}
            {shift?.active || shiftDone
              ? ` · shift ${shift.solved} solved / ${shift.casesDone} closed`
              : ""}
          </p>
        )}

        <ol>
          {result.lines.map((line) => (
            <li key={line.label}>
              <span>{line.label}</span>
              <strong data-neg={line.delta < 0}>
                {line.delta > 0 ? `+${line.delta}` : line.delta}
              </strong>
            </li>
          ))}
        </ol>
        <p className="total">
          Score <strong>{result.total}</strong>
        </p>
        <p className="payout-line">
          Case pay{" "}
          <strong data-neg={isTutorial || result.payout <= 0}>
            {isTutorial
              ? formatMoney(0)
              : result.payout > 0
                ? `+${formatMoney(result.payout)}`
                : formatMoney(0)}
          </strong>
          <span>
            {result.mission ? `${result.mission.label} · ` : ""}
            max {formatMoney(result.maxPay ?? 200)} ·{" "}
            {formatElapsed(result.elapsedMs)} of {formatElapsed(result.allottedMs)} allotted
            {isTutorial ? " · training" : ""}
          </span>
        </p>
        <div className="debrief-actions">
          <button type="button" onClick={onReplay}>
            {cta}
          </button>
          {!isTutorial && shift?.active && !shiftDone && onEndShift ? (
            <button type="button" className="gate-secondary" onClick={onEndShift}>
              End shift
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
