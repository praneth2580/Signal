import { hypothesisLabel } from "./hypotheses.js";
import { lookupName } from "./format.js";
import { calculatePayout } from "./wallet.js";

export function evaluate(state) {
  const { case: gameCase, player, startedAt, submittedAt } = state;
  const truth = gameCase.truth;
  const elapsedMs = Math.max(0, submittedAt - (startedAt ?? submittedAt));
  const allottedMs = gameCase.allottedMs;
  const lines = [];
  let total = 0;

  const accurate = player.hypothesis === truth.type;
  if (accurate) {
    total += 500;
    lines.push({ label: "Correct hypothesis", delta: 500 });
  } else {
    total -= 200;
    lines.push({ label: "Incorrect hypothesis", delta: -200 });
  }

  const selected = new Set(player.selectedEvidence);
  const criticalHits = truth.evidenceIds.filter((id) => selected.has(id));
  const criticalScore = criticalHits.length * 150;
  total += criticalScore;
  lines.push({
    label: `Critical evidence ${criticalHits.length}/${truth.evidenceIds.length}`,
    delta: criticalScore,
  });

  const redHits = (truth.redHerringIds ?? []).filter((id) => selected.has(id));
  if (redHits.length > 0) {
    const penalty = redHits.length * 80;
    total -= penalty;
    lines.push({ label: "Red herrings pinned", delta: -penalty });
  }

  const noise = [...selected].filter(
    (id) => !truth.evidenceIds.includes(id) && !(truth.redHerringIds ?? []).includes(id),
  );
  if (noise.length > 4) {
    const penalty = (noise.length - 4) * 25;
    total -= penalty;
    lines.push({ label: "Excessive noise", delta: -penalty });
  }

  const minutes = elapsedMs / 60000;
  if (accurate && minutes < allottedMs / 60000) {
    total += 150;
    lines.push({ label: "Inside the allotment", delta: 150 });
  }

  const confidence = player.confidence ?? 3;
  if (accurate && confidence >= 4) {
    total += 100;
    lines.push({ label: "Confidence matched evidence", delta: 100 });
  } else if (!accurate && confidence >= 4) {
    total -= 100;
    lines.push({ label: "Overconfident miss", delta: -100 });
  }

  const leakSpend = (player.leaks ?? []).reduce((sum, leak) => sum + leak.cost, 0);
  if (leakSpend > 0) {
    const penalty = Math.min(200, Math.round(leakSpend / 2));
    total -= penalty;
    lines.push({ label: "Paid shortcuts", delta: -penalty });
  }

  const payout = calculatePayout({ accurate, elapsedMs, allottedMs });

  return {
    total,
    lines,
    accurate,
    payout,
    elapsedMs,
    allottedMs,
    narrative: narrate(gameCase),
    hypothesis: hypothesisLabel(player.hypothesis),
  };
}

function narrate(gameCase) {
  const truth = gameCase.truth;
  const employee = lookupName(gameCase.people, truth.employeeId);
  const location = lookupName(gameCase.locations, truth.locationId);
  const account = gameCase.accounts.find((item) => item.id === truth.accountId);

  return `${employee}'s credentials were used from ${location} to move funds on ${account?.customer ?? "a customer account"}.`;
}
