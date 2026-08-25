export function relatedRecords(gameCase, kind, id) {
  const links = [];

  const push = (nextKind, record, reason) => {
    if (record) links.push({ kind: nextKind, record, reason });
  };

  const peopleById = indexById(gameCase.people);
  const accountsById = indexById(gameCase.accounts);
  const locationsById = indexById(gameCase.locations);

  if (kind === "people") {
    const person = peopleById.get(id);
    if (!person) return links;
    push("locations", locationsById.get(person.locationId), "home location");
    gameCase.accounts.filter((account) => account.ownerId === id).forEach((account) => {
      push("accounts", account, "owns account");
    });
    gameCase.transactions.filter((item) => item.employeeId === id).slice(0, 8).forEach((item) => {
      push("transactions", item, "posted transaction");
    });
    gameCase.events.filter((item) => item.employeeId === id).slice(0, 6).forEach((item) => {
      push("events", item, "activity");
    });
  }

  if (kind === "transactions") {
    const tx = gameCase.transactions.find((item) => item.id === id);
    if (!tx) return links;
    push("people", peopleById.get(tx.employeeId), "posted by");
    push("accounts", accountsById.get(tx.accountId), "account");
    push("locations", locationsById.get(tx.locationId), "origin");
  }

  if (kind === "events") {
    const event = gameCase.events.find((item) => item.id === id);
    if (!event) return links;
    push("people", peopleById.get(event.employeeId), "actor");
    push("locations", locationsById.get(event.locationId), "origin");
  }

  if (kind === "messages") {
    const message = gameCase.messages.find((item) => item.id === id);
    if (!message) return links;
    push("people", peopleById.get(message.fromId), "from");
    push("people", peopleById.get(message.toId), "to");
  }

  if (kind === "accounts") {
    const account = accountsById.get(id);
    if (!account) return links;
    push("people", peopleById.get(account.ownerId), "owner");
    gameCase.transactions.filter((item) => item.accountId === id).slice(0, 8).forEach((item) => {
      push("transactions", item, "on account");
    });
  }

  if (kind === "locations") {
    const location = locationsById.get(id);
    if (!location) return links;
    gameCase.people.filter((person) => person.locationId === id).slice(0, 6).forEach((person) => {
      push("people", person, "based here");
    });
    gameCase.events.filter((item) => item.locationId === id).slice(0, 6).forEach((item) => {
      push("events", item, "activity");
    });
  }

  return links;
}

function indexById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

export function recordByRef(gameCase, kind, id) {
  const tables = {
    people: gameCase.people,
    transactions: gameCase.transactions,
    events: gameCase.events,
    messages: gameCase.messages,
    locations: gameCase.locations,
    accounts: gameCase.accounts,
  };
  return tables[kind]?.find((record) => record.id === id) ?? null;
}
