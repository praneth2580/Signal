import { padId } from "./format.js";

const FIRST_NAMES = [
  "Priya", "Marcus", "Elena", "Jonah", "Amina", "Chris", "Leah", "Diego",
  "Sofia", "Nate", "Hana", "Owen", "Maya", "Ibrahim", "Claire", "Theo",
  "Jun", "Rosa", "Peter", "Anika",
];

const LAST_NAMES = [
  "Shah", "Cole", "Voss", "Reed", "Hassan", "Park", "Ng", "Alvarez",
  "Ito", "Brooks", "Keller", "Dunn", "Okoye", "Fraser", "Nguyen", "Hart",
];

const ROLES = [
  { role: "Account Manager", department: "Sales" },
  { role: "Billing Analyst", department: "Finance" },
  { role: "Support Lead", department: "Support" },
  { role: "Ops Coordinator", department: "Operations" },
  { role: "Engineer", department: "Product" },
  { role: "Controller", department: "Finance" },
  { role: "Warehouse Lead", department: "Operations" },
];

const LOCATION_TEMPLATES = [
  { name: "Austin HQ", city: "Austin", type: "office" },
  { name: "Memphis Yard", city: "Memphis", type: "warehouse" },
  { name: "London Desk", city: "London", type: "office" },
  { name: "Remote West", city: "Portland", type: "remote" },
  { name: "Chicago Floor", city: "Chicago", type: "office" },
  { name: "Miami Field", city: "Miami", type: "field" },
  { name: "Denver Hub", city: "Denver", type: "office" },
  { name: "Toronto Desk", city: "Toronto", type: "office" },
  { name: "Vendor Gateway", city: "Phoenix", type: "partner" },
];

const CUSTOMERS = [
  "Northwind Clinic", "Harbor Freight Co", "Lumen Schools", "Redwood Labs",
  "Kite Apparel", "Oak & Iron", "Blueline Transit", "Cinder Press",
  "Vesper Hotels", "Fieldnote Inc", "Copper & Co", "Nimbus Dental",
];

export function createClock(rng) {
  const start = Date.UTC(2026, rng.int(0, 4), rng.int(4, 18));
  const span = 12 * 24 * 60 * 60 * 1000;

  return {
    start,
    end: start + span,
    at(t) {
      return start + t * span;
    },
    random() {
      return start + rng.next() * span;
    },
    around(timestamp, hours) {
      const delta = rng.float(-hours, hours) * 60 * 60 * 1000;
      return timestamp + delta;
    },
  };
}

export function generateLocations(rng, count) {
  return rng.shuffle(LOCATION_TEMPLATES).slice(0, count).map((location, index) => ({
    id: padId("location", index + 1),
    ...location,
  }));
}

export function generatePeople(rng, count, locations) {
  const used = new Set();
  const people = [];

  while (people.length < count) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    if (used.has(name)) continue;
    used.add(name);
    const job = rng.pick(ROLES);
    people.push({
      id: padId("employee", people.length + 1),
      name,
      role: job.role,
      department: job.department,
      locationId: rng.pick(locations).id,
      hired: `${rng.int(2017, 2025)}-${String(rng.int(1, 12)).padStart(2, "0")}`,
    });
  }

  return people;
}

export function generateAccounts(rng, count, people) {
  const owners = people.filter((person) =>
    person.department === "Sales" || person.department === "Finance" || person.department === "Support",
  );
  const pool = owners.length > 0 ? owners : people;

  return Array.from({ length: count }, (_, index) => ({
    id: padId("account", index + 1, 3),
    customer: CUSTOMERS[index % CUSTOMERS.length] + (index >= CUSTOMERS.length ? ` ${Math.floor(index / CUSTOMERS.length) + 1}` : ""),
    ownerId: rng.pick(pool).id,
    opened: `${rng.int(2021, 2026)}-${String(rng.int(1, 12)).padStart(2, "0")}`,
  }));
}

export function generateTruth(rng, { people, accounts, locations }) {
  const victim = rng.pick(people);
  const unusualLocations = locations.filter((location) => location.id !== victim.locationId);
  const location = rng.pick(unusualLocations.length > 0 ? unusualLocations : locations);
  const account = rng.pick(accounts);

  return {
    type: "credential_compromise",
    employeeId: victim.id,
    accountId: account.id,
    locationId: location.id,
    criticalTransactionId: null,
    evidenceIds: [],
  };
}

export function generateWorld(rng, overrides = {}) {
  const params = {
    employeeCount: rng.int(12, 22),
    accountCount: rng.int(16, 24),
    locationCount: rng.int(6, 9),
    transactionCount: rng.int(90, 160),
    eventCount: rng.int(40, 70),
    messageCount: rng.int(18, 32),
    ...overrides.params,
  };
  const clock = createClock(rng);
  const locations = generateLocations(rng, params.locationCount);
  const people = generatePeople(rng, params.employeeCount, locations);
  const accounts = generateAccounts(rng, params.accountCount, people);
  const truth = generateTruth(rng, { people, accounts, locations });

  return { params, clock, locations, people, accounts, truth };
}
