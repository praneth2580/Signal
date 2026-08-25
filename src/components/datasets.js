import { formatMoney, formatStamp, lookupName } from "../game/format.js";

export function datasetColumns(dataset) {
  const columns = {
    people: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "department", label: "Dept" },
      { key: "location", label: "Location" },
    ],
    transactions: [
      { key: "id", label: "ID" },
      { key: "time", label: "When" },
      { key: "amount", label: "Amount", numeric: true },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "employee", label: "Employee" },
      { key: "account", label: "Account" },
    ],
    events: [
      { key: "id", label: "ID" },
      { key: "time", label: "When" },
      { key: "type", label: "Type" },
      { key: "employee", label: "Employee" },
      { key: "location", label: "Location" },
      { key: "ip", label: "Origin" },
    ],
    messages: [
      { key: "id", label: "ID" },
      { key: "time", label: "When" },
      { key: "from", label: "From" },
      { key: "to", label: "To" },
      { key: "subject", label: "Subject" },
    ],
    accounts: [
      { key: "id", label: "ID" },
      { key: "customer", label: "Customer" },
      { key: "owner", label: "Owner" },
      { key: "opened", label: "Opened" },
    ],
    locations: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "city", label: "City" },
      { key: "type", label: "Type" },
    ],
  };

  return columns[dataset];
}

export function datasetRows(gameCase, dataset) {
  if (dataset === "people") {
    return gameCase.people.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      department: person.department,
      location: lookupName(gameCase.locations, person.locationId),
    }));
  }

  if (dataset === "transactions") {
    return gameCase.transactions.map((item) => ({
      id: item.id,
      time: formatStamp(item.timestamp),
      amount: formatMoney(item.amount),
      amountValue: item.amount,
      type: item.type,
      status: item.status,
      employee: lookupName(gameCase.people, item.employeeId),
      account: gameCase.accounts.find((account) => account.id === item.accountId)?.customer,
    }));
  }

  if (dataset === "events") {
    return gameCase.events.map((item) => ({
      id: item.id,
      time: formatStamp(item.timestamp),
      type: item.type,
      employee: lookupName(gameCase.people, item.employeeId),
      location: lookupName(gameCase.locations, item.locationId),
      ip: item.ip,
    }));
  }

  if (dataset === "messages") {
    return gameCase.messages.map((item) => ({
      id: item.id,
      time: formatStamp(item.timestamp),
      from: lookupName(gameCase.people, item.fromId),
      to: lookupName(gameCase.people, item.toId),
      subject: item.subject,
    }));
  }

  if (dataset === "accounts") {
    return gameCase.accounts.map((item) => ({
      id: item.id,
      customer: item.customer,
      owner: lookupName(gameCase.people, item.ownerId),
      opened: item.opened,
    }));
  }

  return gameCase.locations.map((item) => ({
    id: item.id,
    name: item.name,
    city: item.city,
    type: item.type,
  }));
}
