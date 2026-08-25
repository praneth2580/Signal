import { useMemo, useState } from "react";
import {
  PLACEMENT_QUIZ,
  SKILLS,
  skillLabel,
} from "../game/tutorial.js";

const RATINGS = [
  { id: "know", label: "Know it" },
  { id: "sort_of", label: "Sort of" },
  { id: "no", label: "No idea" },
];

export function PlacementGate({ onCancel, onComplete }) {
  const [step, setStep] = useState("rate");
  const [ratings, setRatings] = useState(() =>
    Object.fromEntries(SKILLS.map((skill) => [skill.id, ""])),
  );
  const [quizAnswers, setQuizAnswers] = useState({});

  const quizItems = useMemo(
    () => PLACEMENT_QUIZ.filter((item) => ratings[item.skill] === "know"),
    [ratings],
  );

  const allRated = SKILLS.every((skill) => ratings[skill.id]);
  const quizComplete = quizItems.every((item) => quizAnswers[item.skill] != null);

  const plan = useMemo(() => {
    const weak = [];
    for (const skill of SKILLS) {
      const rating = ratings[skill.id] || "no";
      if (rating === "no" || rating === "sort_of") {
        weak.push(skill.id);
        continue;
      }
      const question = PLACEMENT_QUIZ.find((item) => item.skill === skill.id);
      if (question && quizAnswers[skill.id] !== question.correct) {
        weak.push(skill.id);
      }
    }
    return weak;
  }, [ratings, quizAnswers]);

  function setRating(skillId, value) {
    setRatings((current) => ({ ...current, [skillId]: value }));
    if (value !== "know") {
      setQuizAnswers((current) => {
        const next = { ...current };
        delete next[skillId];
        return next;
      });
    }
  }

  return (
    <div className="gate placement-gate">
      <div className="placement-panel">
        <p className="eyebrow">adaptive training</p>
        <h1>What do you already know?</h1>
        <p className="placement-lead">
          We only teach the gaps. Rate each skill — if you say you know it, we ask one check question.
        </p>

        {step === "rate" ? (
          <>
            <ul className="placement-skills">
              {SKILLS.map((skill) => (
                <li key={skill.id}>
                  <div>
                    <strong>{skill.label}</strong>
                    <span>{skill.blurb}</span>
                  </div>
                  <div className="placement-ratings" role="group" aria-label={skill.label}>
                    {RATINGS.map((rating) => (
                      <button
                        key={rating.id}
                        type="button"
                        className={ratings[skill.id] === rating.id ? "is-on" : ""}
                        onClick={() => setRating(skill.id, rating.id)}
                      >
                        {rating.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="placement-actions">
              <button type="button" className="gate-secondary" onClick={onCancel}>
                Back
              </button>
              <button
                type="button"
                disabled={!allRated}
                onClick={() => setStep(quizItems.length ? "quiz" : "plan")}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {step === "quiz" ? (
          <>
            <p className="placement-lead">Quick check on what you marked “Know it”.</p>
            <ul className="placement-quiz">
              {quizItems.map((item) => (
                <li key={item.skill}>
                  <p>
                    <span className="eyebrow">{skillLabel(item.skill)}</span>
                    {item.prompt}
                  </p>
                  <div className="placement-choices">
                    {item.choices.map((choice, index) => (
                      <button
                        key={choice}
                        type="button"
                        className={quizAnswers[item.skill] === index ? "is-on" : ""}
                        onClick={() =>
                          setQuizAnswers((current) => ({ ...current, [item.skill]: index }))
                        }
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="placement-actions">
              <button type="button" className="gate-secondary" onClick={() => setStep("rate")}>
                Back
              </button>
              <button type="button" disabled={!quizComplete} onClick={() => setStep("plan")}>
                See my plan
              </button>
            </div>
          </>
        ) : null}

        {step === "plan" ? (
          <>
            {plan.length === 0 ? (
              <p className="placement-plan">
                You look ready for live cases. No training modules queued — open a case from the desk
                whenever you want.
              </p>
            ) : (
              <>
                <p className="placement-plan">We will only train:</p>
                <ol className="placement-queue">
                  {plan.map((id) => (
                    <li key={id}>{skillLabel(id)}</li>
                  ))}
                </ol>
              </>
            )}
            <div className="placement-actions">
              <button
                type="button"
                className="gate-secondary"
                onClick={() => setStep(quizItems.length ? "quiz" : "rate")}
              >
                Back
              </button>
              <button type="button" onClick={() => onComplete(ratings, quizAnswers)}>
                {plan.length ? "Begin training" : "Back to desk"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
