import { storage } from "../common/storage.js";
import { generateEvidence } from "./evidence.js";
import { formatMoney, formatStamp } from "./format.js";
import { createRng } from "./rng.js";
import { generateWorld } from "./world.js";

const PROGRESS_KEY = "tutorialProgress";

/** @typedef {"strong" | "weak" | "unknown"} SkillLevel */

export const SKILLS = [
  {
    id: "money_moves",
    label: "Money movements",
    blurb: "Transfers, refunds, posted vs reversed",
    kind: "domain",
  },
  {
    id: "access",
    label: "Logins & credentials",
    blurb: "Who signed in, from where, whose password",
    kind: "domain",
  },
  {
    id: "decoys",
    label: "Red herrings",
    blurb: "Rows that look guilty but are innocent",
    kind: "domain",
  },
  {
    id: "cause",
    label: "Choosing a cause",
    blurb: "Stolen login vs insider vs billing error",
    kind: "domain",
  },
  {
    id: "browse",
    label: "Desk browsing",
    blurb: "Datasets, search, and opening rows",
    kind: "desk",
  },
  {
    id: "relate",
    label: "Following links",
    blurb: "Related records and pinning a chain",
    kind: "desk",
  },
  {
    id: "pin_submit",
    label: "Closing a case",
    blurb: "Pin evidence, pick a hypothesis, submit",
    kind: "desk",
  },
];

export const SKILL_ORDER = SKILLS.map((skill) => skill.id);

export const PLACEMENT_QUIZ = [
  {
    skill: "money_moves",
    prompt: "A reversed refund means:",
    choices: [
      "Money was charged to a customer",
      "Money was sent back, then that return was undone",
      "An employee logged in from home",
    ],
    correct: 1,
  },
  {
    skill: "access",
    prompt: "Stolen credentials usually means:",
    choices: [
      "Someone used another person’s login",
      "A vendor shipped the wrong box",
      "A refund was reversed",
    ],
    correct: 0,
  },
  {
    skill: "decoys",
    prompt: "A red herring is:",
    choices: [
      "The one true cause of the incident",
      "A record that looks guilty but has an innocent explanation",
      "Any large transfer",
    ],
    correct: 1,
  },
  {
    skill: "cause",
    prompt: "Night login from an unusual place, then a large posted transfer, most likely points to:",
    choices: [
      "Ordinary seasonal variance",
      "A billing typo only",
      "Someone using credentials who should not have them",
    ],
    correct: 2,
  },
  {
    skill: "browse",
    prompt: "To inspect a login in Signal you should:",
    choices: [
      "Open the Activity dataset and click the row",
      "Only read the briefing and guess",
      "Wait for the game to highlight the answer",
    ],
    correct: 0,
  },
  {
    skill: "relate",
    prompt: "Related links are for:",
    choices: [
      "Deleting noise from the case",
      "Jumping from a record to people, places, and nearby activity",
      "Paying contacts automatically",
    ],
    correct: 1,
  },
  {
    skill: "pin_submit",
    prompt: "A strong analysis usually needs:",
    choices: [
      "A hypothesis alone with no pins",
      "Pins that support your hypothesis, then submit",
      "Pinning every row in the ledger",
    ],
    correct: 1,
  },
];

const MODULE_SEEDS = {
  money_moves: "TMONEY1",
  access: "TACCES1",
  decoys: "TDECOY1",
  cause: "TCAUSE1",
  browse: "TBROWS1",
  relate: "TRELATE",
  pin_submit: "TPINSUB",
};

