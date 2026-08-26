import { useEffect, useReducer, useRef, useState } from "react";
import { PlacementGate } from "./components/PlacementGate.jsx";
import { ShiftSummary } from "./components/ShiftSummary.jsx";
import { StartGate } from "./components/StartGate.jsx";
import { Workstation } from "./components/Workstation.jsx";
import {
  clearShift,
  completeShift,
  getCareer,
  getShift,
  rankForSolves,
  recordLiveResult,
  startShift,
} from "./game/career.js";
import { LEAK_OFFERS } from "./game/leaks.js";
import { reduce } from "./game/state.js";
import {
  applyPlacement,
  getCurrentModuleId,
  getTutorialProgress,
  markTutorialModuleComplete,
  resetTutorialProgress,
} from "./game/tutorial.js";
import { creditWallet, getWallet, spendWallet } from "./game/wallet.js";

export function App() {
  const [state, dispatch] = useReducer(reduce, null);
  const [seedDraft, setSeedDraft] = useState("");
  const [wallet, setWallet] = useState(getWallet);
  const [career, setCareer] = useState(getCareer);
  const [shift, setShift] = useState(getShift);
  const [tutorialProgress, setTutorialProgress] = useState(getTutorialProgress);
  const [placing, setPlacing] = useState(false);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const paidReceipt = useRef(null);

  const rank = rankForSolves(career.solves);
  const inCase = Boolean(state) && !showShiftSummary && !placing;

  useEffect(() => {
    if (state?.seed) setSeedDraft(state.seed);
  }, [state?.seed]);

  useEffect(() => {
    if (!state?.result || state.case.tutorial) return;
    const receipt = `${state.seed}:${state.submittedAt}`;
    if (paidReceipt.current === receipt) return;
    paidReceipt.current = receipt;

    if (state.result.payout > 0) {
      creditWallet(state.result.payout, receipt);
      setWallet(getWallet());
    }

    const recorded = recordLiveResult(state.result);
    setCareer(recorded.career);
    setShift(recorded.shift);
  }, [state?.result, state?.seed, state?.submittedAt, state?.case?.tutorial]);

  useEffect(() => {
    if (!state?.result || !state.case.tutorial) return;
    const receipt = `tutor:${state.seed}:${state.submittedAt}`;
    if (paidReceipt.current === receipt) return;
    paidReceipt.current = receipt;
    setTutorialProgress(
      markTutorialModuleComplete(state.case.tutorial.moduleId, {
        passed: Boolean(state.result.accurate),
      }),
    );
  }, [state?.result, state?.seed, state?.submittedAt, state?.case?.tutorial]);

  function refreshWallet() {
    setWallet(getWallet());
  }

  function leaveCase() {
    dispatch({ type: "LEAVE" });
  }

  function beginShift(seed) {
    const next = startShift();
    setShift(next);
    setShowShiftSummary(false);
    dispatch({ type: "NEW_CASE", seed });
  }

  function finishShift() {
    const done = completeShift() || shift;
    setShift(done);
    setShowShiftSummary(true);
    leaveCase();
  }

  function startTutorial() {
    const progress = getTutorialProgress();
    if (!progress.placed || progress.finished) {
      if (progress.finished) {
        setTutorialProgress(resetTutorialProgress());
      }
      setPlacing(true);
      return;
    }

    const moduleId = getCurrentModuleId(progress);
    if (!moduleId) {
      setPlacing(true);
      return;
    }
    clearShift();
    setShift(null);
    setShowShiftSummary(false);
    dispatch({ type: "NEW_CASE", tutorial: moduleId });
  }

  function finishPlacement(ratings, quizAnswers) {
    const progress = applyPlacement(ratings, quizAnswers);
    setTutorialProgress(progress);
    setPlacing(false);
    const moduleId = getCurrentModuleId(progress);
    if (moduleId) {
      clearShift();
      setShift(null);
      dispatch({ type: "NEW_CASE", tutorial: moduleId });
    }
  }

  function continueAfterScore() {
    if (state?.case?.tutorial) {
      if (!state.result?.accurate) {
        dispatch({ type: "NEW_CASE", tutorial: state.case.tutorial.moduleId });
        return;
      }

      const progress = markTutorialModuleComplete(state.case.tutorial.moduleId, {
        passed: true,
      });
      setTutorialProgress(progress);
      const moduleId = getCurrentModuleId(progress);
      if (moduleId) {
        dispatch({ type: "NEW_CASE", tutorial: moduleId });
        return;
      }

      beginShift();
      return;
    }

    const latest = getShift();
    if (latest?.complete) {
      setShift(latest);
      setShowShiftSummary(true);
      leaveCase();
      return;
    }

    dispatch({ type: "NEW_CASE" });
  }

  if (placing) {
    return (
      <PlacementGate
        onCancel={() => setPlacing(false)}
        onComplete={finishPlacement}
      />
    );
  }

  if (showShiftSummary) {
    return (
      <ShiftSummary
        shift={shift || { casesDone: 0, solved: 0, earned: 0 }}
        career={career}
        rank={rank}
        onAgain={() => beginShift()}
        onDesk={() => {
          clearShift();
          setShift(null);
          setShowShiftSummary(false);
          leaveCase();
        }}
      />
    );
  }

  if (!inCase) {
    return (
      <StartGate
        seedDraft={seedDraft}
        balance={wallet.balance}
        tutorialProgress={tutorialProgress}
        career={career}
        rank={rank}
        shift={shift}
        onSeedDraft={setSeedDraft}
        onStart={() => {
          clearShift();
          setShift(null);
          dispatch({ type: "NEW_CASE", seed: seedDraft.trim() || undefined });
        }}
        onShift={() => beginShift(seedDraft.trim() || undefined)}
        onTutorial={startTutorial}
        onResumeShift={() => {
          setShowShiftSummary(false);
          dispatch({ type: "NEW_CASE" });
        }}
      />
    );
  }

  return (
    <Workstation
      state={state}
      seedDraft={seedDraft}
      balance={wallet.balance}
      rank={rank}
      shift={shift}
      streak={career.streak}
      onSeedDraft={setSeedDraft}
      onLoadSeed={() => dispatch({ type: "NEW_CASE", seed: seedDraft.trim() || undefined })}
      onNewCase={() => {
        clearShift();
        setShift(null);
        dispatch({ type: "NEW_CASE" });
      }}
      onBegin={() => dispatch({ type: "BEGIN" })}
      onPin={(id) => dispatch({ type: "PIN_EVIDENCE", id })}
      onNote={(text) => dispatch({ type: "ADD_NOTE", text })}
      onHypothesis={(hypothesis) => dispatch({ type: "SET_HYPOTHESIS", hypothesis })}
      onConfidence={(confidence) => dispatch({ type: "SET_CONFIDENCE", confidence })}
      onBuyLeak={(leakId) => {
        const offer = LEAK_OFFERS.find((item) => item.id === leakId);
        if (!offer) return;
        if (state.player.leaks.some((leak) => leak.id === offer.id)) return;
        const spent = spendWallet(offer.cost);
        if (!spent) return;
        refreshWallet();
        dispatch({ type: "BUY_LEAK", leakId, paid: true });
      }}
      onSubmit={() => dispatch({ type: "SUBMIT" })}
      onContinue={continueAfterScore}
      onEndShift={finishShift}
    />
  );
}
