import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefingModal } from "./BriefingModal.jsx";
import { CaseDock } from "./CaseDock.jsx";
import { DataTable } from "./DataTable.jsx";
import { Masthead } from "./Masthead.jsx";
import { RecordModal } from "./RecordModal.jsx";
import { ScoreReveal } from "./ScoreReveal.jsx";
import { TutorialCoach } from "./TutorialCoach.jsx";
import { datasetColumns, datasetRows } from "./datasets.js";

const DATASETS = [
  { id: "people", label: "People" },
  { id: "transactions", label: "Ledger" },
  { id: "events", label: "Activity" },
  { id: "messages", label: "Messages" },
  { id: "accounts", label: "Accounts" },
  { id: "locations", label: "Places" },
];

export function Workstation({
  state,
  seedDraft,
  balance,
  onSeedDraft,
  onLoadSeed,
  onNewCase,
  onBegin,
  onPin,
  onNote,
  onHypothesis,
  onConfidence,
  onBuyLeak,
  onSubmit,
  onContinue,
}) {
  const tutorial = state.case.tutorial ?? null;
  const [dataset, setDataset] = useState(tutorial ? "events" : "transactions");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [briefingFresh, setBriefingFresh] = useState(true);
  const [helpReveal, setHelpReveal] = useState(null);

  useEffect(() => {
    setSelected(null);
    setQuery("");
    setSort({ key: null, dir: "asc" });
    setBriefingOpen(true);
    setBriefingFresh(true);
    setHelpReveal(null);
    setDataset(tutorial ? "events" : "transactions");
  }, [state.seed]);

  const handleRevealHelp = useCallback((help) => {
    setHelpReveal(help);
    if (!help) return;

    if (help.dataset) {
      setDataset(help.dataset);
      setQuery("");
    }

    if (help.focus) {
      setSelected(help.focus);
      setDataset(help.focus.kind);
    } else if (help.dataset) {
      setSelected(null);
    }
  }, []);

  const rows = useMemo(() => {
    const all = datasetRows(state.case, dataset);
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? all.filter((row) =>
          Object.values(row).join(" ").toLowerCase().includes(needle),
        )
      : all;

    if (!sort.key) return filtered;
    const copy = filtered.slice();
    copy.sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (typeof left === "number" && typeof right === "number") {
        return sort.dir === "asc" ? left - right : right - left;
      }
      return sort.dir === "asc"
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return copy;
  }, [state.case, dataset, query, sort]);

  const columns = datasetColumns(dataset);
  const hintIds = helpReveal?.highlightIds ?? [];

  function openRecord(kind, id) {
    setDataset(kind);
    setSelected({ kind, id });
  }

  function closeBriefing() {
    setBriefingOpen(false);
    setBriefingFresh(false);
    onBegin();
  }

  return (
    <div className={`shell${tutorial ? " is-training" : ""}${helpReveal ? " is-helping" : ""}`}>
      <Masthead
        seed={state.seed}
        seedDraft={seedDraft}
        briefing={state.case.briefing}
        allottedMs={state.case.allottedMs}
        startedAt={state.startedAt}
        submittedAt={state.submittedAt}
        balance={balance}
        tutorial={tutorial}
        onSeedDraft={onSeedDraft}
        onLoadSeed={onLoadSeed}
        onNewCase={onNewCase}
        onOpenBriefing={() => setBriefingOpen(true)}
      />

      <div className="work">
        <nav className="rail" aria-label="Datasets">
          {DATASETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === dataset ? "is-on" : ""}
              data-coach={
                item.id === "events"
                  ? "rail-events"
                  : item.id === "transactions"
                    ? "rail-transactions"
                    : undefined
              }
              onClick={() => {
                setDataset(item.id);
                setSelected(null);
              }}
            >
              {item.label}
              <span>{state.case[item.id].length}</span>
            </button>
          ))}
        </nav>

        <section className="grid-pane" data-coach="grid">
          <div className="query-bar">
            <label>
              Search {DATASETS.find((item) => item.id === dataset).label.toLowerCase()}
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter this table"
              />
            </label>
            <p>{rows.length} records</p>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            selectedId={selected?.kind === dataset ? selected.id : null}
            hintIds={hintIds}
            sort={sort}
            onSort={(key) =>
              setSort((current) => ({
                key,
                dir: current.key === key && current.dir === "asc" ? "desc" : "asc",
              }))
            }
            onSelect={(id) => setSelected({ kind: dataset, id })}
          />
        </section>

        <aside className="side" data-coach="dock">
          <CaseDock
            player={state.player}
            locked={Boolean(state.result)}
            balance={balance}
            hideLeaks={Boolean(tutorial && tutorial.round < 2)}
            hintHypothesis={helpReveal?.hypothesisId ?? null}
            onNote={onNote}
            onHypothesis={onHypothesis}
            onConfidence={onConfidence}
            onBuyLeak={onBuyLeak}
            onSubmit={onSubmit}
          />
        </aside>
      </div>

      {tutorial && !state.result ? (
        <TutorialCoach
          tutorial={tutorial}
          gameCase={state.case}
          dataset={dataset}
          selected={selected}
          pinned={state.player.selectedEvidence}
          hypothesis={state.player.hypothesis}
          truth={state.case.truth}
          briefingOpen={briefingOpen}
          result={state.result}
          onRevealHelp={handleRevealHelp}
        />
      ) : null}

      {state.result ? (
        <ScoreReveal result={state.result} tutorial={tutorial} onReplay={onContinue} />
      ) : briefingOpen ? (
        <BriefingModal
          briefing={state.case.briefing}
          seed={state.seed}
          allottedMs={state.case.allottedMs}
          balance={balance}
          firstOpen={briefingFresh}
          tutorial={tutorial}
          onClose={closeBriefing}
        />
      ) : selected ? (
        <div data-coach="record">
          <RecordModal
            gameCase={state.case}
            selected={selected}
            pinned={state.player.selectedEvidence}
            onOpen={openRecord}
            onPin={onPin}
            onClose={() => setSelected(null)}
          />
        </div>
      ) : null}
    </div>
  );
}

function sortValue(row, key) {
  if (key === "amount") return row.amountValue ?? row.amount;
  return row[key];
}
