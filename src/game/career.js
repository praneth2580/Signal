import { storage } from "../common/storage.js";

const CAREER_KEY = "career";
const SHIFT_KEY = "shift";

export const RANKS = [
  { id: "trainee", label: "Trainee", minSolves: 0 },
  { id: "desk", label: "Desk Analyst", minSolves: 3 },
  { id: "senior", label: "Senior Desk", minSolves: 8 },
  { id: "lead", label: "Lead Analyst", minSolves: 20 },
];

export const SHIFT_LENGTH = 3;

function emptyCareer() {
  return {
    solves: 0,
    streak: 0,
    bestStreak: 0,
    shiftsCleared: 0,
    totalEarned: 0,
  };
}

export function getCareer() {
  const saved = storage.get(CAREER_KEY, null);
  return {
    ...emptyCareer(),
    ...(saved || {}),
  };
}

export function saveCareer(career) {
  storage.set(CAREER_KEY, career);
  return career;
}

export function rankForSolves(solves) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (solves >= rank.minSolves) current = rank;
  }
  return current;
}

export function getShift() {
  return storage.get(SHIFT_KEY, null);
}

export function clearShift() {
  storage.remove(SHIFT_KEY);
  return null;
}

export function completeShift() {
  const shift = getShift();
  if (!shift) return null;
  const next = { ...shift, active: false, complete: true };
  storage.set(SHIFT_KEY, next);
  return next;
}

export function startShift() {
  const shift = {
    active: true,
    target: SHIFT_LENGTH,
    casesDone: 0,
    solved: 0,
    earned: 0,
    startedAt: Date.now(),
  };
  storage.set(SHIFT_KEY, shift);
  return shift;
}

/**
 * Record a finished live case into the active shift + career.
 */
export function recordLiveResult(result) {
  const career = getCareer();
  const accurate = Boolean(result?.accurate);
  const payout = accurate ? Number(result?.payout) || 0 : 0;

  const nextCareer = {
    ...career,
    solves: career.solves + (accurate ? 1 : 0),
    streak: accurate ? career.streak + 1 : 0,
    bestStreak: accurate
      ? Math.max(career.bestStreak, career.streak + 1)
      : career.bestStreak,
    totalEarned: career.totalEarned + payout,
  };
  saveCareer(nextCareer);

  let shift = getShift();
  if (!shift?.active) {
    return { career: nextCareer, shift: null, shiftComplete: false };
  }

  shift = {
    ...shift,
    casesDone: shift.casesDone + 1,
    solved: shift.solved + (accurate ? 1 : 0),
    earned: shift.earned + payout,
  };

  const shiftComplete = shift.casesDone >= shift.target;
  if (shiftComplete) {
    nextCareer.shiftsCleared += 1;
    saveCareer(nextCareer);
    storage.set(SHIFT_KEY, { ...shift, active: false, complete: true });
    return { career: nextCareer, shift: { ...shift, active: false, complete: true }, shiftComplete: true };
  }

  storage.set(SHIFT_KEY, shift);
  return { career: nextCareer, shift, shiftComplete: false };
}
