import { storage } from "../common/storage.js";
import { generateEvidence } from "./evidence.js";
import { formatMoney, formatStamp } from "./format.js";
import { createRng } from "./rng.js";
import { generateWorld } from "./world.js";

const PROGRESS_KEY = "tutorialProgress";
export const TUTORIAL_ROUND_COUNT = 3;

const ROUND_SEEDS = ["TUTOR1", "TUTOR2", "TUTOR3"];

const ROUND_PARAMS = [
  {
    employeeCount: 5,
    accountCount: 5,
    locationCount: 3,
    transactionCount: 14,
    eventCount: 8,
    messageCount: 4,
  },
  {
    employeeCount: 7,
    accountCount: 6,
    locationCount: 4,
    transactionCount: 22,
    eventCount: 12,
    messageCount: 6,
  },
  {
    employeeCount: 9,
    accountCount: 8,
    locationCount: 5,
    transactionCount: 36,
    eventCount: 18,
    messageCount: 9,
  },
];

const ROUND_COPY = [
  {
    title: "Training desk — orientation",
    happened:
      "This is a practice case with a small ledger. Finance already knows something is wrong; your job is to learn the desk tools and catch the real signal in the noise.",
    find:
      "Learn the terms below, then investigate. Pin records that support your conclusion, pick a hypothesis, and submit. The truth is still hidden — but the trail is louder than a live case.",
    terms: [
      {
        term: "Signal",
        meaning: "The records that actually explain what happened.",
      },
      {
        term: "Noise",
        meaning: "Ordinary data that fills the world. Most rows are noise.",
      },
      {
        term: "Pin",
        meaning: "Mark a record as supporting evidence for your analysis.",
      },
      {
        term: "Hypothesis",
        meaning: "Your claim about the cause. Score depends on this plus your pins.",
      },
      {
        term: "Seed",
        meaning: "A code that regenerates the exact same case for replay or sharing.",
      },
      {
        term: "Allotment",
        meaning: "Time budget for the case. Faster accurate solves pay more desk cash.",
      },
    ],
  },
  {
    title: "Training desk — decoys",
    happened:
      "Same kind of incident, but the desk planted a few guilty-looking rows on purpose. Suspicious is not the same as true.",
    find:
      "Find the real compromise chain. Avoid pinning decoys. A message or reversed refund that looks hot may be a red herring.",
    terms: [
      {
        term: "Red herring",
        meaning: "A record that looks guilty but has an innocent explanation.",
      },
      {
        term: "Related",
        meaning: "Links from a record to people, places, accounts, and nearby activity.",
      },
      {
        term: "Paid contacts",
        meaning: "Spend desk cash for leaks. Useful, but they cut score and future cash.",
      },
    ],
  },
  {
    title: "Training desk — field practice",
    happened:
      "Last practice round. The dataset is noisier and the coach will stay quiet. Work the tables the way you will on a live case.",
    find:
      "Search, sort, follow Related links, pin only what you can defend, then submit. After this round you enter the open field.",
    terms: [
      {
        term: "Desk cash",
        meaning: "Money earned from accurate solves. Spend it on contacts when stuck.",
      },
      {
        term: "Confidence",
        meaning: "How sure you are. High confidence helps if you are right — hurts if wrong.",
      },
    ],
  },
];

export function getTutorialProgress() {
  const saved = storage.get(PROGRESS_KEY, null);
  return {
    nextRound: clampRound(saved?.nextRound ?? 0),
    finished: Boolean(saved?.finished),
  };
}

export function markTutorialRoundComplete(roundIndex) {
  const nextRound = roundIndex + 1;
  const finished = nextRound >= TUTORIAL_ROUND_COUNT;
  const progress = {
    nextRound: finished ? TUTORIAL_ROUND_COUNT : nextRound,
    finished,
  };
  storage.set(PROGRESS_KEY, progress);
  return progress;
}

export function resetTutorialProgress() {
  const progress = { nextRound: 0, finished: false };
  storage.set(PROGRESS_KEY, progress);
  return progress;
}

export function tutorialSeedForRound(roundIndex) {
  return ROUND_SEEDS[clampRound(roundIndex)];
}

export function isTutorialSeed(seed) {
  return ROUND_SEEDS.includes(String(seed || "").toUpperCase());
}

