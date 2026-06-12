"use strict"

/**
 * Read-only Movement sequence analysis for external AI clients.
 *
 * Candidates are executed on cloned states through the authoritative action
 * handler. This keeps path legality and automatic stop behavior in the normal
 * Movement state machine instead of reproducing them in an AI client.
 */
module.exports = function create_movement_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const { find_standard_one_step_supply_cut_reply } = require("./supply_probe.js")(Engine)
	const MOVEMENT_STATES = new Set(["choose_pieces_to_move", "move_stack"])

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function short_faction(faction) {
		if (faction === AP || faction === "Allied Powers" || faction === "AP") return AP
		if (faction === CP || faction === "Central Powers" || faction === "CP") return CP
		return "neutral"
	}

	function other_faction(faction) {
		return faction === AP ? CP : AP
	}

	function normalize_action(action) {
		if (!Array.isArray(action) || action.length === 0 || typeof action[0] !== "string") {
			throw new Error("Action must be a [name, arg] pair")
		}
		return [action[0], action.length > 1 && action[1] !== undefined ? action[1] : null]
	}

	function normalize_candidate(candidate, index) {
		let sequence = null
		let label = ""
		let kind = "movement_sequence"
		let probe_supply_cut = false
		if (Array.isArray(candidate)) {
			sequence = typeof candidate[0] === "string" ? [candidate] : candidate
		} else if (candidate && typeof candidate === "object") {
			sequence = candidate.sequence || candidate.actions || (candidate.action ? [candidate.action] : null)
			label = candidate.label || ""
			kind = candidate.kind || kind
			probe_supply_cut = !!candidate.probe_supply_cut
		}
		if (!Array.isArray(sequence) || sequence.length === 0) {
			return {
				index,
				kind,
				label,
				probe_supply_cut,
				sequence: [],
				normalization_error: "Candidate must contain at least one action"
			}
		}
		try {
			return {
				index,
				kind,
				label,
				probe_supply_cut,
				sequence: sequence.map(normalize_action),
				normalization_error: null
			}
		} catch (error) {
			return {
				index,
				kind,
				label,
				probe_supply_cut,
				sequence: [],
				normalization_error: error.message
			}
		}
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

	function is_legal_action(view, action) {
		let [name, arg] = action
		let options = (view.actions || {})[name]
		if (Array.isArray(options)) return options.includes(arg)
		return options === 1 && (arg === null || arg === undefined)
	}

	function is_real_space(space) {
		let info = data.spaces[space]
		return !!(space > 0 && info && info.name !== undefined && !info.type)
	}

	function set_from(value) {
		return new Set(Array.isArray(value) ? value : [])
	}

	function get_pieces_in_space(game, space) {
		if (Engine.map?.get_pieces_in_space) return Engine.map.get_pieces_in_space(game, space)
		let result = []
		for (let piece = 0; piece < (game.pieces || []).length; piece++) {
			if (game.pieces[piece] === space) result.push(piece)
		}
		return result
	}

	function get_controller(game, space) {
		if (Engine.map?.get_space_controller) return Engine.map.get_space_controller(game, space)
		return (game.control && game.control[space]) || data.spaces[space]?.faction || "neutral"
	}

	function create_supply_cache(game) {
		return {
			supply_trace_cache: new Map(),
			supply_context: Engine.map?.create_supply_context ? Engine.map.create_supply_context(game) : null,
			source_cache: new Map(),
			status_cache: new Map()
		}
	}

	function supply_status(game, piece, cache) {
		let space = game.pieces[piece]
		if (!is_real_space(space) || !Engine.map?.get_supply_status) return "OFFMAP"
		let faction = Engine.game_utils.get_piece_effective_faction(game, piece) || data.pieces[piece]?.faction
		return Engine.map.get_supply_status(
			game,
			space,
			faction,
			piece,
			false,
			cache.supply_trace_cache,
			cache.supply_context,
			cache.source_cache,
			cache.status_cache
		)
	}

	function piece_context(game, piece, cache) {
		let info = data.pieces[piece] || {}
		let status = supply_status(game, piece, cache)
		return {
			id: piece,
			raw_id: is_real_space(game.pieces[piece]) ? game.pieces[piece] : null,
			name: info.name || "",
			faction: short_faction(info.faction),
			effective_faction: short_faction(Engine.game_utils.get_piece_effective_faction(game, piece)),
			nation: info.nation || "",
			piece_class: info.piece_class || "",
			cf: Engine.game_utils.get_piece_cf ? Engine.game_utils.get_piece_cf(game, piece) : 0,
			lf: Engine.game_utils.get_piece_lf ? Engine.game_utils.get_piece_lf(game, piece) : 0,
			mf: Engine.map?.get_piece_mf ? Engine.map.get_piece_mf(piece) : info.mf || 0,
			regular: Engine.game_utils.is_regular(piece),
			irregular: Engine.game_utils.is_irregular(piece),
			tribe: Engine.game_utils.is_tribe(piece),
			lcu: Engine.game_utils.is_lcu(piece),
			scu: Engine.game_utils.is_scu(piece),
			hq: Engine.game_utils.is_hq(piece),
			heavy_arty: Engine.game_utils.is_heavy_arty(piece),
			reduced: Engine.game_utils.is_piece_reduced(game, piece),
			moved: set_from(game.moved).has(piece),
			supply_status: status,
			oos: status === "OOS",
			limited_supply: Engine.map?.is_limited_supply_status
				? Engine.map.is_limited_supply_status(status)
				: status === "LIMITED",
			disrupted_supply: Engine.map?.is_disrupted_supply_status
				? Engine.map.is_disrupted_supply_status(status)
				: status === "DISRUPTED"
		}
	}

	function stack_counts(game, pieces, role) {
		let result = {
			friendly: { pieces: 0, lcu: 0, scu: 0, cf: 0, lf: 0 },
			enemy: { pieces: 0, lcu: 0, scu: 0, cf: 0, lf: 0 },
			neutral: { pieces: 0, lcu: 0, scu: 0, cf: 0, lf: 0 }
		}
		let enemy = other_faction(role)
		for (let piece of pieces) {
			if (!data.pieces[piece]) continue
			let faction = short_faction(Engine.game_utils.get_piece_effective_faction(game, piece))
			let side = faction === role ? "friendly" : faction === enemy ? "enemy" : "neutral"
			let bucket = result[side]
			bucket.pieces += 1
			if (Engine.game_utils.is_lcu(piece)) bucket.lcu += 1
			if (Engine.game_utils.is_scu(piece)) bucket.scu += 1
			bucket.cf += Engine.game_utils.get_piece_cf ? Engine.game_utils.get_piece_cf(game, piece) : 0
			bucket.lf += Engine.game_utils.get_piece_lf ? Engine.game_utils.get_piece_lf(game, piece) : 0
		}
		return result
	}

	function space_context(game, space, role) {
		if (!is_real_space(space)) return null
		let info = data.spaces[space]
		let controller = short_faction(get_controller(game, space))
		let pieces = get_pieces_in_space(game, space)
		return {
			raw_id: space,
			name: info.name || "",
			map: info.map || "",
			area: info.area || "",
			region: info.region || "",
			terrain: info.terrain || "",
			nation: info.nation || "",
			control: controller,
			friendly_controlled: controller === role,
			enemy_controlled: controller === other_faction(role),
			vp: info.vp || 0,
			fort: info.fort || 0,
			port: !!info.port,
			jihad_city: !!info.jihad_city,
			island_base: !!info.island_base,
			beachhead: Engine.map?.is_beachhead_space ? Engine.map.is_beachhead_space(game, space) : false,
			fort_destroyed: set_from(game.forts?.destroyed).has(space),
			fort_besieged: Engine.map?.is_besieged
				? Engine.map.is_besieged(game, space)
				: set_from(game.forts?.besieged).has(space),
			trench_level: Engine.game_utils.has_trench ? Engine.game_utils.has_trench(game, space) : 0,
			pieces,
			counts: stack_counts(game, pieces, role)
		}
	}

	function movement_snapshot(game, role, view) {
		if (!game.move) return null
		let selected = Array.isArray(game.move.pieces) ? game.move.pieces.slice() : []
		let current = game.move.current || game.move.initial || null
		let cache = create_supply_cache(game)
		let end_block_reason = null
		if (current > 0) {
			end_block_reason = selected.length > 0
				? Engine.map.get_stack_end_block_reason(game, current, selected)
				: Engine.map.get_move_end_space_block_reason(game, current, role)
		}
		let actions = view?.actions || {}
		return {
			initial: game.move.initial || null,
			current,
			faction: short_faction(game.move.faction || role),
			spaces_moved: Number(game.move.spaces_moved || 0),
			selected_pieces: selected,
			selected: selected.filter((piece) => data.pieces[piece]).map((piece) => piece_context(game, piece, cache)),
			touched_spaces: Array.isArray(game.move.touched_spaces) ? game.move.touched_spaces.slice() : [],
			can_stop: actions.stop === 1,
			destinations: Array.isArray(actions.space) ? actions.space.slice() : [],
			piece_options: Array.isArray(actions.piece) ? actions.piece.slice() : [],
			end_block_reason,
			initial_space: space_context(game, game.move.initial, role),
			current_space: space_context(game, current, role)
		}
	}

	function compact_movement_snapshot(snapshot) {
		if (!snapshot) return null
		return {
			initial: snapshot.initial,
			current: snapshot.current,
			faction: snapshot.faction,
			spaces_moved: snapshot.spaces_moved,
			selected_pieces: snapshot.selected_pieces,
			selected: snapshot.selected,
			touched_spaces: snapshot.touched_spaces,
			can_stop: snapshot.can_stop,
			destinations: snapshot.destinations,
			piece_options: snapshot.piece_options,
			end_block_reason: snapshot.end_block_reason,
			current_space: snapshot.current_space
		}
	}

	function movement_action_kind(state, action) {
		let [name] = action
		if (name === "space") return "destination"
		if (name === "stop") return "stop"
		if (name === "piece" && state === "move_stack") return "drop_piece"
		if (name === "piece" && state === "choose_pieces_to_move") return "select_piece"
		return "other"
	}

	function movement_costs(game, action, role) {
		let [name, target] = action
		if (name !== "space" || !game.move || !is_real_space(target)) return []
		let source = game.move.current || game.move.initial
		return (game.move.pieces || []).map((piece) => {
			let breakdown = Engine.map.get_movement_cost_breakdown(game, piece, target, role)
			let legal = Engine.map.can_piece_move_to(game, piece, target, role)
			let movement_factor = Engine.map.get_piece_mf(piece)
			let spent_before = Number(game.move.spaces_moved || 0)
			return {
				piece,
				from: source,
				to: target,
				legal,
				block_reason: legal ? null : Engine.map.get_piece_move_block_reason(game, piece, target, role),
				base: breakdown.base,
				enemy_fort_entry: breakdown.enemy_fort_entry,
				green_connection: breakdown.green_connection,
				total: breakdown.total,
				movement_factor,
				spent_before,
				spent_after: spent_before + breakdown.total,
				remaining_after: movement_factor - spent_before - breakdown.total
			}
		})
	}

	function analyze_step(game, action, role, view, apply_action, get_view, index) {
		let state_before = game.state || ""
		let active_before = short_faction(game.active)
		let before = movement_snapshot(game, role, view)
		let selected_before = before ? before.selected_pieces.slice() : []
		let positions_before = new Map(selected_before.map((piece) => [piece, game.pieces[piece]]))
		let kind = movement_action_kind(state_before, action)
		let source = before?.current || null
		let destination = kind === "destination" ? action[1] : source
		let costs = movement_costs(game, action, role)
		let stack_legal = kind === "destination" && before
			? Engine.map.can_stack_move_to(game, destination, role)
			: null
		let source_space_before = space_context(game, source, role)
		let destination_space_before = space_context(game, destination, role)
		let vp_before = Number(game.vp || 0)
		let jihad_before = Number(game.jihad || 0)

		game = apply_action(game, active_before, action[0], action[1])
		let active_after = short_faction(game.active)
		let after_view = get_view(game, active_after)
		let after = movement_snapshot(game, active_after, after_view)
		let continuing = new Set(after?.selected_pieces || [])
		let selected_after = after?.selected_pieces || []
		let selected_before_set = new Set(selected_before)
		let entered = selected_before.filter((piece) => game.pieces[piece] !== positions_before.get(piece))
		let left_behind = kind === "destination"
			? selected_before.filter((piece) => game.pieces[piece] === positions_before.get(piece) && !continuing.has(piece))
			: []
		let finalized = selected_before.filter((piece) => !continuing.has(piece))
		let selected_added = selected_after.filter((piece) => !selected_before_set.has(piece))
		let selected_removed = selected_before.filter((piece) => !continuing.has(piece))
		let entered_set = new Set(entered)
		let actual_step_cost = costs.reduce(
			(maximum, cost) => entered_set.has(cost.piece) ? Math.max(maximum, cost.total) : maximum,
			0
		)

		return {
			game,
			view: after_view,
			record: {
				index,
				action,
				kind,
				state_before,
				state_after: game.state || "",
				active_before,
				active_after,
				source,
				destination,
				stack_legal,
				piece_costs: costs,
				actual_step_cost,
				selected_added,
				selected_removed,
				entered_pieces: entered,
				left_behind_pieces: left_behind,
				continuing_pieces: selected_before.filter((piece) => continuing.has(piece)),
				finalized_pieces: finalized,
				ends_current_stack: selected_before.length > 0 && continuing.size === 0,
				forced_stop: kind === "destination" && entered.length > 0 && continuing.size === 0,
				vp_delta: Number(game.vp || 0) - vp_before,
				jihad_delta: Number(game.jihad || 0) - jihad_before,
				source_space_before,
				destination_space_before,
				destination_space_after: space_context(game, destination, role),
				movement_before: compact_movement_snapshot(before),
				movement_after: compact_movement_snapshot(after)
			}
		}
	}

	function analyze_candidate(source, role, normalized, apply_action, get_view) {
		let result = {
			index: normalized.index,
			kind: normalized.kind,
			label: normalized.label,
			sequence: normalized.sequence,
			valid: false,
			movement_relevant: false,
			error: null,
			steps: [],
			final: null
		}
		if (normalized.normalization_error) {
			result.error = { type: "invalid_candidate", message: normalized.normalization_error }
			return result
		}

		let game = clone_game(source)
		let acting_role = short_faction(role || game.active)
		result.movement_relevant = MOVEMENT_STATES.has(game.state) || !!game.move
		for (let index = 0; index < normalized.sequence.length; index++) {
			let action = normalized.sequence[index]
			acting_role = short_faction(game.active || acting_role)
			let view = get_view(game, acting_role)
			if (!is_legal_action(view, action)) {
				result.error = {
					type: "illegal_action",
					step: index,
					action,
					state: game.state || "",
					active: acting_role
				}
				result.final = compact_movement_snapshot(movement_snapshot(game, acting_role, view))
				return result
			}
			try {
				let step = analyze_step(game, action, acting_role, view, apply_action, get_view, index)
				game = step.game
				result.steps.push(step.record)
				if (
					MOVEMENT_STATES.has(step.record.state_before) ||
					MOVEMENT_STATES.has(step.record.state_after) ||
					step.record.movement_before ||
					step.record.movement_after
				) {
					result.movement_relevant = true
				}
			} catch (error) {
				result.error = {
					type: "action_error",
					step: index,
					action,
					message: error && error.message ? error.message : String(error)
				}
				return result
			}
		}

		let final_role = short_faction(game.active || acting_role)
		let final_view = get_view(game, final_role)
		result.valid = true
		result.final = compact_movement_snapshot(movement_snapshot(game, final_role, final_view))
		result.final_state = game.state || ""
		result.final_active = final_role
		result.total_step_cost = result.steps.reduce((sum, step) => sum + step.actual_step_cost, 0)
		result.finalized_pieces = Array.from(new Set(result.steps.flatMap((step) => step.finalized_pieces)))
		if (normalized.probe_supply_cut) {
			let metrics = {}
			let protected_faction = result.finalized_pieces.length > 0
				? Engine.game_utils.get_piece_effective_faction(game, result.finalized_pieces[0]) || acting_role
				: acting_role
			let threat = result.finalized_pieces.length > 0
				? find_standard_one_step_supply_cut_reply(
					game,
					result.finalized_pieces,
					protected_faction,
					metrics
				)
				: null
			result.supply_cut_probe = {
				safe: !threat,
				protected_pieces: result.finalized_pieces,
				metrics
			}
			result.supply_cut_threat = threat
		}
		return result
	}

	function movement_analysis(game, role, candidates = null, apply_action = null, get_view = null) {
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		let acting_role = short_faction(role || game.active)
		let source = clone_game(game)
		let source_view = get_view(source, acting_role)
		let requested = candidates === null
			? flatten_legal_actions(source_view).map((action) => action)
			: candidates
		let normalized = (requested || []).map(normalize_candidate)
		let records = normalized.map((candidate) =>
			analyze_candidate(source, acting_role, candidate, apply_action, get_view)
		)
		return {
			schema: "pug-ai.movement_analysis.v1",
			state: source.state || "",
			active: short_faction(source.active),
			role: acting_role,
			movement: movement_snapshot(source, acting_role, source_view),
			candidate_count: records.length,
			valid_count: records.filter((record) => record.valid).length,
			candidates: records
		}
	}

	return {
		movement_analysis
	}
}
