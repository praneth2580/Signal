import { useEffect, useState } from "react";
import { getCoachHelp, getCoachTip } from "../game/tutorial.js";

export function TutorialCoach({
  tutorial,
  gameCase,
  dataset,
  selected,
  pinned,
  hypothesis,
  truth,
  briefingOpen,
  result,
  onRevealHelp,
}) {
  const tip = getCoachTip(tutorial, {
    dataset,
    selected,
    pinned,
    hypothesis,
    truth,
    briefingOpen,
    result,
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [help, setHelp] = useState(null);

  useEffect(() => {
    setHelpOpen(false);
    setHelp(null);
    onRevealHelp?.(null);
  }, [tip?.id, tutorial?.round, onRevealHelp]);

  if (!tip) return null;

  function toggleHelp() {
    if (helpOpen) {
      setHelpOpen(false);
      setHelp(null);
      onRevealHelp?.(null);
      return;
    }

    const next = getCoachHelp(tip.id, gameCase);
    if (!next) return;
    setHelp(next);
    setHelpOpen(true);
    onRevealHelp?.(next);
  }

  return (
    <aside className="coach" data-highlight={help?.ui || tip.highlight} aria-live="polite">
      <div className="coach-head">
        <p className="eyebrow">{tutorial.label}</p>
        <button type="button" className="coach-help" onClick={toggleHelp}>
          {helpOpen ? "Hide help" : "Help"}
        </button>
      </div>
      <h3>{tip.title}</h3>
      <p>{tip.body}</p>
      {helpOpen && help ? (
        <div className="coach-answer">
          <p className="eyebrow">Why this answer</p>
          <p>{help.explain}</p>
          {help.highlightIds?.length ? (
            <p className="coach-targets">
              Highlighted: {help.highlightIds.join(" · ")}
              {help.hypothesisId ? " · hypothesis" : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
