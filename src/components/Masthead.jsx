import { useEffect, useState } from "react";
import { formatElapsed, formatMoney, formatStamp } from "../game/format.js";
import { allotmentPressure, PHASES, phaseMeta } from "../game/phase.js";

export function Masthead({
  seed,
  seedDraft,
  briefing,
  allottedMs,
  startedAt,
  submittedAt,
  balance,
  tutorial,
  mission,
  phase,
  rank,
  shift,
  streak,
  onSeedDraft,
  onLoadSeed,
  onNewCase,
  onOpenBriefing,
  onEndShift,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (submittedAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [submittedAt]);

  const elapsed = startedAt ? (submittedAt ?? now) - startedAt : 0;
  const pressure = allotmentPressure(elapsed, allottedMs);
  const meta = phaseMeta(phase);
  const maxPay = mission?.maxPay ?? 200;
  const payAtRisk = pressure.overtime ? 0 : Math.round(maxPay * (1 - pressure.ratio));

  return (
    <header className="mast">
      <div className="brand-block">
        <p className="eyebrow">{tutorial ? tutorial.label : rank?.label ?? "procedural analysis"}</p>
        <h1>SIGNAL</h1>
      </div>

      <div className="mission">
        <p className="brief">
          {!tutorial && mission ? (
            <span className="mission-tier" data-tier={mission.id}>
              {mission.label}
            </span>
          ) : null}
          {briefing.title}
        </p>
        <div className="phase-strip" aria-label="Case phase">
          {PHASES.filter((item) => item.id !== "debrief" || phase === "debrief").map((item) => (
            <span
              key={item.id}
              className={item.id === phase ? "phase-chip is-on" : "phase-chip"}
              data-phase={item.id}
            >
              {item.label}
            </span>
          ))}
        </div>
        <p className="phase-blurb">{meta.blurb}</p>
      </div>

      <div className="mast-tools">
        <div className="clock-block">
          <div className="clock-meta">
            <span className="wallet-chip">{formatMoney(balance)}</span>
            {streak > 0 ? <span className="streak-chip">Streak {streak}</span> : null}
            {shift?.active ? (
              <span className="shift-chip">
                Shift {shift.casesDone + (submittedAt ? 0 : 1)}/{shift.target}
              </span>
            ) : null}
            <span className="pay-chip" data-over={pressure.overtime || undefined}>
              {pressure.overtime ? "Pay locked" : `At risk ${formatMoney(payAtRisk)}`}
            </span>
          </div>
          <div
            className="clock-bar"
            data-band={pressure.band}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pressure.ratio * 100)}
          >
            <span style={{ width: `${Math.min(100, pressure.ratio * 100)}%` }} />
          </div>
          <p className="clock">
            <span>
              {formatStamp(briefing.windowStart)} — {formatStamp(briefing.windowEnd)}
            </span>
            <span data-over={pressure.overtime || undefined}>
              {formatElapsed(elapsed)} / {formatElapsed(allottedMs)}
              {pressure.overtime ? " overtime" : ` · ${formatElapsed(pressure.remainingMs)} left`}
            </span>
          </p>
          {pressure.message ? <p className="pressure-msg">{pressure.message}</p> : null}
        </div>
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
              {shift?.active ? (
                <button type="button" onClick={onEndShift}>
                  End shift
                </button>
              ) : (
                <button type="button" onClick={onNewCase}>
                  New case
                </button>
              )}
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
