"use strict"

/**
 * Read-only validation and state-delta analysis for combat action packages.
 *
 * The authoritative state machine executes every action on a cloned game.
 * This module deliberately does not resolve hypothetical dice rolls.
 */
module.exports = function create_combat_package_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const COMBAT_STATES = new Set([
		"attack",
		"confirm_attack",
		"choose_region_defender_stack",
		"apply_defender_losses",
		"apply_attacker_losses",
		"eliminate_retreated_units",
		"choose_lcu_replacement",
		"retreat_cancel",
		"retreat",
		"turkish_retreat",
		"jafar_pasha_retreat",
		"advance"
	])

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function short_faction(faction) {
		if (faction === AP || faction === "Allied Powers" || faction === "AP") return AP
		if (faction === CP || faction === "Central Powers" || faction === "CP") return CP
		return "neutral"
	}

	function phase_for_state(state) {
		if (state === "attack" || state === "confirm_attack" || state === "choose_region_defender_stack") return "attack"
		if (
			state === "apply_defender_losses" ||
			state === "apply_attacker_losses" ||
			state === "eliminate_retreated_units" ||
			state === "choose_lcu_replacement"
		) return "loss"
		if (state === "retreat_cancel" || state === "retreat" || state === "turkish_retreat" || state === "jafar_pasha_retreat") {
			return "retreat"
		}
		if (state === "advance") return "advance"
		return "other"
	}

	function normalize_action(action) {
		if (!Array.isArray(action) || typeof action[0] !== "string") {
			throw new Error("Action must be a [name, arg] pair")
		}
		return [action[0], action.length > 1 && action[1] !== undefined ? action[1] : null]
	}

	function normalize_candidate(candidate, index) {
		let sequence = null
		let kind = "combat_package"
		let label = ""
		if (Array.isArray(candidate)) {
			sequence = typeof candidate[0] === "string" ? [candidate] : candidate
		} else if (candidate && typeof candidate === "object") {
			sequence = candidate.sequence || candidate.actions || (candidate.action ? [candidate.action] : null)
			kind = candidate.kind || kind
			label = candidate.label || ""
		}
		try {
			if (!Array.isArray(sequence) || sequence.length === 0) throw new Error("Candidate must contain actions")
			return { index, kind, label, sequence: sequence.map(normalize_action), error: null }
		} catch (error) {
			return { index, kind, label, sequence: [], error: error.message }
		}
	}

	function flatten_actions(view) {
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

	function is_legal(view, action) {
		let options = (view.actions || {})[action[0]]
		if (Array.isArray(options)) return options.includes(action[1])
		return options === 1 && action[1] === null
	}

	function piece_context(game, piece) {
		let info = data.pieces[piece] || {}
		return {
			id: piece,
			name: info.name || "",
			location: game.pieces[piece],
			faction: short_faction(Engine.game_utils.get_piece_effective_faction(game, piece)),
			nation: info.nation || "",
			type: info.type || "",
			piece_class: info.piece_class || "",
			cf: Engine.game_utils.get_piece_cf(game, piece) || 0,
			lf: Engine.game_utils.get_piece_lf(game, piece) || 0,
			mf: Engine.map.get_piece_mf(piece) || 0,
			reduced: Engine.game_utils.is_piece_reduced(game, piece),
			eliminated: Engine.game_utils.is_eliminated(game, piece),
			removed: Engine.game_utils.is_removed(game, piece),
			regular: Engine.game_utils.is_regular(piece),
			irregular: Engine.game_utils.is_irregular(piece),
			tribe: Engine.game_utils.is_tribe(piece),
			lcu: Engine.game_utils.is_lcu(piece),
			scu: Engine.game_utils.is_scu(piece),
			hq: Engine.game_utils.is_hq(piece),
			heavy_arty: Engine.game_utils.is_heavy_arty(piece)
		}
	}

	function relevant_pieces(game) {
		let pieces = new Set()
		for (let value of [
			game.attack?.pieces,
			game.attack?.region_defenders,
			game.retreat_pieces,
			game.turkish_retreat_mandatory,
			game.turkish_retreat_optional,
			game.advance_pieces,
			game.advance_follow_pieces
		]) {
			for (let piece of Array.isArray(value) ? value : []) pieces.add(piece)
		}
		if (Number.isInteger(game.selected_piece)) pieces.add(game.selected_piece)
		if (game.attack?.space > 0) {
			for (let piece of Engine.map.get_pieces_in_space(game, game.attack.space)) pieces.add(piece)
		}
		return Array.from(pieces).filter((piece) => data.pieces[piece])
	}

	function combat_snapshot(game, role, view) {
		let attack = game.attack || {}
		let phase = phase_for_state(game.state)
		let side = game.state === "apply_attacker_losses" ? "attacker" :
			(game.state === "apply_defender_losses" || game.state === "eliminate_retreated_units" ? "defender" : null)
		let total = side ? Number(attack[`${side}_losses`] || 0) : 0
		let absorbed = side ? Number(attack[`${side}_losses_absorbed`] || 0) : 0
		let pieces = relevant_pieces(game)
		return {
			state: game.state || "",
			phase,
			active: short_faction(game.active),
			role: short_faction(role),
			attack: {
				attacker: short_faction(attack.attacker),
				defender: short_faction(attack.defender),
				pieces: Array.isArray(attack.pieces) ? attack.pieces.slice() : [],
				target: attack.space > 0 ? attack.space : null,
				region_defenders: Array.isArray(attack.region_defenders) ? attack.region_defenders.slice() : [],
				attacker_losses: Number(attack.attacker_losses || 0),
				defender_losses: Number(attack.defender_losses || 0)
			},
			loss: side ? { side, total, absorbed, needed: Math.max(0, total - absorbed) } : null,
			retreat: {
				pieces: Array.isArray(game.retreat_pieces) ? game.retreat_pieces.slice() : [],
				selected_piece: Number.isInteger(game.selected_piece) ? game.selected_piece : null,
				from: game.retreat_from ?? null,
				current: game.retreat_space ?? null,
				distance: Number(game.retreat_distance || 0),
				steps_left: game.retreat_steps_left ? { ...game.retreat_steps_left } : {}
			},
			advance: {
				pieces: Array.isArray(game.advance_pieces) ? game.advance_pieces.slice() : [],
				follow_pieces: Array.isArray(game.advance_follow_pieces) ? game.advance_follow_pieces.slice() : [],
				selected_piece: Number.isInteger(game.selected_piece) ? game.selected_piece : null,
				target: game.advance_space ?? null,
				count: Number(game.advance_count || 0),
				limit: Number(game.advance_limit || 0),
				follow_mode: !!game.advance_follow_mode
			},
			pieces: pieces.map((piece) => piece_context(game, piece)),
			legal_actions: flatten_actions(view)
		}
	}

	function state_delta(before, after) {
		let pieces = []
		let count = Math.max(before.pieces?.length || 0, after.pieces?.length || 0)
		for (let piece = 0; piece < count; piece++) {
			let from = before.pieces?.[piece]
			let to = after.pieces?.[piece]
			let reduced_before = Array.isArray(before.reduced) && before.reduced.includes(piece)
			let reduced_after = Array.isArray(after.reduced) && after.reduced.includes(piece)
			if (from !== to || reduced_before !== reduced_after) {
				pieces.push({ piece, from, to, reduced_before, reduced_after })
			}
		}
		return {
			pieces,
			vp_delta: Number(after.vp || 0) - Number(before.vp || 0),
			jihad_delta: Number(after.jihad || 0) - Number(before.jihad || 0)
		}
	}

	function analyze_candidate(source, role, normalized, apply_action, get_view) {
		let result = {
			index: normalized.index,
			kind: normalized.kind,
			label: normalized.label,
			sequence: normalized.sequence,
			valid: false,
			complete: false,
			error: null,
			steps: []
		}
		if (normalized.error) {
			result.error = { type: "invalid_candidate", message: normalized.error }
			return result
		}
		let game = clone_game(source)
		let source_phase = phase_for_state(game.state)
		for (let index = 0; index < normalized.sequence.length; index++) {
			let acting_role = short_faction(game.active || role)
			let view = get_view(game, acting_role)
			let action = normalized.sequence[index]
			if (!is_legal(view, action)) {
				result.error = { type: "illegal_action", step: index, action, state: game.state, active: acting_role }
				result.final = combat_snapshot(game, acting_role, view)
				return result
			}
			let before = clone_game(game)
			let snapshot_before = combat_snapshot(game, acting_role, view)
			try {
				game = apply_action(game, acting_role, action[0], action[1])
			} catch (error) {
				result.error = { type: "action_error", step: index, action, message: error.message || String(error) }
				return result
			}
			let after_role = short_faction(game.active || acting_role)
			let after_view = get_view(game, after_role)
			result.steps.push({
				index,
				action,
				before: snapshot_before,
				after: combat_snapshot(game, after_role, after_view),
				delta: state_delta(before, game),
				random_changed: before.seed !== game.seed
			})
		}
		let final_role = short_faction(game.active || role)
		let final_view = get_view(game, final_role)
		result.valid = true
		result.final = combat_snapshot(game, final_role, final_view)
		result.final_state = game.state || ""
		result.final_active = final_role
		result.complete = phase_for_state(game.state) !== source_phase || !COMBAT_STATES.has(game.state)
		result.delta = state_delta(source, game)
		result.random_changed = result.steps.some((step) => step.random_changed)
		return result
	}

	function combat_package_analysis(game, role, candidates = null, apply_action = null, get_view = null) {
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		let acting_role = short_faction(role || game.active)
		let source = clone_game(game)
		let source_view = get_view(source, acting_role)
		let requested = candidates === null ? flatten_actions(source_view) : candidates
		let records = (requested || []).map(normalize_candidate).map((candidate) =>
			analyze_candidate(source, acting_role, candidate, apply_action, get_view)
		)
		return {
			schema: "pug-ai.combat_package_analysis.v1",
			state: source.state || "",
			phase: phase_for_state(source.state),
			active: short_faction(source.active),
			role: acting_role,
			context: combat_snapshot(source, acting_role, source_view),
			candidate_count: records.length,
			valid_count: records.filter((record) => record.valid).length,
			complete_count: records.filter((record) => record.valid && record.complete).length,
			candidates: records
		}
	}

	return { combat_package_analysis }
}
