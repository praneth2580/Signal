import { padId, lookupName } from "./format.js";
import { hypothesisLabel } from "./hypotheses.js";

/** @typedef {"access" | "money" | "place" | "cover" | "impact"} ChainRole */

export const ALL_TRUTH_TYPES = [
  "credential_compromise",
  "insider_theft",
  "billing_error",
  "vendor_failure",
  "ordinary_variance",
];

/** Trainee: compromise only. Desk+: billing + insider. Senior+: full pool. */
export function allowedTypesForSolves(solves = 0) {
  if (solves >= 8) return ALL_TRUTH_TYPES.slice();
  if (solves >= 3) {
    return ["credential_compromise", "billing_error", "insider_theft"];
  }
  return ["credential_compromise"];
}

export function noiseBudgetForMission(mission) {
  const id = mission?.id ?? "elevated";
  if (id === "routine") return 5;
  if (id === "critical") return 3;
  if (id === "black") return 2;
  return 4;
}

export function redHerringPinCost(mission) {
  const id = mission?.id ?? "elevated";
  if (id === "black") return 120;
  if (id === "critical") return 100;
  return 80;
}

function fakeIp(rng) {
  return `${rng.int(10, 216)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`;
}

function amountBand(mission) {
  const id = mission?.id;
  if (id === "black") return [9000, 28000];
  if (id === "critical") return [14000, 48000];
  return [18000, 64000];
}

function nightTimestamp(rng, clock) {
  const oddHour = clock.at(rng.float(0.55, 0.92));
  const night = new Date(oddHour);
  night.setUTCHours(rng.pick([1, 2, 3, 4]), rng.int(0, 59), 0, 0);
  return night.getTime();
}

function nextId(records, kind, width) {
  const prefix = kind === "events" ? "login" : kind === "transactions" ? "transaction" : "message";
  const list =
    kind === "events"
      ? records.events
      : kind === "transactions"
        ? records.transactions
        : records.messages;
  return padId(prefix, list.length + 1, width);
}

function pushEvent(records, event) {
  records.events.push(event);
  return event.id;
}

function pushTx(records, tx) {
  records.transactions.push(tx);
  return tx.id;
}

function pushMsg(records, msg) {
  records.messages.push(msg);
  return msg.id;
}

function pickOther(rng, people, excludeId) {
  const others = people.filter((person) => person.id !== excludeId);
  return rng.pick(others.length ? others : people);
}

/**
 * Plant smarter decoys: mimic / partial chain / shared-attribute / classic reversed.
 * Returns redHerringIds + decoys metadata.
 */
