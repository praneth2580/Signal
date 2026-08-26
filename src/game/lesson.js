import { formatMoney, formatStamp, lookupName } from "./format.js";
import { hypothesisLabel } from "./hypotheses.js";
import { lessonBodyForType } from "./truths.js";

function resolveBeatDetail(gameCase, beat, truth) {
  const employee = gameCase.people.find((item) => item.id === truth.employeeId);
  const account = gameCase.accounts.find((item) => item.id === truth.accountId);
  const home = gameCase.locations.find((item) => item.id === employee?.locationId);
  const who = employee?.name ?? "the employee";
  const customer = account?.customer ?? "a customer account";

  if (beat.kind === "events") {
    const login = gameCase.events.find((item) => item.id === beat.id);
    const place = gameCase.locations.find((item) => item.id === login?.locationId);
    const stamp = login ? formatStamp(login.timestamp) : "an odd hour";
    const where = place?.name ?? login?.locationId ?? "an unusual place";
    if (beat.role === "access" && truth.type === "credential_compromise") {
      return `${who} at ${stamp} from ${where}${home ? ` (not ${home.name})` : ""}`;
    }
    if (beat.role === "access" && truth.type === "insider_theft") {
      return `${who} logged in at home desk ${where} at ${stamp}`;
    }
    return `${who} session at ${where} · ${stamp}`;
  }

  if (beat.kind === "transactions") {
    const transfer = gameCase.transactions.find((item) => item.id === beat.id);
    const money = transfer ? formatMoney(transfer.amount) : "a large movement";
    const status = transfer?.status ?? "posted";
    return `${money} on ${customer} (${status})`;
  }

  if (beat.kind === "messages") {
    const msg = gameCase.messages.find((item) => item.id === beat.id);
    return msg ? `“${msg.subject}” — ${msg.excerpt}` : "a linked message";
  }

  if (beat.kind === "locations") {
    const place = gameCase.locations.find((item) => item.id === beat.id);
    const where = place?.name ?? beat.id;
    return `${where} ties access and money together`;
  }

  return beat.label;
}

/**
 * Build a plain-language debrief for why the anomaly was / was not caught.
 */
export function buildLesson(gameCase, player, accurate) {
  const truth = gameCase.truth;
  const pinned = new Set(player.selectedEvidence ?? []);
  const evidenceIds = truth.evidenceIds ?? [];
  const redHerringIds = truth.redHerringIds ?? [];
  const decoyMeta = truth.decoys ?? [];

  const sourceChain =
    Array.isArray(truth.chain) && truth.chain.length > 0
      ? truth.chain
      : evidenceIds.map((id, index) => ({
          id,
          kind: "unknown",
          role: "money",
          label: index === 0 ? "Critical record" : `Critical record ${index + 1}`,
        }));

  const chain = sourceChain.map((beat) => ({
    ...beat,
    detail: resolveBeatDetail(gameCase, beat, truth),
    status: pinned.has(beat.id) ? "hit" : "missed",
  }));

  const criticalPinned = evidenceIds.filter((id) => pinned.has(id));
  const decoysPinned = redHerringIds.filter((id) => pinned.has(id));
  const chased = decoysPinned.map((id) => {
    const meta = decoyMeta.find((item) => item.id === id);
    return {
      id,
      whyInnocent: meta?.whyInnocent ?? "planted noise",
    };
  });

  const who = lookupName(gameCase.people, truth.employeeId);
  const guessed = player.hypothesis
    ? hypothesisLabel(player.hypothesis)
    : "no hypothesis";

  const body = lessonBodyForType(truth, {
    accurate,
    who,
    guessed,
    chainIds: chain.map((beat) => beat.id),
    criticalPinned,
    evidenceCount: evidenceIds.length,
    chased: chased.map((item) => item.id),
  });

  return {
    title: accurate ? "Why you caught it" : "Why the noise won",
    body,
    chain,
    criticalPinned,
    decoysPinned,
    chased,
  };
}