export function generateTutorialCase(roundIndex) {
  const step = clampRound(roundIndex);
  const seed = tutorialSeedForRound(step);
  const rng = createRng(seed);
  const copy = ROUND_COPY[step];
  const world = generateWorld(rng, { params: ROUND_PARAMS[step] });
  const evidence = generateEvidence(rng, world);

  return {
    seed,
    allottedMs: (12 + step * 2) * 60 * 1000,
    briefing: {
      title: copy.title,
      happened: copy.happened,
      find: copy.find,
      terms: copy.terms,
      windowStart: world.clock.start,
      windowEnd: world.clock.end,
    },
    params: world.params,
    locations: world.locations,
    people: world.people,
    accounts: world.accounts,
    transactions: evidence.transactions,
    events: evidence.events,
    messages: evidence.messages,
    truth: evidence.truth,
    tutorial: {
      round: step,
      total: TUTORIAL_ROUND_COUNT,
      label: `Training ${step + 1}/${TUTORIAL_ROUND_COUNT}`,
    },
  };
}

/**
 * Pick the next coaching tip for the active training round.
 * Returns null when the player is ready to submit or already done.
 */
export function getCoachTip(tutorial, ctx) {
  if (!tutorial || ctx.result || ctx.briefingOpen) return null;

  const tips = COACH_BY_ROUND[tutorial.round] ?? [];
  for (const tip of tips) {
    if (!tip.done(ctx)) return tip;
  }
  return null;
}

/**
 * Build a training-help reveal for the current coach tip.
 * Returns what to highlight and a short why-this-is-correct explanation.
 */
export function getCoachHelp(tipId, gameCase) {
  if (!tipId || !gameCase?.truth) return null;

  const truth = gameCase.truth;
  const [loginId, txId, placeId] = truth.evidenceIds;
  const decoyTxId = truth.redHerringIds?.[0];
  const decoyMsgId = truth.redHerringIds?.[1];

  const login = gameCase.events.find((item) => item.id === loginId);
  const transfer = gameCase.transactions.find((item) => item.id === txId);
  const place = gameCase.locations.find((item) => item.id === placeId);
  const employee = gameCase.people.find((item) => item.id === truth.employeeId);
  const account = gameCase.accounts.find((item) => item.id === truth.accountId);
  const decoyTx = gameCase.transactions.find((item) => item.id === decoyTxId);
  const decoyMsg = gameCase.messages.find((item) => item.id === decoyMsgId);
  const home = gameCase.locations.find((item) => item.id === employee?.locationId);

  const stamp = (value) => (value == null ? "an odd hour" : formatStamp(value));
  const money = (value) => (value == null ? "a large transfer" : formatMoney(value));

  const chainWhy = [
    `${loginId} is a login for ${employee?.name ?? "the victim"} at ${stamp(login?.timestamp)} from ${place?.name ?? placeId}`,
    home ? ` — not their usual ${home.name}` : "",
    `. ${txId} is the ${money(transfer?.amount)} posted transfer on ${account?.customer ?? "the account"} right after.`,
    ` ${placeId} is the unusual place that ties the login and transfer together.`,
  ].join("");

  switch (tipId) {
    case "open_activity":
      return {
        explain:
          "Activity holds logins. Credential compromise usually starts with an unauthorized login before money moves — open that dataset first.",
        dataset: "events",
        highlightIds: [],
        focus: null,
        hypothesisId: null,
        ui: "rail-events",
      };
    case "find_night_login":
      return {
        explain: `Select ${loginId}. ${employee?.name ?? "This employee"} logged in at ${stamp(login?.timestamp)} from ${place?.name ?? placeId}${home ? ` instead of ${home.name}` : ""}. Off-hours + unusual place is the signal start.`,
        dataset: "events",
        highlightIds: [loginId],
        focus: { kind: "events", id: loginId },
        hypothesisId: null,
        ui: "grid",
      };
    case "pin_and_follow":
      return {
        explain: `${chainWhy} Pin all three. Related links walk that chain without guessing.`,
        dataset: "events",
        highlightIds: [loginId, txId, placeId],
        focus: { kind: "events", id: loginId },
        hypothesisId: null,
        ui: "record",
      };
    case "hypothesis":
    case "submit":
    case "submit2":
      return {
        explain:
          "Choose “Stolen credentials were used to move money.” An insider would use their own account from a familiar place; a billing error would not produce a night login from a foreign site followed by a large posted transfer.",
        dataset: null,
        highlightIds: truth.evidenceIds.slice(),
        focus: null,
        hypothesisId: "credential_compromise",
        ui: "dock",
      };
    case "suspect_refund":
      return {
        explain: `Open ${decoyTxId}. It is a large reversed refund (${money(decoyTx?.amount)}) — loud on purpose. Check Messages next before you pin anything; training planted this as a decoy.`,
        dataset: "transactions",
        highlightIds: decoyTxId ? [decoyTxId] : [],
        focus: decoyTxId ? { kind: "transactions", id: decoyTxId } : null,
        hypothesisId: null,
        ui: "rail-transactions",
      };
    case "ignore_decoy":
      return {
        explain: `Open ${decoyMsgId}. Subject “${decoyMsg?.subject ?? "Suspicious activity drill"}” and the excerpt explain the refund was a tabletop exercise. That is why the refund must stay unpinned — it is a red herring.`,
        dataset: "messages",
        highlightIds: [decoyTxId, decoyMsgId].filter(Boolean),
        focus: decoyMsgId ? { kind: "messages", id: decoyMsgId } : null,
        hypothesisId: null,
        ui: "record",
      };
    case "real_chain":
    case "solo":
      return {
        explain: `${chainWhy} Pin that chain, leave decoys alone, then submit stolen credentials.`,
        dataset: "events",
        highlightIds: truth.evidenceIds.slice(),
        focus: { kind: "events", id: loginId },
        hypothesisId: "credential_compromise",
        ui: "grid",
      };
    default:
      return null;
  }
}

