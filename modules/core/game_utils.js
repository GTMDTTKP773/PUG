"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const exports = {}

	const { ELIMINATED, RESERVE, REMOVED, REINFORCEMENTS, AP, CP } = Engine.constants
	const { set_add, set_delete, set_has } = Engine.utils
	const STACKING_LIMIT = 3

	// --- Static lookup indexes built once from data at module init ---

	const _space_name_map = new Map()
	const _space_name_lower_map = new Map()
	for (let _si = 1; _si < data.spaces.length; _si++) {
		const _sp = data.spaces[_si]
		if (_sp && _sp.name) {
			if (!_space_name_map.has(_sp.name)) _space_name_map.set(_sp.name, _si)
			const _lo = _sp.name.toLowerCase()
			if (!_space_name_lower_map.has(_lo)) _space_name_lower_map.set(_lo, _si)
		}
	}

	const _capital_by_nation = new Map()
	for (let _si = 1; _si < data.spaces.length; _si++) {
		const _sp = data.spaces[_si]
		if (_sp && _sp.capital === 1 && _sp.nation && !_capital_by_nation.has(_sp.nation)) {
			_capital_by_nation.set(_sp.nation, _si)
		}
	}

	const _piece_by_name = new Map()
	for (let _pi = 0; _pi < data.pieces.length; _pi++) {
		const _pc = data.pieces[_pi]
		if (!_pc || !_pc.name) continue
		if (!_piece_by_name.has(_pc.name)) _piece_by_name.set(_pc.name, [])
		_piece_by_name.get(_pc.name).push(_pi)
	}

	const _tribe_key_space_cache = new Map()

	// === Basic Lookup ===

	// Printed/static faction from the unit definition. Use this for
	// faction-specific pools and other data-level identity checks.
	function get_piece_faction(p) {
		if (p < 0 || !data.pieces[p]) return null
		return data.pieces[p].faction
	}

	function get_reserve_box_for_piece(p) {
		let faction = get_piece_faction(p)
		if (is_lcu(p)) return get_lcu_reserve_box(faction)
		return get_scu_reserve_box(faction)
	}

	function count_tribes_on_map(game) {
		let count = 0
		for (let p = 0; p < game.pieces.length; p++) {
			if (is_tribe(p) && !is_not_on_map(game, p)) count++
		}
		return count
	}

	function find_space(name) {
		if (typeof name !== "string") return -1
		const exact = _space_name_map.get(name)
		if (exact !== undefined) return exact
		const lower = _space_name_lower_map.get(name.toLowerCase())
		return lower !== undefined ? lower : -1
	}

	const BOX_IDS = {
		ap_scu_reserve: find_space("AP Reserve"),
		cp_scu_reserve: find_space("CP Reserve"),
		ap_lcu_reserve: find_space("AP Corps Assets"),
		cp_lcu_reserve: find_space("CP Corps Assets"),
		ap_eliminated: find_space("AP Eliminated"),
		cp_eliminated: find_space("CP Eliminated"),
		ap_removed: find_space("AP Removed Box"),
		cp_removed: find_space("CP Removed Box"),
		ap_permanently_eliminated: find_space("AP Permanently Eliminated Box"),
		cp_permanently_eliminated: find_space("CP Permanently Eliminated Box")
	}

	function cached_box(id, fallback) {
		return id >= 0 ? id : fallback
	}

	function find_capital(nation) {
		const s = _capital_by_nation.get(nation)
		return s !== undefined ? s : -1
	}

	function find_piece(faction, name) {
		const candidates = _piece_by_name.get(name)
		if (!candidates) return -1
		for (const p of candidates) {
			if (faction === undefined || faction === "system" || data.pieces[p].faction === faction) return p
		}
		return -1
	}

	function piece_name(p) {
		if (!data.pieces[p]) return "Unknown Unit (" + p + ")"
		return data.pieces[p].name.replace(/ /g, "\u00A0")
	}

	function piece_log_name(game, p, reduced = null) {
		if (!data.pieces[p]) return piece_name(p)
		if (reduced === null) reduced = is_piece_reduced(game, p)
		return reduced ? `p${p}` : `P${p}`
	}

	function piece_list(pieces) {
		if (pieces.length === 0) return "no units"
		let list = pieces.map(piece_name)
		if (list.length <= 2) return list.join(" and ")
		let last = list.pop()
		return list.join(", ") + ", and " + last
	}

	function space_name(s) {
		if (!data.spaces[s]) return "Unknown Space (" + s + ")"
		return data.spaces[s].name
	}

	function get_space_nation(s) {
		if (!data.spaces[s]) return null
		return data.spaces[s].nation
	}

	function get_space_faction(s) {
		if (!data.spaces[s]) return null
		return data.spaces[s].faction
	}

	// === Boxes & Locations ===

	function get_scu_reserve_box(faction) {
		return cached_box(faction === AP ? BOX_IDS.ap_scu_reserve : BOX_IDS.cp_scu_reserve, RESERVE)
	}

	function get_lcu_reserve_box(faction) {
		let s = faction === AP ? BOX_IDS.ap_lcu_reserve : BOX_IDS.cp_lcu_reserve
		return cached_box(s, get_scu_reserve_box(faction))
	}

	function get_reserve_box(faction) {
		return get_scu_reserve_box(faction)
	}

	function get_eliminated_box(faction) {
		return cached_box(faction === AP ? BOX_IDS.ap_eliminated : BOX_IDS.cp_eliminated, ELIMINATED)
	}

	function get_removed_box(faction) {
		return cached_box(faction === AP ? BOX_IDS.ap_removed : BOX_IDS.cp_removed, REMOVED)
	}

	function get_permanently_eliminated_box(faction) {
		let s = faction === AP ? BOX_IDS.ap_permanently_eliminated : BOX_IDS.cp_permanently_eliminated
		return cached_box(s, get_removed_box(faction))
	}

	function get_piece_status_box_faction(game, p) {
		let info = data.pieces[p]
		if (!info) return null
		let faction = get_piece_effective_faction(game, p)
		return faction === AP || faction === CP ? faction : info.faction
	}

	function get_tribe_key_space(p) {
		const tribe_type = Engine.map.get_tribe_type(p)
		if (_tribe_key_space_cache.has(tribe_type)) return _tribe_key_space_cache.get(tribe_type)
		let result = -1
		for (let s = 1; s < data.spaces.length; s++) {
			if (
				data.spaces[s] &&
				(data.spaces[s].type === "Reserve Box" || data.spaces[s].map === "Reserve Box") &&
				data.spaces[s].name === tribe_type
			) {
				result = s
				break
			}
		}
		_tribe_key_space_cache.set(tribe_type, result)
		return result
	}

	function get_capacity(game, s) {
		if (Engine.map.is_unlimited_stack_space(game, s)) return 999
		let pieces = Engine.map.get_pieces_in_space(game, s)
		if (pieces.some((p) => data.pieces[p] && data.pieces[p].name === "GE GeoProtect")) return 0
		let count = Engine.map.get_stack_count(pieces)
		return Math.max(0, STACKING_LIMIT - count)
	}

	// === Piece Status ===

	function is_in_reserve(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		let s = game.pieces[p]
		let info = data.pieces[p]
		if (is_tribe(p)) {
			let key = get_tribe_key_space(p)
			return key >= 0 && s === key
		}
		let faction = get_piece_status_box_faction(game, p)
		if (info.piece_class === "LCU") return s === get_lcu_reserve_box(faction) || s === RESERVE
		return s === get_scu_reserve_box(faction) || s === RESERVE
	}

	function is_eliminated(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		let s = game.pieces[p]
		return s === get_eliminated_box(get_piece_status_box_faction(game, p)) || s === ELIMINATED
	}

	function is_removed(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		return is_removed_only(game, p) || is_permanently_eliminated(game, p)
	}

	function is_removed_only(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		let s = game.pieces[p]
		return s === get_removed_box(get_piece_status_box_faction(game, p)) || s === REMOVED
	}

	function is_permanently_eliminated(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		let s = game.pieces[p]
		let faction = get_piece_status_box_faction(game, p)
		let pe_box = get_permanently_eliminated_box(faction)
		// If PE box is same as removed box, we don't want recursion
		if (pe_box === get_removed_box(faction)) return false
		return s === pe_box
	}

	function is_reinforcement(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		let s = game.pieces[p]
		return s === REINFORCEMENTS
	}

	function is_piece_reduced(game, p) {
		return set_has(game.reduced, p)
	}

	function is_stanke_bey_unit(p) {
		let info = data.pieces[p]
		return !!(info && info.name === "TU Stanke Bey")
	}

	function is_spers_rifles_unit(p) {
		let info = data.pieces[p]
		return !!(info && info.name && info.name.includes("SPers Rifles"))
	}

	function reduce_piece(game, p, log) {
		if (is_piece_reduced(game, p)) {
			eliminate_piece(game, p, log)
		} else {
			set_add(game.reduced, p)
		}
	}

	function get_nation_group(nation) {
		if (["br", "anz", "in"].includes(nation)) return "british_empire"
		if (["tu", "tua"].includes(nation)) return "turkish"
		return nation
	}

	function get_activation_nation_group(nation) {
		if (["br", "in", "anz", "ana", "ar"].includes(nation)) return "br"
		if (["tu", "tua"].includes(nation)) return "tu"
		return nation
	}

	function get_piece_nations_for_rule(game, p, purpose = "default") {
		if (p < 0 || !data.pieces[p]) return []
		let info = data.pieces[p]
		let name = info.name || ""
		if (name === "BR ANA Arab") return purpose === "connection" ? ["br", "arab_and_tu"] : ["br", "ar"]
		if (name === "RU/PE Police North") return ["ru"]
		if (name === "Combined BU/AH Div") return ["bu", "ah"]
		if (name === "German 11th Army") return ["ge", "bu"]
		if (name === "GR National Defense") return ["br", "gr"]
		if (name === "RU/SB Yugo Infantry") {
			if (
				purpose !== "mo" &&
				Engine.events &&
				typeof Engine.events.get_russian_revolution_level === "function" &&
				Engine.events.get_russian_revolution_level(game) >= 4
			)
				return ["br"]
			return ["ru", "sb"]
		}
		if (
			purpose !== "mo" &&
			Engine.events &&
			typeof Engine.events.get_russian_revolution_level === "function" &&
			typeof Engine.events.is_russian_revolution_survivor_cavalry === "function" &&
			Engine.events.get_russian_revolution_level(game) >= 4 &&
			Engine.events.is_russian_revolution_survivor_cavalry(game, p)
		)
			return ["br"]
		if (purpose === "activation" && info.symbol === "Y" && info.nation === "ge") return []
		return [info.nation]
	}

	function get_piece_nation_groups_for_rule(game, p, purpose = "default") {
		let groups = []
		for (let nation of get_piece_nations_for_rule(game, p, purpose)) {
			let group = purpose === "activation" ? get_activation_nation_group(nation) : get_nation_group(nation)
			if (group) set_add(groups, group)
		}
		return groups
	}

	function piece_counts_as_nation_for_rule(game, p, nation, purpose = "default") {
		return get_piece_nations_for_rule(game, p, purpose).includes(nation)
	}

	function pieces_count_as_any_nation_for_rule(game, pieces, nations, purpose = "default") {
		if (!Array.isArray(pieces)) return false
		let nation_list = Array.isArray(nations) ? nations : [nations]
		return pieces.some((p) =>
			nation_list.some((nation) => piece_counts_as_nation_for_rule(game, p, nation, purpose))
		)
	}

	function can_piece_be_activated(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].name !== "GE GeoProtect"
	}

	function is_not_on_map(game, p) {
		return is_eliminated(game, p) || is_in_reserve(game, p) || is_removed(game, p) || is_reinforcement(game, p)
	}
	function get_piece_cf(game, p) {
		if (p < 0) return 0
		if (is_hq(p)) return 0
		if (set_has(game.reduced, p)) return data.pieces[p].rcf || 0
		return data.pieces[p].cf || 0
	}

	function get_hq_drm(game, p) {
		if (!is_hq(p)) return 0
		if (set_has(game.reduced, p)) return data.pieces[p].rlf || 0
		return data.pieces[p].lf || 0
	}

	// Board-state/dynamic faction used for enemy/friendly checks on the map.
	// This may differ from the printed faction because of neutral frameworks or
	// special-case rule overrides, and can return "neutral".
	function get_piece_effective_faction(game, p) {
		let info = data.pieces[p]
		if (!info) return null
		if (info.name === "GE GeoProtect") return AP
		if (
			Engine.events &&
			typeof Engine.events.get_russian_revolution_level === "function" &&
			typeof Engine.events.is_transcaucasian_federation_piece === "function" &&
			Engine.events.get_russian_revolution_level(game) >= 4 &&
			Engine.events.is_transcaucasian_federation_piece(p)
		)
			return AP
		if (Engine.neutral && typeof Engine.neutral.get_piece_effective_faction_override === "function") {
			let override = Engine.neutral.get_piece_effective_faction_override(game, p)
			if (override !== undefined) return override
		}
		return info.faction
	}

	function is_lcu(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].piece_class === "LCU"
	}

	function is_scu(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].piece_class === "SCU"
	}

	function is_tribe(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].type === "tribe" || data.pieces[p].type === "tribal"
	}

	function is_irregular(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].type === "irregular"
	}

	function is_regular(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].type === "regular"
	}

	function is_combat_unit(p) {
		return is_regular(p) || is_irregular(p) || is_tribe(p)
	}

	function get_piece_nation(p) {
		if (p < 0 || !data.pieces[p]) return null
		return data.pieces[p].nation
	}

	function get_piece_type(p) {
		if (p < 0 || !data.pieces[p]) return null
		return data.pieces[p].type
	}

	function has_scu_in_reserve(game, nation) {
		for (let p = 0; p < game.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info) continue
			if (info.nation !== nation) continue
			if (!is_scu(p)) continue
			let faction = get_piece_status_box_faction(game, p)
			if (get_piece_effective_faction(game, p) !== faction) continue
			let reserve = get_reserve_box(faction)
			if (game.pieces[p] === reserve || game.pieces[p] === RESERVE) return true
		}
		return false
	}

	function get_pieces_in_reserve(game, faction) {
		let pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (
				get_piece_status_box_faction(game, p) === faction &&
				get_piece_effective_faction(game, p) === faction &&
				is_in_reserve(game, p)
			) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function get_pieces_in_eliminated(game, faction) {
		let pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (data.pieces[p] && get_piece_status_box_faction(game, p) === faction && is_eliminated(game, p)) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function get_pieces_in_removed(game, faction) {
		let pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (data.pieces[p] && get_piece_status_box_faction(game, p) === faction && is_removed(game, p)) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function get_pieces_in_removed_only(game, faction) {
		let pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (data.pieces[p] && get_piece_status_box_faction(game, p) === faction && is_removed_only(game, p)) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function get_pieces_in_reinforcements(game, faction) {
		let pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (data.pieces[p].faction === faction && is_reinforcement(game, p)) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function get_replacement_nations_for_piece(game, p) {
		let nations = get_piece_nations_for_rule(game, p).filter(Boolean)
		let unique = []
		for (let nation of nations) {
			if (!unique.includes(nation)) unique.push(nation)
		}
		return unique
	}

	function is_british_empire_nation(nation) {
		return nation === "br" || nation === "in" || nation === "anz"
	}

	function is_turkish_replacement_nation(nation) {
		return nation === "tu" || nation === "tua"
	}

	function has_nation_overlap(a, b) {
		return a.some((nation) => b.includes(nation))
	}

	function is_exception_replacement_nation(lcu_nations, scu_nations) {
		if (lcu_nations.some(is_turkish_replacement_nation) && scu_nations.some(is_turkish_replacement_nation))
			return true
		return lcu_nations.some(is_british_empire_nation) && scu_nations.some(is_british_empire_nation)
	}

	function is_primary_replacement_nation(lcu_nations, scu_nations) {
		if (has_nation_overlap(lcu_nations, scu_nations)) return true
		return lcu_nations.some(is_turkish_replacement_nation) && scu_nations.some(is_turkish_replacement_nation)
	}

	function can_scu_replace_lcu_by_rule_1265(game, lcu, scu) {
		let lcu_info = data.pieces[lcu]
		let scu_info = data.pieces[scu]
		if (!lcu_info || !scu_info) return false
		if (lcu_info.piece_class !== "LCU" || scu_info.piece_class !== "SCU") return false
		if (scu_info.faction !== lcu_info.faction) return false
		if (!is_in_reserve(game, scu)) return false

		let lcu_nations = get_replacement_nations_for_piece(game, lcu)
		let scu_nations = get_replacement_nations_for_piece(game, scu)
		let same_nation = has_nation_overlap(lcu_nations, scu_nations)
		let exception_nation = is_exception_replacement_nation(lcu_nations, scu_nations)
		if (!same_nation && !exception_nation) return false

		// 12.6.5: Special and irregular SCUs may not replace LCUs, except that
		// dual-nationality SCUs may replace either nationality.
		if (scu_info.type !== "regular" && !(same_nation && scu_nations.length > 1)) return false

		if (
			Engine.events &&
			Engine.events.is_turkish_replacement_blocked &&
			Engine.events.is_turkish_replacement_blocked(game, scu)
		)
			return false

		return true
	}

	function get_replacement_options(game, p) {
		let info = data.pieces[p]
		if (info.piece_class !== "LCU") return []

		let lcu_nations = get_replacement_nations_for_piece(game, p)
		let target_badge = get_piece_badge(p)
		let is_yellow_lcu = target_badge === "yellow"
		let buckets = {
			same_type_full: [],
			same_type_reduced: [],
			same_full: [],
			same_reduced: [],
			exception_type_full: [],
			exception_type_reduced: [],
			exception_full: [],
			exception_reduced: []
		}

		for (let i = 1; i < data.pieces.length; i++) {
			if (!can_scu_replace_lcu_by_rule_1265(game, p, i)) continue
			let replacement_badge = get_piece_badge(i)
			if (is_yellow_lcu && replacement_badge !== "blue" && replacement_badge !== "infantry") continue

			let replacement_nations = get_replacement_nations_for_piece(game, i)
			let primary_nation = is_primary_replacement_nation(lcu_nations, replacement_nations)
			let same_type = target_badge && replacement_badge === target_badge
			let reduced = is_piece_reduced(game, i)

			if (primary_nation && same_type && !reduced) buckets.same_type_full.push(i)
			else if (primary_nation && same_type) buckets.same_type_reduced.push(i)
			else if (primary_nation && !reduced) buckets.same_full.push(i)
			else if (primary_nation) buckets.same_reduced.push(i)
			else if (same_type && !reduced) buckets.exception_type_full.push(i)
			else if (same_type) buckets.exception_type_reduced.push(i)
			else if (!reduced) buckets.exception_full.push(i)
			else buckets.exception_reduced.push(i)
		}

		const priority = [
			"same_type_full",
			"same_type_reduced",
			"same_full",
			"same_reduced",
			"exception_type_full",
			"exception_type_reduced",
			"exception_full",
			"exception_reduced"
		]

		let options = []
		for (let key of priority) {
			if (buckets[key].length > 0) {
				options = buckets[key]
				break
			}
		}

		if (options.length > 1) {
			let names = []
			options = options.filter((unit) => {
				if (set_has(names, data.pieces[unit].name)) return false
				set_add(names, data.pieces[unit].name)
				return true
			})
		}

		return options
	}

	function capture_lcu_runtime_state(game, lcu) {
		let attack_origin = null
		if (game.attack && game.attack.origin_by_piece && game.attack.origin_by_piece[lcu] > 0) {
			attack_origin = game.attack.origin_by_piece[lcu]
		} else if (game.pieces && game.pieces[lcu] > 0) {
			attack_origin = game.pieces[lcu]
		}

		return {
			attack_pieces: !!(game.attack && Array.isArray(game.attack.pieces) && set_has(game.attack.pieces, lcu)),
			move_pieces: !!(game.move && Array.isArray(game.move.pieces) && set_has(game.move.pieces, lcu)),
			attacked: !!(Array.isArray(game.attacked) && set_has(game.attacked, lcu)),
			moved: !!(Array.isArray(game.moved) && set_has(game.moved, lcu)),
			retreated: !!(Array.isArray(game.retreated) && set_has(game.retreated, lcu)),
			sr_moved: !!(Array.isArray(game.sr_moved) && set_has(game.sr_moved, lcu)),
			oos: !!(Array.isArray(game.oos) && set_has(game.oos, lcu)),
			entrenching: !!(Array.isArray(game.entrenching) && set_has(game.entrenching, lcu)),
			battle_result_attackers: !!(
				game.battle_result &&
				Array.isArray(game.battle_result.attackers) &&
				set_has(game.battle_result.attackers, lcu)
			),
			battle_result_defenders: !!(
				game.battle_result &&
				Array.isArray(game.battle_result.defenders) &&
				set_has(game.battle_result.defenders, lcu)
			),
			battle_result_retreating_units: !!(
				game.battle_result &&
				Array.isArray(game.battle_result.retreating_units) &&
				set_has(game.battle_result.retreating_units, lcu)
			),
			battle_result_turkish_retreat_units: !!(
				game.battle_result &&
				Array.isArray(game.battle_result.turkish_retreat_units) &&
				set_has(game.battle_result.turkish_retreat_units, lcu)
			),
			battle_result_turkish_retreat_optional_units: !!(
				game.battle_result &&
				Array.isArray(game.battle_result.turkish_retreat_optional_units) &&
				set_has(game.battle_result.turkish_retreat_optional_units, lcu)
			),
			attack_origin
		}
	}

	function transfer_lcu_runtime_state(game, lcu, scu, runtime_state) {
		let snapshot = runtime_state || capture_lcu_runtime_state(game, lcu)

		function transfer_array(container, key, was_present) {
			if (!container) return
			if (!Array.isArray(container[key])) {
				if (!was_present) return
				container[key] = []
			}
			set_delete(container[key], lcu)
			if (was_present) set_add(container[key], scu)
		}

		transfer_array(game.attack, "pieces", snapshot.attack_pieces)
		transfer_array(game.move, "pieces", snapshot.move_pieces)
		transfer_array(game, "attacked", snapshot.attacked)
		transfer_array(game, "moved", snapshot.moved)
		transfer_array(game, "retreated", snapshot.retreated)
		transfer_array(game, "sr_moved", snapshot.sr_moved)
		transfer_array(game, "oos", snapshot.oos)
		transfer_array(game, "entrenching", snapshot.entrenching)
		transfer_array(game.battle_result, "attackers", snapshot.battle_result_attackers)
		transfer_array(game.battle_result, "defenders", snapshot.battle_result_defenders)
		transfer_array(game.battle_result, "retreating_units", snapshot.battle_result_retreating_units)
		transfer_array(game.battle_result, "turkish_retreat_units", snapshot.battle_result_turkish_retreat_units)
		transfer_array(
			game.battle_result,
			"turkish_retreat_optional_units",
			snapshot.battle_result_turkish_retreat_optional_units
		)

		if (game.attack && snapshot.attack_origin > 0) {
			if (!game.attack.origin_by_piece || typeof game.attack.origin_by_piece !== "object") {
				game.attack.origin_by_piece = {}
			}
			game.attack.origin_by_piece[scu] = snapshot.attack_origin
			delete game.attack.origin_by_piece[lcu]
		}
		delete game.attack_eligibility_cache
	}

	function replace_lcu_with_scu(game, lcu, space, scu, log, runtime_state = null) {
		let snapshot = runtime_state || capture_lcu_runtime_state(game, lcu)
		game.pieces[scu] = space
		transfer_lcu_runtime_state(game, lcu, scu, snapshot)
		if (log) log(` ${piece_log_name(game, lcu)} 被替换为 ${piece_log_name(game, scu)}。`)
		return scu
	}

	function restore_lcu_from_scu(game, lcu, space, scu, runtime_state = null) {
		let snapshot = runtime_state || capture_lcu_runtime_state(game, scu)
		let scu_faction = get_piece_status_box_faction(game, scu)
		game.pieces[lcu] = space
		transfer_lcu_runtime_state(game, scu, lcu, snapshot)
		game.pieces[scu] = get_scu_reserve_box(scu_faction)
		return lcu
	}

	function reset_piece_runtime_state(game, p) {
		set_delete(game.moved, p)
		set_delete(game.attacked, p)
		if (game.sr_moved) set_delete(game.sr_moved, p)
		if (game.oos) set_delete(game.oos, p)
		if (game.entrenching) set_delete(game.entrenching, p)
		if (game.attack && Array.isArray(game.attack.pieces)) set_delete(game.attack.pieces, p)
		if (game.move && Array.isArray(game.move.pieces)) set_delete(game.move.pieces, p)
		set_delete(game.reduced, p)
	}

	function remove_piece_from_game(game, p, log) {
		let info = data.pieces[p]
		if (!info) return
		let space = game.pieces[p]
		game.pieces[p] = get_removed_box(get_piece_status_box_faction(game, p))
		reset_piece_runtime_state(game, p)
		if (log) log(`单位 ${piece_log_name(game, p)} 被移出游戏 (Removed)。`)
		if (space > 0 && Engine.sync_neutral_vp_state) Engine.sync_neutral_vp_state(game, space)
		if (space > 0 && Engine.sync_jihad_city_state) Engine.sync_jihad_city_state(game, space)
		if (space > 0 && Engine.sync_region_control) Engine.sync_region_control(game, space)
	}

	function eliminate_piece(game, p, log, permanent = false) {
		let info = data.pieces[p]
		let space = game.pieces[p]
		let box_faction = get_piece_status_box_faction(game, p)
		let is_lcu_pe = false
		let replacement_scu = -1

		if (info.piece_class === "LCU" && !permanent) {
			// Rule 12.6.5 replaces an eliminated LCU with a matching Reserve Box SCU.
			// Rule 12.6.7 makes combat elimination permanent when the LCU is OOS.
			if (Engine.map.is_in_supply(game, space, info.faction, p)) {
				let options = get_replacement_options(game, p)
				if (options.length > 0) {
					if (game.attack && options.length > 1) {
						game.attack.replacement = {
							unit: p,
							space,
							options,
							return_state: game.state,
							runtime_state: capture_lcu_runtime_state(game, p)
						}
						game.state = "choose_lcu_replacement"
					} else {
						replacement_scu = replace_lcu_with_scu(game, p, space, options[0], log)
						if (game.attack && replacement_scu >= 0) {
							if (!game.attack.lcu_replacement_map) game.attack.lcu_replacement_map = {}
							game.attack.lcu_replacement_map[p] = replacement_scu
						}
					}
				} else {
					// Rule 307: If no replacement SCU, LCU is permanently eliminated
					is_lcu_pe = true
			if (log) log(`LCU ${piece_log_name(game, p)} 被摧毁，由于没有可用的 SCU 替换：永久消灭（PE）。`)
				}
			} else {
				// Rule 12.6.5: If unsupplied LCU is eliminated, it is permanently removed
				is_lcu_pe = true
			if (log) log(`未补给的 LCU ${piece_log_name(game, p)} 被摧毁：永久消灭（PE）。`)
			}
		}

		let is_permanently_eliminated =
			permanent || is_lcu_pe || info.symbol === "dot" || is_stanke_bey_unit(p) || is_spers_rifles_unit(p)

		if (is_permanently_eliminated) {
			game.pieces[p] = get_permanently_eliminated_box(box_faction)
			if (log) {
				let label = info.piece_class === "LCU" ? "LCU" : "单位"
			log(`${label} ${piece_log_name(game, p)} 被永久消灭 (PE)。`)
			}
		} else if (is_tribe(p)) {
			game.pieces[p] = get_eliminated_box(box_faction)
		} else {
			game.pieces[p] = get_eliminated_box(box_faction)
		}

		reset_piece_runtime_state(game, p)
		if (space > 0 && Engine.sync_neutral_vp_state) Engine.sync_neutral_vp_state(game, space)
		if (space > 0 && Engine.sync_jihad_city_state) Engine.sync_jihad_city_state(game, space)
		if (space > 0 && Engine.sync_region_control) Engine.sync_region_control(game, space)

		return replacement_scu
	}

	function add_rps(game, info, log) {
		let rps = game.active === Engine.constants.AP ? game.rp_ap : game.rp_cp
		if (info.rp_a) rps.a += info.rp_a
		if (info.rp_ah) rps.a += info.rp_ah
		let block_br_rp = Engine.events.is_br_rp_blocked(game)
		if (info.rp_br && !block_br_rp) rps.br += info.rp_br
		if (info.rp_ru) {
			// Rule 978: No longer record RU RP after Russian Revolution Phase 1
			// Gorlice-Tarnow event blocks RU RP for the turn
			const block_ru_rp = Engine.events.is_ru_rp_blocked(game)
			if (Engine.events.get_russian_revolution_level(game) < 1 && !block_ru_rp) {
				rps.ru += info.rp_ru
			} else if (block_ru_rp && log) {
				log("戈尔利采-塔尔诺夫攻势：本回合无法记录俄国补员点数。")
			}
		}
		const block_ge_rp = Engine.events.is_ge_rp_blocked(game)
		if (info.rp_ge && !block_ge_rp) {
			rps.ge += info.rp_ge
		} else if (info.rp_ge && block_ge_rp && log) {
			log("皇帝攻势：本回合无法记录德国补员点数。")
		}
		if (info.rp_in) rps.in += info.rp_in
		if (info.rp_tu) {
			if (Engine.events.is_royal_navy_blockade_active(game)) {
				let max_tu_rp = Math.max(0, Number(game.tu_rp_limit ?? 25))
				let recordable_tu_rp = Math.min(info.rp_tu, max_tu_rp)
				if (recordable_tu_rp > 0) {
					rps.tu += recordable_tu_rp
					game.tu_rp_recovery_pool = Math.max(0, Number(game.tu_rp_recovery_pool || 0)) + recordable_tu_rp
				}
				game.tu_rp_limit = max_tu_rp - recordable_tu_rp
				if (recordable_tu_rp < info.rp_tu && log) {
					log(
						`由于英国皇家海军封锁，土耳其仅记录 ${recordable_tu_rp}/${info.rp_tu} RP（剩余最大补给限度 ${game.tu_rp_limit}）。`
					)
				}
			} else {
				rps.tu += info.rp_tu
			}
		}
	}

	function can_entrench_in_space(game, s, faction) {
		const { map } = Engine
		// Rule 15.4.1 & 15.4.3
		if (!map.is_controlled_by(game, s, faction) && !map.is_besieged(game, s)) return false
		if (map.is_island_base(game, s)) return false
		if (map.is_region(game, s)) return false

		let terrain = data.spaces[s].terrain || ""
		if (has_trench(game, s) > 0) return false
		return get_entrenching_units_in_space(game, s, faction, terrain).length !== 0
	}

	function get_entrenching_units_in_space(game, s, faction, terrain_override = null) {
		const { map } = Engine
		let terrain = terrain_override || data.spaces[s].terrain || ""
		let pieces = map.get_pieces_in_space(game, s)
		let regulars = pieces.filter((p) => {
			let info = data.pieces[p]
			return info.faction === faction && !is_tribe(p) && !is_irregular(p) && !set_has(game.moved, p)
		})
		if (!terrain || terrain === "forest") return regulars
		if (terrain === "mountain" || terrain === "swamp") {
			const ADVANCED_NATIONS = ["br", "fr", "in", "anz", "ge", "ah"]
			return regulars.filter((p) => {
				let info = data.pieces[p]
				return (info.symbol === "Y" && info.nation === "ge") || ADVANCED_NATIONS.includes(info.nation)
			})
		}
		return []
	}

	function normalize_trench_owner(owner) {
		return owner === AP || owner === CP ? owner : null
	}

	function other_trench_owner(owner) {
		if (owner === AP) return CP
		if (owner === CP) return AP
		return null
	}

	function infer_trench_owner(game, s) {
		let controller =
			Engine.map && typeof Engine.map.get_space_controller === "function"
				? Engine.map.get_space_controller(game, s)
				: game.control && game.control[s]
		controller = normalize_trench_owner(controller)
		if (controller) return controller

		// The only neutral setup trench is Doiran's preset Greek trench. Treat it
		// as AP-owned until a CP capture path explicitly takes it over.
		if (data.spaces[s] && data.spaces[s].name === "Doiran") return AP

		let printed = normalize_trench_owner(data.spaces[s] && data.spaces[s].faction)
		if (printed) return printed

		return normalize_trench_owner(game.active) || AP
	}

	function ensure_trench_owner(game, s) {
		if (!game.trench_owner) game.trench_owner = []
		let owner = normalize_trench_owner(game.trench_owner[s])
		if (!owner && has_trench(game, s) > 0) {
			owner = infer_trench_owner(game, s)
			game.trench_owner[s] = owner
		}
		return owner
	}

	function get_trench_owner(game, s) {
		if (has_trench(game, s) <= 0) return null
		return ensure_trench_owner(game, s)
	}

	function set_trench_owner(game, s, owner) {
		owner = normalize_trench_owner(owner)
		if (!owner || has_trench(game, s) <= 0) return false
		if (!game.trench_owner) game.trench_owner = []
		game.trench_owner[s] = owner
		return true
	}

	function is_enemy_trench(game, s, faction) {
		faction = normalize_trench_owner(faction)
		if (!faction || has_trench(game, s) <= 0) return false
		return get_trench_owner(game, s) !== faction
	}

	function place_trench(game, s, owner = null) {
		if (!game.trenches) game.trenches = []
		if (!game.trench_owner) game.trench_owner = []

		// Rule 15.4.4: Space may never contain more than one Trench marker.
		// Rule 15.4.4: A player can never build Level 2 trenches.
		if (!set_has(game.trenches, s) && !set_has(game.trenches_2, s)) {
			set_add(game.trenches, s)
		}
		let trench_owner = normalize_trench_owner(owner) || normalize_trench_owner(game.active) || infer_trench_owner(game, s)
		set_trench_owner(game, s, trench_owner)
	}

	function has_trench(game, s) {
		// Check Level 2 first
		if (game.trenches_2 && set_has(game.trenches_2, s)) return 2
		// Check Level 1
		if (game.trenches && set_has(game.trenches, s)) return 1
		return 0
	}

	function remove_trench(game, s) {
		if (game.trenches) set_delete(game.trenches, s)
		if (game.trenches_2) set_delete(game.trenches_2, s)
		if (game.trench_owner) delete game.trench_owner[s]
	}

	function set_trench_level(game, s, level, owner = null) {
		if (!game.trenches) game.trenches = []
		if (!game.trenches_2) game.trenches_2 = []
		if (!game.trench_owner) game.trench_owner = []
		set_delete(game.trenches, s)
		set_delete(game.trenches_2, s)
		if (level === 2) set_add(game.trenches_2, s)
		else if (level === 1) set_add(game.trenches, s)
		else {
			delete game.trench_owner[s]
			return
		}
		set_trench_owner(game, s, normalize_trench_owner(owner) || infer_trench_owner(game, s))
	}

	function enter_trench(game, s, entering_faction, options = {}) {
		entering_faction = normalize_trench_owner(entering_faction)
		let level = has_trench(game, s)
		if (!entering_faction || level <= 0) return { changed: false, action: "none", level }

		let owner = get_trench_owner(game, s)
		if (owner === entering_faction) return { changed: false, action: "friendly", level, owner }

		if (level === 1) {
			remove_trench(game, s)
			return { changed: true, action: "removed", previous_level: 1, previous_owner: owner }
		}

		if (level === 2 && options.capture_level_2_intact) {
			set_trench_owner(game, s, entering_faction)
			return { changed: owner !== entering_faction, action: "captured_intact", level: 2, previous_owner: owner }
		}

		if (level === 2) {
			set_trench_level(game, s, 1, entering_faction)
			return { changed: true, action: "degraded", previous_level: 2, previous_owner: owner }
		}

		return { changed: false, action: "none", level }
	}

	function apply_trench_attrition(game, s) {
		let level = has_trench(game, s)
		if (level <= 0) return { changed: false, action: "none", level }
		let owner = get_trench_owner(game, s)
		if (level === 1) {
			remove_trench(game, s)
			return { changed: true, action: "removed", previous_level: 1, previous_owner: owner }
		}
		let new_owner = other_trench_owner(owner)
		if (!new_owner) {
			remove_trench(game, s)
			return { changed: true, action: "removed", previous_level: level, previous_owner: owner }
		}
		set_trench_level(game, s, 1, new_owner)
		return { changed: true, action: "degraded", previous_level: 2, previous_owner: owner, owner: new_owner }
	}
	function is_hq(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].type === "hq"
	}

	function is_heavy_arty(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].name.includes("Hvy Arty")
	}

	function restore_piece(game, p) {
		set_delete(game.reduced, p)
	}

	function get_piece_mf(p) {
		if (p < 0 || !data.pieces[p]) return 0
		return data.pieces[p].mf || 0
	}

	function get_piece_badge(p) {
		if (p < 0 || !data.pieces[p]) return null
		let badge = data.pieces[p].badge
		return badge ? badge.toLowerCase() : null
	}

	function get_piece_class(p) {
		if (p < 0 || !data.pieces[p]) return null
		return data.pieces[p].piece_class
	}

	function has_rcf(p) {
		if (p < 0 || !data.pieces[p]) return false
		return data.pieces[p].rcf !== undefined
	}

	function get_piece_lf(game, p) {
		if (p < 0 || !data.pieces[p]) return 0
		let piece = data.pieces[p]

		if (is_piece_reduced(game, p)) return piece.rlf ?? piece.lf ?? 1

		// Rule 337: "?" loss value determination for current combat
		if (game && game.attack && game.attack.piece_lf && game.attack.piece_lf[p] !== undefined) {
			return game.attack.piece_lf[p]
		}

		return piece.lf ?? piece.rlf ?? 1
	}

	// === Season & Year ===

	//dont change this function
	function get_season(game) {
		const TURN_SEASON = [
			null,
			"Fall",
			"Winter",
			"Spring",
			"Summer",
			"Fall",
			"Winter",
			"Spring",
			"Summer",
			"Fall",
			"Winter",
			"Spring",
			"Summer",
			"Fall",
			"Winter",
			"Spring",
			"Summer",
			"Fall"
		]
		return TURN_SEASON[game.turn]
	}

	//dont change this function
	function get_year(game) {
		if (game.turn <= 1) return 1914
		if (game.turn <= 5) return 1915
		if (game.turn <= 9) return 1916
		if (game.turn <= 13) return 1917
		return 1918
	}

	function is_turn_event(game, event) {
		if (!game.events) return false
		let val = game.events[event]
		if (val === true) return true
		if (typeof val === "number") return val === game.turn
		return false
	}

	// === Unit Logic (Combined from units.js) ===

	function is_commonwealth_for_combination(nation) {
		return nation === "br" || nation === "in" || nation === "anz"
	}

	// Rule 9.7.5: TU infantry > TU-A infantry, better can substitute for worse (one-directional)
	function can_ottoman_substitute(lcu_nation, scu_nation) {
		return lcu_nation === "tua" && scu_nation === "tu"
	}

	function is_same_nationality_for_first_two(lcu_nation, scu_nation) {
		if (lcu_nation === scu_nation) return true
		return can_ottoman_substitute(lcu_nation, scu_nation)
	}

	function is_ottoman_group(nation) {
		return nation === "tu" || nation === "tua"
	}

	function is_same_combination_nationality(lcu_nation, scu_nation) {
		if (lcu_nation === scu_nation) return true
		if (is_ottoman_group(lcu_nation) && is_ottoman_group(scu_nation)) return true
		if (is_commonwealth_for_combination(lcu_nation) && is_commonwealth_for_combination(scu_nation)) return true
		return false
	}

	function get_available_lcus_in_reserve(game, faction) {
		let lcus = []
		for (let i = 1; i < data.pieces.length; i++) {
			if (data.pieces[i].piece_class === "LCU" && data.pieces[i].faction === faction && is_in_reserve(game, i)) {
				lcus.push(i)
			}
		}
		return lcus
	}

	function get_piece_value(game, p) {
		let info = data.pieces[p]
		let val = 0
		let badge = info.badge ? info.badge.toLowerCase() : ""
		if (badge === "blue") val += 100
		else if (badge === "infantry") val += 50
		else if (badge === "cavalry") val += 30

		if (info.nation === "tu") val += 10
		if (info.nation === "tua") val += 5

		if (!set_has(game.reduced, p)) val += 1
		return val
	}

	function get_combination_options_for_lcu(game, lcu_id, scu_ids, space = null) {
		const { map } = Engine
		let lcu_info = data.pieces[lcu_id]
		if (Engine.events.is_arab_desertion_active(game) && lcu_info.nation === "tua") {
			return null
		}
		if (space !== null) {
			if (map.is_galicia(space) && (lcu_info.nation === "tu" || lcu_info.nation === "tua")) {
				return null
			}
			if (
				map.is_central_asia(space) ||
				map.is_afghanistan(space) ||
				map.is_baluchistan(space) ||
				map.is_india(space) ||
				map.is_persia(space)
			) {
				return null
			}
			if (
				(map.is_russia(space) || map.is_caucasus(space)) &&
				["fr", "br", "in", "anz"].includes(lcu_info.nation)
			) {
				return null
			}
			if (data.spaces[space].terrain === "swamp" && ["tu", "tua", "bu"].includes(lcu_info.nation)) {
				return null
			}
			if (map.is_egypt(space) && (lcu_info.nation === "tu" || lcu_info.nation === "tua")) {
				return null
			}
		}

		// Filter out invalid SCUs (Rule 9.7.2)
		scu_ids = scu_ids.filter((p) => {
			let s = data.pieces[p]
			if (is_hq(p) || is_tribe(p) || s.type === "irregular") return false
			let badge = s.badge ? s.badge.toLowerCase() : ""
			if (badge === "yellow") return false // Special SCUs
			return true
		})

		// Sort scu_ids by value descending so we pick the most valuable ones to "save" in Reserve/Eliminated
		scu_ids.sort((a, b) => get_piece_value(game, b) - get_piece_value(game, a))

		function is_matching_first_two(lcu_id, scu_id) {
			let l = data.pieces[lcu_id]
			let s = data.pieces[scu_id]
			let l_badge = l.badge ? l.badge.toLowerCase() : ""
			let s_badge = s.badge ? s.badge.toLowerCase() : ""

			// Rule 9.7.6 Ottoman Special LCU
			if (l.nation === "tu" && l_badge === "yellow") {
				return s.nation === "tu" && (s_badge === "infantry" || s_badge === "blue")
			}

			// Rule 25.2.5 Substitution. Cavalry LCUs still need cavalry SCUs for the first two.
			let type_match
			if (l_badge === "yellow" || l_badge === "infantry") {
				type_match = s_badge === "infantry" || s_badge === "blue"
			} else if (l_badge === "blue") {
				type_match = s_badge === "blue"
			} else if (l_badge === "cavalry") {
				type_match = s_badge === "cavalry"
			} else {
				type_match = s_badge === l_badge
			}
			if (!type_match) return false

			return is_same_nationality_for_first_two(l.nation, s.nation)
		}

		function is_matching_third(lcu_id, scu_id) {
			let l = data.pieces[lcu_id]
			let s = data.pieces[scu_id]
			let l_badge = l.badge ? l.badge.toLowerCase() : ""

			return is_same_combination_nationality(l.nation, s.nation)
		}

		// Find candidates for first two
		let first_two_candidates = scu_ids.filter((p) => is_matching_first_two(lcu_id, p))
		if (first_two_candidates.length < 2) return null

		// Try to form full strength combo
		if (scu_ids.length >= 3) {
			for (let i = 0; i < first_two_candidates.length; i++) {
				for (let j = i + 1; j < first_two_candidates.length; j++) {
					let p1 = first_two_candidates[i]
					let p2 = first_two_candidates[j]
					let p3 = scu_ids.find((p) => p !== p1 && p !== p2 && is_matching_third(lcu_id, p))
					if (p3) {
						let chosen = [p1, p2, p3]
						// No need to sort again as scu_ids was already sorted
						return { type: "full", pieces: chosen }
					}
				}
			}
		}

		// Try to form reduced strength combo
		let chosen = first_two_candidates.slice(0, 2)
		return { type: "reduced", pieces: chosen }
	}

	function can_combine_in_space(game, s, faction, allowed_lcus = null, allowed_scus = null) {
		const { map, supply } = Engine

		if (!map.is_controlled_by(game, s, faction)) return false

		let pieces = map.get_pieces_in_space(game, s)
		// Rule 14.1.9: Limited supply units cannot organize into LCUs.
		// Rule 14.3.1: OOS units cannot activate (including for combination).
		let scu_ids = pieces.filter((p) => {
			if (!is_scu(p)) return false
			if (allowed_scus && !set_has(allowed_scus, p)) return false
			if (is_hq(p) || is_tribe(p)) return false
			if (get_piece_effective_faction(game, p) !== faction) return false
			if (set_has(game.moved, p)) return false
			let status = supply.get_supply_status(game, s, faction, p)
			return status !== "OOS" && !supply.is_limited_supply_status(status)
		})

		if (scu_ids.length < 2) {
			return false
		}

		// Check geography
		let terrain = data.spaces[s].terrain
		if (terrain === "desert") {
			// Need railway to supply source
			if (!map.is_rail_connected_to_supply(game, s, faction)) {
				// 沙漠地区且无铁路连接补给源
				return false
			}
		}
		if (
			map.is_central_asia(s) ||
			map.is_afghanistan(s) ||
			map.is_baluchistan(s) ||
			map.is_india(s) ||
			map.is_persia(s)
		) {
			return false
		}

		// Rule 9.8.2: Restricted areas need rail connection to supply, or an AP supplied port/beachhead.
		let area = map.get_restricted_area(s)
		if (area) {
			let can_organize_in_restricted_area =
				map.is_rail_connected_to_supply(game, s, faction) ||
				(faction === Engine.constants.AP &&
					map.is_ap_controlled_port_or_beachhead(game, s) &&
					!map.is_besieged(game, s))
			if (!can_organize_in_restricted_area) {
				// 受限区域且无铁路连接补给源
				return false
			}
			// LCU limit (Rule 9.8.3)
			let limit = map.get_lcu_limit_for(game, faction)
			let current_count = map.count_lcu_in_area(game, area, faction)
			if (current_count >= limit) {
				// 达到 LCU 限制
				return false
			}
		}

		// Now check if any LCU can be formed
		let lcus = get_available_lcus_in_reserve(game, faction)
		if (allowed_lcus) {
			lcus = lcus.filter((lcu) => set_has(allowed_lcus, lcu))
		}
		if (lcus.length === 0) {
			// 预备区无可用 LCU
			return false
		}

		for (let lcu of lcus) {
			if (get_combination_options_for_lcu(game, lcu, scu_ids, s)) return true
		}

		// 无匹配的 LCU 组合选项
		return false
	}

	Object.assign(exports, {
		find_space,
		find_capital,
		find_piece,
		is_eliminated,
		is_in_reserve,
		piece_name,
		piece_list,
		space_name,
		get_space_nation,
		get_space_faction,
		is_removed,
		is_reinforcement,
		is_not_on_map,
		get_piece_faction,
		get_reserve_box_for_piece,
		count_tribes_on_map,
		is_piece_reduced,
		is_stanke_bey_unit,
		is_spers_rifles_unit,
		reduce_piece,
		is_regular,
		is_irregular,
		is_tribe,
		is_combat_unit,
		is_hq,
		is_heavy_arty,
		restore_piece,
		get_piece_mf,
		get_piece_badge,
		get_piece_class,
		has_rcf,
		get_piece_lf,
		get_piece_nation,
		get_piece_type,
		is_lcu,
		is_scu,
		get_nation_group,
		get_activation_nation_group,
		get_piece_nations_for_rule,
		get_piece_nation_groups_for_rule,
		piece_counts_as_nation_for_rule,
		pieces_count_as_any_nation_for_rule,
		can_piece_be_activated,
		get_piece_cf,
		get_hq_drm,
		get_season,
		get_year,
		is_turn_event,
		get_scu_reserve_box,
		get_available_lcus_in_reserve,
		get_combination_options_for_lcu,
		can_combine_in_space,
		get_lcu_reserve_box,
		get_piece_effective_faction,
		get_reserve_box,
		get_capacity,
		get_tribe_key_space,
		get_eliminated_box,
		get_removed_box,
		get_permanently_eliminated_box,
		has_scu_in_reserve,
		get_pieces_in_reserve,
		get_pieces_in_eliminated,
		get_pieces_in_removed,
		get_pieces_in_removed_only,
		get_pieces_in_reinforcements,
		get_replacement_options,
		is_permanently_eliminated,
		is_removed_only,
		remove_piece: remove_piece_from_game,
		remove_piece_from_game,
		eliminate_piece,
		replace_lcu_with_scu,
		restore_lcu_from_scu,
		add_rps,
		normalize_trench_owner,
		other_trench_owner,
		infer_trench_owner,
		ensure_trench_owner,
		has_trench,
		get_trench_owner,
		set_trench_owner,
		is_enemy_trench,
		place_trench,
		remove_trench,
		enter_trench,
		apply_trench_attrition,
		set_trench_level,
		can_entrench_in_space,
		get_entrenching_units_in_space
	})

	return exports
}
