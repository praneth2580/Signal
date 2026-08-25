import { useEffect, useReducer, useRef, useState } from "react";
import { PlacementGate } from "./components/PlacementGate.jsx";
import { StartGate } from "./components/StartGate.jsx";
import { Workstation } from "./components/Workstation.jsx";
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
  const [tutorialProgress, setTutorialProgress] = useState(getTutorialProgress);
  const [placing, setPlacing] = useState(false);
  const paidReceipt = useRef(null);

  useEffect(() => {
    if (state?.seed) setSeedDraft(state.seed);
  }, [state?.seed]);

  useEffect(() => {
    if (!state?.result) return;
    const receipt = `${state.seed}:${state.submittedAt}`;
    if (paidReceipt.current === receipt) return;
    paidReceipt.current = receipt;

    if (state.case.tutorial) {
      setTutorialProgress(
        markTutorialModuleComplete(state.case.tutorial.moduleId, {
          passed: Boolean(state.result.accurate),
        }),
      );
    } else if (state.result.payout > 0) {
      creditWallet(state.result.payout, receipt);
      setWallet(getWallet());
    }
  }, [state?.result, state?.seed, state?.submittedAt, state?.case?.tutorial]);

  function refreshWallet() {
    setWallet(getWallet());
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
    dispatch({ type: "NEW_CASE", tutorial: moduleId });
  }

  function finishPlacement(ratings, quizAnswers) {
    const progress = applyPlacement(ratings, quizAnswers);
    setTutorialProgress(progress);
    setPlacing(false);
    const moduleId = getCurrentModuleId(progress);
    if (moduleId) {
      dispatch({ type: "NEW_CASE", tutorial: moduleId });
    }
  }

  function continueAfterScore() {
    if (!state?.case?.tutorial) {
      dispatch({ type: "NEW_CASE" });
      return;
    }

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

  if (!state) {
    return (
      <StartGate
        seedDraft={seedDraft}
        balance={wallet.balance}
        tutorialProgress={tutorialProgress}
        onSeedDraft={setSeedDraft}
        onStart={() => dispatch({ type: "NEW_CASE", seed: seedDraft.trim() || undefined })}
        onTutorial={startTutorial}
      />
    );
  }

  return (
    <Workstation
      state={state}
      seedDraft={seedDraft}
      balance={wallet.balance}
      onSeedDraft={setSeedDraft}
      onLoadSeed={() => dispatch({ type: "NEW_CASE", seed: seedDraft.trim() || undefined })}
      onNewCase={() => dispatch({ type: "NEW_CASE" })}
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
    />
  );
}
