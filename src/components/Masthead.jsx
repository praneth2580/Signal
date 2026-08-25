import { useEffect, useState } from "react";
import { formatElapsed, formatMoney, formatStamp } from "../game/format.js";

export function Masthead({
  seed,
  seedDraft,
  briefing,
  allottedMs,
  startedAt,
  submittedAt,
  balance,
  tutorial,
  onSeedDraft,
  onLoadSeed,
  onNewCase,
  onOpenBriefing,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (submittedAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [submittedAt]);

  const elapsed = startedAt ? (submittedAt ?? now) - startedAt : 0;
  const remaining = Math.max(0, allottedMs - elapsed);
  const overtime = startedAt && elapsed > allottedMs;

  return (
    <header className="mast">
      <div className="brand-block">
        <p className="eyebrow">{tutorial ? tutorial.label : "procedural analysis"}</p>
        <h1>SIGNAL</h1>
      </div>
      <p className="brief">{briefing.title}</p>
      <div className="mast-tools">
        <p className="clock">
          <span className="wallet-chip">{formatMoney(balance)}</span>
          <span>
            {formatStamp(briefing.windowStart)} — {formatStamp(briefing.windowEnd)}
          </span>
          <span data-over={overtime || undefined}>
            {formatElapsed(elapsed)} / {formatElapsed(allottedMs)}
            {overtime ? " overtime" : ` · ${formatElapsed(remaining)} left`}
          </span>
        </p>
        <form
          className="seed-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!tutorial) onLoadSeed();
          }}
        >
          {!tutorial ? (
            <label>
              Seed
              <input
                value={seedDraft}
                onChange={(event) => onSeedDraft(event.target.value.toUpperCase())}
                placeholder={seed}
                spellCheck="false"
              />
            </label>
          ) : (
            <p className="training-seed">Seed {seed}</p>
          )}
          <button type="button" onClick={onOpenBriefing}>
            Briefing
          </button>
          {!tutorial ? (
            <>
              <button type="submit">Load</button>
              <button type="button" onClick={onNewCase}>
                New case
              </button>
            </>
          ) : (
            <button type="button" onClick={onNewCase}>
              Skip to live
            </button>
          )}
        </form>
      </div>
    </header>
  );
}
