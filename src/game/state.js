import { generateCase } from "./generator.js";
import { LEAK_OFFERS, resolveLeak } from "./leaks.js";
import { createRng, randomSeed } from "./rng.js";
import { evaluate } from "./evaluator.js";
import {
  generateTutorialCase,
  isTutorialSeed,
  moduleIdFromSeed,
} from "./tutorial.js";

export function createGame(seed, options = {}) {
  if (options.tutorial != null) {
    const gameCase = generateTutorialCase(options.tutorial);
    return buildState(gameCase);
  }

  const resolved = seed ? String(seed) : randomSeed();
  if (isTutorialSeed(resolved)) {
    const moduleId = moduleIdFromSeed(resolved) || "browse";
    return buildState(generateTutorialCase(moduleId));
  }

  const rng = createRng(resolved);
  return buildState(generateCase(resolved, rng));
}

function buildState(gameCase) {
  return {
    seed: String(gameCase.seed),
    case: gameCase,
    player: {
      notes: [],
      selectedEvidence: [],
      hypothesis: null,
      confidence: 3,
      leaks: [],
    },
    startedAt: null,
    submittedAt: null,
    result: null,
  };
}

export function reduce(state, action) {
  switch (action.type) {
    case "NEW_CASE":
      return createGame(action.seed, { tutorial: action.tutorial });
    case "BEGIN": {
      if (!state || state.startedAt) return state;
      return { ...state, startedAt: Date.now() };
    }
    case "ADD_NOTE": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        player: {
          ...state.player,
          notes: [...state.player.notes, { id: `note_${state.player.notes.length + 1}`, text }],
        },
      };
    }
    case "PIN_EVIDENCE": {
      const id = action.id;
      const selected = state.player.selectedEvidence.includes(id)
        ? state.player.selectedEvidence.filter((item) => item !== id)
        : [...state.player.selectedEvidence, id];
      return { ...state, player: { ...state.player, selectedEvidence: selected } };
    }
    case "SET_HYPOTHESIS":
      return { ...state, player: { ...state.player, hypothesis: action.hypothesis } };
    case "SET_CONFIDENCE":
      return { ...state, player: { ...state.player, confidence: action.confidence } };
    case "BUY_LEAK": {
      if (!state || state.result) return state;
      const offer = LEAK_OFFERS.find((item) => item.id === action.leakId);
      if (!offer) return state;
      if (state.player.leaks.some((leak) => leak.id === offer.id)) return state;
      if (!action.paid) return state;

      const tip = resolveLeak(state.case, offer.id);
      if (!tip) return state;

      return {
        ...state,
        player: {
          ...state.player,
          leaks: [...state.player.leaks, { id: offer.id, tip, cost: offer.cost }],
        },
      };
    }
    case "SUBMIT": {
      if (state.result || !state.player.hypothesis) return state;
      const submittedAt = Date.now();
      const startedAt = state.startedAt ?? submittedAt;
      const next = { ...state, startedAt, submittedAt };
      return { ...next, result: evaluate(next) };
    }
    default:
      return state;
  }
}