const MODULE_PARAMS = {
  money_moves: {
    employeeCount: 5,
    accountCount: 5,
    locationCount: 3,
    transactionCount: 16,
    eventCount: 8,
    messageCount: 4,
  },
  access: {
    employeeCount: 5,
    accountCount: 5,
    locationCount: 3,
    transactionCount: 14,
    eventCount: 10,
    messageCount: 4,
  },
  browse: {
    employeeCount: 5,
    accountCount: 5,
    locationCount: 3,
    transactionCount: 14,
    eventCount: 8,
    messageCount: 4,
  },
  relate: {
    employeeCount: 6,
    accountCount: 6,
    locationCount: 4,
    transactionCount: 18,
    eventCount: 10,
    messageCount: 5,
  },
  decoys: {
    employeeCount: 7,
    accountCount: 6,
    locationCount: 4,
    transactionCount: 22,
    eventCount: 12,
    messageCount: 6,
  },
  cause: {
    employeeCount: 6,
    accountCount: 6,
    locationCount: 4,
    transactionCount: 18,
    eventCount: 10,
    messageCount: 5,
  },
  pin_submit: {
    employeeCount: 8,
    accountCount: 7,
    locationCount: 4,
    transactionCount: 28,
    eventCount: 14,
    messageCount: 7,
  },
};

const MODULE_COPY = {
  money_moves: {
    title: "Training — money movements",
    happened:
      "You do not need a finance degree. This desk shows money as rows. Something odd happened in the ledger; first learn what the columns mean.",
    find: "Open Ledger rows and learn posted, reversed, transfer, and refund. Then spot one movement that does not look ordinary.",
    terms: [
      { term: "Ledger", meaning: "The table of money movements." },
      { term: "Posted", meaning: "The movement actually went through." },
      { term: "Reversed", meaning: "The movement was undone / cancelled." },
      { term: "Transfer", meaning: "Money moved from one place to another." },
      { term: "Refund", meaning: "Money sent back toward a customer." },
    ],
  },
  access: {
    title: "Training — logins",
    happened:
      "Money rarely moves alone. Someone usually signs in first. This round teaches you to read Activity like a timeline of access.",
    find: "Find a login at an odd hour from a place that is not the employee’s usual desk.",
    terms: [
      { term: "Credentials", meaning: "Login and password for someone’s account." },
      { term: "Activity", meaning: "Logins and failed logins." },
      { term: "Unusual place", meaning: "A location that does not match where that person normally works." },
    ],
  },
  browse: {
    title: "Training — desk tools",
    happened:
      "Signal is a workstation. The left rail switches datasets. Tables can be searched and sorted. Rows open for detail.",
    find: "Open Activity, then open a row. Get comfortable moving through the desk before you argue a cause.",
    terms: [
      { term: "Dataset", meaning: "One table of records: people, ledger, activity, and so on." },
      { term: "Search", meaning: "Filter the current table to fewer rows." },
    ],
  },
  relate: {
    title: "Training — follow the chain",
    happened:
      "Records point at each other. A login links to a person and a place; a transfer links to an account. That is how you build a story.",
    find: "Pin a login, follow Related to the large transfer and unusual place, and pin that chain.",
    terms: [
      { term: "Related", meaning: "Links from one record to people, places, accounts, and nearby activity." },
      { term: "Pin", meaning: "Mark a record as supporting evidence." },
      { term: "Signal", meaning: "The records that actually explain what happened." },
    ],
  },
  decoys: {
    title: "Training — red herrings",
    happened:
      "The desk planted a guilty-looking refund on purpose. Suspicious is not the same as true.",
    find: "Open the loud reversed refund, read the drill message, leave the decoy unpinned, then chase the real chain.",
    terms: [
      { term: "Red herring", meaning: "Looks guilty, but has an innocent explanation." },
      { term: "Noise", meaning: "Ordinary data. Most rows are noise." },
    ],
  },
  cause: {
    title: "Training — pick a cause",
    happened:
      "You will almost always have more than one plausible story. Your job is to pick the cause the evidence supports.",
    find: "Use the chain you can defend. Choose the hypothesis that matches stolen credentials moving money.",
    terms: [
      {
        term: "Hypothesis",
        meaning: "Your claim about the cause. Score depends on this plus your pins.",
      },
    ],
  },
  pin_submit: {
    title: "Training — close the case",
    happened:
      "Practice finishing cleanly: pin only what you can defend, choose a cause, and submit. Live cases will pay desk cash when you do this well.",
    find: "Pin the real chain, avoid decoys, submit stolen credentials, and leave training ready for the field.",
    terms: [
      {
        term: "Confidence",
        meaning: "How sure you are. High confidence helps if you are right — hurts if wrong.",
      },
      {
        term: "Desk cash",
        meaning: "Money from accurate live solves. Spend it on contacts when stuck.",
      },
    ],
  },
};