export function plantDecoys(rng, world, records, context = {}) {
  const { people, accounts, locations, clock, mission } = world;
  const decoyCount = mission?.decoyCount ?? 1;
  const vague = Boolean(mission?.vagueDecoyCopy);
  const victimId = context.victimId ?? null;
  const signalAmount = context.signalAmount ?? null;
  const signalTime = context.signalTime ?? null;
  const redHerringIds = [];
  const decoys = [];

  for (let i = 0; i < decoyCount; i += 1) {
    const mode =
      i === 0
        ? "mimic_reversed"
        : i === 1
          ? "partial_access"
          : i === 2
            ? "shared_attribute"
            : "noisy_message";

    if (mode === "mimic_reversed") {
      const decoyEmployee = pickOther(rng, people, victimId);
      const amount =
        signalAmount != null
          ? Math.round(Math.abs(signalAmount) * rng.float(0.75, 1.15)) * -1
          : rng.int(8000, 24000) * -1;
      const timestamp =
        signalTime != null
          ? clock.around(signalTime, 18)
          : clock.at(rng.float(0.2, 0.85));
      const tx = {
        id: nextId(records, "transactions", 4),
        employeeId: decoyEmployee.id,
        accountId: rng.pick(accounts).id,
        locationId: decoyEmployee.locationId,
        timestamp,
        amount,
        type: rng.pick(["refund", "transfer", "adjustment"]),
        status: "reversed",
      };
      pushTx(records, tx);
      redHerringIds.push(tx.id);
      decoys.push({ id: tx.id, whyInnocent: "reversed — money did not stay moved" });

      const drillMessage = {
        id: nextId(records, "messages", 3),
        fromId: rng.pick(people).id,
        toId: decoyEmployee.id,
        timestamp: clock.around(tx.timestamp, 6),
        subject: vague ? "Re: tabletop notes" : "Suspicious activity drill",
        excerpt: vague
          ? "We already walked this scenario last week. Do not escalate unless something new shows up."
          : "Ignore the flagged refund in training. It was a tabletop exercise.",
      };
      pushMsg(records, drillMessage);
      redHerringIds.push(drillMessage.id);
      decoys.push({
        id: drillMessage.id,
        whyInnocent: "explains the reversed refund as a drill",
      });
    } else if (mode === "partial_access") {
      const decoyEmployee = pickOther(rng, people, victimId);
      const oddPlace = rng.pick(
        locations.filter((loc) => loc.id !== decoyEmployee.locationId).length
          ? locations.filter((loc) => loc.id !== decoyEmployee.locationId)
          : locations,
      );
      const failed = {
        id: nextId(records, "events", 3),
        employeeId: decoyEmployee.id,
        locationId: oddPlace.id,
        timestamp: nightTimestamp(rng, clock),
        type: "failed_login",
        ip: fakeIp(rng),
      };
      pushEvent(records, failed);
      redHerringIds.push(failed.id);
      decoys.push({
        id: failed.id,
        whyInnocent: "odd access attempt with no following money move",
      });
    } else if (mode === "shared_attribute" && victimId) {
      const earlier = clock.at(rng.float(0.08, 0.35));
      const tx = {
        id: nextId(records, "transactions", 4),
        employeeId: victimId,
        accountId: rng.pick(accounts).id,
        locationId: people.find((p) => p.id === victimId)?.locationId ?? rng.pick(locations).id,
        timestamp: earlier,
        amount: rng.int(7000, 16000) * -1,
        type: "charge",
        status: "posted",
      };
      pushTx(records, tx);
      redHerringIds.push(tx.id);
      decoys.push({
        id: tx.id,
        whyInnocent: "same employee, earlier ordinary large charge — no odd-hours access chain",
      });
    } else {
      const decoyEmployee = pickOther(rng, people, victimId);
      const noisyMsg = {
        id: nextId(records, "messages", 3),
        fromId: decoyEmployee.id,
        toId: rng.pick(people).id,
        timestamp: clock.at(rng.float(0.3, 0.8)),
        subject: vague ? "Ledger check" : "Possible duplicate charge",
        excerpt: vague
          ? "Flagging this for eyes only. Could be nothing."
          : "Looks weird on my screen but I think it already reversed.",
      };
      pushMsg(records, noisyMsg);
      redHerringIds.push(noisyMsg.id);
      decoys.push({ id: noisyMsg.id, whyInnocent: "hearsay — no ledger proof" });
    }
  }

  return { redHerringIds, decoys };
}

export function pickTruthType(rng, allowedTypes) {
  const pool =
    Array.isArray(allowedTypes) && allowedTypes.length > 0
      ? allowedTypes
      : ["credential_compromise"];
  return rng.pick(pool);
}

/**
 * Skeleton truth before evidence injection (actors + type).
 */
export function generateTruth(rng, { people, accounts, locations }, options = {}) {
  const type = options.forceType
    ? options.forceType
    : pickTruthType(rng, options.allowedTypes);

  const victim = rng.pick(people);
  const unusualLocations = locations.filter((location) => location.id !== victim.locationId);
  const location = rng.pick(unusualLocations.length > 0 ? unusualLocations : locations);

  let account = rng.pick(accounts);
  if (type === "insider_theft") {
    const owned = accounts.filter((item) => item.ownerId === victim.id);
    account = owned.length ? rng.pick(owned) : account;
  }

  if (type === "vendor_failure") {
    const partners = locations.filter((item) => item.type === "partner");
    const place = partners.length ? rng.pick(partners) : location;
    return {
      type,
      employeeId: victim.id,
      accountId: account.id,
      locationId: place.id,
      criticalTransactionId: null,
      evidenceIds: [],
      chain: [],
      redHerringIds: [],
      decoys: [],
    };
  }

  return {
    type,
    employeeId: victim.id,
    accountId: account.id,
    locationId: location.id,
    criticalTransactionId: null,
    evidenceIds: [],
    chain: [],
    redHerringIds: [],
    decoys: [],
  };
}

