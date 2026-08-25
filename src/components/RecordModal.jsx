import { useEffect } from "react";
import { formatMoney, formatStamp, lookupName } from "../game/format.js";
import { relatedRecords, recordByRef } from "../game/relations.js";

const LABELS = {
  people: "Employee",
  transactions: "Transaction",
  events: "Activity",
  messages: "Message",
  accounts: "Account",
  locations: "Place",
};

export function RecordModal({ gameCase, selected, pinned, onOpen, onPin, onClose }) {
  const record = selected ? recordByRef(gameCase, selected.kind, selected.id) : null;
  const related = record ? relatedRecords(gameCase, selected.kind, selected.id) : [];
  const isPinned = record ? pinned.includes(record.id) : false;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!selected || !record) return null;

  return (
    <div className="reveal" role="dialog" aria-modal="true" aria-labelledby="record-title">
      <div className="reveal-panel record-panel">
        <div className="record-head">
          <div>
            <p className="eyebrow">{LABELS[selected.kind]}</p>
            <h2 id="record-title">{record.id}</h2>
          </div>
          <div className="record-actions">
            <button
              type="button"
              className={isPinned ? "is-on" : ""}
              onClick={() => onPin(record.id)}
            >
              {isPinned ? "Pinned" : "Pin evidence"}
            </button>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <dl className="record-fields">{fields(gameCase, selected.kind, record)}</dl>

        {related.length > 0 ? (
          <>
            <h3>Related</h3>
            <ul className="related">
              {related.map((item) => (
                <li key={`${item.kind}-${item.record.id}-${item.reason}`}>
                  <button type="button" onClick={() => onOpen(item.kind, item.record.id)}>
                    <span>{item.reason}</span>
                    <strong>{item.record.name || item.record.id}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}

function fields(gameCase, kind, record) {
  if (kind === "people") {
    return (
      <>
        <Pair label="Name" value={record.name} />
        <Pair label="Role" value={`${record.role} · ${record.department}`} />
        <Pair label="Hired" value={record.hired} />
        <Pair label="Location" value={lookupName(gameCase.locations, record.locationId)} />
      </>
    );
  }

  if (kind === "transactions") {
    return (
      <>
        <Pair label="Amount" value={formatMoney(record.amount)} />
        <Pair label="When" value={formatStamp(record.timestamp)} />
        <Pair label="Type" value={`${record.type} · ${record.status}`} />
        <Pair label="Employee" value={lookupName(gameCase.people, record.employeeId)} />
        <Pair label="Account" value={gameCase.accounts.find((item) => item.id === record.accountId)?.customer} />
        <Pair label="Place" value={lookupName(gameCase.locations, record.locationId)} />
      </>
    );
  }

  if (kind === "events") {
    return (
      <>
        <Pair label="Type" value={record.type} />
        <Pair label="When" value={formatStamp(record.timestamp)} />
        <Pair label="Employee" value={lookupName(gameCase.people, record.employeeId)} />
        <Pair label="Place" value={lookupName(gameCase.locations, record.locationId)} />
        <Pair label="Origin" value={record.ip} />
      </>
    );
  }

  if (kind === "messages") {
    return (
      <>
        <Pair label="Subject" value={record.subject} />
        <Pair label="When" value={formatStamp(record.timestamp)} />
        <Pair label="From" value={lookupName(gameCase.people, record.fromId)} />
        <Pair label="To" value={lookupName(gameCase.people, record.toId)} />
        <Pair label="Excerpt" value={record.excerpt} />
      </>
    );
  }

  if (kind === "accounts") {
    return (
      <>
        <Pair label="Customer" value={record.customer} />
        <Pair label="Owner" value={lookupName(gameCase.people, record.ownerId)} />
        <Pair label="Opened" value={record.opened} />
      </>
    );
  }

  return (
    <>
      <Pair label="Name" value={record.name} />
      <Pair label="City" value={record.city} />
      <Pair label="Type" value={record.type} />
    </>
  );
}

function Pair({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
