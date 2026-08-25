import { generateEvidence } from "./evidence.js";
import { generateWorld } from "./world.js";

const SITUATIONS = [
  {
    title: "Unexplained revenue gap",
    happened:
      "Posted volume for this window came in light, but new customers did not fall with it. Finance noticed outbound transfers nobody on the floor remembers authorizing. Leadership wants the cause, not a guess.",
  },
  {
    title: "Quiet week on a busy book",
    happened:
      "A regional book closed unusually thin while warehouse and support activity looked normal. Someone in operations flagged it because the two pictures do not match.",
  },
  {
    title: "Ledger missing the floor",
    happened:
      "Support volume held steady, yet posted totals did not. A controller asked for an independent pass through people, accounts, and activity before anyone writes this off as seasonality.",
  },
  {
    title: "Off-hours movement",
    happened:
      "The period looks ordinary until you sit with the timestamps. A few large movements landed when the desk was empty. Nobody has a clean story for who initiated them.",
  },
];

const FIND =
  "Identify what actually happened, pin the records that support that conclusion, and submit a hypothesis. Most of the data is ordinary. Some of it only looks guilty. Do not assume a flagged row is the answer.";

export function generateCase(seed, rng) {
  const world = generateWorld(rng);
  const evidence = generateEvidence(rng, world);
  const situation = rng.pick(SITUATIONS);

  return {
    seed,
    allottedMs: rng.int(8, 12) * 60 * 1000,
    briefing: {
      title: situation.title,
      happened: situation.happened,
      find: FIND,
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
  };
}
