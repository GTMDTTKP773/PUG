"use strict"

/**
 * Read-only tactical analysis helpers for external AI clients.
 *
 * This module deliberately does not participate in normal game flow. It
 * models a bounded standard Movement reply on cloned data so callers can
 * reject destinations exposed to an immediate regular-unit supply cut.
 */
module.exports = function create_supply_probe_analysis(Engine) {
	const { data } = Engine
	const SUPPLY_PROBE_DESTINATION_STATES = new Set(["choose_pieces_to_move", "move_stack", "sr_move"])

	function add_metric(metrics, name, amount = 1) {
		if (metrics) metrics[name] = (metrics[name] || 0) + amount
	}

	function create_supply_cache(game) {
		return {
			supply_trace_cache: new Map(),
			supply_context:
				typeof Engine.map.create_supply_context === "function" ? Engine.map.create_supply_context(game) : null,
			source_cache: new Map(),
			status_cache: new Map()
		}
	}

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function get_action_protected_pieces(game, action_name, action_arg) {
		if (!SUPPLY_PROBE_DESTINATION_STATES.has(game.state)) return []
		if (game.state === "sr_move") {
			if (action_name !== "space") return []
			return game.sr_piece === null || game.sr_piece === undefined ? [] : [game.sr_piece]
		}
		if (game.state === "choose_pieces_to_move" && action_name !== "space") return []
		if (game.state === "move_stack" && action_name === "piece") return [action_arg]
		if (game.state === "move_stack" && action_name !== "space" && action_name !== "stop") return []
		return game.move && Array.isArray(game.move.pieces) ? game.move.pieces.slice() : []
	}

	function get_finalized_protected_pieces(candidate, protected_pieces, source_state) {
		if (source_state === "sr_move") return protected_pieces
		let continuing = new Set(candidate.move && Array.isArray(candidate.move.pieces) ? candidate.move.pieces : [])
		return protected_pieces.filter((p) => !continuing.has(p))
	}

	function is_on_map(game, p) {
		let s = game.pieces[p]
		return s > 0 && !!data.spaces[s]
	}

	function get_supply_status(game, p, cache = null) {
		let faction = Engine.game_utils.get_piece_effective_faction(game, p)
		return Engine.map.get_supply_status(
			game,
			game.pieces[p],
			faction,
			p,
			false,
			cache?.supply_trace_cache,
			cache?.supply_context,
			cache?.source_cache,
			cache?.status_cache
		)
	}

	function get_current_supply_status(game, p, cache = null) {
		if (
			game.supply_dirty === false &&
			Array.isArray(game.supply_status) &&
			game.supply_status.length === game.pieces.length &&
			typeof game.supply_status[p] === "string"
		) {
			return game.supply_status[p]
		}
		return get_supply_status(game, p, cache)
	}

	function get_oos_pieces(game, pieces, cache = null, use_current_supply = false) {
		return pieces.filter(
			(p) =>
				is_on_map(game, p) &&
				(use_current_supply ? get_current_supply_status(game, p, cache) : get_supply_status(game, p, cache)) ===
					"OOS"
		)
	}

	function can_reply_piece(game, p, faction, cache = null) {
		if (!is_on_map(game, p)) return false
		if (Engine.game_utils.get_piece_effective_faction(game, p) !== faction) return false
		if (!Engine.game_utils.can_piece_be_activated(p)) return false
		if (!Engine.game_utils.is_regular(p)) return false
		if (Engine.map.get_piece_mf(p) <= 0) return false
		return get_current_supply_status(game, p, cache) !== "OOS"
	}

	function can_reply_target_change_supply(game, target, faction) {
		if (faction === "cp" && Engine.map.is_beachhead_space(game, target)) return true
		if (!Engine.map.is_controlled_by(game, target, Engine.map.other_faction(faction))) return false
		if (Engine.map.has_undestroyed_fort(game, target, Engine.map.other_faction(faction))) return false
		if (data.spaces[target]?.region && Engine.map.contains_enemy_pieces(game, target, faction)) return false
		return Engine.can_set_control(game, target, faction)
	}

	function sync_siege_status(game, space, faction) {
		if (!(space > 0)) return
		let fort_owner = Engine.map.other_faction(faction)
		if (!Engine.map.has_undestroyed_fort(game, space, fort_owner)) {
			if (game.forts && Array.isArray(game.forts.besieged)) {
				Engine.utils.set_delete(game.forts.besieged, space)
			}
			return
		}
		if (!game.forts) game.forts = { destroyed: [], besieged: [] }
		if (!Array.isArray(game.forts.besieged)) game.forts.besieged = []
		let besiegers = Engine.map.get_besieging_pieces(game, space, fort_owner)
		if (Engine.map.can_besiege(game, space, besiegers)) {
			Engine.utils.set_add(game.forts.besieged, space)
		} else {
			Engine.utils.set_delete(game.forts.besieged, space)
		}
	}

	function create_reply_game(game, p, faction) {
		let from = game.pieces[p]
		return {
			...game,
			pieces: game.pieces.slice(),
			control: Array.isArray(game.control) ? game.control.slice() : { ...(game.control || {}) },
			region_disruption: Array.isArray(game.region_disruption) ? game.region_disruption.slice() : [],
			forts: {
				...(game.forts || {}),
				besieged: Array.isArray(game.forts?.besieged) ? game.forts.besieged.slice() : []
			},
			beachheads: Array.isArray(game.beachheads) ? game.beachheads.slice() : [],
			moved: [],
			move: {
				initial: from,
				current: from,
				spaces_moved: 0,
				pieces: [p],
				touched_spaces: [from],
				faction
			}
		}
	}

	function apply_reply_step(game, p, target, faction) {
		let from = game.pieces[p]
		let cost = Engine.map.get_movement_cost(game, p, target)
		cost += Engine.map.get_enemy_fort_entry_extra_cost(game, target, faction)

		game.pieces[p] = target
		game.move.current = target
		game.move.spaces_moved += cost

		if (from > 0) {
			Engine.sync_region_control(game, from)
			sync_siege_status(game, from, faction)
		}

		let enemy_holds_contested_region =
			!!data.spaces[target]?.region && Engine.map.contains_enemy_pieces(game, target, faction)
		let captures_control =
			Engine.game_utils.is_regular(p) &&
			!Engine.map.has_undestroyed_fort(game, target, Engine.map.other_faction(faction)) &&
			!Engine.map.is_controlled_by(game, target, faction) &&
			!enemy_holds_contested_region &&
			Engine.can_set_control(game, target, faction)
		if (captures_control) game.control[target] = faction
		if (faction === "cp" && Engine.map.is_beachhead_space(game, target)) {
			Engine.utils.set_delete(game.beachheads, target)
		}

		Engine.sync_region_control(game, target)
		sync_siege_status(game, target, faction)
	}

	function find_standard_one_step_supply_cut_reply(game, protected_pieces, protected_faction, metrics = null) {
		add_metric(metrics, "reply_scans")
		let candidate_cache = create_supply_cache(game)
		let baseline_oos = get_oos_pieces(game, protected_pieces, candidate_cache, true)
		if (baseline_oos.length > 0) {
			return { reason: "candidate_oos", oos_pieces: baseline_oos }
		}

		let reply_faction = Engine.map.other_faction(protected_faction)
		for (let p = 0; p < game.pieces.length; p++) {
			add_metric(metrics, "reply_pieces_checked")
			if (!can_reply_piece(game, p, reply_faction, candidate_cache)) continue
			add_metric(metrics, "reply_pieces_eligible")
			let from = game.pieces[p]
			let base = create_reply_game(game, p, reply_faction)
			let destinations = Engine.map.get_piece_connected_spaces_for_rule(base, from, p, "move")
			for (let target of destinations) {
				add_metric(metrics, "reply_destinations_checked")
				if (!can_reply_target_change_supply(base, target, reply_faction)) continue
				add_metric(metrics, "reply_destinations_control_relevant")
				let reply = create_reply_game(game, p, reply_faction)
				if (!Engine.map.can_piece_move_to(reply, p, target, reply_faction)) continue
				if (!Engine.map.can_stack_end_in_space(reply, target, [p])) continue
				apply_reply_step(reply, p, target, reply_faction)
				add_metric(metrics, "reply_destinations_simulated")
				let reply_cache = create_supply_cache(reply)
				let oos_pieces = get_oos_pieces(reply, protected_pieces, reply_cache)
				if (oos_pieces.length > 0) {
					return {
						reason: "reply_cut",
						reply: { piece: p, from, to: target },
						oos_pieces
					}
				}
			}
		}
		return null
	}

	function probe_standard_supply_cut_actions(game, role, actions, apply_action) {
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		let unsafe = []
		let safe = []
		let metrics = {}

		for (let action of actions || []) {
			add_metric(metrics, "actions")
			let [action_name, action_arg] = action
			let source_state = game.state
			let protected_pieces = get_action_protected_pieces(game, action_name, action_arg)
			if (protected_pieces.length === 0) {
				safe.push({ action })
				continue
			}

			let candidate = clone_game(game)
			let protected_faction =
				Engine.game_utils.get_piece_effective_faction(candidate, protected_pieces[0]) || role
			candidate = apply_action(candidate, role || candidate.active, action_name, action_arg)
			protected_pieces = get_finalized_protected_pieces(candidate, protected_pieces, source_state)
			if (protected_pieces.length === 0) {
				safe.push({ action })
				continue
			}

			let threat = find_standard_one_step_supply_cut_reply(
				candidate,
				protected_pieces,
				protected_faction,
				metrics
			)
			let result = { action, protected_pieces }
			if (threat) {
				unsafe.push({ ...result, ...threat })
			} else {
				safe.push(result)
			}
		}

		return { unsafe, safe, metrics }
	}

	return {
		find_standard_one_step_supply_cut_reply,
		probe_standard_supply_cut_actions
	}
}
