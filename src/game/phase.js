export const PHASES = [
  { id: "intake", label: "Intake", blurb: "Read the symptom. Know what you are hunting." },
  { id: "sweep", label: "Sweep", blurb: "Scan the noise. Open anything that feels off." },
  { id: "thread", label: "Thread", blurb: "Clip records onto the board. Build a chain you can defend." },
  { id: "commit", label: "Commit", blurb: "Lock a cause. Pin the proof. Submit." },
  { id: "debrief", label: "Debrief", blurb: "See what the data was actually saying." },
];

/**
 * Derive the active investigation beat from game + UI state.
 */
export function derivePhase({ result, startedAt, briefingOpen, pinnedCount, hypothesis }) {
  if (result) return "debrief";
  if (!startedAt || briefingOpen) return "intake";
  if (!pinnedCount) return "sweep";
  if (!hypothesis) return "thread";
  return "commit";
}

export function phaseMeta(id) {
  return PHASES.find((phase) => phase.id === id) ?? PHASES[0];
}

export function allotmentPressure(elapsedMs, allottedMs) {
  if (!allottedMs || allottedMs <= 0) {
    return { ratio: 0, remainingMs: 0, overtime: false, band: "calm", message: null };
  }

  const ratio = Math.min(1, Math.max(0, elapsedMs / allottedMs));
  const remainingMs = Math.max(0, allottedMs - elapsedMs);
  const overtime = elapsedMs > allottedMs;

  let band = "calm";
  let message = null;
  if (overtime) {
    band = "dead";
    message = "Allotment burned — this case pays nothing.";
  } else if (ratio >= 0.75) {
    band = "critical";
    message = "Controller wants the call. Commit or lose the pay.";
  } else if (ratio >= 0.5) {
    band = "tense";
    message = "Half the allotment is gone. Start threading what you have.";
  }

  return { ratio, remainingMs, overtime, band, message };
}