function emptySkills() {
  return Object.fromEntries(SKILLS.map((skill) => [skill.id, "unknown"]));
}

function normalizeProgress(saved) {
  const skills = { ...emptySkills(), ...(saved?.skills || {}) };
  const queue = Array.isArray(saved?.queue)
    ? saved.queue.filter((id) => SKILL_ORDER.includes(id))
    : [];
  const index = Math.max(0, Math.min(queue.length, Number(saved?.index) || 0));
  const finished = Boolean(saved?.finished) || (saved?.placed && queue.length === 0);
  return {
    skills,
    queue,
    index: finished ? queue.length : index,
    placed: Boolean(saved?.placed),
    finished,
  };
}

export function getTutorialProgress() {
  return normalizeProgress(storage.get(PROGRESS_KEY, null));
}

export function saveTutorialProgress(progress) {
  const next = normalizeProgress(progress);
  storage.set(PROGRESS_KEY, next);
  return next;
}

export function resetTutorialProgress() {
  return saveTutorialProgress({
    skills: emptySkills(),
    queue: [],
    index: 0,
    placed: false,
    finished: false,
  });
}

/**
 * Turn placement ratings + quiz answers into a skill profile and training queue.
 * @param {Record<string, "know" | "sort_of" | "no">} ratings
 * @param {Record<string, number>} quizAnswers
 */
export function applyPlacement(ratings, quizAnswers = {}) {
  const skills = emptySkills();

  for (const skill of SKILLS) {
    const rating = ratings[skill.id] ?? "no";
    if (rating === "no" || rating === "sort_of") {
      skills[skill.id] = "weak";
      continue;
    }

    const question = PLACEMENT_QUIZ.find((item) => item.skill === skill.id);
    if (question && quizAnswers[skill.id] !== question.correct) {
      skills[skill.id] = "weak";
    } else {
      skills[skill.id] = "strong";
    }
  }

  const queue = SKILL_ORDER.filter((id) => skills[id] !== "strong");
  return saveTutorialProgress({
    skills,
    queue,
    index: 0,
    placed: true,
    finished: queue.length === 0,
  });
}

export function getCurrentModuleId(progress = getTutorialProgress()) {
  if (!progress.placed || progress.finished) return null;
  return progress.queue[progress.index] ?? null;
}

export function markTutorialModuleComplete(moduleId, { passed }) {
  const progress = getTutorialProgress();
  if (!progress.placed) return progress;
  if (!passed) return progress;

  const skills = {
    ...progress.skills,
    [moduleId]: "strong",
  };
  const rebuilt = SKILL_ORDER.filter((id) => skills[id] !== "strong");

  return saveTutorialProgress({
    skills,
    queue: rebuilt,
    index: 0,
    placed: true,
    finished: rebuilt.length === 0,
  });
}

export function skillLabel(id) {
  return SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

export function isTutorialSeed(seed) {
  const value = String(seed || "").toUpperCase();
  return Object.values(MODULE_SEEDS).includes(value) || value.startsWith("TUTOR");
}

export function moduleIdFromSeed(seed) {
  const value = String(seed || "").toUpperCase();
  const entry = Object.entries(MODULE_SEEDS).find(([, code]) => code === value);
  if (entry) return entry[0];
  // Legacy fixed rounds
  if (value === "TUTOR1") return "browse";
  if (value === "TUTOR2") return "decoys";
  if (value === "TUTOR3") return "pin_submit";
  return null;
}

export function generateTutorialCase(moduleId) {
  const id = SKILL_ORDER.includes(moduleId) ? moduleId : "browse";
  const seed = MODULE_SEEDS[id];
  const rng = createRng(seed);
  const copy = MODULE_COPY[id];
  const progress = getTutorialProgress();
  const queue = progress.queue.length ? progress.queue : [id];
  const position = Math.max(0, queue.indexOf(id));
  const world = generateWorld(rng, {
    params: MODULE_PARAMS[id],
    forceType: "credential_compromise",
  });
  world.mission = {
    id: "routine",
    label: "Training",
    decoyCount: 1,
    vagueDecoyCopy: false,
  };
  const evidence = generateEvidence(rng, world);

  return {
    seed,
    allottedMs: (12 + position * 2) * 60 * 1000,
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
      moduleId: id,
      round: position,
      total: queue.length || 1,
      label: `Training · ${skillLabel(id)}`,
      queue,
      remaining: Math.max(0, (queue.length || 1) - position - 1),
    },
  };
}

