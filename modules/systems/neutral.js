"use strict"

module.exports = function (Engine) {
	const { data, game_utils } = Engine
	const exports = {}
	const { AP, CP } = Engine.constants
	const { set_add } = Engine.utils
	const { find_space } = game_utils
	const SUPPORTED_NEUTRAL_NATIONS = new Set(["gr", "bu", "sb", "ro"])
	const SOFIA = find_space("SOFIA")
	const BUCHAREST = find_space("BUCHAREST")
	const ODESSA = find_space("Odessa")
	const LEMNOS = find_space("Lemnos")
	const SALONIKA = find_space("Salonika")
	const ATHENS = find_space("ATHENS")
	const FORT_RUPEL = find_space("Ft. Rupel")
	const BELGRADE = find_space("BELGRADE")
	const NIS = find_space("Nis")
	const NEUTRAL_PERSIA_FIRST_ENTRY_PENALTY = "neutral_persia_first_entry_penalty"

	function space_log_name(s) {
		if (!data.spaces[s]) return "Unknown Space (" + s + ")"
		return `s${s}`
	}

	function piece_log_name(game, p) {
		if (!data.pieces[p]) return "Unknown Unit (" + p + ")"
		return game_utils.is_piece_reduced(game, p) ? `p${p}` : `P${p}`
	}

	function apply_entry_piece_state(game, p, options = {}) {
		if (options.reduced) {
			if (!Array.isArray(game.reduced)) game.reduced = []
			set_add(game.reduced, p)
		}
	}

	function normalize_greece_faction(value) {
		if (value === AP || value === CP) return value
		if (value === true) return AP
		if (value === "AP") return AP
		if (value === "CP") return CP
		return null
	}

	function normalize_nation_faction(value) {
		if (value === AP || value === CP) return value
		if (value === "ap" || value === "AP") return AP
		if (value === "cp" || value === "CP") return CP
		return null
	}

	function is_supported_neutral_nation(nation) {
		return SUPPORTED_NEUTRAL_NATIONS.has(nation)
	}

	function get_greece_faction(game) {
		if (!game || !game.events) return null
		return normalize_greece_faction(game.events["greece"])
	}

	function get_nation_faction(game, nation) {
		if (!game || !game.events) return null
		switch (nation) {
			case "gr":
				return get_greece_faction(game)
			case "bu":
				return game.events["bulgaria"] ? CP : null
			case "sb":
				return game.events["bulgaria"] ? AP : null
			case "ro":
				return game.events["romania"] ? AP : null
			default:
				return null
		}
	}

	function set_greece_faction(game, faction) {
		if (!game.events) game.events = {}
		let normalized = normalize_greece_faction(faction)
		if (!normalized) return false
		game.events["greece"] = normalized
		return true
	}

	function is_greece_neutral(game) {
		return get_greece_faction(game) === null
	}

	function is_nation_neutral(game, nation) {
		if (!is_supported_neutral_nation(nation)) return false
		return get_nation_faction(game, nation) === null
	}

	function is_athens_space(s) {
		let info = data.spaces[s]
		if (!info) return false
		return info.name === "Athens" || info.name === "ATHENS"
	}

	function is_salonika_space(s) {
		let info = data.spaces[s]
		if (!info) return false
		return info.name === "Salonika" || info.name === "SALONIKA"
	}

	function can_set_control(game, s, faction, options = {}) {
		let info = data.spaces[s]
		if (!info || info.nation !== "gr" || !is_greece_neutral(game)) return true
		if (faction !== AP && faction !== CP) return true

		if (options.greece_entry && is_athens_space(s)) return true

		// Rule 19.2.5: neutral Salonika may become an AP-controlled port.
		if (faction === AP && is_salonika_space(s)) return true

		// TREACHERY AT FORT RUPEL explicitly transfers the fort to CP control.
		// Once transferred, it remains an ordinary contested control space.
		if (s === FORT_RUPEL && game.events && game.events["rupel"]) return true

		return false
	}

	function should_trigger_greece_entry_on_beachhead(game, space_id, faction) {
		if (!is_greece_neutral(game)) return false
		if (faction === AP && is_athens_invasion_beachhead(space_id)) return true
		if (data.spaces[space_id].nation !== "gr") return false
		return !(faction === AP && is_salonika_space(space_id))
	}

	function get_beachhead_landing_space(space_id) {
		let info = data.spaces[space_id]
		if (!info || !info.beach_for || !Array.isArray(info.connections)) return -1
		let island_base = find_space(info.beach_for)
		for (let adjacent of info.connections) {
			if (adjacent !== island_base) return adjacent
		}
		return -1
	}

	function is_athens_invasion_beachhead(space_id) {
		return is_athens_space(get_beachhead_landing_space(space_id))
	}

	function get_neutral_greece_violation_ally(faction) {
		return Engine.utils.other_faction(faction)
	}

	function is_syrian_politics_beachhead(space_id) {
		let landing_space = get_beachhead_landing_space(space_id)
		return !!(
			landing_space > 0 &&
			data.spaces[landing_space] &&
			data.spaces[landing_space].area === "syria_palestine"
		)
	}

	function apply_syrian_politics_penalty(game, space_id, faction) {
		if (faction !== AP) return
		if (!is_syrian_politics_beachhead(space_id)) return
		if (!game.events) game.events = {}
		if (game.events["syrian_politics_penalty"]) return

		game.events["syrian_politics_penalty"] = true
		game.vp = (game.vp || 0) + 1
		Engine.log(game, `叙利亚政治：首次在 ${space_log_name(space_id)} 建立叙利亚相邻滩头，CP +1 VP。`)
		Engine.update_jihad_level(game, 1)
	}

	function violates_neutral_greece_movement_restriction(game, p, target, faction, total_cost) {
		const { map } = Engine
		if (!is_greece_neutral(game)) return false
		if (is_greek_piece(p)) return false
		if (is_athens_space(target)) return true
		if (faction === AP) {
			if (!has_neutral_greek_blocking_units_in_space(game, target)) return false
			let mf = map.get_piece_mf(p)
			let remaining = mf - total_cost
			return remaining <= 0
		}
		if (faction === CP) {
			if (data.spaces[target].nation === "gr") {
				if (has_neutral_greek_blocking_units_in_space(game, target)) return true
			}
		}
		return false
	}

	function can_end_move_in_neutral_greece(game, p, target, faction) {
		if (!is_greece_neutral(game)) return true
		if (is_greek_piece(p)) return true
		if (is_athens_space(target)) return false
		if (faction === AP) {
			if (has_neutral_greek_blocking_units_in_space(game, target)) return false
		}
		if (faction === CP) {
			if (data.spaces[target].nation === "gr") {
				if (has_neutral_greek_blocking_units_in_space(game, target)) return false
			}
		}
		return true
	}

	function is_greek_cnd(p) {
		return data.pieces[p] && data.pieces[p].name === "GR National Defense"
	}

	function is_greek_piece(p) {
		return data.pieces[p] && data.pieces[p].nation === "gr"
	}

	function is_greek_controlled_by_faction(game, faction) {
		return get_greece_faction(game) === faction
	}

	function is_nation_controlled_by_faction(game, nation, faction) {
		return get_nation_faction(game, nation) === faction
	}

	function has_nation_entered(game, nation) {
		return get_nation_faction(game, nation) !== null
	}

	function has_greek_units_in_space(game, s) {
		const { map } = Engine
		return map.get_pieces_in_space(game, s).some((p) => is_greek_piece(p))
	}

	function has_neutral_greek_blocking_units_in_space(game, s) {
		const { map } = Engine
		return map.get_pieces_in_space(game, s).some((p) => is_greek_piece(p) && !is_greek_cnd(p))
	}

	function can_move_piece_for_faction(game, p, faction) {
		if (!is_greek_piece(p)) return false
		if (is_greek_cnd(p) && faction === AP) return true
		return is_greek_controlled_by_faction(game, faction)
	}

	function can_attack_piece_for_faction(game, p, faction) {
		if (!is_greek_piece(p)) return false
		if (is_greek_cnd(p) && faction === AP) return true
		return is_greek_controlled_by_faction(game, faction)
	}

	function is_on_bulgaria_entry_display(game, p) {
		if (!game || !Engine.collapse || typeof Engine.collapse.get_bulgaria_entry_plan !== "function") return false
		let info = data.pieces[p]
		if (!info) return false
		let plan = Engine.collapse.get_bulgaria_entry_plan()
		for (let side of [plan.cp, plan.ap]) {
			if (!side || !Array.isArray(side.placements)) continue
			for (let entry of side.placements) {
				if (entry.name !== info.name) continue
				return game.pieces[p] === get_entry_space_id(info.faction, entry.space)
			}
		}
		return false
	}

	function get_piece_effective_faction_override(game, p) {
		let info = data.pieces[p]
		if (!info) return undefined
		if (
			game &&
			game.events &&
			game.events["romania"] &&
			Engine.collapse &&
			typeof Engine.collapse.is_romanian_entry_piece === "function" &&
			Engine.collapse.is_romanian_entry_piece(info)
		) {
			return undefined
		}
		if (Engine.collapse && typeof Engine.collapse.is_bulgarian_entry_piece === "function") {
			if (
				Engine.collapse.is_bulgarian_entry_piece(info) &&
				!(game && game.events && game.events["bulgaria"]) &&
				is_on_bulgaria_entry_display(game, p)
			) {
				return "neutral"
			}
		}
		if (!is_supported_neutral_nation(info.nation)) return undefined
		if (info.nation === "gr") {
			if (is_greek_cnd(p)) return AP
			let greece_faction = get_greece_faction(game)
			if (greece_faction) return greece_faction
			return "neutral"
		}
		let nation_faction = get_nation_faction(game, info.nation)
		return nation_faction || "neutral"
	}

	function can_piece_participate_for_faction(game, p, faction, mode = "move") {
		let info = data.pieces[p]
		if (!info) return false
		let override = get_piece_effective_faction_override(game, p)
		if (override === undefined) return true
		if (override === "neutral") return false
		if (info.nation !== "gr") return override === faction
		if (mode === "attack") return can_attack_piece_for_faction(game, p, faction)
		return can_move_piece_for_faction(game, p, faction)
	}

	function get_space_default_controller(game, s) {
		let info = data.spaces[s]
		if (!info || info.faction !== "neutral") return null
		let nation_faction = get_nation_faction(game, info.nation)
		return normalize_nation_faction(nation_faction)
	}

	function can_piece_enter_neutral_space(game, p, s) {
		let piece = data.pieces[p]
		let space = data.spaces[s]
		if (!piece || !space || space.faction !== "neutral") return undefined
		let nation = space.nation
		if (nation === "gr") {
			if (is_athens_space(s) && is_greece_neutral(game)) return false
			return !(piece.faction === CP && is_greece_neutral(game) && has_neutral_greek_blocking_units_in_space(game, s))
		}
		if (!is_supported_neutral_nation(nation)) return undefined
		return has_nation_entered(game, nation)
	}

	function get_neutral_greece_supply_access(game, s, faction) {
		const { map } = Engine
		if (!is_greece_neutral(game)) return null
		if (data.spaces[s].nation !== "gr") return null
		let pieces = map.get_pieces_in_space(game, s)
		if (pieces.length === 0) return faction === AP || faction === CP ? "transit" : "blocked"
		if (faction === AP && pieces.every((p) => is_greek_piece(p))) return "transit"
		if (pieces.some((p) => game_utils.get_piece_effective_faction(game, p) === faction)) return "terminal"
		return "blocked"
	}

	function is_neutral_greece_supply_passable(game, s, faction) {
		return get_neutral_greece_supply_access(game, s, faction) === "transit"
	}

	function is_persian_supply_unit(p) {
		let info = data.pieces[p]
		if (!info) return false
		if (info.nation === "pe") return true
		return (
			info.name === "BR/PE SPers Rifles" ||
			info.name === "RU/PE Police North" ||
			info.name === "PE/RU Persian Cossacks" ||
			(info.name && (info.name.startsWith("RU/PE") || info.name.startsWith("PE/RU")))
		)
	}

	function has_persian_home_supply_privilege(_game, p, space_id) {
		if (!is_persian_supply_unit(p)) return false
		return !!(
			Engine.map &&
			typeof Engine.map.is_greater_persia === "function" &&
			Engine.map.is_greater_persia(space_id)
		)
	}

	// PE home supply stays FULL so Persian units can operate inside uprising-marked Persia.
	function home_supply_privilege_ignores_disruption(game, p, space_id, _faction) {
		return has_persian_home_supply_privilege(game, p, space_id)
	}

	function has_home_supply_privilege(game, p, space_id, _faction) {
		let piece = data.pieces[p]
		let space = data.spaces[space_id]
		if (!piece || !space) return false
		if (has_persian_home_supply_privilege(game, p, space_id)) return true
		let nations =
			typeof game_utils.get_piece_nations_for_rule === "function"
				? game_utils.get_piece_nations_for_rule(game, p)
				: [piece.nation]
		if (!nations.includes(space.nation)) return false

		switch (space.nation) {
			case "gr":
				// Rule 19.2.4 applies to Greek units only, not every AP unit inside neutral Greece.
				return true
			case "sb":
				// Rule 19.4.2 ends this privilege after Serbian Collapse.
				return !(
					Engine.collapse &&
					typeof Engine.collapse.has_serbia_collapsed === "function" &&
					Engine.collapse.has_serbia_collapsed(game)
				)
			default:
				return false
		}
	}

	function is_supply_trace_source_friendly_for_piece(game, space_id, faction, nation) {
		let space = data.spaces[space_id]
		if (!space || faction !== AP) return false

		// Rule 19.4.2: Serbian units may trace from any Serbian space before collapse.
		if (nation === "sb" && space.nation === "sb") {
			return !(
				Engine.collapse &&
				typeof Engine.collapse.has_serbia_collapsed === "function" &&
				Engine.collapse.has_serbia_collapsed(game)
			)
		}

		return false
	}

	function has_home_supply_for_attrition(game, space_id, faction) {
		let space = data.spaces[space_id]
		if (!space) return false

		if (space.nation === "sb") {
			return (
				faction === AP &&
				get_nation_faction(game, "sb") === AP &&
				!(
					Engine.collapse &&
					typeof Engine.collapse.has_serbia_collapsed === "function" &&
					Engine.collapse.has_serbia_collapsed(game)
				)
			)
		}

		if (space.nation === "gr") {
			return get_nation_faction(game, "gr") === faction
		}

		return false
	}

	function can_rebuild_balkan_unit_in_space(game, p, space_id, _faction) {
		const { map } = Engine
		let piece = data.pieces[p]
		let space = data.spaces[space_id]
		if (!piece || !space) return undefined
		if (!is_supported_neutral_nation(piece.nation)) return undefined

		let ap_controlled = map.is_controlled_by(game, space_id, AP)
		let cp_controlled = map.is_controlled_by(game, space_id, CP)
		let besieged = map.is_besieged(game, space_id)

		switch (piece.nation) {
			case "ro":
				// Rules 19.5.4 / 22.2.2
				return (
					(space_id === BUCHAREST || space_id === ODESSA) &&
					ap_controlled &&
					!besieged &&
					!(Engine.collapse && Engine.collapse.has_romania_collapsed(game))
				)
			case "bu":
				// Rule 22.2.2
				return space_id === SOFIA && cp_controlled
			case "gr": {
				// Rule 22.2.2, with the CND exception.
				if (is_greek_cnd(p)) {
					return (
						space_id === LEMNOS ||
						(map.is_aegean_east_med_port(space_id) && space.nation === "gr" && ap_controlled && !besieged)
					)
				}
				if (space.nation !== "gr" || besieged) return false
				let greek_faction = game_utils.get_piece_effective_faction(game, p)
				if (greek_faction !== AP && greek_faction !== CP) return false
				let friendly_controlled = greek_faction === CP ? cp_controlled : ap_controlled
				return map.get_pieces_in_space(game, space_id).length === 0 || friendly_controlled
			}
			case "sb": {
				// Rule 19.4.4 before collapse and after The Serbs Return.
				let serbia_collapsed =
					Engine.collapse &&
					typeof Engine.collapse.has_serbia_collapsed === "function" &&
					Engine.collapse.has_serbia_collapsed(game)
				let serbs_return = !!(game.events && game.events["the_serbs_return"])
				let belgrade_recaptured = BELGRADE >= 0 && map.is_controlled_by(game, BELGRADE, AP)
				let can_use_port = !besieged && (space_id === LEMNOS || (space_id === SALONIKA && ap_controlled))
				let can_use_serbia_cities = (space_id === BELGRADE || space_id === NIS) && ap_controlled && !besieged

				if (!serbia_collapsed) return can_use_port || can_use_serbia_cities
				if (!serbs_return) return false
				if (belgrade_recaptured) return can_use_port || can_use_serbia_cities
				return can_use_port
			}
			default:
				return undefined
		}
	}

	function on_piece_rebuilt(game, p, space_id) {
		if (!is_greek_piece(p)) return false
		let space = data.spaces[space_id]
		if (!space || space.nation !== "gr") return false

		let faction = game_utils.get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) return false
		if (Engine.map.is_controlled_by(game, space_id, faction)) return false

		Engine.set_control(game, space_id, faction)
		return true
	}

	function check_constantine_entry_conditions(game) {
		const { map } = Engine
		let larissa = find_space("Larissa")
		if (
			larissa >= 0 &&
			map
				.get_pieces_in_space(game, larissa)
				.some((p) => Engine.game_utils.get_piece_effective_faction(game, p) === CP)
		) {
			return true
		}
		let belgrade = find_space("Belgrade")
		let skopje = find_space("Skopje")
		let balkan_vp_spaces = []
		for (let s = 1; s < data.spaces.length; s++) {
			let info = data.spaces[s]
			if (info.vp && info.region === "Balkans" && info.nation !== "gr" && s !== belgrade && s !== skopje) {
				balkan_vp_spaces.push(s)
			}
		}
		return !!(balkan_vp_spaces.length > 0 && balkan_vp_spaces.every((s) => !map.is_controlled_by(game, s, AP)))
	}

	function is_athens_occupied_by_enemy_of_greek_ally(game, faction) {
		if (ATHENS < 0 || !data.spaces[ATHENS]) return false
		let enemy = faction === AP ? CP : AP
		return Engine.map.get_pieces_in_space(game, ATHENS).some((p) => {
			return Engine.game_utils.get_piece_effective_faction(game, p) === enemy
		})
	}

	function apply_greek_entry_athens_control(game, faction) {
		if (ATHENS < 0 || !data.spaces[ATHENS]) return
		if (is_athens_occupied_by_enemy_of_greek_ally(game, faction)) return
		Engine.set_control(game, ATHENS, faction, { greece_entry: true })
	}

	function align_greek_trench_owners_on_entry(game, faction) {
		let enemy = faction === AP ? CP : AP
		for (let s = 1; s < data.spaces.length; s++) {
			if (!data.spaces[s] || data.spaces[s].nation !== "gr") continue
			if (game_utils.has_trench(game, s) <= 0) continue

			let has_enemy_occupier = Engine.map.get_pieces_in_space(game, s).some((p) => {
				let info = data.pieces[p]
				if (!info || info.nation === "gr") return false
				let piece_faction = game_utils.get_piece_effective_faction(game, p)
				if (piece_faction !== AP && piece_faction !== CP) piece_faction = info.faction
				return piece_faction === enemy
			})
			if (!has_enemy_occupier) game_utils.set_trench_owner(game, s, faction)
		}
	}

	function trigger_greece_entry(game, target, entering_faction, reason, log_fn) {
		if (!is_greece_neutral(game)) return false
		if (game && game.event_ctx && game.event_ctx.key === "rupel") return false
		apply_greek_entry_athens_control(game, entering_faction)
		set_greece_faction(game, entering_faction)
		align_greek_trench_owners_on_entry(game, entering_faction)
		game.entry_gr = true
		if (typeof log_fn === "function") {
			log_fn(
				`希腊加入${entering_faction === AP ? "协约国" : "同盟国"}阵营（${reason}${target ? " " + space_log_name(target) : ""}）`
			)
		}

		change_neutral_control(game, "gr", entering_faction)

		return true
	}

	function place_entry_units(game, faction, instructions) {
		let { game_utils } = Engine
		let log_fn = (msg) => Engine.log(game, msg)
		for (let inst of instructions) {
			let { space, units } = inst
			let space_id = -1
			if (space === "RESERVE") {
				space_id = game_utils.get_reserve_box(faction)
			} else {
				space_id = game_utils.find_space(space)
			}
			if (space_id < 0) continue
			for (let unit_name of units) {
				let p = game_utils.find_piece(faction, unit_name)
				if (p >= 0 && game_utils.is_not_on_map(game, p)) {
					game.pieces[p] = space_id
					log_fn(`部署 ${piece_log_name(game, p)} 至 ${space === "RESERVE" ? "预备格" : space_log_name(space_id)}`)
				}
			}
		}
	}

	function get_entry_space_id(faction, space) {
		let { game_utils } = Engine
		if (space === "RESERVE") return game_utils.get_reserve_box(faction)
		return game_utils.find_space(space)
	}

	function place_bulgaria_third_army(game, space) {
		let { game_utils } = Engine
		let plan =
			Engine.collapse && typeof Engine.collapse.get_bulgaria_entry_plan === "function"
				? Engine.collapse.get_bulgaria_entry_plan()
				: null
		let cp_plan = plan && plan.cp ? plan.cp : {}
		let unit_name = cp_plan.third_army_name || "BU 3 Army"
		let default_space = cp_plan.third_army_default_space || "Rustchuk"
		let target_space = space || default_space
		if (target_space !== default_space) return false
		let p = game_utils.find_piece(CP, unit_name)
		let space_id = get_entry_space_id(CP, target_space)
		if (p < 0 || space_id < 0) return false

		let current_space = game.pieces[p]
		let can_reposition_existing = current_space === space_id

		if (!game_utils.is_not_on_map(game, p) && !can_reposition_existing) return false
		if (!Array.isArray(game.reduced)) game.reduced = []
		set_add(game.reduced, p)
		if (current_space !== space_id) {
			game.pieces[p] = space_id
			Engine.log(game, `部署 ${piece_log_name(game, p)} 至 ${space_log_name(space_id)}`)
		}
		return true
	}

	function place_romania_combined_bu_ah(game, space) {
		let { game_utils } = Engine
		let plan =
			Engine.collapse && typeof Engine.collapse.get_romanian_entry_plan === "function"
				? Engine.collapse.get_romanian_entry_plan()
				: null
		let cp_plan = plan && plan.cp ? plan.cp : {}
		let unit_name = cp_plan.combined_bu_ah_name || "Combined BU/AH Div"
		let target_space = space || cp_plan.combined_bu_ah_default_space || "CP Reserve"
		let p = game_utils.find_piece(CP, unit_name)
		let space_id = get_entry_space_id(CP, target_space)
		if (p < 0 || space_id < 0) return false

		let choice_space_names = Array.isArray(cp_plan.combined_bu_ah_choice_spaces)
			? cp_plan.combined_bu_ah_choice_spaces
			: [cp_plan.combined_bu_ah_default_space || "CP Reserve"]
		let choice_space_ids = choice_space_names.map((name) => get_entry_space_id(CP, name)).filter((s) => s >= 0)
		let current_space = game.pieces[p]
		let can_reposition_existing = choice_space_ids.includes(current_space)

		if (!game_utils.is_not_on_map(game, p) && !can_reposition_existing) return false
		if (current_space !== space_id) {
			game.pieces[p] = space_id
			Engine.log(game, `部署 ${piece_log_name(game, p)} 至 ${space_log_name(space_id)}`)
		}
		return true
	}

	function place_named_entry_piece(game, faction, unit_name, space, options = {}) {
		let { game_utils } = Engine
		if (options.skip_if_event && game.events && game.events[options.skip_if_event]) return false
		let p = game_utils.find_piece(faction, unit_name)
		let space_id = get_entry_space_id(faction, space)
		if (p < 0 || space_id < 0) return false
		if (
			options.unlock_bulgaria_display &&
			Engine.collapse &&
			typeof Engine.collapse.is_bulgarian_entry_piece === "function" &&
			Engine.collapse.is_bulgarian_entry_piece(data.pieces[p]) &&
			!(game.events && game.events["bulgaria"]) &&
			!game_utils.is_eliminated(game, p) &&
			!game_utils.is_removed(game, p) &&
			!game_utils.is_reinforcement(game, p)
		) {
			apply_entry_piece_state(game, p, options)
			if (game.pieces[p] !== space_id) {
				game.pieces[p] = space_id
				Engine.log(game, `部署 ${piece_log_name(game, p)} 至 ${space === "RESERVE" ? "预备格" : space_log_name(space_id)}`)
			}
			return true
		}
		if (!game_utils.is_not_on_map(game, p)) return false
		apply_entry_piece_state(game, p, options)
		game.pieces[p] = space_id
		Engine.log(game, `部署 ${piece_log_name(game, p)} 至 ${space === "RESERVE" ? "预备格" : space_log_name(space_id)}`)
		return true
	}

	function place_entry_placements(game, faction, placements, resolve_entry) {
		for (let entry of placements) {
			let resolved = typeof resolve_entry === "function" ? resolve_entry(entry) : entry
			if (!resolved) continue
			place_named_entry_piece(game, faction, resolved.name, resolved.space, resolved)
		}
	}

	function place_first_available_entry_pieces(game, faction, names, count, space) {
		let placed = 0
		for (let name of names) {
			if (placed >= count) break
			if (place_named_entry_piece(game, faction, name, space)) placed++
		}
		return placed
	}

	function schedule_entry_piece(game, faction, unit_name, delay, space, options = {}) {
		let { game_utils } = Engine
		if (options.skip_if_event && game.events && game.events[options.skip_if_event]) return false
		let p = game_utils.find_piece(faction, unit_name)
		if (p < 0 || !game_utils.is_not_on_map(game, p)) return false
		let space_id = get_entry_space_id(faction, space)
		if (space_id < 0) return false
		if (!game.delayed_reinforcements) game.delayed_reinforcements = []
		game.delayed_reinforcements.push({ turn: game.turn + delay, piece: p, space: space_id })
		Engine.log(game, `预计于回合 ${game.turn + delay} 增援 ${unit_name} 至 ${space}`)
		return true
	}

	function change_neutral_control(game, nation, new_controller) {
		const { map } = Engine
		let enemy = new_controller === AP ? CP : AP
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s] && data.spaces[s].nation === nation) {
				if (nation === "gr") {
					let pieces = map.get_pieces_in_space(game, s)
					let has_enemy = pieces.some((p) => {
						let info = data.pieces[p]
						if (!info) return false
						if (info.nation === nation) return false
						return info.faction === enemy
					})
					if (has_enemy) {
						if (!game.control) game.control = {}
						game.control[s] = enemy
						continue
					}
				}
				if (game.control && game.control[s] !== undefined) {
					delete game.control[s]
				}
			}
		}
	}

	function trigger_romania_entry(game) {
		if (!game.events) game.events = {}
		game.events["romania"] = true
		game.entry_ro = true
		change_neutral_control(game, "ro", AP)

		let plan = Engine.collapse.get_romanian_entry_plan()
		let russian_revolution_active =
			Engine.events &&
			typeof Engine.events.get_russian_revolution_level === "function" &&
			Engine.events.get_russian_revolution_level(game) >= 1

		place_entry_placements(game, AP, plan.ap.immediate, (entry) => {
			if (russian_revolution_active && (entry.name === "RU Dobruja" || entry.name === "RU/SB Yugo Infantry")) {
				return null
			}
			return entry
		})
		if (!russian_revolution_active) {
			place_first_available_entry_pieces(game, AP, plan.ap.ru_division_pool, 2, "AP Reserve")
			for (let entry of plan.ap.delayed) {
				if (entry.name === "RU Danube Army" || entry.name === "RU 6 Army") {
					schedule_entry_piece(game, AP, entry.name, entry.turn_offset, entry.space)
				}
			}
		}
		for (let entry of plan.ap.delayed) {
			if (entry.name === "FR DIV #7" || entry.name === "FR DIV #8") {
				schedule_entry_piece(game, AP, entry.name, entry.turn_offset, entry.space)
			}
		}

		place_entry_placements(game, CP, plan.cp.immediate, (entry) => {
			if (entry.name === "Combined BU/AH Div") return null
			return entry
		})
		place_first_available_entry_pieces(game, CP, plan.cp.ge_division_pool, 2, "CP Reserve")
		place_first_available_entry_pieces(game, CP, plan.cp.ah_hermannstadt_pool, 2, "Hermannstadt")
		place_first_available_entry_pieces(game, CP, plan.cp.ah_reserve_pool, 1, "CP Reserve")
		for (let entry of plan.cp.delayed) {
			schedule_entry_piece(game, CP, entry.name, entry.turn_offset, entry.space, entry)
		}

		return {}
	}

	function trigger_bulgaria_entry(game) {
		if (!game.events) game.events = {}
		game.events["bulgaria"] = true
		game.entry_bu = true
		game.entry_sb = true
		change_neutral_control(game, "bu", CP)
		change_neutral_control(game, "sb", AP)

		let plan = Engine.collapse.get_bulgaria_entry_plan()
		place_entry_placements(game, CP, plan.cp.placements, (entry) =>
			entry.name === plan.cp.third_army_name ? null : entry
		)
		place_entry_placements(game, AP, plan.ap.placements)
	}

	function should_trigger_greece_entry_on_attack(game, target, attacker_faction) {
		const { map } = Engine
		if (!is_greece_neutral(game)) return false
		let greek_defenders = map.get_pieces_in_space(game, target).filter((p) => data.pieces[p].nation === "gr")
		if (greek_defenders.length === 0) return false
		return !(attacker_faction === CP && greek_defenders.every((p) => is_greek_cnd(p)))
	}

	function on_beachhead_placed(game, space_id, faction) {
		apply_syrian_politics_penalty(game, space_id, faction)
		if (
			faction === AP &&
			is_greece_neutral(game) &&
			is_salonika_space(space_id) &&
			typeof Engine.set_control === "function"
		) {
			Engine.set_control(game, space_id, AP)
			if (!game.events) game.events = {}
			game.events["salonika_is_port"] = true
			Engine.log(game, "萨洛尼卡现在是协约国港口。")
		}
		if (should_trigger_greece_entry_on_beachhead(game, space_id, faction)) {
			let greece_joins = get_neutral_greece_violation_ally(faction)
			trigger_greece_entry(game, space_id, greece_joins, "雅典滩头登陆事件", (msg) => Engine.log(game, msg))
		}
	}

	function check_athens_entry(game, pieces, space_id, faction) {
		if (is_greece_neutral(game) && is_athens_space(space_id)) {
			let non_greek = pieces.some((p) => !is_greek_piece(p))
			if (non_greek) {
				trigger_greece_entry(
					game,
					space_id,
					get_neutral_greece_violation_ally(faction),
					"进入雅典事件",
					(msg) => Engine.log(game, msg)
				)
			}
		}
	}

	function check_attack_trigger(game, target, attacker_faction) {
		if (should_trigger_greece_entry_on_attack(game, target, attacker_faction)) {
			trigger_greece_entry(
				game,
				target,
				get_neutral_greece_violation_ally(attacker_faction),
				"攻击中立希腊单位事件",
				(msg) => Engine.log(game, msg)
			)
		}
	}

	function is_neutral_vp_space(s) {
		let info = data.spaces[s]
		return !!(info && info.faction === "neutral" && info.vp > 0)
	}

	function normalize_vp_owner(owner) {
		return owner === AP || owner === CP ? owner : 0
	}

	function get_vp_owner_contribution(game, s, owner) {
		let vp_val = get_effective_vp_value(game, s)
		if (vp_val <= 0) return 0
		let default_owner = normalize_vp_owner(Engine.map.get_default_controller(game, s))

		if (default_owner === 0 && game.neutral_vp_first_captor && game.neutral_vp_first_captor[s]) {
			let first_captor = game.neutral_vp_first_captor[s]
			default_owner = first_captor === AP ? CP : AP
		}

		let normalized_owner = normalize_vp_owner(owner)
		if (normalized_owner === default_owner) return 0
		if (normalized_owner === AP) return -vp_val
		if (normalized_owner === CP) return vp_val
		return 0
	}

	function is_vp_space(game, s) {
		return get_effective_vp_value(game, s) > 0
	}

	function get_entering_faction(game, entered_pieces) {
		for (let p of entered_pieces) {
			let faction =
				Engine.game_utils && typeof Engine.game_utils.get_piece_effective_faction === "function"
					? Engine.game_utils.get_piece_effective_faction(game, p)
					: null
			if (faction !== AP && faction !== CP) faction = data.pieces[p] && data.pieces[p].faction
			if (faction === AP || faction === CP) return faction
		}
		return 0
	}

	function apply_neutral_persia_first_entry_penalty(game, s, entered_pieces) {
		if (game.events[NEUTRAL_PERSIA_FIRST_ENTRY_PENALTY]) return
		if (!Engine.map.is_neutral_persia_space(s)) return
		let entering_faction = get_entering_faction(game, entered_pieces)
		if (entering_faction !== AP && entering_faction !== CP) return

		game.events[NEUTRAL_PERSIA_FIRST_ENTRY_PENALTY] = entering_faction
		if (entering_faction === AP) {
			game.vp += 1
			Engine.log(game, "中立波斯：协约国率先进入，+1 VP。")
		} else {
			game.vp -= 1
			Engine.log(game, "中立波斯：同盟国率先进入，-1 VP。")
		}
	}

	function check_persia_entry_vp_penalty(game, s, entered_pieces) {
		if (!game || !Array.isArray(entered_pieces) || entered_pieces.length === 0) return
		if (!game.events) game.events = {}
		apply_neutral_persia_first_entry_penalty(game, s, entered_pieces)
		// Rule 19.6.3 (bullet 2): The first time RU units enter Arabistan, +1 VP penalty.
		// This is the only explicit sphere-entry VP penalty in the rulebook; the mirror
		// direction (BR/FR/IN/IT/ANZ into Russian sphere) is handled by bullet 1's hard
		// prohibition in can_enter_area and requires no VP penalty.
		if (!game.events["russian_british_sphere_penalty"]) {
			let has_russian_entry = entered_pieces.some((p) =>
				Engine.game_utils.piece_counts_as_nation_for_rule(game, p, "ru")
			)
			if (Engine.map.is_arabistan(s) && has_russian_entry) {
				game.events["russian_british_sphere_penalty"] = true
				game.vp += 1
				Engine.log(game, "帝国间的猜忌：俄国部队首次进入阿拉伯斯坦，CP +1 VP。")
			}
		}
	}

	function get_neutral_vp_partial_owner(game, s) {
		if (!is_neutral_vp_space(s)) return 0
		return get_vp_partial_disruptor(game, s)
	}

	function get_vp_partial_disruptor(game, s) {
		if (!is_vp_space(game, s)) return 0
		let controller = normalize_vp_owner(Engine.map.get_space_controller(game, s))
		let has_ap_regular = false
		let has_cp_regular = false

		// Rule 15.1.8: An undestroyed Fort prevents enemy control and VP/Jihad point claiming.
		// It acts as a regular unit for Disruption (10.3.1) purposes.
		if (Engine.map.has_undestroyed_fort(game, s, AP)) has_ap_regular = true
		if (Engine.map.has_undestroyed_fort(game, s, CP)) has_cp_regular = true

		let has_ap_partial = false
		let has_cp_partial = false
		for (let p of Engine.map.get_pieces_in_space(game, s)) {
			let info = data.pieces[p]
			if (!info || info.type === "hq") continue
			let faction = Engine.game_utils.get_piece_effective_faction(game, p)
			if (Engine.game_utils.is_regular(p)) {
				if (faction === AP) has_ap_regular = true
				else if (faction === CP) has_cp_regular = true
				continue
			}
			if (Engine.game_utils.is_irregular(p) || Engine.game_utils.is_tribe(p)) {
				if (faction === AP) has_ap_partial = true
				else if (faction === CP) has_cp_partial = true
			}
		}
		if (has_ap_regular || has_cp_regular) return 0
		if (has_ap_partial && !has_cp_partial && controller !== AP) return AP
		if (has_cp_partial && !has_ap_partial && controller !== CP) return CP
		return 0
	}

	function get_vp_effective_owner(game, s) {
		return get_vp_partial_disruptor(game, s)
	}

	function log_vp_partial_disruption_change(game, s, delta) {
		if (!delta) return
		let side = delta > 0 ? "CP" : "AP"
		let amount = Math.abs(delta)
		Engine.log(
			game,
			`部落/非正规军单位影响VP：${space_log_name(s)}，${side} +${amount} VP (当前VP: ${game.vp})。`
		)
	}

	function sync_vp_state(game, s, previous_override, options = {}) {
		if (!is_vp_space(game, s)) return
		if (!game.vp_partial_disruption) game.vp_partial_disruption = []
		if (!game.neutral_vp_partial_control) game.neutral_vp_partial_control = []
		let previous =
			previous_override !== undefined
				? normalize_vp_owner(previous_override)
				: game.vp_partial_disruption[s] !== undefined
					? normalize_vp_owner(game.vp_partial_disruption[s])
					: 0
		let next = normalize_vp_owner(get_vp_partial_disruptor(game, s))
		if (previous === next) {
			game.vp_partial_disruption[s] = next
			if (is_neutral_vp_space(s)) game.neutral_vp_partial_control[s] = next
			sync_armenian_uprising_ru_vp_capture(game, s, is_armenian_uprising_ru_vp_capture(game, s, next), options)
			return
		}

		let old_contribution = get_vp_owner_contribution(game, s, previous)

		let default_owner = normalize_vp_owner(Engine.map.get_default_controller(game, s))
		if (default_owner === 0) {
			let controller = normalize_vp_owner(Engine.map.get_space_controller(game, s))
			if (controller !== 0 && (!game.neutral_vp_first_captor || !game.neutral_vp_first_captor[s])) {
				if (!game.neutral_vp_first_captor) game.neutral_vp_first_captor = {}
				game.neutral_vp_first_captor[s] = controller
			}
		}

		let new_contribution = get_vp_owner_contribution(game, s, next)
		let delta = new_contribution - old_contribution
		game.vp += delta
		if (!options.silent && previous_override === undefined) log_vp_partial_disruption_change(game, s, delta)

		game.vp_partial_disruption[s] = next
		if (is_neutral_vp_space(s)) game.neutral_vp_partial_control[s] = next
		sync_armenian_uprising_ru_vp_capture(game, s, is_armenian_uprising_ru_vp_capture(game, s, next), options)
	}

	function sync_neutral_vp_state(game, s, previous_override, options) {
		sync_vp_state(game, s, previous_override, options)
	}

	function is_ru_capture_piece(info) {
		if (!info) return false
		return info.nation === "ru" || info.name.startsWith("Armenian") || info.name.startsWith("RU/PE")
	}

	function get_effective_vp_value(game, s) {
		let space = data.spaces[s]
		if (!space) return 0
		if (space.vp > 0) return space.vp
		if (game.warm_water_port_vp === s) return 1
		return 0
	}

	function get_russian_vp_value(game, s) {
		return get_effective_vp_value(game, s) > 0 ? 1 : 0
	}

	function qualifies_for_ru_vp_capture(game, s) {
		if (!has_ru_capture_piece_in_space(game, s)) return false
		let ru_sources = Engine.map.get_ru_supply_sources(game, false)
		if (!ru_sources.length) return false
		return Engine.map.can_trace_supply_to_source(game, s, AP, ru_sources)
	}

	function has_ru_capture_piece_in_space(game, s) {
		for (let p of Engine.map.get_pieces_in_space(game, s)) {
			if (is_ru_capture_piece(data.pieces[p])) {
				return true
			}
		}
		return false
	}

	function has_armenian_uprising_piece_in_space(game, s) {
		for (let p of Engine.map.get_pieces_in_space(game, s)) {
			let info = data.pieces[p]
			if (!info || info.name !== "Armenian Uprising") continue
			if (Engine.game_utils.get_piece_effective_faction(game, p) === AP) return true
		}
		return false
	}

	function is_armenian_uprising_ru_vp_capture(game, s, partial_owner) {
		return partial_owner === AP && has_armenian_uprising_piece_in_space(game, s)
	}

	function add_ru_control_marker(game, s) {
		if (!game.ru_control_markers) game.ru_control_markers = []
		if (!game.ru_control_markers.includes(s)) game.ru_control_markers.push(s)
	}

	function remove_ru_control_marker(game, s) {
		if (!Array.isArray(game.ru_control_markers)) return false
		let had_marker = game.ru_control_markers.includes(s)
		if (had_marker) game.ru_control_markers = game.ru_control_markers.filter((x) => x !== s)
		return had_marker
	}

	function sync_armenian_uprising_ru_vp_capture(game, s, active, options = {}) {
		if (!Array.isArray(game.armenian_uprising_ru_vp_markers)) game.armenian_uprising_ru_vp_markers = []
		let had = game.armenian_uprising_ru_vp_markers.includes(s)
		if (active) {
			if (!had) {
				game.armenian_uprising_ru_vp_markers.push(s)
				let ru_vp_value = get_russian_vp_value(game, s)
				game.russian_vp = (Number(game.russian_vp) || 0) + ru_vp_value
				if (!options.silent) {
					Engine.log(game, `亚美尼亚起义占领VP点，俄国VP +${ru_vp_value}（当前：${game.russian_vp}）。`)
				}
			}
			add_ru_control_marker(game, s)
			return
		}
		if (!had) return
		game.armenian_uprising_ru_vp_markers = game.armenian_uprising_ru_vp_markers.filter((x) => x !== s)
		remove_ru_control_marker(game, s)
		let ru_vp_value = get_russian_vp_value(game, s)
		game.russian_vp = (Number(game.russian_vp) || 0) - ru_vp_value
		if (!options.silent) {
			Engine.log(game, `亚美尼亚起义不再控制VP点，俄国VP -${ru_vp_value}（当前：${game.russian_vp}）。`)
		}
	}

	function get_nearest_distance(s, sources) {
		let best = 999
		for (let source of sources || []) {
			let dist = Engine.map.get_distance(s, source)
			if (dist < best) best = dist
		}
		return best
	}

	function is_turkey_balkans_or_mesopotamia(s) {
		return (
			Engine.map.is_anatolia(s) ||
			Engine.map.is_gallipoli(s) ||
			Engine.map.is_syria_palestine(s) ||
			Engine.map.is_balkans(s) ||
			Engine.map.is_mesopotamia(s) ||
			Engine.map.is_arabistan(s)
		)
	}

	function is_attrition_ru_vp_capture(game, s) {
		if (!is_vp_space(game, s)) return false
		let ru_sources = Engine.map.get_ru_supply_sources(game, false)
		if (!ru_sources.length) return false
		if (!Engine.map.can_trace_supply_to_source(game, s, AP, ru_sources)) return false
		if (
			Engine.map.is_russia(s) ||
			Engine.map.is_azerbaijan(s) ||
			Engine.map.is_caucasus(s) ||
			Engine.map.is_neutral_persia_space(s)
		) {
			return true
		}
		if (!is_turkey_balkans_or_mesopotamia(s)) return false
		let all_ap_sources = Engine.map.get_supply_sources_from_data(game, AP, false).concat(game.beachheads || [])
		let ru_set = new Set(ru_sources)
		let other_sources = all_ap_sources.filter((source) => !ru_set.has(source))
		return get_nearest_distance(s, ru_sources) < get_nearest_distance(s, other_sources)
	}

	function apply_attrition_ru_vp_capture(game, s, options = {}) {
		if (!Array.isArray(game.ru_control_markers)) game.ru_control_markers = []
		if (!is_attrition_ru_vp_capture(game, s)) return false
		if (game.ru_control_markers.includes(s)) return false
		let ru_vp_value = get_russian_vp_value(game, s)
		game.russian_vp = (Number(game.russian_vp) || 0) + ru_vp_value
		add_ru_control_marker(game, s)
		if (!options.silent) {
			Engine.log(game, `Attrition converts ${space_log_name(s)} as a Russian VP; Russian VP +${ru_vp_value} (current: ${game.russian_vp}).`)
		}
		return true
	}

	function apply_control_change(game, s, faction, previous_vp_owner, vp_before_control_change = game.vp) {
		if (!is_vp_space(game, s)) {
			remove_ru_control_marker(game, s)
			return
		}

		let old_contribution = get_vp_owner_contribution(game, s, previous_vp_owner)

		let default_owner = normalize_vp_owner(Engine.map.get_default_controller(game, s))
		if (default_owner === 0) {
			if (!game.neutral_vp_first_captor) game.neutral_vp_first_captor = {}
			if (!game.neutral_vp_first_captor[s]) {
				game.neutral_vp_first_captor[s] = faction
			}
		}

		let new_contribution = get_vp_owner_contribution(game, s, faction)
		let delta = new_contribution - old_contribution

		game.vp += delta
		let net_delta = game.vp - vp_before_control_change
		if (net_delta < 0) {
			Engine.log(game, `AP 获得 ${-net_delta} VP (当前VP: ${game.vp})`)
		} else if (net_delta > 0) {
			Engine.log(game, `CP 获得 ${net_delta} VP (当前VP: ${game.vp})`)
		}
		if (!game.ru_control_markers) game.ru_control_markers = []
		if (faction === AP) {
			if (qualifies_for_ru_vp_capture(game, s)) {
				let ru_vp_value = get_russian_vp_value(game, s)
				game.russian_vp = (Number(game.russian_vp) || 0) + ru_vp_value
				add_ru_control_marker(game, s)
				Engine.log(game, `俄国部队占领VP点，俄国VP +${ru_vp_value} (当前: ${game.russian_vp})`)
			}
		} else if (faction === CP) {
			let is_ru_vp = Engine.map.is_russian_vp_space(game, s)
			let was_ru_controlled = remove_ru_control_marker(game, s)
			if (is_ru_vp || was_ru_controlled) {
				let ru_vp_value = get_russian_vp_value(game, s)
				game.russian_vp = (Number(game.russian_vp) || 0) - ru_vp_value
				Engine.log(game, `同盟国占领俄国VP点，俄国VP -${ru_vp_value} (当前: ${game.russian_vp})`)
			}
		}
	}

	Object.assign(exports, {
		normalize_greece_faction,
		normalize_nation_faction,
		is_supported_neutral_nation,
		get_greece_faction,
		get_nation_faction,
		set_greece_faction,
		is_greece_neutral,
		is_nation_neutral,
		is_athens_space,
		is_salonika_space,
		can_set_control,
		should_trigger_greece_entry_on_beachhead,
		violates_neutral_greece_movement_restriction,
		is_greek_cnd,
		is_greek_piece,
		is_greek_controlled_by_faction,
		is_nation_controlled_by_faction,
		has_nation_entered,
		has_greek_units_in_space,
		has_neutral_greek_blocking_units_in_space,
		can_move_piece_for_faction,
		can_attack_piece_for_faction,
		get_piece_effective_faction_override,
		can_piece_participate_for_faction,
		get_space_default_controller,
		can_piece_enter_neutral_space,
		get_neutral_greece_supply_access,
		is_neutral_greece_supply_passable,
		is_persian_supply_unit,
		has_home_supply_privilege,
		home_supply_privilege_ignores_disruption,
		is_supply_trace_source_friendly_for_piece,
		has_home_supply_for_attrition,
		can_rebuild_balkan_unit_in_space,
		on_piece_rebuilt,
		can_end_move_in_neutral_greece,
		is_on_bulgaria_entry_display,
		check_constantine_entry_conditions,
		trigger_greece_entry,
		trigger_bulgaria_entry,
		trigger_romania_entry,
		place_bulgaria_third_army,
		place_romania_combined_bu_ah,
		place_entry_units,
		should_trigger_greece_entry_on_attack,
		on_beachhead_placed,
		check_athens_entry,
		check_attack_trigger,
		is_vp_space,
		is_neutral_vp_space,
		check_persia_entry_vp_penalty,
		get_vp_effective_owner,
		sync_vp_state,
		get_neutral_vp_partial_owner,
		sync_neutral_vp_state,
		get_effective_vp_value,
		apply_control_change,
		apply_attrition_ru_vp_capture
	})

	return exports
}
