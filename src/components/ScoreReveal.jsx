import { createPortal } from "react-dom";
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

  return createPortal(
    <div className="reveal dossier-reveal">
      <div className="reveal-panel debrief-panel dossier-panel">
        <p className="eyebrow">{isTutorial ? tutorial.label : "marked dossier"}</p>
        <h2 data-ok={passed || undefined}>
          {passed ? "Case closed — signal caught." : "Case closed — misread."}
        </h2>
        <p className="narrative">{result.narrative}</p>

        {lesson ? (
          <div className="lesson-block">
            <h3>{lesson.title}</h3>
            <p>{lesson.body}</p>

            {lesson.chain?.length > 0 ? (
              <ol className="lesson-chain lesson-spine" aria-label="Truth chain">
                {lesson.chain.map((beat, index) => (
                  <li key={beat.id} data-status={beat.status || "missed"}>
                    {index > 0 ? (
                      <span className="lesson-spine-arrow" aria-hidden="true">
                        ↓
                      </span>
                    ) : null}
                    <div className="lesson-beat">
                      <div className="lesson-beat-head">
                        <span className="lesson-role">{beat.role || beat.kind || "beat"}</span>
                        <span className="lesson-status">
                          {beat.status === "hit" ? "pinned" : "missed"}
                        </span>
                      </div>
                      <strong>{beat.id}</strong>
                      <em>{beat.label}</em>
                      <p>{beat.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lesson-empty-chain">
                No critical chain — the correct call was that nothing criminal happened.
              </p>
            )}

            {lesson.chased?.length > 0 ? (
              <div className="lesson-noise">
                <h4>Noise you chased</h4>
                <ul>
                  {lesson.chased.map((item) => (
                    <li key={item.id}>
                      <strong>{item.id}</strong>
                      <span>{item.whyInnocent}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
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
    </div>,
    document.body,
  );
}
