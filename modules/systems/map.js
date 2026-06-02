"use strict"

module.exports = function (Engine) {
	const { data, constants, utils, game_utils } = Engine
	const exports = {}

	const { AP, CP, RESERVE, COMMITMENT_MOBILIZATION, COMMITMENT_LIMITED, COMMITMENT_TOTAL } = constants
	const { set_add, set_delete, set_has, other_faction } = utils
	const {
		find_space,
		find_capital,
		get_piece_effective_faction,
		is_lcu,
		is_scu,
		is_tribe,
		is_irregular,
		is_regular,
		is_combat_unit,
		is_hq,
		is_heavy_arty,
		is_eliminated,
		is_not_on_map,
		is_piece_reduced,
		get_tribe_key_space,
		get_piece_nations_for_rule,
		get_piece_nation_groups_for_rule,
		piece_counts_as_nation_for_rule,
		pieces_count_as_any_nation_for_rule,
		is_stanke_bey_unit,
		is_spers_rifles_unit,
		can_piece_be_activated
	} = game_utils
	const AP_RESERVE_SPACE = find_space("AP Reserve")
	const CP_RESERVE_SPACE = find_space("CP Reserve")
	const BOSPHORUS_FORTS_SPACE = find_space("The Bosphorus Forts")
	const SENUSSI_CONNECTION_KEY = "senussi"
	const SOFIA = find_space("SOFIA")
	const ATHENS = find_space("ATHENS")
	const JERUSALEM = find_space("Jerusalem")
	const JAFFA = find_space("Jaffa")
	const HAIFA = find_space("Haifa")
	const NABLUS = find_space("Nablus")
	const AFGHANISTAN_SPACE = find_space("Afghanistan")
	const FAO = find_space("Fao")
	const BASRA = find_space("Basra")
	const CYPRUS = find_space("Cyprus")
	const CONSTANTINOPLE = find_space("CONSTANTINOPLE")
	const BAGHDAD = find_space("Baghdad")
	const AQABA = find_space("Aqaba")
	const JIDDAH = find_space("Jiddah")
	const LEMNOS = find_space("Lemnos")
	const PORT_SAID = find_space("Port Said")
	const ISMAILIA = find_space("Ismailia")
	const SUEZ = find_space("Suez")
	const GALICIA_REPLACEMENT_SPACE_IDS = []
	for (let s = 1; s < data.spaces.length; s++) {
		if (is_galicia(s)) GALICIA_REPLACEMENT_SPACE_IDS.push(s)
	}
	const {
		is_greece_neutral,
		is_neutral_greece_supply_passable,
		is_athens_space,
		violates_neutral_greece_movement_restriction,
		is_greek_piece,
		has_neutral_greek_blocking_units_in_space,
		can_move_piece_for_faction
	} = Engine.neutral

	// --- Unit/Space Helpers ---

	function get_pieces_in_space(game, s) {
		if (game._space_index) {
			return game._space_index[s] || []
		}
		let list = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (game.pieces[p] === s) list.push(p)
		}
		return list
	}

	// Callback returning false stops iteration early.
	function for_each_piece_in_space(game, s, fn) {
		if (game._space_index) {
			let list = game._space_index[s] || []
			for (let i = 0; i < list.length; i++) {
				if (fn(list[i]) === false) return
			}
			return
		}
		for (let p = 0; p < game.pieces.length; p++) {
			if (game.pieces[p] === s) {
				if (fn(p) === false) return
			}
		}
	}

	function is_neutral_bulgaria_display_piece(game, p) {
		return !!(
			Engine.neutral &&
			typeof Engine.neutral.is_on_bulgaria_entry_display === "function" &&
			Engine.neutral.is_on_bulgaria_entry_display(game, p) &&
			get_piece_effective_faction(game, p) === "neutral"
		)
	}

	function get_stack_occupying_pieces(game, s, faction) {
		return get_pieces_in_space(game, s).filter(
			(p) =>
				data.pieces[p] &&
				(data.pieces[p].faction === faction ||
					get_piece_effective_faction(game, p) === faction ||
					is_neutral_bulgaria_display_piece(game, p))
		)
	}

	function contains_enemy_pieces(game, s, faction) {
		if (faction === undefined) faction = game.active
		let enemy = other_faction(faction)
		let found = false
		for_each_piece_in_space(game, s, (p) => {
			if (get_piece_effective_faction(game, p) === enemy) {
				found = true
				return false
			}
		})
		return found
	}

	function get_piece_placement_faction(game, p) {
		let info = data.pieces[p]
		if (!info) return null
		let faction = get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) faction = info.faction
		return faction
	}

	function get_piece_replacement_faction(game, p) {
		let faction = get_piece_effective_faction(game, p)
		return faction === AP || faction === CP ? faction : null
	}

	function can_opposing_units_coexist_in_space(game, s) {
		return !!(data.spaces[s] && data.spaces[s].region)
	}

	function is_space_blocked_by_enemy_unit(game, s, faction) {
		return !can_opposing_units_coexist_in_space(game, s) && contains_enemy_pieces(game, s, faction)
	}

	function can_place_piece_in_space(game, s, p, options = {}) {
		if (p < 0 || !data.pieces[p] || !data.spaces[s]) return false
		let faction = get_piece_placement_faction(game, p)
		if (is_space_blocked_by_enemy_unit(game, s, faction)) return false
		return can_stack_end_in_space(game, s, [p], options)
	}

	function can_place_piece_in_space_except_stacking(game, s, p, options = {}) {
		if (p < 0 || !data.pieces[p] || !data.spaces[s]) return false
		let faction = get_piece_placement_faction(game, p)
		if (is_space_blocked_by_enemy_unit(game, s, faction)) return false
		return can_stack_end_in_space(game, s, [p], { ...options, ignore_stacking: true })
	}

	function has_friendly_pieces(game, s, faction) {
		if (faction === undefined) faction = game.active
		let found = false
		for_each_piece_in_space(game, s, (p) => {
			if (get_piece_effective_faction(game, p) === faction) {
				found = true
				return false
			}
		})
		return found
	}

	function is_regular_combat_unit(p) {
		let info = data.pieces[p]
		return !!info && info.type === "regular" && (is_lcu(p) || is_scu(p))
	}

	function has_regular_combat_unit_for_faction(game, s, faction) {
		let found = false
		for_each_piece_in_space(game, s, (p) => {
			if (get_piece_effective_faction(game, p) === faction && is_regular_combat_unit(p)) {
				found = true
				return false
			}
		})
		return found
	}

	function get_region_disruption_owner(game, s) {
		if (!is_region(game, s)) return null
		let owner = Array.isArray(game.region_disruption) ? game.region_disruption[s] : null
		return owner === AP || owner === CP ? owner : null
	}

	function has_disrupting_piece_for_faction(game, s, faction) {
		let found = false
		for_each_piece_in_space(game, s, (p) => {
			if (get_piece_effective_faction(game, p) === faction && is_disrupting_piece(p)) {
				found = true
				return false
			}
		})
		return found
	}

	function has_uprising_marker(game, marker_key, s) {
		let markers = game && game[marker_key]
		return Array.isArray(markers) && markers.includes(s)
	}

	function has_enemy_uprising_marker(game, s, faction) {
		let enemy = other_faction(faction)
		if (enemy === CP && has_uprising_marker(game, "persian_uprising_markers", s)) return true
		if (enemy === AP && has_uprising_marker(game, "armenian_uprising_markers", s)) return true
		if ((faction === AP || faction === CP) && has_uprising_marker(game, "soviet_uprising_markers", s)) return true
		return false
	}

	function is_friendly_partial_control(game, s, faction) {
		if (!(s > 0 && data.spaces[s])) return false
		if (is_controlled_by(game, s, faction)) return false
		if (is_region(game, s)) {
			return (
				get_region_disruption_owner(game, s) === faction && has_disrupting_piece_for_faction(game, s, faction)
			)
		}
		return has_disrupting_piece_for_faction(game, s, faction)
	}

	function is_contested_region_for_faction(game, s, faction) {
		if (!is_region(game, s)) return false
		return has_friendly_pieces(game, s, faction) && contains_enemy_pieces(game, s, faction)
	}

	function is_enemy_controlled_contested_region(game, s, faction) {
		if (!is_contested_region_for_faction(game, s, faction)) return false
		return is_controlled_by(game, s, other_faction(faction))
	}

	function is_sr_besieged_enemy_fort(game, s, faction) {
		return is_besieged(game, s) && get_fort_owner(game, s) === other_faction(faction)
	}

	function is_disrupted_by_enemy(game, s, faction) {
		if (faction === undefined) faction = game.active
		let enemy = other_faction(faction)
		if (has_regular_combat_unit_for_faction(game, s, enemy)) return false
		if (enemy === CP && Array.isArray(game.persian_uprising_markers) && game.persian_uprising_markers.includes(s)) {
			return true
		}
		if (enemy === AP && has_uprising_marker(game, "armenian_uprising_markers", s)) {
			return true
		}
		if ((faction === AP || faction === CP) && has_uprising_marker(game, "soviet_uprising_markers", s)) {
			return true
		}
		if (is_region(game, s)) {
			let owner = get_region_disruption_owner(game, s)
			if (owner === enemy) return has_disrupting_piece_for_faction(game, s, enemy)
			return false
		}
		let found = false
		for_each_piece_in_space(game, s, (p) => {
			if (get_piece_effective_faction(game, p) === enemy) {
				let type = data.pieces[p].type
				if (type === "irregular" || type === "tribe" || data.pieces[p].nation === "Re") {
					found = true
					return false
				}
			}
		})
		return found
	}

	function get_piece_connected_spaces_for_rule(game, from, p, mode = "move") {
		let info = data.pieces[p]
		if (!info) return []
		let nations = get_piece_nations_for_rule(game, p, "connection")
		if (nations.length === 0) nations = [info.nation]
		if ((info.name || "").startsWith("Senussi") && !nations.includes(SENUSSI_CONNECTION_KEY)) {
			nations = nations.concat(SENUSSI_CONNECTION_KEY)
		}
		let connected = new Set()
		for (let nation of nations) {
			for (let s of get_connected_spaces(game, from, nation, info.faction, p, mode)) {
				connected.add(s)
			}
		}
		return [...connected]
	}

	function is_non_balkan_beachhead(space_id) {
		let space = data.spaces[space_id]
		if (!space) return false
		return space.area !== "balkans"
	}

	function is_anzac_desert_corps(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "ANZ Desert Corps")
	}

	function is_turkish_or_bulgarian_lcu_for_swamp_rule(game, p) {
		if (!is_lcu(p)) return false
		let nations = get_piece_nations_for_rule(game, p)
		return (
			nations.length > 0 &&
			nations.every((nation) => nation === "tu" || nation === "tua" || nation === "bu")
		)
	}

	// --- Naval Access Logic ---
	function get_movement_cost(game, p, to) {
		let from = game.pieces[p]

		// Rule 9.2.4: Crossing green connection (Trans-Regional Path) costs ALL MP.
		if (is_green_connection(from, to)) {
			// Rule 9.2.4: Dunsterforce Exception.
			let name = data.pieces[p].name || ""
			let counter = data.pieces[p].counter || ""
			if (name.includes("Dunsterforce") || counter.includes("Dunsterforce")) return 4

			// Rule 9.2.4: Entire movement allowance.
			return data.pieces[p].mf || 0
		}

		// Rule 9.6.2: Gallipoli Map Movement.
		if (is_gallipoli(from) && is_gallipoli(to)) {
			if (game.move && game.move.gallipoli_internal_paid) {
				return 0
			}
			return 1
		}

		return 1 // Standard cost
	}

	function get_enemy_fort_entry_extra_cost(game, target, faction) {
		if (!is_gallipoli(target)) return 0
		if (!has_undestroyed_fort(game, target, other_faction(faction))) return 0
		if (is_besieged(game, target)) return 0
		return 1
	}

	function is_port(s) {
		let space = data.spaces[s]
		return !!(space && space.port)
	}

	const AEGEAN_PORTS = new Set(["ATHENS", "Salonika", "Lemnos", "Smyrna", "Mugla"])

	const EAST_MED_PORTS = new Set([
		"Antalya",
		"Adana",
		"Alexandretta",
		"Beirut",
		"Haifa",
		"Jaffa",
		"Port Said",
		"Alexandria",
		"Mersa Matruh",
		"Sollum",
		"Cyprus"
	])

	const BLACK_SEA_PORTS = new Set([
		"Odessa",
		"Constanta",
		"Varna",
		"Burgas",
		"The Bosphorus Forts",
		"Eregli (Black Sea)",
		"Inebolu",
		"Samsun",
		"Giresun",
		"Trabzon",
		"Rize",
		"Batum",
		"Poti"
	])

	const CASPIAN_SEA_PORTS = new Set(["Baku", "Central Asia", "Enzeli"])

	// Rule 11.4: RU units may SR between these three regions as if connected by rail.
	const RU_VIRTUAL_SR_SPACE_NAMES = ["Odessa", "Petrovsk", "Central Asia"]

	function get_ru_virtual_sr_neighbors(s) {
		if (!data.spaces[s]) return []
		if (!RU_VIRTUAL_SR_SPACE_NAMES.includes(data.spaces[s].name)) return []
		let result = []
		for (let i = 1; i < data.spaces.length; i++) {
			if (i === s || !data.spaces[i]) continue
			if (RU_VIRTUAL_SR_SPACE_NAMES.includes(data.spaces[i].name)) result.push(i)
		}
		return result
	}

	function is_aegean_port(s) {
		let space = data.spaces[s]
		if (!space) return false
		return AEGEAN_PORTS.has(space.name)
	}

	function is_east_med_port(s) {
		let space = data.spaces[s]
		if (!space) return false
		return EAST_MED_PORTS.has(space.name)
	}

	function is_aegean_east_med_port(s) {
		return is_aegean_port(s) || is_east_med_port(s)
	}

	function is_aegean_east_med_beachhead(game, s) {
		let space = data.spaces[s]
		if (!space || !is_beachhead_space(game, s)) return false
		return space.beach_for === "Lemnos" || space.beach_for === "Cyprus"
	}

	function is_aegean_east_med_port_or_beachhead(game, s) {
		return is_aegean_east_med_port(s) || is_aegean_east_med_beachhead(game, s)
	}

	function is_black_sea_port(game_or_space, maybe_space) {
		let game = maybe_space === undefined ? null : game_or_space
		let s = maybe_space === undefined ? game_or_space : maybe_space
		let space = data.spaces[s]
		if (!space) return false
		let has_port_access = !!space.port || (game && is_beachhead_space(game, s)) || space.name === "Odessa"
		if (!has_port_access) return false
		return BLACK_SEA_PORTS.has(space.name)
	}

	function is_caspian_sea_port(game_or_space, maybe_space) {
		let game = maybe_space === undefined ? null : game_or_space
		let s = maybe_space === undefined ? game_or_space : maybe_space
		let space = data.spaces[s]
		if (!space) return false
		if (!space.port && !(game && is_beachhead_space(game, s))) return false
		return CASPIAN_SEA_PORTS.has(space.name)
	}

	function is_suez_canal_blocked(game) {
		return (
			(PORT_SAID > 0 && is_controlled_by(game, PORT_SAID, CP)) ||
			(ISMAILIA > 0 && is_controlled_by(game, ISMAILIA, CP)) ||
			(SUEZ > 0 && is_controlled_by(game, SUEZ, CP))
		)
	}

	function is_ismailia_port_closed_by_suez_rule(game, s) {
		return (
			s === ISMAILIA &&
			PORT_SAID > 0 &&
			SUEZ > 0 &&
			is_controlled_by(game, PORT_SAID, CP) &&
			is_controlled_by(game, SUEZ, CP)
		)
	}

	function has_effective_sr_port(game, s) {
		let space = data.spaces[s]
		if (!space) return false
		if (is_ismailia_port_closed_by_suez_rule(game, s)) return false
		return !!space.port || is_beachhead_space(game, s) || is_black_sea_port(game, s) || is_caspian_sea_port(game, s)
	}

	function is_india_port(game, s) {
		return has_effective_sr_port(game, s) && is_india(s)
	}

	function is_red_sea_port_or_region_port(game, s) {
		if (!has_effective_sr_port(game, s)) return false
		return is_red_sea_port(s) || is_sudan_and_darfur(s)
	}

	function is_ap_black_sea_gateway_open(game) {
		if (BOSPHORUS_FORTS_SPACE < 0 || !is_controlled_by(game, BOSPHORUS_FORTS_SPACE, AP)) return false
		init_strait_edges()
		return strait_numbers.every((n) => faction_controls_strait(game, n, AP))
	}

	function piece_can_use_ap_black_sea_sr(game, p) {
		let nations = get_piece_nations_for_rule(game, p, "sr")
		if (nations.length === 0 && data.pieces[p]) nations = [data.pieces[p].nation]
		return nations.some((nation) => nation === "ru" || nation === "br" || nation === "in" || nation === "anz")
	}

	function is_special_ru_aegean_reserve_sr_unit(info) {
		return is_special_ru_allied_supply_unit(info)
	}

	function clear_black_sea_marines_fort(game) {
		if (game && game.events) delete game.events["black_sea_marines_fort"]
	}

	function get_active_black_sea_marines_fort(game) {
		let s = game && game.events ? game.events["black_sea_marines_fort"] : null
		if (!(Number.isInteger(s) && s > 0 && data.spaces[s])) return -1
		if (game.forts && set_has(game.forts.destroyed, s)) {
			clear_black_sea_marines_fort(game)
			return -1
		}
		let has_black_sea_division = false
		for (let p of get_pieces_in_space(game, s)) {
			if (
				data.pieces[p] &&
				data.pieces[p].name === "RU Black Sea" &&
				get_piece_effective_faction(game, p) === AP &&
				!is_not_on_map(game, p)
			) {
				has_black_sea_division = true
				break
			}
		}
		if (!has_black_sea_division || !is_controlled_by(game, s, CP)) {
			clear_black_sea_marines_fort(game)
			return -1
		}
		return s
	}

	function is_black_sea_marines_special_fort(game, s) {
		return get_active_black_sea_marines_fort(game) === s
	}

	function is_black_sea_marines_supply_nation(nation) {
		return nation === "ru" || nation === "ro" || nation === "sb"
	}

	function is_black_sea_marines_supply_source(game, s, faction) {
		// Rule 13.3.4: while RU Black Sea besieges Trabzon/Bosphorus, the Fort
		// functions as a Russian/AP supply/SR port without granting AP full control.
		return faction === AP && is_black_sea_marines_special_fort(game, s)
	}

	// --- Region Logic ---

	function is_island_base(game, s) {
		const CYPRUS = 183
		if (s <= 0 || !data.spaces[s]) return false
		if (s === CYPRUS) return !!(game && game.events && game.events["egyptian_coup"])
		return !!data.spaces[s].island_base
	}

	function is_potential_beachhead_space(s) {
		return !!(s > 0 && data.spaces[s] && data.spaces[s].beach_for)
	}

	function get_adjacent_island_base_for_beachhead(s) {
		if (!is_potential_beachhead_space(s)) return -1
		return find_space(data.spaces[s].beach_for)
	}

	function can_ap_place_beachhead_marker(game, target, required_island_base = -1) {
		if (!is_potential_beachhead_space(target)) return false
		if (is_beachhead_space(game, target)) return false
		if (contains_enemy_pieces(game, target, AP)) return false
		if (is_controlled_by(game, target, CP)) return false
		let island_base = get_adjacent_island_base_for_beachhead(target)
		if (island_base <= 0 || !is_island_base(game, island_base)) return false
		if (!is_controlled_by(game, island_base, AP)) return false
		return !(required_island_base > 0 && island_base !== required_island_base)
	}

	function can_ap_initiate_invasion_to_beachhead(game, from, target, faction) {
		if (faction !== AP) return false
		let generic_reserve =
			Engine.events && typeof Engine.events.get_generic_ap_beachhead_reserve_count === "function"
				? Engine.events.get_generic_ap_beachhead_reserve_count(game)
				: game.unplaced_beachheads || 0
		if (generic_reserve <= 0) return false
		// Rule 13.1.3: Beachhead markers may not be placed during Winter
		if (game_utils.get_season(game) === "Winter") return false
		if (!is_island_base(game, from)) return false
		if (!is_controlled_by(game, from, AP)) return false
		if (!can_ap_place_beachhead_marker(game, target, from)) return false
		if (!game.move || game.move.spaces_moved > 0) return false
		// Rule 13.2.3 STEP 2: at least one SCU or LCU is required to create the beachhead
		return Array.isArray(game.move.pieces) && game.move.pieces.some((mp) => is_scu(mp) || is_lcu(mp))
	}

	function is_beachhead_placed_this_action_round(game, s) {
		return !!(
			game &&
			Array.isArray(game.beachheads_placed_this_action_round) &&
			set_has(game.beachheads_placed_this_action_round, s)
		)
	}

	function mark_beachhead_placed_this_action_round(game, s) {
		if (!game.beachheads_placed_this_action_round) game.beachheads_placed_this_action_round = []
		set_add(game.beachheads_placed_this_action_round, s)
	}

	function get_same_action_round_beachhead_move_block_reason(game, source, target) {
		if (is_beachhead_placed_this_action_round(game, target)) return "滩头本行动轮刚建立"
		if (is_beachhead_placed_this_action_round(game, source) && !is_island_base(game, target)) {
			return "滩头本行动轮刚建立"
		}
		return null
	}

	function clear_beachhead(game, target) {
		if (game.beachheads) set_delete(game.beachheads, target)
		if (game.beachheads_placed_this_action_round) set_delete(game.beachheads_placed_this_action_round, target)
	}

	function is_region(game, s) {
		if (s === undefined) {
			s = game
			game = undefined
		}
		if (s === undefined || s === null || !data.spaces[s]) return false
		return !!data.spaces[s].region || is_island_base(game, s)
	}

	/**
	 * 获取 CSV 中定义的大区 (region)
	 * 例如: Persia (East/West/South/), India, Afghanistan, Central Asia
	 */
	function get_region(space) {
		if (!data.spaces[space]) return null
		return data.spaces[space].region || null
	}

	/**
	 * 获取游戏规则定义的区域 (Functional Area / Sub-region)
	 * 例如: balkans, egypt, sinai, gallipoli, anatolia, caucasus, azerbaijan, georgia, india, russia
	 */
	function get_area(space) {
		let s = data.spaces[space]
		if (!s) return null
		return s.area || null
	}

	function is_balkans(s) {
		return get_area(s) === "balkans"
	}
	function is_egypt(s) {
		return get_area(s) === "egypt"
	}
	function is_anatolia(s) {
		return get_area(s) === "anatolia"
	}
	function is_caucasus(s) {
		return get_area(s) === "caucasus"
	}
	function is_georgia(s) {
		return get_area(s) === "georgia"
	}
	function is_galicia(s) {
		return String(get_region(s) || "").toLowerCase() === "galicia"
	}
	function is_gallipoli(s) {
		return get_area(s) === "gallipoli"
	}
	function is_india(s) {
		return String(get_region(s) || "").toLowerCase() === "india"
	}
	function is_russia(s) {
		return get_area(s) === "russia"
	}

	function is_baluchistan(s) {
		return String(get_region(s) || "").toLowerCase() === "baluchistan"
	}

	function is_afghanistan(s) {
		return String(get_region(s) || "").toLowerCase() === "afghanistan"
	}

	function is_central_asia(s) {
		let region = String(get_region(s) || "").toLowerCase()
		return region === "central asia" || region === "central_asia"
	}

	function is_sudan_and_darfur(s) {
		return String(get_region(s) || "").toLowerCase() === "sudan and darfur"
	}

	function is_persia(s) {
		let region = String(get_region(s) || "").toLowerCase()
		if (region && region.includes("persia")) return true
		let area = get_area(s)
		return area === "persia" && !is_afghanistan(s) && !is_baluchistan(s)
	}

	function is_persian_region(s) {
		let region = String(get_region(s) || "").toLowerCase()
		// Only Meshed (East Persia), Shiraz (Central Persia), Bushire (South Persia)
		return region === "east persia" || region === "central persia" || region === "south persia"
	}

	function is_neutral_persia_space(s) {
		let space = data.spaces[s]
		return !!(space && space.nation === "pe" && space.faction === "neutral")
	}

	function is_azerbaijan(s) {
		return get_area(s) === "azerbaijan"
	}
	function is_arabistan(s) {
		return get_area(s) === "arabistan"
	}

	// Greater Persia = Persia + Azerbaijan + Arabistan (Rule 14.2.8)
	function is_greater_persia(s) {
		return is_persia(s) || is_azerbaijan(s) || is_arabistan(s)
	}

	function is_sinai(s) {
		return get_area(s) === "sinai"
	}

	function is_suez_canal_space(s) {
		let space = data.spaces[s]
		if (!space) return false
		return ["Port Said", "Ismailia", "Suez"].includes(space.name)
	}

	function is_hejaz(s) {
		return String(get_region(s) || "").toLowerCase() === "hejaz"
	}

	function is_mesopotamia(s) {
		return get_area(s) === "mesopotamia"
	}
	function is_syria_palestine(s) {
		return get_area(s) === "syria_palestine"
	}

	const RESTRICTED_AREAS = new Set([
		"mesopotamia",
		"persia",
		"syria_palestine",
		"afghanistan",
		"central_asia"
	])

	function get_restricted_area(s) {
		if (!data.spaces[s]) return null
		const area = get_area(s)
		const region = String(get_region(s) || "").toLowerCase()
		if (area === "sinai") return "syria_palestine"
		if (region === "afghanistan") return "afghanistan"
		if (region === "central asia" || region === "central_asia") return "central_asia"
		if (is_greater_persia(s)) return "persia"
		if (RESTRICTED_AREAS.has(area)) return area
		return null
	}

	function is_prohibited_to_non_indian_units(space) {
		// Rule 20.2.3 & Glossary: India Entry Restrictions.
		// Rule 9.8.3: Restricted Area LCU Limit (1/2/3 based on War Commitment).
		return is_india(space)
	}

	// --- Control Logic ---

	function get_legal_beachhead_controller(game, s) {
		let info = data.spaces[s]
		if (!info || !info.beach_for) return null
		if (info.beach_for === "Cyprus" && !(game && game.events && game.events["egyptian_coup"])) {
			return "neutral"
		}
		return AP
	}

	function get_default_controller(game, s) {
		let info = data.spaces[s]
		if (!info) return null
		if (info.faction !== "neutral") return info.faction
		if (Engine.neutral && typeof Engine.neutral.get_space_default_controller === "function") {
			let neutral_controller = Engine.neutral.get_space_default_controller(game, s)
			if (neutral_controller) return neutral_controller
		}
		if (info.nation === "afghanistan" && game.events && game.events["afghan_alliance"]) return CP
		return info.faction
	}

	function get_space_controller(game, s) {
		if (is_potential_beachhead_space(s)) {
			let legal = get_legal_beachhead_controller(game, s)
			if (is_beachhead_space(game, s) && legal === AP) return AP
			if (game.control && (game.control[s] === AP || game.control[s] === "neutral")) {
				return game.control[s]
			}
			return legal
		}
		if (game.control && (game.control[s] === AP || game.control[s] === CP || game.control[s] === "neutral")) {
			if (!Engine.can_set_control(game, s, game.control[s])) return get_default_controller(game, s)
			return game.control[s]
		}
		return get_default_controller(game, s)
	}

	function is_controlled_by(game, s, faction) {
		return get_space_controller(game, s) === faction
	}

	function is_russia_controlled_space(game, s) {
		if (!is_controlled_by(game, s, AP)) return false
		if (game.warm_water_port_vp === s) return true
		if (!data.spaces[s]) return false
		if (data.spaces[s].nation === "ru" || is_azerbaijan(s)) return true
		return Array.isArray(game.ru_control_markers) && game.ru_control_markers.includes(s)
	}

	function has_allied_control_of_balfour_spaces(game) {
		return (
			is_controlled_by(game, JERUSALEM, AP) &&
			is_controlled_by(game, JAFFA, AP) &&
			is_controlled_by(game, HAIFA, AP) &&
			is_controlled_by(game, NABLUS, AP)
		)
	}

	function get_fort_owner(game, s) {
		if (s === undefined || s === null || !data.spaces[s]) return null
		if (!data.spaces[s].fort || data.spaces[s].fort <= 0) return null
		if (game && game.forts && game.forts.owner && (game.forts.owner[s] === AP || game.forts.owner[s] === CP)) {
			return game.forts.owner[s]
		}
		// Rule 15.1.8: an undestroyed Fort keeps its printed/default owner even if
		// the current control marker has drifted during a siege.
		let owner = get_default_controller(game, s)
		return owner === AP || owner === CP ? owner : null
	}

	function set_fort_owner(game, s, faction) {
		if (s === undefined || s === null || !data.spaces[s]) return false
		if (!data.spaces[s].fort || data.spaces[s].fort <= 0) return false
		if (!game.forts) game.forts = { destroyed: [], besieged: [] }
		if (!game.forts.owner || typeof game.forts.owner !== "object" || Array.isArray(game.forts.owner))
			game.forts.owner = {}
		if (faction === AP || faction === CP) game.forts.owner[s] = faction
		else delete game.forts.owner[s]
		return true
	}

	function has_undestroyed_fort(game, s, faction) {
		if (s === undefined || s === null || !data.spaces[s]) return false
		if (get_fort_owner(game, s) !== faction) return false
		return !(game.forts && Array.isArray(game.forts.destroyed) && set_has(game.forts.destroyed, s))
	}

	function destroy_fort(game, s) {
		if (!game.forts) game.forts = { destroyed: [] }
		if (!game.forts.destroyed) game.forts.destroyed = []
		if (!set_has(game.forts.destroyed, s)) {
			set_add(game.forts.destroyed, s)
		}
	}

	// --- Connection Logic ---

	function get_connection_type(a, b) {
		if (!data.spaces[a] || !data.spaces[a].connection_types) return null
		return data.spaces[a].connection_types[b] || null
	}

	function get_connection_strait(a, b) {
		if (!data.spaces[a] || !data.spaces[a].connection_straits) return null
		let n = data.spaces[a].connection_straits[b]
		if (n === undefined || n === null) return null
		return Number(n)
	}

	function get_crossing_type(a, b) {
		if (!data.spaces[a] || !data.spaces[a].crossings) return null
		return data.spaces[a].crossings[b] || null
	}

	function is_strait_connection(a, b) {
		return get_connection_type(a, b) === "strait"
	}

	let strait_edges = []
	let strait_numbers = []
	let strait_edges_initialized = false
	let bosphorus_forts_space = null

	function init_strait_edges() {
		if (strait_edges_initialized) return
		strait_edges = []
		strait_numbers = []
		for (let i = 1; i < data.spaces.length; i++) {
			let map = data.spaces[i].connection_straits
			if (!map) continue
			for (let k in map) {
				let n = Number(map[k])
				if (!n) continue
				let a = i
				let b = Number(k)
				if (Number.isNaN(b) || a > b) continue // Store only once
				if (!strait_edges[n]) strait_edges[n] = []
				let edge_list = strait_edges[n]
				if (!edge_list) continue
				edge_list.push([a, b])
				if (!strait_numbers.includes(n)) strait_numbers.push(n)
			}
		}
		strait_numbers.sort((a, b) => a - b)
		strait_edges_initialized = true
	}

	function faction_controls_strait(game, num, faction) {
		init_strait_edges()
		let edges = strait_edges[num] || []
		if (edges.length === 0) return false

		// Check if faction controls both sides of ANY edge in this strait group
		for (let [a, b] of edges) {
			if (is_controlled_by(game, a, faction) && is_controlled_by(game, b, faction)) return true
		}
		return false
	}

	function can_use_strait(game, a, b, faction) {
		// Rule 9.4.6 only restricts the numbered Dardanelles straits.
		// Other "strait" edges are ordinary movement links that still count
		// as water crossings in combat.
		let num = get_connection_strait(a, b)
		if (!num) {
			return true
		}

		// Sequential check for AP (opening the straits from Med to Black Sea).
		// AP may always use Strait #1; higher straits require control of all
		// lower-numbered straits, not control of the target side itself.
		if (faction === AP) {
			init_strait_edges()
			for (let n of strait_numbers) {
				if (n < num && !faction_controls_strait(game, n, faction)) return false
			}
			return true
		}
		// Sequential check for CP (opening from Black Sea to Med).
		// CP must control all higher-numbered straits; Strait #5 additionally
		// requires control of The Bosphorus Forts.
		if (faction === CP) {
			init_strait_edges()
			for (let n of strait_numbers) {
				if (n > num && !faction_controls_strait(game, n, faction)) return false
			}
			if (num === 5) {
				let bosphorus = get_bosphorus_forts_space_id()
				if (bosphorus < 0 || !is_controlled_by(game, bosphorus, faction)) return false
			}
			return true
		}
		return true
	}

	function get_bosphorus_forts_space_id() {
		if (bosphorus_forts_space === null) bosphorus_forts_space = BOSPHORUS_FORTS_SPACE
		return bosphorus_forts_space
	}

	function get_tribe_type(p) {
		if (p < 0 || !data.pieces[p]) return null
		let name = data.pieces[p].name || ""
		if (name.startsWith("Kurds")) return "Kurds"
		if (name.startsWith("Senussi")) return "Senussi"
		if (name.startsWith("Marsh")) return "Marsh"
		if (name === "NW Frontier") return "NW Frontier"
		if (name === "Tangistani") return "Tangistani"
		if (name === "Bawi") return "Bawi"
		if (name === "Bakhtiari") return "Bakhtiari"
		if (name === "Jangali") return "Jangali"
		if (name === "Sinjabi") return "Sinjabi"
		if (name === "Qashqai") return "Qashqai"
		if (name === "Laz") return "Laz"
		return name
	}

	function get_tribal_spaces(tribe_type) {
		let list = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s].tribal_activity_grid === tribe_type) list.push(s)
		}
		return list
	}

	function is_space_in_tribal_range(p, s) {
		if (p === undefined || p < 0 || !data.pieces[p]) return true
		if (!is_tribe(p)) return true

		let tribe_type = get_tribe_type(p)
		if (!tribe_type) return true

		// Rule 17.1.4: Tribe Movement Range (one full move away from its tribal boxes).
		let mf = get_piece_mf(p)

		let visited = new Set()
		let queue = []

		// Initial queue: all activity grid spaces
		for (let start_s = 1; start_s < data.spaces.length; start_s++) {
			if (data.spaces[start_s].tribal_activity_grid === tribe_type) {
				if (start_s === s) return true
				queue.push([start_s, 0])
				visited.add(start_s)
			}
		}

		if (mf === 0) return false

		while (queue.length > 0) {
			let [curr, dist] = queue.shift()
			if (dist >= mf) continue

			let conns = data.spaces[curr].connections || []
			let limited = data.spaces[curr].limited_connections
			if (limited && limited[tribe_type.toLowerCase()]) {
				conns = [...new Set([...conns, ...limited[tribe_type.toLowerCase()]])]
			}
			for (let next of conns) {
				if (is_caspian_green_connection(curr, next)) continue
				if (next === s) return true
				if (!visited.has(next)) {
					visited.add(next)
					queue.push([next, dist + 1])
				}
			}
		}
		return false
	}

	function is_persian_supply_unit(p) {
		if (Engine.neutral && typeof Engine.neutral.is_persian_supply_unit === "function") {
			return Engine.neutral.is_persian_supply_unit(p)
		}
		return false
	}

	// Rule 17.2.2 / 17.2.4: Irregular units cannot move or advance out of their supply area.
	function is_space_in_irregular_supply_area(p, s) {
		if (!is_irregular(p)) return true
		let name = data.pieces[p].name || ""
		let nation = data.pieces[p].nation || ""
		if (nation === "ar") return is_syria_palestine(s) || is_hejaz(s)
		if (nation === "arm") return is_anatolia(s) || is_caucasus(s) || is_georgia(s) || is_russia(s)
		if (is_persian_supply_unit(p)) return is_greater_persia(s)
		if (name.startsWith("Afghan")) return is_afghanistan(s)
		if (name.startsWith("CAsia")) return is_central_asia(s)
		if (name.startsWith("Egypt")) return is_egypt(s) || is_sudan_and_darfur(s)
		if (name.startsWith("Indian")) return is_india(s)
		return true
	}

	function has_map_connection(a, b) {
		if (!data.spaces[a] || !data.spaces[a].connection_types) return false
		return Object.prototype.hasOwnProperty.call(data.spaces[a].connection_types, b)
	}

	function get_limited_connections_for_nation(space, nation) {
		if (!space || !nation) return null
		if (space.limited_connections && space.limited_connections[nation]) return space.limited_connections[nation]
		if (!space.connection_nations) return null
		let conns = []
		for (let [next, nations] of Object.entries(space.connection_nations)) {
			if (Array.isArray(nations) && nations.includes(nation)) conns.push(Number(next))
		}
		return conns.length > 0 ? conns : null
	}

	function get_connected_spaces(game, s, nation, faction, p, mode = "move") {
		if (!data.spaces[s]) return []
		let conns = data.spaces[s].connections || []

		if (mode === "supply") {
			// Supply can be traced across any valid connection, regardless of unit movement restrictions
			if (data.spaces[s].connection_types) {
				conns = Object.keys(data.spaces[s].connection_types).map(Number)
			}
		} else if (mode === "attack" && data.spaces[s].connection_types) {
			// Attacks use map-line adjacency, not movement direction or nationality limits.
			// This lets units attack across restricted railroads and lets CP attack into
			// established Beachheads from the mainland side.
			conns = [...new Set(conns.concat(Object.keys(data.spaces[s].connection_types).map(Number)))]
		} else {
			let limited_connections = get_limited_connections_for_nation(data.spaces[s], nation)
			if (limited_connections) conns = limited_connections
		}

		conns = conns.filter((next) => connection_allowed(game, s, next, mode, faction))

		if (mode === "move") {
			conns = conns.filter((next) => {
				return !get_same_action_round_beachhead_move_block_reason(game, s, next)
			})
		}

		// Rule 13: A potential beachhead space without a Beachhead marker is inaccessible
		// (units cannot be there, and supply cannot trace through it). Block supply traversal
		// into such spaces so that supply correctly fails when the marker is absent.
		if (mode === "supply") {
			conns = conns.filter((next) => {
				if (!is_potential_beachhead_space(next)) return true
				return is_beachhead_space(game, next)
			})
		}

		if (p !== undefined && is_lcu(p)) {
			if (mode === "move" || mode === "sr") {
				let is_s_desert = data.spaces[s].terrain === "desert"
				let rail_conns = null
				let is_s_rail_connected = null
				conns = conns.filter((next) => {
					let is_next_desert = data.spaces[next].terrain === "desert"

					// Rule 13.3.3: Desert LCU restriction (Move/Attack)
					// Rule 11.1.7: SR LCU restriction (must be rail connected to supply)
					if ((is_s_desert || is_next_desert) && !is_anzac_desert_corps(p)) {
						if (!rail_conns) rail_conns = get_rail_connections(game, s, faction)
						if (!rail_conns.includes(next)) return false
						if (is_s_desert) {
							if (is_s_rail_connected === null)
								is_s_rail_connected = is_rail_connected_to_supply(game, s, faction)
							if (!is_s_rail_connected) return false
						}
						if (!is_rail_connected_to_supply(game, next, faction)) return false
					} else if (mode === "sr") {
						// Rule 11.1.7: All LCU SR must be rail-connected to supply
						if (!rail_conns) rail_conns = get_rail_connections(game, s, faction)
						if (!rail_conns.includes(next)) return false
						if (is_s_rail_connected === null)
							is_s_rail_connected = is_rail_connected_to_supply(game, s, faction)
						if (!is_s_rail_connected) return false
						if (!is_rail_connected_to_supply(game, next, faction)) return false
					}
					return true
				})
			}
		}

		if (faction) {
			conns = conns.filter((next) => {
				if (!is_strait_connection(s, next)) return true
				if (
					mode === "attack" &&
					((is_beachhead_space(game, s) && !is_island_base(game, next)) ||
						(is_beachhead_space(game, next) && !is_island_base(game, s)))
				) {
					return true
				}
				return can_use_strait(game, s, next, faction)
			})
		}

		if (
			p !== undefined &&
			p >= 0 &&
			data.pieces[p] &&
			(is_tribe(p) || (data.pieces[p].name && data.pieces[p].name.startsWith("CAsia Uprising")))
		) {
			// Rule 17.1.4 & 9.2.4: Tribes cannot move/attack/trace across Caspian green lines
			conns = conns.filter((next) => !is_caspian_green_connection(s, next))

			// Rule 17.1.4: A Tribe may attack one space beyond its Movement Range,
			// but movement, supply traces, and advance must remain within range.
			if (mode === "attack") {
				if (!is_space_in_tribal_range(p, s)) return []
			} else {
				conns = conns.filter((next) => is_space_in_tribal_range(p, next))
			}
		}

		// Rule 17.2.2: Irregular units cannot move/advance out of their supply area.
		// Attacks may target adjacent spaces outside that area.
		if (mode !== "attack" && p !== undefined && p >= 0 && data.pieces[p] && is_irregular(p)) {
			conns = conns.filter((next) => is_space_in_irregular_supply_area(p, next))
		}
		return conns
	}

	function get_distance(a, b) {
		if (a === b) return 0
		let visited = new Set()
		let queue = [[a, 0]]
		visited.add(a)
		while (queue.length > 0) {
			let [curr, dist] = queue.shift()
			let conns = data.spaces[curr].connections || []
			for (let next of conns) {
				if (next === b) return dist + 1
				if (!visited.has(next)) {
					visited.add(next)
					queue.push([next, dist + 1])
				}
			}
		}
		return 999
	}

	function is_beachhead_space(game, s) {
		if (!game.beachheads) return false
		return set_has(game.beachheads, s)
	}

	function is_russian_vp_space(game, s) {
		if (game.warm_water_port_vp === s) return true
		if (!data.spaces[s].vp) return false
		if (data.spaces[s].nation === "ru") return true
		return is_azerbaijan(s)
	}

	function get_connection_flags(a, b) {
		if (!data.spaces[a] || !data.spaces[a].connection_flags) return []
		let flags = data.spaces[a].connection_flags[b]
		return Array.isArray(flags) ? flags : []
	}

	function get_event_flag(flag, mode) {
		if (flag.startsWith("event_")) return flag.substring(6)
		if (flag.startsWith("event:")) return flag.substring(6)
		if (flag.startsWith("rail_when_event:")) return mode === "rail" ? flag.substring(16) : null
		return null
	}

	function can_use_event_connection(game, evt, faction) {
		if (evt === "xinai" && Engine.events && typeof Engine.events.can_use_sinai_railroad === "function") {
			return Engine.events.can_use_sinai_railroad(game, faction)
		}
		if (evt === "xinai" && faction === CP) return false
		let val = game.events[evt]
		return val === true || (typeof val === "number" && game.turn >= val)
	}

	function has_active_event(game, events, faction) {
		if (!game.events) return false
		for (let evt of events) {
			if (can_use_event_connection(game, evt, faction)) return true
		}
		return false
	}

	function is_connection_active(game, type, flags, mode, faction) {
		let events = flags.map((flag) => get_event_flag(flag, mode)).filter(Boolean)
		if (type === "conditional_rail") {
			// Rule 9.4.5: incomplete Berlin-Baghdad Railroad connections exist for normal
			// connections before the event, but are not railroads until the event is active.
			if (mode !== "rail" && is_incomplete_berlin_baghdad_connection(flags)) return true
			// Rule: For other conditional rails (usually roads upgraded to rail via event),
			// normal movement and supply are allowed even if the rail isn't active, unless
			// it's a virtual connection that doesn't exist yet.
			if (mode !== "rail" && !flags.includes("virtual")) return true

			if (events.length === 0) return false
			return has_active_event(game, events, faction)
		}
		if (events.length === 0) return true
		return has_active_event(game, events, faction)
	}

	function is_incomplete_berlin_baghdad_connection(flags) {
		return flags.includes("virtual") && flags.includes("event_berlin_baghdad")
	}

	function connection_allows_mode(type, flags, mode) {
		let modeFlags = flags.filter((f) => f.startsWith("mode:")).map((f) => f.substring(5))
		if (modeFlags.length > 0) return modeFlags.includes(mode)
		if (mode === "move") {
			if (flags.includes("rail_only") || flags.includes("supply_only")) return false
			if (flags.includes("virtual") && !is_incomplete_berlin_baghdad_connection(flags)) return false
		}
		if (mode === "rail") {
			if (flags.includes("move_only")) return false
			// Rule 9.2.4: Trans-Regional Paths (Green Connections) may not be crossed by units performing SR.
			if (type === "green") return false
		}
		if (mode === "supply") {
			if (flags.includes("move_only")) return false
		}
		return true
	}

	function set_debug_log(fn) {
		return fn
	}

	function connection_allowed(game, a, b, mode, faction) {
		let type = get_connection_type(a, b) || ""
		let flags = get_connection_flags(a, b)
		if (!is_connection_active(game, type, flags, mode, faction)) {
			return false
		}
		return connection_allows_mode(type, flags, mode)
	}

	function is_green_connection(a, b) {
		return get_connection_type(a, b) === "green"
	}

	function is_caspian_green_connection(a, b) {
		if (!is_green_connection(a, b)) return false
		if (get_connection_flags(a, b).includes("caspian")) return true
		let nations = data.spaces[a]?.connection_nations?.[b]
		return Array.isArray(nations) && nations.includes("no_tribe")
	}

	function get_rail_connections(game, s, faction) {
		let list = []
		let all_connections = Object.keys(data.spaces[s].connection_types || {}).map(Number)
		let railSet = new Set(data.spaces[s].rail_connections || [])
		for (let next of all_connections) {
			let type = get_connection_type(s, next) || ""
			let flags = get_connection_flags(s, next)
			let hasRailFlag = flags.some(
				(flag) => flag.startsWith("rail_when_event:") || flag === "rail_only" || flag === "virtual"
			)
			let isCandidate = railSet.has(next) || type === "rail" || type === "conditional_rail" || hasRailFlag
			if (!isCandidate) continue
			if (!connection_allowed(game, s, next, "rail", faction)) continue
			list.push(next)
		}
		return list
	}

	function can_scu_sr_continue_from_desert(game, s, from, faction) {
		if (!is_rail_connected_to_supply(game, s, faction)) return false
		for (let next of get_rail_connections(game, s, faction)) {
			if (next === from) continue
			if (is_rail_connected_to_supply(game, next, faction)) return true
		}
		return false
	}

	function get_scu_sr_desert_step(game, current, next, faction, is_source = false) {
		let is_current_desert = data.spaces[current].terrain === DESERT
		let is_next_desert = data.spaces[next].terrain === DESERT
		if (!is_current_desert && !is_next_desert) {
			return { allowed: true, can_continue: true }
		}

		if (is_current_desert) {
			// Rule 11.1.6 only restricts entering a desert during SR, not departing from the starting space.
			if (is_source && !is_next_desert) {
				return { allowed: true, can_continue: true }
			}
			let rail_conns = get_rail_connections(game, current, faction)
			if (!rail_conns.includes(next)) return { allowed: false, can_continue: false }
			if (!is_rail_connected_to_supply(game, current, faction)) return { allowed: false, can_continue: false }
			if (!is_rail_connected_to_supply(game, next, faction)) return { allowed: false, can_continue: false }
			return { allowed: true, can_continue: true }
		}

		return {
			allowed: true,
			can_continue: can_scu_sr_continue_from_desert(game, next, current, faction)
		}
	}

	// --- MOVEMENT ---

	function can_move_piece_by_faction(game, p, faction) {
		if (data.pieces[p].faction === faction) return true
		return !!can_move_piece_for_faction(game, p, faction)
	}

	function get_greek_move_restriction_reason(game, p, target, faction) {
		if (!is_greek_piece(p)) return null
		if (!can_move_piece_for_faction(game, p, faction)) {
			return "希腊中立：希腊部队不可移动"
		}
		if (
			faction === CP &&
			is_greece_neutral(game) &&
			game.events &&
			game.events["rupel"] &&
			is_athens_space(target)
		) {
			return "希腊中立：鲁贝尔事件期间希腊部队不能进入雅典"
		}
		return null
	}

	function violates_neutral_greece_end_move_rule(game, p, target, faction, total_cost) {
		return violates_neutral_greece_movement_restriction(game, p, target, faction, total_cost)
	}

	const LCU_LIMITS = {
		[AP]: {
			[COMMITMENT_MOBILIZATION]: 1,
			[COMMITMENT_LIMITED]: 2,
			[COMMITMENT_TOTAL]: 3
		},
		[CP]: {
			[COMMITMENT_MOBILIZATION]: 1,
			[COMMITMENT_LIMITED]: 2,
			[COMMITMENT_TOTAL]: 2 // Base CP limit is 2
		}
	}

	function get_lcu_limit_for(game, faction) {
		let commitment = faction === AP ? game.war_commitment_ap : game.war_commitment_cp
		let limit = LCU_LIMITS[faction][commitment] || 1

		// Special Event Modifiers
		if (faction === CP && commitment === COMMITMENT_TOTAL) {
			if (game.events && game.events.berlin_baghdad) {
				// Rule 9.8.3: Berlin-Baghdad Railroad increases CP LCU limit in restricted areas to 3.
				limit = 3
			}
		}

		return limit
	}

	function count_lcu_in_area(game, area, faction) {
		let count = 0
		for (let p = 1; p < data.pieces.length; p++) {
			if (is_lcu(p) && data.pieces[p].faction === faction) {
				let s = game.pieces[p]
				if (s >= 0 && get_restricted_area(s) === area) {
					count++
				}
			}
		}
		return count
	}

	function get_bu_turkey_exit_distance(game, start) {
		if (!(start > 0 && data.spaces[start])) return Infinity
		let queue = [start]
		let distance = new Map([[start, 0]])
		while (queue.length > 0) {
			let current = queue.shift()
			let current_distance = distance.get(current)
			let info = data.spaces[current]
			if (current !== start && info && (info.nation === "bu" || info.nation === "gr")) {
				return current_distance
			}
			for (let next of info.connections || []) {
				if (distance.has(next)) continue
				if (!connection_allowed(game, current, next, "move", CP)) continue
				distance.set(next, current_distance + 1)
				queue.push(next)
			}
		}
		return Infinity
	}

	function is_bulgarian_turkey_entry_blocked(game, p, target, options = {}) {
		if (options.retreat || options.allow_bulgarian_turkey_entry) return false
		let piece = data.pieces[p]
		let target_info = data.spaces[target]
		if (!piece || piece.nation !== "bu" || !target_info || target_info.nation !== "tu") return false

		let source = game.pieces[p]
		if (game.move && Array.isArray(game.move.pieces) && game.move.pieces.includes(p) && game.move.current > 0) {
			source = game.move.current
		}
		let source_info = data.spaces[source]
		if (!source_info || source_info.nation !== "tu") return true

		let source_distance = get_bu_turkey_exit_distance(game, source)
		let target_distance = get_bu_turkey_exit_distance(game, target)
		return !(target_distance < source_distance)
	}

	function can_enter_area(game, p, s, options = {}) {
		const { events } = Engine

		if (is_island_base(game, s) && data.pieces[p].faction === CP) return false

		// Rule 20.1.3: Balkan-Only Units restriction.
		if (data.pieces[p].region_limit === "B") {
			if (data.spaces[s].area !== "balkans") return false
		}

		// Rule 20.2.3: India Garrison Force restriction.
		if (data.pieces[p].region_limit === "I") {
			if (!is_india(s)) return false
		}

		// Rule 19.6.3: BR Persian Cordon Force restriction.
		if (data.pieces[p].region_limit === "P") {
			if (!is_greater_persia(s) && !is_india(s) && !is_baluchistan(s)) return false
		}

		let region = get_region(s)
		let area = get_area(s)
		let restricted_area = get_restricted_area(s)
		let space_info = data.spaces[s]
		let piece_info = data.pieces[p]

		// Rule 22.0: PE/RU Persian Cossacks special case.
		if (piece_info && piece_info.name === "PE/RU Persian Cossacks") {
			if (!is_greater_persia(s) && !is_central_asia(s) && !is_afghanistan(s)) return false
		}

		// Rule 17.2.4: Persian units (SPers Rifles, Police North) special cases.
		if (piece_info && (piece_info.name === "BR/PE SPers Rifles" || piece_info.name === "RU/PE Police North")) {
			if (!is_greater_persia(s)) return false
		}

		if (is_bulgarian_turkey_entry_blocked(game, p, s, options)) return false

		if (
			is_galicia(s) &&
			!is_galicia(game.pieces[p]) &&
			piece_info &&
			(piece_info.nation === "tu" || piece_info.nation === "tua") &&
			!(game.event_ctx && game.event_ctx.key === "enver_falkenhayn_summit")
		) {
			return false
		}

		if (space_info && space_info.faction === "neutral") {
			if (is_afghanistan(s)) {
				// Rule 19.7.1: Neutral Afghanistan.
				// AP units may never enter; only CP SCUs may enter before Afghan Alliance.
				if (game.events && game.events["afghan_alliance"]) return true
				let piece = data.pieces[p]
				if (!piece || piece.faction !== CP || piece.piece_class !== "SCU") return false
			} else {
				let nation = space_info.nation
				if (nation === "gr") {
					// Rule 19.2.3: Both players may enter Greece... so long as they do not enter Athens.
					if (is_athens_space(s) && Engine.neutral.is_greece_neutral(game)) return false
					// Rule 19.2.3: CP units do not have the privilege to move through spaces containing GR units.
					if (
						data.pieces[p].faction === CP &&
						Engine.neutral.is_greece_neutral(game) &&
						Engine.neutral.has_neutral_greek_blocking_units_in_space(game, s)
					)
						return false
				} else {
					if (nation === "ro") {
						// Rule 19.5.1: Romanian Entry.
						if (!game.events || !game.events["romania"]) return false
					} else if (nation === "bu") {
						// Rule 19.3.1: Bulgarian Entry.
						if (!game.events || !game.events["bulgaria"]) return false
					} else if (nation === "sb") {
						// Rule 19.4.1: Serbian Entry via Bulgaria event.
						if (!game.events || !game.events["bulgaria"]) return false
					} else if (nation === "pe") {
						// Rule 19.6.1: Persian Neutrality.
						if (!events.is_persia_open(game) && data.pieces[p].nation !== "pe") return false
					} else {
						return false
					}
				}
			}
		}

		if (is_prohibited_to_non_indian_units(s)) {
			if (!piece_counts_as_nation_for_rule(game, p, "in")) return false
		}

		// Rule 19.6.1: Persian Neutrality / Secret Treaty.
		if (area === "persia" && !is_afghanistan(s)) {
			if (!events.is_persia_open(game) && data.pieces[p].nation !== "pe") return false
		}

		// Rule 19.6.3 (bullet 1): BR/FR/IN/IT/ANZ units may not enter Neutral Persia or Azerbaijan
		// prior to the Russian Revolution. The Persian Regions are separate BR-controlled spaces.
		if (is_azerbaijan(s) || is_neutral_persia_space(s)) {
			let revolution_started = !!(game.events && game.events["russian_revolution"] >= 1)
			if (!revolution_started && piece_info) {
				let nation = piece_info.nation
				if (nation === "br" || nation === "fr" || nation === "in" || nation === "it" || nation === "anz") {
					return false
				}
			}
		}

		if (is_lcu(p)) {
			if (data.spaces[s].terrain === "desert") {
				// Rule 9.3: Desert Movement Restrictions for LCUs.
				let faction = data.pieces[p].faction
				if (!is_anzac_desert_corps(p) && !is_rail_connected_to_supply(game, s, faction)) {
					return false
				}
			}

			if (data.spaces[s].terrain === "swamp" && is_turkish_or_bulgarian_lcu_for_swamp_rule(game, p)) return false
		}

		if (!region && !restricted_area) return true

		if (is_lcu(p)) {
			if (restricted_area) {
				// Rule 9.8.3: Restricted Area LCU Limit.
				let faction = data.pieces[p].faction
				let limit = get_lcu_limit_for(game, faction)

				let current_s = game.pieces[p]
				let current_area = get_restricted_area(current_s)
				if (current_area === restricted_area) return true

				let count = count_lcu_in_area(game, restricted_area, faction)
				if (count >= limit) return false
			}
		}

		return true
	}

	function is_unlimited_stack_space(game, s) {
		const CYPRUS = 183
		if (s <= 0 || !data.spaces[s]) return false
		if (s === CYPRUS) return !!(game.events && game.events["egyptian_coup"])
		return is_island_base(game, s) || !!data.spaces[s].region || data.spaces[s].map === "Reserve Box"
	}

	function get_stack_special_key(p) {
		let piece = data.pieces[p]
		if (piece.type === "hq") return "hq"
		if (piece.symbol === "Y") return "Y"
		if (piece.symbol === "H") return "H"
		return null
	}

	const HQ_HEAVY_ARTILLERY_SUPPORT_REASON = "HQ/Heavy Artillery must stack with a friendly Combat Unit"
	const HQ_HEAVY_ARTILLERY_ENEMY_ENTRY_REASON =
		"HQ/Heavy Artillery must enter enemy-controlled spaces with a friendly Combat Unit"
	const HQ_HEAVY_ARTILLERY_DEPARTURE_REASON = "HQ/Heavy Artillery cannot be left without a friendly Combat Unit"
	const IGNORE_HQ_HEAVY_ARTILLERY_SUPPORT = { ignore_hq_heavy_artillery_support: true }

	function ignore_hq_heavy_artillery_support(options = {}) {
		return { ...options, ignore_hq_heavy_artillery_support: true }
	}

	function get_unique_pieces(pieces) {
		let unique = []
		let seen = new Set()
		for (let p of pieces || []) {
			if (seen.has(p)) continue
			if (!data.pieces[p]) continue
			seen.add(p)
			unique.push(p)
		}
		return unique
	}

	function is_hq_or_heavy_artillery_piece(p) {
		return is_hq(p) || is_heavy_arty(p) || (data.pieces[p] && data.pieces[p].symbol === "H")
	}

	function is_hq_heavy_artillery_escort_piece(p) {
		return is_combat_unit(p)
	}

	function get_hq_heavy_artillery_support_reason(pieces) {
		pieces = get_unique_pieces(pieces)
		if (!pieces.some(is_hq_or_heavy_artillery_piece)) return null
		if (pieces.some(is_hq_heavy_artillery_escort_piece)) return null
		return HQ_HEAVY_ARTILLERY_SUPPORT_REASON
	}

	function get_hq_heavy_artillery_enemy_entry_reason(game, target, pieces, faction) {
		if (!Array.isArray(pieces) || pieces.length === 0) return null
		if (!is_controlled_by(game, target, other_faction(faction))) return null
		if (!pieces.some(is_hq_or_heavy_artillery_piece)) return null
		let has_moving_escort = pieces.some(
			(p) => get_piece_effective_faction(game, p) === faction && is_hq_heavy_artillery_escort_piece(p)
		)
		return has_moving_escort ? null : HQ_HEAVY_ARTILLERY_ENEMY_ENTRY_REASON
	}

	function get_hq_heavy_artillery_departure_reason(game, source, moving_pieces, faction) {
		if (source <= 0 || !data.spaces[source]) return null
		if (!Array.isArray(moving_pieces) || moving_pieces.length === 0) return null
		let moving = new Set(moving_pieces)
		let remaining = get_pieces_in_space(game, source).filter(
			(p) => get_piece_effective_faction(game, p) === faction && !moving.has(p)
		)
		if (!get_hq_heavy_artillery_support_reason(remaining)) return null
		return HQ_HEAVY_ARTILLERY_DEPARTURE_REASON
	}

	function get_stack_counted_pieces(pieces) {
		let counted = []
		let has_yildirim = false
		for (let p of pieces) {
			let key = get_stack_special_key(p)
			if (key === "hq" || key === "H") {
				continue
			}
			if (key === "Y") {
				if (!has_yildirim) {
					has_yildirim = true
					continue
				}
			}
			counted.push(p)
		}
		return counted
	}

	function get_stack_count(pieces) {
		return get_stack_counted_pieces(pieces).length
	}

	function is_stack_counted_piece(p) {
		let key = get_stack_special_key(p)
		return key !== "hq" && key !== "H"
	}

	function get_stack_hq_count(pieces) {
		let hqs = 0
		for (let p of pieces) {
			if (get_stack_special_key(p) === "hq") hqs++
		}
		return hqs
	}

	function get_stack_yildirim_count(pieces) {
		let yildirim = 0
		for (let p of pieces) {
			if (get_stack_special_key(p) === "Y") yildirim++
		}
		return yildirim
	}

	function is_yildirim_piece(p) {
		let info = data.pieces[p]
		return !!(info && info.symbol === "Y" && info.nation === "ge")
	}

	function get_activation_piece_count(pieces) {
		let count = get_stack_count(pieces)
		if (count === 0 && pieces.some(is_yildirim_piece)) return 1
		return count
	}

	function get_stack_composition_reason(game, pieces) {
		if (has_br_ru_mix(game, pieces)) return "英俄混编"
		if (get_stack_hq_count(pieces) > 1) return "HQ超限"
		if (get_stack_yildirim_count(pieces) > 1) return "YLD超限"
		return null
	}

	function get_region_activation_stack_block_reason(game, pieces) {
		if (!Array.isArray(pieces) || pieces.length === 0) return "未选择单位"
		// Rule 16.1: HQs and Heavy Artillery must be stacked with a friendly Combat Unit
		// to operate. A region activation stack consisting solely of HQ/HA is illegal,
		// and also previously produced a 0-OPS cost via ceil(0/3)=0 (BUG 1).
		let support_reason = get_hq_heavy_artillery_support_reason(pieces)
		if (support_reason) return support_reason
		let composition_reason = get_stack_composition_reason(game, pieces)
		if (composition_reason) return composition_reason
		if (get_stack_count(pieces) > 3) return "堆叠超限"
		return null
	}

	function has_br_ru_mix(game, pieces) {
		let has_br = pieces_count_as_any_nation_for_rule(game, pieces, ["br", "in", "anz"])
		let ru_count = 0
		let ru_limit = game.events && game.events["russian_revolution"] >= 4 ? 2 : 0
		for (let p of pieces) {
			if (piece_counts_as_nation_for_rule(game, p, "ru")) {
				ru_count++
			}
			if (has_br && ru_count > ru_limit) return true
		}
		return false
	}

	function can_move_stack_composition(game, pieces) {
		return get_stack_composition_reason(game, pieces) === null
	}

	function can_temporarily_end_move_in_space(
		game,
		target,
		faction,
		stopping_pieces,
		{ stopping_pieces_already_in_space = false, excluded_future_movers = [] } = {}
	) {
		if (!Array.isArray(stopping_pieces) || stopping_pieces.length === 0) return false
		if (!Array.isArray(game.activated?.move) || !game.activated.move.includes(target)) return false
		if (is_unlimited_stack_space(game, target)) return false

		// 允许移动过程中临时超堆叠，只要这个地块仍在本次移动激活列表里，
		// 后续还能把足够数量的友军继续移走，最终在移动阶段结束前恢复合法。
		let non_stacking_reason = stopping_pieces_already_in_space
			? get_move_end_space_block_reason(game, target, faction, { ignore_stacking: true })
			: get_stack_end_block_reason(game, target, stopping_pieces, { ignore_stacking: true })
		if (non_stacking_reason) return false

		let occupiers = get_stack_occupying_pieces(game, target, faction)
		let friendly = occupiers.filter((p) => get_piece_effective_faction(game, p) === faction)
		let total = stopping_pieces_already_in_space ? occupiers : [...stopping_pieces, ...occupiers]
		let excess = get_stack_count(total) - 3
		if (excess <= 0) return false

		let excluded = new Set(excluded_future_movers)
		let future_movable = friendly.filter(
			(p) =>
				!excluded.has(p) &&
				can_move_piece_by_faction(game, p, faction) &&
				!set_has(game.moved, p) &&
				get_piece_mf(p) > 0
		)
		return get_stack_count(future_movable) >= excess
	}

	function can_stack_end_in_space(game, target, pieces, options = {}) {
		if (!pieces || pieces.length === 0) return false
		if (pieces.some((p) => p < 0 || !data.pieces[p])) return false
		let faction = get_piece_effective_faction(game, pieces[0])
		if (faction !== AP && faction !== CP) faction = data.pieces[pieces[0]].faction
		if (!Engine.neutral.can_end_move_in_neutral_greece(game, pieces[0], target, faction))
			return false

		// Rule 17.1.4: Tribe Movement Range
		for (let p of pieces) {
			if (!is_space_in_tribal_range(p, target)) return false
		}

		// Rule 17.2.2: Irregular supply area restriction
		for (let p of pieces) {
			if (!is_space_in_irregular_supply_area(p, target)) return false
		}

		if (!can_move_stack_composition(game, pieces)) return false

		faction = get_piece_effective_faction(game, pieces[0])
		if (faction !== AP && faction !== CP) faction = data.pieces[pieces[0]].faction
		for (let p of pieces) {
			let piece_faction = get_piece_effective_faction(game, p)
			if (piece_faction !== AP && piece_faction !== CP) piece_faction = data.pieces[p].faction
			if (piece_faction !== faction) return false
			if (
				Engine.events &&
				typeof Engine.events.is_transcaucasian_federation_piece === "function" &&
				Engine.events.is_transcaucasian_federation_piece(p) &&
				Engine.events.get_russian_revolution_level(game) >= 4 &&
				!(is_russia(target) || is_caucasus(target))
			) {
				return false
			}
		}

		let existing = get_stack_occupying_pieces(game, target, faction)
		if (Array.isArray(options.ignore_existing_pieces) && options.ignore_existing_pieces.length > 0) {
			let ignored = new Set(options.ignore_existing_pieces)
			existing = existing.filter((p) => !ignored.has(p))
		}

		let total = get_unique_pieces([...pieces, ...existing])
		if (total.some((p) => data.pieces[p].name === "GE GeoProtect") && total.length > 1) return false

		if (is_unlimited_stack_space(game, target)) {
			if (!options.ignore_hq_heavy_artillery_support && get_hq_heavy_artillery_support_reason(total)) return false
			return true
		}

		if (get_stack_composition_reason(game, total)) return false
		if (!options.ignore_hq_heavy_artillery_support && get_hq_heavy_artillery_support_reason(total)) return false

		let count = get_stack_count(total)
		return options.ignore_stacking || count <= 3
	}

	function get_move_end_space_block_reason(game, s, faction, options = {}) {
		let friendly = get_pieces_in_space(game, s).filter((p) => get_piece_effective_faction(game, p) === faction)
		if (friendly.length === 0) return null
		if (!Engine.neutral.can_end_move_in_neutral_greece(game, friendly[0], s, faction)) return "中立希腊移动限制"

		// Rule 9.2.3: Units may move through but not end their Movement in a space containing an Attack marker.
		if (game.activated && Array.isArray(game.activated.attack) && game.activated.attack.includes(s)) {
			return "不能在进攻激活格结束移动"
		}

		// Rule 17.1.4: Tribe Movement Range
		for (let p of friendly) {
			if (!is_space_in_tribal_range(p, s)) return "部落活动范围限制"
		}

		// Rule 17.2.2: Irregular supply area restriction
		for (let p of friendly) {
			if (!is_space_in_irregular_supply_area(p, s)) return "不正规军供给区域限制"
		}

		let composition_reason = get_stack_composition_reason(game, friendly)
		if (composition_reason) return composition_reason

		let support_reason = options.ignore_hq_heavy_artillery_support
			? null
			: get_hq_heavy_artillery_support_reason(friendly)
		if (support_reason) return support_reason

		if (!options.ignore_stacking && is_unlimited_stack_space(game, s) === false) {
			let count = get_stack_count(get_stack_occupying_pieces(game, s, faction))
			if (count > 3) return "堆叠超限"
		}

		if (has_undestroyed_fort(game, s, other_faction(faction)) && !can_besiege(game, s, friendly)) {
			return "要塞围攻兵力不足"
		}

		return null
	}

	function get_stack_end_block_reason(game, target, pieces, options = {}) {
		if (!pieces || pieces.length === 0) return "无移动单位"
		let faction = get_piece_effective_faction(game, pieces[0])
		if (faction !== AP && faction !== CP) faction = data.pieces[pieces[0]].faction
		if (!Engine.neutral.can_end_move_in_neutral_greece(game, pieces[0], target, faction))
			return "中立希腊移动限制"

		// Rule 9.2.3: Units may move through but not end their Movement in a space containing an Attack marker.
		if (game.activated && Array.isArray(game.activated.attack) && game.activated.attack.includes(target)) {
			return "不能在进攻激活格结束移动"
		}

		for (let p of pieces) {
			if (!is_space_in_tribal_range(p, target)) return "部落活动范围限制"
		}

		// Rule 17.2.2: Irregular supply area restriction
		for (let p of pieces) {
			if (!is_space_in_irregular_supply_area(p, target)) return "不正规军供给区域限制"
		}

		if (!can_move_stack_composition(game, pieces)) return "堆叠组成限制"

		for (let p of pieces) {
			let piece_faction = get_piece_effective_faction(game, p)
			if (piece_faction !== AP && piece_faction !== CP) piece_faction = data.pieces[p].faction
			if (piece_faction !== faction) return "混编阵营"
		}

		let existing = get_stack_occupying_pieces(game, target, faction)
		if (Array.isArray(options.ignore_existing_pieces) && options.ignore_existing_pieces.length > 0) {
			let ignored = new Set(options.ignore_existing_pieces)
			existing = existing.filter((p) => !ignored.has(p))
		}

		let total = get_unique_pieces([...pieces, ...existing])
		let composition_reason = get_stack_composition_reason(game, total)
		if (composition_reason) return composition_reason

		let support_reason = options.ignore_hq_heavy_artillery_support
			? null
			: get_hq_heavy_artillery_support_reason(total)
		if (support_reason) return support_reason

		if (is_unlimited_stack_space(game, target)) return null

		let count = get_stack_count(total)
		if (!options.ignore_stacking && count > 3) return "堆叠超限"
		return null
	}

	function get_piece_mf(p) {
		return data.pieces[p].mf
	}

	function prune_exhausted_move_stack(game, log_fn) {
		let removed = false
		for (let p of [...game.move.pieces]) {
			if (get_piece_mf(p) < game.move.spaces_moved) {
				set_delete(game.move.pieces, p)
				set_add(game.moved, p)
				if (log_fn)
					log_fn(`${is_piece_reduced(game, p) ? `p${p}` : `P${p}`} stops moving in s${game.move.current}`)
				removed = true
			}
		}
		return removed && game.move.pieces.length === 0
	}

	function has_unmoved_pieces_in_space(game, s, faction) {
		let pieces = get_pieces_in_space(game, s)
		for (let p of pieces) {
			if (can_move_piece_by_faction(game, p, faction) && !set_has(game.moved, p) && get_piece_mf(p) > 0)
				return true
		}
		return false
	}

	function get_entry_control_pieces(game, p) {
		if (game.move && Array.isArray(game.move.pieces) && game.move.pieces.includes(p)) return game.move.pieces
		return [p]
	}

	function would_control_space_on_entry(game, pieces, target, faction) {
		if (!pieces.some((p) => data.pieces[p] && is_regular(p))) return false
		if (is_controlled_by(game, target, faction)) return false
		if (has_undestroyed_fort(game, target, other_faction(faction))) return false
		if (data.spaces[target]?.region && contains_enemy_pieces(game, target, faction)) return false
		if (!Engine.can_set_control(game, target, faction)) return false
		return true
	}

	function is_in_supply_after_entry(game, p, target, faction) {
		let prev_pos = game.pieces[p]
		let had_control_object = !!game.control
		let had_control = had_control_object && Object.prototype.hasOwnProperty.call(game.control, target)
		let prev_control = had_control ? game.control[target] : undefined
		let simulate_control = would_control_space_on_entry(game, get_entry_control_pieces(game, p), target, faction)

		game.pieces[p] = target
		if (simulate_control) {
			if (!game.control) game.control = {}
			game.control[target] = faction
		}

		try {
			return is_in_supply(game, target, data.pieces[p].faction, p)
		} finally {
			game.pieces[p] = prev_pos
			if (simulate_control) {
				if (had_control) game.control[target] = prev_control
				else delete game.control[target]
				if (!had_control_object) delete game.control
			}
		}
	}

	function get_siege_departure_block_reason(game, from, moving_pieces, faction) {
		if (!game || !(from > 0) || !Array.isArray(moving_pieces) || moving_pieces.length === 0) return null
		if (!is_besieged(game, from)) return null
		if (get_fort_owner(game, from) !== other_faction(faction)) return null

		// Rule 15.2.4: units may leave a besieged enemy Fort only if either the
		// space is vacated or enough un-moving units remain to maintain the siege.
		let moving = new Set(moving_pieces)
		let remaining = get_pieces_in_space(game, from).filter(
			(p) => !moving.has(p) && get_piece_effective_faction(game, p) === faction
		)
		if (remaining.length === 0) return null
		if (can_besiege(game, from, remaining)) return null
		return "要塞围攻兵力不足"
	}

	function get_piece_move_block_reason(game, p, target, faction) {
		let greek_reason = get_greek_move_restriction_reason(game, p, target, faction)
		if (greek_reason) return greek_reason
		if (is_hq_or_heavy_artillery_piece(p)) {
			let moving_pieces = game.move && Array.isArray(game.move.pieces) ? game.move.pieces : [p]
			let support_reason = get_hq_heavy_artillery_enemy_entry_reason(game, target, moving_pieces, faction)
			if (support_reason) return support_reason
		}
		if (game.move && Array.isArray(game.move.pieces)) {
			let departure_reason = get_hq_heavy_artillery_departure_reason(
				game,
				game.move.current,
				game.move.pieces,
				faction
			)
			if (departure_reason) return departure_reason
		}
		if (game.move && Array.isArray(game.move.pieces)) {
			let siege_departure_reason = get_siege_departure_block_reason(
				game,
				game.move.current,
				game.move.pieces,
				faction
			)
			if (siege_departure_reason) return siege_departure_reason
		}
		if (contains_enemy_pieces(game, target, faction) && !is_region(game, target)) return "目标有敌军"
		let source = game.move.current
		let same_action_round_beachhead_reason = get_same_action_round_beachhead_move_block_reason(game, source, target)
		if (same_action_round_beachhead_reason) return same_action_round_beachhead_reason
		if (
			is_potential_beachhead_space(target) &&
			!is_beachhead_space(game, target) &&
			!can_ap_initiate_invasion_to_beachhead(game, source, target, faction)
		) {
			return "滩头未建立"
		}
		if (!can_enter_area(game, p, target)) return "区域限制或LCU数量限制"
		if (
			data.spaces[target].terrain === "desert" &&
			!is_in_supply(game, game.move.initial, data.pieces[p].faction, p)
		)
			return "沙漠进入需要起始补给"
		// Rule 9.1: A unit may never move to a space in which it would be Out of Supply.
		// Exception: amphibious invasion to establish a beachhead.
		if (!can_ap_initiate_invasion_to_beachhead(game, game.move.current, target, faction)) {
			let in_supply = is_in_supply_after_entry(game, p, target, faction)
			if (!in_supply) return "目标格无补给"
		}

		let s = game.move.current
		let neighbors = get_piece_connected_spaces_for_rule(game, s, p)
		if (!neighbors.includes(target)) return "非相邻连接"

		// Rule 9.2.4: Crossing green connection (Trans-Regional Path)
		if (is_green_connection(s, target)) {
			if (game.move && game.move.spaces_moved > 0) {
				return "绿色连线：只能在激活后未移动时跨越"
			}
			let enemy = other_faction(faction)
			if (is_controlled_by(game, target, enemy) && has_undestroyed_fort(game, target, enemy)) {
				return "绿色连线：不能进入敌方控制且有敌方要塞的格"
			}
			if (is_controlled_by(game, target, enemy) && Engine.game_utils.is_enemy_trench(game, target, faction)) {
				return "绿色连线：不能进入敌方壕沟格"
			}
		}

		let cost = get_movement_cost(game, p, target)
		if (!is_green_connection(s, target)) cost += get_enemy_fort_entry_extra_cost(game, target, faction)

		if (violates_neutral_greece_end_move_rule(game, p, target, faction, game.move.spaces_moved + cost)) {
			return "希腊中立：不能在希腊部队同格结束移动"
		}

		if (get_piece_mf(p) < game.move.spaces_moved + cost)
			return `移动力不足(${get_piece_mf(p)} < ${game.move.spaces_moved + cost})`
		return null
	}

	function is_last_move_for_stack(game, target, faction) {
		if (!game.move || game.move.pieces.length === 0) return true
		for (let p of game.move.pieces) {
			let cost = get_movement_cost(game, p, target)
			if (!is_green_connection(game.move.current, target))
				cost += get_enemy_fort_entry_extra_cost(game, target, faction)
			if (get_piece_mf(p) > game.move.spaces_moved + cost) {
				return false
			}
		}
		return true
	}
	function can_stack_move_to(game, target, faction) {
		// Rule 9.4.1: Units may enter Regions containing enemy units.
		if (contains_enemy_pieces(game, target, faction) && !is_region(game, target)) return false
		if (game.move.pieces.length === 0) return false
		if (get_hq_heavy_artillery_departure_reason(game, game.move.current, game.move.pieces, faction)) return false
		if (get_siege_departure_block_reason(game, game.move.current, game.move.pieces, faction)) return false
		if (get_hq_heavy_artillery_enemy_entry_reason(game, target, game.move.pieces, faction)) return false
		for (let p of game.move.pieces) {
			if (!can_piece_move_to(game, p, target, faction)) return false
		}
		if (!is_last_move_for_stack(game, target, faction)) return true
		if (can_stack_end_in_space(game, target, game.move.pieces)) return true
		//若该地块后续仍有已激活且可移动的友军能离开，则允许把当前堆叠暂时停在这里，最终合法性由移动阶段结束前统一保证。
		return can_temporarily_end_move_in_space(game, target, faction, game.move.pieces)
	}

	function can_piece_move_to(game, p, target, faction) {
		if (get_greek_move_restriction_reason(game, p, target, faction)) return false
		if (
			game.move &&
			game.move.current !== game.move.initial &&
			has_enemy_uprising_marker(game, game.move.current, faction)
		) {
			return false
		}
		// Rule 9.4.1: Units may enter Regions containing enemy units.
		if (contains_enemy_pieces(game, target, faction) && !is_region(game, target)) return false
		if (game.move && Array.isArray(game.move.pieces)) {
			if (get_hq_heavy_artillery_departure_reason(game, game.move.current, game.move.pieces, faction))
				return false
		}
		if (is_hq_or_heavy_artillery_piece(p)) {
			let moving_pieces = game.move && Array.isArray(game.move.pieces) ? game.move.pieces : [p]
			if (get_hq_heavy_artillery_enemy_entry_reason(game, target, moving_pieces, faction)) return false
		}
		let source = game.move.current
		if (get_same_action_round_beachhead_move_block_reason(game, source, target)) return false
		if (
			is_potential_beachhead_space(target) &&
			!is_beachhead_space(game, target) &&
			!can_ap_initiate_invasion_to_beachhead(game, source, target, faction)
		) {
			return false
		}

		// Rule 19.2.3: CP units may not enter neutral Greece space with Greek units.
		if (faction === CP && is_greece_neutral(game) && data.spaces[target].nation === "gr") {
			if (has_neutral_greek_blocking_units_in_space(game, target)) return false
		}

		if (!can_enter_area(game, p, target)) return false
		if (data.spaces[target].terrain === "desert") {
			if (!is_in_supply(game, game.move.initial, data.pieces[p].faction, p)) return false
		}
		// Rule 9.1: A unit may never move to a space in which it would be Out of Supply.
		// Exception: amphibious invasion to establish a beachhead (potential beachhead is supply-isolated until marker is placed).
		// For regular moves into enemy territory: check supply as if the unit were already at the target,
		// since a unit's presence there makes supply traceable through that space.
		if (!can_ap_initiate_invasion_to_beachhead(game, game.move.current, target, faction)) {
			let in_supply = is_in_supply_after_entry(game, p, target, faction)
			if (!in_supply) return false
		}
		let s = game.move.current
		let neighbors = get_piece_connected_spaces_for_rule(game, s, p)
		if (!neighbors.includes(target)) return false

		// Rule 9.2.4: Crossing green connection (Trans-Regional Path)
		if (is_green_connection(s, target)) {
			if (game.move && game.move.spaces_moved > 0) {
				return false
			}
			let enemy = other_faction(faction)
			if (
				is_controlled_by(game, target, enemy) &&
				(has_undestroyed_fort(game, target, enemy) || Engine.game_utils.is_enemy_trench(game, target, faction))
			) {
				return false
			}
		}

		let cost = get_movement_cost(game, p, target)
		if (!is_green_connection(s, target)) cost += get_enemy_fort_entry_extra_cost(game, target, faction)
		if (violates_neutral_greece_end_move_rule(game, p, target, faction, game.move.spaces_moved + cost)) return false
		return get_piece_mf(p) >= game.move.spaces_moved + cost
	}

	function can_besiege(game, s, pieces) {
		const { game_utils } = Engine
		if (!data.spaces[s] || !data.spaces[s].fort || data.spaces[s].fort <= 0) return false
		if (game.forts && Array.isArray(game.forts.destroyed) && set_has(game.forts.destroyed, s)) return false
		let fort_owner = get_fort_owner(game, s)
		if (fort_owner !== AP && fort_owner !== CP) return false
		if (!pieces || pieces.length === 0) return false
		let besieging_faction = other_faction(fort_owner)
		if (pieces.some((p) => get_piece_effective_faction(game, p) !== besieging_faction)) return false
		let besiegers = pieces.filter((p) => is_combat_unit(p) && !is_tribe(p))
		if (besiegers.length === 0) return false // Tribes, HQs, and Heavy Artillery cannot besiege

		// Rule 15.2.1: 1 LCU or SCUs equal to Fort's strength.
		// Rule 13.3.4: RU Black Sea counts as 3 SCUs.
		if (besiegers.some((p) => game_utils.is_lcu(p))) return true

		let scu_count = 0
		for (let p of besiegers) {
			if (game_utils.is_scu(p)) {
				if (data.pieces[p].name === "RU Black Sea" && is_black_sea_marines_special_fort(game, s)) {
					scu_count += 3
				} else {
					scu_count += 1
				}
			}
		}

		let fort_level = data.spaces[s].fort || 0
		return scu_count >= fort_level
	}

	function get_besieging_pieces(game, s, fort_owner) {
		if (!game || !Array.isArray(game.pieces)) return []
		let besiegers = []
		let besieging_faction = other_faction(fort_owner)
		for (let p = 0; p < game.pieces.length; p++) {
			if (game.pieces[p] !== s) continue
			if (get_piece_effective_faction(game, p) !== besieging_faction) continue
			besiegers.push(p)
		}
		return besiegers
	}

	// Strategic Redeployment (SR)
	function get_base_sr_cost(p) {
		return data.pieces[p].piece_class === "LCU" ? 4 : 1
	}

	function get_ap_sea_supply_sources(game, source_cache, key, port_predicate) {
		if (source_cache && source_cache.has(key)) return source_cache.get(key)
		let sources = get_supply_sources_from_data_cached(game, AP, false, source_cache).filter((s) =>
			port_predicate(s)
		)
		if (CYPRUS > 0 && port_predicate(CYPRUS) && is_controlled_by(game, CYPRUS, AP)) {
			sources.push(CYPRUS)
		}
		let beachheads = get_beachhead_spaces(game, AP).filter((s) => {
			if (port_predicate(s)) return true
			let island_base = get_adjacent_island_base_for_beachhead(s)
			return island_base > 0 && port_predicate(island_base)
		})
		let result = [...new Set(sources.concat(beachheads))]
		if (source_cache) source_cache.set(key, result)
		return result
	}

	function get_ap_aegean_east_med_supply_sources(game, source_cache = null) {
		return get_ap_sea_supply_sources(game, source_cache, "ap_aegean_east_med_sources", is_aegean_east_med_port)
	}

	function get_ap_east_med_supply_sources(game, source_cache = null) {
		return get_ap_sea_supply_sources(game, source_cache, "ap_east_med_sources", is_east_med_port)
	}

	function is_submarine_penalized_space(
		game,
		s,
		event_flag,
		source_selector,
		port_predicate = null,
		faction = AP,
		supply_context = null,
		source_cache = null
	) {
		if (faction !== AP) return false
		if (!(s > 0 && data.spaces[s])) return false
		if (!(game && game.events && game.events[event_flag])) return false
		if (ATHENS > 0 && is_controlled_by(game, ATHENS, AP)) return false
		if (!is_controlled_by(game, s, AP)) return false

		let zone_sources = source_selector(game, source_cache)
		if (zone_sources.length === 0) return false
		if (!can_trace_supply_to_source(game, s, AP, zone_sources, supply_context)) return false

		let zone_set = new Set(zone_sources)
		let alternate_sources = get_supply_sources_from_data_cached(game, AP, false, source_cache)
			.concat(get_beachhead_spaces(game, AP))
			.filter((source) => !zone_set.has(source))

		if (alternate_sources.length === 0) return true
		return !can_trace_supply_to_source(game, s, AP, alternate_sources, supply_context, {
			block_connection: (trace_game, from, to) =>
				is_submarine_zone_supply_connection(trace_game, from, to, port_predicate)
		})
	}

	function is_submarine_zone_supply_connection(game, from, to, port_predicate) {
		if (!port_predicate) return false
		if (get_connection_type(from, to) !== "strait") return false
		return port_predicate(from) || port_predicate(to)
	}

	function is_german_subs_penalized_space(game, s, faction = AP, supply_context = null, source_cache = null) {
		return is_submarine_penalized_space(
			game,
			s,
			"german_subs",
			get_ap_aegean_east_med_supply_sources,
			is_aegean_east_med_port,
			faction,
			supply_context,
			source_cache
		)
	}

	function is_unrestricted_submarine_warfare_penalized_space(
		game,
		s,
		faction = AP,
		supply_context = null,
		source_cache = null
	) {
		return is_submarine_penalized_space(
			game,
			s,
			"unrestricted_submarine_warfare",
			get_ap_east_med_supply_sources,
			is_east_med_port,
			faction,
			supply_context,
			source_cache
		)
	}

	function is_piece_exempt_from_submarine_penalty_in_space(game, p, s, faction) {
		if (!(p >= 0) || !(s > 0 && data.spaces[s])) return false
		if (faction !== AP) return false
		if (get_piece_effective_faction(game, p) !== AP) return false
		return !!(
			Engine.neutral &&
			typeof Engine.neutral.has_home_supply_privilege === "function" &&
			Engine.neutral.has_home_supply_privilege(game, p, s, faction)
		)
	}

	function is_submarine_penalty_relevant_to_pieces(game, s, faction, pieces, space_penalized) {
		if (!space_penalized) return false
		if (!Array.isArray(pieces) || pieces.length === 0) return true
		return pieces.some((p) => !is_piece_exempt_from_submarine_penalty_in_space(game, p, s, faction))
	}

	function get_german_subs_sr_surcharge(game, from, to, faction = null, p = -1) {
		if (!(game && game.events && game.events["german_subs"])) return 0
		if (faction === null || faction === undefined) faction = AP
		if (faction !== AP) return 0
		let source_cache = new Map()
		let supply_context = create_supply_context(game)
		let penalized_from = is_german_subs_penalized_space(game, from, faction, supply_context, source_cache)
		let penalized_to = is_german_subs_penalized_space(game, to, faction, supply_context, source_cache)
		if (p >= 0) {
			if (penalized_from && is_piece_exempt_from_submarine_penalty_in_space(game, p, from, faction)) {
				penalized_from = false
			}
			if (penalized_to && is_piece_exempt_from_submarine_penalty_in_space(game, p, to, faction)) {
				penalized_to = false
			}
		}
		return penalized_from || penalized_to ? 1 : 0
	}

	function get_unrestricted_submarine_warfare_sr_surcharge(game, from, to, faction = null, p = -1) {
		if (!(game && game.events && game.events["unrestricted_submarine_warfare"])) return 0
		if (faction === null || faction === undefined) faction = AP
		if (faction !== AP) return 0
		let source_cache = new Map()
		let supply_context = create_supply_context(game)
		let penalized_from = is_unrestricted_submarine_warfare_penalized_space(
			game,
			from,
			faction,
			supply_context,
			source_cache
		)
		let penalized_to = is_unrestricted_submarine_warfare_penalized_space(
			game,
			to,
			faction,
			supply_context,
			source_cache
		)
		if (p >= 0) {
			if (penalized_from && is_piece_exempt_from_submarine_penalty_in_space(game, p, from, faction)) {
				penalized_from = false
			}
			if (penalized_to && is_piece_exempt_from_submarine_penalty_in_space(game, p, to, faction)) {
				penalized_to = false
			}
		}
		return penalized_from || penalized_to ? 1 : 0
	}

	function get_sr_cost(game_or_piece, maybe_piece, maybe_from = null, maybe_to = null, maybe_faction = null) {
		if (game_or_piece && typeof game_or_piece === "object" && Array.isArray(game_or_piece.pieces)) {
			let game = game_or_piece
			let p = maybe_piece
			if (!(p >= 0) || !data.pieces[p]) return 0
			let from = maybe_from
			let to = maybe_to
			let faction = maybe_faction
			if (from === null || from === undefined) from = game.pieces[p]
			if (faction === null || faction === undefined) {
				faction = get_piece_effective_faction(game, p)
				if (faction !== AP && faction !== CP) faction = data.pieces[p].faction
			}
			return (
				get_base_sr_cost(p) +
				get_disrupted_supply_sr_surcharge(game, p, from, faction) +
				get_german_subs_sr_surcharge(game, from, to, faction, p) +
				get_unrestricted_submarine_warfare_sr_surcharge(game, from, to, faction, p)
			)
		}
		return get_base_sr_cost(game_or_piece)
	}

	function get_disrupted_supply_sr_surcharge(game, p, from, faction) {
		if (!(from > 0) || from >= data.spaces.length || !data.spaces[from]) return 0
		let status = get_supply_status(game, from, faction, p, true)
		return is_disrupted_supply_status(status) ? 1 : 0
	}

	function is_reserve_space(s) {
		if (s === RESERVE) return true
		if (s <= 0 || !data.spaces[s]) return false
		let name = data.spaces[s].name
		return (
			name === "AP Reserve" || name === "CP Reserve" || name === "AP Corps Assets" || name === "CP Corps Assets"
		)
	}

	function is_non_reserve_off_map_sr_source(game, p, source = game.pieces[p]) {
		return is_not_on_map(game, p) && !is_reserve_space(source)
	}

	function get_sr_path_neighbors(game, p, current, faction, rail_only) {
		let neighbors
		if (rail_only) {
			let rail_neighbors = get_rail_connections(game, current, faction)
			let nation_neighbors = get_piece_connected_spaces_for_rule(game, current, p, "sr")
			let nation_set = new Set(nation_neighbors)
			neighbors = rail_neighbors.filter((n) => nation_set.has(n))
			if (is_anzac_desert_corps(p) && data.spaces[current]) {
				let desert_neighbors = get_piece_connected_spaces_for_rule(game, current, p, "move")
				for (let n of desert_neighbors) {
					if (neighbors.includes(n)) continue
					if (!data.spaces[n]) continue
					if (data.spaces[current].terrain !== DESERT && data.spaces[n].terrain !== DESERT) continue
					neighbors.push(n)
				}
			}
		} else {
			neighbors = get_piece_connected_spaces_for_rule(game, current, p, "sr")
		}
		// Rule 11.4: RU units treat Odessa/Petrovsk/Central Asia as rail-connected for SR.
		if (data.pieces[p]?.nation === "ru") {
			for (let vn of get_ru_virtual_sr_neighbors(current)) {
				if (!neighbors.includes(vn)) neighbors = neighbors.concat(vn)
			}
		}
		return neighbors
	}

	function is_sr_path_space_passable(game, p, s, faction) {
		if (is_sr_space_blocked_by_enemy_piece(game, s, faction)) return false
		if (is_controlled_by(game, s, faction)) return true
		if (is_friendly_partial_control(game, s, faction)) return true
		if (is_sr_besieged_enemy_fort(game, s, faction)) return true
		if (is_enemy_controlled_contested_region(game, s, faction)) return true
		return false
	}

	function can_sr_path_continue_from_space(game, p, s, faction) {
		if (has_enemy_uprising_marker(game, s, faction)) return false
		if (is_enemy_controlled_contested_region(game, s, faction)) return false
		return true
	}

	function is_sr_end_space_allowed(game, p, s, faction) {
		if (is_sr_space_blocked_by_enemy_piece(game, s, faction)) return false
		if (is_controlled_by(game, s, faction)) return true
		if (is_friendly_partial_control(game, s, faction)) return true
		if (is_sr_besieged_enemy_fort(game, s, faction)) return true
		if (is_enemy_controlled_contested_region(game, s, faction)) return true
		return contains_friendly_pieces(game, s, faction)
	}

	function is_sr_space_blocked_by_enemy_piece(game, s, faction) {
		return is_space_blocked_by_enemy_unit(game, s, faction)
	}

	function visit_sr_path_spaces(game, p, source, faction, rail_only, visit) {
		let queue = [source]
		let queue_head = 0
		let visited = new Set([source])

		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			for (let next of get_sr_path_neighbors(game, p, current, faction, rail_only)) {
				let can_continue = true
				if (!rail_only) {
					let desert_step = get_scu_sr_desert_step(game, current, next, faction, current === source)
					if (!desert_step.allowed) continue
					can_continue = desert_step.can_continue
				}
				if (visited.has(next) && can_continue) continue
				if (!is_sr_path_space_passable(game, p, next, faction)) continue
				if (visit(next) === false) return false
				if (!can_sr_path_continue_from_space(game, p, next, faction)) can_continue = false
				if (can_continue) {
					visited.add(next)
					queue.push(next)
				}
			}
		}

		return true
	}

	function has_sr_path(game, p, from, to, faction, rail_only) {
		if (from === to) return true
		let found = false
		visit_sr_path_spaces(game, p, from, faction, rail_only, (next) => {
			if (next === to) {
				found = true
				return false
			}
			return true
		})
		return found
	}

	function find_sr_path(game, p, from, to, faction, rail_only) {
		if (from === to) return [from]
		let queue = [from]
		let queue_head = 0
		let visited = new Set([from])
		let previous = new Map()

		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			for (let next of get_sr_path_neighbors(game, p, current, faction, rail_only)) {
				let can_continue = true
				if (!rail_only) {
					let desert_step = get_scu_sr_desert_step(game, current, next, faction, current === from)
					if (!desert_step.allowed) continue
					can_continue = desert_step.can_continue
				}
				if (visited.has(next)) continue
				if (!is_sr_path_space_passable(game, p, next, faction)) continue
				visited.add(next)
				previous.set(next, current)
				if (next === to) {
					let path = [to]
					let cursor = to
					while (cursor !== from) {
						cursor = previous.get(cursor)
						path.push(cursor)
					}
					path.reverse()
					return path
				}
				if (can_continue && can_sr_path_continue_from_space(game, p, next, faction)) {
					queue.push(next)
				}
			}
		}

		return null
	}

	function is_same_sr_nationality(a, b) {
		if (a === b) return true
		let be = ["br", "in", "anz"]
		if (be.includes(a) && be.includes(b)) return true
		return (a === "tu" || a === "tua") && (b === "tu" || b === "tua")
	}

	function pieces_share_sr_nationality(game, a, b) {
		let a_nations = get_piece_nations_for_rule(game, a, "sr")
		let b_nations = get_piece_nations_for_rule(game, b, "sr")
		for (let left of a_nations) {
			for (let right of b_nations) {
				if (is_same_sr_nationality(left, right)) return true
			}
		}
		return false
	}

	function get_sr_nation_faction(game, nation) {
		if (nation === "gr") return Engine.neutral.get_greece_faction(game) || AP
		return ["tu", "tua", "ge", "ah", "bu"].includes(nation) ? CP : AP
	}

	function is_reserve_sr_capital_restricted(game, nation) {
		let faction = get_sr_nation_faction(game, nation)
		let enemy = other_faction(faction)
		let capital = find_capital(nation === "tua" ? "tu" : nation)
		return capital >= 0 && is_controlled_by(game, capital, enemy)
	}

	function can_use_reserve_sr_for_piece(game, p, faction = null) {
		let info = data.pieces[p]
		if (!info || info.piece_class === "LCU") return false
		if (faction && get_piece_effective_faction(game, p) !== faction) return false
		let nations = get_piece_nations_for_rule(game, p, "sr")
		if (nations.length === 0) nations = [info.nation]
		return nations.some((nation) => !is_reserve_sr_capital_restricted(game, nation))
	}

	function is_supply_status_in_supply(status) {
		return status === "FULL" || is_limited_supply_status(status) || is_disrupted_supply_status(status)
	}

	function is_limited_supply_status(status) {
		return status === "LIMITED" || status === "LIMITED_DISRUPTED"
	}

	function is_disrupted_supply_status(status) {
		return status === "DISRUPTED" || status === "LIMITED_DISRUPTED"
	}

	function get_supply_trace_status_from_info(supply_info, space) {
		if (supply_info.full.has(space)) return "FULL"
		if (supply_info.disrupted.has(space)) return "DISRUPTED"
		return "OOS"
	}

	function get_limited_supply_status_from_trace_status(trace_status) {
		if (trace_status === "OOS") return "OOS"
		return is_disrupted_supply_status(trace_status) ? "LIMITED_DISRUPTED" : "LIMITED"
	}

	function has_same_nationality_supplied_unit_in_space(
		game,
		p,
		s,
		supply_trace_cache = null,
		supply_context = null,
		source_cache = null,
		status_cache = null
	) {
		let target_faction = get_piece_effective_faction(game, p)
		if (target_faction !== AP && target_faction !== CP) target_faction = data.pieces[p].faction
		for (let q of get_pieces_in_space(game, s)) {
			let info = data.pieces[q]
			if (!info) continue
			let q_faction = get_piece_effective_faction(game, q)
			if (q_faction !== AP && q_faction !== CP) q_faction = info.faction
			if (q_faction !== target_faction) continue
			if (!pieces_share_sr_nationality(game, p, q)) continue
			let status = get_supply_status(
				game,
				s,
				target_faction,
				q,
				false,
				supply_trace_cache,
				supply_context,
				source_cache,
				status_cache
			)
			if (!is_supply_status_in_supply(status) || is_limited_supply_status(status)) continue
			return true
		}
		return false
	}

	function can_trace_reserve_sr_desert_supply(game, p, start, supply_context = null, source_cache = null) {
		if (!data.spaces[start] || data.spaces[start].terrain !== DESERT) return true
		let faction = get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) faction = data.pieces[p].faction
		let context = supply_context || create_supply_context(game)
		let sources = get_full_supply_sources_for_unit(game, p, true, source_cache)
		let source_flag = build_space_flag_from_sources(sources)
		let visited = new Set([start])
		let queue = [start]
		let queue_head = 0

		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			if (source_flag[current] === 1 && is_controlled_by(game, current, faction)) return true

			let neighbors = get_connected_spaces(game, current, undefined, faction, undefined, "supply")
			for (let next of neighbors) {
				if (visited.has(next)) continue

				if (context.enemy_regular[faction][next] === 1 && !is_besieged_with_context(game, next, context))
					continue
				if (is_supply_trace_blocked_by_neutrality(game, next, faction, context)) continue

				let is_friendly = is_controlled_by(game, next, faction)
				let is_besieged_enemy = is_besieged_with_context(game, next, context)

				if (is_friendly && is_besieged_enemy && get_fort_owner(game, next) === faction) continue
				if (!can_trace_supply_through_space(game, next, faction, context, { is_friendly, is_besieged_enemy }))
					continue

				let current_is_desert = data.spaces[current].terrain === DESERT
				let next_is_desert = data.spaces[next].terrain === DESERT
				if (current_is_desert && next_is_desert) {
					let rail_conns = get_rail_connections(game, current, faction)
					if (!rail_conns.includes(next)) continue
					if (!is_rail_connected_to_supply(game, current, faction)) continue
					if (!is_rail_connected_to_supply(game, next, faction)) continue
				}

				visited.add(next)
				queue.push(next)
			}
		}

		return false
	}

	function is_reserve_sr_port_destination(game, p, s, faction) {
		let info = data.pieces[p]
		if (!info || faction !== AP) return false
		if (!is_controlled_by(game, s, AP)) return false
		if (!has_effective_sr_port(game, s)) return false
		if (info.nation === "br" || info.nation === "in" || info.nation === "anz") {
			return (
				is_aegean_east_med_port_or_beachhead(game, s) ||
				is_red_sea_port_or_region_port(game, s) ||
				is_persian_gulf_port_or_beachhead(game, s)
			)
		}
		if (info.nation === "fr" || info.nation === "it") {
			return is_aegean_east_med_port_or_beachhead(game, s)
		}
		if (is_special_ru_aegean_reserve_sr_unit(info)) {
			return is_aegean_port(s)
		}
		return false
	}

	function is_reserve_sr_supply_source_destination(game, p, s, faction) {
		let info = data.pieces[p]
		if (!info || !data.spaces[s]) return false
		let nations = get_piece_nations_for_rule(game, p, "sr")
		if (nations.length === 0) nations = [info.nation]
		if (faction === AP) {
			return nations.some((nation) => {
				if ((nation === "ru" || nation === "ro" || nation === "sb") && is_named_ru_supply_source(game, s))
					return true
				if (is_black_sea_marines_supply_nation(nation) && is_black_sea_marines_special_fort(game, s))
					return true
				if (["br", "fr", "it", "in", "anz", "sb", "gr"].includes(nation)) {
					if (is_sudan_and_darfur(s) || is_india(s)) return true
					if (is_island_base(game, s) && is_controlled_by(game, s, AP)) return true
				}
				if (nation === "gr" && data.spaces[s].nation === "gr") {
					if (s === ATHENS && is_controlled_by(game, s, AP)) return true
					if (data.spaces[s].name === "Salonika" && is_base_supply_source(game, s, faction, nation, true))
						return true
				}
				if (nation === "ar" && is_hejaz(s)) return true
				return false
			})
		}
		return nations.some((nation) => is_base_supply_source(game, s, faction, nation, true))
	}

	function can_sr_from_reserve_to_space(game, p, s, faction, options = {}) {
		let info = data.pieces[p]
		if (info.piece_class === "LCU") return false
		if (!can_use_reserve_sr_for_piece(game, p, faction)) return false
		if (
			faction === CP &&
			data.spaces[s] &&
			data.spaces[s].name === "Afghanistan" &&
			game.events &&
			game.events["afghan_alliance"] &&
			!(info.name && info.name.startsWith("Afghan"))
		) {
			return false
		}
		if (!is_sr_end_space_allowed(game, p, s, faction)) return false
		let status = get_supply_status(game, s, faction, p, true)
		if (!is_supply_status_in_supply(status)) return false
		if (!can_enter_area(game, p, s)) return false
		if (!can_stack_end_in_space(game, s, [p], ignore_hq_heavy_artillery_support(options))) return false
		if (data.spaces[s].terrain === DESERT) {
			if (!can_trace_reserve_sr_desert_supply(game, p, s)) return false
		}
		if (is_reserve_sr_supply_source_destination(game, p, s, faction)) return true
		if (is_reserve_sr_port_destination(game, p, s, faction)) return true
		return has_same_nationality_supplied_unit_in_space(game, p, s)
	}

	function get_faction_reserve_space_id(faction) {
		return faction === AP ? AP_RESERVE_SPACE : CP_RESERVE_SPACE
	}

	function is_sea_sr_port_space(game, s) {
		return !!data.spaces[s] && has_effective_sr_port(game, s)
	}

	function is_sr_destination_blocked_by_events(game, source, dest, faction) {
		let source_is_sea_port = is_sea_sr_port_space(game, source)
		let dest_is_sea_port = is_sea_sr_port_space(game, dest)
		let is_sea_sr = source !== dest && source_is_sea_port && dest_is_sea_port
		if (!is_sea_sr) return false

		if (game.events && game.events["royal_navy_blockade"] && faction === CP) {
			let source_black_caspian = is_black_sea_port(game, source) || is_caspian_sea_port(game, source)
			let dest_black_caspian = is_black_sea_port(game, dest) || is_caspian_sea_port(game, dest)
			return !source_black_caspian || !dest_black_caspian
		}
		return false
	}

	function can_use_cp_red_or_persian_gulf_sea_sr(game, source, dest) {
		if (is_suez_canal_blocked(game)) return true
		return !(
			is_red_sea_port_or_region_port(game, source) ||
			is_red_sea_port_or_region_port(game, dest) ||
			is_persian_gulf_port_or_beachhead(game, source) ||
			is_persian_gulf_port_or_beachhead(game, dest)
		)
	}

	function is_british_empire_scu(info) {
		return !!(
			info &&
			info.piece_class === "SCU" &&
			(info.nation === "br" || info.nation === "in" || info.nation === "anz")
		)
	}

	function is_sea_sr_port_allowed_for_piece(game, p, s, faction) {
		if (!is_sea_sr_port_space(game, s)) return false
		if (is_controlled_by(game, s, faction)) return true
		if (faction === AP && is_black_sea_marines_special_fort(game, s)) return true
		let info = data.pieces[p]
		return is_ap_british_empire_sea_sr_region_exception(game, info, s, faction)
	}

	function is_ap_british_empire_sea_sr_region_exception(game, info, s, faction) {
		return (
			faction === AP &&
			is_british_empire_scu(info) &&
			is_region(game, s) &&
			is_controlled_by(game, s, CP) &&
			has_effective_sr_port(game, s)
		)
	}

	function is_ap_suez_sr_blocked(game, source, dest) {
		if (!is_suez_canal_blocked(game)) return false
		let source_west = is_aegean_east_med_port_or_beachhead(game, source)
		let dest_west = is_aegean_east_med_port_or_beachhead(game, dest)
		let source_east =
			is_india_port(game, source) ||
			is_persian_gulf_port_or_beachhead(game, source) ||
			is_red_sea_port_or_region_port(game, source)
		let dest_east =
			is_india_port(game, dest) ||
			is_persian_gulf_port_or_beachhead(game, dest) ||
			is_red_sea_port_or_region_port(game, dest)
		return (source_west && dest_east) || (source_east && dest_west)
	}

	function get_suez_sr_arrival_zone(game, s) {
		if (is_aegean_east_med_port_or_beachhead(game, s)) return "aegean_east_med"
		if (is_india_port(game, s)) return "india"
		if (is_persian_gulf_port_or_beachhead(game, s)) return "persian_gulf"
		if (is_red_sea_port_or_region_port(game, s)) return "red_sea"
		return null
	}

	function is_suez_sr_arrival_zone_port(game, s, zone) {
		if (!is_controlled_by(game, s, AP)) return false
		if (zone === "aegean_east_med") return is_aegean_east_med_port_or_beachhead(game, s)
		if (zone === "india") return is_india_port(game, s)
		if (zone === "persian_gulf") return is_persian_gulf_port_or_beachhead(game, s)
		if (zone === "red_sea") return is_red_sea_port_or_region_port(game, s)
		return false
	}

	function get_suez_delayed_sr_arrival_ports(game, entry) {
		let ports = []
		let allow_any = !!(entry && entry.allow_any_friendly_port)
		let zone = entry && entry.arrival_zone
		let p = entry && entry.piece
		for (let s = 1; s < data.spaces.length; s++) {
			if (!data.spaces[s]) continue
			if (!is_controlled_by(game, s, AP)) continue
			if (!is_sea_sr_port_space(game, s)) continue
			if (Number.isInteger(p) && !can_place_piece_in_space(game, s, p, IGNORE_HQ_HEAVY_ARTILLERY_SUPPORT))
				continue
			if (allow_any || is_suez_sr_arrival_zone_port(game, s, zone)) ports.push(s)
		}
		return ports
	}

	function can_suez_delayed_sr_to_space(game, p, source, dest, faction) {
		let info = data.pieces[p]
		if (!info || faction !== AP) return false
		if (info.piece_class === "LCU" || info.symbol === "H") return false
		if (!is_sea_sr_port_allowed_for_piece(game, p, source, faction)) return false
		if (!is_sea_sr_port_allowed_for_piece(game, p, dest, faction)) return false
		if (!is_ap_suez_sr_blocked(game, source, dest)) return false
		return !!get_suez_sr_arrival_zone(game, dest)
	}

	function has_sr_sea_port_route(game, p, source, dest, faction) {
		let info = data.pieces[p]
		if (is_sr_space_blocked_by_enemy_piece(game, dest, faction)) return false
		if (!is_sea_sr_port_allowed_for_piece(game, p, source, faction)) return false
		if (!is_sea_sr_port_allowed_for_piece(game, p, dest, faction)) return false
		if (info.piece_class === "LCU") return false
		if (info.symbol === "H") return false
		let source_caspian = is_caspian_sea_port(source)
		let dest_caspian = is_caspian_sea_port(dest)
		if (source_caspian || dest_caspian) {
			if (!source_caspian || !dest_caspian) return false
		}
		if (faction === CP) {
			if (game.events && game.events["royal_navy_blockade"]) {
				if (source_caspian && dest_caspian) return true
				return is_black_sea_port(game, source) && is_black_sea_port(game, dest)
			}
			if (!can_use_cp_red_or_persian_gulf_sea_sr(game, source, dest)) return false
		}
		if (faction === AP) {
			if (is_ap_suez_sr_blocked(game, source, dest)) return false
			let source_black = is_black_sea_port(game, source)
			let dest_black = is_black_sea_port(game, dest)
			if (source_black !== dest_black) {
				if (!piece_can_use_ap_black_sea_sr(game, p)) return false
				if (!is_ap_black_sea_gateway_open(game)) return false
			}
		}
		return !is_sr_destination_blocked_by_events(game, source, dest, faction)
	}

	function build_sr_path_reachable_spaces(game, p, source, faction) {
		let info = data.pieces[p]
		let rail_only = info.piece_class === "LCU"
		let reachable = new Set()
		visit_sr_path_spaces(game, p, source, faction, rail_only, (next) => {
			reachable.add(next)
			return true
		})
		return reachable
	}

	function can_sr_to_non_reserve_space_with_context(
		game,
		p,
		source,
		dest,
		faction,
		supply_trace_cache,
		supply_context,
		source_cache,
		status_cache,
		skip_sea_sr_event_block = false
	) {
		if (is_caspian_sea_port(source) || is_caspian_sea_port(dest)) {
			return can_sr_to_space(game, p, dest, faction)
		}
		if (is_sr_space_blocked_by_enemy_piece(game, dest, faction)) return false
		if (!skip_sea_sr_event_block && is_sr_destination_blocked_by_events(game, source, dest, faction)) return false
		let sea_sr_destination =
			source !== dest &&
			is_sea_sr_port_allowed_for_piece(game, p, source, faction) &&
			is_sea_sr_port_allowed_for_piece(game, p, dest, faction)
		if (!is_sr_end_space_allowed(game, p, dest, faction) && !sea_sr_destination) return false
		let dest_status = get_supply_status(
			game,
			dest,
			faction,
			p,
			true,
			supply_trace_cache,
			supply_context,
			source_cache,
			status_cache
		)
		if (
			!is_supply_status_in_supply(dest_status) &&
			!is_ap_british_empire_sea_sr_region_exception(game, data.pieces[p], dest, faction)
		)
			return false
		if (!can_enter_area(game, p, dest)) return false
		return can_stack_end_in_space(game, dest, [p], IGNORE_HQ_HEAVY_ARTILLERY_SUPPORT)
	}

	function get_sr_destinations(game, p, faction) {
		let source = game.pieces[p]
		if (source !== RESERVE && (source <= 0 || !data.spaces[source])) return []
		if (set_has(game.sr_moved || [], p)) return []
		let info = data.pieces[p]
		if (!info || get_piece_effective_faction(game, p) !== faction) return []
		if (is_non_reserve_off_map_sr_source(game, p, source)) return []

		let source_reserve = is_reserve_space(source)
		let destinations = new Set()
		let supply_trace_cache = new Map()
		let source_cache = new Map()
		let status_cache = new Map()
		let supply_context = create_supply_context(game)

		if (source_reserve) {
			if (info.piece_class === "LCU") return []
			if (!can_use_reserve_sr_for_piece(game, p, faction)) return []
			let candidates = new Set()
			for (let q = 0; q < game.pieces.length; q++) {
				let q_space = game.pieces[q]
				if (q_space <= 0 || !data.spaces[q_space]) continue
				let q_info = data.pieces[q]
				if (!q_info || get_piece_effective_faction(game, q) !== faction) continue
				if (!pieces_share_sr_nationality(game, p, q)) continue
				let q_status = get_supply_status(
					game,
					q_space,
					faction,
					q,
					false,
					supply_trace_cache,
					supply_context,
					source_cache,
					status_cache
				)
				if (!is_supply_status_in_supply(q_status) || is_limited_supply_status(q_status)) continue
				candidates.add(q_space)
			}
			for (let s = 1; s < data.spaces.length; s++) {
				if (is_reserve_sr_port_destination(game, p, s, faction)) candidates.add(s)
				if (is_reserve_sr_supply_source_destination(game, p, s, faction)) candidates.add(s)
			}
			let filtered = []
			for (let s of candidates) {
				if (is_reserve_space(s)) continue
				if (!can_sr_from_reserve_to_space(game, p, s, faction)) continue
				filtered.push(s)
			}
			return filtered
		}

		if (is_cp_non_afghan_unit_tracing_only_to_afghanistan(game, p, source_cache, supply_context)) return []

		let source_status = get_supply_status(
			game,
			source,
			faction,
			p,
			true,
			supply_trace_cache,
			supply_context,
			source_cache,
			status_cache
		)

		if (
			info.piece_class !== "LCU" &&
			!is_limited_supply_status(source_status) &&
			is_supply_status_in_supply(source_status)
		) {
			let reserve_id = get_faction_reserve_space_id(faction)
			if (reserve_id > 0 && data.spaces[reserve_id]) destinations.add(reserve_id)
		}

		if (
			can_sr_to_non_reserve_space_with_context(
				game,
				p,
				source,
				source,
				faction,
				supply_trace_cache,
				supply_context,
				source_cache,
				status_cache
			)
		) {
			destinations.add(source)
		}

		let reachable = build_sr_path_reachable_spaces(game, p, source, faction)
		for (let s of reachable) {
			if (
				can_sr_to_non_reserve_space_with_context(
					game,
					p,
					source,
					s,
					faction,
					supply_trace_cache,
					supply_context,
					source_cache,
					status_cache,
					true
				)
			) {
				destinations.add(s)
			}
		}

		if (info.piece_class !== "LCU" && info.symbol !== "H" && is_sea_sr_port_space(game, source)) {
			for (let s = 1; s < data.spaces.length; s++) {
				if (!is_sea_sr_port_space(game, s)) continue
				let has_direct_route = has_sr_sea_port_route(game, p, source, s, faction)
				let has_delayed_route = can_suez_delayed_sr_to_space(game, p, source, s, faction)
				if (!has_direct_route && !has_delayed_route) continue
				if (
					can_sr_to_non_reserve_space_with_context(
						game,
						p,
						source,
						s,
						faction,
						supply_trace_cache,
						supply_context,
						source_cache,
						status_cache
					)
				) {
					destinations.add(s)
				}
			}
		}

		return [...destinations]
	}

	function is_cp_non_afghan_unit_tracing_only_to_afghanistan(game, p, source_cache = null, supply_context = null) {
		let info = data.pieces[p]
		if (!info || get_piece_effective_faction(game, p) !== CP) return false
		if (!(game.events && game.events["afghan_alliance"])) return false
		if (info.name && info.name.startsWith("Afghan")) return false
		let s = game.pieces[p]
		if (s <= 0 || !data.spaces[s]) return false
		let context = supply_context || create_supply_context(game)
		let afghanistan_status = get_supply_trace_status_to_source(game, s, CP, AFGHANISTAN_SPACE, context)
		if (afghanistan_status === "OOS") return false
		let sources = get_full_supply_sources_for_unit(game, p, true, source_cache).filter(
			(source) => source !== AFGHANISTAN_SPACE
		)
		if (sources.length === 0) return true
		return get_supply_trace_status_to_source(game, s, CP, sources, context) === "OOS"
	}

	function can_piece_leave_siege_by_sr(game, p, faction) {
		let s = game.pieces[p]
		if (!(s > 0 && data.spaces[s])) return true
		if (!is_besieged(game, s)) return true
		if (data.pieces[p].name === "RU Black Sea" && is_black_sea_marines_special_fort(game, s)) return true
		// Apply the same Rule 15.2.4 maintenance check to SR of a single unit.
		let remaining = get_pieces_in_space(game, s).filter(
			(q) => q !== p && get_piece_effective_faction(game, q) === faction
		)
		return can_besiege(game, s, remaining)
	}

	function can_sr_piece(game, p, faction) {
		let info = data.pieces[p]
		if (!info) return false
		if (get_piece_effective_faction(game, p) !== faction) return false
		if (is_greek_piece(p) && !can_move_piece_for_faction(game, p, faction)) return false
		if (info.mf === 0) return false
		if (info.type === "irregular" || info.type === "tribe") return false
		if (set_has(game.sr_moved || [], p)) return false
		let s = game.pieces[p]
		if (is_non_reserve_off_map_sr_source(game, p, s)) return false
		if (s === RESERVE) {
			// SCUs can SR from reserve, LCUs cannot
			return info.piece_class !== "LCU" && can_use_reserve_sr_for_piece(game, p, faction)
		}
		if (s <= 0 || !data.spaces[s]) return false

		// Rule 11.1.6: Turkish units cannot SR out of Egypt.
		if ((info.nation === "tu" || info.nation === "tua") && is_egypt(s)) return false

		let nations = get_piece_nations_for_rule(game, p)
		if (nations.length === 0) return false
		if (
			!nations.some(
				(nation) =>
					nation !== "bu" || can_trace_piece_supply_to_space(game, p, SOFIA, { require_unbesieged: true })
			)
		) {
			return false
		}
		if (is_reserve_space(s)) {
			return info.piece_class !== "LCU" && can_use_reserve_sr_for_piece(game, p, faction)
		}
		let status = get_supply_status(game, s, faction, p, true)
		if (!is_supply_status_in_supply(status)) return false
		if (is_cp_non_afghan_unit_tracing_only_to_afghanistan(game, p)) return false
		if (!can_piece_leave_siege_by_sr(game, p, faction)) return false
		if (
			game.state === "event_enver_falkenhayn_sr" &&
			faction === CP &&
			(info.nation === "tu" || info.nation === "tua")
		) {
			return true
		}
		return !is_limited_supply_status(status)
	}

	function can_sr_to_space(game, p, s, faction, options = {}) {
		let source = game.pieces[p]
		if (!is_reserve_space(source) && (source <= 0 || !data.spaces[source])) return false
		if (s <= 0 || !data.spaces[s]) return false
		if (set_has(game.sr_moved || [], p)) return false
		let info = data.pieces[p]
		if (!info) return false
		if (get_piece_effective_faction(game, p) !== faction) return false
		if (is_non_reserve_off_map_sr_source(game, p, source)) return false
		let source_reserve = is_reserve_space(source)
		let dest_reserve = is_reserve_space(s)

		// Rule 11.1.6: Turkish units cannot SR into, out of, or within Egypt.
		if (info.nation === "tu" || info.nation === "tua") {
			if (!source_reserve && is_egypt(source)) return false
			if (!dest_reserve && is_egypt(s)) return false
		}

		if (source_reserve && dest_reserve) return false
		if (source_reserve) return can_sr_from_reserve_to_space(game, p, s, faction, options)
		if (dest_reserve && !can_use_reserve_sr_for_piece(game, p, faction)) return false
		if (source !== s && !can_piece_leave_siege_by_sr(game, p, faction)) return false
		if (is_cp_non_afghan_unit_tracing_only_to_afghanistan(game, p)) return false

		if (dest_reserve) {
			if (info.piece_class === "LCU") return false
			if (s !== get_faction_reserve_space_id(faction)) return false

			let source_status = get_supply_status(game, source, faction, p, true)
			if (!is_supply_status_in_supply(source_status)) return false
			return !is_limited_supply_status(source_status)
		}

		let sea_sr = source !== s && is_sea_sr_port_space(game, source) && is_sea_sr_port_space(game, s)
		let sea_sr_destination =
			sea_sr &&
			is_sea_sr_port_allowed_for_piece(game, p, source, faction) &&
			is_sea_sr_port_allowed_for_piece(game, p, s, faction)
		if (is_sr_space_blocked_by_enemy_piece(game, s, faction)) return false
		if (!is_sr_end_space_allowed(game, p, s, faction) && !sea_sr_destination) return false

		// Rule 19.2.3: AP units may not end a move in a space with Greek units while neutral.
		if (faction === AP && is_greece_neutral(game) && has_neutral_greek_blocking_units_in_space(game, s)) return false

		let dest_status = get_supply_status(game, s, faction, p, true)
		if (
			!is_supply_status_in_supply(dest_status) &&
			!is_ap_british_empire_sea_sr_region_exception(game, info, s, faction)
		)
			return false
		if (!can_enter_area(game, p, s)) return false
		if (!can_stack_end_in_space(game, s, [p], ignore_hq_heavy_artillery_support(options))) return false

		let rail_only = info.piece_class === "LCU"
		if (has_sr_path(game, p, source, s, faction, rail_only)) return true

		if (!sea_sr) return false
		return has_sr_sea_port_route(game, p, source, s, faction)
	}

	function apply_sr_control_effects(game, p, from, to, faction) {
		let info = data.pieces[p]
		if (!info) return
		let spaces = []
		if (from > 0 && data.spaces[from] && to > 0 && data.spaces[to]) {
			let rail_only = info.piece_class === "LCU"
			let path = find_sr_path(game, p, from, to, faction, rail_only)
			if (path) spaces = path
		}
		if (spaces.length === 0) {
			if (from > 0 && data.spaces[from]) spaces.push(from)
			if (to > 0 && data.spaces[to] && to !== from) spaces.push(to)
		}

		for (let s of spaces) {
			if (!is_friendly_partial_control(game, s, faction)) continue
			Engine.set_control(game, s, faction)
			if (Array.isArray(game.region_disruption) && game.region_disruption[s] === faction) {
				delete game.region_disruption[s]
			}
			if (typeof Engine.sync_region_control === "function") Engine.sync_region_control(game, s)
		}
	}

	function contains_friendly_pieces(game, s, faction) {
		let pieces = get_pieces_in_space(game, s)
		return pieces.some((p) => get_piece_effective_faction(game, p) === faction)
	}

	function can_trace_piece_supply_to_space(game, p, destination, options = {}) {
		let info = data.pieces[p]
		if (!info || destination < 0 || !data.spaces[destination]) return false
		let faction = options.faction || info.faction
		if (options.require_controlled !== false && !is_controlled_by(game, destination, faction)) return false
		if (options.require_unbesieged && is_besieged(game, destination)) return false
		if (options.allow_off_map && Engine.game_utils.is_not_on_map(game, p)) return true
		let s = game.pieces[p]
		if (s <= 0 || !data.spaces[s]) return false
		return can_trace_supply_to_source(game, s, faction, destination, options.supply_context || null)
	}

	function can_trace_piece_supply_to_sources(game, p, sources, options = {}) {
		let info = data.pieces[p]
		if (!info) return false
		let source_list = Array.isArray(sources) ? sources : [sources]
		if (source_list.length === 0) return false
		if (options.allow_off_map && Engine.game_utils.is_not_on_map(game, p)) return true
		let s = game.pieces[p]
		if (s <= 0 || !data.spaces[s]) return false
		let faction = options.faction || info.faction
		return can_trace_supply_to_source(game, s, faction, source_list, options.supply_context || null)
	}

	function is_ap_piece_on_shore_or_beachhead(game, p) {
		if (!data.pieces[p]) return false
		if (get_piece_effective_faction(game, p) !== AP) return false
		if (is_not_on_map(game, p)) return false
		let s = game.pieces[p]
		if (!(s > 0) || !data.spaces[s]) return false
		if (is_reserve_space(s)) return false
		return !is_island_base(game, s)
	}

	function is_ap_piece_supplied_solely_through_source(game, p, source, options = {}) {
		if (!(source > 0) || !data.spaces[source]) return false
		if (!is_ap_piece_on_shore_or_beachhead(game, p)) return false
		let supply_context = options.supply_context || null
		let source_cache = options.source_cache || null
		let s = game.pieces[p]
		let status = get_supply_status(game, s, AP, p, false, null, supply_context, source_cache)
		if (!is_supply_status_in_supply(status)) return false
		if (!can_trace_piece_supply_to_sources(game, p, source, { faction: AP, supply_context })) return false
		let alternate_sources = get_full_supply_sources_for_unit(game, p, false, source_cache).filter(
			(candidate) => candidate !== source
		)
		if (alternate_sources.length === 0) return true
		if (is_beachhead_space(game, source)) {
			if (s === source) return true
			return !can_trace_supply_to_source(game, s, AP, alternate_sources, supply_context, {
				block_connection(_game, current, next) {
					return current === source || next === source
				}
			})
		}
		return !can_trace_piece_supply_to_sources(game, p, alternate_sources, { faction: AP, supply_context })
	}

	function get_ap_units_supplied_solely_through_source(game, source, options = {}) {
		let result = []
		if (!(source > 0) || !data.spaces[source]) return result
		let supply_context = options.supply_context || create_supply_context(game)
		let source_cache = options.source_cache || new Map()
		for (let p = 0; p < game.pieces.length; p++) {
			if (!data.pieces[p]) continue
			if (
				is_ap_piece_supplied_solely_through_source(game, p, source, {
					supply_context,
					source_cache
				})
			) {
				result.push(p)
			}
		}
		return result
	}

	// --- SUPPLY ---

	const DESERT = "desert"

	// Internal helper for accessing other modules via the injected Engine

	// Helpers

	function is_disrupting_piece(p) {
		let info = data.pieces[p]
		return info.type === "irregular" || info.type === "tribe" || info.nation === "Re"
	}

	function create_supply_context(game) {
		let space_count = data.spaces.length
		let friendly = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let enemy = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let enemy_regular = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let disrupted = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let partial_control = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let disrupting = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let non_tribe = {
			[AP]: new Uint8Array(space_count),
			[CP]: new Uint8Array(space_count)
		}
		let besieged = new Array(space_count)

		for (let p = 0; p < game.pieces.length; p++) {
			let s = game.pieces[p]
			if (s <= 0 || s >= space_count || !data.spaces[s]) continue
			let ef = get_piece_effective_faction(game, p)
			if (ef !== AP && ef !== CP) continue

			friendly[ef][s] = 1
			if (!is_tribe(p)) non_tribe[ef][s] = 1

			let opp = ef === AP ? CP : AP
			enemy[opp][s] = 1

			if ((is_lcu(p) || is_scu(p)) && data.pieces[p].type === "regular") {
				enemy_regular[opp][s] = 1
			}
			if (is_disrupting_piece(p)) {
				let owner = is_region(game, s) ? get_region_disruption_owner(game, s) : null
				if (is_region(game, s)) {
					if (owner !== ef) continue
					partial_control[ef][s] = 1
					disrupting[opp][s] = 1
				} else if (get_space_controller(game, s) !== ef) {
					partial_control[ef][s] = 1
					disrupting[opp][s] = 1
				}
			}
		}
		if (Array.isArray(game.persian_uprising_markers)) {
			for (let s of game.persian_uprising_markers) {
				if (s > 0 && s < space_count) disrupting[AP][s] = 1
			}
		}
		if (Array.isArray(game.armenian_uprising_markers)) {
			for (let s of game.armenian_uprising_markers) {
				if (s > 0 && s < space_count) disrupting[CP][s] = 1
			}
		}
		if (Array.isArray(game.soviet_uprising_markers)) {
			for (let s of game.soviet_uprising_markers) {
				if (s > 0 && s < space_count) {
					disrupting[AP][s] = 1
					disrupting[CP][s] = 1
				}
			}
		}
		for (let faction of [AP, CP]) {
			for (let s = 1; s < space_count; s++) {
				if (disrupting[faction][s] && !enemy_regular[faction][s]) disrupted[faction][s] = 1
			}
		}

		return {
			friendly,
			enemy,
			enemy_regular,
			disrupted,
			partial_control,
			non_tribe,
			besieged
		}
	}

	function has_partial_control_with_context(context, s) {
		if (!context.partial_control) return false
		return context.partial_control[AP][s] === 1 || context.partial_control[CP][s] === 1
	}

	function has_partial_control(game, s) {
		return is_friendly_partial_control(game, s, AP) || is_friendly_partial_control(game, s, CP)
	}

	function is_besieged_with_context(game, s, supply_context) {
		if (!supply_context) return is_besieged(game, s)
		let memo = supply_context.besieged
		if (memo[s] !== undefined) return memo[s]
		if (game.special_besieged && set_has(game.special_besieged, s)) {
			memo[s] = true
			return true
		}
		if (!data.spaces[s].fort) {
			memo[s] = false
			return false
		}
		if (game.forts && game.forts.destroyed && set_has(game.forts.destroyed, s)) {
			memo[s] = false
			return false
		}
		let fort_owner = get_fort_owner(game, s)
		if (fort_owner === AP || fort_owner === CP) {
			let besieging_faction = other_faction(fort_owner)
			if (supply_context.non_tribe[besieging_faction][s] !== 1) {
				memo[s] = false
				return false
			}
			memo[s] = can_besiege(game, s, get_besieging_pieces(game, s, fort_owner))
			return memo[s]
		}
		memo[s] = is_besieged(game, s)
		return memo[s]
	}

	function build_space_flag_from_sources(sources) {
		let flag = new Uint8Array(data.spaces.length)
		for (let s of sources) flag[s] = 1
		return flag
	}

	function is_neutral_supply_blocked(game, s, faction) {
		if (data.spaces[s].faction !== "neutral") return false
		if (get_space_controller(game, s) !== "neutral") return false
		if (
			faction === CP &&
			data.spaces[s].name === "Afghanistan" &&
			!(game.events && game.events["afghan_alliance"])
		) {
			return false
		}
		return !is_neutral_greece_supply_passable(game, s, faction)
	}

	function is_supply_trace_blocked_by_neutrality(game, s, faction, context) {
		let neutral_greece_access = get_neutral_greece_supply_access(game, s, faction)
		if (neutral_greece_access !== null) return neutral_greece_access === "blocked"
		if (!is_neutral_supply_blocked(game, s, faction)) return false
		return !has_partial_control_with_context(context, s)
	}

	function get_neutral_greece_supply_access(game, s, faction) {
		if (!Engine.neutral || typeof Engine.neutral.get_neutral_greece_supply_access !== "function") return null
		return Engine.neutral.get_neutral_greece_supply_access(game, s, faction)
	}

	function can_trace_supply_through_space(game, s, faction, context, options = {}) {
		return !!(
			options.is_friendly ||
			options.is_besieged_enemy ||
			context.friendly[faction][s] === 1 ||
			has_partial_control_with_context(context, s) ||
			options.enemy_transit_allowed ||
			options.is_cp_neutral_afghanistan_source ||
			is_neutral_greece_supply_passable(game, s, faction)
		)
	}

	function can_expand_supply_trace_from_space(game, s, faction) {
		return get_neutral_greece_supply_access(game, s, faction) !== "terminal"
	}

	function is_besieged(game, s) {
		if (game.special_besieged && set_has(game.special_besieged, s)) return true
		if (!data.spaces[s].fort) return false
		if (game.forts && game.forts.destroyed && set_has(game.forts.destroyed, s)) return false

		// Check if it contains enemy units of the fort owner
		let fort_owner = get_fort_owner(game, s)
		if (!fort_owner) return false

		return can_besiege(game, s, get_besieging_pieces(game, s, fort_owner))
	}

	function get_beachhead_spaces(game, faction) {
		if (faction !== AP) return []
		return game.beachheads || []
	}

	function is_ap_supply_beachhead(game, s, faction) {
		return faction === AP && is_beachhead_space(game, s)
	}

	function is_ap_contested_cp_region_port(game, s, faction, supply_context = null) {
		if (faction !== AP) return false
		let info = data.spaces[s]
		if (!info || !info.region || !info.port) return false
		if (!is_controlled_by(game, s, CP)) return false

		let has_ap_unit = supply_context ? supply_context.friendly[AP][s] === 1 : has_friendly_pieces(game, s, AP)
		let has_cp_unit = supply_context ? supply_context.enemy[AP][s] === 1 : contains_enemy_pieces(game, s, AP)
		return has_ap_unit && has_cp_unit
	}

	function is_contested_region_with_context(game, s, faction, context) {
		return !!(
			is_region(game, s) &&
			context &&
			context.friendly[faction][s] === 1 &&
			context.enemy[faction][s] === 1
		)
	}

	function is_enemy_controlled_contested_region_with_context(game, s, faction, context) {
		return is_contested_region_with_context(game, s, faction, context) && !is_controlled_by(game, s, faction)
	}

	function can_use_ap_contested_region_port_for_full_supply(info) {
		if (!info) return false
		if (["br", "fr", "it", "in", "anz", "sb", "gr", "ar"].includes(info.nation)) return true
		return !!(info.name && (info.name.includes("2/4 Special") || info.name.includes("Yugo")))
	}

	function is_connected_by_rail(game, start, faction, sources, supply_context = null, no_start_shortcut = false) {
		let source_flag = build_space_flag_from_sources(sources || [])
		let queue = [start]
		let queue_head = 0
		let visited = new Set([start])

		while (queue_head < queue.length) {
			let current = queue[queue_head++]

			if (source_flag[current] === 1) return true
			if (!no_start_shortcut || current !== start) {
				if (is_base_supply_source(game, current, faction)) return true
			}

			let neighbors = get_rail_connections(game, current, faction)

			for (let next of neighbors) {
				if (visited.has(next)) continue

				let blocked_by_enemy = supply_context
					? supply_context.enemy[faction][next] === 1
					: contains_enemy_pieces(game, next, faction)
				if (blocked_by_enemy && !is_besieged_with_context(game, next, supply_context)) continue
				if (!is_controlled_by(game, next, faction)) continue

				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	function get_supplied_spaces(game, sources, faction, p, supply_context = null) {
		// BFS to find all supplied spaces
		let full_supplied = new Set()
		let disrupted_supplied = new Set()
		let queue = []
		let queue_head = 0
		let nation = p !== -1 ? data.pieces[p].nation : undefined
		let context = supply_context || create_supply_context(game)

		// Add all sources
		for (let s of sources) {
			let is_friendly = is_controlled_by(game, s, faction)
			let is_contested_cp_region_port = is_ap_contested_cp_region_port(game, s, faction, context)
			if (is_ap_supply_beachhead(game, s, faction)) {
				is_friendly = true
			}
			if (is_black_sea_marines_supply_source(game, s, faction)) {
				is_friendly = true
			}
			if (is_contested_cp_region_port) {
				is_friendly = true
			}
			if (
				Engine.neutral &&
				typeof Engine.neutral.is_supply_trace_source_friendly_for_piece === "function" &&
				Engine.neutral.is_supply_trace_source_friendly_for_piece(game, s, faction, nation)
			) {
				is_friendly = true
			}
			if (is_friendly) {
				let source_disrupted = context.disrupted[faction][s] === 1
				if (source_disrupted) {
					disrupted_supplied.add(s)
				} else {
					full_supplied.add(s)
				}
				if (!is_contested_cp_region_port) {
					queue.push({ s, disrupted: source_disrupted })
				}
			}
		}

		while (queue_head < queue.length) {
			let { s: current, disrupted: current_disrupted } = queue[queue_head++]
			let neighbors = get_connected_spaces(game, current, nation, faction, p, "supply")

			for (let next of neighbors) {
				let contested_region = is_contested_region_with_context(game, next, faction, context)

				// Blocked by enemy regular units (unless besieged). Contested Regions are allowed:
				// the SR/path layer separately controls whether enemy-controlled contested Regions may be passed through.
				if (
					context.enemy_regular[faction][next] === 1 &&
					!is_besieged_with_context(game, next, context) &&
					!contested_region
				)
					continue

				// Neutral spaces block supply except for the Rule 19.2.3 Greece privileges.
				if (is_supply_trace_blocked_by_neutrality(game, next, faction, context)) continue

				// Rule 14.1.3: Enemy Full Control blocks supply.
				// Partial Control (irregular units/tribes) does not.
				// If enemy controlled and has no pieces, it's Full Control.
				let is_friendly = is_controlled_by(game, next, faction)
				if (is_ap_supply_beachhead(game, next, faction)) {
					is_friendly = true
				}
				let is_besieged_enemy = is_besieged_with_context(game, next, context)
				let is_disrupted_by_enemy = context.disrupted[faction][next] === 1

				// Rule 14.1.3: Friendly besieged Fort blocks supply trace.
				if (is_friendly && is_besieged_enemy && get_fort_owner(game, next) === faction) continue

				// Uprising markers disrupt supply but do not change control; only Full Control,
				// actual Partial Control, friendly pieces, or a besieged enemy fort let the trace pass.
				if (!can_trace_supply_through_space(game, next, faction, context, { is_friendly, is_besieged_enemy }))
					continue

				let next_disrupted = current_disrupted || is_disrupted_by_enemy

				if (next_disrupted) {
					if (full_supplied.has(next) || disrupted_supplied.has(next)) continue
					disrupted_supplied.add(next)
					if (can_expand_supply_trace_from_space(game, next, faction)) {
						queue.push({ s: next, disrupted: true })
					}
				} else {
					if (full_supplied.has(next)) continue
					full_supplied.add(next)
					if (can_expand_supply_trace_from_space(game, next, faction)) {
						queue.push({ s: next, disrupted: false })
					}
					// If this was already marked as disrupted, it's now full
					disrupted_supplied.delete(next)
				}
			}
		}
		return { full: full_supplied, disrupted: disrupted_supplied }
	}

	function needs_piece_specific_supply_trace(p) {
		if (p === -1 || p === undefined || p === null) return false
		if (is_tribe(p)) return true
		let name = data.pieces[p] && data.pieces[p].name
		return !!(name && name.startsWith("CAsia Uprising"))
	}

	function get_supplied_spaces_cached(game, cache, sources, faction, p, supply_context = null) {
		if (!cache) return get_supplied_spaces(game, sources, faction, p, supply_context)
		let key = `${faction}|${p}|${sources.join(",")}`
		if (!cache.has(key)) {
			cache.set(key, get_supplied_spaces(game, sources, faction, p, supply_context))
		}
		return cache.get(key)
	}

	let supply_space_ids_cache = null
	// 仅允许“真实地图空间”进入补给计算/显示：
	// 排除 Reserve/Eliminated Box、reinforcement 槽位、UI 坐标点、生成的占位槽位。
	function is_supply_eligible_space(s) {
		let info = data.spaces[s]
		if (!info || s <= 0) return false
		if (info.type === "generated_gap") return false
		if (info.type === "reinforcement" || info.type === "ui") return false
		return info.map !== "Reserve Box"
	}

	function get_supply_eligible_space_ids() {
		if (supply_space_ids_cache) return supply_space_ids_cache
		let list = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (is_supply_eligible_space(s)) list.push(s)
		}
		supply_space_ids_cache = list
		return list
	}

	// --- Supply Source Helpers ---

	function is_ana_unit(info) {
		return !!(info && info.name === "BR ANA Arab")
	}

	function is_special_ru_allied_supply_unit(info) {
		return !!(info && info.name && (info.name.includes("2/4 Special") || info.name.includes("Yugo")))
	}

	function is_british_supply_nation(nation) {
		return ["br", "fr", "it", "in", "anz"].includes(nation)
	}

	function is_ottoman_full_supply_source_name(name) {
		return ["CONSTANTINOPLE", "Kayseri", "Erzincan", "Damascus", "Baghdad"].includes(name)
	}

	function is_named_ru_supply_source(game, s) {
		let info = data.spaces[s]
		if (!info) return false
		let name = info.name
		if (["Odessa", "TIFLIS", "Central Asia", "Petrovsk"].includes(name)) return true
		return name === "Trabzon" && game.vps && game.vps[s] === "ru"
	}

	function has_ap_controlled_ru_supply_source_on_sea(game, port_predicate) {
		for (let s of get_supply_eligible_space_ids()) {
			if (!is_named_ru_supply_source(game, s)) continue
			if (!is_controlled_by(game, s, AP)) continue
			if (port_predicate(game, s)) return true
		}
		return false
	}

	function add_ru_sea_supply_entries(game, list) {
		let has_black_sea_source = has_ap_controlled_ru_supply_source_on_sea(game, is_black_sea_port)
		let has_caspian_source = has_ap_controlled_ru_supply_source_on_sea(game, is_caspian_sea_port)
		if (!has_black_sea_source && !has_caspian_source) return

		for (let s of get_supply_eligible_space_ids()) {
			if (!is_controlled_by(game, s, AP)) continue
			if (has_black_sea_source && is_black_sea_port(game, s)) {
				if (!list.includes(s)) list.push(s)
			}
			if (has_caspian_source && is_caspian_sea_port(game, s)) {
				if (!list.includes(s)) list.push(s)
			}
		}
	}

	function is_cp_afghanistan_full_supply_source(game, s) {
		return !!(
			data.spaces[s] &&
			data.spaces[s].name === "Afghanistan" &&
			game.events &&
			game.events["afghan_alliance"] &&
			is_controlled_by(game, s, CP)
		)
	}

	function is_cp_port_supply_entry_for_turkish(game, s) {
		let info = data.spaces[s]
		if (!info || !info.port || !is_controlled_by(game, s, CP) || is_caspian_sea_port(game, s)) return false
		let blockade = !!(game.events && game.events["royal_navy_blockade"])
		return !blockade || is_black_sea_port(game, s)
	}

	function is_ap_controlled_port(game, s) {
		if (!data.spaces[s] || !data.spaces[s].port || !is_controlled_by(game, s, AP)) return false
		if (s === BASRA && !is_controlled_by(game, FAO, AP)) return false
		return true
	}

	function is_ap_controlled_port_or_beachhead(game, s) {
		if (!data.spaces[s]) return false
		if (is_beachhead_space(game, s)) return is_controlled_by(game, s, AP)
		return is_ap_controlled_port(game, s)
	}

	function add_ap_controlled_ports(game, list, predicate = null) {
		for (let s of get_supply_eligible_space_ids()) {
			if (!is_ap_controlled_port(game, s)) continue
			if (predicate && !predicate(s)) continue
			if (!list.includes(s)) list.push(s)
		}
	}

	function add_supply_sources(list, sources) {
		for (let s of sources) {
			if (!list.includes(s)) list.push(s)
		}
	}

	function add_cp_afghanistan_if_full(game, list) {
		if (AFGHANISTAN_SPACE > 0 && is_cp_afghanistan_full_supply_source(game, AFGHANISTAN_SPACE)) {
			if (!list.includes(AFGHANISTAN_SPACE)) list.push(AFGHANISTAN_SPACE)
		}
	}

	function is_base_supply_source(game, s, faction, nation = null, for_placement_or_sr = false) {
		const { AP, CP } = Engine.constants
		let info = data.spaces[s]
		if (!info) return false
		let name = info.name

		if (faction === CP) {
			if (nation) {
				if (is_cp_afghanistan_full_supply_source(game, s)) return true
				if (nation === "bu") return name === "SOFIA" && !!(game.events && game.events["bulgaria"])
				if (nation === "ge" || nation === "ah") return is_galicia(s)
				if (nation === "tu" || nation === "tua") {
					return is_ottoman_full_supply_source_name(name) || is_cp_port_supply_entry_for_turkish(game, s)
				}
			}

			if (["Galicia", "SOFIA", "CONSTANTINOPLE", "Kayseri", "Erzincan", "Damascus", "Baghdad"].includes(name)) {
				if (name === "SOFIA") return !!(game.events && game.events["bulgaria"])
				return true
			}

			if (["Medina", "Mecca", "Maan", "Afghanistan"].includes(name)) {
				return true
			}
			if (name === "Central Asia" && game.events && game.events["central_asia_rebellion"]) {
				return true
			}

			if (info.port && is_controlled_by(game, s, CP) && !is_caspian_sea_port(game, s)) {
				let blockade = !!(game.events && game.events["royal_navy_blockade"])
				if (!blockade) return true
				if (is_black_sea_port(game, s)) return true
			}
		}

		if (faction === AP) {
			const CYPRUS = 183
			if (s === CYPRUS && !(game.events && game.events["egyptian_coup"])) return false

			// Russian Supply Sources (14.2.2) (RU)
			if (!nation || nation === "ru" || nation === "ro" || nation === "sb") {
				if (is_named_ru_supply_source(game, s)) return true
				if (is_black_sea_marines_supply_nation(nation) && is_black_sea_marines_special_fort(game, s))
					return true
			}

			// British Supply Sources (14.2.3) (BR)
			if (!nation || ["br", "fr", "it", "in", "anz", "sb", "gr"].includes(nation)) {
				if (is_sudan_and_darfur(s) || is_india(s)) return true
				// Island Bases (Lemnos, Cyprus)
				if (is_island_base(game, s) && is_controlled_by(game, s, AP)) {
					return true
				}
			}

			// Rule 14.1.4 lets AP units trace supply through friendly ports, but those ports are
			// operational sea-supply entries. Placement/rebuild restrictions are handled by
			// reinforcement and replacement rules, so for_placement_or_sr keeps the narrower
			// placement/SR source list expected by those callers.
			if (
				info.port &&
				!(s === BASRA && !is_controlled_by(game, FAO, AP)) &&
				(is_controlled_by(game, s, AP) || is_ap_contested_cp_region_port(game, s, AP))
			) {
				let is_contested_cp_region_port = is_ap_contested_cp_region_port(game, s, AP)
				if (!for_placement_or_sr) {
					if (!nation || is_british_supply_nation(nation) || (nation === "sb" && is_aegean_port(s))) {
						return true
					}
				}
				let allow_generic_ap_port =
					!nation || (for_placement_or_sr && ["br", "fr", "it", "in", "anz"].includes(nation))
				if (
					allow_generic_ap_port &&
					(is_contested_cp_region_port || is_mediterranean_port(s) || is_persian_gulf_port(game, s))
				) {
					return true
				}
			}

			// Special: Arab Northern Army (14.2.7)
			if (nation === "ar" && is_hejaz(s)) return true

			// Special: Greece (14.2.6)
			if (info.nation === "gr") {
				if (nation === "gr" && s === ATHENS && is_controlled_by(game, s, AP)) {
					return true
				}
				if (
					Engine.neutral.is_greek_controlled_by_faction(game, AP) ||
					(Engine.neutral.is_greece_neutral(game) &&
						game.events &&
						game.events["salonika_is_port"] &&
						info.name === "Salonika")
				) {
					if (info.name === "Salonika") {
						return true
					}
				}
				if (Engine.neutral.is_greece_neutral(game) && nation === "gr") {
					return true
				}
			}
		}

		return false
	}

	function is_mediterranean_port(s) {
		return is_aegean_east_med_port(s)
	}

	function is_persian_gulf_port(game, s) {
		if (!data.spaces[s] || !data.spaces[s].port) return false
		let name = data.spaces[s].name
		if (["Fao", "Abadan", "Kuwait", "Bahrain", "Bushire"].includes(name)) return true
		if (s === BASRA) {
			return is_controlled_by(game, FAO, AP)
		}
		return false
	}

	function is_persian_gulf_beachhead(game, s) {
		let space = data.spaces[s]
		return !!(space && is_beachhead_space(game, s) && space.beach_for === "Bahrain")
	}

	function is_persian_gulf_port_or_beachhead(game, s) {
		return is_persian_gulf_port(game, s) || is_persian_gulf_beachhead(game, s)
	}

	function is_red_sea_port(s) {
		if (!data.spaces[s] || !data.spaces[s].port) return false
		return ["Aqaba", "Jiddah", "Suez"].includes(data.spaces[s].name) || is_sudan_and_darfur(s)
	}

	function get_supply_sources_from_data(game, faction, for_placement_or_sr = false) {
		let list = []
		for (let s of get_supply_eligible_space_ids()) {
			if (is_base_supply_source(game, s, faction, null, for_placement_or_sr)) {
				list.push(s)
			}
		}
		// Rule 14.1.4: Tracing Supply through Constantinople (Bosphorus/Dardanelles check)
		// This is a trace check, not a "base source" check.
		// But if Constantinople is a source, it's already added.
		return list
	}

	function get_supply_sources_from_data_cached(game, faction, for_placement_or_sr, source_cache) {
		if (!source_cache) return get_supply_sources_from_data(game, faction, for_placement_or_sr)
		let key = `all|${faction}|${for_placement_or_sr ? 1 : 0}`
		if (!source_cache.has(key)) {
			source_cache.set(key, get_supply_sources_from_data(game, faction, for_placement_or_sr))
		}
		return source_cache.get(key)
	}

	function get_ru_supply_sources(game, for_placement_or_sr = false) {
		let ru_sources = []
		for (let s of get_supply_eligible_space_ids()) {
			if (is_base_supply_source(game, s, AP, "ru", for_placement_or_sr)) {
				ru_sources.push(s)
			}
		}
		add_ru_sea_supply_entries(game, ru_sources)
		return ru_sources
	}

	function get_ru_supply_sources_cached(game, for_placement_or_sr, source_cache) {
		if (!source_cache) return get_ru_supply_sources(game, for_placement_or_sr)
		let key = `ru|${for_placement_or_sr ? 1 : 0}`
		if (!source_cache.has(key)) {
			source_cache.set(key, get_ru_supply_sources(game, for_placement_or_sr))
		}
		return source_cache.get(key)
	}

	function get_gr_supply_sources(game, for_placement_or_sr = false) {
		let gr_sources = []
		for (let s of get_supply_eligible_space_ids()) {
			if (is_base_supply_source(game, s, AP, "gr", for_placement_or_sr)) {
				gr_sources.push(s)
			}
		}
		return gr_sources
	}

	function get_gr_supply_sources_cached(game, for_placement_or_sr, source_cache) {
		if (!source_cache) return get_gr_supply_sources(game, for_placement_or_sr)
		let key = `gr|${for_placement_or_sr ? 1 : 0}`
		if (!source_cache.has(key)) {
			source_cache.set(key, get_gr_supply_sources(game, for_placement_or_sr))
		}
		return source_cache.get(key)
	}

	function get_ap_supply_split_projection(
		game,
		supply_trace_cache = null,
		supply_context = null,
		source_cache = null
	) {
		let trace_cache = supply_trace_cache || new Map()
		let context = supply_context || create_supply_context(game)
		let src_cache = source_cache || new Map()
		let ap_sources = get_supply_sources_from_data_cached(game, AP, false, src_cache).concat(
			get_beachhead_spaces(game, AP)
		)
		let ru_sources = get_ru_supply_sources_cached(game, false, src_cache)
		let gr_sources = get_gr_supply_sources_cached(game, false, src_cache)
		let eastern_sources = ru_sources.concat(gr_sources)
		let ru_source_flag = build_space_flag_from_sources(ru_sources)
		let western_sources = ap_sources.filter((s) => ru_source_flag[s] !== 1)
		let eastern_supply = get_supplied_spaces_cached(game, trace_cache, eastern_sources, AP, -1, context)
		let western_supply = get_supplied_spaces_cached(game, trace_cache, western_sources, AP, -1, context)
		let western = []
		let eastern = []
		for (let s of get_supply_eligible_space_ids()) {
			western[s] = western_supply.full.has(s) || western_supply.disrupted.has(s) ? 1 : 0
			eastern[s] = eastern_supply.full.has(s) || eastern_supply.disrupted.has(s) ? 1 : 0
		}
		return { western, eastern }
	}

	function can_trace_supply_to_ap_port(game, start, faction) {
		if (start <= 0) return false
		let ports = []
		for (let s of get_supply_eligible_space_ids()) {
			if ((data.spaces[s].port && is_controlled_by(game, s, AP)) || is_beachhead_space(game, s)) {
				ports.push(s)
			}
		}
		return can_trace_supply_to_source(game, start, faction, ports)
	}

	function check_supply_for_faction(
		game,
		faction,
		supply_trace_cache = null,
		supply_context = null,
		source_cache = null,
		status_cache = null
	) {
		// Pre-calculate supply for non-tribes
		for (let p = 0; p < game.pieces.length; p++) {
			if (is_not_on_map(game, p)) continue // Off map or in special boxes
			if (get_piece_effective_faction(game, p) !== faction) continue

			let s = game.pieces[p]

			// Rule 17.1.4 / 17.2.2: Tribe range legality is enforced by movement/retreat rules.
			// Tribes should not enter the generic OOS pipeline during supply checks.
			if (is_tribe(p)) {
				set_delete(game.oos, p)
				set_delete(game.disrupted_supply, p)
				set_delete(game.limited_supply, p)
				if (game.supply_status) game.supply_status[p] = null
				continue
			}

			let status = get_supply_status(
				game,
				s,
				faction,
				p,
				false,
				supply_trace_cache,
				supply_context,
				source_cache,
				status_cache
			)
			game.supply_status[p] = status
			if (status === "OOS") {
				set_add(game.oos, p)
				set_delete(game.limited_supply, p)
				set_delete(game.disrupted_supply, p)
			} else {
				set_delete(game.oos, p)
				if (is_limited_supply_status(status)) {
					set_add(game.limited_supply, p)
				} else {
					set_delete(game.limited_supply, p)
				}
				if (is_disrupted_supply_status(status)) {
					set_add(game.disrupted_supply, p)
				} else {
					set_delete(game.disrupted_supply, p)
				}
			}
		}
	}

	function check_supply(game) {
		game.oos = []
		game.oos_spaces = []
		game.supply_status = new Array(game.pieces.length).fill(null)
		game.limited_supply = []
		game.disrupted_supply = []
		let supply_trace_cache = new Map()
		let source_cache = new Map()
		let status_cache = new Map()
		let supply_context = create_supply_context(game)
		check_supply_for_faction(game, AP, supply_trace_cache, supply_context, source_cache, status_cache)
		check_supply_for_faction(game, CP, supply_trace_cache, supply_context, source_cache, status_cache)
		let ap_sources = get_supply_sources_from_data_cached(game, AP, false, source_cache).concat(
			get_beachhead_spaces(game, AP)
		)
		let cp_sources = get_supply_sources_from_data_cached(game, CP, false, source_cache)
		let ap_supply = get_supplied_spaces_cached(game, supply_trace_cache, ap_sources, AP, -1, supply_context)
		let cp_supply = get_supplied_spaces_cached(game, supply_trace_cache, cp_sources, CP, -1, supply_context)

		// Rule 14.2.10: Cyprus is always in supply if no Egyptian Coup
		if (!(game.events && game.events["egyptian_coup"])) {
			for (let s of get_supply_eligible_space_ids()) {
				let info = data.spaces[s]
				if (info && (info.name === "Cyprus" || info.beach_for === "Cyprus")) {
					ap_supply.full.add(s)
					cp_supply.full.add(s)
				}
			}
		}

		let projection_ap = []
		let projection_cp = []
		game.supply_projection = { ap: projection_ap, cp: projection_cp }
		delete game.supply_projection_ap_split

		// Rule 14.3.3 & 15.4.6: Check all friendly controlled spaces for supply
		for (let s of get_supply_eligible_space_ids()) {
			let info = data.spaces[s]
			projection_ap[s] = ap_supply.full.has(s) || ap_supply.disrupted.has(s) ? 1 : 0
			projection_cp[s] = cp_supply.full.has(s) || cp_supply.disrupted.has(s) ? 1 : 0

			if (is_potential_beachhead_space(s) && !is_beachhead_space(game, s)) {
				continue
			}

			// Cyprus (Rule 14.2.10) is always in supply if no coup
			if (
				!(game.events && game.events["egyptian_coup"]) &&
				(info.name === "Cyprus" || info.beach_for === "Cyprus")
			) {
				continue
			}

			let faction = get_space_controller(game, s)
			if (faction === AP || faction === CP) {
				let supply_info = faction === AP ? ap_supply : cp_supply
				let status = "OOS"
				if (supply_info.full.has(s)) status = "FULL"
				else if (supply_info.disrupted.has(s)) status = "DISRUPTED"
				if (
					status === "OOS" &&
					Engine.neutral &&
					typeof Engine.neutral.has_home_supply_for_attrition === "function" &&
					Engine.neutral.has_home_supply_for_attrition(game, s, faction)
				) {
					status = "FULL"
				}
				if (status === "OOS") {
					// Rule 14.3.3: Space becomes enemy controlled during attrition phase
					// We mark it here, and start_attrition_phase will handle the actual control change
					set_add(game.oos_spaces, s)
				}
			}
		}
	}

	function get_supply_status(
		game,
		space,
		faction,
		p = -1,
		for_placement_or_sr = false,
		supply_trace_cache = null,
		supply_context = null,
		source_cache = null,
		status_cache = null
	) {
		let cache_key = null
		if (status_cache) {
			cache_key = `${space}|${faction}|${p}|${for_placement_or_sr ? 1 : 0}`
			if (status_cache.has(cache_key)) return status_cache.get(cache_key)
		}
		function cache_result(result) {
			if (status_cache) status_cache.set(cache_key, result)
			return result
		}
		function home_supply_status() {
			let disrupted = supply_context
				? supply_context.disrupted && supply_context.disrupted[faction]?.[space] === 1
				: is_disrupted_by_enemy(game, space, faction)
			return disrupted ? "DISRUPTED" : "FULL"
		}
		if (space < 1 || space >= data.spaces.length || !data.spaces[space]) {
			return cache_result("OOS")
		}
		if (p !== -1 && is_not_on_map(game, p)) return cache_result("FULL")
		let nation = p !== -1 ? data.pieces[p].nation : null
		if (p !== -1) {
			let effective_faction = get_piece_effective_faction(game, p)
			if (
				effective_faction === "neutral" &&
				Engine.neutral &&
				typeof Engine.neutral.is_on_bulgaria_entry_display === "function" &&
				Engine.neutral.is_on_bulgaria_entry_display(game, p)
			) {
				return cache_result("FULL")
			}
			if (effective_faction === AP || effective_faction === CP) {
				faction = effective_faction
			}
		}

		// 1. Special "Always in Supply" rules (Rule 14.2.5 - 14.2.11, Rule 16.1.5)
		let info = data.spaces[space]
		// Rule 14.2.10: Cyprus is always in supply if no Egyptian Coup
		if (!(game.events && game.events["egyptian_coup"]) && (info.name === "Cyprus" || info.beach_for === "Cyprus")) {
			return cache_result("FULL")
		}

		if (p !== -1) {
			let name = data.pieces[p].name

			if (name === "GE GeoProtect") return cache_result("FULL")
			if (
				Engine.events &&
				typeof Engine.events.is_transcaucasian_federation_piece === "function" &&
				typeof Engine.events.get_russian_revolution_level === "function" &&
				Engine.events.get_russian_revolution_level(game) >= 4 &&
				Engine.events.is_transcaucasian_federation_piece(p) &&
				(is_russia(space) || is_caucasus(space))
			) {
				return cache_result("FULL")
			}
			if (name === "BR ANA Arab" && is_hejaz(space)) return cache_result("FULL")

			// Rule 16.1.5: HQs are never out of supply
			if (is_hq(p)) return cache_result("FULL")
			// Tribes are never out of supply
			if (is_tribe(p)) return cache_result("FULL")

			// Event-spawned rebels/uprisings
			if (name.startsWith("Egypt Rebel")) {
				let region = get_region(space)
				if (
					region === "Sudan and Darfur" ||
					data.spaces[space].name === "Khartoum" ||
					[
						"Port Said",
						"Ismailia",
						"Suez",
						"CAIRO",
						"Alexandria",
						"Zagazig",
						"Faiyum",
						"Gara",
						"Mersa Matruh",
						"Sidi Barrani",
						"Sollum",
						"Siwa Oasis",
						"Bahariya Oasis"
					].includes(data.spaces[space].name)
				) {
					return cache_result("FULL")
				}
			} else if (name.startsWith("Afghan Uprising")) {
				if (is_afghanistan(space) || data.spaces[space].name === "Afghanistan") return cache_result("FULL")
			} else if (name.startsWith("Indian Mutiny")) {
				if (is_india(space) || data.spaces[space].name === "INDIA") return cache_result("FULL")
			} else if (name.startsWith("CAsia Uprising")) {
				if (is_central_asia(space) || data.spaces[space].name === "Central Asia") return cache_result("FULL")
			} else if (name === "Arab faisal Revolt" || name.startsWith("Arab Revolt #")) {
				if (is_hejaz(space) || is_syria_palestine(space)) return cache_result("FULL")
			} else if (name === "Armenian Uprising") {
				if (is_anatolia(space) || is_caucasus(space) || data.spaces[space].nation === "ru") {
					return cache_result(home_supply_status())
				}
			}

			// National "Home" supply rules
			if (
				p !== -1 &&
				Engine.neutral &&
				typeof Engine.neutral.has_home_supply_privilege === "function" &&
				Engine.neutral.has_home_supply_privilege(game, p, space, faction)
			) {
				let status = home_supply_status()
				if (
					typeof Engine.neutral.home_supply_privilege_ignores_disruption === "function" &&
					Engine.neutral.home_supply_privilege_ignores_disruption(game, p, space, faction)
				) {
					status = "FULL"
				}
				return cache_result(status)
			} else if (nation === "geo" || nation === "arm") {
				if (is_caucasus(space) || is_georgia(space)) return cache_result(home_supply_status())
			} else if (nation === "ar") {
				if (is_hejaz(space)) return cache_result(home_supply_status())
			}
		}

		// 2. Rule 14.1.6: Desert Rule (LCU in Desert must be connected via Rail to a Supply Source)
		if (p !== -1 && is_lcu(p) && data.spaces[space].terrain === DESERT) {
			// ANZ Desert Corps (Rule 14.2.11) exception: always in supply in Desert
			if (data.pieces[p].name && data.pieces[p].name.includes("ANZ Desert Corps")) return cache_result("FULL")
			if (is_rail_connected_to_supply(game, space, faction)) return cache_result("FULL")
			return cache_result("OOS")
		}

		// 3. Regular Supply Trace
		// Use nation-specific sources if a piece is provided, otherwise use all faction sources
		let sources
		if (p !== -1) {
			sources = get_full_supply_sources_for_unit(game, p, for_placement_or_sr, source_cache)
		} else {
			sources = get_supply_sources_from_data_cached(game, faction, for_placement_or_sr, source_cache)
			if (faction === AP) {
				sources = sources.concat(get_beachhead_spaces(game, faction))
			}
		}

		let trace_piece = needs_piece_specific_supply_trace(p) ? p : -1
		let supply_info = get_supplied_spaces_cached(
			game,
			supply_trace_cache,
			sources,
			faction,
			trace_piece,
			supply_context
		)
		let full_trace_status = get_supply_trace_status_from_info(supply_info, space)
		if (full_trace_status !== "OOS") return cache_result(full_trace_status)

		// 4. Limited Supply Check (Rule 14.2.8 / 14.2.2 / 14.2.3)
		// If not in Full Supply, check if it can trace supply to ANY base source of the faction
		if (p !== -1) {
			if (faction === CP && !(game.events && game.events["afghan_alliance"])) {
				let afghanistan_trace_status = get_supply_trace_status_to_source(
					game,
					space,
					faction,
					AFGHANISTAN_SPACE,
					supply_context
				)
				let afghanistan_limited_status = get_limited_supply_status_from_trace_status(afghanistan_trace_status)
				if (afghanistan_limited_status !== "OOS") return cache_result(afghanistan_limited_status)
			}

			let all_faction_sources = get_supply_sources_from_data_cached(
				game,
				faction,
				for_placement_or_sr,
				source_cache
			)
			if (faction === AP) all_faction_sources = all_faction_sources.concat(get_beachhead_spaces(game, faction))

			let limited_info = get_supplied_spaces_cached(
				game,
				supply_trace_cache,
				all_faction_sources,
				faction,
				trace_piece,
				supply_context
			)
			let limited_trace_status = get_supply_trace_status_from_info(limited_info, space)
			let limited_status = get_limited_supply_status_from_trace_status(limited_trace_status)
			if (limited_status !== "OOS") return cache_result(limited_status)
		}

		return cache_result("OOS")
	}

	function is_in_supply(game, space, faction, p = -1, for_placement_or_sr = false) {
		let status = get_supply_status(game, space, faction, p, for_placement_or_sr)
		return is_supply_status_in_supply(status)
	}

	function get_full_supply_sources_for_unit(game, p, for_placement_or_sr = false, source_cache = null) {
		let info = data.pieces[p]
		let faction = get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) {
			faction = info.faction
		}
		let nation = info.nation
		let is_ana = is_ana_unit(info)
		let is_special_ru_allied = is_special_ru_allied_supply_unit(info)
		let allow_ap_beachhead = faction === AP && (!["ru", "ro"].includes(nation) || is_special_ru_allied)

		let cache_key =
			source_cache &&
			`full|${faction}|${nation}|${for_placement_or_sr ? 1 : 0}|${allow_ap_beachhead ? 1 : 0}|${
				is_ana ? 1 : 0
			}|${is_special_ru_allied ? 1 : 0}`
		if (source_cache && source_cache.has(cache_key)) return source_cache.get(cache_key)
		let full_sources = []

		// Use the base supply source logic with nation context
		for (let s of get_supply_eligible_space_ids()) {
			if (is_base_supply_source(game, s, faction, nation, for_placement_or_sr)) {
				let name = data.spaces[s].name

				// Rule 14.2.1: CP Limited Supply Sources are NOT Full Supply Sources
				// Rule 19.7.3: Afghanistan is Full Source only if allied and CP-controlled
				if (faction === CP) {
					if (["Medina", "Mecca", "Maan", "Central Asia", "Afghanistan"].includes(name)) {
						if (name === "Afghanistan") {
							if (!(game.events && game.events["afghan_alliance"] && is_controlled_by(game, s, CP))) {
								continue
							}
						} else {
							continue
						}
					}
				}

				// Rule 14.2.2/14.2.3: AP Full Supply Sources depend on nation (handled by is_base_supply_source)
				// But we must ensure that "Limited" sources (like ports for some) are correctly excluded if needed.
				// For AP, usually all base sources for that nation are Full.

				full_sources.push(s)
			}
		}

		if (faction === CP) {
			add_cp_afghanistan_if_full(game, full_sources)
		}

		if (faction === AP) {
			if (is_ana) {
				for (let s of get_supply_eligible_space_ids()) {
					if (is_hejaz(s) && !full_sources.includes(s)) full_sources.push(s)
				}
			}
			if (is_british_supply_nation(nation) || is_special_ru_allied || is_ana) {
				add_ap_controlled_ports(game, full_sources)
			} else if (nation === "sb") {
				add_supply_sources(full_sources, get_supply_sources_from_data_cached(game, AP, false, source_cache))
			}
			if (nation === "ru" || nation === "ro" || nation === "sb") {
				add_ru_sea_supply_entries(game, full_sources)
			}
			if (nation === "gr" && Engine.neutral.is_greek_controlled_by_faction(game, AP)) {
				add_supply_sources(full_sources, get_supply_sources_from_data_cached(game, AP, false, source_cache))
			}
		}

		// Rule 14.1.4: Beachheads are always Full Supply Sources for AP (except RU/RO)
		let beachheads = get_beachhead_spaces(game, faction)
		if (faction === AP && !["ru", "ro"].includes(nation)) {
			full_sources = full_sources.concat(beachheads)
		} else if (faction === AP && is_special_ru_allied) {
			// Special RU units that can use AP beachheads
			full_sources = full_sources.concat(beachheads)
		}

		// Rule 14.1.4/14.1.8: AP units in a contested CP-controlled Region can
		// use that Region's port to trace supply, but supply cannot be traced
		// through that enemy-controlled contested Region to other spaces.
		if (faction === AP && can_use_ap_contested_region_port_for_full_supply(info)) {
			for (let s of get_supply_eligible_space_ids()) {
				if (is_ap_contested_cp_region_port(game, s, faction)) full_sources.push(s)
			}
		}

		if (source_cache) source_cache.set(cache_key, full_sources)
		return full_sources
	}

	function is_in_limited_supply(game, p) {
		let faction = get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) {
			faction = data.pieces[p].faction
		}
		let status = get_supply_status(game, game.pieces[p], faction, p)
		return is_limited_supply_status(status)
	}

	function is_catastrophic_attack_supply_exception_stack_oos(game, entry, context) {
		if (!entry || entry.created_turn !== game.turn || !(entry.space > 0)) return false
		if (!Array.isArray(entry.retreat_stack)) return false
		let retreating = entry.retreat_stack.filter(
			(p) =>
				game.pieces[p] === entry.space &&
				get_piece_effective_faction(game, p) === AP &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p)
		)
		if (retreating.length === 0) return false
		return retreating.every((p) => get_supply_status(game, entry.space, AP, p, false, null, context) === "OOS")
	}

	function is_catastrophic_attack_supply_exception_transit(game, next, faction, context) {
		if (faction !== CP || !Array.isArray(game.catastrophic_attack_supply_exceptions)) return false
		return game.catastrophic_attack_supply_exceptions.some(
			(entry) => entry && entry.space === next && is_catastrophic_attack_supply_exception_stack_oos(game, entry, context)
		)
	}

	function get_supply_trace_status_to_source(game, start, faction, source, supply_context = null, options = null) {
		let context = supply_context || create_supply_context(game)
		let block_connection =
			options && typeof options.block_connection === "function" ? options.block_connection : null
		let allow_enemy_transit =
			options && typeof options.allow_enemy_transit === "function" ? options.allow_enemy_transit : null
		let sources = Array.isArray(source) ? source : [source]
		let source_flag = build_space_flag_from_sources(sources)
		let best_status = "OOS"
		if (!(start > 0) || start >= data.spaces.length || !data.spaces[start]) return best_status

		if (source_flag[start] === 1) {
			if (
				faction === CP &&
				data.spaces[start] &&
				data.spaces[start].name === "Afghanistan" &&
				!(game.events && game.events["afghan_alliance"])
			) {
				return context.disrupted[faction][start] === 1 ? "DISRUPTED" : "FULL"
			}
			if (
				is_ap_supply_beachhead(game, start, faction) ||
				is_black_sea_marines_supply_source(game, start, faction) ||
				is_controlled_by(game, start, faction) ||
				is_ap_contested_cp_region_port(game, start, faction, context)
			) {
				return context.disrupted[faction][start] === 1 ? "DISRUPTED" : "FULL"
			}
			return best_status
		}

		let visited_clean = new Set()
		let visited_disrupted = new Set()
		let start_disrupted = context.disrupted[faction][start] === 1
		if (start_disrupted) visited_disrupted.add(start)
		else visited_clean.add(start)
		let queue = [{ s: start, disrupted: start_disrupted }]
		let queue_head = 0
		while (queue_head < queue.length) {
			let { s: current, disrupted: current_disrupted } = queue[queue_head++]
			let neighbors = get_connected_spaces(game, current, undefined, faction, undefined, "supply")
			for (let next of neighbors) {
				if (block_connection && block_connection(game, current, next, faction)) continue
				let enemy_transit_allowed = !!(
					(allow_enemy_transit && allow_enemy_transit(game, current, next, faction)) ||
					is_catastrophic_attack_supply_exception_transit(game, next, faction, context)
				)

				let contested_region = is_contested_region_with_context(game, next, faction, context)
				let enemy_controlled_contested_region = is_enemy_controlled_contested_region_with_context(
					game,
					next,
					faction,
					context
				)

				// Blocked by enemy regular units (unless besieged). Contested Regions are allowed:
				// friendly-controlled ones may be traced through, enemy-controlled ones may supply units inside.
				if (
					context.enemy_regular[faction][next] === 1 &&
					!is_besieged_with_context(game, next, context) &&
					!enemy_transit_allowed &&
					!contested_region
				)
					continue

				// Neutral spaces block supply except for the Rule 19.2.3 Greece privileges.
				if (is_supply_trace_blocked_by_neutrality(game, next, faction, context)) continue

				let is_friendly = is_controlled_by(game, next, faction)
				if (is_ap_supply_beachhead(game, next, faction)) {
					is_friendly = true
				}
				let is_besieged_enemy = is_besieged_with_context(game, next, context)
				let is_disrupted_by_enemy = context.disrupted[faction][next] === 1
				let is_cp_neutral_afghanistan_source =
					source_flag[next] === 1 &&
					faction === CP &&
					data.spaces[next] &&
					data.spaces[next].name === "Afghanistan" &&
					!(game.events && game.events["afghan_alliance"])

				// Rule 14.1.3: Friendly besieged Fort blocks supply trace.
				if (is_friendly && is_besieged_enemy && get_fort_owner(game, next) === faction) continue

				// Uprising markers disrupt supply but do not change control; only Full Control,
				// actual Partial Control, friendly pieces, or a besieged enemy fort let the trace pass.
				if (
					!can_trace_supply_through_space(game, next, faction, context, {
						is_friendly,
						is_besieged_enemy,
						enemy_transit_allowed,
						is_cp_neutral_afghanistan_source
					})
				)
					continue

				let next_disrupted = current_disrupted || is_disrupted_by_enemy
				if (source_flag[next] === 1) {
					if (is_ap_contested_cp_region_port(game, next, faction, context)) continue
					if (is_cp_neutral_afghanistan_source) {
						if (!next_disrupted) return "FULL"
						best_status = "DISRUPTED"
					}
					if (!next_disrupted) return "FULL"
					best_status = "DISRUPTED"
				}

				if (next_disrupted) {
					if (visited_clean.has(next) || visited_disrupted.has(next)) continue
					visited_disrupted.add(next)
				} else {
					if (visited_clean.has(next)) continue
					visited_clean.add(next)
				}
				if (enemy_controlled_contested_region && !enemy_transit_allowed) continue
				if (!can_expand_supply_trace_from_space(game, next, faction)) continue
				queue.push({ s: next, disrupted: next_disrupted })
			}
		}
		return best_status
	}

	function can_trace_supply_to_source(game, start, faction, source, supply_context = null, options = null) {
		return get_supply_trace_status_to_source(game, start, faction, source, supply_context, options) !== "OOS"
	}

	function is_rail_connected_to_supply(game, s, faction) {
		if (!data.spaces[s]) return false
		// Rule 9.7.3 / 9.8.2 / 13.3.3 / 14.1.6:
		// The space itself must actually sit on a usable rail line. A desert/restricted
		// space that is merely a supply source or port, but has no rail exit, does not qualify.
		if (get_rail_connections(game, s, faction).length === 0) return false
		let sources = get_supply_sources_from_data(game, faction)
		if (faction === AP) {
			sources = sources.concat(game.beachheads || [])
		}
		return is_connected_by_rail(game, s, faction, sources, create_supply_context(game))
	}

	// --- Replacement Rules ---

	const AP_FALLBACK_REPLACEMENT_NATIONS = new Set(["fr", "ro", "sb", "pe", "arm", "geo", "it"])
	const AP_SHARED_BRITISH_REPLACEMENT_NATIONS = new Set(["anz", "ar", "gr"])
	const CP_GALICIA_SHARED_REPLACEMENT_NATIONS = new Set(["ah", "bu"])

	function is_br_indian_garrison_unit(info) {
		return !!(info && info.name && info.name.includes("IN Garrison"))
	}

	function is_br_persian_cordon_unit(info) {
		return !!(info && info.name && info.name.includes("Persian Cordon"))
	}

	function is_dunsterforce_unit(info) {
		return !!(info && info.name === "BR Dunsterforce")
	}

	function is_special_ru_allied_rebuild_unit(info) {
		return is_special_ru_allied_supply_unit(info)
	}

	function is_british_empire_scu_rebuild_port(game, s) {
		if (!is_ap_controlled_port_or_beachhead(game, s) || is_besieged(game, s)) return false
		if (s === AQABA || s === JIDDAH) return false
		if (is_black_sea_port(game, s) || is_caspian_sea_port(game, s)) return false
		return true
	}

	function is_special_ru_allied_rebuild_space(game, s) {
		if (s === LEMNOS) return is_controlled_by(game, s, AP) && !is_besieged(game, s)
		let space = data.spaces[s]
		return !!(
			space &&
			space.nation === "gr" &&
			is_port(s) &&
			is_controlled_by(game, s, AP) &&
			!is_besieged(game, s)
		)
	}

	function has_serbia_collapsed(game) {
		return !!(Engine.collapse && Engine.collapse.has_serbia_collapsed && Engine.collapse.has_serbia_collapsed(game))
	}

	function can_rebuild_regular_unit_in_space(game, s, faction) {
		if (is_besieged(game, s)) return false
		return !contains_enemy_pieces(game, s, faction)
	}

	function is_ru_rebuild_space(game, s) {
		if (!is_controlled_by(game, s, AP) || is_besieged(game, s)) return false
		return is_named_ru_supply_source(game, s)
	}

	function can_rebuild_in_reserve_box(p) {
		let info = data.pieces[p]
		if (!info || info.piece_class !== "SCU" || info.type !== "regular") return false
		if (is_spers_rifles_unit(p)) return false
		if (is_br_indian_garrison_unit(info)) return false
		return !is_br_persian_cordon_unit(info)
	}

	function get_replacement_cost(game, p) {
		let info = data.pieces[p]
		if (!info) return 0

		// Rule 22.1.7: Symbols (Dot and Triangle)
		// Dot units can never be replaced
		if (info.symbol === "dot") return 0

		// Rule 16.2.2: HQs can never be repaired/replaced with RPs
		if (info.type === "hq") return 0

		// Rule 16.4: Heavy Artillery cannot be rebuilt
		if (is_heavy_arty(p)) return 0

		let eliminated = is_eliminated(game, p)
		if (is_stanke_bey_unit(p)) return 0

		if (eliminated && is_spers_rifles_unit(p)) return 0

		// Triangle units: only so long as they remain on the map
		if (info.symbol === "triangle" && eliminated) return 0

		// Rule 22.1.8: Turkish Triangle units after War Weariness
		if (
			info.symbol === "triangle" &&
			(info.nation === "tu" || info.nation === "tua") &&
			game.events["turkish_war_weariness"]
		) {
			return 0
		}

		// 消灭单位重建时一律以残血状态返回 (Reserve Box 或地图)，
		// 花费与"残血→满血"相同：LCU 1 RP / SCU 0.5 RP。
		// 若玩家想要满血，需要再次点击该(现已残血)单位，以同等费用翻面。
		if (eliminated) {
			return info.piece_class === "LCU" ? 1 : 0.5
		} else if (set_has(game.reduced, p)) {
			let cost = info.piece_class === "LCU" ? 1 : 0.5
			return is_repairing_in_disrupted_supply(game, p) ? cost * 2 : cost
		}
		return 0
	}

	function is_repairing_in_disrupted_supply(game, p) {
		let s = game.pieces[p]
		if (!(s > 0) || s >= data.spaces.length || !data.spaces[s]) return false
		let faction = get_piece_effective_faction(game, p)
		if (faction !== AP && faction !== CP) faction = data.pieces[p].faction
		let status = get_supply_status(game, s, faction, p, false)
		return !is_limited_supply_status(status) && is_disrupted_supply_status(status)
	}

	function can_use_any_friendly_rp(p) {
		return is_irregular(p) || is_tribe(p)
	}

	function get_rebel_type(info) {
		// 判断是否为叛军单位 (Rule 22.2.2 / 22.1.3 叛军RP支持)
		if (info.nation !== "Re") return null
		if (info.name.includes("CAsia")) return "ca"
		if (info.name.includes("Afghan")) return "af"
		if (info.name.includes("Egypt")) return "eg"
		if (info.name.includes("Indian") || info.name.includes("Mutiny")) return "in"
		return null
	}

	function has_any_cp_rp(game, cost) {
		// 检查 CP 是否有任何可用的 RP
		let rps = game.rp_cp
		if (rps.a >= cost) return true
		if (rps.tu >= cost) return true
		return rps.ge >= cost
	}

	function spend_any_cp_rp(game, cost) {
		// 消费 CP 任意一种 RP
		let rps = game.rp_cp
		if (rps.ge >= cost) {
			rps.ge -= cost
			return true
		}
		if (rps.a >= cost) {
			rps.a -= cost
			return true
		}
		if (rps.tu >= cost) {
			rps.tu -= cost
			return true
		}
		return false
	}

	function has_enemy_regular_pieces(game, s, faction) {
		let enemy = faction === AP ? CP : AP
		for (let p of get_pieces_in_space(game, s)) {
			if (get_piece_effective_faction(game, p) !== enemy) continue
			if (data.pieces[p].type === "regular") return true
		}
		return false
	}

	function can_trace_supply_to_unoccupied_ap_port(game, start, target) {
		if (start <= 0 || target <= 0) return false
		let visited = new Set([start])
		let queue = [start]
		while (queue.length > 0) {
			let current = queue.shift()
			let neighbors = get_connected_spaces(game, current, undefined, CP)
			for (let next of neighbors) {
				if (next === target) return true
				if (visited.has(next)) continue
				if (has_enemy_regular_pieces(game, next, CP) && !is_besieged(game, next)) continue
				if (data.spaces[next].nation === "neutral") continue
				let friendly = is_controlled_by(game, next, CP)
				let besieged = is_besieged(game, next)
				let friendly_pieces = has_friendly_pieces(game, next, CP)
				let partial_control = has_partial_control(game, next)
				if (!friendly && !besieged && !friendly_pieces && !partial_control) continue
				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	function can_trace_tribe_replacement_supply(game, p) {
		// Rule 22.1.3: 部落 (Tribes) 重建补给限制
		// 只能当 CP 玩家可以从部落颜色对应的任意空间追踪补给线到以下三种之一：
		// 1) CP 补给源, 2) 友方港口(任何海域), 3) 未被占领的 AP 控制的港口(任何海域)
		if (!is_tribe(p)) return false
		let tribe_type = get_tribe_type(p)
		let tribal_spaces = get_tribal_spaces(tribe_type)
		if (tribal_spaces.length === 0) return false

		let sources = get_supply_sources_from_data(game, CP)
		let friendly_ports = []
		let ap_ports = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!is_port(s)) continue
			if (is_controlled_by(game, s, CP)) {
				friendly_ports.push(s)
			} else if (is_controlled_by(game, s, AP) && get_pieces_in_space(game, s).length === 0) {
				ap_ports.push(s)
			}
		}

		let all_cp_sources = sources.concat(friendly_ports)

		for (let start of tribal_spaces) {
			if (can_trace_supply_to_source(game, start, CP, all_cp_sources)) return true
			for (let port of ap_ports) {
				if (can_trace_supply_to_unoccupied_ap_port(game, start, port)) return true
			}
		}

		return false
	}

	function get_turkish_replacement_supply_sources(game, faction) {
		let sources = []
		for (let i = 1; i < data.spaces.length; i++) {
			let info = data.spaces[i]
			if (!info || !is_ottoman_full_supply_source_name(info.name)) continue
			if (!is_controlled_by(game, i, faction) || is_besieged(game, i)) continue
			sources.push(i)
		}
		return sources
	}

	function get_galicia_replacement_supply_sources(game, faction) {
		let sources = []
		for (let s of GALICIA_REPLACEMENT_SPACE_IDS) {
			if (!is_controlled_by(game, s, faction) || is_besieged(game, s)) continue
			sources.push(s)
		}
		return sources
	}

	function get_british_replacement_supply_sources(game) {
		let sources = []
		for (let i = 1; i < data.spaces.length; i++) {
			if (is_base_supply_source(game, i, AP, "br", true)) sources.push(i)
			else if (is_port(i) && is_controlled_by(game, i, AP)) sources.push(i)
		}
		return sources
	}

	function can_trace_replacement_supply_to_sofia(game, p) {
		return can_trace_piece_supply_to_space(game, p, SOFIA, {
			faction: CP,
			require_unbesieged: true,
			allow_off_map: true
		})
	}

	function can_trace_replacement_supply_to_turkey(game, p) {
		let info = data.pieces[p]
		if (!info) return false
		return can_trace_piece_supply_to_sources(game, p, get_turkish_replacement_supply_sources(game, info.faction), {
			faction: info.faction
		})
	}

	function can_trace_replacement_supply_to_galicia(game, p) {
		let info = data.pieces[p]
		if (!info) return false
		if (is_not_on_map(game, p)) {
			if (info.nation === "ge" || info.nation === "ah") return true
			if (info.nation === "bu") {
				if (SOFIA < 0 || !is_controlled_by(game, SOFIA, CP) || is_besieged(game, SOFIA)) return false
				return can_trace_supply_to_source(
					game,
					SOFIA,
					info.faction,
					get_galicia_replacement_supply_sources(game, info.faction)
				)
			}
			return false
		}
		return can_trace_piece_supply_to_sources(game, p, get_galicia_replacement_supply_sources(game, info.faction), {
			faction: info.faction
		})
	}

	function can_trace_replacement_supply_to_british_source(game, p) {
		return can_trace_piece_supply_to_sources(game, p, get_british_replacement_supply_sources(game), { faction: AP })
	}

	function can_trace_replacement_supply_to_russian_source(game, p) {
		return can_trace_piece_supply_to_sources(game, p, get_ru_supply_sources(game, true), { faction: AP })
	}

	function is_replacement_capital_restricted(game, nation) {
		// Rule 22.1.5: SB and GR units are not affected by this restriction.
		if (nation === "sb" || nation === "gr") return false

		// Rule 22.1.5: British/Russian capitals are off-map, thus never enemy-controlled or besieged.
		if (["ru", "br", "in", "anz"].includes(nation)) return false

		let capital = find_capital(nation)
		if (capital >= 0) {
			let owner_faction = get_default_controller(game, capital)
			if (owner_faction !== AP && owner_faction !== CP) {
				owner_faction = data.spaces[capital].faction === "ap" ? AP : CP
			}
			let enemy = other_faction(owner_faction)
			// Rule 22.1.5: currently enemy-controlled or besieged
			return is_controlled_by(game, capital, enemy) || is_besieged(game, capital)
		}

		return false
	}

	function is_rail_connected_to_galicia(game) {
		if (CONSTANTINOPLE < 0 || !is_controlled_by(game, CONSTANTINOPLE, CP)) return false
		let target = build_space_flag_from_sources(GALICIA_REPLACEMENT_SPACE_IDS)
		let queue = [CONSTANTINOPLE]
		let queue_head = 0
		let visited = new Set([CONSTANTINOPLE])

		while (queue_head < queue.length) {
			let current = queue[queue_head++]

			if (target[current] === 1 && is_controlled_by(game, current, CP)) return true

			let neighbors = get_rail_connections(game, current, CP)
			for (let next of neighbors) {
				if (visited.has(next)) continue
				if (contains_enemy_pieces(game, next, CP) && !is_besieged(game, next)) continue
				if (!is_controlled_by(game, next, CP)) continue
				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	function can_convert_ge_to_tu_unlimited(game) {
		if (game.no_ge_to_tu_rp_conversion) return false
		if (!game.events || !game.events["bulgaria"]) return false

		if (CONSTANTINOPLE < 0) return false
		if (!is_controlled_by(game, CONSTANTINOPLE, CP)) return false

		return is_rail_connected_to_galicia(game)
	}

	function can_use_ge_rp_for_tu(game, cost) {
		if (game.no_ge_to_tu_rp_conversion) return false
		if (can_convert_ge_to_tu_unlimited(game)) return true
		return game.ge_to_tu_rp_used + cost <= 1
	}

	function get_ge_to_tu_conversion_budget(game, rps) {
		if (game.no_ge_to_tu_rp_conversion) return 0
		let ge_available = Number(rps.ge || 0)
		if (ge_available <= 0) return 0
		if (can_convert_ge_to_tu_unlimited(game)) return ge_available
		let remaining = Math.max(0, 1 - Number(game.ge_to_tu_rp_used || 0))
		return Math.min(ge_available, remaining)
	}

	function get_turkish_replacement_payment_plan(game, cost, rps) {
		let remaining = Number(cost || 0)
		let ge_spend = Math.min(get_ge_to_tu_conversion_budget(game, rps), remaining)
		remaining -= ge_spend

		let tu_spend = Math.min(Number(rps.tu || 0), remaining)
		remaining -= tu_spend

		if (remaining > 1e-9) return null
		return { ge: ge_spend, tu: tu_spend }
	}

	function add_blockade_tu_recovery_credit_from_ge(game, amount) {
		if (!(game.events && game.events["royal_navy_blockade"])) return
		game.tu_rp_ge_converted = Math.max(0, Number(game.tu_rp_ge_converted || 0)) + amount
	}

	const REPLACEMENT_SUPPLY_REQUIREMENTS = {
		ge: { any: ["sofia", "turkey"], require: "galicia" },
		ah: { any: ["sofia", "turkey"], require: "galicia" },
		tu: { any: ["sofia", "galicia"], require: "turkey" },
		tua: { any: ["sofia", "galicia"], require: "turkey" },
		bu: { any: ["galicia", "turkey"], require: "sofia" },
		ru: { any: ["british"], require: "russian" },
		br: { any: ["russian"], require: "british" },
		in: { any: ["russian"], require: "british" },
		anz: { any: ["russian"], require: "british" }
	}

	function can_trace_replacement_supply_group(game, p, key) {
		if (key === "sofia") return can_trace_replacement_supply_to_sofia(game, p)
		if (key === "galicia") return can_trace_replacement_supply_to_galicia(game, p)
		if (key === "turkey") return can_trace_replacement_supply_to_turkey(game, p)
		if (key === "british") return can_trace_replacement_supply_to_british_source(game, p)
		if (key === "russian") return can_trace_replacement_supply_to_russian_source(game, p)
		return false
	}

	function can_use_replacement_supply_as_nation(game, p, s, nation) {
		if (is_cp_non_afghan_unit_tracing_only_to_afghanistan(game, p)) return false

		if (is_central_asia(s) || is_afghanistan(s)) {
			if (can_trace_supply_to_source(game, s, CP, s)) {
				let sources = []
				for (let i = 1; i < data.spaces.length; i++) {
					if (is_base_supply_source(game, i, CP) && !is_central_asia(i) && !is_afghanistan(i)) {
						sources.push(i)
					}
				}
				if (!can_trace_supply_to_source(game, s, CP, sources)) return false
			}
		}

		let requirement = REPLACEMENT_SUPPLY_REQUIREMENTS[nation]
		if (requirement) {
			let trace_cache = new Map()
			let can_trace = (key) => {
				if (!trace_cache.has(key)) trace_cache.set(key, can_trace_replacement_supply_group(game, p, key))
				return trace_cache.get(key)
			}
			if (requirement.any.some(can_trace) && !can_trace(requirement.require)) {
				return false
			}
		}

		return true
	}

	function create_replacement_payment_option(pool, options = {}) {
		return {
			pool,
			can_use: options.can_use || (() => true),
			on_spend: options.on_spend || (() => {})
		}
	}

	function create_galicia_shared_cp_replacement_payment_options(nation) {
		let options = []
		if (nation === "ah" || nation === "bu") options.push(create_replacement_payment_option(nation))
		options.push(create_replacement_payment_option("a"))
		options.push(
			create_replacement_payment_option("ge", {
				can_use: ({ game, p }) => can_trace_replacement_supply_to_galicia(game, p)
			})
		)
		return options
	}

	function can_use_br_to_ru_during_revolution(game) {
		if (!(game.events && game.events["russian_revolution"] >= 1)) return true
		if (CONSTANTINOPLE < 0) return false
		return is_russia_controlled_space(game, CONSTANTINOPLE)
	}

	function get_br_to_ru_conversion_spent(game) {
		let spent = Number(game.br_to_ru_rp_spent || 0)
		if (!Number.isFinite(spent)) spent = 0
		if (spent <= 0 && game.br_to_ru_rp_used === true) return 1
		return spent
	}

	function get_br_to_ru_conversion_budget(game, rps) {
		if (game.events && game.events["gorlice_tarnow"] === game.turn) return 0
		if (!can_use_br_to_ru_during_revolution(game)) return 0
		let br_available = Number(rps.br || 0)
		if (br_available <= 0) return 0
		if (game.events && game.events["asquith_coalition"]) return br_available
		if (game.events && game.events["kitchener"]) {
			let remaining = Math.max(0, 1 - get_br_to_ru_conversion_spent(game))
			return Math.min(br_available, remaining)
		}
		return 0
	}

	function can_convert_br_to_ru(game, cost, rps) {
		return get_br_to_ru_conversion_budget(game, rps) >= cost
	}

	function get_russian_replacement_payment_plan(game, cost, rps) {
		let remaining = Number(cost || 0)
		let br_spend = Math.min(get_br_to_ru_conversion_budget(game, rps), remaining)
		remaining -= br_spend

		let ru_spend = Math.min(Number(rps.ru || 0), remaining)
		remaining -= ru_spend

		if (remaining > 1e-9) return null
		return { br: br_spend, ru: ru_spend }
	}

	const AP_REPLACEMENT_PAYMENT_OPTIONS = {
		br: [create_replacement_payment_option("br")],
		ru: [
			create_replacement_payment_option("ru"),
			create_replacement_payment_option("br", {
				can_use: ({ game, cost, rps }) => can_convert_br_to_ru(game, cost, rps),
				on_spend: ({ game }) => {
					if (!(game.events && game.events["asquith_coalition"]) && game.events && game.events["kitchener"]) {
						game.br_to_ru_rp_used = true
					}
				}
			})
		],
		in: [create_replacement_payment_option("in")]
	}

	const CP_REPLACEMENT_PAYMENT_OPTIONS = {
		ge: [create_replacement_payment_option("ge")],
		tu: [
			create_replacement_payment_option("tu"),
			create_replacement_payment_option("ge", {
				can_use: ({ game, cost }) => can_use_ge_rp_for_tu(game, cost),
				on_spend: ({ game, cost }) => {
					if (!can_convert_ge_to_tu_unlimited(game)) game.ge_to_tu_rp_used += cost
				}
			})
		],
		tua: [
			create_replacement_payment_option("tu"),
			create_replacement_payment_option("ge", {
				can_use: ({ game, cost }) => can_use_ge_rp_for_tu(game, cost),
				on_spend: ({ game, cost }) => {
					if (!can_convert_ge_to_tu_unlimited(game)) game.ge_to_tu_rp_used += cost
				}
			})
		],
		gr: [create_replacement_payment_option("a"), create_replacement_payment_option("ge")]
	}

	function get_replacement_payment_options(game, p, nation, faction) {
		if (faction === AP) {
			if (AP_REPLACEMENT_PAYMENT_OPTIONS[nation]) return AP_REPLACEMENT_PAYMENT_OPTIONS[nation]
			if (AP_SHARED_BRITISH_REPLACEMENT_NATIONS.has(nation)) {
				return [create_replacement_payment_option("br"), create_replacement_payment_option("a")]
			}
			if (AP_FALLBACK_REPLACEMENT_NATIONS.has(nation)) return [create_replacement_payment_option("a")]
			return [create_replacement_payment_option("a")]
		}

		if (CP_REPLACEMENT_PAYMENT_OPTIONS[nation]) return CP_REPLACEMENT_PAYMENT_OPTIONS[nation]
		if (CP_GALICIA_SHARED_REPLACEMENT_NATIONS.has(nation)) {
			return create_galicia_shared_cp_replacement_payment_options(nation)
		}
		return [create_replacement_payment_option("a")]
	}

	function can_use_replacement_payment_option(option, context) {
		let amount = context.rps[option.pool] || 0
		if (amount < context.cost) return false
		return option.can_use(context)
	}

	function can_afford_replacement_as_nation(game, p, nation, cost, rps, faction) {
		if (nation === "ru") {
			return !!get_russian_replacement_payment_plan(game, cost, rps)
		}
		if (nation === "tu" || nation === "tua") {
			return !!get_turkish_replacement_payment_plan(game, cost, rps)
		}
		let options = get_replacement_payment_options(game, p, nation, faction)
		let context = { game, p, nation, cost, rps, faction }
		return options.some((option) => can_use_replacement_payment_option(option, context))
	}

	function spend_replacement_as_nation(game, p, nation, cost, rps, faction) {
		if (nation === "ru") {
			let plan = get_russian_replacement_payment_plan(game, cost, rps)
			if (!plan) return false
			if (plan.br > 0) {
				rps.br -= plan.br
				if (!(game.events && game.events["asquith_coalition"]) && game.events && game.events["kitchener"]) {
					game.br_to_ru_rp_used = true
					game.br_to_ru_rp_spent = (game.br_to_ru_rp_spent || 0) + plan.br
				}
			}
			if (plan.ru > 0) {
				rps.ru -= plan.ru
			}
			return true
		}
		if (nation === "tu" || nation === "tua") {
			let plan = get_turkish_replacement_payment_plan(game, cost, rps)
			if (!plan) return false
			if (plan.ge > 0) {
				rps.ge -= plan.ge
				if (!can_convert_ge_to_tu_unlimited(game)) game.ge_to_tu_rp_used += plan.ge
				add_blockade_tu_recovery_credit_from_ge(game, plan.ge)
			}
			if (plan.tu > 0) {
				rps.tu -= plan.tu
			}
			return true
		}
		let options = get_replacement_payment_options(game, p, nation, faction)
		let context = { game, p, nation, cost, rps, faction }
		for (let option of options) {
			if (!can_use_replacement_payment_option(option, context)) continue
			rps[option.pool] -= cost
			option.on_spend(context)
			return true
		}
		return false
	}

	function is_replacement_nation_eligible(game, p, nation, force = false) {
		let info = data.pieces[p]
		if (!info) return false
		if (
			!force &&
			game.events &&
			game.events["turkish_war_weariness"] &&
			(nation === "tu" || nation === "tua") &&
			info.symbol === "triangle"
		) {
			return false
		}
		if (nation === "sb" && has_serbia_collapsed(game)) {
			let serbs_return = !!(game.events && game.events["the_serbs_return"])
			if (!serbs_return) return false
		}
		if (game.events && game.events["arab_desertion"] && nation === "tua") {
			return false
		}
		if (is_replacement_capital_restricted(game, nation)) return false
		if (!is_not_on_map(game, p)) {
			let s = game.pieces[p]
			if (s > 0 && !can_use_replacement_supply_as_nation(game, p, s, nation)) return false
		}
		return true
	}

	function can_afford_replacement(game, p, cost) {
		let info = data.pieces[p]
		let faction = get_piece_replacement_faction(game, p)
		if (!faction) return false
		let rps = faction === AP ? game.rp_ap : game.rp_cp
		let nations = get_piece_nations_for_rule(game, p)

		// Rebel units can use their own automatic RP
		let rebel_type = get_rebel_type(info)
		if (rebel_type && game.rp_rebel && game.rp_rebel[rebel_type] >= cost) {
			return true
		}

		if (faction === CP && can_use_any_friendly_rp(p) && has_any_cp_rp(game, cost)) {
			return true
		}

		let valid_nations = nations.filter((nation) => is_replacement_nation_eligible(game, p, nation))
		if (valid_nations.length === 0) return false

		return valid_nations.some((nation) => can_afford_replacement_as_nation(game, p, nation, cost, rps, faction))
	}

	function spend_replacement_points(game, p, cost, force = false) {
		let info = data.pieces[p]
		let faction = get_piece_replacement_faction(game, p)
		if (!faction) return
		let rps = faction === AP ? game.rp_ap : game.rp_cp
		let nations = get_piece_nations_for_rule(game, p)

		let rebel_type = get_rebel_type(info)
		if (rebel_type && game.rp_rebel && game.rp_rebel[rebel_type] >= cost) {
			game.rp_rebel[rebel_type] -= cost
			return
		}

		if (faction === CP && can_use_any_friendly_rp(p) && spend_any_cp_rp(game, cost)) {
			return
		}

		let valid_nations = nations.filter((nation) => is_replacement_nation_eligible(game, p, nation, force))
		for (let nation of valid_nations) {
			if (spend_replacement_as_nation(game, p, nation, cost, rps, faction)) return
		}
	}

	function get_valid_rebuild_spaces(game, p, faction) {
		let info = data.pieces[p]
		if (is_stanke_bey_unit(p)) return []
		if (is_spers_rifles_unit(p)) return []
		if (is_tribe(p)) {
			let key = get_tribe_key_space(p)
			if (key >= 0 && can_trace_tribe_replacement_supply(game, p)) {
				return [key]
			}
			return []
		}

		let valid = []
		let full_but_valid = []
		let nation = info.nation
		let nation_capital = find_capital(nation)

		// Rule 22.2.2: Restrictions on Placement
		// 限制重建单位的放置位置
		for (let s = 1; s < data.spaces.length; s++) {
			let space = data.spaces[s]
			let name = space.name
			let can_rebuild = false

			let rebel_type = get_rebel_type(info)
			if (rebel_type) {
				// Rule 22.2.2: Jihad Revolt units placement
				if (rebel_type === "eg") {
					if (is_egypt(s) || is_sudan_and_darfur(s)) {
						let ap_pieces = get_pieces_in_space(game, s).filter((p) => data.pieces[p].faction === AP)
						if (ap_pieces.length === 0) can_rebuild = true
					}
				} else {
					if (rebel_type === "af" && is_afghanistan(s)) can_rebuild = true
					if (rebel_type === "in" && is_india(s)) can_rebuild = true
					if (rebel_type === "ca" && is_central_asia(s)) can_rebuild = true
				}
			} else if (is_br_indian_garrison_unit(info)) {
				if (is_india(s) && can_rebuild_regular_unit_in_space(game, s, faction)) can_rebuild = true
			} else if (is_br_persian_cordon_unit(info)) {
				if (
					(is_persian_region(s) || is_india(s) || is_baluchistan(s) || name === "Baluchistan") &&
					can_rebuild_regular_unit_in_space(game, s, faction)
				)
					can_rebuild = true
			} else if (is_ana_unit(info)) {
				// Rule 22.2.2: ANA rebuilds only at AP-controlled ports in Syria/Palestine.
				if (
					get_area(s) === "syria_palestine" &&
					is_port(s) &&
					is_controlled_by(game, s, AP) &&
					!is_besieged(game, s)
				) {
					can_rebuild = true
				}
			} else if (nation === "tu" || nation === "tua") {
				// Rule 22.2.2: TU/TUA units follow Ottoman reinforcement rules (7.7.2)
				if (is_controlled_by(game, s, CP) && !is_besieged(game, s)) {
					if (nation === "tu" && (s === nation_capital || name === "Kayseri" || name === "Erzincan"))
						can_rebuild = true
					if (nation === "tua" && (name === "Baghdad" || name === "Damascus")) can_rebuild = true
				}
			} else if (nation === "ge" || nation === "ah") {
				// Rule 22.2.2: GE and AH units may be rebuilt only in Galicia.
				if (is_galicia(s) && is_controlled_by(game, s, CP) && !is_besieged(game, s)) can_rebuild = true
			} else if (nation === "ru") {
				// Rule 7.7.6 / 22.2.1: the special RU Allied SCUs can rebuild at Lemnos or AP-controlled Greek ports.
				if (info.piece_class === "SCU" && is_special_ru_allied_rebuild_unit(info)) {
					if (is_special_ru_allied_rebuild_space(game, s)) can_rebuild = true
				}
				// Rule 22.2.2: RU units rebuild on named RU Supply Sources, plus Russian-controlled Trabzon.
				if (is_ru_rebuild_space(game, s)) can_rebuild = true
			} else if (nation === "br" || nation === "in" || nation === "anz") {
				if (info.piece_class === "SCU") {
					// Rule 22.2.1 / 7.7.5: BR, IN, and ANZ SCUs rebuild like reinforcements.
					if (
						is_base_supply_source(game, s, AP, "br", true) &&
						can_rebuild_regular_unit_in_space(game, s, faction)
					)
						can_rebuild = true
					if (is_british_empire_scu_rebuild_port(game, s)) can_rebuild = true
				} else if (is_controlled_by(game, s, AP) && !is_besieged(game, s)) {
					// Rule 22.2.2: BR, IN, and ANZ LCUs may be rebuilt only at AP-controlled BR Supply Sources or ports in E.Med, Aegean, or Persian Gulf.
					if (is_base_supply_source(game, s, AP, "br", true)) can_rebuild = true
					if (is_aegean_east_med_port_or_beachhead(game, s)) can_rebuild = true
					if (is_persian_gulf_port_or_beachhead(game, s)) can_rebuild = true
				}
			} else if (nation === "fr" || nation === "it") {
				// Rule 22.2.2: FR and IT units may be rebuilt at any AP-controlled port on the Aegean or E. Mediterranean.
				if (
					is_controlled_by(game, s, AP) &&
					!is_besieged(game, s) &&
					is_aegean_east_med_port_or_beachhead(game, s)
				) {
					can_rebuild = true
				}
			} else if (Engine.neutral && typeof Engine.neutral.can_rebuild_balkan_unit_in_space === "function") {
				let neutral_override = Engine.neutral.can_rebuild_balkan_unit_in_space(game, p, s, faction)
				if (neutral_override !== undefined) can_rebuild = neutral_override
			} else if (nation === "ar") {
				// Rule 22.2.2: Arab Revolt Irregular Units in Hejaz (even if CP), Aqaba, or Jiddah (if AP).
				if (is_hejaz(s) && !is_besieged(game, s)) can_rebuild = true
				if ((s === AQABA || s === JIDDAH) && is_controlled_by(game, s, AP) && !is_besieged(game, s))
					can_rebuild = true
			} else if (nation === "geo" || nation === "arm") {
				// Rule 22.2.2: GEO and ARM in any AP controlled space in Russia or Caucasia.
				if ((is_russia(s) || is_caucasus(s)) && is_controlled_by(game, s, AP) && !is_besieged(game, s))
					can_rebuild = true
			} else if (nation === "pe") {
				// Rule 22.1.3: Irregular Units rebuilt in their Supply Area.
				if (is_irregular(p) && is_persia(s) && is_controlled_by(game, s, AP) && !is_besieged(game, s))
					can_rebuild = true
			}

			if (
				!can_rebuild &&
				is_dunsterforce_unit(info) &&
				s === BAGHDAD &&
				is_controlled_by(game, s, AP) &&
				can_rebuild_regular_unit_in_space(game, s, faction)
			) {
				can_rebuild = true
			}

			if (can_rebuild) {
				if (can_place_piece_in_space(game, s, p)) {
					valid.push(s)
				} else if (can_place_piece_in_space_except_stacking(game, s, p)) {
					full_but_valid.push(s)
				}
			}
		}

		// Rule 7.7.2 / 22.2.1: if a placement location is fully stacked,
		// rebuilt units may be placed in adjacent spaces
		if (full_but_valid.length > 0) {
			let seen = new Set(valid)
			for (let s of full_but_valid) {
				let neighbors = get_connected_spaces(game, s, undefined, faction, undefined, "move")
				for (let ns of neighbors) {
					if (seen.has(ns)) continue
					if (!is_controlled_by(game, ns, faction)) continue
					if (is_besieged(game, ns)) continue
					if (!can_place_piece_in_space(game, ns, p)) continue
					seen.add(ns)
					valid.push(ns)
				}
			}
		}

		return valid
	}

	function check_rule_violations(game) {
		let violations = []
		let pieces_by_space = new Array(data.spaces.length).fill(0).map(() => [])
		for (let p = 0; p < game.pieces.length; p++) {
			let s = game.pieces[p]
			if (s >= 0 && s < data.spaces.length) pieces_by_space[s].push(p)
		}

		// 1. General Stacking Limit (Rule 8.1.1: max 3 counted pieces)
		for (let s = 1; s < data.spaces.length; s++) {
			let pieces = pieces_by_space[s]

			if (!is_reserve_space(s)) {
				for (let faction of [AP, CP]) {
					let friendly = pieces.filter((p) => get_piece_effective_faction(game, p) === faction)
					if (get_hq_heavy_artillery_support_reason(friendly)) {
						violations.push({
							space: s,
							rule: "Rule 16.1: HQ/Heavy Artillery must stack with a friendly Combat Unit"
						})
					}
				}
			}

			let has_ap_units = pieces.some((p) => get_piece_effective_faction(game, p) === AP)
			let has_cp_units = pieces.some((p) => get_piece_effective_faction(game, p) === CP)
			if (has_ap_units && has_cp_units && !can_opposing_units_coexist_in_space(game, s)) {
				violations.push({ space: s, rule: "Rule 8.5: Units of opposing sides may not stack in a space" })
			}

			if (is_unlimited_stack_space(game, s)) continue
			let count = get_stack_count(pieces)
			if (count > 3) {
				violations.push({ space: s, rule: "Rule 8.1.1: More than 3 counted combat units in space" })
			}

			let hqs = get_stack_hq_count(pieces)
			if (hqs > 1) violations.push({ space: s, rule: "Rule 8.1.3: Multiple HQs in space" })

			// Rule 8.2.2: No BR/RU mix
			if (has_br_ru_mix(game, pieces)) {
				violations.push({ space: s, rule: "Rule 8.2.2: British and Russian units cannot stack" })
			}
		}

		for (let s = 1; s < data.spaces.length; s++) {
			let fort_owner = null
			if (has_undestroyed_fort(game, s, AP)) fort_owner = AP
			else if (has_undestroyed_fort(game, s, CP)) fort_owner = CP
			if (!fort_owner) continue
			if (Array.isArray(game.broken_sieges) && set_has(game.broken_sieges, s)) continue

			let besiegers = pieces_by_space[s].filter((p) => get_piece_effective_faction(game, p) !== fort_owner)
			if (besiegers.length > 0 && !can_besiege(game, s, besiegers)) {
				violations.push({ space: s, rule: "Rule 15.2.1: Insufficient strength to besiege fort" })
			}
		}

		// 2. Rule 9.8: Restricted Area LCU limits
		const restricted_areas = ["mesopotamia", "persia", "syria_palestine", "afghanistan", "central_asia"]
		for (let area of restricted_areas) {
			let ap_lcus = count_lcu_in_area(game, area, constants.AP)
			let cp_lcus = count_lcu_in_area(game, area, constants.CP)

			let ap_limit = get_lcu_limit_for(game, constants.AP)
			let cp_limit = get_lcu_limit_for(game, constants.CP)

			if (ap_lcus > ap_limit) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (get_restricted_area(s) === area) {
						let pieces = pieces_by_space[s]
						if (pieces.some((p) => data.pieces[p].faction === constants.AP && is_lcu(p))) {
							violations.push({
								space: s,
								rule: `Rule 9.8: LCU Limit Exceeded in ${area} (AP: ${ap_lcus}/${ap_limit})`
							})
						}
					}
				}
			}
			if (cp_lcus > cp_limit) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (get_restricted_area(s) === area) {
						let pieces = pieces_by_space[s]
						if (pieces.some((p) => data.pieces[p].faction === constants.CP && is_lcu(p))) {
							violations.push({
								space: s,
								rule: `Rule 9.8: LCU Limit Exceeded in ${area} (CP: ${cp_lcus}/${cp_limit})`
							})
						}
					}
				}
			}
		}

		// 3. Rule 180: Desert LCU entry restriction
		// 4. Rule 197: Turkish/Bulgarian LCU cannot enter swamp
		for (let s = 1; s < data.spaces.length; s++) {
			let pieces = pieces_by_space[s]
			for (let p of pieces) {
				if (is_lcu(p)) {
					// Rule 180: Desert LCU must have rail supply
					if (data.spaces[s].terrain === "desert") {
						let faction = data.pieces[p].faction
						if (!is_anzac_desert_corps(p) && !is_rail_connected_to_supply(game, s, faction)) {
							violations.push({
								space: s,
								rule: "Rule 180: Desert LCU must have rail connection to supply source"
							})
						}
					}
					// Rule 197: Turkish/Bulgarian LCU cannot enter swamp
					if (data.spaces[s].terrain === "swamp") {
						if (is_turkish_or_bulgarian_lcu_for_swamp_rule(game, p)) {
							violations.push({ space: s, rule: "Rule 197: Turkish/Bulgarian LCU cannot enter swamp" })
						}
					}
				}
			}
		}

		return violations
	}

	function is_special_hq(p, name) {
		return data.pieces[p].name.includes(name) && data.pieces[p].type === "hq"
	}

	function get_all_adjacent_spaces(loc) {
		let sp = data.spaces[loc]
		if (!sp) return []
		if (sp.connection_types) return Object.keys(sp.connection_types).map(Number)
		return sp.connections || []
	}

	function is_under_special_hq_command(game, s, faction) {
		for (let p = 0; p < game.pieces.length; p++) {
			if (is_not_on_map(game, p)) continue

			let info = data.pieces[p]
			if (!info || info.faction !== faction) continue

			let loc = game.pieces[p]
			if (!data.spaces[loc]) continue

			if (faction === CP) {
				if (is_special_hq(p, "Falkenhayn") || is_special_hq(p, "Mackenson")) {
					if (loc === s) return true
					if (get_all_adjacent_spaces(loc).includes(s)) return true
				}
			} else {
				if (is_special_hq(p, "D'Esperey")) {
					let pieces_with_desperey = get_pieces_in_space(game, loc)
					let has_fr = pieces_with_desperey.some(
						(p2) => data.pieces[p2] && data.pieces[p2].nation === "fr" && p2 !== p
					)
					if (has_fr) {
						if (loc === s) return true
						if (get_all_adjacent_spaces(loc).includes(s)) return true
					}
				}
			}
		}
		return false
	}

	function get_activation_nationality_groups(game, p) {
		if (!can_piece_be_activated(p)) return []
		if (is_tribe(p) || is_irregular(p)) return []
		return get_piece_nation_groups_for_rule(game, p, "activation")
	}

	function get_minimum_activation_group_count(game, pieces) {
		let options = []
		let group_ids = new Map()
		for (let p of pieces) {
			let groups = get_activation_nationality_groups(game, p)
			if (groups.length === 0) continue
			let ids = groups.map((group) => {
				if (!group_ids.has(group)) group_ids.set(group, group_ids.size)
				return group_ids.get(group)
			})
			options.push(ids)
		}
		if (options.length === 0) return 0
		let states = new Set([0])
		for (let ids of options) {
			let next = new Set()
			for (let mask of states) {
				for (let id of ids) {
					next.add(mask | (1 << id))
				}
			}
			states = next
		}
		let best = Infinity
		for (let mask of states) {
			let count = 0
			let value = mask
			while (value) {
				value &= value - 1
				count++
			}
			if (count < best) best = count
		}
		return best === Infinity ? 0 : best
	}

	function compute_activation_mode_cost(
		game,
		s,
		active_count,
		has_hq,
		group_count,
		has_pi_penalty,
		special_hq_command
	) {
		if (active_count === 0) return 0
		let base_cost = 1
		if (is_region(game, s)) {
			base_cost = Math.ceil(active_count / 3)
		}
		// PUG rules 7.2 and 16.0 do not impose a "HQ requires a 3 or 4 OPS card" restriction
		// (that is a Paths of Glory rule). HQs simply count as their nationality for activation
		// cost (rule 7.2.2), so they flow through the normal group_count calculation below.
		// Special cross-nationality HQs (Falkenhayn/Mackensen/d'Espèrey per rules 16.3.2/16.3.4)
		// collapse group_count to 1 via special_hq_command.
		if (special_hq_command) {
			return base_cost
		}
		let cost = base_cost
		if (group_count > 1) {
			cost = base_cost + (group_count - 1)
		}
		if (has_pi_penalty) {
			cost += 1
		}
		return cost
	}

	function get_activation_cost_pair(game, s, pieces_in_space = null) {
		let pieces = Array.isArray(pieces_in_space) ? pieces_in_space : get_pieces_in_space(game, s)
		if (pieces.length === 0) return { move: 0, attack: 0 }

		let faction = game.active
		if (faction === "Allied Powers" || faction === "AP") faction = AP
		if (faction === "Central Powers" || faction === "CP") faction = CP

		// MO_BRITISH_NO_ATTACK logic
		const mo_br_no_attack =
			Engine.mo && typeof Engine.mo.is_british_no_attack_unpaid === "function"
				? Engine.mo.is_british_no_attack_unpaid(game, faction)
				: faction === AP && game.mo_ap === "british_no_attack" && !game.br_attack_penalty_paid
		let move_pieces = []
		let attack_pieces = [] // without BR (when MO active and penalty not paid)
		let attack_pieces_with_br = [] // with BR included (for the "pay VP" mode)
		let move_has_hq = false
		let attack_has_hq = false
		let attack_has_hq_with_br = false
		let has_pi_nation = false
		let has_br_in_stack = false
		let move_has_disrupted_supply = false
		let attack_has_disrupted_supply = false
		let attack_with_br_has_disrupted_supply = false
		let supply_trace_cache = null
		let supply_context = null
		let source_cache = null
		let status_cache = null

		function is_piece_in_disrupted_supply(p) {
			if (!supply_trace_cache) {
				supply_trace_cache = new Map()
				supply_context = create_supply_context(game)
				source_cache = new Map()
				status_cache = new Map()
			}
			let status = get_supply_status(
				game,
				game.pieces[p],
				faction,
				p,
				false,
				supply_trace_cache,
				supply_context,
				source_cache,
				status_cache
			)
			return is_disrupted_supply_status(status)
		}

		for (let p of pieces) {
			let piece_faction = get_piece_effective_faction(game, p)
			if (piece_faction !== AP && piece_faction !== CP) piece_faction = data.pieces[p].faction
			if (piece_faction !== faction) continue
			let nations = get_piece_nations_for_rule(game, p, "activation")
			if (nations.some((nation) => nation === "br" || nation === "in" || nation === "in-g")) {
				has_pi_nation = true
			}
			let is_br = mo_br_no_attack && nations.some((nation) => nation === "br")
			if (is_br) has_br_in_stack = true

			if (can_piece_be_activated(p) && get_supply_status(game, s, faction, p) !== "OOS") {
				let disrupted_supply = is_piece_in_disrupted_supply(p)
				move_pieces.push(p)
				if (disrupted_supply) move_has_disrupted_supply = true
				if (data.pieces[p].type === "hq") move_has_hq = true

				// attack without BR
				if (!is_br) {
					attack_pieces.push(p)
					if (disrupted_supply) attack_has_disrupted_supply = true
					if (data.pieces[p].type === "hq") attack_has_hq = true
				}

				// attack with BR (only tracked when MO active and penalty not yet paid)
				if (mo_br_no_attack) {
					attack_pieces_with_br.push(p)
					if (disrupted_supply) attack_with_br_has_disrupted_supply = true
					if (data.pieces[p].type === "hq") attack_has_hq_with_br = true
				}
			}
		}

		let move_active_count = get_activation_piece_count(move_pieces)
		let attack_active_count = get_activation_piece_count(attack_pieces)
		let move_group_count = get_minimum_activation_group_count(game, move_pieces)
		let attack_group_count = get_minimum_activation_group_count(game, attack_pieces)

		let has_pi_penalty =
			faction === AP &&
			game.events &&
			game.turn !== undefined &&
			game.events["parliamentary_inquiry"] === game.turn &&
			has_pi_nation
		let special_hq_command = is_under_special_hq_command(game, s, faction)
		let costs = {
			move: compute_activation_mode_cost(
				game,
				s,
				move_active_count,
				move_has_hq,
				move_group_count,
				has_pi_penalty,
				special_hq_command
			),
			attack: compute_activation_mode_cost(
				game,
				s,
				attack_active_count,
				attack_has_hq,
				attack_group_count,
				has_pi_penalty,
				special_hq_command
			)
		}
		if (move_has_disrupted_supply && costs.move > 0) costs.move += 1
		if (attack_has_disrupted_supply && costs.attack > 0) costs.attack += 1
		if (
			costs.attack > 0 &&
			Engine.events &&
			typeof Engine.events.has_russian_combat_activation_penalty === "function" &&
			Engine.events.has_russian_combat_activation_penalty(game, attack_pieces)
		) {
			costs.attack += 1
		}
		// attack_with_br: only provided when MO active, penalty not paid, and BR units present
		if (mo_br_no_attack && has_br_in_stack) {
			let with_br_count = get_activation_piece_count(attack_pieces_with_br)
			let with_br_group = get_minimum_activation_group_count(game, attack_pieces_with_br)
			costs.attack_with_br = compute_activation_mode_cost(
				game,
				s,
				with_br_count,
				attack_has_hq_with_br,
				with_br_group,
				has_pi_penalty,
				special_hq_command
			)
			if (attack_with_br_has_disrupted_supply && costs.attack_with_br > 0) costs.attack_with_br += 1
			if (
				costs.attack_with_br > 0 &&
				Engine.events &&
				typeof Engine.events.has_russian_combat_activation_penalty === "function" &&
				Engine.events.has_russian_combat_activation_penalty(game, attack_pieces_with_br)
			) {
				costs.attack_with_br += 1
			}
		}
		if (faction === AP) {
			let german_subs_penalized = is_german_subs_penalized_space(game, s, AP)
			let unrestricted_subs_penalized = is_unrestricted_submarine_warfare_penalized_space(game, s, AP)
			let get_submarine_surcharge = (mode_pieces) => {
				let surcharge = 0
				if (is_submarine_penalty_relevant_to_pieces(game, s, AP, mode_pieces, german_subs_penalized)) {
					surcharge += 1
				}
				if (is_submarine_penalty_relevant_to_pieces(game, s, AP, mode_pieces, unrestricted_subs_penalized)) {
					surcharge += 1
				}
				return surcharge
			}
			let move_submarine_surcharge = get_submarine_surcharge(move_pieces)
			let attack_submarine_surcharge = get_submarine_surcharge(attack_pieces)
			if (costs.move > 0 && move_submarine_surcharge > 0) costs.move += move_submarine_surcharge
			if (costs.attack > 0 && attack_submarine_surcharge > 0) costs.attack += attack_submarine_surcharge
			if (costs.attack_with_br !== undefined && costs.attack_with_br > 0) {
				let attack_with_br_submarine_surcharge = get_submarine_surcharge(attack_pieces_with_br)
				if (attack_with_br_submarine_surcharge > 0) costs.attack_with_br += attack_with_br_submarine_surcharge
			}
		}
		return costs
	}

	function get_activation_cost(game, s, activation_type) {
		let costs = get_activation_cost_pair(game, s)
		if (activation_type === "attack") return costs.attack
		if (activation_type === "attack_with_br") return costs.attack_with_br ?? costs.attack
		return costs.move
	}

	Object.assign(exports, {
		get_pieces_in_space,
		for_each_piece_in_space,
		contains_enemy_pieces,
		is_space_blocked_by_enemy_unit,
		can_place_piece_in_space,
		has_friendly_pieces,
		is_disrupted_by_enemy,
		has_enemy_uprising_marker,
		is_port,
		get_tribal_spaces,
		get_piece_connected_spaces_for_rule,
		is_non_balkan_beachhead,
		get_piece_effective_faction,
		is_anatolia,
		is_caucasus,
		is_georgia,
		is_gallipoli,
		is_mesopotamia,
		is_egypt,
		is_balkans,
		is_arabistan,
		is_greater_persia,
		is_persia,
		is_persian_region,
		is_neutral_persia_space,
		is_central_asia,
		is_azerbaijan,
		is_india,
		is_afghanistan,
		is_baluchistan,
		is_sinai,
		is_suez_canal_space,
		is_hejaz,
		is_sudan_and_darfur,
		is_syria_palestine,
		is_galicia,
		is_russia,
		get_area,
		get_legal_beachhead_controller,
		get_default_controller,
		get_space_controller,
		get_fort_owner,
		set_fort_owner,
		is_controlled_by,
		is_russia_controlled_space,
		has_allied_control_of_balfour_spaces,
		destroy_fort,
		faction_controls_strait,
		can_use_strait,
		get_connection_type,
		has_map_connection,
		get_connection_strait,
		get_crossing_type,
		is_aegean_east_med_port,
		is_aegean_east_med_port_or_beachhead,
		is_persian_gulf_port,
		is_persian_gulf_port_or_beachhead,
		is_ap_controlled_port_or_beachhead,
		is_red_sea_port,
		is_black_sea_port,
		is_caspian_sea_port,
		has_undestroyed_fort,
		get_region,
		get_distance,
		is_russian_vp_space,
		get_restricted_area,
		count_lcu_in_area,
		is_lcu,
		is_scu,
		is_tribe,
		is_island_base,
		is_potential_beachhead_space,
		get_adjacent_island_base_for_beachhead,
		can_ap_place_beachhead_marker,
		can_ap_initiate_invasion_to_beachhead,
		mark_beachhead_placed_this_action_round,
		clear_beachhead,
		is_beachhead_placed_this_action_round,
		is_beachhead_space,
		get_tribe_type,
		is_region,
		get_connected_spaces,
		get_rail_connections,
		other_faction,
		get_movement_cost,
		get_enemy_fort_entry_extra_cost,
		set_debug_log,
		get_lcu_limit_for,
		can_enter_area,
		is_unlimited_stack_space,
		get_stack_counted_pieces,
		get_stack_count,
		get_stack_hq_count,
		is_stack_counted_piece,
		get_stack_composition_reason,
		get_region_activation_stack_block_reason,
		can_move_stack_composition,
		can_temporarily_end_move_in_space,
		can_stack_end_in_space,
		get_stack_end_block_reason,
		get_move_end_space_block_reason,
		get_piece_mf,
		is_unrestricted_submarine_warfare_penalized_space,
		prune_exhausted_move_stack,
		has_unmoved_pieces_in_space,
		get_siege_departure_block_reason,
		get_piece_move_block_reason,
		can_stack_move_to,
		can_piece_move_to,
		can_besiege,
		get_besieging_pieces,
		get_sr_cost,
		has_sr_path,
		can_sr_piece,
		can_sr_to_space,
		can_use_reserve_sr_for_piece,
		is_reserve_sr_capital_restricted,
		can_suez_delayed_sr_to_space,
		get_suez_delayed_sr_arrival_ports,
		get_suez_sr_arrival_zone,
		apply_sr_control_effects,
		get_sr_destinations,
		get_activation_cost,
		get_activation_cost_pair,
		is_reserve_space,
		check_supply,
		is_connected_by_rail,
		is_rail_connected_to_galicia,
		is_in_supply,
		is_in_limited_supply,
		is_limited_supply_status,
		is_disrupted_supply_status,
		is_supply_status_in_supply,
		is_rail_connected_to_supply,
		is_besieged,
		create_supply_context,
		is_base_supply_source,
		is_cp_non_afghan_unit_tracing_only_to_afghanistan,
		get_supply_trace_status_to_source,
		can_trace_supply_to_source,
		can_trace_piece_supply_to_space,
		can_trace_piece_supply_to_sources,
		is_ap_piece_supplied_solely_through_source,
		get_ap_units_supplied_solely_through_source,
		can_trace_supply_to_ap_port,
		get_ru_supply_sources,
		get_gr_supply_sources,
		get_supply_sources_from_data,
		get_supply_eligible_space_ids,
		is_supply_eligible_space,
		get_supplied_spaces,
		get_ap_supply_split_projection,
		get_beachhead_spaces,
		get_supply_status,
		get_piece_replacement_faction,
		get_replacement_cost,
		can_afford_replacement,
		spend_replacement_points,
		get_valid_rebuild_spaces,
		can_rebuild_in_reserve_box,
		can_trace_replacement_supply_to_galicia,
		can_trace_replacement_supply_to_turkey,
		can_trace_replacement_supply_to_sofia,
		can_trace_replacement_supply_to_british_source,
		can_trace_replacement_supply_to_russian_source,
		is_replacement_capital_restricted,
		is_replacement_nation_eligible,
		is_space_in_tribal_range,
		is_space_in_irregular_supply_area,
		check_rule_violations
	})

	return exports
}