export function getCoachTip(tutorial, ctx) {
  if (!tutorial || ctx.result || ctx.briefingOpen) return null;
  const tips = MODULE_TIPS[tutorial.moduleId] ?? [];
  for (const tip of tips) {
    if (!tip.done(ctx)) return tip;
  }
  return null;
}

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
    `. ${txId} is the ${money(transfer?.amount)} posted transfer (money that actually moved) on ${account?.customer ?? "the account"} right after.`,
    ` ${placeId} is the unusual place that ties the login and transfer together.`,
  ].join("");

  switch (tipId) {
    case "open_ledger":
      return {
        explain:
          "Ledger is the money table. Open it from the left rail. Each row is one movement — not a mystery document.",
        dataset: "transactions",
        highlightIds: [],
        focus: null,
        hypothesisId: null,
        ui: "rail-transactions",
      };
    case "read_types":
      return {
        explain: `Open ${txId}. It is a posted transfer (${money(transfer?.amount)}). Posted = it went through. Transfer = money moved. That is the kind of row that can hurt revenue.`,
        dataset: "transactions",
        highlightIds: txId ? [txId] : [],
        focus: txId ? { kind: "transactions", id: txId } : null,
        hypothesisId: null,
        ui: "grid",
      };
    case "open_activity":
      return {
        explain:
          "Activity holds logins. A compromise often starts with an unauthorized login before money moves — open that dataset first.",
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
    case "real_chain":
      return {
        explain: `${chainWhy} Pin that chain. Related links walk it without guessing.`,
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
          "Choose “Stolen credentials were used to move money.” An insider would usually act from a familiar place on an account they own; a billing typo would not produce a night login from a foreign site followed by a large posted transfer.",
        dataset: null,
        highlightIds: truth.evidenceIds.slice(),
        focus: null,
        hypothesisId: "credential_compromise",
        ui: "dock",
      };
    case "suspect_refund":
      return {
        explain: `Open ${decoyTxId}. It is a large reversed refund (${money(decoyTx?.amount)}) — loud on purpose. Reversed means it was undone. Check Messages before you pin it.`,
        dataset: "transactions",
        highlightIds: decoyTxId ? [decoyTxId] : [],
        focus: decoyTxId ? { kind: "transactions", id: decoyTxId } : null,
        hypothesisId: null,
        ui: "rail-transactions",
      };
    case "ignore_decoy":
      return {
        explain: `Open ${decoyMsgId}. Subject “${decoyMsg?.subject ?? "Suspicious activity drill"}” explains the refund was a tabletop exercise. Leave that refund unpinned — it is a red herring.`,
        dataset: "messages",
        highlightIds: [decoyTxId, decoyMsgId].filter(Boolean),
        focus: decoyMsgId ? { kind: "messages", id: decoyMsgId } : null,
        hypothesisId: null,
        ui: "record",
      };
    default:
      return null;
  }
}

