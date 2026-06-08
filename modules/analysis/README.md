# Optional Analysis API

This directory contains read-only helpers for external tools such as PUG-AI.
Normal games do not call these modules.

Use the versioned namespace exported by `rules.js`:

```js
const result = rules.analysis.probe_supply_cut_actions(game, role, actions)
```

Available capabilities:

```text
action_sequence.simulate
activation_analysis.v1
candidate_context.v1
combat_preview.v1
decision.snapshot
decision.step
position.public
position.public.v2
supply_cut.standard_one_step_regular
```

`rules.analysis.simulate_action_sequence(game, actions)` clones a game and
applies a sequence of browser-style actions. It reads `game.active` again after
every action and rejects a step that is not present in the authoritative
`rules.view(...).actions` payload.

`rules.analysis.decision_snapshot(game, role)` returns enabled legal actions,
AI search candidates, action metadata, and any deterministic follow-up action.
It keeps legal actions separate from AI candidates so external clients can use
the former as a policy mask and the latter as a search surface.

`rules.analysis.candidate_context(game, role, actions)` returns public facts
for legal candidate actions: card metadata, piece and space summaries,
activation cost, available stack pieces, movement/SR destination facts, and
basic attack-target counts. It does not generate actions.

`rules.analysis.activation_analysis(game, role, actions)` is a focused view of
activation candidates grouped by space and mode for policy features and search
priors.

`rules.analysis.combat_preview(game, role, actions)` returns combat-facing
facts for candidate actions: selected attackers, legal target previews, odds,
defender stacks, retreat options, and current loss/advance/retreat state when a
battle is already underway.

`rules.analysis.step_decision(game, role, action)` clones a game, validates an
AI candidate action, applies it, and advances committed confirmations or
single-candidate browser flow until the next real decision.

`rules.analysis.public_position(game)` clones and normalizes the source state,
refreshes supply on that clone when needed, and returns public per-space facts:
control, piece ids, AP/CP/neutral unit-count buckets, current combat/loss/move
factor totals, supply degradation counts, fort siege/destruction flags, and
beachhead flags. It also returns public on-map piece summaries with current
faction, reduced/supply/moved flags, and current factors. It does not expose
hands or legal actions.

`rules.analysis.probe_supply_cut_actions(game, role, actions)` probes standard
Movement stops, dropped units, and standard SR destinations against an
opponent regular unit moving one space to take control.

Both helpers run candidate actions on cloned states because `rules.action()`
may mutate its input.

Future tactical queries should be added as explicit capabilities. Keep normal
state transitions authoritative and test that analysis calls do not mutate the
source game.
