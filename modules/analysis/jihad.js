"use strict"

/** Read-only Jihad position and candidate analysis for external AI clients. */
module.exports = function create_jihad_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const COUNTRIES = Object.freeze([
		["Egypt", "rebel_egypt", "jihad_revolt_egypt"],
		["India", "rebel_india", "jihad_revolt_india"],
		["Afghanistan", "rebel_afghanistan", "jihad_revolt_afghanistan"],
		["Central Asia", "rebel_central_asia", "jihad_revolt_central_asia"]
	])

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function short_faction(faction) {
		if (faction === AP || faction === "Allied Powers" || faction === "AP") return AP
		if (faction === CP || faction === "Central Powers" || faction === "CP") return CP
		return "neutral"
	}

	function set_from(value) {
		return new Set(Array.isArray(value) ? value : [])
	}

	function is_real_space(space) {
		let info = data.spaces[space]
		return !!(
			space > 0 &&
			info &&
			info.name !== undefined &&
			!info.type &&
			info.map !== "Reserve Box"
		)
	}

	function pieces_in_space(game, space) {
		return Engine.map.get_pieces_in_space(game, space)
	}

	function stack_counts(game, space) {
		let counts = {
			ap: { pieces: 0, regular: 0, irregular: 0, tribes: 0, cf: 0, lf: 0 },
			cp: { pieces: 0, regular: 0, irregular: 0, tribes: 0, cf: 0, lf: 0 },
			neutral: { pieces: 0, regular: 0, irregular: 0, tribes: 0, cf: 0, lf: 0 }
		}
		for (let piece of pieces_in_space(game, space)) {
			let faction = short_faction(Engine.game_utils.get_piece_effective_faction(game, piece))
			let bucket = counts[faction] || counts.neutral
			bucket.pieces += 1
			if (Engine.game_utils.is_regular(piece)) bucket.regular += 1
			if (Engine.game_utils.is_irregular(piece)) bucket.irregular += 1
			if (Engine.game_utils.is_tribe(piece)) bucket.tribes += 1
			bucket.cf += Engine.game_utils.get_piece_cf(game, piece) || 0
			bucket.lf += Engine.game_utils.get_piece_lf(game, piece) || 0
		}
		return counts
	}

	function space_context(game, space) {
		if (!is_real_space(space)) return null
		let info = data.spaces[space]
		let controller = short_faction(Engine.map.get_space_controller(game, space))
		return {
			raw_id: space,
			name: info.name || "",
			map: info.map || "",
			area: info.area || "",
			region: info.region || "",
			nation: info.nation || "",
			terrain: info.terrain || "",
			control: controller,
			ap_controlled: controller === AP,
			cp_controlled: controller === CP,
			vp: info.vp || 0,
			fort: info.fort || 0,
			port: !!info.port,
			jihad_city: !!info.jihad_city,
			tribal_activity_grid: info.tribal_activity_grid || "",
			pieces: pieces_in_space(game, space),
			counts: stack_counts(game, space),
			jihad_effective_owner: info.jihad_city
				? short_faction(Engine.jihad.get_jihad_city_effective_owner(game, space))
				: null,
			jihad_scoring_owner: info.jihad_city
				? short_faction(Engine.jihad.get_jihad_city_scoring_owner(game, space))
				: null,
			jihad_flipped_once: set_from(game.jihad_cities_flipped).has(space)
		}
	}

	function piece_context(game, piece) {
		let info = data.pieces[piece] || {}
		let location = game.pieces[piece]
		return {
			id: piece,
			name: info.name || "",
			faction: short_faction(info.faction),
			nation: info.nation || "",
			type: info.type || "",
			tribe_type: Engine.jihad.get_tribe_type(piece) || "",
			cf: Engine.game_utils.get_piece_cf(game, piece) || 0,
			lf: Engine.game_utils.get_piece_lf(game, piece) || 0,
			mf: Engine.map.get_piece_mf(piece) || 0,
			reduced: Engine.game_utils.is_piece_reduced(game, piece),
			location,
			on_map: !Engine.game_utils.is_not_on_map(game, piece),
			in_reserve: Engine.game_utils.is_in_reserve(game, piece),
			in_reinforcements: Engine.game_utils.is_reinforcement(game, piece),
			eliminated: Engine.game_utils.is_eliminated(game, piece),
			removed: Engine.game_utils.is_removed(game, piece)
		}
	}

	function all_tribes(game) {
		let result = []
		for (let piece = 0; piece < (game.pieces || []).length; piece++) {
			if (Engine.game_utils.is_tribe(piece)) result.push(piece_context(game, piece))
		}
		return result
	}

	function tribe_summary(game) {
		let tribes = all_tribes(game)
		let by_type = new Map()
		for (let tribe of tribes) {
			let type = tribe.tribe_type || "unknown"
			if (!by_type.has(type)) {
				by_type.set(type, {
					type,
					total: 0,
					on_map: 0,
					available: 0,
					reserve: 0,
					reinforcements: 0,
					eliminated: 0,
					removed: 0,
					pieces: [],
					placement_spaces: []
				})
			}
			let row = by_type.get(type)
			row.total += 1
			row.pieces.push(tribe.id)
			if (tribe.on_map) row.on_map += 1
			if (tribe.in_reserve) row.reserve += 1
			if (tribe.in_reinforcements) row.reinforcements += 1
			if (tribe.eliminated) row.eliminated += 1
			if (tribe.removed) row.removed += 1
			if (Engine.jihad.can_select_tribe_for_jihad_placement(game, tribe.id)) row.available += 1
		}
		for (let row of by_type.values()) {
			row.placement_spaces = data.spaces
				.map((info, space) => ({ info, space }))
				.filter(({ info, space }) =>
					space > 0 &&
					info &&
					!info.type &&
					info.tribal_activity_grid === row.type
				)
				.map(({ space }) => space)
		}
		let on_map = tribes.filter((tribe) => tribe.on_map).length
		return {
			total: tribes.length,
			on_map,
			available: tribes.filter((tribe) =>
				Engine.jihad.can_select_tribe_for_jihad_placement(game, tribe.id)
			).length,
			level_limit: Number(game.jihad || 0),
			difference_to_level: Number(game.jihad || 0) - on_map,
			pieces: tribes,
			by_type: Array.from(by_type.values()).sort((a, b) => a.type.localeCompare(b.type))
		}
	}

	function city_summary(game) {
		let cities = []
		for (let space = 1; space < data.spaces.length; space++) {
			if (data.spaces[space]?.jihad_city) cities.push(space_context(game, space))
		}
		return cities
	}

	function success_rolls(level, target) {
		let rolls = []
		for (let roll = 1; roll <= 6; roll++) {
			if (roll + level >= target) rolls.push(roll)
		}
		return rolls
	}

	function indian_risk(game) {
		let result = { kill_roll_units: [], already_eliminated_units: [], unaffected_units: [] }
		let reserve = Engine.game_utils.get_scu_reserve_box(AP)
		for (let piece = 0; piece < (game.pieces || []).length; piece++) {
			if (Engine.game_utils.get_piece_nation(piece) !== "in") continue
			if (Engine.game_utils.is_removed(game, piece)) continue
			if (Engine.game_utils.is_eliminated(game, piece)) {
				result.already_eliminated_units.push(piece)
			} else if (game.pieces[piece] === reserve || is_real_space(game.pieces[piece])) {
				result.kill_roll_units.push(piece)
			} else {
				result.unaffected_units.push(piece)
			}
		}
		return result
	}

	function revolt_reward(game, country) {
		let result = {
			jihad_delta: country === "Egypt" || country === "India" ? 2 : 1,
			uprising_units: country === "Central Asia" ? 1 : 3,
			control_change: country === "Afghanistan",
			india: null
		}
		if (country === "India") result.india = indian_risk(game)
		return result
	}

	function revolt_summary(game, legal_actions) {
		let level = Number(game.jihad || 0)
		let entered = set_from(game.entered_regions_this_turn)
		return COUNTRIES.map(([country, action, flag]) => {
			let prerequisite = Engine.jihad.has_jihad_prereq(game, country)
			let completed = !!game[flag]
			let cp_regular_present = Engine.jihad.has_cp_regular_in_country(game, country)
			let target = Engine.jihad.get_jihad_revolt_target(game, country, false)
			let immediate_target = Engine.jihad.get_jihad_revolt_target(game, country, true)
			let rolls = success_rolls(level, target)
			let immediate_rolls = success_rolls(level, immediate_target)
			return {
				country,
				action,
				prerequisite,
				completed,
				selectable: prerequisite && !completed && legal_actions.has(action),
				cp_regular_present,
				entered_this_turn: entered.has(country),
				target,
				immediate_target,
				die_needed: target - level,
				success_rolls: rolls,
				success_faces: rolls.length,
				success_probability: rolls.length / 6,
				immediate_success_rolls: immediate_rolls,
				immediate_success_probability: immediate_rolls.length / 6,
				reward: revolt_reward(game, country)
			}
		})
	}

	function legal_action_set(view) {
		let result = new Set()
		for (let [name, value] of Object.entries(view.actions || {})) {
			if (value === 1 || (Array.isArray(value) && value.length > 0)) result.add(name)
		}
		return result
	}

	function is_legal_action(view, action) {
		let [name, arg] = action
		let options = (view.actions || {})[name]
		if (Array.isArray(options)) return options.includes(arg)
		return options === 1 && (arg === null || arg === undefined)
	}

	function simulate_sequence(source, role, sequence, apply_action, get_view) {
		let game = clone_game(source)
		let before_level = Number(game.jihad || 0)
		let before_place = Number(game.tribes_to_place || 0)
		let before_remove = Number(game.tribes_to_remove || 0)
		for (let index = 0; index < sequence.length; index++) {
			let acting_role = short_faction(game.active || role)
			let view = get_view(game, acting_role)
			if (!is_legal_action(view, sequence[index])) {
				return { valid: false, error: { type: "illegal_action", step: index, action: sequence[index] } }
			}
			game = apply_action(game, acting_role, sequence[index][0], sequence[index][1])
		}
		return {
			valid: true,
			game,
			state_after: game.state || "",
			active_after: short_faction(game.active),
			jihad_delta: Number(game.jihad || 0) - before_level,
			tribes_to_place_delta: Number(game.tribes_to_place || 0) - before_place,
			tribes_to_remove_delta: Number(game.tribes_to_remove || 0) - before_remove
		}
	}

	function placement_packages(game, role, apply_action, get_view) {
		if (game.state !== "jihad_placement") return []
		let selected = game.selected_piece
		let pieces = []
		if (selected !== null && selected !== undefined) {
			pieces = [selected]
		} else {
			for (let piece = 0; piece < (game.pieces || []).length; piece++) {
				if (Engine.jihad.can_select_tribe_for_jihad_placement(game, piece)) pieces.push(piece)
			}
		}
		let packages = []
		for (let piece of pieces) {
			for (let space = 1; space < data.spaces.length; space++) {
				if (!data.spaces[space] || data.spaces[space].type) continue
				if (!Engine.jihad.can_place_tribe_in_jihad_space(game, piece, space)) continue
				let sequence = selected === piece ? [["space", space]] : [["piece", piece], ["space", space]]
				let simulation = simulate_sequence(game, role, sequence, apply_action, get_view)
				let record = {
					piece,
					destination: space,
					sequence,
					valid: simulation.valid,
					piece_context: piece_context(game, piece),
					destination_before: space_context(game, space),
					error: simulation.error || null
				}
				if (simulation.valid) {
					record.destination_after = space_context(simulation.game, space)
					record.state_after = simulation.state_after
					record.active_after = simulation.active_after
					record.jihad_delta = simulation.jihad_delta
					record.tribes_to_place_delta = simulation.tribes_to_place_delta
				}
				packages.push(record)
			}
		}
		return packages
	}

	function removal_candidates(game, role, view, apply_action, get_view) {
		if (game.state !== "jihad_removal") return []
		let pieces = Array.isArray(view.actions?.piece) ? view.actions.piece : []
		return pieces.map((piece) => {
			let from = game.pieces[piece]
			let simulation = simulate_sequence(game, role, [["piece", piece]], apply_action, get_view)
			return {
				piece,
				from,
				valid: simulation.valid,
				piece_context: piece_context(game, piece),
				space_before: space_context(game, from),
				state_after: simulation.state_after || null,
				active_after: simulation.active_after || null,
				jihad_delta: simulation.jihad_delta || 0,
				tribes_to_remove_delta: simulation.tribes_to_remove_delta || 0,
				error: simulation.error || null
			}
		})
	}

	function jihad_analysis(game, role, apply_action = null, get_view = null) {
		if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
		if (typeof get_view !== "function") throw new Error("get_view callback is required")
		let acting_role = short_faction(role || game.active)
		let source = clone_game(game)
		let view = get_view(source, acting_role)
		let legal_actions = legal_action_set(view)
		return {
			schema: "pug-ai.jihad_analysis.v1",
			state: source.state || "",
			active: short_faction(source.active),
			role: acting_role,
			level: Number(source.jihad || 0),
			pending: {
				placements: Number(source.tribes_to_place || 0),
				removals: Number(source.tribes_to_remove || 0),
				selected_piece: source.selected_piece ?? null
			},
			tribes: tribe_summary(source),
			cities: city_summary(source),
			revolts: revolt_summary(source, legal_actions),
			placement_packages: placement_packages(source, acting_role, apply_action, get_view),
			removal_candidates: removal_candidates(source, acting_role, view, apply_action, get_view)
		}
	}

	return { jihad_analysis }
}
