import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BriefingModal } from "./BriefingModal.jsx";
import { CaseDock } from "./CaseDock.jsx";
import { DataTable } from "./DataTable.jsx";
import { Masthead } from "./Masthead.jsx";
import { RecordModal } from "./RecordModal.jsx";
import { ScoreReveal } from "./ScoreReveal.jsx";
import { Clipboard } from "./Clipboard.jsx";
import { TutorialCoach } from "./TutorialCoach.jsx";
import { datasetColumns, datasetRows } from "./datasets.js";
import { derivePhase } from "../game/phase.js";

const DATASETS = [
  { id: "people", label: "People" },
  { id: "transactions", label: "Ledger" },
  { id: "events", label: "Activity" },
  { id: "messages", label: "Messages" },
  { id: "accounts", label: "Accounts" },
  { id: "locations", label: "Places" },
];

const SHORTCUTS = [
  { keys: "/", label: "Focus search" },
  { keys: "1–6", label: "Switch dataset" },
  { keys: "Enter", label: "Open selected row" },
  { keys: "p", label: "Pin / unpin (in record)" },
  { keys: "Esc", label: "Close modal / clipboard" },
  { keys: "t", label: "Open clipboard" },
  { keys: "?", label: "Toggle this sheet" },
];

function isTypingTarget(target) {
  if (!target || !(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function Workstation({
  state,
  seedDraft,
  balance,
  rank,
  shift,
  streak,
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
  onEndShift,
}) {
  const tutorial = state.case.tutorial ?? null;
  const [dataset, setDataset] = useState(tutorial ? "events" : "transactions");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [briefingFresh, setBriefingFresh] = useState(true);
  const [helpReveal, setHelpReveal] = useState(null);
  const [pinFlash, setPinFlash] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const [clipboardPage, setClipboardPage] = useState(0);
  const searchRef = useRef(null);
  const clipboardRef = useRef(null);

  useEffect(() => {
    setSelected(null);
    setQuery("");
    setSort({ key: null, dir: "asc" });
    setBriefingOpen(true);
    setBriefingFresh(true);
    setHelpReveal(null);
    setShortcutsOpen(false);
    setClipboardOpen(false);
    setClipboardPage(0);
    setDataset(tutorial ? "events" : "transactions");
  }, [state.seed]);

  useEffect(() => {
    if (state.result) setClipboardOpen(false);
  }, [state.result]);

  useEffect(() => {
    if (!state.player.selectedEvidence.length) return undefined;
    setPinFlash(true);
    const timer = window.setTimeout(() => setPinFlash(false), 420);
    return () => window.clearTimeout(timer);
  }, [state.player.selectedEvidence.length]);

  const phase = derivePhase({
    result: state.result,
    startedAt: state.startedAt,
    briefingOpen,
    pinnedCount: state.player.selectedEvidence.length,
    hypothesis: state.player.hypothesis,
  });

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

  function handleClipboardOpenChange(nextOpen, page = 0) {
    setClipboardOpen(nextOpen);
    if (nextOpen) setClipboardPage(page);
  }

  useEffect(() => {
    if (state.result || briefingOpen) return undefined;

    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (clipboardOpen) {
        // Clipboard owns Esc / arrows while open
        return;
      }

      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }

      if (shortcutsOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setShortcutsOpen(false);
        }
        return;
      }

      if (event.key === "Escape") {
        if (selected) {
          event.preventDefault();
          setSelected(null);
        }
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select?.();
        return;
      }

      if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        if (state.player.selectedEvidence.length > 0) {
          handleClipboardOpenChange(true, 0);
        } else {
          clipboardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        return;
      }

      if (event.key >= "1" && event.key <= "6") {
        const next = DATASETS[Number(event.key) - 1];
        if (!next) return;
        event.preventDefault();
        setDataset(next.id);
        setSelected(null);
        return;
      }

      if (event.key === "Enter" && selected) {
        event.preventDefault();
        openRecord(selected.kind, selected.id);
        return;
      }

      if ((event.key === "p" || event.key === "P") && selected) {
        event.preventDefault();
        onPin(selected.id);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    state.result,
    briefingOpen,
    selected,
    shortcutsOpen,
    clipboardOpen,
    onPin,
    state.player.selectedEvidence.length,
  ]);

  return (
    <div
      className={`shell${tutorial ? " is-training" : ""}${helpReveal ? " is-helping" : ""}${pinFlash ? " is-pin-flash" : ""}`}
      data-phase={phase}
    >
      <Masthead
        seed={state.seed}
        seedDraft={seedDraft}
        briefing={state.case.briefing}
        allottedMs={state.case.allottedMs}
        startedAt={state.startedAt}
        submittedAt={state.submittedAt}
        balance={balance}
        tutorial={tutorial}
        mission={state.case.mission}
        phase={phase}
        rank={rank}
        shift={shift}
        streak={streak}
        onSeedDraft={onSeedDraft}
        onLoadSeed={onLoadSeed}
        onNewCase={onNewCase}
        onOpenBriefing={() => setBriefingOpen(true)}
        onEndShift={onEndShift}
        onToggleShortcuts={() => setShortcutsOpen((open) => !open)}
      />

      <div className="work">
        <nav className="rail" aria-label="Evidence rooms">
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

        <div className="board">
          <div ref={clipboardRef}>
            <Clipboard
              gameCase={state.case}
              pinned={state.player.selectedEvidence}
              locked={Boolean(state.result)}
              open={clipboardOpen}
              initialPage={clipboardPage}
              onOpenChange={handleClipboardOpenChange}
              onOpenRecord={openRecord}
              onUnpin={onPin}
            />
          </div>
          <section className="grid-pane" data-coach="grid">
            <div className="query-bar">
              <label>
                Search {DATASETS.find((item) => item.id === dataset).label.toLowerCase()}
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter this table"
                />
              </label>
              <p>{rows.length} records · press ? for keys</p>
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
        </div>

        <aside className="side" data-coach="dock">
          <CaseDock
            player={state.player}
            locked={Boolean(state.result)}
            balance={balance}
            hideLeaks={Boolean(tutorial)}
            tipCredit={Boolean(state.case.tipCredit)}
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
        <ScoreReveal
          result={state.result}
          tutorial={tutorial}
          shift={shift}
          rank={rank}
          streak={streak}
          onReplay={onContinue}
          onEndShift={onEndShift}
        />
      ) : briefingOpen ? (
        <BriefingModal
          briefing={state.case.briefing}
          seed={state.seed}
          allottedMs={state.case.allottedMs}
          balance={balance}
          firstOpen={briefingFresh}
          tutorial={tutorial}
          mission={state.case.mission}
          onClose={closeBriefing}
        />
      ) : selected && !clipboardOpen ? (
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

      {shortcutsOpen && !state.result ? (
        <div className="shortcut-sheet" role="dialog" aria-label="Keyboard shortcuts">
          <div className="shortcut-panel">
            <div className="shortcut-head">
              <p className="eyebrow">desk keys</p>
              <button type="button" onClick={() => setShortcutsOpen(false)}>
                Close
              </button>
            </div>
            <ul>
              {SHORTCUTS.map((item) => (
                <li key={item.keys}>
                  <kbd>{item.keys}</kbd>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function sortValue(row, key) {
  if (key === "amount") return row.amountValue ?? row.amount;
  return row[key];
}
