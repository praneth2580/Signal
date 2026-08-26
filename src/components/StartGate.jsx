import { useState } from "react";
import { createRng } from "../game/rng.js";
import { formatMoney } from "../game/format.js";
import { SHIFT_LENGTH } from "../game/career.js";
import { MISSION_TIERS, rankIndexForSolves } from "../game/mission.js";
import { skillLabel } from "../game/tutorial.js";

export function StartGate({
  seedDraft,
  balance,
  tutorialProgress,
  career,
  rank,
  shift,
  onSeedDraft,
  onStart,
  onShift,
  onTutorial,
  onResumeShift,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(seedDraft));
  const placed = tutorialProgress?.placed;
  const finished = tutorialProgress?.finished;
  const remaining = tutorialProgress?.queue?.length ?? 0;
  const nextSkill = tutorialProgress?.queue?.[0];
  const canResume = shift?.active && !shift?.complete;
  const needsTraining = !placed || (placed && !finished && remaining > 0);

  let trainingLabel = "Start training";
  if (finished) trainingLabel = "Retake placement";
  else if (placed && remaining > 0) {
    trainingLabel = `Continue training (${remaining} left)`;
  }

  const tierFloor = MISSION_TIERS[Math.min(
    MISSION_TIERS.length - 1,
    rankIndexForSolves(career?.solves ?? 0),
  )];

  return (
    <div className="gate">
      <SignalField />
      <div className="gate-shell">
        <div className="gate-brand">
          <h1>SIGNAL</h1>
          <p className="gate-line">Find what the data is actually saying.</p>
          <p className="gate-sub">Timed shifts. Thread the chain. Get paid for clean calls.</p>
        </div>

        <aside className="gate-desk" aria-label="Desk">
          <p className="eyebrow">desk clearance</p>
          <dl className="gate-stats">
            <div>
              <dt>Rank</dt>
              <dd>{rank?.label ?? "Trainee"}</dd>
            </div>
            <div>
              <dt>Cash</dt>
              <dd>{formatMoney(balance)}</dd>
            </div>
            <div>
              <dt>Streak</dt>
              <dd>{career?.streak ?? 0}</dd>
            </div>
          </dl>

          {canResume ? (
            <p className="gate-status">
              Open shift · {shift.casesDone}/{shift.target} closed · {shift.solved} solved
            </p>
          ) : needsTraining && nextSkill ? (
            <p className="gate-status">Next training · {skillLabel(nextSkill)}</p>
          ) : finished ? (
            <p className="gate-status">
              Cleared for live shifts · opens near{" "}
              <span className="mission-tier" data-tier={tierFloor.id}>
                {tierFloor.label}
              </span>
            </p>
          ) : (
            <p className="gate-status">
              Next shift · {SHIFT_LENGTH} cases · near{" "}
              <span className="mission-tier" data-tier={tierFloor.id}>
                {tierFloor.label}
              </span>
            </p>
          )}

          <div className="gate-primary">
            {canResume ? (
              <button type="button" className="gate-go" onClick={onResumeShift}>
                Resume shift
              </button>
            ) : (
              <button type="button" className="gate-go" onClick={onShift}>
                Start shift
              </button>
            )}
          </div>

          <div className="gate-links">
            <button type="button" onClick={onTutorial}>
              {trainingLabel}
            </button>
            <button type="button" onClick={onStart}>
              Single case
            </button>
            <button
              type="button"
              className={advancedOpen ? "is-on" : ""}
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
            >
              Advanced
            </button>
          </div>

          {advancedOpen ? (
            <label className="gate-seed">
              Seed
              <input
                value={seedDraft}
                onChange={(event) => onSeedDraft(event.target.value.toUpperCase())}
                placeholder="RANDOM"
                spellCheck="false"
              />
            </label>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SignalField() {
  const traces = buildTraces();

  return (
    <svg className="gate-field" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {traces.map((trace) => (
        <polyline
          key={trace.id}
          className={trace.loud ? "gate-signal" : "gate-noise"}
          points={trace.points}
        />
      ))}
    </svg>
  );
}

function buildTraces() {
  const rng = createRng("start-field");
  const traces = [];

  for (let i = 0; i < 14; i += 1) {
    traces.push({
      id: `n${i}`,
      loud: false,
      points: polyline(rng, {
        y: 140 + i * 52,
        amplitude: 10 + i * 1.4,
        noise: 18 + i * 2,
        step: 14,
      }),
    });
  }

  traces.push({
    id: "signal",
    loud: true,
    points: polyline(rng, {
      y: 470,
      amplitude: 28,
      noise: 8,
      step: 10,
      spikeAt: 0.72,
    }),
  });

  return traces;
}

function polyline(rng, { y, amplitude, noise, step, spikeAt }) {
  const points = [];

  for (let x = -20; x <= 1620; x += step) {
    const t = x / 1600;
    let next = y + Math.sin(t * 18 + y) * amplitude + (rng.next() - 0.5) * noise;
    if (spikeAt && Math.abs(t - spikeAt) < 0.03) {
      next -= 90;
    }
    points.push(`${x},${next.toFixed(1)}`);
  }

  return points.join(" ");
}
