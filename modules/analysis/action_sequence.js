"use strict"

/**
 * Clone and apply a browser-style micro-action sequence without mutating the
 * source game. The active role is read again after every action because RTT
 * flows do not alternate on a fixed schedule.
 */
module.exports = function create_action_sequence_analysis() {
	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function simulate_action_sequence(game, actions, apply_action, is_legal_action = null) {
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		let candidate = clone_game(game)
		for (let [index, action] of (actions || []).entries()) {
			let [action_name, action_arg] = action
			if (
				typeof is_legal_action === "function" &&
				!is_legal_action(candidate, candidate.active, action_name, action_arg)
			) {
				throw new Error(`Invalid action sequence step ${index}: ${action_name}(${String(action_arg)})`)
			}
			candidate = apply_action(candidate, candidate.active, action_name, action_arg)
		}
		return candidate
	}

	return {
		simulate_action_sequence
	}
}
