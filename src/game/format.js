export function padId(prefix, value, width = 2) {
  return `${prefix}_${String(value).padStart(width, "0")}`;
}

export function formatMoney(amount) {
  const absolute = Math.abs(amount);
  const formatted = absolute.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `−${formatted}` : formatted;
}

export function formatDay(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatStamp(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}

export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function lookupName(records, id) {
  return records.find((record) => record.id === id)?.name ?? id;
}
