# Signal

**Signal** is a procedural analysis game where players investigate dynamically generated situations, discover meaningful patterns in noisy data, form hypotheses, and explain what they believe happened.

The player is not given a predefined mystery with a fixed sequence of clues. Each case is generated from an underlying simulation with a hidden truth. The player must decide what matters, investigate relationships between evidence, avoid red herrings, and submit an analysis.

## Core Gameplay

1. A new case is generated from a deterministic seed.
2. The game presents a vague problem such as:
   - revenue suddenly dropped
   - an organization experienced suspicious activity
   - a team began underperforming
   - an operational process became inefficient
3. The player explores generated datasets:
   - people
   - transactions
   - events
   - messages
   - locations
   - timelines
   - performance metrics
4. The player searches, filters, sorts, compares, and connects evidence.
5. The player forms a hypothesis.
6. The player selects supporting evidence and submits their analysis.
7. The game compares the player's reasoning with the hidden simulation truth.
8. The player receives a score based on correctness, evidence quality, efficiency, and unnecessary investigation.
9. A new case can be generated immediately.

## Design Philosophy

### The player is an analyst, not a detective following a script

The game should never rely on a fixed chain such as:

> Click A → click B → find C → solve.

Instead, the player should have enough information to reach the truth through multiple possible paths.

### Generate the truth first

Cases should be built around a hidden causal model.

Example:

```text
Credential compromise
        ↓
Unauthorized login
        ↓
Suspicious transaction
        ↓
Customer impact
```

The visible data is generated from this hidden model, along with normal activity and deliberate red herrings.

### Signal vs. noise

Most data should be ordinary.

Important evidence should be discoverable but not highlighted automatically. Some suspicious-looking information should be innocent.

The central skill is distinguishing signal from noise.

### Reproducibility

Every case should have a seed.

The same seed must generate the same case. This allows:

- debugging
- replay
- daily challenges
- sharing cases
- future leaderboards

## Initial Scope

The first playable version should focus on one case family: **business anomaly investigation**.

A case may contain:

- 10–30 employees
- 50–300 transactions
- login/activity events
- customer records
- messages
- locations
- a timeline
- one hidden root cause
- several supporting clues
- several red herrings

Do not attempt to build every possible case type initially.

## Scoring

The scoring system should reward good analysis rather than guessing.

Suggested components:

- **Accuracy** — Did the player identify the underlying cause?
- **Evidence** — Did they identify strong supporting evidence?
- **Efficiency** — How quickly did they reach a defensible conclusion?
- **Noise** — Did they spend excessive time investigating irrelevant evidence?
- **Confidence calibration** — Was their confidence appropriate for the evidence available?

A player who guesses correctly with no evidence should score worse than a player who reaches the same conclusion with strong supporting evidence.

## Technical Direction

The initial project is a client-side web application using:

- [Vite](https://vitejs.dev/)
- React (vanilla — no TypeScript, router, or state library)
- CSS

No backend is required for the MVP.

```bash
npm install
npm run dev
```

Suggested structure:

```text
/
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── CURSOR.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    ├── components/
    └── game/
        ├── rng.js
        ├── generator.js
        ├── world.js
        ├── evidence.js
        ├── state.js
        ├── relations.js
        ├── evaluator.js
        └── hypotheses.js
```

Keep the project dependency-light. Do not add libraries unless there is a clear reason.

## Suggested Architecture

```text
Seed
  ↓
Case Generator
  ↓
Hidden Truth
  ↓
World/Data Generator
  ↓
Player Investigation UI
  ↓
Evidence / Hypothesis System
  ↓
Answer Evaluator
  ↓
Score
```

### Seeded RNG

Use a seeded pseudo-random number generator rather than scattering `Math.random()` throughout the code.

The generator should accept a seed and produce reproducible results.

### Case Generator

The case generator chooses:

- case parameters
- people
- events
- data distributions
- hidden cause
- supporting evidence
- red herrings

### Truth Model

The hidden truth should be explicit in the game state but never directly rendered to the player.

Example:

```js
{
  type: "credential_compromise",
  culprit: "employee_07",
  affectedAccount: "account_391",
  criticalEvent: "transaction_4821",
  supportingEvidence: [
    "login_291",
    "transaction_4821",
    "location_73"
  ]
}
```

### Evidence Model

Evidence should have relationships.

For example:

```text
Transaction
   ├── Employee
   ├── Account
   ├── Timestamp
   └── Location
```

This allows the interface to expose related information when the player investigates.

## UI Direction

The visual identity should feel like a modern analyst workstation rather than a traditional detective game.

Prioritize:

- dense but readable information
- clear hierarchy
- dark interface
- subtle motion
- excellent tables
- useful filtering/search
- timelines
- charts
- evidence relationships
- fast interactions

Avoid making the interface look like a generic admin dashboard.

The player should feel like they are operating an investigation system.

## MVP Features

Build these first:

- [ ] Generate a seeded business investigation
- [ ] Generate employees
- [ ] Generate transactions
- [ ] Generate activity/login events
- [ ] Generate a hidden root cause
- [ ] Generate supporting evidence
- [ ] Generate red herrings
- [ ] Browse datasets
- [ ] Search and filter data
- [ ] Inspect individual records
- [ ] Show related evidence
- [ ] Create notes
- [ ] Select a hypothesis
- [ ] Select supporting evidence
- [ ] Submit analysis
- [ ] Reveal the hidden truth
- [ ] Calculate a score
- [ ] Generate another case

## Future Features

Potential expansions:

- daily seeded cases
- global leaderboards
- case sharing
- multiple domains
- procedural charts
- more sophisticated causal graphs
- analyst reputation/ranks
- achievements
- limited hints
- multiplayer competitions
- generated narrative text
- case difficulty levels
- replay analysis showing the shortest path to the solution

## Important Constraint

Do not make the game depend on an LLM for its core logic.

AI-generated text can eventually add flavor, but the underlying case must be generated from deterministic rules that the game can evaluate reliably.

The game should remain playable without an API key or external AI service.

## Project Goal

The goal is to create a game where the satisfying moment is:

> **"I figured out what the data was actually telling me."**

Not:

> "I found the clue the developer wanted me to click."

That distinction should guide every gameplay and implementation decision.
