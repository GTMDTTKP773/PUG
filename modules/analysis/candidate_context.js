"use strict"

/**
 * Public candidate-context facts for external AI clients.
 *
 * This module does not choose actions and does not assert legality. Callers
 * should pass legal actions from rules.view() or decision_snapshot(); this
 * layer only attaches useful map, unit, supply, and activation facts.
 */
module.exports = function create_candidate_context_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants

	const ACTIVATION_ACTIONS = new Set([
		"activate_move",
		"activate_attack",
		"activate_attack_egypt",
		"activate_attack_with_br"
	])

	function short_faction(faction) {
		if (faction === AP || faction === "Allied Powers" || faction === "AP") return AP
		if (faction === CP || faction === "Central Powers" || faction === "CP") return CP
		return "neutral"
	}

	function other_faction(faction) {
		if (Engine.map && typeof Engine.map.other_faction === "function") return Engine.map.other_faction(faction)
		return faction === AP ? CP : AP
	}

	function set_from(value) {
		return new Set(Array.isArray(value) ? value : [])
	}

	function is_real_space(s) {
		let info = data.spaces[s]
		return !!(s > 0 && info && info.name !== undefined && !info.type)
	}

	function normalize_action(action) {
		if (!Array.isArray(action) || action.length === 0) throw new Error("Action must be a [name, arg] pair")
		return [action[0], action.length > 1 && action[1] !== undefined ? action[1] : null]
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

	function create_supply_cache(game) {
		return {
			supply_trace_cache: new Map(),
			supply_context:
				Engine.map && typeof Engine.map.create_supply_context === "function"
					? Engine.map.create_supply_context(game)
					: null,
			source_cache: new Map(),
			status_cache: new Map(),
			disrupted_supply_sr_surcharge: new Map(),
			german_subs_sr_surcharge: new Map(),
			unrestricted_submarine_warfare_sr_surcharge: new Map()
		}
	}

	function get_pieces_in_space(game, s) {
		if (Engine.map && typeof Engine.map.get_pieces_in_space === "function") return Engine.map.get_pieces_in_space(game, s)
		let result = []
		for (let p = 0; p < (game.pieces || []).length; p++) {
			if (game.pieces[p] === s) result.push(p)
		}
		return result
	}

	function get_controller(game, s) {
		if (Engine.map && typeof Engine.map.get_space_controller === "function") return Engine.map.get_space_controller(game, s)
		return (game.control && game.control[s]) || data.spaces[s]?.faction || "neutral"
	}

	function get_supply_status(game, p, cache) {
		let s = game.pieces[p]
		if (!is_real_space(s)) return "OFFMAP"
		if (!Engine.map || typeof Engine.map.get_supply_status !== "function") return "UNKNOWN"
		let faction = Engine.game_utils.get_piece_effective_faction(game, p) || data.pieces[p]?.faction
		return Engine.map.get_supply_status(
			game,
			s,
			faction,
			p,
			false,
			cache?.supply_trace_cache,
			cache?.supply_context,
			cache?.source_cache,
			cache?.status_cache
		)
	}

	function piece_cf(game, p) {
		return typeof Engine.game_utils.get_piece_cf === "function" ? Engine.game_utils.get_piece_cf(game, p) : 0
	}

	function piece_lf(game, p) {
		return typeof Engine.game_utils.get_piece_lf === "function" ? Engine.game_utils.get_piece_lf(game, p) : 0
	}

	function piece_mf(p) {
		if (typeof Engine.game_utils.get_piece_mf === "function") return Engine.game_utils.get_piece_mf(p)
		if (Engine.map && typeof Engine.map.get_piece_mf === "function") return Engine.map.get_piece_mf(p)
		return data.pieces[p]?.mf || 0
	}

	function piece_hq_drm(game, p) {
		return typeof Engine.game_utils.get_hq_drm === "function" ? Engine.game_utils.get_hq_drm(game, p) : 0
	}

	function piece_context(game, p, cache = null) {
		let info = data.pieces[p] || {}
		let s = game.pieces[p]
		let supply = get_supply_status(game, p, cache)
		return {
			id: p,
			raw_id: is_real_space(s) ? s : null,
			name: info.name || "",
			faction: short_faction(info.faction),
			effective_faction: short_faction(Engine.game_utils.get_piece_effective_faction(game, p)),
			nation: info.nation || "",
			type: info.type || "",
			piece_class: info.piece_class || "",
			cf: piece_cf(game, p),
			lf: piece_lf(game, p),
			mf: piece_mf(p),
			hq_drm: piece_hq_drm(game, p),
			regular: Engine.game_utils.is_regular(p),
			irregular: Engine.game_utils.is_irregular(p),
			tribe: Engine.game_utils.is_tribe(p),
			lcu: Engine.game_utils.is_lcu(p),
			scu: Engine.game_utils.is_scu(p),
			hq: Engine.game_utils.is_hq(p),
			heavy_arty: Engine.game_utils.is_heavy_arty(p),
			combat_unit: Engine.game_utils.is_combat_unit(p),
			reduced: Engine.game_utils.is_piece_reduced(game, p),
			moved: set_from(game.moved).has(p),
			sr_moved: set_from(game.sr_moved).has(p),
			supply_status: supply,
			oos: supply === "OOS",
			limited_supply: Engine.map?.is_limited_supply_status
				? Engine.map.is_limited_supply_status(supply)
				: supply === "LIMITED",
			disrupted_supply: Engine.map?.is_disrupted_supply_status
				? Engine.map.is_disrupted_supply_status(supply)
				: supply === "DISRUPTED"
		}
	}

	function empty_bucket() {
		return {
			pieces: 0,
			regular: 0,
			irregular: 0,
			tribe: 0,
			lcu: 0,
			scu: 0,
			hq: 0,
			heavy_arty: 0,
			combat_unit: 0,
			reduced: 0,
			cf: 0,
			lf: 0,
			mf: 0,
			hq_drm: 0,
			oos: 0,
			limited_supply: 0,
			disrupted_supply: 0
		}
	}

	function add_piece_to_bucket(bucket, piece) {
		bucket.pieces += 1
		for (let flag of ["regular", "irregular", "tribe", "lcu", "scu", "hq", "heavy_arty", "combat_unit", "reduced"]) {
			if (piece[flag]) bucket[flag] += 1
		}
		bucket.cf += piece.cf || 0
		bucket.lf += piece.lf || 0
		bucket.mf += piece.mf || 0
		bucket.hq_drm += piece.hq_drm || 0
		if (piece.oos) bucket.oos += 1
		if (piece.limited_supply) bucket.limited_supply += 1
		if (piece.disrupted_supply) bucket.disrupted_supply += 1
	}

	function stack_summary(game, s, role, cache) {
		let faction = short_faction(role || game.active)
		let enemy = other_faction(faction)
		let buckets = {
			friendly: empty_bucket(),
			enemy: empty_bucket(),
			neutral: empty_bucket()
		}
		let pieces = []
		for (let p of get_pieces_in_space(game, s)) {
			if (!data.pieces[p]) continue
			let piece = piece_context(game, p, cache)
			pieces.push(piece)
			let side = piece.effective_faction === faction ? "friendly" : piece.effective_faction === enemy ? "enemy" : "neutral"
			add_piece_to_bucket(buckets[side], piece)
		}
		return {
			pieces: pieces.map((piece) => piece.id),
			friendly_pieces: pieces.filter((piece) => piece.effective_faction === faction).map((piece) => piece.id),
			enemy_pieces: pieces.filter((piece) => piece.effective_faction === enemy).map((piece) => piece.id),
			neutral_pieces: pieces.filter((piece) => piece.effective_faction !== faction && piece.effective_faction !== enemy).map((piece) => piece.id),
			counts: buckets
		}
	}

	function space_context(game, s, role, cache) {
		if (!is_real_space(s)) return null
		let info = data.spaces[s]
		let controller = short_faction(get_controller(game, s))
		let faction = short_faction(role || game.active)
		let enemy = other_faction(faction)
		let stack = stack_summary(game, s, faction, cache)
		return {
			raw_id: s,
			name: info.name || "",
			map: info.map || "",
			area: info.area || "",
			region: info.region || "",
			terrain: info.terrain || "",
			nation: info.nation || "",
			faction: short_faction(info.faction),
			control: controller,
			friendly_controlled: controller === faction,
			enemy_controlled: controller === enemy,
			vp: info.vp || 0,
			fort: info.fort || 0,
			port: !!info.port,
			jihad_city: !!info.jihad_city,
			island_base: !!info.island_base,
			tribal_activity_grid: info.tribal_activity_grid || "",
			beachhead: Engine.map?.is_beachhead_space ? Engine.map.is_beachhead_space(game, s) : false,
			fort_destroyed: set_from(game.forts && game.forts.destroyed).has(s),
			fort_besieged: Engine.map?.is_besieged ? Engine.map.is_besieged(game, s) : set_from(game.forts && game.forts.besieged).has(s),
			fort_owner: Engine.map?.get_fort_owner ? short_faction(Engine.map.get_fort_owner(game, s)) : "neutral",
			stack
		}
	}

	function activation_mode(action_name) {
		if (action_name === "activate_attack_egypt") return "attack_egypt"
		if (action_name === "activate_attack_with_br") return "attack_with_br"
		if (action_name === "activate_attack") return "attack"
		if (action_name === "activate_move") return "move"
		return ""
	}

	function activation_cost(costs, mode) {
		if (mode === "attack_egypt") return costs.attack
		if (mode === "attack_with_br") return costs.attack_with_br ?? costs.attack
		return costs[mode] || 0
	}

	function attack_targets_for_pieces(game, pieces, faction) {
		if (!Engine.combat || typeof Engine.combat.get_legal_attackable_spaces !== "function") return []
		return Engine.combat.get_legal_attackable_spaces(
			game,
			pieces,
			faction,
			() => Engine.game_utils.get_season(game),
			(space, side) => Engine.map.is_rail_connected_to_supply(game, space, side)
		)
	}

	function activation_piece_lists(game, s, faction, cache) {
		let moved = set_from(game.moved)
		let friendly = get_pieces_in_space(game, s).filter(
			(p) => data.pieces[p] && Engine.game_utils.get_piece_effective_faction(game, p) === faction
		)
		let available = friendly.filter((p) => {
			if (moved.has(p)) return false
			if (!Engine.game_utils.can_piece_be_activated(p)) return false
			return get_supply_status(game, p, cache) !== "OOS"
		})
		let move = available.filter((p) => piece_mf(p) > 0)
		let attack = available.filter((p) => {
			let status = get_supply_status(game, p, cache)
			if (Engine.map?.is_limited_supply_status && Engine.map.is_limited_supply_status(status)) return false
			if (typeof Engine.combat.can_activate_piece_in_space_to_attack !== "function") return false
			return Engine.combat.can_activate_piece_in_space_to_attack(
				game,
				p,
				s,
				faction,
				() => Engine.game_utils.get_season(game),
				(space, side) => Engine.map.is_rail_connected_to_supply(game, space, side)
			)
		})
		return { friendly, available, move, attack }
	}

	function activation_context(game, role, action, cache) {
		let [name, s] = action
		let faction = short_faction(role || game.active)
		let mode = activation_mode(name)
		let costs = Engine.map?.get_activation_cost_pair ? Engine.map.get_activation_cost_pair(game, s) : {}
		let lists = activation_piece_lists(game, s, faction, cache)
		let attack_targets = mode.startsWith("attack") ? attack_targets_for_pieces(game, lists.attack, faction) : []
		return {
			mode,
			space: s,
			cost: activation_cost(costs, mode),
			costs: {
				move: costs.move || 0,
				attack: costs.attack || 0,
				attack_with_br: costs.attack_with_br ?? null
			},
			remaining_ops: game.ops || 0,
			region_activation: Engine.map?.is_region ? Engine.map.is_region(game, s) : false,
			already_activated: {
				move: set_from(game.activated && game.activated.move).has(s),
				attack: set_from(game.activated && game.activated.attack).has(s),
				attack_egypt: set_from(game.activated && game.activated.attack_egypt).has(s)
			},
			pieces: {
				friendly: lists.friendly,
				available: lists.available,
				move_eligible: lists.move,
				attack_eligible: lists.attack
			},
			attack_targets,
			attack_target_count: attack_targets.length
		}
	}

	function movement_context(game, role, action, cache) {
		if (!game.move) return null
		let [name, arg] = action
		let faction = short_faction((game.move && game.move.faction) || role || game.active)
		let from = game.move.current || game.move.initial
		let destination = name === "space" ? arg : from
		let pieces = Array.isArray(game.move.pieces) ? game.move.pieces.slice() : []
		let step_cost = 0
		if (name === "space" && is_real_space(destination)) {
			for (let p of pieces) {
				if (!Engine.map?.can_piece_move_to || !Engine.map.can_piece_move_to(game, p, destination, faction)) continue
				let cost = Engine.map.get_movement_cost(game, p, destination)
				cost += Engine.map.get_enemy_fort_entry_extra_cost(game, destination, faction)
				step_cost = Math.max(step_cost, cost)
			}
		}
		return {
			initial: game.move.initial || null,
			current: from || null,
			destination: is_real_space(destination) ? destination : null,
			selected_pieces: pieces,
			dropped_piece: name === "piece" ? arg : null,
			spaces_moved: game.move.spaces_moved || 0,
			step_cost,
			would_stop: name === "stop",
			destination_space: is_real_space(destination) ? space_context(game, destination, faction, cache) : null
		}
	}

	function sr_context(game, role, action, cache) {
		let [name, destination] = action
		if (game.state !== "sr_move" || name !== "space") return null
		let p = game.sr_piece
		return {
			piece: p,
			from: game.pieces[p] || null,
			destination,
			piece_context: data.pieces[p] ? piece_context(game, p, cache) : null,
			destination_space: is_real_space(destination) ? space_context(game, destination, role, cache) : null
		}
	}

	function is_reserve_space(s) {
		return !!(Engine.map?.is_reserve_space && Engine.map.is_reserve_space(s))
	}

	function reserve_context(game, s, role, cache) {
		if (!is_reserve_space(s)) return null
		let info = data.spaces[s] || {}
		let faction = short_faction(role || game.active)
		let reserve_faction = short_faction(info.faction)
		return {
			raw_id: s,
			name: info.name || "Reserve",
			map: info.map || "Reserve Box",
			area: info.area || "",
			region: info.region || "",
			terrain: info.terrain || "",
			nation: info.nation || "",
			faction: reserve_faction,
			control: reserve_faction,
			friendly_controlled: reserve_faction === faction,
			enemy_controlled: reserve_faction === other_faction(faction),
			vp: 0,
			fort: 0,
			port: false,
			jihad_city: false,
			island_base: false,
			tribal_activity_grid: "",
			beachhead: false,
			fort_destroyed: false,
			fort_besieged: false,
			fort_owner: "neutral",
			reserve_box: true,
			stack: stack_summary(game, s, faction, cache)
		}
	}

	function sr_location_context(game, s, role, cache) {
		if (is_reserve_space(s)) return reserve_context(game, s, role, cache)
		return is_real_space(s) ? space_context(game, s, role, cache) : null
	}

	function normalize_sr_package(pkg) {
		if (Array.isArray(pkg)) {
			return {
				piece: pkg[0],
				destination: pkg.length > 1 ? pkg[1] : null
			}
		}
		if (pkg && typeof pkg === "object") {
			return {
				piece: pkg.piece,
				destination: pkg.destination
			}
		}
		return { piece: null, destination: null }
	}

	function sr_departure_context(game, piece, source, route, role) {
		let result = {
			sole_supply_piece_ids: [],
			sole_supply_piece_count: 0,
			non_balkan_beachhead: false,
			ottoman_port: false,
			jihad_increase: 0
		}
		if (role !== AP || !route?.sea_sr || !data.spaces[source]) return result
		result.non_balkan_beachhead = !!(
			Engine.map?.is_beachhead_space &&
			Engine.map.is_beachhead_space(game, source) &&
			Engine.map?.is_non_balkan_beachhead &&
			Engine.map.is_non_balkan_beachhead(source)
		)
		let source_info = data.spaces[source]
		result.ottoman_port = !!(
			source_info.port &&
			(source_info.nation === "tu" || source_info.nation === "tua")
		)
		if (
			!result.non_balkan_beachhead &&
			!result.ottoman_port
		) {
			return result
		}
		if (typeof Engine.map?.get_ap_units_supplied_solely_through_source !== "function") return result
		let pieces = Engine.map.get_ap_units_supplied_solely_through_source(game, source)
		result.sole_supply_piece_ids = pieces
		result.sole_supply_piece_count = pieces.length
		if (pieces.length === 1 && pieces[0] === piece) result.jihad_increase = 1
		return result
	}

	function sr_analysis(game, role, packages = [], options = null) {
		let acting_role = short_faction(role || game.active)
		let cache = create_supply_cache(game)
		let piece_legality = new Map()
		let piece_destinations = new Map()
		let piece_contexts = new Map()
		let location_contexts = new Map()
		let paid_costs = new Map()
		let get_piece_legality = (piece) => {
			if (!piece_legality.has(piece)) {
				piece_legality.set(
					piece,
					!!(
						data.pieces[piece] &&
						Engine.map?.can_sr_piece &&
						Engine.map.can_sr_piece(game, piece, acting_role, cache)
					)
				)
			}
			return piece_legality.get(piece)
		}
		let get_piece_destinations = (piece) => {
			if (!piece_destinations.has(piece)) {
				let destinations =
					get_piece_legality(piece) && Engine.map?.get_sr_destinations
						? Engine.map.get_sr_destinations(game, piece, acting_role, cache)
						: []
				piece_destinations.set(piece, new Set(destinations))
			}
			return piece_destinations.get(piece)
		}
		let get_piece_context = (piece) => {
			if (!piece_contexts.has(piece)) {
				piece_contexts.set(piece, data.pieces[piece] ? piece_context(game, piece, cache) : null)
			}
			return piece_contexts.get(piece)
		}
		let get_location_context = (space) => {
			if (!location_contexts.has(space)) {
				location_contexts.set(space, sr_location_context(game, space, acting_role, cache))
			}
			return location_contexts.get(space)
		}
		let get_paid_cost = (piece, source) => {
			if (!paid_costs.has(piece)) {
				let paid =
					data.pieces[piece] && Engine.map?.get_sr_cost_breakdown
						? Engine.map.get_sr_cost_breakdown(game, piece, source, null, acting_role, cache).total
						: data.pieces[piece] && Engine.map?.get_sr_cost
							? Engine.map.get_sr_cost(game, piece, source, null, acting_role, cache)
							: 0
				paid_costs.set(piece, paid)
			}
			return paid_costs.get(piece)
		}
		let records = packages.map((pkg) => {
			let { piece, destination } = normalize_sr_package(pkg)
			let source = data.pieces[piece] ? game.pieces[piece] : null
			let piece_legal = get_piece_legality(piece)
			let destination_legal = !!(
				piece_legal &&
				(Engine.map?.get_sr_destinations
					? get_piece_destinations(piece).has(destination)
					: Engine.map?.can_sr_to_space &&
						Engine.map.can_sr_to_space(game, piece, destination, acting_role))
			)
			let cost =
				data.pieces[piece] && Engine.map?.get_sr_cost_breakdown
					? Engine.map.get_sr_cost_breakdown(game, piece, source, destination, acting_role, cache)
					: {
							base:
								data.pieces[piece] && Engine.map?.get_sr_cost
									? Engine.map.get_sr_cost(game, piece, source, destination, acting_role, cache)
									: 0,
							disrupted_supply: 0,
							german_subs: 0,
							unrestricted_submarine_warfare: 0,
							surcharge: 0,
							total:
								data.pieces[piece] && Engine.map?.get_sr_cost
									? Engine.map.get_sr_cost(game, piece, source, destination, acting_role, cache)
									: 0
						}
			let route = Engine.map?.get_sr_route_context
				? Engine.map.get_sr_route_context(
						game,
						piece,
						source,
						destination,
						acting_role,
						{ include_overland_path: options?.include_route_path !== false }
					)
				: null
			let destination_stage = game.state === "sr_move" && game.sr_piece === piece
			let paid_cost = destination_stage ? get_paid_cost(piece, source) : 0
			let additional_cost = destination_stage ? Math.max(0, cost.total - paid_cost) : cost.total
			let decision_cost = additional_cost
			let available_sr = typeof game.sr === "number" ? game.sr : null
			return {
				piece,
				source,
				destination,
				cost: cost.total,
				cost_breakdown: cost,
				paid_cost,
				additional_cost,
				decision_cost,
				cost_stage: destination_stage ? "destination" : "package",
				available_sr,
				remaining_sr: available_sr,
				affordable: available_sr === null || decision_cost <= available_sr,
				piece_legal,
				destination_legal,
				source_reserve: is_reserve_space(source),
				destination_reserve: is_reserve_space(destination),
				route,
				departure: sr_departure_context(game, piece, source, route, acting_role),
				piece_context: get_piece_context(piece),
				source_space: get_location_context(source),
				destination_space: get_location_context(destination)
			}
		})
		return {
			schema: "pug-ai.sr_analysis.v1",
			state: game.state || "",
			active: short_faction(game.active),
			role: acting_role,
			package_count: records.length,
			packages: records
		}
	}

	function card_context(action) {
		let [name, card] = action
		if (name !== "card" && !name.startsWith("play_")) return null
		let info = data.cards && data.cards[card]
		if (!info) return { id: card }
		return {
			id: card,
			name: info.name || "",
			ops: info.ops || 0,
			ws: info.ws || 0,
			rp: info.rp || null
		}
	}

	function action_category(action_name) {
		if (ACTIVATION_ACTIONS.has(action_name)) return "activation"
		if (action_name === "space") return "space"
		if (action_name === "piece") return "piece"
		if (action_name === "card" || action_name.startsWith("play_")) return "card"
		return "command"
	}

	function context_for_action(game, role, action, cache) {
		let [name, arg] = action
		let category = action_category(name)
		let result = {
			action,
			category
		}
		if ((name === "space" || ACTIVATION_ACTIONS.has(name) || name === "deactivate") && is_real_space(arg)) {
			result.space = arg
			result.space_context = space_context(game, arg, role, cache)
		}
		if (name === "piece" && data.pieces[arg]) {
			result.piece = arg
			result.piece_context = piece_context(game, arg, cache)
			let s = game.pieces[arg]
			if (is_real_space(s) && !result.space_context) result.space_context = space_context(game, s, role, cache)
		}
		if (category === "activation") result.activation = activation_context(game, role, action, cache)
		if (game.state === "choose_pieces_to_move" || game.state === "move_stack") {
			result.movement = movement_context(game, role, action, cache)
		}
		let sr = sr_context(game, role, action, cache)
		if (sr) result.sr = sr
		let card = card_context(action)
		if (card) result.card = card
		return result
	}

	function candidate_context(game, role, actions = null, get_view = null) {
		let normalized_actions
		if (actions) {
			normalized_actions = actions.map(normalize_action)
		} else if (typeof get_view === "function") {
			normalized_actions = flatten_legal_actions(get_view(game, role || game.active))
		} else {
			normalized_actions = []
		}
		let cache = create_supply_cache(game)
		let active = short_faction(game.active)
		let acting_role = short_faction(role || game.active)
		let contexts = normalized_actions.map((action) => context_for_action(game, acting_role, action, cache))
		return {
			schema: "pug-ai.candidate_context.v1",
			state: game.state || "",
			active,
			role: acting_role,
			action_count: contexts.length,
			contexts
		}
	}

	function activation_analysis(game, role, actions = null, get_view = null) {
		let result = candidate_context(game, role, actions, get_view)
		let activation_contexts = result.contexts.filter((entry) => entry.category === "activation")
		let by_space = new Map()
		for (let entry of activation_contexts) {
			let s = entry.activation.space
			if (!by_space.has(s)) {
				by_space.set(s, {
					space: s,
					space_context: entry.space_context,
					modes: [],
					actions: []
				})
			}
			let record = by_space.get(s)
			record.modes.push(entry.activation.mode)
			record.actions.push(entry.action)
			record.activation = entry.activation
		}
		return {
			schema: "pug-ai.activation_analysis.v1",
			state: result.state,
			active: result.active,
			role: result.role,
			actions: activation_contexts,
			spaces: Array.from(by_space.values())
		}
	}

	return {
		candidate_context,
		activation_analysis,
		sr_analysis
	}
}
