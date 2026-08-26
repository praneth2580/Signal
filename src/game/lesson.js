import { formatMoney, formatStamp, lookupName } from "./format.js";
import { hypothesisLabel } from "./hypotheses.js";

/**
 * Build a plain-language debrief for why the anomaly was / was not caught.
 */
export function buildLesson(gameCase, player, accurate) {
  const truth = gameCase.truth;
  const [loginId, txId, placeId] = truth.evidenceIds;
  const decoyTxId = truth.redHerringIds?.[0];
  const decoyMsgId = truth.redHerringIds?.[1];

  const login = gameCase.events.find((item) => item.id === loginId);
  const transfer = gameCase.transactions.find((item) => item.id === txId);
  const place = gameCase.locations.find((item) => item.id === placeId);
  const employee = gameCase.people.find((item) => item.id === truth.employeeId);
  const account = gameCase.accounts.find((item) => item.id === truth.accountId);
  const home = gameCase.locations.find((item) => item.id === employee?.locationId);
  const decoyTx = gameCase.transactions.find((item) => item.id === decoyTxId);
  const decoyMsg = gameCase.messages.find((item) => item.id === decoyMsgId);

  const stamp = login ? formatStamp(login.timestamp) : "an odd hour";
  const money = transfer ? formatMoney(transfer.amount) : "a large transfer";
  const who = employee?.name ?? "the employee";
  const where = place?.name ?? placeId;
  const homeName = home?.name;
  const customer = account?.customer ?? "a customer account";

  const chain = [
    {
      id: loginId,
      kind: "events",
      label: "Odd-hours login",
      detail: `${who} at ${stamp} from ${where}${homeName ? ` (not ${homeName})` : ""}`,
    },
    {
      id: txId,
      kind: "transactions",
      label: "Posted transfer",
      detail: `${money} on ${customer} — money that actually moved`,
    },
    {
      id: placeId,
      kind: "locations",
      label: "Unusual place",
      detail: `${where} ties the login and the transfer together`,
    },
  ];

  const pinned = new Set(player.selectedEvidence ?? []);
  const criticalPinned = truth.evidenceIds.filter((id) => pinned.has(id));
  const decoysPinned = (truth.redHerringIds ?? []).filter((id) => pinned.has(id));

  if (accurate) {
    const parts = [
      `The signal was a chain, not a single loud row: ${loginId} → ${txId} → ${placeId}.`,
      `${who} appeared at ${where} at ${stamp}${homeName ? `, away from ${homeName}` : ""}, then ${money} posted out of ${customer}.`,
    ];
    if (criticalPinned.length) {
      parts.push(`You pinned ${criticalPinned.length}/${truth.evidenceIds.length} critical records.`);
    } else {
      parts.push("You named the right cause, but stronger solves pin the login, transfer, and place.");
    }
    if (decoyTx && decoysPinned.includes(decoyTx.id)) {
      parts.push(
        `${decoyTx.id} was a reversed refund decoy${decoyMsg ? ` — “${decoyMsg.subject}” explained it` : ""}. Pinning it still costs score.`,
      );
    } else if (decoyTx) {
      parts.push(
        `The loud reversed refund (${decoyTx.id}) was noise${decoyMsg ? `; the drill note gave it away` : ""}.`,
      );
    }
    return {
      title: "Why you caught it",
      body: parts.join(" "),
      chain,
      criticalPinned,
      decoysPinned,
    };
  }

  const guessed = player.hypothesis
    ? hypothesisLabel(player.hypothesis)
    : "no hypothesis";
  const parts = [
    `The real cause was stolen credentials moving money — not “${guessed}”.`,
    `Look for ${loginId} (odd-hours login) leading into ${txId} (posted transfer) at ${where}.`,
  ];
  if (decoyTx) {
    parts.push(
      `If you chased ${decoyTx.id}, that reversed refund was planted noise${decoyMsg ? ` (${decoyMsg.subject})` : ""}.`,
    );
  }
  return {
    title: "Why the noise won",
    body: parts.join(" "),
    chain,
    criticalPinned,
    decoysPinned,
  };
}
