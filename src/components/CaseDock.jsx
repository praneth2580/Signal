import { useState } from "react";
import { HYPOTHESES } from "../game/hypotheses.js";
import { LEAK_OFFERS } from "../game/leaks.js";
import { formatMoney } from "../game/format.js";

export function CaseDock({
  player,
  locked,
  balance,
  hideLeaks = false,
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
    <section className="dock">
      <h2>Case file</h2>

      <form
        className="note-form"
        onSubmit={(event) => {
          event.preventDefault();
          onNote(draft);
          setDraft("");
        }}
      >
        <label>
          Notes
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What looks off?"
            disabled={locked}
          />
        </label>
        <button type="submit" disabled={locked || !draft.trim()}>
          Save note
        </button>
      </form>

      {player.notes.length > 0 ? (
        <ul className="notes">
          {player.notes.map((note) => (
            <li key={note.id}>{note.text}</li>
          ))}
        </ul>
      ) : null}

      <p className="pin-count">{player.selectedEvidence.length} evidence pinned</p>
      <ul className="pins">
        {player.selectedEvidence.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>

      {!hideLeaks ? (
        <div className="contacts">
          <h3>Paid contacts</h3>
          <p className="contacts-blurb">
            Spend desk cash for leaks. Faster solves pay more — shortcuts cost score and future cash.
          </p>
          <ul className="leak-list">
            {LEAK_OFFERS.map((offer) => {
              const owned = bought.has(offer.id);
              const canAfford = balance >= offer.cost;
              return (
                <li key={offer.id}>
                  <div>
                    <strong>{offer.label}</strong>
                    <span>{offer.blurb}</span>
                  </div>
                  <button
                    type="button"
                    disabled={locked || owned || !canAfford}
                    onClick={() => onBuyLeak(offer.id)}
                  >
                    {owned ? "Bought" : formatMoney(offer.cost)}
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

      <fieldset disabled={locked}>
        <legend>Hypothesis</legend>
        {HYPOTHESES.map((item) => (
          <label
            key={item.id}
            className={item.id === hintHypothesis ? "choice is-hint" : "choice"}
          >
            <input
              type="radio"
              name="hypothesis"
              checked={player.hypothesis === item.id}
              onChange={() => onHypothesis(item.id)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <label className="confidence">
        Confidence
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
        className="submit"
        disabled={locked || !player.hypothesis}
        onClick={onSubmit}
      >
        Submit analysis
      </button>
    </section>
  );
}
