import { useEffect } from "react";
import { formatDay, formatElapsed, formatMoney } from "../game/format.js";

export function BriefingModal({
  briefing,
  seed,
  allottedMs,
  balance,
  firstOpen,
  tutorial,
  onClose,
}) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="reveal" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
      <div className="reveal-panel briefing-panel">
        <p className="eyebrow">{tutorial ? tutorial.label : `Case ${seed}`}</p>
        <h2 id="briefing-title">{briefing.title}</h2>
        <p className="briefing-window">
          {formatDay(briefing.windowStart)} — {formatDay(briefing.windowEnd)}
          <span> · {formatElapsed(allottedMs)} allotted</span>
          {!tutorial ? <span> · desk {formatMoney(balance)}</span> : null}
        </p>
        <h3>What happened</h3>
        <p>{briefing.happened}</p>
        <h3>What to find</h3>
        <p>{briefing.find}</p>
        {briefing.terms?.length ? (
          <>
            <h3>Terms</h3>
            <dl className="briefing-terms">
              {briefing.terms.map((item) => (
                <div key={item.term}>
                  <dt>{item.term}</dt>
                  <dd>{item.meaning}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
        {tutorial ? (
          <>
            <h3>Training pay</h3>
            <p>
              Training rounds do not pay desk cash. They teach the tools. Live cases pay up to{" "}
              {formatMoney(200)} when you catch the signal inside the allotment.
            </p>
          </>
        ) : (
          <>
            <h3>Pay</h3>
            <p>
              Solve the case to earn up to {formatMoney(200)}. Pay shrinks as you burn the allotment.
              Miss the window and the case pays nothing. Spend desk cash on contacts if you need a leak.
            </p>
          </>
        )}
        <button type="button" onClick={onClose}>
          {firstOpen ? (tutorial ? "Begin training" : "Begin investigation") : "Close"}
        </button>
      </div>
    </div>
  );
}
