import { createRng } from "../game/rng.js";
import { formatMoney } from "../game/format.js";
import { SHIFT_LENGTH } from "../game/career.js";
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
  const placed = tutorialProgress?.placed;
  const finished = tutorialProgress?.finished;
  const remaining = tutorialProgress?.queue?.length ?? 0;
  const nextSkill = tutorialProgress?.queue?.[0];
  const canResume = shift?.active && !shift?.complete;

  let trainingLabel = "Start training";
  if (finished) trainingLabel = "Retake placement";
  else if (placed && remaining > 0) {
    trainingLabel = `Continue training (${remaining} left)`;
  }

  return (
    <div className="gate">
      <SignalField />
      <div className="gate-copy">
        <h1>SIGNAL</h1>
        <p className="gate-line">Find what the data is actually saying.</p>
        <p className="gate-sub">
          Take a shift: {SHIFT_LENGTH} timed cases. Sweep the noise, thread the chain, commit a cause.
          Desk cash and clearance rise when you catch the signal inside the allotment.
        </p>
        <p className="gate-wallet">
          Desk cash {formatMoney(balance)}
          {rank ? ` · ${rank.label}` : ""}
          {career?.streak ? ` · streak ${career.streak}` : ""}
        </p>
        {placed && !finished && nextSkill ? (
          <p className="gate-train-note">Next module: {skillLabel(nextSkill)}</p>
        ) : null}
        {finished ? (
          <p className="gate-train-note">Training complete — you are cleared for live shifts.</p>
        ) : null}
        {canResume ? (
          <p className="gate-train-note">
            Open shift: {shift.casesDone}/{shift.target} closed · {shift.solved} solved
          </p>
        ) : null}
        <form
          className="gate-cta"
          onSubmit={(event) => {
            event.preventDefault();
            onShift();
          }}
        >
          <label>
            Seed
            <input
              value={seedDraft}
              onChange={(event) => onSeedDraft(event.target.value.toUpperCase())}
              placeholder="RANDOM"
              spellCheck="false"
            />
          </label>
          <button type="submit">Start shift</button>
          {canResume ? (
            <button type="button" onClick={onResumeShift}>
              Resume shift
            </button>
          ) : null}
          <button type="button" className="gate-secondary" onClick={onStart}>
            Single case
          </button>
          <button type="button" className="gate-secondary" onClick={onTutorial}>
            {trainingLabel}
          </button>
        </form>
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
