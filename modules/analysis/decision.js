"use strict"

/**
 * Pure decision-surface helpers for external AI clients.
 *
 * The normal rules flow remains authoritative. These helpers only classify
 * enabled browser actions and simulate deterministic follow-up actions on
 * cloned states.
 */
module.exports = function create_decision_analysis() {
	const UI_ONLY_ACTIONS = new Set(["undo", "propose_rollback", "flag_supply_warnings"])
	const RECOVERY_ACTIONS = new Set(["undo"])
	const COMMITTED_PROGRESS_ACTIONS = {
		confirm_cc: "confirm",
		confirm_attack: "confirm",
		confirm_pass_attack: "pass",
		confirm_remove_beachhead: "confirm",
		confirm_event: "end_action",
		end_event: "confirm",
		end_operations: "end_action",
		combine_lcu: "select_lcu"
	}
	const RECONSIDERATION_ACTIONS_BY_STATE = {
		attack: new Set(["cancel_selection"]),
		card_action: new Set(["cancel"])
	}
	const SELECTED_PIECE_RECONSIDERATION_STATES = new Set([
		"attack",
		"combine_lcu",
		"event_russo_british_assault_attack_basra",
		"jihad_placement"
	])
	const LOCKED_SELECTED_PIECE_STATES = new Set(["jihad_placement"])

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function normalize_action(action) {
		if (!Array.isArray(action) || action.length === 0) throw new Error("Action must be a [name, arg] pair")
		return [action[0], action.length > 1 && action[1] !== undefined ? action[1] : null]
	}

	function action_equals(a, b) {
		return a[0] === b[0] && a[1] === b[1]
	}

	function flatten_legal_actions(view) {
		let result = []
		for (let [name, value] of Object.entries(view.actions || {})) {
			if (Array.isArray(value)) {
				for (let arg of value) result.push([name, arg])
			} else if (value === 1) {
				result.push([name, null])
			}
		}
		return result
	}

	function selected_pieces_from_state(game, view) {
		if (Array.isArray(view.who)) return view.who
		if (view.who !== null && view.who !== undefined) return [view.who]
		if (Array.isArray(game.selected_pieces)) return game.selected_pieces
		if (game.selected_piece !== null && game.selected_piece !== undefined) return [game.selected_piece]
		if (game.attack && Array.isArray(game.attack.pieces)) return game.attack.pieces
		return []
	}

	function action_category(name) {
		if (name === "card") return "card"
		if (name.startsWith("play_")) return "card_usage"
		if (name === "space" || name.startsWith("activate_")) return "space"
		if (name === "piece" || name === "select_lcu") return "piece"
		return "command"
	}

	function action_flags(game, view, action, selected) {
		let [name, arg] = action
		let flags = []
		if (UI_ONLY_ACTIONS.has(name)) flags.push("ui_only")
		if (RECOVERY_ACTIONS.has(name)) flags.push("recovery")

		let reconsideration = false
		let state_exclusions = RECONSIDERATION_ACTIONS_BY_STATE[view.state]
		if (state_exclusions && state_exclusions.has(name)) reconsideration = true
		if (name === "piece" && selected.length > 0) {
			if (LOCKED_SELECTED_PIECE_STATES.has(view.state)) reconsideration = true
			if (SELECTED_PIECE_RECONSIDERATION_STATES.has(view.state) && selected.includes(arg)) reconsideration = true
		}
		if (reconsideration) flags.push("reconsideration")

		let preferred = COMMITTED_PROGRESS_ACTIONS[view.state]
		if (preferred === name && arg === null) flags.push("committed_progress")
		return flags
	}

	function build_decision_snapshot(game, view) {
		let legal_actions = flatten_legal_actions(view)
		let selected = selected_pieces_from_state(game, view)
		let action_entries = legal_actions.map((action) => ({
			action,
			category: action_category(action[0]),
			flags: action_flags(game, view, action, selected)
		}))
		let non_ui_entries = action_entries.filter((entry) => !entry.flags.includes("ui_only"))
		let gameplay_entries = action_entries.filter(
			(entry) => !entry.flags.includes("ui_only") && !entry.flags.includes("reconsideration")
		)
		let recovery_entries = action_entries.filter((entry) => entry.flags.includes("recovery"))
		let candidate_entries =
			gameplay_entries.length > 0
				? gameplay_entries
				: non_ui_entries.length > 0
					? non_ui_entries
					: recovery_entries
		let candidates = candidate_entries.map((entry) => entry.action)

		let automatic = null
		let preferred = COMMITTED_PROGRESS_ACTIONS[view.state]
		if (preferred) {
			let action = candidates.find(([name, arg]) => name === preferred && arg === null)
			if (action) automatic = { action, reason: "committed_confirmation" }
		}
		if (!automatic && candidates.length === 1) {
			automatic = { action: candidates[0], reason: "forced_flow" }
		}

		return {
			state: view.state,
			active: view.active,
			selected: selected.slice(),
			legal_actions,
			candidates,
			action_entries,
			automatic
		}
	}

	function decision_snapshot(game, role, get_view) {
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		let candidate = clone_game(game)
		let view = get_view(candidate, role || candidate.active)
		return build_decision_snapshot(candidate, view)
	}

	function advance_automatic_actions(game, get_view, apply_action, options = {}) {
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		let max_steps = Number.isInteger(options.max_steps) ? options.max_steps : 16
		let sequence = []
		let seen = new Set()
		let decision = null

		for (let i = 0; i < max_steps; i++) {
			let view = get_view(game, game.active)
			decision = build_decision_snapshot(game, view)
			if (!decision.automatic) break
			let signature = JSON.stringify({
				state: decision.state,
				active: decision.active,
				candidates: decision.candidates
			})
			if (seen.has(signature)) break
			seen.add(signature)
			let action = decision.automatic.action
			sequence.push(action)
			game = apply_action(game, game.active, action[0], action[1])
			decision = null
		}

		if (!decision) {
			let view = get_view(game, game.active)
			decision = build_decision_snapshot(game, view)
		}
		return { game, sequence, decision }
	}

	function step_decision(game, role, action, get_view, apply_action, options = {}) {
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		let first = normalize_action(action)
		let candidate = clone_game(game)
		let source_view = get_view(candidate, role || candidate.active)
		let source_decision = build_decision_snapshot(candidate, source_view)
		if (!source_decision.candidates.some((entry) => action_equals(entry, first))) {
			throw new Error(`Invalid decision action: ${first[0]}(${String(first[1])})`)
		}

		candidate = apply_action(candidate, role || candidate.active, first[0], first[1])
		let followup = advance_automatic_actions(candidate, get_view, apply_action, options)
		return {
			game: followup.game,
			sequence: [first, ...followup.sequence],
			decision: followup.decision
		}
	}

	return {
		build_decision_snapshot,
		decision_snapshot,
		advance_automatic_actions,
		step_decision
	}
}
