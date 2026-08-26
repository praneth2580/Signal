import { formatMoney } from "../game/format.js";
import { SHIFT_LENGTH } from "../game/career.js";

export function ShiftSummary({ shift, career, rank, onAgain, onDesk }) {
  return (
    <div className="reveal">
      <div className="reveal-panel shift-panel">
        <p className="eyebrow">shift complete</p>
        <h2>Desk closed.</h2>
        <p className="narrative">
          You cleared {shift.casesDone} case{shift.casesDone === 1 ? "" : "s"}, caught{" "}
          {shift.solved} signal{shift.solved === 1 ? "" : "s"}, and banked{" "}
          {formatMoney(shift.earned)}.
        </p>
        <ul className="shift-stats">
          <li>
            <span>Clearance</span>
            <strong>{rank.label}</strong>
          </li>
          <li>
            <span>Career solves</span>
            <strong>{career.solves}</strong>
          </li>
          <li>
            <span>Best streak</span>
            <strong>{career.bestStreak}</strong>
          </li>
          <li>
            <span>Shifts cleared</span>
            <strong>{career.shiftsCleared}</strong>
          </li>
        </ul>
        <div className="debrief-actions">
          <button type="button" onClick={onAgain}>
            Next shift ({SHIFT_LENGTH} cases)
          </button>
          <button type="button" className="gate-secondary" onClick={onDesk}>
            Back to desk
          </button>
        </div>
      </div>
    </div>
  );
}
