import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatDay, formatElapsed, formatMoney } from "../game/format.js";

export function BriefingModal({
  briefing,
  seed,
  allottedMs,
  balance,
  firstOpen,
  tutorial,
  mission,
  onClose,
}) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const maxPay = mission?.maxPay ?? 200;

  return createPortal(
    <div
      className="reveal folder-reveal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="case-folder"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="case-folder-tab">
          <span>{tutorial ? "TRAINING" : "CASE FILE"}</span>
          <span className="case-folder-seed">{seed}</span>
        </div>
        <div className="case-folder-body briefing-panel">
          {!tutorial && mission ? (
            <span className="case-folder-stamp mission-tier" data-tier={mission.id}>
              {mission.label}
            </span>
          ) : null}

          <p className="eyebrow">
            {tutorial
              ? tutorial.label
              : mission
                ? `${mission.label} · assigned`
                : "assigned"}
          </p>
          <h2 id="briefing-title">{briefing.title}</h2>
          <p className="briefing-window case-folder-sticky">
            Window {formatDay(briefing.windowStart)} — {formatDay(briefing.windowEnd)}
            <span> · {formatElapsed(allottedMs)} allotted</span>
            {!tutorial ? <span> · desk {formatMoney(balance)}</span> : null}
          </p>

          {!tutorial && mission ? (
            <section className="case-folder-sheet">
              <h3>Mission level</h3>
              <p>
                {mission.blurb} Max pay {formatMoney(maxPay)} if you close inside the allotment.
              </p>
            </section>
          ) : null}

          <section className="case-folder-sheet">
            <h3>What happened</h3>
            <p>{briefing.happened}</p>
          </section>
          <section className="case-folder-sheet">
            <h3>What to find</h3>
            <p>{briefing.find}</p>
          </section>

          {briefing.terms?.length ? (
            <section className="case-folder-sheet">
              <h3>Terms</h3>
              <dl className="briefing-terms">
                {briefing.terms.map((item) => (
                  <div key={item.term}>
                    <dt>{item.term}</dt>
                    <dd>{item.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="case-folder-sheet">
            <h3>{tutorial ? "Training pay" : "Pay"}</h3>
            {tutorial ? (
              <p>
                Training rounds do not pay desk cash. They teach the tools. Live missions scale from
                Routine to Black desk — harder books pay more.
              </p>
            ) : (
              <p>
                Solve this {mission?.label?.toLowerCase() ?? "mission"} for up to {formatMoney(maxPay)}.
                Pay shrinks as you burn the allotment. Miss the window and the case pays nothing.
              </p>
            )}
          </section>

          <button type="button" className="case-folder-close" onClick={onClose}>
            {firstOpen ? "Open the book" : "Close folder"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
