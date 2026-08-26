import { useState } from "react";
import { HYPOTHESES } from "../game/hypotheses.js";
import { LEAK_OFFERS } from "../game/leaks.js";
import { formatMoney } from "../game/format.js";

export function CaseDock({
  player,
  locked,
  balance,
  hideLeaks = false,
  tipCredit = false,
  hintHypothesis = null,
  onNote,
  onHypothesis,
  onConfidence,
  onSubmit,
  onBuyLeak,
}) {
  const [draft, setDraft] = useState("");
  const bought = new Set((player.leaks ?? []).map((leak) => leak.id));

  return (
    <section className="dock blotter-dock">
      <div className="blotter-head">
        <h2>Blotter</h2>
        <p className="clipboard-dock-hint">
          {player.selectedEvidence.length === 0
            ? "Clipboard empty — pin rows from the tables."
            : `${player.selectedEvidence.length} clipped on the board`}
        </p>
      </div>

      <form
        className="note-form blotter-notes"
        onSubmit={(event) => {
          event.preventDefault();
          onNote(draft);
          setDraft("");
        }}
      >
        <label>
          Scratch notes
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="ink what looks off…"
            disabled={locked}
          />
        </label>
        <button type="submit" disabled={locked || !draft.trim()}>
          Ink it
        </button>
      </form>

      {player.notes.length > 0 ? (
        <ul className="notes blotter-note-list">
          {player.notes.map((note) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      ) : null}

      {!hideLeaks ? (
        <div className="contacts envelope-rack">
          <h3>Sealed contacts</h3>
          <p className="contacts-blurb">
            Buy an envelope. Tips cost score later.
            {tipCredit ? " Streak perk: one anonymous tip is free." : ""}
          </p>
          <ul className="leak-list envelope-list">
            {LEAK_OFFERS.map((offer) => {
              const owned = bought.has(offer.id);
              const freeOffer = tipCredit && offer.id === "anonymous_tip";
              const canAfford = freeOffer || balance >= offer.cost;
              return (
                <li key={offer.id} className={owned ? "is-open" : ""}>
                  <div className="envelope-face">
                    <strong>{offer.label}</strong>
                    <span>{offer.blurb}</span>
                  </div>
                  <button
                    type="button"
                    disabled={locked || owned || !canAfford}
                    onClick={() => onBuyLeak(offer.id)}
                  >
                    {owned ? "Opened" : freeOffer ? "Free" : formatMoney(offer.cost)}
                  </button>
                </li>
              );
            })}
          </ul>
          {(player.leaks ?? []).length > 0 ? (
            <ul className="leak-tips">
              {player.leaks.map((leak) => (
                <li key={leak.id}>{leak.tip}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="stamp-pad" aria-label="Hypothesis stamps">
        <p className="stamp-pad-label">Stamp a call</p>
        <div className="stamp-grid" role="radiogroup" aria-label="Hypothesis">
          {HYPOTHESES.map((item) => {
            const active = player.hypothesis === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={locked}
                className={`stamp${active ? " is-inked" : ""}${item.id === hintHypothesis ? " is-hint" : ""}`}
                onClick={() => onHypothesis(item.id)}
              >
                <span className="stamp-mark">{active ? "INKED" : "STAMP"}</span>
                <span className="stamp-text">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="confidence pressure-dial">
        Pressure
        <input
          type="range"
          min="1"
          max="5"
          value={player.confidence}
          disabled={locked}
          onChange={(event) => onConfidence(Number(event.target.value))}
        />
        <span>{player.confidence}/5</span>
      </label>

      <button
        type="button"
        className="submit file-stamp"
        disabled={locked || !player.hypothesis}
        onClick={onSubmit}
      >
        File analysis
      </button>
    </section>
  );
}
