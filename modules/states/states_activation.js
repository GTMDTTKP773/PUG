"use strict"

let game
let activation_supply_cache = null

exports.set_globals = function (g) {
	game = g
}

exports.register = function (states, Engine, context) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const { set_has, set_add, set_delete, set_toggle, map_set, map_get, map_delete } = Engine.utils
	const DEBUG_ACTIVATION_TRACE = !!(
		typeof process !== "undefined" &&
		process &&
		process.env &&
		(process.env.PUG_DEBUG_ACTIVATION === "1" || process.env.PUG_DEBUG_ACTIVATION === "true")
	)

	const {
		log,
		logi,
		log_br,
		push_undo,
		clear_undo,
		active_faction,
		get_activation_cost,
		get_activation_cost_pair,
		get_pieces_in_space,
		can_activate_piece_in_space_to_attack,
		space_name,
		refresh_attack_eligibility,
		is_scu,
		is_lcu,
		is_tribe,
		is_hq,
		is_rail_connected_to_supply,
		get_piece_mf,
		get_connected_spaces,
		can_stack_move_to,
		can_move_stack_composition,
		prune_exhausted_move_stack,
		get_lcu_reserve_box,
		get_scu_reserve_box,
		get_eliminated_box,
		get_permanently_eliminated_box,
		is_not_on_map,
		goto_end_event,
		piece_name,
		piece_list,
		get_movement_cost,
		get_enemy_fort_entry_extra_cost,
		has_undestroyed_fort,
		other_faction,
		can_besiege,
		can_piece_move_to,
		get_piece_move_block_reason,
		get_move_end_space_block_reason,
		get_stack_end_block_reason,
		is_gallipoli,
		check_immediate_jihad_rebellion_on_entry,
		update_jihad_level,
		is_controlled_by,
		set_control,
		roll_die,
		place_trench,
		is_enemy_trench,
		enter_trench
	} = context

	function resolve_cp_enter_empty_beachhead_by_movement(from_space, target, pieces_moving, faction = active_faction()) {
		if (faction !== CP) return false
		if (!Engine.map.is_beachhead_space(game, target)) return false
		let has_ap_units = get_pieces_in_space(game, target).some(
			(p) => Engine.game_utils.get_piece_effective_faction(game, p) === AP
		)
		if (has_ap_units) return false

		Engine.map.clear_beachhead(game, target)
		if (Engine.map.is_non_balkan_beachhead(target)) {
			update_jihad_level(game, 1)
			log(`空滩头被同盟国占领并摧毁：${space_name(target)}，圣战等级 +1。`)
		} else {
			log(`空滩头被同盟国占领并摧毁：${space_name(target)}。`)
		}

		for (let p of pieces_moving) {
			game.pieces[p] = from_space
			set_add(game.moved, p)
		}

		game.move.current = from_space
		game.move.pieces = []
		game.move.touched_spaces = [game.move.initial, from_space]
		end_move_stack()
		return true
	}

	function should_stop_move_on_island_base(from_space, target) {
		if (!Engine.map.is_island_base(game, target)) return false
		return !Engine.map.is_island_base(game, from_space)
	}

	function get_safe_beachhead_withdrawal_context(from_space, target, faction) {
		if (faction !== AP) return null
		if (!Engine.map.is_beachhead_space(game, from_space)) return null
		if (!Engine.map.is_non_balkan_beachhead(from_space)) return null
		if (Engine.map.get_adjacent_island_base_for_beachhead(from_space) !== target) return null
		let departure_units = Engine.map.get_ap_units_supplied_solely_through_source(game, from_space)
		if (departure_units.length === 0) return null
		return { beachhead: from_space }
	}

	function apply_safe_beachhead_withdrawal_jihad(withdrawal) {
		if (!withdrawal) return
		let remaining = Engine.map.get_ap_units_supplied_solely_through_source(game, withdrawal.beachhead)
		if (remaining.length > 0) return
		update_jihad_level(game, 1)
		log(`${space_name(withdrawal.beachhead)} 最后一支仅经该非巴尔干滩头补给的 AP 单位撤回岛屿基地：Jihad +1。`)
	}

	function should_create_beachhead_on_entry(from_space, target, faction = active_faction()) {
		return Engine.map.can_ap_initiate_invasion_to_beachhead(game, from_space, target, faction)
	}

	function activation_now() {
		return Date.now()
	}

	function log_activation_debug(...args) {
		if (DEBUG_ACTIVATION_TRACE) {
			console.log(...args)
		}
	}

	function log_activation_group(title, spaces) {
		if (!Array.isArray(spaces) || spaces.length === 0) return
		log(title)
		for (let s of spaces) {
			let cost = map_get(game.activation_cost, s, 1)
			logi(space_name(s) + (cost > 1 ? ` (${cost} OPS)` : ""))
		}
	}

	function log_region_activation_group(title, mode) {
		let entries = get_region_activation_entries(mode)
		if (entries.length === 0) return
		log(title)
		for (let { space, stacks } of entries) {
			for (let stack of stacks) {
				let cost = Number(stack.cost) || 0
				logi(`${space_name(space)}: ${piece_list(stack.pieces)}${cost > 1 ? ` (${cost} OPS)` : ""}`)
			}
		}
	}

	function log_activation_summary() {
		let move_spaces = Array.isArray(game.activated.move) ? game.activated.move : []
		let attack_spaces = Array.isArray(game.activated.attack) ? game.activated.attack : []
		let attack_egypt_spaces = Array.isArray(game.activated.attack_egypt) ? game.activated.attack_egypt : []

		log_activation_group("MOVE", move_spaces)
		log_activation_group("ATTACK", attack_spaces)
		if (attack_egypt_spaces.length > 0) log_activation_group("ATTACK (埃及限定)", attack_egypt_spaces)
		log_region_activation_group("MOVE", "move")
		log_region_activation_group("ATTACK", "attack")
	}

	function can_temporarily_end_current_move_in_overstacked_space(space_id, stopping_pieces = null, faction = active_faction()) {
		let pieces = stopping_pieces ?? game.move?.pieces
		if (!Array.isArray(pieces) || pieces.length === 0) return false
		// 当前地块虽然超堆叠，但后续仍可继续移动已激活友军。
		return Engine.map.can_temporarily_end_move_in_space(game, space_id, faction, pieces, {
			stopping_pieces_already_in_space: true,
			excluded_future_movers: pieces
		})
	}

	function get_current_move_end_block_reason(space_id, stopping_pieces = null, faction = active_faction()) {
		let reason = get_move_end_space_block_reason(game, space_id, faction)
		if (reason === "堆叠超限" && can_temporarily_end_current_move_in_overstacked_space(space_id, stopping_pieces, faction)) {
			return null
		}
		return reason
	}

	function get_move_piece_drop_block_reason(p) {
		let continuing_pieces = game.move.pieces.filter((q) => q !== p)
		return get_stack_end_block_reason(game, game.move.current, [p], { ignore_existing_pieces: continuing_pieces })
	}

	function get_unresolved_move_activation_violations() {
		let violations = []
		for (let s of game.activated.move || []) {
			let reason = get_move_end_space_block_reason(game, s, active_faction())
			if (reason) violations.push({ space: s, reason })
		}
		return violations
	}

	// === ACTIVATION HELPER ===
	function get_activation_supply_cache() {
		let revision = Number(game.cache_revision) || 0
		if (
			!activation_supply_cache ||
			activation_supply_cache.game !== game ||
			activation_supply_cache.revision !== revision
		) {
			activation_supply_cache = {
				game,
				revision,
				supply_trace_cache: new Map(),
				supply_context:
					typeof Engine.map.create_supply_context === "function"
						? Engine.map.create_supply_context(game)
						: null,
				source_cache: new Map(),
				status_cache: new Map()
			}
		}
		return activation_supply_cache
	}

	function get_piece_activation_supply_status(p, faction) {
		let s = game.pieces[p]
		if (!(s > 0 && data.spaces[s])) return "OOS"
		let cache = get_activation_supply_cache()
		return Engine.supply.get_supply_status(
			game,
			s,
			faction,
			p,
			false,
			cache.supply_trace_cache,
			cache.supply_context,
			cache.source_cache,
			cache.status_cache
		)
	}

	function has_unmoved_move_eligible_pieces_in_space(s, faction) {
		return get_pieces_in_space(game, s).some((p) => !set_has(game.moved, p) && can_piece_move_in_activation(p, faction))
	}

	function has_unmoved_allowed_move_pieces_in_space(s, allowed_pieces, faction) {
		if (!Array.isArray(allowed_pieces) || allowed_pieces.length === 0) return false
		return allowed_pieces.some(
			(p) =>
				game.pieces[p] === s &&
				!set_has(game.moved, p) &&
				!is_pending_combine_piece(p) &&
				can_piece_move_in_activation(p, faction)
		)
	}

	function get_pending_combine_entries(faction = active_faction()) {
		if (!Array.isArray(game.pending_combine)) return []
		return game.pending_combine.filter((entry) => {
			if (!entry || !Array.isArray(entry.pieces) || entry.pieces.length === 0) return false
			if (entry.faction && entry.faction !== faction) return false
			return entry.pieces.some((p) => game.pieces[p] === entry.space)
		})
	}

	function is_pending_combine_piece(p) {
		if (!Array.isArray(game.pending_combine)) return false
		return game.pending_combine.some((entry) => entry && Array.isArray(entry.pieces) && set_has(entry.pieces, p))
	}

	function get_non_pending_combine_scus_in_space(s) {
		return get_pieces_in_space(game, s).filter((p) => is_scu(p) && !is_pending_combine_piece(p))
	}

	function can_space_combine_in_activation(s, faction = active_faction()) {
		let allowed_scus = get_non_pending_combine_scus_in_space(s)
		return Engine.game_utils.can_combine_in_space(game, s, faction, null, allowed_scus)
	}

	function has_move_activation_options_in_space(s, faction) {
		if (has_unmoved_move_eligible_pieces_in_space(s, faction)) return true
		if (can_space_combine_in_activation(s, faction)) return true
		if (can_space_remove_uprising_marker_in_activation(s, faction)) return true
		return can_space_entrench_in_activation(s, faction)
	}

	function can_piece_participate_in_activation(p, faction) {
		if (p < 0 || !data.pieces[p]) return false
		if (is_not_on_map(game, p)) return false
		if (is_pending_combine_piece(p)) return false
		if (Engine.game_utils.get_piece_effective_faction(game, p) !== faction) return false
		if (get_piece_activation_supply_status(p, faction) === "OOS") return false
		if (Engine.neutral.is_greek_piece(p)) {
			return (
				Engine.neutral.can_move_piece_for_faction(game, p, faction) ||
				Engine.neutral.can_attack_piece_for_faction(game, p, faction)
			)
		}
		return true
	}

	function can_piece_move_in_activation(p, faction) {
		if (!can_piece_participate_in_activation(p, faction)) return false
		if (Engine.neutral.is_greek_piece(p) && !Engine.neutral.can_move_piece_for_faction(game, p, faction)) return false
		return get_piece_mf(p) > 0
	}

	function get_current_move_faction() {
		return (game.move && game.move.faction) || active_faction()
	}

	function with_active_faction(faction, fn) {
		if (!faction || active_faction() === faction) return fn()
		let original_active = game.active
		game.active = faction
		try {
			return fn()
		} finally {
			game.active = original_active
		}
	}

	function is_british_no_attack_unpaid_for(faction) {
		if (Engine.mo && typeof Engine.mo.is_british_no_attack_unpaid === "function") {
			return Engine.mo.is_british_no_attack_unpaid(game, faction)
		}
		return faction === AP && game.mo_ap === "british_no_attack" && !game.br_attack_penalty_paid
	}

	function is_attack_support_piece(p) {
		return is_hq(p) || Engine.game_utils.is_heavy_arty(p)
	}

	function has_attack_support_companion_in_activation(p, s, faction) {
		return get_pieces_in_space(game, s).some(
			(q) =>
				q !== p &&
				!set_has(game.moved, q) &&
				Engine.game_utils.is_combat_unit(q) &&
				can_piece_attack_in_activation(q, s, faction)
		)
	}

	function can_piece_attack_in_activation(p, s, faction) {
		if (!can_piece_participate_in_activation(p, faction)) return false
		let is_support = is_attack_support_piece(p)
		if (is_support && !has_attack_support_companion_in_activation(p, s, faction)) return false
		if (Engine.map.is_limited_supply_status(get_piece_activation_supply_status(p, faction))) return false
		if (Engine.neutral.is_greek_piece(p) && !Engine.neutral.can_attack_piece_for_faction(game, p, faction)) return false
		// MO_BRITISH_NO_ATTACK: BR units cannot attack unless penalty has been paid
		if (is_british_no_attack_unpaid_for(faction)) {
			let nations = Engine.game_utils.get_piece_nations_for_rule(game, p, "activation")
			if (nations.some((n) => n === "br")) return false
		}
		if (is_support) {
			return Engine.combat.can_activate_piece_in_space_to_attack(
				game,
				p,
				s,
				faction,
				() => Engine.game_utils.get_season(game),
				is_rail_connected_to_supply
			)
		}
		return can_activate_piece_in_space_to_attack(p, s)
	}

	function can_space_entrench_in_activation(s, faction = active_faction()) {
		if (!Engine.game_utils.can_entrench_in_space(game, s, faction)) return false
		if (game.entrench_attempts && set_has(game.entrench_attempts, s)) return false
		return Engine.game_utils.get_entrenching_units_in_space(game, s, faction).some((p) =>
			can_piece_participate_in_activation(p, faction)
		)
	}

	function get_pending_entrench_pieces(faction = active_faction()) {
		if (!Array.isArray(game.entrenching)) return []
		return game.entrenching.filter((p) => {
			if (!(game.pieces[p] > 0)) return false
			return Engine.game_utils.get_piece_effective_faction(game, p) === faction
		})
	}

	function get_pending_entrench_pieces_in_space(s, faction = active_faction()) {
		return get_pending_entrench_pieces(faction).filter((p) => game.pieces[p] === s)
	}

	function get_pending_entrench_spaces(faction = active_faction()) {
		let spaces = []
		for (let p of get_pending_entrench_pieces(faction)) {
			set_add(spaces, game.pieces[p])
		}
		return spaces
	}

	function get_entrench_roll_faction() {
		return game.entrench_roll_faction || active_faction()
	}

	function mark_entrench_attempt(s, pieces) {
		if (!Array.isArray(pieces) || pieces.length === 0) return false
		if (!game.entrench_attempts) game.entrench_attempts = []
		if (!game.entrenching) game.entrenching = []

		set_add(game.entrench_attempts, s)
		for (let p of pieces) {
			if (!set_has(game.entrenching, p)) log(`>${piece_name(p)} 掘壕`)
			set_add(game.moved, p)
			set_add(game.entrenching, p)
		}
		return true
	}

	function same_piece_set(a, b) {
		if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
		return a.every((p) => set_has(b, p))
	}

	function mark_pending_combine(s, pieces, faction = active_faction()) {
		if (!Array.isArray(pieces) || pieces.length < 2 || pieces.length > 3) return false
		if (!can_selected_move_pieces_combine(pieces)) return false
		if (!game.pending_combine) game.pending_combine = []
		for (let p of pieces) {
			if (is_pending_combine_piece(p)) return false
		}
		game.pending_combine.push({
			space: s,
			pieces: pieces.slice(),
			faction
		})
		log(`>${piece_list(pieces)} 待组合`)
		return true
	}

	function remove_pending_combine(space, pieces, faction = active_faction()) {
		if (!Array.isArray(game.pending_combine)) return
		let index = game.pending_combine.findIndex(
			(entry) =>
				entry &&
				entry.space === space &&
				(!entry.faction || entry.faction === faction) &&
				same_piece_set(entry.pieces, pieces)
		)
		if (index >= 0) game.pending_combine.splice(index, 1)
		if (game.pending_combine.length === 0) delete game.pending_combine
	}

	function resolve_pending_entrench_attempt(s, faction = active_faction()) {
		let selected = get_pending_entrench_pieces_in_space(s, faction)
		if (selected.length === 0) return false

		let roll = roll_die()

		// Rule 15.4.2:
		// If an LCU participates, the attempt succeeds on 1-3.
		// With only SCUs, the attempt succeeds on a roll no higher than the number of regular SCUs, max 3.
		let has_lcu_val = selected.some((p) => is_lcu(p))
		let regular_scu_count = selected.filter(
			(p) => is_scu(p) && !is_tribe(p) && !Engine.game_utils.is_irregular(p)
		).length

		let target = has_lcu_val ? 3 : Math.min(3, regular_scu_count)
		let success = roll >= 1 && roll <= target

		log(`掘壕尝试：${space_name(s)}`)
		log(`> ${roll} <= ${target} -> ${success ? "成功" : "失败"}`)
		if (success) {
			place_trench(game, s, faction)
		}

		for (let p of selected) {
			set_delete(game.entrenching, p)
		}
		return true
	}

	function goto_attack_after_movement(faction = active_faction()) {
		game.where = -1
		delete game.entrench_roll_faction
		set_next_state("attack")
		with_active_faction(faction, () => {
			refresh_attack_eligibility()
			if (game.eligible_attackers.length === 0) set_next_state("end_operations")
		})
	}

	function skip_pending_combination(ctx = game.combine_ctx) {
		if (!ctx || !ctx.pending_resolution) return false
		for (let p of ctx.selected_scus || []) {
			if (game.pieces[p] === ctx.pending_space) set_add(game.moved, p)
		}
		remove_pending_combine(ctx.pending_space, ctx.selected_scus || [], ctx.pending_resolution_faction)
		clear_combine_ctx()
		goto_entrench_rolls_or_attack(ctx.pending_resolution_faction)
		return true
	}

	function begin_next_pending_combination(faction = active_faction()) {
		let entries = get_pending_combine_entries(faction)
		if (entries.length === 0) return false

		let entry = entries[0]
		let selected = entry.pieces.filter((p) => game.pieces[p] === entry.space)
		if (selected.length < 2) {
			remove_pending_combine(entry.space, entry.pieces, faction)
			return begin_next_pending_combination(faction)
		}

		game.where = entry.space
		game.combine_ctx = {
			selected_scus: selected.slice(),
			allowed_scus: selected.slice(),
			pending_resolution: true,
			pending_space: entry.space,
			pending_resolution_faction: faction
		}

		let valid_lcus = get_valid_lcus_for_selected_scus(selected)
		if (valid_lcus.length === 0) {
			log(`待组合无可用 LCU：${piece_list(selected)} (${space_name(entry.space)})`)
			skip_pending_combination(game.combine_ctx)
			return true
		}

		set_next_state("combine_lcu_select_lcu")
		return true
	}

	function goto_entrench_rolls_or_attack(faction = active_faction()) {
		if (begin_next_pending_combination(faction)) return
		if (get_pending_entrench_spaces(faction).length > 0) {
			game.entrench_roll_faction = faction
			set_next_state("entrench_roll")
			return
		}
		goto_attack_after_movement(faction)
	}

	const UPRISING_MARKER_RULES = [
		{ key: "persian_uprising_markers", enemies: [AP], label: "Persian Uprising" },
		{ key: "armenian_uprising_markers", enemies: [CP], label: "Armenian Uprising" },
		{ key: "soviet_uprising_markers", enemies: [AP, CP], label: "Soviet Uprising" }
	]

	function get_enemy_uprising_marker_rule(s, faction = active_faction()) {
		for (let rule of UPRISING_MARKER_RULES) {
			if (!rule.enemies.includes(faction)) continue
			let markers = game[rule.key]
			if (Array.isArray(markers) && markers.includes(s)) return rule
		}
		return null
	}

	function get_uprising_marker_removal_units(s, faction = active_faction()) {
		if (!get_enemy_uprising_marker_rule(s, faction)) return []
		return get_pieces_in_space(game, s).filter((p) => {
			if (set_has(game.moved, p) || set_has(game.attacked, p)) return false
			if (!Engine.game_utils.can_piece_be_activated(p)) return false
			return can_piece_participate_in_activation(p, faction)
		})
	}

	function can_space_remove_uprising_marker_in_activation(s, faction = active_faction()) {
		return get_uprising_marker_removal_units(s, faction).length > 0
	}

	function can_selected_move_pieces_remove_uprising_marker() {
		if (!game.move || !Array.isArray(game.move.pieces) || game.move.pieces.length !== 1) return false
		let s = game.move.initial
		return get_uprising_marker_removal_units(s).includes(game.move.pieces[0])
	}

	function remove_enemy_uprising_marker(s, faction = active_faction()) {
		let rule = get_enemy_uprising_marker_rule(s, faction)
		if (!rule) return null
		game[rule.key] = game[rule.key].filter((marker_space) => marker_space !== s)
		return rule
	}

	function finish_uprising_marker_removal(p, rule, s) {
		if (!Array.isArray(game.moved)) game.moved = []
		set_add(game.moved, p)
		delete game.attack_eligibility_cache
		log(`${piece_name(p)} removes ${rule.label} marker in ${space_name(s)}.`)

		let initial = game.move.initial
		let move_faction = get_current_move_faction()
		let allowed_activation_pieces = Array.isArray(game.move.allowed_activation_pieces)
			? game.move.allowed_activation_pieces.slice()
			: null
		delete game.move
		game.where = initial
		let has_remaining_pieces = allowed_activation_pieces
			? has_unmoved_allowed_move_pieces_in_space(initial, allowed_activation_pieces, move_faction)
			: has_unmoved_move_eligible_pieces_in_space(initial, move_faction)
		if (has_remaining_pieces) {
			game.move = {
				initial,
				current: initial,
				spaces_moved: 0,
				pieces: [],
				touched_spaces: [initial],
				faction: move_faction,
				allowed_activation_pieces
			}
			game.state = "choose_pieces_to_move"
		} else {
			game.state = "choose_move_space"
		}
	}

	function ensure_region_activations() {
		if (!game.region_activations) game.region_activations = {}
		if (!game.region_activations.move) game.region_activations.move = {}
		if (!game.region_activations.attack) game.region_activations.attack = {}
		return game.region_activations
	}

	function get_region_activation_mode_map(mode) {
		return ensure_region_activations()[mode]
	}

	function get_region_activation_stacks(mode, s) {
		let mode_map = get_region_activation_mode_map(mode)
		return Array.isArray(mode_map[s]) ? mode_map[s] : []
	}

	function set_region_activation_stacks(mode, s, stacks) {
		let mode_map = get_region_activation_mode_map(mode)
		if (Array.isArray(stacks) && stacks.length > 0) mode_map[s] = stacks
		else delete mode_map[s]
	}

	function get_region_activation_entries(mode) {
		let entries = []
		let mode_map = get_region_activation_mode_map(mode)
		for (let key of Object.keys(mode_map)) {
			let stacks = mode_map[key]
			if (!Array.isArray(stacks) || stacks.length === 0) continue
			entries.push({ space: Number(key), stacks })
		}
		return entries
	}

	function has_region_activations(mode) {
		return get_region_activation_entries(mode).length > 0
	}

	function has_any_move_activations() {
		return (game.activated.move && game.activated.move.length > 0) || has_region_activations("move")
	}

	function get_region_activation_stack_for_piece(mode, p) {
		for (let { space, stacks } of get_region_activation_entries(mode)) {
			for (let index = 0; index < stacks.length; index++) {
				let stack = stacks[index]
				if (Array.isArray(stack.pieces) && set_has(stack.pieces, p)) {
					return { space, index, stack }
				}
			}
		}
		return null
	}

	function is_piece_region_activated(p) {
		return !!get_region_activation_stack_for_piece("move", p) || !!get_region_activation_stack_for_piece("attack", p)
	}

	function get_region_activation_available_pieces(mode, s, faction) {
		if (!Engine.map.is_region(game, s)) return []
		return get_pieces_in_space(game, s).filter((p) => {
			if (is_piece_region_activated(p)) return false
			if (mode === "move") return !set_has(game.moved, p) && can_piece_move_in_activation(p, faction)
			return !set_has(game.moved, p) && can_piece_attack_in_activation(p, s, faction)
		})
	}

	function get_region_activation_cost(mode, s, pieces) {
		let costs = get_activation_cost_pair(game, s, pieces, get_activation_supply_cache())
		return mode === "move" ? costs.move : costs.attack
	}

	function get_region_activation_attack_targets(pieces) {
		return Engine.combat.get_legal_attackable_spaces(
			game,
			pieces,
			active_faction(),
			() => Engine.game_utils.get_season(game),
			is_rail_connected_to_supply
		)
	}

	function get_region_activation_block_reason(mode, s, pieces) {
		let composition_reason = Engine.map.get_region_activation_stack_block_reason(game, pieces)
		if (composition_reason) return composition_reason
		for (let p of pieces) {
			if (game.pieces[p] !== s) return "单位不在该大区"
			if (is_piece_region_activated(p)) return "单位已激活"
			if (mode === "move") {
				if (set_has(game.moved, p) || !can_piece_move_in_activation(p, active_faction())) return "单位不能移动"
			} else if (set_has(game.moved, p) || !can_piece_attack_in_activation(p, s, active_faction())) {
				return "单位不能进攻"
			}
		}
		let cost = get_region_activation_cost(mode, s, pieces)
		if (!Number.isFinite(cost)) return "OPS不足以激活该堆叠"
		if (cost > game.ops) return "行动点不足"
		if (mode === "attack" && get_region_activation_attack_targets(pieces).length === 0) return "没有共同攻击目标"
		return null
	}

	function has_region_activation_options_in_space(mode, s, faction) {
		if (game.ops <= 0) return false
		return get_region_activation_available_pieces(mode, s, faction).some((p) => {
			let cost = get_region_activation_cost(mode, s, [p])
			return Number.isFinite(cost) && cost <= game.ops
		})
	}

	function get_region_activation_total_cost_for_space(s) {
		let total = 0
		for (let mode of ["move", "attack"]) {
			for (let stack of get_region_activation_stacks(mode, s)) {
				total += Number(stack.cost) || 0
			}
		}
		return total
	}

	function update_region_activation_cost_for_space(s) {
		if (!game.activation_cost) game.activation_cost = {}
		let total = get_region_activation_total_cost_for_space(s)
		if (total > 0) map_set(game.activation_cost, s, total)
		else map_delete(game.activation_cost, s)
	}

	function next_region_activation_order() {
		let order = Number(game.region_activation_order) || 0
		order += 1
		game.region_activation_order = order
		return order
	}

	function get_region_activation_stack_order(stack, index) {
		let order = Number(stack && stack.order)
		if (Number.isFinite(order)) return order
		return index + 1
	}

	function ensure_region_activation_order_counter() {
		let max_order = Number(game.region_activation_order)
		if (!Number.isFinite(max_order)) max_order = 0
		for (let mode of ["move", "attack"]) {
			let mode_map = get_region_activation_mode_map(mode)
			for (let key of Object.keys(mode_map)) {
				let stacks = mode_map[key]
				if (!Array.isArray(stacks)) continue
				for (let index = 0; index < stacks.length; index++) {
					max_order = Math.max(max_order, get_region_activation_stack_order(stacks[index], index))
				}
			}
		}
		game.region_activation_order = max_order
		return max_order
	}

	function add_region_activation_stack(mode, s, pieces, cost) {
		ensure_region_activation_order_counter()
		let stacks = get_region_activation_stacks(mode, s).slice()
		stacks.push({
			pieces: pieces.slice().sort((a, b) => a - b),
			cost,
			order: next_region_activation_order()
		})
		set_region_activation_stacks(mode, s, stacks)
		update_region_activation_cost_for_space(s)
	}

	function refund_last_region_activation_for_space(s) {
		let latest = null
		for (let mode of ["move", "attack"]) {
			let stacks = get_region_activation_stacks(mode, s)
			for (let index = 0; index < stacks.length; index++) {
				let stack = stacks[index]
				let order = get_region_activation_stack_order(stack, index)
				if (!latest || order > latest.order) {
					latest = { mode, index, order }
				}
			}
		}
		if (!latest) return 0

		let stacks = get_region_activation_stacks(latest.mode, s).slice()
		let [removed] = stacks.splice(latest.index, 1)
		set_region_activation_stacks(latest.mode, s, stacks)
		update_region_activation_cost_for_space(s)

		let refund = Number(removed && removed.cost) || 0
		game.ops += refund
		return refund
	}

	function clear_region_activation_mode(mode) {
		let mode_map = get_region_activation_mode_map(mode)
		for (let key of Object.keys(mode_map)) {
			delete mode_map[key]
		}
	}

	function prune_region_move_activations(faction = active_faction()) {
		for (let { space, stacks } of get_region_activation_entries("move")) {
			let remaining = stacks.filter((stack) =>
				Array.isArray(stack.pieces) &&
				stack.pieces.some(
					(p) => game.pieces[p] === space && !set_has(game.moved, p) && can_piece_move_in_activation(p, faction)
				)
			)
			set_region_activation_stacks("move", space, remaining)
			update_region_activation_cost_for_space(space)
		}
	}

	function begin_region_activation_selection(mode, s) {
		game.region_activation_selection = {
			mode,
			space: s,
			pieces: []
		}
		game.state = "activate_region_stack"
	}

	function clear_region_activation_selection() {
		delete game.region_activation_selection
	}

	function can_selected_move_pieces_combine(selected_pieces) {
		if (!Array.isArray(selected_pieces) || selected_pieces.length < 2 || selected_pieces.length > 3) return false
		let space = game.move && game.move.initial > 0 ? game.move.initial : game.where
		if (!can_space_combine_in_activation(space, active_faction())) return false
		if (selected_pieces.some((p) => is_pending_combine_piece(p))) return false
		let available = get_available_combine_scus()
		if (!selected_pieces.every((p) => set_has(available, p))) return false
		return get_valid_lcus_for_selected_scus(selected_pieces).length > 0
	}

	function can_combine_in_activation_space(space = game.where) {
		let ctx = game.combine_ctx || {}
		return Engine.game_utils.can_combine_in_space(
			game,
			space,
			active_faction(),
			ctx.allowed_lcus || null,
			ctx.allowed_scus || null
		)
	}

	function attack_neighbors_include_enemy(neighbors, faction, enemy_space_flag = null) {
		let enemy = other_faction(faction)
		for (let n of neighbors) {
			if (enemy_space_flag) {
				if (enemy_space_flag[n] === 1) return true
			} else if (Engine.map.contains_enemy_pieces(game, n, faction)) {
				return true
			}
			if (has_undestroyed_fort(game, n, enemy)) return true
			if (
				Engine.neutral &&
				typeof Engine.neutral.should_trigger_greece_entry_on_attack === "function" &&
				Engine.neutral.should_trigger_greece_entry_on_attack(game, n, faction)
			)
				return true
		}
		return false
	}

	function space_has_adjacent_enemy(s, faction, enemy_space_flag = null, pieces = null) {
		if (!data.spaces[s]) return false
		if (Array.isArray(pieces) && pieces.length > 0) {
			for (let p of pieces) {
				let piece_neighbors = Engine.map.get_piece_connected_spaces_for_rule(game, s, p, "attack")
				if (attack_neighbors_include_enemy(piece_neighbors, faction, enemy_space_flag)) return true
			}
			return false
		}
		let attack_neighbors = get_connected_spaces(game, s, null, faction, undefined, "attack")
		return attack_neighbors_include_enemy(attack_neighbors, faction, enemy_space_flag)
	}

	function is_russo_british_russian_activation() {
		return Engine.event_states.is_russo_british_russian_activation(game)
	}

	function is_romania_event_activation() {
		return Engine.event_states.is_romania_event_activation(game)
	}

	function get_russo_british_legal_attack_spaces(pieces_by_space) {
		if (!pieces_by_space) {
			pieces_by_space = new Map()
			for (let p = 0; p < game.pieces.length; p++) {
				let s = game.pieces[p]
				if (s <= 0 || is_not_on_map(game, p)) continue
				let list = pieces_by_space.get(s)
				if (!list) {
					list = []
					pieces_by_space.set(s, list)
				}
				list.push(p)
			}
		}
		let legal = []
		for (let [s, pieces] of pieces_by_space) {
			let has_ru_can_attack = pieces.some(
				(p) => data.pieces[p].nation === "ru" && can_piece_attack_in_activation(p, s, AP)
			)
			if (has_ru_can_attack) {
				legal.push(s)
			}
		}
		return legal
	}

	function get_romania_event_legal_attack_spaces(pieces_by_space) {
		if (!pieces_by_space) {
			pieces_by_space = new Map()
			for (let p = 0; p < game.pieces.length; p++) {
				let s = game.pieces[p]
				if (s <= 0 || is_not_on_map(game, p)) continue
				let list = pieces_by_space.get(s)
				if (!list) {
					list = []
					pieces_by_space.set(s, list)
				}
				list.push(p)
			}
		}
		let legal = []
		for (let [s, pieces] of pieces_by_space) {
			let has_ro_can_attack = pieces.some(
				(p) => data.pieces[p].nation === "ro" && can_piece_attack_in_activation(p, s, AP)
			)
			if (has_ro_can_attack) {
				legal.push(s)
			}
		}
		return legal
	}

	states.activate_spaces = {
		prompt(res) {
			if (res && res._is_noop) return
			let perf_start = DEBUG_ACTIVATION_TRACE ? activation_now() : 0
			let perf_attack_checks = 0
			let perf_enemy_adjacency_checks = 0
			let perf_attack_ms = 0
			let perf_enemy_adjacency_ms = 0
			let event_prompt = Engine.event_states.get_activation_prompt(game)
			if (event_prompt) {
				res.prompt(event_prompt)
			} else {
				res.prompt(`选择激活的地块 (剩余行动点: ${game.ops})`)
			}

			let faction = active_faction()
			let russo_british_mode = is_russo_british_russian_activation()
			let romania_mode = is_romania_event_activation()
			let russo_british_selected = Array.isArray(game.activated?.attack) ? game.activated.attack.length : 0
			let romania_selected = Array.isArray(game.activated?.attack) ? game.activated.attack.length : 0
			let all_pieces_by_space = new Map()
			let pieces_by_space = new Map()
			let activated_move_set = new Set(game.activated.move || [])
			let activated_attack_set = new Set(game.activated.attack || [])
			let activated_attack_egypt_set = new Set(game.activated.attack_egypt || [])
			let activation_cost_cache = get_activation_supply_cache()
			let enemy = other_faction(faction)
			let enemy_space_flag = new Uint8Array(data.spaces.length)
			for (let p = 0; p < game.pieces.length; p++) {
				let s = game.pieces[p]
				if (s <= 0 || is_not_on_map(game, p)) continue
				let all_list = all_pieces_by_space.get(s)
				if (!all_list) {
					all_list = []
					all_pieces_by_space.set(s, all_list)
				}
				all_list.push(p)
				if (Engine.game_utils.get_piece_effective_faction(game, p) === enemy) {
					enemy_space_flag[s] = 1
				}
				if (!can_piece_participate_in_activation(p, faction)) continue
				let list = pieces_by_space.get(s)
				if (!list) {
					list = []
					pieces_by_space.set(s, list)
				}
				list.push(p)
			}
			let russo_british_legal_spaces = russo_british_mode ? get_russo_british_legal_attack_spaces(pieces_by_space) : []
			let russo_british_required_count = russo_british_mode ? Math.min(2, russo_british_legal_spaces.length) : 0
			let russo_british_legal_set = russo_british_mode ? new Set(russo_british_legal_spaces) : null
			let romania_legal_spaces = romania_mode ? get_romania_event_legal_attack_spaces(pieces_by_space) : []
			let romania_required_count = romania_mode ? Math.min(1, romania_legal_spaces.length) : 0
			let romania_legal_set = romania_mode ? new Set(romania_legal_spaces) : null

			for (let [s, friendly_pieces] of pieces_by_space) {
				let is_region_space = Engine.map.is_region(game, s)
				if (!is_region_space && (activated_move_set.has(s) || activated_attack_set.has(s) || activated_attack_egypt_set.has(s))) continue

				let costs = is_region_space
					? { move: 1, attack: 1 }
					: get_activation_cost_pair(game, s, all_pieces_by_space.get(s), activation_cost_cache)
				let move_cost = costs.move
				let attack_cost = costs.attack
				let unmoved_pieces = friendly_pieces.filter((p) => !set_has(game.moved, p))

				let can_move = is_region_space
					? has_region_activation_options_in_space("move", s, faction)
					: game.ops >= move_cost && has_move_activation_options_in_space(s, faction)
				let can_attack = false
				if (is_region_space) {
					can_attack = has_region_activation_options_in_space("attack", s, faction)
				} else if (game.ops >= attack_cost && unmoved_pieces.length > 0) {
					let has_adjacent_enemy = false
					let t_adj = DEBUG_ACTIVATION_TRACE ? activation_now() : 0
					has_adjacent_enemy = space_has_adjacent_enemy(s, faction, enemy_space_flag, unmoved_pieces)
					if (DEBUG_ACTIVATION_TRACE) {
						perf_enemy_adjacency_checks += 1
						perf_enemy_adjacency_ms += activation_now() - t_adj
					}
					if (has_adjacent_enemy || unmoved_pieces.some((p) => data.pieces[p].name === "RU Black Sea")) {
						let t0 = DEBUG_ACTIVATION_TRACE ? activation_now() : 0
						can_attack = unmoved_pieces.some((p) => can_piece_attack_in_activation(p, s, faction))
						if (DEBUG_ACTIVATION_TRACE) {
							perf_attack_checks += 1
							perf_attack_ms += activation_now() - t0
						}
					}
				}

				if (russo_british_mode) {
					if (!russo_british_legal_set.has(s)) continue
					if (activated_attack_set.has(s) || russo_british_selected < russo_british_required_count) {
						res.action("activate_attack", s)
					}
					continue
				}

				if (romania_mode) {
					if (!romania_legal_set.has(s)) continue
					if (activated_attack_set.has(s) || romania_selected < romania_required_count) {
						res.action("activate_attack", s)
					}
					continue
				}

				if (can_move) res.action("activate_move", s)
				if (can_attack) res.action("activate_attack", s)
				// Liberate Suez: offer Egypt-only attack for non-Egypt spaces that can attack into Egypt
				if (game.liberate_suez_op_required && !Engine.map.is_egypt(s) && can_attack && !activated_attack_egypt_set.has(s)) {
					let adj = Engine.map.get_connected_spaces(game, s, null, faction, undefined, "attack")
					let has_egypt_enemy = adj.some((n) => Engine.map.is_egypt(n) && Engine.map.contains_enemy_pieces(game, n, faction))
					if (has_egypt_enemy) res.action("activate_attack_egypt", s)
				}
				// MO_BRITISH_NO_ATTACK: offer "attack with BR" mode if affordable and BR units present
				if (costs.attack_with_br !== undefined && game.ops >= costs.attack_with_br) {
					let has_br_that_can_attack = (all_pieces_by_space.get(s) || []).some((p) => {
						let nations = Engine.game_utils.get_piece_nations_for_rule(game, p, "activation")
						return nations.some((n) => n === "br") && can_activate_piece_in_space_to_attack(p, s)
					})
					if (has_br_that_can_attack) res.action("activate_attack_with_br", s)
				}
			}

			let deactivated_spaces = new Set()
			for (let s of game.activated.move) {
				if (!russo_british_mode && !deactivated_spaces.has(s)) {
					res.action("deactivate", s)
					deactivated_spaces.add(s)
				}
			}
			for (let s of game.activated.attack) {
				if (!deactivated_spaces.has(s)) {
					if (game.liberate_suez_op_required && Engine.map.is_egypt(s)) continue
					if (russo_british_mode && !russo_british_legal_set.has(s)) continue
					if (romania_mode && !romania_legal_set.has(s)) continue
					res.action("deactivate", s)
					deactivated_spaces.add(s)
				}
			}
			for (let s of (game.activated.attack_egypt || [])) {
				if (!deactivated_spaces.has(s)) {
					res.action("deactivate", s)
					deactivated_spaces.add(s)
				}
			}
			for (let { space } of get_region_activation_entries("move")) {
				if (!russo_british_mode && !deactivated_spaces.has(space)) {
					res.action("deactivate", space)
					deactivated_spaces.add(space)
				}
			}
			for (let { space } of get_region_activation_entries("attack")) {
				if (!deactivated_spaces.has(space)) {
					res.action("deactivate", space)
					deactivated_spaces.add(space)
				}
			}

			let can_done = true
			if (game.liberate_suez_op_required) {
				if (!Engine.event_states.check_liberate_suez_ops(game)) {
					can_done = false
				}
			}

			if (russo_british_mode) {
				can_done = russo_british_required_count === 0 || russo_british_selected >= russo_british_required_count
			}
			if (romania_mode) {
				can_done = romania_required_count === 0 || romania_selected >= romania_required_count
			}

			if (can_done) {
				res.action("done")
			}
			if (DEBUG_ACTIVATION_TRACE) {
				log_activation_debug("[调试][activation-perf]", {
					phase: "activate_spaces.prompt",
					total_ms: activation_now() - perf_start,
					pieces_by_space: pieces_by_space.size,
					enemy_adjacency_checks: perf_enemy_adjacency_checks,
					enemy_adjacency_ms: perf_enemy_adjacency_ms,
					attack_checks: perf_attack_checks,
					attack_ms: perf_attack_ms
				})
			}
		},
		activate_move(s) {
			if (Engine.map.is_region(game, s)) {
				if (!has_region_activation_options_in_space("move", s, active_faction())) return
				begin_region_activation_selection("move", s)
				return
			}
			if (!has_move_activation_options_in_space(s, active_faction())) return
			push_undo()
			let cost = get_activation_cost(game, s, "move")
			game.ops -= cost
			set_add(game.activated.move, s)
			if (!game.activation_cost) game.activation_cost = {}
			map_set(game.activation_cost, s, cost)
			if (game.ops === 0) states.activate_spaces.done()
		},
		activate_attack(s) {
			let faction = active_faction()
			if (Engine.map.is_region(game, s)) {
				if (!has_region_activation_options_in_space("attack", s, faction)) return
				begin_region_activation_selection("attack", s)
				return
			}
			let unmoved_pieces = get_pieces_in_space(game, s).filter((p) => !set_has(game.moved, p))
			if (!unmoved_pieces.some((p) => can_piece_attack_in_activation(p, s, faction))) return
			push_undo()
			let russo_british_mode = is_russo_british_russian_activation()
			let romania_mode = is_romania_event_activation()
			let cost = russo_british_mode || romania_mode ? 0 : get_activation_cost(game, s, "attack")
			game.ops -= cost
			set_add(game.activated.attack, s)
			if (!game.activation_cost) game.activation_cost = {}
			map_set(game.activation_cost, s, cost)

			if (russo_british_mode) {
				let required_count = Math.min(2, get_russo_british_legal_attack_spaces().length)
				if (game.activated.attack.length >= required_count) {
					states.activate_spaces.done()
				}
			} else if (romania_mode) {
				let required_count = Math.min(1, get_romania_event_legal_attack_spaces().length)
				if (game.activated.attack.length >= required_count) {
					states.activate_spaces.done()
				}
			} else if (game.ops === 0) {
				states.activate_spaces.done()
			}
		},
		activate_attack_egypt(s) {
			// Liberate Suez: activate non-Egypt space for Egypt-only attack
			let faction = active_faction()
			if (Engine.map.is_region(game, s)) return
			let unmoved_pieces = get_pieces_in_space(game, s).filter((p) => !set_has(game.moved, p))
			if (!unmoved_pieces.some((p) => can_piece_attack_in_activation(p, s, faction))) return
			push_undo()
			let cost = get_activation_cost(game, s, "attack")
			game.ops -= cost
			if (!Array.isArray(game.activated.attack_egypt)) game.activated.attack_egypt = []
			set_add(game.activated.attack_egypt, s)
			if (!game.activation_cost) game.activation_cost = {}
			map_set(game.activation_cost, s, cost)
			log("解放苏伊士：该单位仅能进攻埃及地区的目标。")
			if (game.ops === 0) states.activate_spaces.done()
		},
		activate_attack_with_br(s) {
			// MO_BRITISH_NO_ATTACK: mark this attack activation as allowed to include BR units.
			// The VP penalty is paid only when a BR attack is actually declared.
			if (!is_british_no_attack_unpaid_for(active_faction())) return
			if (Engine.map.is_region(game, s)) return  // region activation handled separately
			let cost = get_activation_cost(game, s, "attack_with_br")
			if (cost === undefined || game.ops < cost) return
			push_undo()
			game.ops -= cost
			set_add(game.activated.attack, s)
			if (!Array.isArray(game.br_no_attack_activated)) game.br_no_attack_activated = []
			set_add(game.br_no_attack_activated, s)
			if (!game.activation_cost) game.activation_cost = {}
			map_set(game.activation_cost, s, cost)
			if (game.ops === 0) states.activate_spaces.done()
		},
		deactivate(s) {
			if (game.liberate_suez_op_required && Engine.map.is_egypt(s) && set_has(game.activated.attack, s)) {
				log("解放苏伊士：埃及地区已激活的进攻不能取消。")
				return
			}
			if (game.liberate_suez_op_required && set_has(game.activated.attack_egypt, s)) {
				log("解放苏伊士：已指定进攻埃及的单位不能取消。")
				return
			}
			push_undo()
			if (Engine.map.is_region(game, s)) {
				refund_last_region_activation_for_space(s)
				return
			}
			let total_cost_before = map_get(game.activation_cost, s) || 0
			let had_ordinary_activation = set_has(game.activated.move, s) || set_has(game.activated.attack, s) || set_has(game.activated.attack_egypt, s)
			if (had_ordinary_activation) {
				let ordinary_cost = total_cost_before
				if (ordinary_cost <= 0) ordinary_cost = total_cost_before
				set_delete(game.activated.move, s)
				set_delete(game.activated.attack, s)
				set_delete(game.activated.attack_egypt, s)
				if (Array.isArray(game.br_no_attack_activated)) set_delete(game.br_no_attack_activated, s)
				game.ops += ordinary_cost
				map_delete(game.activation_cost, s)
			}
		},
		done() {
			let russo_british_mode = is_russo_british_russian_activation()
			let romania_mode = is_romania_event_activation()
			if (is_russo_british_russian_activation()) {
				let required_count = Math.min(2, get_russo_british_legal_attack_spaces().length)
				if (required_count > 0 && game.activated.attack.length < required_count) {
					return
				}
				delete game.russo_british_russian_activation
			}
			if (romania_mode) {
				let required_count = Math.min(1, get_romania_event_legal_attack_spaces().length)
				if (required_count > 0 && game.activated.attack.length < required_count) {
					return
				}
				delete game.romania_event_activation
				if (required_count === 0) {
					game.state = "event_romania_attack_cleanup"
					return
				}
			}
			if (!russo_british_mode) log_activation_summary()
			if (Engine.event_states.on_activation_done(game)) {
				return
			}

			if (has_any_move_activations()) {
				game.state = "choose_move_space"
			} else {
				refresh_attack_eligibility()
				if (game.eligible_attackers.length > 0) {
					game.state = "attack"
				} else {
					game.state = "end_operations"
				}
			}
		}
	}

	states.activate_region_stack = {
		prompt(res) {
			let selection = game.region_activation_selection
			if (!selection) {
				game.state = "activate_spaces"
				return
			}
			let { mode, space, pieces } = selection
			let mode_name = mode === "move" ? "移动" : "进攻"
			let available = get_region_activation_available_pieces(mode, space, active_faction())
			res.where(space)
			res.who(pieces)
			res.prompt(`选择 ${space_name(space)} 中要${mode_name}激活的堆叠`)

			for (let p of get_pieces_in_space(game, space)) {
				if (set_has(pieces, p) || set_has(available, p)) {
					res.piece(p)
				}
			}

			if (pieces.length > 0) {
				let reason = get_region_activation_block_reason(mode, space, pieces)
				if (!reason) {
					let cost = get_region_activation_cost(mode, space, pieces)
					res.action("confirm")
					res.prompt(`确认${mode_name}激活 ${piece_list(pieces)} (花费 ${cost} OPS)`)
				} else {
					res.prompt(`${space_name(space)} 不能按当前选择${mode_name}激活：${reason}`)
				}
			}

			res.action("cancel")
		},
		piece(p) {
			let selection = game.region_activation_selection
			if (!selection) return
			let { mode, space } = selection
			if (game.pieces[p] !== space) return
			let available = get_region_activation_available_pieces(mode, space, active_faction())
			if (!set_has(selection.pieces, p) && !set_has(available, p)) return
			set_toggle(selection.pieces, p)
		},
		confirm() {
			let selection = game.region_activation_selection
			if (!selection || selection.pieces.length === 0) return
			let { mode, space, pieces } = selection
			let reason = get_region_activation_block_reason(mode, space, pieces)
			if (reason) {
				log(`${space_name(space)} 不能按所选堆叠激活：${reason}`)
				return
			}
			push_undo()
			let cost = get_region_activation_cost(mode, space, pieces)
			game.ops -= cost
			add_region_activation_stack(mode, space, pieces, cost)
			clear_region_activation_selection()
			game.state = "activate_spaces"
			if (game.ops === 0) states.activate_spaces.done()
		},
		cancel() {
			clear_region_activation_selection()
			game.state = "activate_spaces"
		}
	}

	// --- LCU COMBINATION AND BREAKDOWN ---

	function begin_move_selection(s, pieces = [], options = {}) {
		push_undo()
		log_br()
		log("Moved from " + space_name(s))
		game.where = s
		game.move = {
			initial: s,
			current: s,
			spaces_moved: 0,
			pieces: pieces.slice(),
			touched_spaces: [s],
			faction: active_faction()
		}
		if (Array.isArray(options.allowed_activation_pieces)) {
			game.move.allowed_activation_pieces = options.allowed_activation_pieces.slice()
		}
		game.state = "choose_pieces_to_move"
	}

	states.choose_move_space = {
		prompt(res) {
			let can_entrench = false
			let can_combine = false
			let can_remove_uprising_marker = false
			res.prompt("移动已激活的单位.")

			let can_move = false
			for (let s of game.activated.move) {
				let pieces = get_pieces_in_space(game, s)
				let has_movable = false
				let removal_units = get_uprising_marker_removal_units(s)
				for (let p of pieces) {
					let can_select_for_move = can_piece_move_in_activation(p, active_faction()) && !set_has(game.moved, p)
					let can_select_for_removal = removal_units.includes(p) && !set_has(game.moved, p)
					if (can_select_for_move || can_select_for_removal) {
						res.piece(p)
						if (can_select_for_move) can_move = true
						has_movable = true
					}
				}
				let can_combine_here = can_space_combine_in_activation(s, active_faction())
				let can_entrench_here = can_space_entrench_in_activation(s)
				let can_remove_uprising_marker_here = can_space_remove_uprising_marker_in_activation(s)
				if (has_movable || can_combine_here || can_entrench_here || can_remove_uprising_marker_here) {
					res.space(s)
				}
				if (can_combine_here) {
					can_combine = true
				}
				if (can_entrench_here) {
					can_entrench = true
				}
				if (can_remove_uprising_marker_here) {
					can_remove_uprising_marker = true
				}
			}
			for (let { space, stacks } of get_region_activation_entries("move")) {
				for (let stack of stacks) {
					for (let p of stack.pieces || []) {
						if (game.pieces[p] !== space) continue
						if (can_piece_move_in_activation(p, active_faction()) && !set_has(game.moved, p)) {
							res.piece(p)
							can_move = true
						}
					}
				}
			}

			if (can_entrench) {
				res.prompt("移动或掘壕已激活的单位.")
			}

			res.action("done")

			if (!can_move && !can_entrench && !can_combine && !can_remove_uprising_marker) {
				this.done()
			}
		},
		space(s) {
			if (game.activated.move.includes(s)) {
				begin_move_selection(s)
			}
		},
		piece(p) {
			let region_activation = get_region_activation_stack_for_piece("move", p)
			let s = region_activation ? region_activation.space : game.pieces[p]
			begin_move_selection(s, [p], {
				allowed_activation_pieces: region_activation ? region_activation.stack.pieces : null
			})
		},
		done() {
			// 与 POG 一样，移动阶段整体结束时仍必须没有未解消的超堆叠。
			let violations = get_unresolved_move_activation_violations()
			if (violations.length > 0) {
				for (let { space, reason } of violations) {
					log(`不能结束移动阶段：${space_name(space)} 仍不合法（${reason}）`)
				}
				return
			}
			game.where = -1
			game.activated.move = []
			clear_region_activation_mode("move")

			if (game.move_from_event) {
				delete game.move_from_event
				goto_end_event()
				return
			}

			goto_entrench_rolls_or_attack(active_faction())
		}
	}

	states.choose_move_action = {
		prompt(res) {
			let s = game.where
			res.prompt(`${space_name(s)}: 继续移动`)
			res.where(s)
			res.action("move")
			res.action("cancel")
		},
		move() {
			let s = game.where
			if (s > 0) begin_move_selection(s)
		},
		piece(p) {
			let s = game.where
			if (game.pieces[p] !== s) return
			if (!can_piece_move_in_activation(p, active_faction()) && !get_uprising_marker_removal_units(s).includes(p)) return
			if (set_has(game.moved, p)) return
			begin_move_selection(s, [p])
		},
		combine() {
			this.move()
		},
		entrench() {
			this.move()
		},
		cancel() {
			game.where = -1
			game.state = "choose_move_space"
		}
	}

	states.entrench = {
		prompt(res) {
			let s = game.where
			let units = Engine.game_utils
				.get_entrenching_units_in_space(game, s, active_faction())
				.filter((p) => can_piece_participate_in_activation(p, active_faction()))
			let selected = game.entrench_pieces || []
			res.prompt(`在 ${space_name(s)} 选择参与挖壕的单位（当前已选: ${selected.length} 个）`)
			res.where(s)
			res.who(selected)

			for (let p of units) {
				res.piece(p)
			}

			if (selected.length > 0) res.action("confirm")
			res.action("cancel")
		},
		piece(p) {
			if (!game.entrench_pieces) game.entrench_pieces = []
			set_toggle(game.entrench_pieces, p)
		},
		confirm() {
			let s = game.where
			let selected = (game.entrench_pieces || []).filter((p) => game.pieces[p] === s)
			if (!mark_entrench_attempt(s, selected)) return
			delete game.entrench_pieces
			game.where = -1
			game.state = "choose_move_space"
		},
		roll() {
			this.confirm()
		},
		cancel() {
			delete game.entrench_pieces
			game.where = -1
			game.state = "choose_move_space"
		}
	}

	states.entrench_roll = {
		prompt(res) {
			let spaces = get_pending_entrench_spaces(get_entrench_roll_faction())
			if (spaces.length === 0) {
				res.prompt("没有待结算的掘壕尝试。")
				res.action("done")
				return
			}

			res.prompt(`为 ${spaces.map(space_name).join(", ")} 的掘壕尝试掷骰。`)
			for (let s of spaces) res.space(s)
			if (spaces.length === 1) res.action("roll")
		},
		roll() {
			let spaces = get_pending_entrench_spaces(get_entrench_roll_faction())
			if (spaces.length === 0) {
				this.done()
				return
			}
			this.space(spaces[0])
		},
		space(s) {
			let faction = get_entrench_roll_faction()
			if (get_pending_entrench_pieces_in_space(s, faction).length === 0) return
			clear_undo()
			if (!resolve_pending_entrench_attempt(s, faction)) return
			if (get_pending_entrench_spaces(faction).length > 0) {
				game.state = "entrench_roll"
			} else {
				goto_attack_after_movement(faction)
			}
		},
		done() {
			if (get_pending_entrench_spaces(get_entrench_roll_faction()).length > 0) return
			goto_attack_after_movement(get_entrench_roll_faction())
		}
	}

	states.combine_lcu = {
		prompt(res) {
			let selected = get_selected_combine_scus()
			res.prompt(`在 ${space_name(game.where)} 选择2或3个SCU进行组合`)
			res.where(game.where)
			res.who(selected)
			if (!can_combine_in_activation_space()) {
				res.action("cancel")
				return
			}

			for (let p of get_available_combine_scus()) {
				res.piece(p)
			}

			if (selected.length >= 2 && get_valid_lcus_for_selected_scus(selected).length > 0) {
				res.action("select_lcu")
			}
			if (selected.length > 0) {
				res.action("clear")
			}
			res.action("cancel")
		},
		piece(p) {
			if (!set_has(get_available_combine_scus(), p)) {
				return
			}
			let selected = get_selected_combine_scus()
			if (set_has(selected, p)) {
				set_delete(selected, p)
				return
			}
			if (selected.length >= 3) {
				return
			}
			set_add(selected, p)
			if (selected.length >= 2) {
				let valid_lcus = get_valid_lcus_for_selected_scus(selected)
				if (valid_lcus.length === 0) {
					// Check if it could be part of a 3-piece combo
					let available = get_available_combine_scus()
					let could_be_3 = false
					if (selected.length === 2) {
						for (let third of available) {
							if (!set_has(selected, third)) {
								let test_3 = [...selected, third]
								if (get_valid_lcus_for_selected_scus(test_3).length > 0) {
									could_be_3 = true
									break
								}
							}
						}
					}

					if (!could_be_3) {
						set_delete(selected, p)
					}
				}
			}
		},
		select_lcu() {
			let selected = get_selected_combine_scus()
			if (!can_combine_in_activation_space()) {
				return
			}
			if (selected.length < 2) {
				return
			}
			if (get_valid_lcus_for_selected_scus(selected).length === 0) {
				return
			}
			game.state = "combine_lcu_select_lcu"
		},
		clear() {
			game.combine_ctx = {
				...(game.combine_ctx || {}),
				selected_scus: []
			}
		},
		cancel() {
			clear_combine_ctx()
			return_to_combine_entry()
		}
	}

	states.combine_lcu_select_lcu = {
		prompt(res) {
			let selected = get_selected_combine_scus()
			res.prompt(`选择预备区中可与已选SCU组合的LCU`)
			res.where(game.where)
			res.who(selected)
			res.space(get_lcu_reserve_box(active_faction()))

			let valid_lcus = get_valid_lcus_for_selected_scus(selected)
			for (let lcu of valid_lcus) {
				res.piece(lcu)
			}

			if (game.combine_ctx && game.combine_ctx.pending_resolution) {
				if (valid_lcus.length === 0) res.action("skip")
			} else {
				res.action("back")
				res.action("cancel")
			}
		},
		piece(lcu_id) {
			let selected = get_selected_combine_scus()
			if (!can_combine_in_activation_space()) return
			if (!set_has(get_valid_lcus_for_selected_scus(selected), lcu_id)) return
			if (!Engine.map.can_enter_area(game, lcu_id, game.where)) return
			let options = get_manual_combination_for_lcu(lcu_id, selected)
			if (!options) {
				return
			}
			let previous_ctx = game.combine_ctx || {}
			game.combine_ctx = {
				...previous_ctx,
				selected_scus: selected.slice(),
				lcu_id,
				type: options.type,
				pending_scus: selected.slice()
			}
			game.state = "combine_lcu_dispose_reserve"
		},
		back() {
			if (game.combine_ctx && game.combine_ctx.pending_resolution) return
			game.state = "combine_lcu"
		},
		cancel() {
			if (skip_pending_combination()) return
			clear_combine_ctx()
			return_to_combine_entry()
		},
		skip() {
			skip_pending_combination()
		}
	}

	states.combine_lcu_dispose_reserve = {
		prompt(res) {
			let ctx = game.combine_ctx
			if (!ctx || !ctx.pending_scus || ctx.pending_scus.length === 0) {
				return_to_combine_entry()
				return
			}
			res.prompt("选择移入预备区的SCU")
			res.where(game.where)
			res.space(get_scu_reserve_box(active_faction()))
			res.who(ctx.pending_scus)
			for (let p of ctx.pending_scus) res.piece(p)
			if (!ctx.pending_resolution) res.action("cancel")
		},
		piece(p) {
			let ctx = game.combine_ctx
			if (!ctx || !set_has(ctx.pending_scus, p)) return
			game.pieces[p] = get_scu_reserve_box(data.pieces[p].faction)
			set_delete(ctx.pending_scus, p)
			log(`${piece_name(p)} to reserve.`)
			if (ctx.type === "full") game.state = "combine_lcu_dispose_eliminated"
			else game.state = "combine_lcu_dispose_removed"
		},
		cancel() {
			if (game.combine_ctx && game.combine_ctx.pending_resolution) return
			clear_combine_ctx()
			return_to_combine_entry()
		}
	}

	states.combine_lcu_dispose_eliminated = {
		prompt(res) {
			let ctx = game.combine_ctx
			if (!ctx || !ctx.pending_scus || ctx.pending_scus.length === 0) {
				return_to_combine_entry()
				return
			}
			res.prompt("选择移入被消灭区的SCU")
			res.where(game.where)
			res.space(get_eliminated_box(active_faction()))
			res.who(ctx.pending_scus)
			for (let p of ctx.pending_scus) res.piece(p)
			if (!ctx.pending_resolution) res.action("cancel")
		},
		piece(p) {
			let ctx = game.combine_ctx
			if (!ctx || !set_has(ctx.pending_scus, p)) return
			game.pieces[p] = get_eliminated_box(data.pieces[p].faction)
			set_delete(game.reduced, p)
			set_delete(ctx.pending_scus, p)
			log(`${piece_name(p)} to eliminated.`)
			game.state = "combine_lcu_dispose_removed"
		},
		cancel() {
			if (game.combine_ctx && game.combine_ctx.pending_resolution) return
			clear_combine_ctx()
			return_to_combine_entry()
		}
	}

	states.combine_lcu_dispose_removed = {
		prompt(res) {
			let ctx = game.combine_ctx
			if (!ctx || !ctx.pending_scus || ctx.pending_scus.length === 0) {
				return_to_combine_entry()
				return
			}
			res.prompt("选择移入PE的SCU")
			res.where(game.where)
			res.space(get_permanently_eliminated_box(active_faction()))
			res.who(ctx.pending_scus)
			for (let p of ctx.pending_scus) res.piece(p)
			if (!ctx.pending_resolution) res.action("cancel")
		},
		piece(p) {
			let ctx = game.combine_ctx
			if (!ctx || !set_has(ctx.pending_scus, p)) return
			game.pieces[p] = get_permanently_eliminated_box(data.pieces[p].faction)
			set_delete(ctx.pending_scus, p)
			log(`${piece_name(p)} removed.`)
			finalize_manual_combination()
		},
		cancel() {
			if (game.combine_ctx && game.combine_ctx.pending_resolution) return
			clear_combine_ctx()
			return_to_combine_entry()
		}
	}

	function get_available_combine_scus() {
		const { game_utils } = Engine
		if (!can_combine_in_activation_space()) return []
		let pieces = get_pieces_in_space(game, game.where)
		log_activation_debug(`[调试] get_available_combine_scus in space: ${game.where}, pieces in space: ${pieces}`)
		return pieces.filter((p) => {
			let info = data.pieces[p]
			if (!is_scu(p)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) is not SCU`)
				return false
			}
			if (game.combine_ctx && game.combine_ctx.allowed_scus) {
				if (!set_has(game.combine_ctx.allowed_scus, p)) {
					log_activation_debug(`[调试] piece ${p} (${info.name}) not in allowed_scus`)
					return false
				}
			}
			if (is_hq(p)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) is HQ`)
				return false
			}
			if (is_tribe(p)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) is Tribe`)
				return false
			}
			if (game_utils.get_piece_effective_faction(game, p) !== active_faction()) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) faction mismatch`)
				return false
			}
			if (is_pending_combine_piece(p) && !(game.combine_ctx && game.combine_ctx.allowed_scus)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) already pending combination`)
				return false
			}
			if (set_has(game.moved, p)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) already moved`)
				return false
			}
			if (info.type === "irregular") {
				log_activation_debug(`[调试] piece ${p} (${info.name}) is irregular`)
				return false
			}
			let badge = game_utils.get_piece_badge(p)
			if (badge === "yellow") {
				log_activation_debug(`[调试] piece ${p} (${info.name}) has yellow badge`)
				return false
			}
			let status = get_piece_activation_supply_status(p, active_faction())
			if (status === "OOS") {
				log_activation_debug(`[调试] piece ${p} (${info.name}) out of supply`)
				return false
			}
			if (Engine.map.is_limited_supply_status(status)) {
				log_activation_debug(`[调试] piece ${p} (${info.name}) in limited supply`)
				return false
			}
			return true
		})
	}

	function get_selected_combine_scus() {
		if (!game.combine_ctx) game.combine_ctx = {}
		if (!game.combine_ctx.selected_scus) game.combine_ctx.selected_scus = []
		return game.combine_ctx.selected_scus
	}

	function get_manual_combination_for_lcu(lcu_id, selected_scus) {
		let options = Engine.game_utils.get_combination_options_for_lcu(game, lcu_id, selected_scus.slice(), game.where)
		if (!options) {
			log_activation_debug(`[调试] get_manual_combination_for_lcu: no options for lcu ${data.pieces[lcu_id].name}`)
			return null
		}
		if (selected_scus.length !== options.pieces.length) {
			log_activation_debug(
				`[调试] get_manual_combination_for_lcu: count mismatch for lcu ${data.pieces[lcu_id].name}: selected=${selected_scus.length}, found=${options.pieces.length}`
			)
			return null
		}
		if (selected_scus.length === 3 && options.type !== "full") {
			log_activation_debug(`[调试] get_manual_combination_for_lcu: not full for lcu ${data.pieces[lcu_id].name}`)
			return null
		}
		if (selected_scus.length === 2 && options.type !== "reduced") {
			log_activation_debug(`[调试] get_manual_combination_for_lcu: not reduced for lcu ${data.pieces[lcu_id].name}`)
			return null
		}
		for (let p of options.pieces) {
			if (!set_has(selected_scus, p)) {
				log_activation_debug(`[调试] get_manual_combination_for_lcu: piece mismatch for lcu ${data.pieces[lcu_id].name}`)
				return null
			}
		}
		return options
	}

	function get_valid_lcus_for_selected_scus(selected_scus) {
		if (selected_scus.length < 2 || selected_scus.length > 3) return []
		if (!can_combine_in_activation_space()) return []
		let faction = active_faction()
		let lcus = Engine.game_utils.get_available_lcus_in_reserve(game, faction)
		if (game.combine_ctx && game.combine_ctx.allowed_lcus) {
			lcus = lcus.filter((lcu) => set_has(game.combine_ctx.allowed_lcus, lcu))
		}
		log_activation_debug(
			`[调试] get_valid_lcus_for_selected_scus: faction=${faction}, reserve lcus: ${lcus.map((id) => data.pieces[id].name)}`
		)
		return lcus.filter((lcu) => {
			if (!Engine.map.can_enter_area(game, lcu, game.where)) return false
			let res = get_manual_combination_for_lcu(lcu, selected_scus)
			log_activation_debug(`[调试] check lcu ${data.pieces[lcu].name}: valid=${!!res}`)
			return !!res
		})
	}

	function clear_combine_ctx() {
		delete game.combine_ctx
	}

	function return_to_combine_entry() {
		if (game.event_next_state) {
			let next_state = game.event_next_state
			delete game.event_next_state
			game.state = next_state
		} else {
			game.state = game.move_from_attack ? "attack" : "choose_move_space"
		}
		delete game.move_from_attack
	}

	function finalize_manual_combination() {
		let ctx = game.combine_ctx
		if (!ctx) {
			return_to_combine_entry()
			return
		}
		let lcu_info = data.pieces[ctx.lcu_id]
		let space = game.where
		game.pieces[ctx.lcu_id] = space
		if (ctx.type === "reduced") {
			set_add(game.reduced, ctx.lcu_id)
			log(`${active_faction()} 将2个SCU组合为 ${lcu_info.name} 在 ${space_name(space)}.`)
		} else {
			set_delete(game.reduced, ctx.lcu_id)
			log(`${active_faction()} 将3个SCU组合为 ${lcu_info.name} 在 ${space_name(space)}.`)
		}
		if (ctx.event_flag_on_success && game.event_ctx && game.event_ctx.key === ctx.event_flag_on_success.key) {
			if (!game.event_ctx.data) game.event_ctx.data = {}
			game.event_ctx.data[ctx.event_flag_on_success.field] = true
		}
		set_add(game.moved, ctx.lcu_id)
		if (ctx.pending_resolution) {
			let faction = ctx.pending_resolution_faction || active_faction()
			remove_pending_combine(ctx.pending_space, ctx.selected_scus || [], faction)
			clear_combine_ctx()
			goto_entrench_rolls_or_attack(faction)
			return
		}
		clear_combine_ctx()
		return_to_combine_entry()
	}

	states.choose_pieces_to_move = {
		prompt(res) {
			let s = game.move.initial
			res.where(s)
			res.who(game.move.pieces)
			res.prompt(`选择从 ${space_name(s)} 移动的单位`)

			let allowed_pieces = game.move.allowed_activation_pieces
			let pieces = get_pieces_in_space(game, s).filter(
				(p) => !Array.isArray(allowed_pieces) || set_has(allowed_pieces, p) || set_has(game.move.pieces, p)
			)
			let removal_units = get_uprising_marker_removal_units(s)

			let any_available = false
			for (let p of pieces) {
				let is_moved = set_has(game.moved, p)
				let can_select_for_move = can_piece_move_in_activation(p, active_faction()) && !is_moved
				let can_select_for_removal = removal_units.includes(p) && !is_moved
				if ((can_select_for_move || can_select_for_removal) && !set_has(game.move.pieces, p)) {
					res.piece(p)
					any_available = true
				}
			}

			if (game.move.pieces.length > 0) {
				let selected_can_move = game.move.pieces.every((p) => can_piece_move_in_activation(p, active_faction()))
				let has_moves = false
				if (selected_can_move) {
					let all_neighbors = new Set()
					for (let p of game.move.pieces) {
						let neighbors = Engine.map.get_piece_connected_spaces_for_rule(game, s, p)
						for (let n of neighbors) all_neighbors.add(n)
					}

					for (let next of all_neighbors) {
						if (can_stack_move_to(game, next, active_faction())) {
							res.space(next)
							has_moves = true
						}
					}
				}

				// Rule: Only one unit can entrench per space per AR
				let can_entrench = Engine.game_utils.can_entrench_in_space(game, s, active_faction())
				if (can_entrench && !game.entrench_attempts?.includes(s)) {
					// POG style: must have pieces selected to see entrench button
					if (game.move.pieces.length > 0) {
						let entrenching_units = Engine.game_utils.get_entrenching_units_in_space(game, s, active_faction())
						let all_selected_can_entrench = game.move.pieces.every((p) => entrenching_units.includes(p))
						if (all_selected_can_entrench) {
							res.action("entrench")
						}
					}
				}
				if (can_selected_move_pieces_combine(game.move.pieces)) {
					res.action("combine")
				}
				if (can_selected_move_pieces_remove_uprising_marker()) {
					res.action("remove_uprising_marker")
				}

				if (!has_moves) res.action("stop")
			} else if (!any_available) {
				log("No movable units in this space.")
			}

			res.action("done")
		},
		piece(p) {
			if (game.pieces[p] !== game.move.initial) return
			if (Array.isArray(game.move.allowed_activation_pieces) && !set_has(game.move.allowed_activation_pieces, p)) return
			if (!set_has(game.move.pieces, p)) {
				let can_select_for_move = can_piece_move_in_activation(p, active_faction()) && !set_has(game.moved, p)
				let can_select_for_removal = get_uprising_marker_removal_units(game.move.initial).includes(p) && !set_has(game.moved, p)
				if (!can_select_for_move && !can_select_for_removal) return
			}
			if (set_has(game.moved, p)) return
			if (game.move.pieces.length === 0) push_undo()
			set_toggle(game.move.pieces, p)
			if (game.move.pieces.length > 0 && !can_move_stack_composition(game, game.move.pieces)) {
				set_delete(game.move.pieces, p)
				log("Cannot select unit: stacking limit.")
			}
		},
		space(s) {
			if (!game.move.pieces.every((p) => can_piece_move_in_activation(p, active_faction()))) return
			push_undo()
			move_stack_to_space(s)
			if (game.move && game.move.current === s && game.move.pieces.length > 0) {
				set_next_state("move_stack")
			}
		},
		stop() {
			end_move_stack()
		},
		entrench() {
			let s = game.move.initial
			let participating = game.move.pieces.slice()
			push_undo()
			mark_entrench_attempt(s, participating)
			game.where = -1
			game.state = "choose_move_space"
			delete game.move
		},
		combine() {
			let s = game.move.initial
			let selected = game.move.pieces.slice()
			if (!can_selected_move_pieces_combine(selected)) return
			push_undo()
			if (!mark_pending_combine(s, selected, get_current_move_faction())) return
			game.move.pieces = []
			if (has_move_activation_options_in_space(s, get_current_move_faction())) {
				set_next_state("choose_pieces_to_move")
			} else {
				end_move_activation(s, get_current_move_faction())
			}
		},
		remove_uprising_marker() {
			if (!can_selected_move_pieces_remove_uprising_marker()) return
			let s = game.move.initial
			let p = game.move.pieces[0]
			push_undo()
			let rule = remove_enemy_uprising_marker(s)
			if (!rule) return
			finish_uprising_marker_removal(p, rule, s)
		},
		done() {
			push_undo()
			end_move_activation(game.move.initial, get_current_move_faction())
		}
	}

	states.move_stack = {
		prompt(res) {
			let exhausted_stopping_pieces = game.move.pieces.filter((p) => get_piece_mf(p) <= game.move.spaces_moved)
			let all_exhausted = prune_exhausted_move_stack(game, log)
			if (exhausted_stopping_pieces.length > 0) {
				sync_vp_and_jihad_for_stopped_space(game.move.current)
			}
			if (all_exhausted) {
				end_move_stack(exhausted_stopping_pieces)
				if (
					game.state !== "move_stack" &&
					states[game.state] &&
					typeof states[game.state].prompt === "function"
				) {
					states[game.state].prompt(res)
				}
				return
			}
			let s = game.move.current
			res.where(s)
			res.who(game.move.pieces)

			let current_block_reason = get_current_move_end_block_reason(s)
			if (current_block_reason) {
				res.prompt(`移动 ${space_name(s)} 处的堆叠 (无法结束移动: ${current_block_reason})`)
			} else if (get_move_end_space_block_reason(game, s, active_faction()) === "堆叠超限") {
				res.prompt(`移动 ${space_name(s)} 处的堆叠 (临时超堆叠，需后续移出单位)`)
			} else {
				res.prompt(`移动 ${space_name(s)} 处的堆叠`)
			}

			let all_neighbors = new Set()
			for (let p of game.move.pieces) {
				let neighbors = Engine.map.get_piece_connected_spaces_for_rule(game, s, p)
				for (let n of neighbors) all_neighbors.add(n)
			}

			for (let next of all_neighbors) {
				if (can_stack_move_to(game, next, active_faction())) {
					res.space(next)
				}
			}

			if (!current_block_reason) {
				res.action("stop")
			}

			// Allow dropping pieces
			for (let p of game.move.pieces) {
				if (!get_move_piece_drop_block_reason(p)) res.piece(p)
			}
		},
		space(s) {
			push_undo()
			game.where = s
			move_stack_to_space(s)
			if (!game.move) return
			let exhausted_stopping_pieces = game.move.pieces.filter((p) => get_piece_mf(p) <= game.move.spaces_moved)
			let all_exhausted = prune_exhausted_move_stack(game, log)
			if (exhausted_stopping_pieces.length > 0) {
				sync_vp_and_jihad_for_stopped_space(game.move.current)
			}
			if (all_exhausted) {
				end_move_stack(exhausted_stopping_pieces)
			}
		},
		piece(p) {
			// Drop piece
			let s = game.move.current
			let reason = get_move_piece_drop_block_reason(p)
			if (reason) {
				log(`不能在此放下 ${piece_name(p)}：${reason}`)
				return
			}
			set_delete(game.move.pieces, p)
			set_add(game.moved, p)
			log_piece_move([p], s)
			sync_vp_and_jihad_for_stopped_space(s)
			if (game.move.pieces.length === 0) {
				end_move_stack()
			}
		},
		stop() {
			end_move_stack()
		}
	}

	function move_stack_to_space(target) {
		let from_space = game.move.current
		let moving_faction = get_current_move_faction()
		if (!game.move.faction) game.move.faction = moving_faction
		let pieces_moving = []
		let pieces_stopped = []
		let creates_beachhead = should_create_beachhead_on_entry(from_space, target, moving_faction)
		let safe_withdrawal = get_safe_beachhead_withdrawal_context(from_space, target, moving_faction)
		let siege_departure_reason = Engine.map.get_siege_departure_block_reason(
			game,
			from_space,
			game.move.pieces,
			moving_faction
		)
		if (siege_departure_reason) {
			log(`Cannot leave ${space_name(from_space)}: ${siege_departure_reason}.`)
			return
		}

		let is_siege_entry =
			has_undestroyed_fort(game, target, other_faction(moving_faction)) && !Engine.map.is_besieged(game, target)
		if (is_siege_entry) {
			let potential_pieces = game.move.pieces.filter((p) => {
				let cost = get_movement_cost(game, p, target) + get_enemy_fort_entry_extra_cost(game, target, moving_faction)
				return get_piece_mf(p) >= game.move.spaces_moved + cost
			})

			if (!can_besiege(game, target, potential_pieces)) {
				log("Cannot enter " + space_name(target) + ": Insufficient strength to besiege.")
				return
			}
		}

		let step_cost = 0
		for (let p of game.move.pieces) {
			if (can_piece_move_to(game, p, target, moving_faction)) {
				let cost = get_movement_cost(game, p, target)
				if (is_siege_entry) cost += get_enemy_fort_entry_extra_cost(game, target, moving_faction)

				step_cost = Math.max(step_cost, cost)
				game.pieces[p] = target
				pieces_moving.push(p)

				if (is_gallipoli(from_space) && is_gallipoli(target)) {
					game.move.gallipoli_internal_paid = true
				}
			} else {
				pieces_stopped.push(p)
				let reason = get_piece_move_block_reason(game, p, target, moving_faction)
				if (reason) log(`移动阻断：${piece_name(p)} -> ${space_name(target)}，原因=${reason}`)
			}
		}
		if (pieces_moving.length > 0 && Array.isArray(game.broken_sieges)) {
			set_delete(game.broken_sieges, from_space)
			set_delete(game.broken_sieges, target)
		}
		if (from_space > 0) {
			Engine.sync_neutral_vp_state(game, from_space)
			Engine.sync_jihad_city_state(game, from_space)
			Engine.sync_region_control(game, from_space)
			sync_siege_status(from_space, moving_faction)
		}

		game.move.spaces_moved += step_cost
		game.move.pieces = pieces_moving
		game.move.current = target
		set_add(game.move.touched_spaces, from_space)
		set_add(game.move.touched_spaces, target)

		// Rule 19.2.1: Athens Entry Trigger
		Engine.neutral.check_athens_entry(game, pieces_moving, target, moving_faction)

		for (let p of pieces_stopped) {
			set_add(game.moved, p)
			log(piece_name(p) + " stops at " + space_name(from_space))
		}

		if (game.move.pieces.length === 0) {
			end_move_stack()
			return
		}

		if (pieces_moving.length > 0) {
			apply_safe_beachhead_withdrawal_jihad(safe_withdrawal)
			if (creates_beachhead) {
				if (!game.beachheads) game.beachheads = []
				set_add(game.beachheads, target)
				Engine.map.mark_beachhead_placed_this_action_round(game, target)
				game.unplaced_beachheads = Math.max(0, (game.unplaced_beachheads || 0) - 1)
				// The step that creates a new beachhead is also the step that stops the moving stack there.
				Engine.neutral.on_beachhead_placed(game, target, moving_faction)
				log(`Beachhead placed at ${space_name(target)}.`)
			}
			if (resolve_cp_enter_empty_beachhead_by_movement(from_space, target, pieces_moving, moving_faction)) {
				return
			}

			// Rule 15.4.5: enemy entry removes Level 1 trenches and downgrades Level 2 trenches.
			if (is_enemy_trench(game, target, moving_faction)) {
				let result = enter_trench(game, target, moving_faction)
				if (result.action === "degraded") {
					log(`Level 2 Trench in ${space_name(target)} reduced to Level 1 by enemy entry.`)
				} else if (result.action === "removed") {
					log(`Trench in ${space_name(target)} removed by enemy entry.`)
				}
			}

			check_immediate_jihad_rebellion_on_entry(from_space, target, pieces_moving)

			let enemy_holds_contested_region =
				!!data.spaces[target]?.region && Engine.map.contains_enemy_pieces(game, target, moving_faction)
			let will_control_target =
				!has_undestroyed_fort(game, target, other_faction(moving_faction)) &&
				!is_controlled_by(game, target, moving_faction) &&
				pieces_moving.some((p) => data.pieces[p].type === "regular") &&
				!enemy_holds_contested_region &&
				Engine.can_set_control(game, target, moving_faction)

			// Sync VP and jihad BEFORE set_control so the previous controller is still the old one
			if (should_sync_vp_and_jihad_on_entry(pieces_moving)) {
				Engine.sync_neutral_vp_state(game, target, undefined, { silent: will_control_target })
				Engine.sync_jihad_city_state(game, target)
			}

			if (!has_undestroyed_fort(game, target, other_faction(moving_faction))) {
				if (!is_controlled_by(game, target, moving_faction)) {
					if (pieces_moving.some((p) => data.pieces[p].type === "regular") && !enemy_holds_contested_region) {
						set_control(game, target, moving_faction)
					}
				}
			}
			if (Engine.check_persia_entry_vp_penalty) {
				Engine.check_persia_entry_vp_penalty(game, target, pieces_moving)
			}
			Engine.sync_region_control(game, target)

			if (
				is_siege_entry ||
				creates_beachhead ||
				Engine.map.has_enemy_uprising_marker(game, target, moving_faction) ||
				should_stop_move_on_island_base(from_space, target)
			) {
				end_move_stack()
			}
		} else {
			end_move_stack()
		}
	}

	function set_next_state(st) {
		if (
			(game.state === "place_egyptian_rebellion" ||
				game.state === "jihad_placement" ||
				game.state === "jihad_removal" ||
				game.state === "jihad_rebellion_check") &&
			game.state_stack &&
			game.state_stack.length > 0
		) {
			game.state_stack[game.state_stack.length - 1].state = st
		} else {
			game.state = st
		}
	}

	function log_piece_move(pieces, destination) {
		if (pieces.length > 0) {
			logi(piece_list(pieces) + " -> " + space_name(destination))
		}
	}

	function should_sync_vp_and_jihad_on_entry(pieces) {
		return Array.isArray(pieces) && pieces.some((p) => {
			return Engine.game_utils.is_regular(p) || Engine.game_utils.is_irregular(p) || Engine.game_utils.is_tribe(p)
		})
	}

	function sync_siege_status(space, moving_faction) {
		let fort_owner = other_faction(moving_faction)
		if (!has_undestroyed_fort(game, space, fort_owner)) {
			set_delete(game.forts.besieged, space)
			return
		}
		if (can_besiege(game, space, Engine.map.get_besieging_pieces(game, space, fort_owner))) {
			set_add(game.forts.besieged, space)
		} else {
			set_delete(game.forts.besieged, space)
		}
	}

	function sync_vp_and_jihad_for_stopped_space(space) {
		if (!(space > 0)) return
		Engine.sync_neutral_vp_state(game, space)
		Engine.sync_jihad_city_state(game, space)
	}

	function end_move_stack(stopping_pieces = null) {
		let current_space = game.move.current
		let move_faction = get_current_move_faction()
		let allowed_activation_pieces = Array.isArray(game.move.allowed_activation_pieces)
			? game.move.allowed_activation_pieces.slice()
			: null
		// 这里保留 PUG“每次结束当前堆叠移动都做校验”的结构，
		// 但对“可由后续已激活单位解消的临时超堆叠”放行。
		let reason = get_current_move_end_block_reason(current_space, stopping_pieces, move_faction)
		if (reason) {
			log(`不能结束移动：${space_name(current_space)} 不合法（${reason}）`)
			set_next_state("move_stack")
			return
		}
		sync_siege_status(current_space, move_faction)
		sync_vp_and_jihad_for_stopped_space(current_space)
		log_piece_move(game.move.pieces, current_space)

		for (let p of game.move.pieces) {
			set_add(game.moved, p)
		}
		let initial = game.move.initial
		delete game.move
		let has_remaining_pieces = allowed_activation_pieces
			? has_unmoved_allowed_move_pieces_in_space(initial, allowed_activation_pieces, move_faction)
			: has_unmoved_move_eligible_pieces_in_space(initial, move_faction)
		if (has_remaining_pieces) {
			game.move = {
				initial: initial,
				current: initial,
				spaces_moved: 0,
				pieces: [],
				touched_spaces: [initial],
				faction: move_faction,
				allowed_activation_pieces
			}
			set_next_state("choose_pieces_to_move")
			return
		}
		if (
			!allowed_activation_pieces &&
			(can_space_combine_in_activation(initial, move_faction) || can_space_entrench_in_activation(initial, move_faction))
		) {
			set_next_state("choose_move_space")
			return
		}
		end_move_activation(initial, move_faction)
	}

	function end_move_activation(s, faction = active_faction()) {
		if (game.activated && game.activated.move) {
			set_delete(game.activated.move, s)
		}
		delete game.move
		game.where = -1
		if (game.event_next_state) {
			let next_state = game.event_next_state
			delete game.event_next_state
			set_next_state(next_state)
			return
		}
		next_move_activation(faction)
	}

	function next_move_activation(faction = active_faction()) {
		// Filter out activated spaces that have no movable pieces left
		if (game.activated && game.activated.move) {
			game.activated.move = game.activated.move.filter((s) => has_move_activation_options_in_space(s, faction))
		}
		prune_region_move_activations(faction)

		if (has_any_move_activations()) {
			set_next_state("choose_move_space")
		} else {
			if (game.move_from_event) {
				delete game.move_from_event
				goto_end_event()
				return
			}
			goto_entrench_rolls_or_attack(faction)
		}
	}
}
