import { RANKS } from "./career.js";

/**
 * Live mission tiers. Higher tiers = more noise, tighter allotment, bigger pay.
 */
export const MISSION_TIERS = [
  {
    id: "routine",
    label: "Routine",
    blurb: "Small book. Clear trail. Modest pay.",
    maxPay: 150,
    allotmentMin: 12,
    allotmentMax: 14,
    decoyCount: 1,
    vagueDecoyCopy: false,
    params: {
      employeeCount: [8, 12],
      accountCount: [10, 14],
      locationCount: [4, 6],
      transactionCount: [45, 75],
      eventCount: [22, 36],
      messageCount: [10, 16],
    },
  },
  {
    id: "elevated",
    label: "Elevated",
    blurb: "Normal desk load. Signal still findable.",
    maxPay: 250,
    allotmentMin: 9,
    allotmentMax: 11,
    decoyCount: 2,
    vagueDecoyCopy: false,
    params: {
      employeeCount: [12, 18],
      accountCount: [14, 20],
      locationCount: [6, 8],
      transactionCount: [90, 140],
      eventCount: [40, 60],
      messageCount: [16, 28],
    },
  },
  {
    id: "critical",
    label: "Critical",
    blurb: "Dense noise. Short allotment. Real money.",
    maxPay: 420,
    allotmentMin: 7,
    allotmentMax: 9,
    decoyCount: 2,
    vagueDecoyCopy: true,
    params: {
      employeeCount: [18, 26],
      accountCount: [20, 28],
      locationCount: [7, 10],
      transactionCount: [150, 230],
      eventCount: [60, 95],
      messageCount: [24, 40],
    },
  },
  {
    id: "black",
    label: "Black desk",
    blurb: "Hostile noise. Thin window. Top clearance pay.",
    maxPay: 650,
    allotmentMin: 5,
    allotmentMax: 7,
    decoyCount: 3,
    vagueDecoyCopy: true,
    params: {
      employeeCount: [24, 34],
      accountCount: [26, 36],
      locationCount: [8, 11],
      transactionCount: [220, 320],
      eventCount: [90, 140],
      messageCount: [32, 52],
    },
  },
];

export function getMissionTier(id) {
  return MISSION_TIERS.find((tier) => tier.id === id) ?? MISSION_TIERS[1];
}

export function rankIndexForSolves(solves) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (solves >= RANKS[i].minSolves) index = i;
  }
  return index;
}

/**
 * Pick a mission tier from clearance + shift progress + a little seed variance.
 * Shift cases escalate: 1 → base, 2 → +1, 3 → +1/+2.
 */
export function pickMissionTier(rng, { solves = 0, shiftCaseIndex = 0 } = {}) {
  const base = rankIndexForSolves(solves);
  const escalate = Math.min(2, Math.max(0, shiftCaseIndex));
  let index = base + escalate;
  // slight variance so the same rank is not always identical
  if (rng.chance(0.22)) index += rng.chance(0.5) ? 1 : -1;
  index = Math.max(0, Math.min(MISSION_TIERS.length - 1, index));
  return MISSION_TIERS[index];
}

export function rollMissionParams(rng, tier) {
  const params = {};
  for (const [key, range] of Object.entries(tier.params)) {
    const [min, max] = range;
    params[key] = rng.int(min, max);
  }
  return params;
}

export function missionAllotmentMs(rng, tier) {
  return rng.int(tier.allotmentMin, tier.allotmentMax) * 60 * 1000;
}