const MODULE_TIPS = {
  money_moves: [
    {
      id: "open_ledger",
      title: "Open the money table",
      body: "Ledger is every money movement. Open it from the left rail.",
      highlight: "rail-transactions",
      done: (ctx) => ctx.dataset === "transactions" || ctx.selected?.kind === "transactions",
    },
    {
      id: "read_types",
      title: "Read one movement",
      body: "Open a row. Posted = it went through. Reversed = undone. Transfer = money moved. Find the large posted transfer.",
      highlight: "grid",
      done: (ctx) =>
        ctx.selected?.kind === "transactions" &&
        ctx.truth.evidenceIds.includes(ctx.selected.id),
    },
    {
      id: "submit",
      title: "Submit when ready",
      body: "Choose “Stolen credentials were used to move money,” then submit to finish this module.",
      highlight: "dock",
      done: () => false,
    },
  ],
  browse: [
    {
      id: "open_activity",
      title: "Switch datasets",
      body: "Use the left rail. Open Activity, then click any row to inspect it.",
      highlight: "rail-events",
      done: (ctx) => ctx.dataset === "events" && Boolean(ctx.selected),
    },
    {
      id: "submit",
      title: "Submit when ready",
      body: "For practice scoring, choose stolen credentials and submit — the same close-out you will use on live cases.",
      highlight: "dock",
      done: () => false,
    },
  ],
  access: [
    {
      id: "open_activity",
      title: "Browse Activity",
      body: "Open Activity — logins are often where a compromise starts.",
      highlight: "rail-events",
      done: (ctx) => ctx.dataset === "events" || Boolean(ctx.selected),
    },
    {
      id: "find_night_login",
      title: "Find the odd-hours login",
      body: "Scan for a login outside normal hours from a place that is not the employee’s usual site. Open that row.",
      highlight: "grid",
      done: (ctx) =>
        Boolean(ctx.selected) &&
        ctx.selected.kind === "events" &&
        ctx.truth.evidenceIds.includes(ctx.selected.id),
    },
    {
      id: "submit",
      title: "Submit when ready",
      body: "Pin the login if you want, choose stolen credentials, and submit to finish this module.",
      highlight: "dock",
      done: () => false,
    },
  ],
  relate: [
    {
      id: "open_activity",
      title: "Start from Activity",
      body: "Open Activity and find the odd-hours login that begins the chain.",
      highlight: "rail-events",
      done: (ctx) =>
        Boolean(ctx.selected) &&
        ctx.selected.kind === "events" &&
        ctx.truth.evidenceIds.includes(ctx.selected.id),
    },
    {
      id: "pin_and_follow",
      title: "Pin and follow Related",
      body: "Pin this login. Use Related to jump to the large transfer and the unusual place, then pin those too.",
      highlight: "record",
      done: (ctx) => {
        const [loginId, txId, placeId] = ctx.truth.evidenceIds;
        const pinned = new Set(ctx.pinned);
        return pinned.has(loginId) && pinned.has(txId) && pinned.has(placeId);
      },
    },
    {
      id: "submit",
      title: "Submit the chain",
      body: "With the chain pinned, choose stolen credentials and submit.",
      highlight: "dock",
      done: () => false,
    },
  ],
  decoys: [
    {
      id: "suspect_refund",
      title: "Do not trust the loudest row",
      body: "Open Ledger and find a large reversed refund. It looks guilty — open it, then check Messages before pinning.",
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
      body: "If a message says the refund was a tabletop exercise, that refund is a red herring. Do not pin it.",
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
      body: "Find night login → large posted transfer → unusual place. Pin that chain, then submit.",
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
      body: "Submit with the real evidence only.",
      highlight: "dock",
      done: () => false,
    },
  ],
  cause: [
    {
      id: "hypothesis",
      title: "Form a hypothesis",
      body: "In Analysis, choose the cause that matches stolen credentials moving money. Confidence is how sure you feel.",
      highlight: "dock",
      done: (ctx) => ctx.hypothesis === "credential_compromise",
    },
    {
      id: "submit",
      title: "Submit analysis",
      body: "Pin what you can defend, then submit. Scoring rewards the right cause plus critical evidence.",
      highlight: "dock",
      done: () => false,
    },
  ],
  pin_submit: [
    {
      id: "real_chain",
      title: "Build and close",
      body: "Pin the real chain, avoid decoys, choose stolen credentials, and submit.",
      highlight: "grid",
      done: (ctx) => {
        const pinned = new Set(ctx.pinned);
        const criticalPinned = ctx.truth.evidenceIds.filter((id) => pinned.has(id)).length;
        return criticalPinned >= 2 && ctx.hypothesis === "credential_compromise";
      },
    },
    {
      id: "submit2",
      title: "Submit to finish training",
      body: "When the story holds, submit. Live cases come next.",
      highlight: "dock",
      done: () => false,
    },
  ],
};

/** @deprecated kept for older UI imports */
export const TUTORIAL_ROUND_COUNT = SKILL_ORDER.length;
