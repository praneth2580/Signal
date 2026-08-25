import { lookupName } from "./format.js";

export const LEAK_OFFERS = [
  {
    id: "anonymous_tip",
    cost: 45,
    label: "Anonymous tip",
    blurb: "A vague lead about where the signal originated.",
  },
  {
    id: "ledger_contact",
    cost: 80,
    label: "Ledger contact",
    blurb: "Someone in finance narrows what kind of movement matters.",
  },
  {
    id: "clear_herring",
    cost: 60,
    label: "Burn a decoy",
    blurb: "Pay to confirm one suspicious-looking item is noise.",
  },
  {
    id: "credential_leak",
    cost: 150,
    label: "Pay for a name",
    blurb: "Buy whose credentials are in play. Expensive.",
  },
];

export function resolveLeak(gameCase, leakId) {
  const truth = gameCase.truth;
  const place = lookupName(gameCase.locations, truth.locationId);
  const person = lookupName(gameCase.people, truth.employeeId);
  const herring = (truth.redHerringIds ?? [])[0];

  switch (leakId) {
    case "anonymous_tip":
      return `A tip lands: the movement that matters routes through ${place}. They will not say who was on the session.`;
    case "ledger_contact":
      return "A ledger contact says skip the reversed refunds. Look for a posted transfer that does not fit the daytime pattern.";
    case "clear_herring":
      return herring
        ? `${herring} is a decoy. It looks loud on purpose.`
        : "Your contact finds nothing clean enough to burn. Keep digging.";
    case "credential_leak":
      return `Someone sells you a name: ${person}. Their credentials may be in play — prove the rest yourself.`;
    default:
      return null;
  }
}