const COACH_BY_ROUND = [
  [
    {
      id: "open_activity",
      title: "Browse Activity",
      body: "Datasets live in the left rail. Open Activity — logins are often where a compromise starts.",
      highlight: "rail-events",
      done: (ctx) => ctx.dataset === "events" || Boolean(ctx.selected),
    },
    {
      id: "find_night_login",
      title: "Find the odd-hours login",
      body: "Sort or scan for a login outside normal desk hours, from a place that is not the employee’s usual site. Open that row.",
      highlight: "grid",
      done: (ctx) =>
        Boolean(ctx.selected) &&
        ctx.selected.kind === "events" &&
        ctx.truth.evidenceIds.includes(ctx.selected.id),
    },
    {
      id: "pin_and_follow",
      title: "Pin and follow Related",
      body: "Pin this login. Use Related to jump to the large transfer and the unusual place, then pin those too. Pins are your case file.",
      highlight: "record",
      done: (ctx) => {
        const [loginId, txId, placeId] = ctx.truth.evidenceIds;
        const pinned = new Set(ctx.pinned);
        return pinned.has(loginId) && pinned.has(txId) && pinned.has(placeId);
      },
    },
    {
      id: "hypothesis",
      title: "Form a hypothesis",
      body: "In Analysis, choose the hypothesis that matches stolen credentials moving money. Confidence is how sure you feel.",
      highlight: "dock",
      done: (ctx) => ctx.hypothesis === "credential_compromise",
    },
    {
      id: "submit",
      title: "Submit analysis",
      body: "Submit when your pins and hypothesis tell one story. Scoring rewards the right cause plus critical evidence — and penalizes decoys.",
      highlight: "dock",
      done: () => false,
    },
  ],
  [
    {
      id: "suspect_refund",
      title: "Do not trust the loudest row",
      body: "Open Ledger and look for a large reversed refund. It looks guilty — open it, then check Messages for a drill note before you pin it.",
      highlight: "rail-transactions",
      done: (ctx) => {
        const decoyTx = ctx.truth.redHerringIds?.[0];
        return (
          (ctx.selected?.kind === "transactions" && ctx.selected.id === decoyTx) ||
          (ctx.selected?.kind === "messages" &&
            ctx.truth.redHerringIds?.includes(ctx.selected.id)) ||
          ctx.pinned.some((id) => ctx.truth.evidenceIds.includes(id))
        );
      },
    },
    {
      id: "ignore_decoy",
      title: "Leave the decoy unpinned",
      body: "If a message says the refund was a tabletop exercise, that refund is a red herring. Pinning it will cost score later.",
      highlight: "record",
      done: (ctx) => {
        const decoys = new Set(ctx.truth.redHerringIds ?? []);
        const sawMessage = ctx.selected?.kind === "messages" && decoys.has(ctx.selected.id);
        const movedOn = ctx.pinned.some((id) => ctx.truth.evidenceIds.includes(id));
        return sawMessage || movedOn;
      },
    },
    {
      id: "real_chain",
      title: "Trace the real chain",
      body: "Find the night login → large posted transfer → unusual place. Pin that chain, pick stolen credentials, and submit.",
      highlight: "dock",
      done: (ctx) => {
        const pinned = new Set(ctx.pinned);
        const criticalPinned = ctx.truth.evidenceIds.filter((id) => pinned.has(id)).length;
        return criticalPinned >= 2 && ctx.hypothesis === "credential_compromise";
      },
    },
    {
      id: "submit2",
      title: "Submit clean",
      body: "Submit with the real evidence only. Paid contacts exist for live cases — you do not need them here.",
      highlight: "dock",
      done: () => false,
    },
  ],
  [
    {
      id: "solo",
      title: "Work the field",
      body: "Search and sort freely. Follow Related links. Pin what you can defend. When you are ready, submit — then leave training for live cases.",
      highlight: "grid",
      done: () => false,
    },
  ],
];

function clampRound(value) {
  const n = Number(value) || 0;
  return Math.max(0, Math.min(TUTORIAL_ROUND_COUNT - 1, Math.floor(n)));
}
