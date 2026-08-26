import { formatMoney, formatStamp, lookupName } from "./format.js";

const KINDS = ["people", "transactions", "events", "messages", "accounts", "locations"];

const ATTACHMENTS = {
  people: "Personnel card",
  transactions: "Ledger tear",
  events: "Activity slip",
  messages: "Message print",
  accounts: "Account card",
  locations: "Site note",
};

export function resolvePinnedRecord(gameCase, id) {
  for (const kind of KINDS) {
    const record = gameCase[kind]?.find((item) => item.id === id);
    if (!record) continue;
    return { kind, record };
  }
  return { kind: null, record: null };
}

function scribbleFor(kind, record, gameCase) {
  if (!record) return "Unknown scrap — check the id again.";

  if (kind === "events") {
    const who = lookupName(gameCase.people, record.employeeId);
    const where = lookupName(gameCase.locations, record.locationId);
    const when = formatStamp(record.timestamp);
    if (record.type === "failed_login") {
      return `${who} — failed login @ ${when} from ${where}`;
    }
    return `${who} logged in @ ${when} · ${where}`;
  }

  if (kind === "transactions") {
    const who = lookupName(gameCase.people, record.employeeId);
    const account = gameCase.accounts.find((item) => item.id === record.accountId);
    return `${formatMoney(record.amount)} ${record.type} · ${record.status} — ${who} / ${account?.customer ?? "account"}`;
  }

  if (kind === "messages") {
    const from = lookupName(gameCase.people, record.fromId);
    return `${from}: “${record.subject}”`;
  }

  if (kind === "people") {
    return `${record.name} · ${record.role} (${record.department})`;
  }

  if (kind === "accounts") {
    const owner = lookupName(gameCase.people, record.ownerId);
    return `${record.customer} — owner ${owner}`;
  }

  if (kind === "locations") {
    return `${record.name} · ${record.city} (${record.type})`;
  }

  return record.id;
}

function excerptFor(kind, record, gameCase) {
  if (!record) return "Record missing from this case window.";

  if (kind === "events") {
    return [
      `Type: ${record.type}`,
      `When: ${formatStamp(record.timestamp)}`,
      `IP: ${record.ip}`,
      `Place: ${lookupName(gameCase.locations, record.locationId)}`,
    ].join("\n");
  }

  if (kind === "transactions") {
    return [
      `Amount: ${formatMoney(record.amount)}`,
      `Type / status: ${record.type} · ${record.status}`,
      `When: ${formatStamp(record.timestamp)}`,
      `Employee: ${lookupName(gameCase.people, record.employeeId)}`,
      `Account: ${gameCase.accounts.find((item) => item.id === record.accountId)?.customer ?? record.accountId}`,
    ].join("\n");
  }

  if (kind === "messages") {
    return [
      `From: ${lookupName(gameCase.people, record.fromId)}`,
      `To: ${lookupName(gameCase.people, record.toId)}`,
      `When: ${formatStamp(record.timestamp)}`,
      `“${record.excerpt}”`,
    ].join("\n");
  }

  if (kind === "people") {
    return [
      `Role: ${record.role}`,
      `Dept: ${record.department}`,
      `Home desk: ${lookupName(gameCase.locations, record.locationId)}`,
      `Hired: ${record.hired}`,
    ].join("\n");
  }

  if (kind === "accounts") {
    return [
      `Customer: ${record.customer}`,
      `Owner: ${lookupName(gameCase.people, record.ownerId)}`,
      `Opened: ${record.opened}`,
    ].join("\n");
  }

  if (kind === "locations") {
    return [`City: ${record.city}`, `Type: ${record.type}`].join("\n");
  }

  return String(record.id);
}

/**
 * Build paginated clipboard pages from pinned evidence ids (pin order).
 */
export function buildClipboardPages(gameCase, pinned = []) {
  return pinned.map((id, index) => {
    const { kind, record } = resolvePinnedRecord(gameCase, id);
    return {
      id,
      index,
      kind,
      scribble: scribbleFor(kind, record, gameCase),
      excerpt: excerptFor(kind, record, gameCase),
      attachment: ATTACHMENTS[kind] ?? "Clipped scrap",
      title: record?.name || record?.customer || record?.subject || record?.type || id,
    };
  });
}