function injectCredentialCompromise(rng, world, records) {
  const { people, accounts, locations, clock, truth, mission } = world;
  const victim = people.find((person) => person.id === truth.employeeId);
  const account = accounts.find((item) => item.id === truth.accountId);
  const location = locations.find((item) => item.id === truth.locationId);
  const night = nightTimestamp(rng, clock);
  const [amin, amax] = amountBand(mission);

  const login = {
    id: nextId(records, "events", 3),
    employeeId: victim.id,
    locationId: location.id,
    timestamp: night,
    type: "login",
    ip: `${rng.int(80, 210)}.${rng.int(1, 80)}.${rng.int(1, 80)}.${rng.int(1, 254)}`,
  };
  pushEvent(records, login);

  const transaction = {
    id: nextId(records, "transactions", 4),
    employeeId: victim.id,
    accountId: account.id,
    locationId: location.id,
    timestamp: night + rng.int(8, 40) * 60 * 1000,
    amount: rng.int(amin, amax) * -1,
    type: "transfer",
    status: "posted",
  };
  pushTx(records, transaction);

  const planted = plantDecoys(rng, world, records, {
    victimId: victim.id,
    signalAmount: transaction.amount,
    signalTime: transaction.timestamp,
  });

  const chain = [
    {
      id: login.id,
      kind: "events",
      role: "access",
      label: "Odd-hours login",
    },
    {
      id: transaction.id,
      kind: "transactions",
      role: "money",
      label: "Posted transfer",
    },
    {
      id: location.id,
      kind: "locations",
      role: "place",
      label: "Unusual place",
    },
  ];

  return {
    ...truth,
    criticalTransactionId: transaction.id,
    evidenceIds: chain.map((beat) => beat.id),
    chain,
    redHerringIds: planted.redHerringIds,
    decoys: planted.decoys,
  };
}

function injectInsiderTheft(rng, world, records) {
  const { people, accounts, locations, clock, truth, mission } = world;
  const insider = people.find((person) => person.id === truth.employeeId);
  let account = accounts.find((item) => item.id === truth.accountId);
  const owned = accounts.filter((item) => item.ownerId === insider.id);
  if (owned.length) account = rng.pick(owned);
  const home = locations.find((item) => item.id === insider.locationId);
  const night = nightTimestamp(rng, clock);
  const [amin, amax] = amountBand(mission);

  const login = {
    id: nextId(records, "events", 3),
    employeeId: insider.id,
    locationId: home.id,
    timestamp: night,
    type: "login",
    ip: fakeIp(rng),
  };
  pushEvent(records, login);

  const cover = {
    id: nextId(records, "messages", 3),
    fromId: insider.id,
    toId: pickOther(rng, people, insider.id).id,
    timestamp: night - rng.int(20, 90) * 60 * 1000,
    subject: "I'll close Acme tonight",
    excerpt: "Leave the book with me. I'll push the adjustment before morning standup.",
  };
  pushMsg(records, cover);

  const transaction = {
    id: nextId(records, "transactions", 4),
    employeeId: insider.id,
    accountId: account.id,
    locationId: home.id,
    timestamp: night + rng.int(10, 50) * 60 * 1000,
    amount: rng.int(amin, amax) * -1,
    type: "transfer",
    status: "posted",
  };
  pushTx(records, transaction);

  const planted = plantDecoys(rng, world, records, {
    victimId: insider.id,
    signalAmount: transaction.amount,
    signalTime: transaction.timestamp,
  });

  const chain = [
    { id: login.id, kind: "events", role: "access", label: "Home-desk login" },
    { id: cover.id, kind: "messages", role: "cover", label: "Cover message" },
    { id: transaction.id, kind: "transactions", role: "money", label: "Owned-account transfer" },
  ];

  return {
    ...truth,
    accountId: account.id,
    locationId: home.id,
    criticalTransactionId: transaction.id,
    evidenceIds: chain.map((beat) => beat.id),
    chain,
    redHerringIds: planted.redHerringIds,
    decoys: planted.decoys,
  };
}

