import { useEffect, useRef, useState } from "react";
import { createRng } from "../game/rng.js";
import { formatMoney } from "../game/format.js";
import { SHIFT_LENGTH } from "../game/career.js";
import { MISSION_TIERS, rankIndexForSolves } from "../game/mission.js";
import { allowedTypesForSolves } from "../game/truths.js";
import { skillLabel } from "../game/tutorial.js";

const ENTER_MS = 880;

function clearanceBlurb(solves, tipCredit) {
  if (tipCredit) return "Streak perk ready · free anonymous tip on your next case";
  if (solves < 3) return "Clearance unlock at 3 solves · billing & insider cases";
  if (solves < 8) return "Clearance unlock at 8 solves · vendor failure & ordinary variance";
  if (solves < 20) return "Clearance unlock at 20 solves · Black desk eligible";
  return "Full clearance · all truth types and Black desk in the pool";
}

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
  const [entering, setEntering] = useState(false);
  const pendingAction = useRef(null);

  const placed = tutorialProgress?.placed;
  const finished = tutorialProgress?.finished;
  const remaining = tutorialProgress?.queue?.length ?? 0;
  const nextSkill = tutorialProgress?.queue?.[0];
  const canResume = shift?.active && !shift?.complete;
  const needsTraining = !placed || (placed && !finished && remaining > 0);
  const solves = career?.solves ?? 0;
  const typesOpen = allowedTypesForSolves(solves).length;

  let trainingLabel = "Start training";
  if (finished) trainingLabel = "Retake placement";
  else if (placed && remaining > 0) {
    trainingLabel = `Continue training (${remaining} left)`;
  }

  const tierFloor = MISSION_TIERS[Math.min(
    MISSION_TIERS.length - 1,
    rankIndexForSolves(solves),
  )];

  useEffect(() => {
    if (!entering) return undefined;
    const timer = window.setTimeout(() => {
      pendingAction.current?.();
      pendingAction.current = null;
    }, ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [entering]);

  function leanIn(action) {
    if (entering) return;
    pendingAction.current = action;
    setEntering(true);
  }

  return (
    <div className={`gate gate-room${entering ? " is-entering" : ""}`}>
      <div className="desk-room" aria-hidden={entering || undefined}>
        <div className="desk-wall" />
        <div className="desk-lamp" />

        <div className="desk-scene">
          <div className="desk-monitor-stage">
            <div className="desk-monitor">
              <div className="desk-bezel">
                <div className="desk-screen">
                  <SignalField />
                  <div className="desk-screen-copy">
                    <p className="eyebrow">workstation online</p>
                    <h1>SIGNAL</h1>
                    <p className="gate-line">Find what the data is actually saying.</p>
                    <p className="gate-sub">Lean into the glass. The desk stays behind you.</p>
                  </div>
                  <div className="desk-scan" aria-hidden="true" />
                </div>
              </div>
              <div className="desk-chin">
                <span className="desk-power" />
                <span>ANALYST TERMINAL</span>
              </div>
              <div className="desk-stand" />
              <div className="desk-base" />
            </div>
          </div>

          <div className="desk-top">
            <div className="desk-litter" aria-hidden="true">
              <div className="desk-mug" />
              <div className="desk-stack">
                <span />
                <span />
                <span />
              </div>
              <div className="desk-mini-clip">
                <em>clips</em>
              </div>
            </div>

            <aside className="desk-blotter" aria-label="Desk">
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
                <div>
                  <dt>Types</dt>
                  <dd>{typesOpen} open</dd>
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
                  {" · "}
                  {clearanceBlurb(solves, career?.tipCredit)}
                </p>
              ) : (
                <p className="gate-status">
                  Next shift · {SHIFT_LENGTH} cases · near{" "}
                  <span className="mission-tier" data-tier={tierFloor.id}>
                    {tierFloor.label}
                  </span>
                  {" · "}
                  {clearanceBlurb(solves, career?.tipCredit)}
                </p>
              )}

              <div className="gate-primary">
                {canResume ? (
                  <button
                    type="button"
                    className="gate-go"
                    disabled={entering}
                    onClick={() => leanIn(onResumeShift)}
                  >
                    Sit down · Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    className="gate-go"
                    disabled={entering}
                    onClick={() => leanIn(onShift)}
                  >
                    Sit down · Start shift
                  </button>
                )}
              </div>

              <div className="gate-links">
                <button
                  type="button"
                  disabled={entering}
                  onClick={() => leanIn(onTutorial)}
                >
                  {trainingLabel}
                </button>
                <button
                  type="button"
                  disabled={entering}
                  onClick={() => leanIn(onStart)}
                >
                  Single case
                </button>
                <button
                  type="button"
                  className={advancedOpen ? "is-on" : ""}
                  disabled={entering}
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
                    disabled={entering}
                  />
                </label>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      {entering ? (
        <p className="desk-entering-label" aria-live="polite">
          Entering terminal…
        </p>
      ) : null}
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

  for (let i = 0; i < 10; i += 1) {
    traces.push({
      id: `n${i}`,
      loud: false,
      points: polyline(rng, {
        y: 180 + i * 58,
        amplitude: 10 + i * 1.4,
        noise: 16 + i * 2,
        step: 14,
      }),
    });
  }

  traces.push({
    id: "signal",
    loud: true,
    points: polyline(rng, {
      y: 460,
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
