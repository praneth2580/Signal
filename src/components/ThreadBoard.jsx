import { useMemo } from "react";

function resolveLabel(gameCase, id) {
  for (const kind of ["people", "transactions", "events", "messages", "accounts", "locations"]) {
    const record = gameCase[kind]?.find((item) => item.id === id);
    if (!record) continue;
    const title = record.name || record.customer || record.subject || record.type || id;
    return { kind, title, record };
  }
  return { kind: null, title: id, record: null };
}

export function ThreadBoard({
  gameCase,
  pinned,
  locked,
  onOpen,
  onUnpin,
}) {
  const nodes = useMemo(
    () => pinned.map((id) => ({ id, ...resolveLabel(gameCase, id) })),
    [gameCase, pinned],
  );

  return (
    <section className="thread-board" aria-label="Evidence thread">
      <div className="thread-head">
        <h2>Thread</h2>
        <p>Build the story. Pin records, then walk the chain.</p>
      </div>
      {nodes.length === 0 ? (
        <p className="thread-empty">No pins yet — sweep the tables, then pin what might connect.</p>
      ) : (
        <ol className="thread-chain">
          {nodes.map((node, index) => (
            <li key={node.id}>
              {index > 0 ? <span className="thread-arrow" aria-hidden="true">→</span> : null}
              <div className="thread-node">
                <button
                  type="button"
                  className="thread-open"
                  onClick={() => node.kind && onOpen(node.kind, node.id)}
                >
                  <span className="thread-kind">{node.kind ?? "record"}</span>
                  <strong>{node.id}</strong>
                  <em>{node.title}</em>
                </button>
                {!locked ? (
                  <button
                    type="button"
                    className="thread-unpin"
                    onClick={() => onUnpin(node.id)}
                    aria-label={`Unpin ${node.id}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
