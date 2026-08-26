import { padId } from "./format.js";
import { injectTruth } from "./truths.js";

const TX_TYPES = ["charge", "refund", "transfer", "adjustment"];
const MESSAGE_SUBJECTS = [
  "Q2 invoice batch",
  "Warehouse delay",
  "Password reset help",
  "Customer call notes",
  "Promo calendar",
  "Shift coverage",
  "Vendor onboarding",
  "Refund policy",
];

function fakeIp(rng) {
  return `${rng.int(10, 216)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`;
}

function backgroundTransactions(rng, world) {
  const { people, accounts, locations, clock, params } = world;

  return Array.from({ length: params.transactionCount }, (_, index) => {
    const employee = rng.pick(people);
    return {
      id: padId("transaction", index + 1, 4),
      employeeId: employee.id,
      accountId: rng.pick(accounts).id,
      locationId: rng.chance(0.7) ? employee.locationId : rng.pick(locations).id,
      timestamp: clock.random(),
      amount: rng.int(40, 4800) * (rng.chance(0.12) ? -1 : 1),
      type: rng.pick(TX_TYPES),
      status: rng.chance(0.08) ? "reversed" : "posted",
    };
  });
}

function backgroundEvents(rng, world) {
  const { people, locations, clock, params } = world;

  return Array.from({ length: params.eventCount }, (_, index) => {
    const employee = rng.pick(people);
    const failed = rng.chance(0.12);
    return {
      id: padId("login", index + 1, 3),
      employeeId: employee.id,
      locationId: failed ? rng.pick(locations).id : employee.locationId,
      timestamp: clock.random(),
      type: failed ? "failed_login" : "login",
      ip: fakeIp(rng),
    };
  });
}

function backgroundMessages(rng, world) {
  const { people, clock, params } = world;

  return Array.from({ length: params.messageCount }, (_, index) => {
    const from = rng.pick(people);
    let to = rng.pick(people);
    if (to.id === from.id) to = rng.pick(people);
    return {
      id: padId("message", index + 1, 3),
      fromId: from.id,
      toId: to.id,
      timestamp: clock.random(),
      subject: rng.pick(MESSAGE_SUBJECTS),
      excerpt: rng.chance(0.2)
        ? "Can you check this when you have a minute?"
        : "Looping you in on the weekly numbers.",
    };
  });
}

export function generateEvidence(rng, world) {
  const records = {
    transactions: backgroundTransactions(rng, world),
    events: backgroundEvents(rng, world),
    messages: backgroundMessages(rng, world),
  };
  const truth = injectTruth(rng, world, records);

  const byTime = (a, b) => a.timestamp - b.timestamp;
  records.transactions.sort(byTime);
  records.events.sort(byTime);
  records.messages.sort(byTime);

  return { ...records, truth };
}
