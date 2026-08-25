import { padId } from "./format.js";

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

function injectSignal(rng, world, records) {
  const { people, accounts, locations, clock, truth } = world;
  const victim = people.find((person) => person.id === truth.employeeId);
  const account = accounts.find((item) => item.id === truth.accountId);
  const location = locations.find((item) => item.id === truth.locationId);
  const oddHour = clock.at(rng.float(0.55, 0.92));
  const night = new Date(oddHour);
  night.setUTCHours(rng.pick([1, 2, 3, 4]), rng.int(0, 59), 0, 0);

  const login = {
    id: padId("login", records.events.length + 1, 3),
    employeeId: victim.id,
    locationId: location.id,
    timestamp: night.getTime(),
    type: "login",
    ip: `${rng.int(80, 210)}.${rng.int(1, 80)}.${rng.int(1, 80)}.${rng.int(1, 254)}`,
  };

  const transaction = {
    id: padId("transaction", records.transactions.length + 1, 4),
    employeeId: victim.id,
    accountId: account.id,
    locationId: location.id,
    timestamp: night.getTime() + rng.int(8, 40) * 60 * 1000,
    amount: rng.int(18000, 64000) * -1,
    type: "transfer",
    status: "posted",
  };

  const decoyEmployee = rng.pick(people.filter((person) => person.id !== victim.id));
  const decoyTx = {
    id: padId("transaction", records.transactions.length + 2, 4),
    employeeId: decoyEmployee.id,
    accountId: rng.pick(accounts).id,
    locationId: decoyEmployee.locationId,
    timestamp: clock.at(rng.float(0.3, 0.8)),
    amount: rng.int(9000, 22000) * -1,
    type: "refund",
    status: "reversed",
  };

  const drillMessage = {
    id: padId("message", records.messages.length + 1, 3),
    fromId: rng.pick(people).id,
    toId: decoyEmployee.id,
    timestamp: clock.around(decoyTx.timestamp, 6),
    subject: "Suspicious activity drill",
    excerpt: "Ignore the flagged refund in training. It was a tabletop exercise.",
  };

  records.events.push(login);
  records.transactions.push(transaction, decoyTx);
  records.messages.push(drillMessage);

  return {
    ...truth,
    criticalTransactionId: transaction.id,
    evidenceIds: [login.id, transaction.id, location.id],
    redHerringIds: [decoyTx.id, drillMessage.id],
  };
}

export function generateEvidence(rng, world) {
  const records = {
    transactions: backgroundTransactions(rng, world),
    events: backgroundEvents(rng, world),
    messages: backgroundMessages(rng, world),
  };
  const truth = injectSignal(rng, world, records);

  const byTime = (a, b) => a.timestamp - b.timestamp;
  records.transactions.sort(byTime);
  records.events.sort(byTime);
  records.messages.sort(byTime);

  return { ...records, truth };
}
