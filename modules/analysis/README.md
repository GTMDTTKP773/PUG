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
supply_cut.standard_one_step_regular
```

`rules.analysis.simulate_action_sequence(game, actions)` clones a game and
applies a sequence of browser-style actions. It reads `game.active` again after
every action and rejects a step that is not present in the authoritative
`rules.view(...).actions` payload.

`rules.analysis.probe_supply_cut_actions(game, role, actions)` probes standard
Movement stops, dropped units, and standard SR destinations against an
opponent regular unit moving one space to take control.

Both helpers run candidate actions on cloned states because `rules.action()`
may mutate its input.

Future tactical queries should be added as explicit capabilities. Keep normal
state transitions authoritative and test that analysis calls do not mutate the
source game.