function injectBillingError(rng, world, records) {
  const { people, accounts, clock, truth, mission } = world;
  const analyst = people.find((person) => person.id === truth.employeeId);
  const primary = accounts.find((item) => item.id === truth.accountId);
  const [amin, amax] = amountBand(mission);
  const baseTime = clock.at(rng.float(0.4, 0.7));
  const related = accounts.filter((item) => item.id !== primary.id).slice(0, 2);
  const clusterAccounts = [primary, ...related];

  const adjustments = clusterAccounts.map((account, index) => {
    const tx = {
      id: nextId(records, "transactions", 4),
      employeeId: analyst.id,
      accountId: account.id,
      locationId: analyst.locationId,
      timestamp: baseTime + index * rng.int(15, 90) * 60 * 1000,
      amount: rng.int(Math.floor(amin * 0.4), Math.floor(amax * 0.55)) * (rng.chance(0.5) ? -1 : 1),
      type: "adjustment",
      status: "posted",
    };
    pushTx(records, tx);
    return tx;
  });

  const impact = {
    id: nextId(records, "messages", 3),
    fromId: analyst.id,
    toId: pickOther(rng, people, analyst.id).id,
    timestamp: clock.around(adjustments[0].timestamp, 4),
    subject: "Pricing table drift",
    excerpt:
      "The promo multiplier landed on the wrong SKU family. Adjustments should reverse the gap once finance confirms.",
  };
  pushMsg(records, impact);

  const planted = plantDecoys(rng, world, records, {
    victimId: analyst.id,
    signalAmount: adjustments[0].amount,
    signalTime: adjustments[0].timestamp,
  });

  const chain = [
    {
      id: adjustments[0].id,
      kind: "transactions",
      role: "money",
      label: "Pricing adjustment",
    },
    ...(adjustments[1]
      ? [
          {
            id: adjustments[1].id,
            kind: "transactions",
            role: "money",
            label: "Linked adjustment",
          },
        ]
      : []),
    { id: impact.id, kind: "messages", role: "impact", label: "Ops note on pricing" },
  ];

  return {
    ...truth,
    locationId: analyst.locationId,
    criticalTransactionId: adjustments[0].id,
    evidenceIds: chain.map((beat) => beat.id),
    chain,
    redHerringIds: planted.redHerringIds,
    decoys: planted.decoys,
  };
}

function injectVendorFailure(rng, world, records) {
  const { people, accounts, locations, clock, truth, mission } = world;
  const contact = people.find((person) => person.id === truth.employeeId);
  const account = accounts.find((item) => item.id === truth.accountId);
  const place =
    locations.find((item) => item.id === truth.locationId) ??
    locations.find((item) => item.type === "partner") ??
    locations[0];
  const when = clock.at(rng.float(0.45, 0.8));
  const [amin, amax] = amountBand(mission);

  const gateway = {
    id: nextId(records, "events", 3),
    employeeId: contact.id,
    locationId: place.id,
    timestamp: when,
    type: "login",
    ip: fakeIp(rng),
  };
  pushEvent(records, gateway);

  const badPost = {
    id: nextId(records, "transactions", 4),
    employeeId: contact.id,
    accountId: account.id,
    locationId: place.id,
    timestamp: when + rng.int(20, 120) * 60 * 1000,
    amount: rng.int(amin, amax) * -1,
    type: "charge",
    status: "reversed",
  };
  pushTx(records, badPost);

  const cover = {
    id: nextId(records, "messages", 3),
    fromId: contact.id,
    toId: pickOther(rng, people, contact.id).id,
    timestamp: clock.around(badPost.timestamp, 5),
    subject: "Vendor gateway timeout",
    excerpt:
      "Partner feed dropped mid-batch. Reversals are automatic until they republish the file. Not an internal theft.",
  };
  pushMsg(records, cover);

  const planted = plantDecoys(rng, world, records, {
    victimId: contact.id,
    signalAmount: badPost.amount,
    signalTime: badPost.timestamp,
  });

  const chain = [
    { id: gateway.id, kind: "events", role: "access", label: "Partner gateway session" },
    { id: badPost.id, kind: "transactions", role: "money", label: "Failed partner charge" },
    { id: cover.id, kind: "messages", role: "cover", label: "Vendor outage note" },
  ];

  return {
    ...truth,
    locationId: place.id,
    criticalTransactionId: badPost.id,
    evidenceIds: chain.map((beat) => beat.id),
    chain,
    redHerringIds: planted.redHerringIds,
    decoys: planted.decoys,
  };
}

