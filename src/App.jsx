import { useEffect, useReducer, useRef, useState } from "react";
import { StartGate } from "./components/StartGate.jsx";
import { Workstation } from "./components/Workstation.jsx";
import { LEAK_OFFERS } from "./game/leaks.js";
import { reduce } from "./game/state.js";
import {
  getTutorialProgress,
  markTutorialRoundComplete,
  resetTutorialProgress,
  TUTORIAL_ROUND_COUNT,
} from "./game/tutorial.js";
import { creditWallet, getWallet, spendWallet } from "./game/wallet.js";

export function App() {
  const [state, dispatch] = useReducer(reduce, null);
  const [seedDraft, setSeedDraft] = useState("");
  const [wallet, setWallet] = useState(getWallet);
  const [tutorialProgress, setTutorialProgress] = useState(getTutorialProgress);
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
      setTutorialProgress(markTutorialRoundComplete(state.case.tutorial.round));
    } else if (state.result.payout > 0) {
      creditWallet(state.result.payout, receipt);
      setWallet(getWallet());
    }
  }, [state?.result, state?.seed, state?.submittedAt, state?.case?.tutorial]);

  function refreshWallet() {
    setWallet(getWallet());
  }

  function startTutorial() {
    let progress = getTutorialProgress();
    if (progress.finished) {
      progress = resetTutorialProgress();
    }
    setTutorialProgress(progress);
    const round = Math.min(progress.nextRound, TUTORIAL_ROUND_COUNT - 1);
    dispatch({ type: "NEW_CASE", tutorial: round });
  }

  function continueAfterScore() {
    if (!state?.case?.tutorial) {
      dispatch({ type: "NEW_CASE" });
      return;
    }

    const round = state.case.tutorial.round;
    if (round + 1 < TUTORIAL_ROUND_COUNT) {
      dispatch({ type: "NEW_CASE", tutorial: round + 1 });
      return;
    }

    dispatch({ type: "NEW_CASE" });
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
