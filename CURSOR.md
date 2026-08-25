# CURSOR.md — Signal Development Guide

## Project

**Signal** is a single-page procedural analysis game.

The player receives a dynamically generated situation, investigates noisy datasets, discovers relationships and anomalies, forms a hypothesis, and submits an evidence-backed analysis.

The core principle is:

> Generate a world and its hidden truth first, then generate the visible evidence from that truth.

Do not build a fixed detective script.

---

## Tech Constraints

Use:

- Vite
- React (vanilla — function components + hooks only)
- CSS

Prefer browser-native APIs where practical.

Do not add TypeScript, a router, Redux, a backend, or external services unless explicitly requested later.

The MVP must run locally as a static web application (`npm run dev` / `npm run build`).

---

## Core Architecture

Keep the code organized around these responsibilities:

```text
Seeded RNG
   ↓
Case Generator
   ↓
Truth Model
   ↓
World/Data Generator
   ↓
Game State
   ↓
React UI / Investigation Tools
   ↓
Hypothesis Builder
   ↓
Evaluator
   ↓
Score / Results
```

Do not mix generation, game rules, and React rendering into one large function.

---

## Deterministic Generation

Every case must be reproducible from a seed.

Create a seeded RNG abstraction.

Avoid direct use of `Math.random()` in gameplay generation.

Example concept:

```js
const rng = createRng(seed);

const employee = randomItem(rng, employees);
const amount = randomInt(rng, 1000, 100000);
```

If the same seed is supplied, the same case should be produced.

This is required for debugging and future daily challenges.

---

## Hidden Truth

A case should first establish what actually happened.

Example:

```js
const truth = {
  type: "credential_compromise",
  employeeId: "employee_07",
  accountId: "account_391",
  criticalTransactionId: "transaction_4821",
  evidenceIds: [
    "login_291",
    "transaction_4821",
    "location_73"
  ]
};
```

The truth is game state.

Never expose it directly through the UI.

The evaluator is allowed to access it.

---

## Evidence Generation

Generate ordinary data first where useful, then inject events that are causally related to the hidden truth.

The case should contain:

### Strong evidence

Information that directly supports the correct explanation.

### Weak evidence

Information that is relevant but not decisive.

### Red herrings

Information that looks suspicious but has an innocent explanation.

### Background noise

Normal information that gives the world scale and realism.

The player should not be able to solve every case by sorting one column.

---

## Data Relationships

Records should reference one another by stable IDs.

Example:

```js
{
  id: "transaction_4821",
  employeeId: "employee_07",
  accountId: "account_391",
  timestamp: "02:13",
  amount: 87400
}
```

Prefer IDs over embedding duplicated objects everywhere.

This allows the UI to resolve relationships dynamically.

---

## Game State

Maintain one central game state.

Conceptually:

```js
const gameState = {
  seed,
  case,
  player: {
    notes: [],
    selectedEvidence: [],
    hypothesis: null,
    confidence: null
  },
  startedAt: Date.now(),
  elapsedSeconds: 0
};
```

Do not store important state only in the DOM.

React is a rendering layer over game state.

---

## Player Investigation

The player should be able to:

- browse datasets
- search
- filter
- sort
- inspect records
- follow relationships
- view timelines
- take notes
- pin evidence
- compare records
- form a hypothesis

Do not automatically tell the player which evidence is important.

---

## Evidence Inspection

When a player opens a record, show related records where appropriate.

For example:

```text
Transaction #4821
        ↓
Employee #07
        ↓
Login #291
        ↓
Location #73
        ↓
Account #391
```

This relationship system is central to the game.

---

## Hypothesis System

The player should submit more than a single multiple-choice answer.

At minimum, collect:

```js
{
  hypothesis,
  selectedEvidence,
  confidence
}
```

The player should be rewarded for supporting their conclusion with appropriate evidence.

Avoid making the final answer dependent on one exact sentence.

---

## Evaluation

The evaluator should compare the player's analysis with the hidden truth.

Suggested scoring:

```text
Accuracy
+ Strong Evidence
+ Relevant Evidence
+ Efficiency
+ Confidence Calibration
- Excessive Noise
- Unsupported Claims
```

Keep scoring explainable.

After submission, tell the player why their score was earned.

Example:

```text
Correct hypothesis       +500
Critical evidence        +300
Supporting evidence      +200
Fast investigation       +150
Strong confidence        +100
Missed key evidence      -100

TOTAL                    1150
```

Exact numbers can change during balancing.

---

## Difficulty

Do not initially create separate difficulty systems.

Difficulty should emerge from generated parameters:

- number of records
- number of red herrings
- strength of evidence
- number of plausible explanations
- amount of missing information
- number of relationships
- data complexity

Keep the generator parameterized so difficulty can be tuned later.

---

## UI Principles

The interface should feel like an analyst workstation.

Prioritize:

- readable dense tables
- fast navigation
- clear selected states
- useful search
- useful filters
- timelines
- charts
- evidence connections
- compact panels
- keyboard-friendly interactions

Avoid:

- excessive gradients
- unnecessary glassmorphism
- huge decorative UI
- excessive animations
- generic SaaS dashboard styling

The game is about information. The information must remain the visual priority.

---

## Animation

Use motion to communicate:

- opening an investigation
- selecting evidence
- switching datasets
- discovering relationships
- completing an analysis
- revealing the truth
- scoring

Do not animate every element.

Animations should be fast and functional.

---

## Development Order

Implement in this order:

### 1. Game seed

Create and display a seed.

### 2. Basic generator

Generate employees and transactions.

### 3. Truth model

Generate one hidden root cause.

### 4. Evidence

Create supporting evidence and red herrings.

### 5. Data UI

Render tables and record details.

### 6. Investigation

Add search, filtering, sorting, and related records.

### 7. Notes/evidence

Allow players to save findings.

### 8. Submission

Add hypothesis, evidence selection, and confidence.

### 9. Evaluator

Calculate a transparent score.

### 10. Replay

Generate a new case.

Only after this loop is fun should additional case types be added.

---

## Coding Rules

- Keep functions small and focused.
- Use descriptive names.
- Avoid global mutable state where possible.
- Keep generation pure where practical.
- Keep rendering separate from game logic.
- Do not duplicate generated data unnecessarily.
- Use stable IDs for entities.
- Add comments for non-obvious procedural logic.
- Do not add dependencies without a concrete benefit.
- Do not build abstractions before they are needed.

---

## Important Product Rule

Do not turn Signal into a puzzle where the player is expected to guess what the developer was thinking.

There should be multiple legitimate investigation paths.

A player should be able to reach the correct conclusion because they understand the relationships in the data.

The game should reward:

> observation → investigation → reasoning → evidence → conclusion

rather than:

> clicking every item until the correct clue appears.

---

## Future Architecture

When more case types are added, use a common interface:

```js
{
  id,
  title,
  briefing,
  generate(rng),
  getHypotheses(),
  evaluate(playerAnalysis, truth)
}
```

Possible future case families:

- business fraud
- operational failures
- sports performance
- cybersecurity incidents
- customer churn
- supply-chain problems
- financial anomalies
- organizational problems

All case types should use the same player investigation loop.

---

## Final Standard

Before considering a feature complete, ask:

1. Does it create an interesting analytical decision?
2. Does it increase the player's ability to reason from evidence?
3. Does it preserve procedural replayability?
4. Can the evaluator reliably judge it?
5. Does it avoid turning the game into a fixed sequence of clicks?

If the answer to these is no, simplify or redesign the feature.