function injectOrdinaryVariance(rng, world, records) {
  const { people, accounts, clock, truth } = world;
  const decoys = [];
  const redHerringIds = [];

  for (let i = 0; i < 3; i += 1) {
    const person = rng.pick(people);
    const tx = {
      id: nextId(records, "transactions", 4),
      employeeId: person.id,
      accountId: rng.pick(accounts).id,
      locationId: person.locationId,
      timestamp: clock.at(rng.float(0.2, 0.85)),
      amount: rng.int(9000, 22000) * -1,
      type: rng.pick(["refund", "transfer", "adjustment"]),
      status: i === 0 ? "reversed" : "posted",
    };
    pushTx(records, tx);
    redHerringIds.push(tx.id);
    decoys.push({
      id: tx.id,
      whyInnocent:
        i === 0
          ? "reversed — looks loud but never settled"
          : "ordinary large movement inside normal variance",
    });
  }

  const note = {
    id: nextId(records, "messages", 3),
    fromId: rng.pick(people).id,
    toId: rng.pick(people).id,
    timestamp: clock.at(rng.float(0.3, 0.6)),
    subject: "Seasonality check",
    excerpt:
      "Same soft week last year. Controllers already compared the window — no incident ticket opened.",
  };
  pushMsg(records, note);
  redHerringIds.push(note.id);
  decoys.push({ id: note.id, whyInnocent: "confirms the soft week is expected variance" });

  // Extra classic decoys scaled by mission
  const planted = plantDecoys(rng, world, records, {
    victimId: truth.employeeId,
  });

  return {
    ...truth,
    criticalTransactionId: null,
    evidenceIds: [],
    chain: [],
    redHerringIds: [...redHerringIds, ...planted.redHerringIds],
    decoys: [...decoys, ...planted.decoys],
  };
}

const INJECTORS = {
  credential_compromise: injectCredentialCompromise,
  insider_theft: injectInsiderTheft,
  billing_error: injectBillingError,
  vendor_failure: injectVendorFailure,
  ordinary_variance: injectOrdinaryVariance,
};

export function injectTruth(rng, world, records) {
  const type = world.truth?.type ?? "credential_compromise";
  const inject = INJECTORS[type] ?? injectCredentialCompromise;
  return inject(rng, world, records);
}

export function narrateTruth(gameCase) {
  const truth = gameCase.truth;
  const employee = lookupName(gameCase.people, truth.employeeId);
  const location = lookupName(gameCase.locations, truth.locationId);
  const account = gameCase.accounts.find((item) => item.id === truth.accountId);
  const customer = account?.customer ?? "a customer account";

  switch (truth.type) {
    case "insider_theft":
      return `${employee} used their own desk access to siphon funds from ${customer}.`;
    case "billing_error":
      return `A pricing / billing adjustment cluster hit ${customer} and related books — process error, not theft.`;
    case "vendor_failure":
      return `A partner process at ${location} failed and left reversed / broken posts on ${customer}.`;
    case "ordinary_variance":
      return "The soft window was ordinary variance. The loud rows were noise, not an incident.";
    case "credential_compromise":
    default:
      return `${employee}'s credentials were used from ${location} to move funds on ${customer}.`;
  }
}

export function lessonBodyForType(truth, ctx) {
  const label = hypothesisLabel(truth.type);
  const { accurate, who, guessed, chainIds, criticalPinned, evidenceCount, chased } = ctx;

  if (truth.type === "ordinary_variance") {
    if (accurate) {
      const parts = [
        "There was no theft chain — the right call was ordinary variance.",
        evidenceCount
          ? ""
          : "Strong solves leave the planted loud rows unpinned.",
      ];
      if (chased.length) {
        parts.push(`You still chased decoy noise (${chased.join(", ")}), which costs score.`);
      }
      return parts.filter(Boolean).join(" ");
    }
    return `The real cause was ordinary variance — not “${guessed}”. The loud rows were planted noise with explainers.`;
  }

  if (accurate) {
    const parts = [
      `The signal was a chain for “${label}”: ${chainIds.join(" → ") || "no single loud row"}.`,
    ];
    if (criticalPinned.length) {
      parts.push(`You pinned ${criticalPinned.length}/${evidenceCount} critical records.`);
    } else if (evidenceCount > 0) {
      parts.push("You named the right cause, but stronger solves pin the full chain.");
    }
    if (chased.length) {
      parts.push(`Decoys you pinned: ${chased.join(", ")}.`);
    }
    return parts.join(" ");
  }

  return [
    `The real cause was “${label}” — not “${guessed}”.`,
    chainIds.length
      ? `Look for ${chainIds.join(" → ")}.`
      : `Focus on ${who} and related activity.`,
    chased.length ? `If you chased ${chased[0]}, that was planted noise.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
