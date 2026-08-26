import { createRng } from "../game/rng.js";

export function SignalField({ className = "gate-field", seed = "start-field" }) {
  const traces = buildTraces(seed);

  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
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

function buildTraces(seed) {
  const rng = createRng(seed);
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
