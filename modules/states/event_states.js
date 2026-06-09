"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const { AP, CP, RESERVE } = Engine.constants
	const { set_add, set_delete } = Engine.utils
	const { find_piece, find_space, get_capacity, get_piece_badge, get_reserve_box_for_piece } = Engine.game_utils

	const states = {}

	// === Constants for Space IDs ===
	const FAO = find_space("Fao")
	const BASRA = find_space("Basra")
	const TO_FAO = find_space("to Fao")
	const TO_ABADAN = find_space("to Abadan")
	const SHAIBA = find_space("Shaiba")
	const SALONIKA = find_space("Salonika")
	const KUM_KALE = find_space("Kum Kale")
	const SEDDUL_BAHR = find_space("Seddul Bahr")
	const MAIDOS = find_space("Maidos")
	const CANAKKALE = find_space("Canakkale")
	const BATUM = find_space("Batum")
	const GALICIA = find_space("Galicia")
	const GALLIPOLI = find_space("Gallipoli")
	const BOSPHORUS_FORTS = find_space("The Bosphorus Forts")
	const MECCA = find_space("Mecca")
	const LAMIA = find_space("Lamia")
	const ATHENS = find_space("ATHENS")
	const CAUCASIAN_ARMY_REFORMS_TARGET = 12
	const JERUSALEM_BY_CHRISTMAS_CP_SUPPLY_SOURCES = [
		"Galicia",
		"CONSTANTINOPLE",
		"Kayseri",
		"Erzincan",
		"Damascus",
		"Baghdad"
	]
	const JERUSALEM_BY_CHRISTMAS_LIMITED_CP_SUPPLY_SOURCES = ["Maan", "Central Asia"]

	function event_space_name(rules, s) {
		if (rules && typeof rules.space_name === "function") return rules.space_name(s)
		if (!data.spaces[s]) return "Unknown Space (" + s + ")"
		return `s${s}`
	}

	function event_piece_name(rules, p, reduced = false) {
		if (rules && typeof rules.piece_name === "function") return rules.piece_name(p, reduced)
		if (!data.pieces[p]) return "Unknown Unit (" + p + ")"
		return reduced ? `p${p}` : `P${p}`
	}

	function set_event_state_after_interrupt(game, next_state) {
		if (
			game.state_stack &&
			game.state_stack.length > 0 &&
			(game.state === "jihad_placement" ||
				game.state === "jihad_removal" ||
				game.state === "jihad_rebellion_check" ||
				game.state === "place_egyptian_rebellion")
		) {
			game.state_stack[game.state_stack.length - 1].state = next_state
			return
		}
		game.state = next_state
	}

	function can_place_romania_combined_bu_ah_in_space(game, s) {
		if (!(s > 0 && data.spaces[s]) || data.spaces[s].nation !== "bu") return false
		let plan =
			Engine.collapse && typeof Engine.collapse.get_romanian_entry_plan === "function"
				? Engine.collapse.get_romanian_entry_plan()
				: null
		let unit_name = (plan && plan.cp && plan.cp.combined_bu_ah_name) || "Combined BU/AH Div"
		let p = find_piece(CP, unit_name)
		return p >= 0 && Engine.map.can_place_piece_in_space(game, s, p)
	}

	/**
	 * 检查地块是否为丘吉尔胜出事件的合法增援地块
	 */
	function is_german_subs_reinforcement_turn(game) {
		return Engine.events.is_german_subs_reinforcement_turn(game)
	}

	function is_churchill_reinf_space(ctx, s) {
		let { game, rules } = ctx
		let space = data.spaces[s]
		if (s === rules.get_reserve_box(AP)) return true
		return (
			!!space &&
			!!space.port &&
			Engine.map.is_aegean_east_med_port(s) &&
			!is_german_subs_reinforcement_turn(game) &&
			Engine.map.is_controlled_by(game, s, AP) &&
			!Engine.map.is_besieged(game, s) &&
			get_capacity(game, s) > 0
		)
	}

	function log_churchill_bombardment(rules, target, cf, roll, success) {
		rules.log(`炮击 ${target}，要塞火力值 ${cf}，掷骰 ${roll}，${success ? "成功" : "失败"}。`)
	}

	function get_jerusalem_by_christmas_targets(game) {
		let targets = []
		for (let s = 1; s < data.spaces.length; s++) {
			let space = data.spaces[s]
			if (!space) continue
			if (!Engine.map.is_controlled_by(game, s, CP)) continue
			if (JERUSALEM_BY_CHRISTMAS_LIMITED_CP_SUPPLY_SOURCES.includes(space.name)) continue
			let is_holy_city = !!space.jihad_city
			let is_supply_source = is_jerusalem_by_christmas_cp_supply_source(game, s)
			if (is_holy_city || is_supply_source) {
				targets.push(s)
			}
		}
		return targets
	}

	function is_jerusalem_by_christmas_cp_supply_source(game, s) {
		let space = data.spaces[s]
		if (!space) return false
		if (JERUSALEM_BY_CHRISTMAS_CP_SUPPLY_SOURCES.includes(space.name)) return true
		if (space.name === "SOFIA") return !!(game.events && game.events["bulgaria"])
		if (space.name === "Afghanistan") return !!(game.events && game.events["afghan_alliance"])
		return false
	}

	/**
	 * 获取或初始化事件数据
	 * @param {object} game 游戏状态
	 * @param {string} key 事件键值
	 * @returns {object} 事件对象
	 */
	function use_event(game, key) {
		if (!game) {
			console.error(`Error: game object is undefined in use_event for key: ${key}`)
			throw new Error(`Cannot access event data for "${key}": game state is missing.`)
		}
		// 如果当前有激活的事件上下文且 key 匹配，则返回上下文数据
		if (game.event_ctx && game.event_ctx.key === key) {
			if (!game.event_ctx.data) game.event_ctx.data = {}
			return game.event_ctx.data
		}
		if (!game.events) game.events = {}
		if (!game.events[key] || typeof game.events[key] !== "object") {
			game.events[key] = {}
		}
		return game.events[key]
	}

	function can_place_armenian_uprising_unit(game, s) {
		if (!(s > 0 && data.spaces[s])) return false
		let pieces = Engine.map.get_pieces_in_space(game, s)
		if (pieces.length === 0) return true
		let has_ap_unit = false
		for (let p of pieces) {
			let faction = Engine.game_utils.get_piece_effective_faction(game, p)
			if (faction !== AP) return false
			has_ap_unit = true
		}
		return has_ap_unit
	}

	function get_armenian_uprising_unit_spaces(game, event) {
		let spaces = Array.isArray(event.blue_a_spaces) ? event.blue_a_spaces : []
		return spaces.filter((s) => can_place_armenian_uprising_unit(game, s))
	}

	function clear_romania_event_attack_context(game) {
		delete game.attack
		delete game.activated
		delete game.activation_cost
		delete game.attacked
		delete game.attacked_spaces
		delete game.attack_eligibility_cache
		delete game.event_romania_attack_from
		delete game.romania_event_activation
		delete game.event_romania_attack_required
		if (game.event_next_state === "event_romania_attack_cleanup") {
			delete game.event_next_state
		}
	}

	function finish_gorlice_tarnow_event(game, rules) {
		let event = use_event(game, "gorlice_tarnow")
		game.active = event.origin_active !== undefined ? event.origin_active : CP
		rules.goto_end_event()
	}

	function get_reinforcement_units(game) {
		let units = null
		let source = null
		if (
			game.event_ctx &&
			game.event_ctx.data &&
			Array.isArray(game.event_ctx.data.reinf_to_place) &&
			game.event_ctx.data.reinf_to_place.length > 0
		) {
			units = game.event_ctx.data.reinf_to_place
			source = game.event_ctx.data
		}
		if ((!units || units.length === 0) && game.event_ctx && game.event_ctx.key && game.events) {
			let event = game.events[game.event_ctx.key]
			if (event && Array.isArray(event.reinf_to_place) && event.reinf_to_place.length > 0) {
				units = event.reinf_to_place
				source = event
			}
		}
		return { units, source }
	}

	function is_reinforcement_placement_spec(value) {
		return !!(
			value &&
			typeof value === "object" &&
			!Array.isArray(value) &&
			("mode" in value || "type" in value || "reserve" in value || "reserve_box" in value)
		)
	}

	function normalize_reinforcement_placement(value) {
		let spec = {
			mode: "either",
			reserve_box: null
		}

		if (typeof value === "string") {
			spec.mode = value
		} else if (is_reinforcement_placement_spec(value)) {
			spec.mode = value.mode || value.type || "either"
			spec.reserve_box = value.reserve_box || value.reserve || null
		}

		if (!["map", "reserve", "either"].includes(spec.mode)) {
			spec.mode = "either"
		}

		return spec
	}

	function get_reinforcement_placement(source, unit_name) {
		if (!source || source.reinf_placement === undefined) {
			return normalize_reinforcement_placement()
		}

		let value = source.reinf_placement

		if (Array.isArray(value)) {
			return normalize_reinforcement_placement(value[0])
		}

		if (is_reinforcement_placement_spec(value)) {
			return normalize_reinforcement_placement(value)
		}

		if (value && typeof value === "object") {
			return normalize_reinforcement_placement(value[unit_name])
		}

		return normalize_reinforcement_placement(value)
	}

	function get_reinforcement_reserve_space(faction, unit_name, placement) {
		let reserve = placement && placement.reserve_box

		if (typeof reserve === "number" && reserve > 0) {
			return reserve
		}

		if (typeof reserve === "string" && reserve !== "auto") {
			let reserve_name = reserve.toLowerCase()
			if (reserve_name === "scu") return Engine.game_utils.get_scu_reserve_box(faction)
			if (reserve_name === "lcu") return Engine.game_utils.get_lcu_reserve_box(faction)

			let reserve_space = find_space(reserve)
			if (reserve_space >= 0) return reserve_space
		}

		let piece = find_piece(faction, unit_name)
		if (piece >= 0) return get_reserve_box_for_piece(piece)

		return Engine.game_utils.get_reserve_box(faction)
	}

	function get_reinforcement_logic_key(source, unit_name) {
		if (!source || source.reinf_logic === undefined) return "is_br"
		let value = source.reinf_logic
		if (typeof value === "function") {
			let resolved = value(unit_name, source)
			return resolved || "is_br"
		}
		if (value && typeof value === "object" && !Array.isArray(value)) {
			return value[unit_name] || value.default || "is_br"
		}
		return value || "is_br"
	}

	function consume_reinforcement_placement(source, unit_name) {
		if (!source || source.reinf_placement === undefined) return

		if (Array.isArray(source.reinf_placement)) {
			source.reinf_placement.shift()
			if (source.reinf_placement.length === 0) delete source.reinf_placement
			return
		}

		if (is_reinforcement_placement_spec(source.reinf_placement)) return

		if (source.reinf_placement && typeof source.reinf_placement === "object") {
			delete source.reinf_placement[unit_name]
			if (Object.keys(source.reinf_placement).length === 0) delete source.reinf_placement
		}
	}

	function start_caucasian_army_reforms_reinforcements(game) {
		let data_event = get_active_event_data(game)
		if (!data_event) return
		data_event.reinf_to_place = ["TU 1 Caucasian", "TU 2 Caucasian"]
		data_event.reinf_placement = "map"
		data_event.reinf_logic = "is_caucasian_army_reforms_rein"
		game.state = "event_place_reinforcements"
	}

	function get_active_event_data(game) {
		if (game && game.event_ctx && game.event_ctx.data) return game.event_ctx.data
		return null
	}

	function move_rupel_greek_unit(game, p, s) {
		if (game.pieces[p] === s) return
		let from = game.pieces[p]
		game.pieces[p] = s
		if (from > 0) {
			Engine.sync_neutral_vp_state(game, from)
			Engine.sync_jihad_city_state(game, from)
			Engine.sync_region_control(game, from)
		}
		Engine.sync_neutral_vp_state(game, s)
		Engine.sync_jihad_city_state(game, s)
		Engine.sync_region_control(game, s)
		if (!game.move_animation) game.move_animation = []
		game.move_animation.push([p, s])
	}

	function get_yildrim_spaces(game) {
		let spaces = new Set()
		for (let name of ["GE Yildrim #1", "GE Yildrim #2", "GE Yildrim #3"]) {
			let p = find_piece(CP, name)
			if (p >= 0 && game.pieces[p] > 0) spaces.add(game.pieces[p])
		}
		return Array.from(spaces)
	}

	function can_place_yildrim_falkenhayn(game) {
		let falkenhayn = find_piece(CP, "GE Falkenhayn HQ")
		if (falkenhayn < 0) return false
		if (Engine.game_utils.is_eliminated(game, falkenhayn)) return false
		if (Engine.game_utils.is_removed(game, falkenhayn)) return false
		return get_yildrim_spaces(game).length > 0
	}

	function get_event_prompt_prefix(game, fallback = "事件") {
		let key = game && game.event_ctx ? game.event_ctx.key : null
		if (key === "kitcheners_invasion") return "基钦纳入侵"
		if (key === "gallipoli_invasion") return "加里波利入侵"
		if (key === "salonika_invasion") return "萨洛尼卡入侵"
		return fallback
	}

	function get_available_invasion_island_bases(game, rules) {
		let result = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!rules.is_island_base(game, s)) continue
			if (!rules.is_controlled_by(game, s, AP)) continue
			result.push(s)
		}
		return result
	}

	function is_ap_invasion_event_used_this_turn(game) {
		return !!(game && game.events && game.events["ap_invasion_event"] === game.turn)
	}

	function mark_ap_invasion_event_used_this_turn(game) {
		if (!game.events) game.events = {}
		game.events["ap_invasion_event"] = game.turn
	}

	function can_start_invasion_event(game, rules) {
		return (
			game.events["churchill_prevails"] &&
			rules.get_season(game) !== "Winter" &&
			!game.events["unrestricted_submarine_warfare"] &&
			!is_ap_invasion_event_used_this_turn(game)
		)
	}

	function is_allowed_event_beachhead_space(game, s) {
		let invasion = get_active_event_data(game)
		if (!invasion) return true
		if (invasion.allowed_beachhead_area && data.spaces[s].area !== invasion.allowed_beachhead_area) {
			return false
		}
		return !(
			invasion.allowed_beachhead_island_base > 0 &&
			Engine.map.get_adjacent_island_base_for_beachhead(s) !== invasion.allowed_beachhead_island_base
		)
	}

	function get_available_beachhead_placement_spaces(game, island_base = -1) {
		let result = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (
				Engine.map.can_ap_place_beachhead_marker(game, s, island_base) &&
				is_allowed_event_beachhead_space(game, s)
			) {
				result.push(s)
			}
		}
		return result
	}

	function add_ap_beachhead_reserve_from_event(game, rules, override = null) {
		let invasion = override || get_active_event_data(game)
		if (!invasion) return
		let count = Number(invasion.beachheads_to_place) || 0
		if (count <= 0) return
		// Gallipoli and Salonika now bank generic reserve markers for later legal invasion moves.
		Engine.events.add_ap_beachhead_reserve(game, count)
		rules.log(`AP 获得 ${count} 个滩头标记${count === 1 ? "" : "s"}.`)
		delete invasion.beachheads_to_place
	}

	function get_gallipoli_invasion_lcus(game, rules) {
		let invasion = get_active_event_data(game)
		let island_base = invasion && invasion.invasion_island_base
		if (!island_base) return []
		return ["BR VIII Corps", "ANZ ANZAC"]
			.map((name) => rules.find_piece(AP, name))
			.filter((p) => p >= 0 && game.pieces[p] === island_base)
	}

	function is_gallipoli_reserve_scu_match(lcu, scu) {
		let lcu_info = data.pieces[lcu]
		let scu_info = data.pieces[scu]
		if (!lcu_info || !scu_info) return false
		if (scu_info.faction !== AP || scu_info.piece_class !== "SCU") return false
		if (lcu_info.nation !== "br" && lcu_info.nation !== "anz") return false
		if (scu_info.nation !== lcu_info.nation) return false
		let badge = get_piece_badge(scu)
		return badge === "infantry" || badge === "blue"
	}

	function get_gallipoli_flip_options(game, rules, p) {
		let info = data.pieces[p]
		if (!info || info.piece_class !== "LCU") return []

		let full_options = []
		let reduced_options = []

		for (let i = 1; i < data.pieces.length; i++) {
			if (!rules.is_in_reserve(game, i)) continue
			let replacement = data.pieces[i]
			if (replacement.piece_class !== "SCU") continue
			if (!is_gallipoli_reserve_scu_match(p, i)) continue
			if (Engine.events.is_turkish_replacement_blocked && Engine.events.is_turkish_replacement_blocked(game, i))
				continue

			if (Engine.game_utils.is_piece_reduced(game, i)) reduced_options.push(i)
			else full_options.push(i)
		}
		return full_options.length > 0 ? full_options : reduced_options
	}

	function can_gallipoli_scu_sr_to_reserve(game, rules, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP || !rules.is_scu(p)) return false
		if (game.pieces[p] <= 0 || rules.is_in_reserve(game, p)) return false
		let badge = get_piece_badge(p)
		if (badge !== "infantry" && badge !== "blue") return false
		if (!rules.can_sr_piece(game, p, AP)) return false
		if (!rules.can_sr_to_space(game, p, rules.get_reserve_box(AP), AP)) return false

		let pending_lcus = get_gallipoli_invasion_lcus(game, rules).filter((lcu) =>
			Engine.game_utils.is_piece_reduced(game, lcu)
		)
		if (pending_lcus.length === 0) return false

		return pending_lcus.some(
			(lcu) => is_gallipoli_reserve_scu_match(lcu, p) && get_gallipoli_flip_options(game, rules, lcu).length === 0
		)
	}

	function get_gallipoli_target_lcu_for_scu(game, rules, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP || !rules.is_scu(p)) return -1

		let pending_lcus = get_gallipoli_invasion_lcus(game, rules).filter((lcu) =>
			Engine.game_utils.is_piece_reduced(game, lcu)
		)
		for (let lcu of pending_lcus) {
			if (rules.is_in_reserve(game, p)) {
				if (get_gallipoli_flip_options(game, rules, lcu).includes(p)) return lcu
			} else if (
				is_gallipoli_reserve_scu_match(lcu, p) &&
				get_gallipoli_flip_options(game, rules, lcu).length === 0
			) {
				return lcu
			}
		}

		return -1
	}

	function auto_flip_gallipoli_lcus_with_reserve_scus(game, rules) {
		let pending_lcus = get_gallipoli_invasion_lcus(game, rules).filter((p) =>
			Engine.game_utils.is_piece_reduced(game, p)
		)
		for (let lcu of pending_lcus) {
			if (get_gallipoli_flip_options(game, rules, lcu).length === 0) continue
			rules.set_delete(game.reduced, lcu)
			rules.log(`${rules.piece_name(lcu)} flipped.`)
		}
	}

	function enter_gallipoli_invasion_flip_or_finish(game, rules) {
		auto_flip_gallipoli_lcus_with_reserve_scus(game, rules)
		let pending_lcus = get_gallipoli_invasion_lcus(game, rules).filter((p) =>
			Engine.game_utils.is_piece_reduced(game, p)
		)
		if (pending_lcus.length === 0) finish_gallipoli_invasion(game, rules)
		else game.state = "event_gallipoli_invasion_flip"
	}

	function is_ap_british_empire_scu(p) {
		let info = data.pieces[p]
		return !!(
			info &&
			info.faction === AP &&
			info.piece_class === "SCU" &&
			(info.nation === "br" || info.nation === "in" || info.nation === "anz")
		)
	}

	function can_project_alexandria_sr_piece(game, rules, p, event_port, count = 0, max_count = 3) {
		if (!(event_port > 0)) return false
		if (!is_ap_british_empire_scu(p)) return false
		let badge = get_piece_badge(p)
		if (badge !== "infantry" && badge !== "blue") return false
		if (!rules.can_sr_piece(game, p, AP)) return false
		if (!rules.can_sr_to_space(game, p, event_port, AP)) return false
		if (game.pieces[p] === event_port) return false
		let cost = rules.get_sr_cost(p, game.pieces[p], event_port, AP)
		return count + cost <= max_count
	}

	function can_salonika_invasion_sr_piece(game, rules, p, island_base) {
		if (!(island_base > 0)) return false
		if (!is_ap_british_empire_scu(p)) return false
		if (!rules.can_sr_piece(game, p, AP)) return false
		if (game.pieces[p] === island_base) return false
		if (rules.is_in_reserve(game, p)) {
			if (!rules.can_use_reserve_sr_for_piece(p)) return false
			return rules.can_sr_to_space(game, p, island_base, AP)
		}
		if (game.pieces[p] <= 0) return false
		return rules.can_sr_to_space(game, p, island_base, AP)
	}

	function finish_gallipoli_invasion(game, rules) {
		let invasion = get_active_event_data(game)
		add_ap_beachhead_reserve_from_event(game, rules, invasion)
		if (invasion) delete invasion.flip_lcu_if_scu
		if (invasion) delete invasion.invasion_island_base
		if (invasion) delete invasion.allowed_beachhead_area
		if (invasion) delete invasion.allowed_beachhead_island_base
		rules.goto_end_event()
	}

	function finish_salonika_invasion(game, rules) {
		let invasion = get_active_event_data(game)
		add_ap_beachhead_reserve_from_event(game, rules, invasion)
		if (invasion) delete invasion.allow_sr_to_island
		if (invasion) delete invasion.invasion_island_base
		if (invasion) delete invasion.allowed_beachhead_area
		if (invasion) delete invasion.allowed_beachhead_island_base
		rules.goto_end_event()
	}

	function get_verdun_piece_cost(p) {
		return Engine.game_utils.is_lcu(p) ? 3 : 1
	}

	function is_verdun_elite_or_special(p) {
		let badge = get_piece_badge(p)
		return badge === "blue" || badge === "yellow"
	}

	function is_verdun_piece_eligible(game, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP) return false
		if (info.type === "hq") return false
		if (info.nation !== "br" && info.nation !== "in" && info.nation !== "anz") return false

		let badge = get_piece_badge(p)
		if (badge === "cavalry" || badge === "camel" || badge === "armored") return false
		if (info.nation === "br" && badge === "yellow") return false

		if (Engine.game_utils.is_in_reserve(game, p)) return !Engine.game_utils.is_lcu(p)
		if (Engine.game_utils.is_not_on_map(game, p)) return false

		let space = game.pieces[p]
		return Engine.map.is_in_supply(game, space, AP, p)
	}

	function build_verdun_pool(game) {
		let pool = []
		for (let p = 1; p < data.pieces.length; p++) {
			if (is_verdun_piece_eligible(game, p)) pool.push(p)
		}
		return pool
	}

	function sum_verdun_cost(piece_ids, predicate) {
		let total = 0
		for (let p of piece_ids) {
			if (!predicate || predicate(p, data.pieces[p])) total += get_verdun_piece_cost(p)
		}
		return total
	}

	function create_verdun_requirement(pool, target, awarded_vp) {
		let minimum = Math.ceil(target / 2)
		let br_available = sum_verdun_cost(pool, (p, info) => info.nation === "br")
		let anz_available = sum_verdun_cost(pool, (p, info) => info.nation === "anz")
		let in_available = sum_verdun_cost(pool, (p, info) => info.nation === "in")
		let elite_available = sum_verdun_cost(pool, (p) => is_verdun_elite_or_special(p))
		return {
			target,
			awarded_vp,
			br_min: Math.min(minimum, br_available),
			br_anz_min: Math.min(minimum, br_available + anz_available),
			br_anz_in_min: Math.min(minimum, br_available + anz_available + in_available),
			elite_min: Math.min(minimum, elite_available)
		}
	}

	function create_verdun_plan(game) {
		let pool = build_verdun_pool(game)
		return {
			pool,
			selected: [],
			original_spaces: {},
			default_awarded_vp: 2,
			partial: create_verdun_requirement(pool, 2, 1),
			full: create_verdun_requirement(pool, 4, 0)
		}
	}

	function create_kaiserschlacht_plan(game) {
		let pool = build_verdun_pool(game)
		return {
			pool,
			selected: [],
			original_spaces: {},
			default_awarded_vp: 1,
			full: create_verdun_requirement(pool, 3, 0)
		}
	}

	function get_verdun_selection_summary(plan, pending_piece = null) {
		let selected = new Set(plan.selected || [])
		let count = 0
		let br_count = 0
		let br_anz_count = 0
		let br_anz_in_count = 0
		let elite_count = 0

		for (let p of selected) {
			let info = data.pieces[p]
			let cost = get_verdun_piece_cost(p)
			count += cost
			if (info.nation === "br") br_count += cost
			if (info.nation === "br" || info.nation === "anz") br_anz_count += cost
			if (info.nation === "br" || info.nation === "anz" || info.nation === "in") br_anz_in_count += cost
			if (is_verdun_elite_or_special(p)) elite_count += cost
		}

		if (pending_piece !== null && pending_piece !== undefined && !selected.has(pending_piece)) {
			let info = data.pieces[pending_piece]
			let cost = get_verdun_piece_cost(pending_piece)
			selected.add(pending_piece)
			count += cost
			if (info.nation === "br") br_count += cost
			if (info.nation === "br" || info.nation === "anz") br_anz_count += cost
			if (info.nation === "br" || info.nation === "anz" || info.nation === "in") br_anz_in_count += cost
			if (is_verdun_elite_or_special(pending_piece)) elite_count += cost
		}

		return {
			selected,
			count,
			br_count,
			br_anz_count,
			br_anz_in_count,
			elite_count
		}
	}

	function is_verdun_requirement_satisfied(plan, requirement, pending_piece = null) {
		let summary = get_verdun_selection_summary(plan, pending_piece)
		return (
			summary.count >= requirement.target &&
			summary.br_count >= requirement.br_min &&
			summary.br_anz_count >= requirement.br_anz_min &&
			summary.br_anz_in_count >= requirement.br_anz_in_min &&
			summary.elite_count >= requirement.elite_min
		)
	}

	function can_finish_verdun_requirement(plan, requirement, pending_piece = null) {
		let summary = get_verdun_selection_summary(plan, pending_piece)
		if (is_verdun_requirement_satisfied(plan, requirement, pending_piece)) return true

		let candidates = []
		for (let p of plan.pool || []) {
			if (!summary.selected.has(p)) {
				let info = data.pieces[p]
				let cost = get_verdun_piece_cost(p)
				candidates.push({
					id: p,
					cost,
					br: info.nation === "br" ? cost : 0,
					br_anz: info.nation === "br" || info.nation === "anz" ? cost : 0,
					br_anz_in: info.nation === "br" || info.nation === "anz" || info.nation === "in" ? cost : 0,
					elite: is_verdun_elite_or_special(p) ? cost : 0
				})
			}
		}

		let suffix = new Array(candidates.length + 1)
		suffix[candidates.length] = { total: 0, br: 0, br_anz: 0, br_anz_in: 0, elite: 0 }
		for (let i = candidates.length - 1; i >= 0; i--) {
			suffix[i] = {
				total: suffix[i + 1].total + candidates[i].cost,
				br: suffix[i + 1].br + candidates[i].br,
				br_anz: suffix[i + 1].br_anz + candidates[i].br_anz,
				br_anz_in: suffix[i + 1].br_anz_in + candidates[i].br_anz_in,
				elite: suffix[i + 1].elite + candidates[i].elite
			}
		}

		let memo = new Map()
		let max_total_key = requirement.target + 2

		function search(index, total, br, br_anz, br_anz_in, elite) {
			if (
				total >= requirement.target &&
				br >= requirement.br_min &&
				br_anz >= requirement.br_anz_min &&
				br_anz_in >= requirement.br_anz_in_min &&
				elite >= requirement.elite_min
			) {
				return true
			}
			if (index >= candidates.length) return false

			let remain = suffix[index]
			if (total + remain.total < requirement.target) return false
			if (br + remain.br < requirement.br_min) return false
			if (br_anz + remain.br_anz < requirement.br_anz_min) return false
			if (br_anz_in + remain.br_anz_in < requirement.br_anz_in_min) return false
			if (elite + remain.elite < requirement.elite_min) return false

			let key = [
				index,
				Math.min(total, max_total_key),
				Math.min(br, requirement.br_min),
				Math.min(br_anz, requirement.br_anz_min),
				Math.min(br_anz_in, requirement.br_anz_in_min),
				Math.min(elite, requirement.elite_min)
			].join("|")
			if (memo.has(key)) return memo.get(key)

			let candidate = candidates[index]
			if (
				search(
					index + 1,
					total + candidate.cost,
					br + candidate.br,
					br_anz + candidate.br_anz,
					br_anz_in + candidate.br_anz_in,
					elite + candidate.elite
				)
			) {
				memo.set(key, true)
				return true
			}

			let result = search(index + 1, total, br, br_anz, br_anz_in, elite)
			memo.set(key, result)
			return result
		}

		return search(
			0,
			summary.count,
			summary.br_count,
			summary.br_anz_count,
			summary.br_anz_in_count,
			summary.elite_count
		)
	}

	function get_verdun_requirements(plan) {
		let requirements = []
		if (plan.full) requirements.push(plan.full)
		if (plan.partial) requirements.push(plan.partial)
		requirements.sort((a, b) => {
			if (a.awarded_vp !== b.awarded_vp) return a.awarded_vp - b.awarded_vp
			return b.target - a.target
		})
		return requirements
	}

	function get_verdun_selectable_pieces(plan) {
		let options = []
		let requirements = get_verdun_requirements(plan)
		let current_awarded_vp = get_verdun_awarded_vp(plan)
		for (let p of plan.pool || []) {
			if (plan.selected && plan.selected.includes(p)) continue
			if (
				requirements.some((requirement) => can_finish_verdun_requirement(plan, requirement, p)) ||
				requirements.some((requirement) => requirement.awarded_vp === current_awarded_vp)
			) {
				options.push(p)
			}
		}
		return options
	}

	function get_verdun_awarded_vp(plan) {
		for (let requirement of get_verdun_requirements(plan)) {
			if (is_verdun_requirement_satisfied(plan, requirement)) return requirement.awarded_vp
		}
		return plan.default_awarded_vp !== undefined ? plan.default_awarded_vp : 2
	}

	function select_verdun_piece(game, rules, plan, p) {
		if (!plan.original_spaces) plan.original_spaces = {}
		if (!plan.selected) plan.selected = []
		if (plan.original_spaces[p] === undefined) {
			plan.original_spaces[p] = game.pieces[p]
		}
		plan.selected.push(p)
		rules.remove_piece(p)
		game.selected_piece = null
	}

	function finalize_verdun_plan(game, rules) {
		let plan = use_event(game, "verdun")
		let awarded_vp = get_verdun_awarded_vp(plan)
		delete game.selected_piece
		game.vp += awarded_vp
		if (awarded_vp === 0) {
			rules.log("凡尔登战役：CP 0 VP。")
		} else if (awarded_vp === 1) {
			rules.log("凡尔登战役：CP +1 VP。")
		} else {
			rules.log("凡尔登战役：CP +2 VP。")
		}
		game.active = plan.origin_active !== undefined ? plan.origin_active : CP
		rules.goto_end_event()
	}

	// === EVENT ACTIVATION HOOKS ===

	/**
	 * 获取激活阶段的事件提示
	 */
	function get_activation_prompt(game) {
		if (game.russo_british_russian_activation) {
			let selected = Array.isArray(game.activated?.attack) ? game.activated.attack.length : 0
			return `英俄突袭：启动两个包含包含俄国部队的地区进行战斗（已选: ${selected}/2）`
		}
		if (game.romania_event_activation) {
			let selected = Array.isArray(game.activated?.attack) ? game.activated.attack.length : 0
			return `罗马尼亚：启动一个包含罗马尼亚部队的地区进行战斗（已选: ${selected}/1）`
		}
		if (game.liberate_suez_op_required) {
			let need_ops = game.liberate_suez_min_egypt_attack_ops || 2
			let used_ops = get_liberate_suez_egypt_activated_attack_ops(game)
			let remain = Math.max(0, need_ops - used_ops)
			return `解放苏伊士：选择激活的地块 (剩余行动点: ${game.ops}) [埃及进攻已分配: ${used_ops}/${need_ops} OP，仍需 ${remain} OP]`
		}
		return null
	}

	/**
	 * 激活结束后的事件状态转移
	 */
	function on_activation_done(game) {
		if (game.liberate_suez_op_required) {
			game.state = "event_liberate_suez_check_ops"
			return true
		}
		if (Engine.events.bulls_eye_should_prompt_sr(game) && Engine.events.bulls_eye_get_sr_spaces(game).length > 0) {
			game.state = "event_bulls_eye_sr"
			return true
		}
		return false
	}

	function get_valid_event_port(event) {
		if (!event || !Number.isInteger(event.event_port)) return -1
		if (event.event_port <= 0 || !data.spaces[event.event_port]) return -1
		return event.event_port
	}

	function get_grand_duke_to_tiflis_ports(game, rules) {
		let ports = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!Engine.map.is_caspian_sea_port(s)) continue
			let pieces =
				rules && typeof rules.get_pieces_in_space === "function"
					? rules.get_pieces_in_space(game, s)
					: Engine.map.get_pieces_in_space(game, s)
			let ap_pieces = pieces.filter((p) => data.pieces[p] && data.pieces[p].faction === AP)
			let ap_stack_count =
				rules && typeof rules.get_stack_count === "function"
					? rules.get_stack_count(ap_pieces)
					: Engine.map.get_stack_count(ap_pieces)
			// The event allows at most one AP piece already in the port, and the AP stack
			// must remain legal once the two RU SCUs arrive after any CP retreat.
			if (ap_pieces.length > 1) continue
			if (ap_stack_count > 1) continue
			ports.push(s)
		}
		return ports
	}

	function get_grand_duke_to_tiflis_vacant_azerbaijan_spaces(game, rules) {
		let spaces = []
		let get_pieces =
			rules && typeof rules.get_pieces_in_space === "function"
				? rules.get_pieces_in_space.bind(rules)
				: Engine.map.get_pieces_in_space
		for (let s = 1; s < data.spaces.length; s++) {
			if (!Engine.map.is_azerbaijan(s)) continue
			if (get_pieces(game, s).length === 0) {
				spaces.push(s)
			}
		}
		return spaces
	}

	function get_grand_duke_to_tiflis_retreat_options(game, piece, event_port) {
		let current_space = game.pieces[piece]
		let current_distance = Engine.map.get_distance(current_space, event_port)
		let valid = Engine.combat.get_valid_retreat_spaces(game, piece, [], 1, true)
		return valid.filter((s) => Engine.map.get_distance(s, event_port) > current_distance)
	}

	function finish_grand_duke_to_tiflis_cp_piece_retreat(game, rules, event, piece) {
		let destination = game.pieces[piece]
		if (!Engine.map.is_controlled_by(game, destination, CP) && Engine.game_utils.is_regular(piece)) {
			Engine.set_control(game, destination, CP)
		}
		if (Engine.check_persia_entry_vp_penalty) {
			Engine.check_persia_entry_vp_penalty(game, destination, [piece])
		}
		if (event.event_port > 0) {
			Engine.sync_neutral_vp_state(game, event.event_port)
		}
		Engine.sync_neutral_vp_state(game, destination)
		set_delete(game.grand_duke_to_tiflis_retreat_pieces, piece)
		if (event.cp_retreat_steps) {
			delete event.cp_retreat_steps[piece]
		}
		rules.log(`${rules.piece_name(piece)} 完成从 ${rules.space_name(event.event_port)} 的后撤。`)
		game.selected_piece = null
	}

	function finish_grand_duke_to_tiflis_cp_retreat(game, event) {
		delete game.grand_duke_to_tiflis_retreat_pieces
		delete game.selected_piece
		delete event.cp_retreat_steps
		if (event.event_port > 0) {
			Engine.set_control(game, event.event_port, AP)
		}
		game.active = AP
		game.state = "event_grand_duke_to_tiflis_sr"
	}

	// === EVENT: RUSSO-BRITISH ASSAULT (ID 1) ===

	states.event_russo_british_assault_fao_fort = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			if (rules.has_undestroyed_fort(game, FAO, CP)) {
				res.prompt("英俄突袭：炮击法奥 (Fao) 摧毁要塞")
				res.space(FAO)
			} else {
				game.state = "event_russo_british_assault_land_fao"
			}
		},
		space(ctx) {
			let { game, rules, res } = ctx
			rules.push_undo()
			if (!game.forts) game.forts = { destroyed: [] }
			if (!game.forts.destroyed) game.forts.destroyed = []
			rules.set_add(game.forts.destroyed, FAO)
			rules.log("英俄突袭：法奥要塞被摧毁")

			// 立即触发渲染
			if (res && typeof res.apply === "function") {
				res.apply(game.view)
			}

			game.state = "event_russo_british_assault_land_fao"
		}
	}

	states.event_russo_british_assault_land_fao = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("英俄突袭：波斯湾部队实施登陆")
			res.space(FAO)
		},
		space(ctx) {
			let { game, rules, res } = ctx
			rules.push_undo()

			let pieces = rules.get_pieces_in_space(game, TO_FAO)
			if (pieces.length > 0) {
				rules.log(`英俄突袭：波斯湾部队登陆到 ${rules.space_name(FAO)}.`)
				for (let p of pieces) {
					rules.move_piece(game, p, FAO)
				}
			}

			let abadan_pieces = rules.get_pieces_in_space(game, TO_ABADAN)
			if (abadan_pieces.length > 0) {
				for (let p of abadan_pieces) {
					rules.move_piece(game, p, SHAIBA)
				}
			}

			if (rules.is_controlled_by(game, FAO, CP)) {
				rules.set_control(game, FAO, AP)
				if (res && typeof res.apply === "function") {
					res.apply(game.view)
				}
			}

			game.state = "event_russo_british_assault_attack_basra"
		}
	}

	states.event_russo_british_assault_attack_basra = {
		prompt(ctx) {
			let { game, res, rules } = ctx

			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}

			if (game.attack && game.attack.space !== -1) {
				res.prompt(`英俄突袭：确认向 ${rules.space_name(game.attack.space)} 进攻`)
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			} else {
				res.prompt("英俄突袭：选择参与突袭巴士拉的单位")
				res.where(FAO)
			}

			let pieces = rules.get_pieces_in_space(game, FAO)
			for (let p of pieces) {
				if (data.pieces[p].faction === AP) {
					if (game.attack.space === -1 || game.attack.pieces.includes(p)) {
						res.piece(p)
					}
				}
			}

			if (game.attack.pieces && game.attack.pieces.length > 0) {
				if (game.attack.space !== BASRA) {
					res.space(BASRA)
				}
				// 如果已经选择了目标地块，显示确认按钮
				if (game.attack.space === BASRA) {
					res.action("confirm")
				}
			}
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}
			rules.push_undo()
			rules.set_toggle(game.attack.pieces, p)
			game.attack.space = -1
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			if (s === BASRA && game.attack && game.attack.pieces && game.attack.pieces.length > 0) {
				rules.push_undo()
				if (game.attack.space === BASRA) {
					game.attack.space = -1
				} else {
					game.attack.space = BASRA
				}
			}
		},
		confirm(ctx) {
			let { game, rules } = ctx
			if (game.attack && game.attack.space === BASRA && game.attack.pieces.length > 0) {
				rules.push_undo()
				game.attack.attacker_faction = AP
				game.attack.keep_context = true // 保持上下文，以便在俄国突袭前手动清理状态
				game.event_next_state = "event_russo_british_assault_ru_activation_setup"
				rules.start_attack_sequence(game, rules.log, () => rules.get_season(game))
			}
		}
	}

	function cleanup_russo_british_attack_state(game) {
		if (game.attack && game.attack.pieces) {
			for (let p of game.attack.pieces) {
				set_delete(game.attacked, p)
				set_delete(game.moved, p)
			}
			if (game.attack.space > 0 && Array.isArray(game.attacked_spaces)) {
				set_delete(game.attacked_spaces, game.attack.space)
			}
		}
		delete game.combat_cards
		delete game.combat_cards_effected
		delete game.combat_card_sources
		delete game.cancelled_cc_dispositions
		delete game.battle_result
		delete game.post_battle_cc_resume
		delete game.post_roll_cc_done
		game.attack = null
		game.where = -1
	}

	function begin_russo_british_russian_activation(game) {
		cleanup_russo_british_attack_state(game)
		if (!game.activated) game.activated = { move: [], attack: [] }
		if (!Array.isArray(game.activated.move)) game.activated.move = []
		game.activated.move = []
		if (!Array.isArray(game.activated.attack)) game.activated.attack = []
		game.activated.attack = []
		if (!game.activation_cost) game.activation_cost = {}
		game.activation_cost = {}
		game.russo_british_russian_activation = true
		game.active = AP
		game.where = -1
		delete game.russo_british_selected_spaces
		delete game.russo_british_attack_origins
		game.state = "activate_spaces"
	}

	function begin_romania_event_attack_activation(game) {
		clear_romania_event_attack_context(game)
		if (!game.activated) game.activated = { move: [], attack: [] }
		if (!Array.isArray(game.activated.move)) game.activated.move = []
		if (!Array.isArray(game.activated.attack)) game.activated.attack = []
		game.activated.move = []
		game.activated.attack = []
		game.activation_cost = {}
		game.attacked = []
		game.attacked_spaces = []
		game.romania_event_activation = true
		game.event_romania_attack_required = true
		game.event_next_state = "event_romania_attack_cleanup"
		game.active = AP
		game.where = -1
		game.state = "activate_spaces"
	}

	// === EVENT: ENVER GOES EAST (ID 7) ===

	function enver_get_selectable_spaces(game, rules, event) {
		let selected = event.enver_selected_spaces || []
		let selectable = []
		for (let s = 1; s < data.spaces.length; s++) {
			let pieces = rules.get_pieces_in_space(game, s)
			let turkish_pieces = pieces.filter((p) => data.pieces[p].nation === "tu" || data.pieces[p].nation === "tua")
			if (turkish_pieces.length === 0) continue
			let has_ru_adjacent = rules
				.get_connected_spaces(game, s)
				.some((ns) => rules.get_pieces_in_space(game, ns).some((p) => data.pieces[p].nation === "ru"))
			if (!has_ru_adjacent) continue
			if (rules.set_has(selected, s)) continue
			selectable.push(s)
		}
		return selectable
	}

	function enver_get_targets(game, rules, space) {
		let targets = []
		for (let ns of rules.get_connected_spaces(game, space)) {
			let has_ru = rules.get_pieces_in_space(game, ns).some((p) => data.pieces[p].nation === "ru")
			if (has_ru) targets.push(ns)
		}
		return targets
	}

	states.event_enver_goes_east_select_space = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			if (!event.enver_selected_spaces) event.enver_selected_spaces = []
			if (!event.enver_plans) event.enver_plans = []
			if (event.enver_expected_count === undefined) event.enver_expected_count = 2
			let selectable = enver_get_selectable_spaces(game, rules, event)
			res.prompt(
				`恩维尔东方攻势：选择土耳其堆叠与攻击目标（已选择: ${event.enver_plans.length}/${event.enver_expected_count}）`
			)
			if (event.enver_plans.length < event.enver_expected_count) {
				for (let s of selectable) res.space(s)
			}
			if (
				event.enver_plans.length > 0 &&
				(event.enver_plans.length >= event.enver_expected_count || selectable.length === 0)
			) {
				res.action("confirm")
			}
			if (event.enver_plans.length === 0 && selectable.length === 0) res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "enver_goes_east")
			if (event.enver_plans.length >= event.enver_expected_count) return
			rules.push_undo()
			event.enver_current_space = s
			game.state = "event_enver_goes_east_select_target"
		},
		confirm(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			if (!event.enver_plans || event.enver_plans.length === 0) return
			rules.push_undo()
			event.enver_queue = event.enver_plans.map((plan) => ({
				from: plan.from,
				to: plan.to,
				pieces: plan.pieces.slice()
			}))
			delete event.enver_current_space
			// Initialize retained cards storage if not exists
			if (!game.cc_retained) game.cc_retained = { ap: [], cp: [] }
			game.state = "event_enver_goes_east_resolve_next_attack"
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_enver_goes_east_select_target = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			let s = event.enver_current_space
			if (s === undefined) {
				game.state = "event_enver_goes_east_select_space"
				return
			}
			res.where(s)
			res.prompt(`恩维尔东方攻势：为 ${rules.space_name(s)} 的土耳其部队选择一个攻击目标。`)
			for (let ns of enver_get_targets(game, rules, s)) res.space(ns)
			res.action("cancel")
		},
		space(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			let ns = ctx.arg
			let s = event.enver_current_space
			if (s === undefined) {
				game.state = "event_enver_goes_east_select_space"
				return
			}
			let targets = enver_get_targets(game, rules, s)
			if (!rules.set_has(targets, ns)) return
			let pieces = rules
				.get_pieces_in_space(game, s)
				.filter((p) => data.pieces[p].nation === "tu" || data.pieces[p].nation === "tua")
			if (pieces.length === 0) {
				delete event.enver_current_space
				game.state = "event_enver_goes_east_select_space"
				return
			}
			rules.push_undo()
			if (!event.enver_selected_spaces) event.enver_selected_spaces = []
			if (!event.enver_plans) event.enver_plans = []
			rules.set_add(event.enver_selected_spaces, s)
			event.enver_plans.push({ from: s, to: ns, pieces: pieces.slice() })
			delete event.enver_current_space
			game.state = "event_enver_goes_east_select_space"
		},
		cancel(ctx) {
			let { game } = ctx
			let event = use_event(game, "enver_goes_east")
			delete event.enver_current_space
			game.state = "event_enver_goes_east_select_space"
		}
	}

	states.event_enver_goes_east_resolve_next_attack = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			if (!event.enver_queue || event.enver_queue.length === 0) {
				res.prompt("恩维尔东方攻势：攻击结算完毕。")
				res.action("done")
			} else {
				let next = event.enver_queue[0]
				res.prompt(
					`恩维尔东方攻势：准备结算 ${rules.space_name(next.from)} 对 ${rules.space_name(next.to)} 的攻击。`
				)
				res.action("next")
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			delete event.enver_queue
			delete event.enver_plans
			delete event.enver_selected_spaces
			delete event.enver_expected_count
			delete event.enver_current_space
			// Ensure retained cards are kept but current combat context is cleared
			delete game.combat_cards
			delete game.combat_cards_effected
			delete game.combat_card_sources
			delete game.cancelled_cc_dispositions
			game.active = AP
			rules.goto_end_event()
		},
		next(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "enver_goes_east")
			let next = event.enver_queue.shift()
			rules.log(`恩维尔东方攻势：${rules.space_name(next.from)} 攻击 ${rules.space_name(next.to)}。`)
			game.attack = {
				space: next.to,
				pieces: next.pieces.slice(),
				attacker_faction: CP,
				keep_context: true // Mark as part of the event to keep combat context
			}
			game.event_next_state = "event_enver_goes_east_resolve_next_attack"
			game.active = CP
			rules.start_attack_sequence(game, rules.log, () => rules.get_season(game))
		}
	}

	// === EVENT: SECRET TREATY (ID 8) ===

	states.event_secret_treaty_place_reinforcement = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "secret_treaty")
			if (!event.reinf_to_place) {
				event.reinf_to_place = ["BR Persian Cordon #4"]
			}
			if (event.reinf_to_place.length === 0) {
				res.prompt("秘密条约：增援放置完毕。")
				res.action("done")
				return
			}
			let unit = event.reinf_to_place[0]
			res.prompt(`秘密条约：将 ${unit} 放置在任意波斯大区。`)
			for (let s = 1; s < data.spaces.length; s++) {
				if (rules.is_secret_treaty_rein.check(game, s)) {
					if (get_capacity(game, s) > 0) {
						res.space(s)
					}
				}
			}
		},
		done(ctx) {
			let { game } = ctx
			game.state = "event_secret_treaty_select_move_space"
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "secret_treaty")
			if (!event.reinf_to_place || event.reinf_to_place.length === 0) {
				event.reinf_to_place = ["BR Persian Cordon #4"]
			}
			if (event.reinf_to_place.length === 0) {
				game.state = "event_secret_treaty_select_move_space"
				return
			}
			rules.push_undo()
			let unit = event.reinf_to_place.shift()
			rules.reinforce(game, unit, AP, s)
			if (event.reinf_to_place.length === 0) {
				delete event.reinf_to_place
				game.state = "event_secret_treaty_select_move_space"
			}
		}
	}

	states.event_secret_treaty_select_move_space = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("秘密条约：选择一个地区的协约国单位进行移动。")
			let has_option = false
			//A:波斯大区、中亚大区B:高加索、阿塞拜疆区域C:美索不达米亚限制区域。
			for (let s = 1; s < data.spaces.length; s++) {
				// A: 属于波斯大区、中亚大区
				let is_A = rules.is_persia(s) || rules.is_central_asia(s)
				// B: 属于高加索或阿塞拜疆区域
				let is_B = rules.is_caucasus(s) || rules.is_azerbaijan(s)
				// C: 属于美索不达米亚限制区域
				let is_C = rules.is_mesopotamia(s)

				if (is_A || is_B || is_C) {
					let pieces = rules.get_pieces_in_space(game, s).filter((p) => data.pieces[p].faction === AP)
					if (pieces.length > 0) {
						res.space(s)
						has_option = true
					}
				}
			}
			if (!has_option) {
				res.prompt("秘密条约：没有可移动的协约国单位。")
				res.action("done")
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			game.activated = { move: [s], attack: [] }
			game.activation_cost = {}
			game.moved = []
			game.attacked = []
			game.attacked_spaces = []
			game.move_from_event = true
			game.state = "choose_move_space"
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	// === EVENT: SPHERE OF INFLUENCE (ID 9) ===

	states.event_sphere_of_influence_place = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "sphere_of_influence")
			if (!event.reinf_to_place) {
				event.reinf_to_place = ["RU Elite DIV #3", "RU DIV #11", "RU DIV #12"]
			}
			if (event.reinf_to_place.length === 0) {
				rules.goto_end_event()
				return
			}
			let units_str = event.reinf_to_place.join("、")
			let legal_spaces_found = false
			let legal_spaces = []
			for (let s = 1; s < data.spaces.length; s++) {
				if (rules.is_ru_sphere_rein.check(game, s)) {
					res.space(s)
					legal_spaces_found = true
					legal_spaces.push(`${data.spaces[s].name} (${s})`)
				}
			}
			if (legal_spaces_found) {
				res.prompt(
					`俄国势力范围：将 ${units_str} 放置在协约国控制、空置且铁路连通俄国补给点的俄国/阿塞拜疆地区。`
				)
			} else {
				res.prompt(`俄国势力范围：没有合法位置可以放置增援单位。`)
				res.action("done")
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let units = ["RU Elite DIV #3", "RU DIV #11", "RU DIV #12"]
			rules.push_undo()

			// 全部放在选定的同一个地块
			for (let unit of units) {
				rules.reinforce(game, unit, AP, s)
			}

			rules.goto_end_event()
		},
		done(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "sphere_of_influence")
			delete event.reinf_to_place
			rules.goto_end_event()
		}
	}

	// === EVENT: PROJECT ALEXANDRIA (ID 12) ===

	states.event_project_alexandria_place_beachhead = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("亚历山大计划：将一个滩头标志放置在塞浦路斯旁的滩头地区。")
			for (let s of get_available_beachhead_placement_spaces(game)) {
				if (data.spaces[s].beach_for === "Cyprus") res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "project_alexandria")
			if (data.spaces[s].beach_for !== "Cyprus") return
			if (!Engine.map.can_ap_place_beachhead_marker(game, s)) return
			rules.push_undo()
			if (!game.beachheads) game.beachheads = []
			set_add(game.beachheads, s)
			event.event_port = s
			game.state = "event_project_alexandria_sr"
			Engine.neutral.on_beachhead_placed(game, s, AP)
			rules.log(`滩头放置在 ${rules.space_name(s)}。`)
		}
	}

	states.event_project_alexandria_sr = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let data_event = rules.get_event_data() || {}
			let event = use_event(game, "project_alexandria")
			let count = data_event.count || 0
			let max_count = 3 // Up to 3 SR points for SCUs
			let event_port = get_valid_event_port(event)
			let port_name = event_port > 0 ? rules.space_name(event_port) : "滩头"
			res.prompt(`亚历山大计划：选择至多3支英国/印度/澳新步兵师战略调整至位于 ${port_name} 的滩头 (${count}/3)。`)

			if (event_port > 0) {
				for (let p = 1; p < data.pieces.length; p++) {
					if (can_project_alexandria_sr_piece(game, rules, p, event_port, count, max_count)) res.piece(p)
				}
			}
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			let event = use_event(game, "project_alexandria")
			let event_port = get_valid_event_port(event)
			if (event_port <= 0) {
				rules.log("亚历山大计划：滩头未初始化，结束事件。")
				rules.goto_end_operations()
				return
			}
			let data_event = rules.get_event_data()
			let count = data_event.count || 0
			let max_count = 3
			if (!can_project_alexandria_sr_piece(game, rules, p, event_port, count, max_count)) return
			rules.push_undo()
			let cost = rules.get_sr_cost(p, game.pieces[p], event_port, AP)
			data_event.count = (data_event.count || 0) + cost

			if (!game.sr_moved) game.sr_moved = []
			rules.set_add(game.sr_moved, p)

			Engine.map.apply_sr_control_effects(game, p, game.pieces[p], event_port, AP)
			game.pieces[p] = event_port
			rules.log(`${rules.piece_name(p)} 战略调整至滩头${cost !== 1 ? ` (Cost: ${cost})` : ''}.`)

			if ((data_event.count || 0) >= 3) {
				delete event.event_port
				rules.goto_end_operations()
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "project_alexandria")
			delete event.event_port
			rules.goto_end_operations()
		}
	}

	// === EVENT: CHURCHILL PREVAILS (ID 13) ===

	states.event_churchill_prevails_bombardment = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "churchill_prevails")
			let step = event.churchill_prevails_step || 0

			if (step === 0) {
				res.prompt("丘吉尔胜出：选择首先炮击的达达尼尔要塞（ Kum Kal 或 Sefful bahr ）")
				res.space(KUM_KALE)
				res.space(SEDDUL_BAHR)
			} else if (step === 1) {
				let first = event.churchill_prevails_first_fort
				let second = first === KUM_KALE ? SEDDUL_BAHR : KUM_KALE
				res.prompt(`丘吉尔胜出：继续炮击第二个达达尼尔要塞（${rules.space_name(second)}）`)
				res.space(second)
			} else if (step === 2) {
				res.prompt("丘吉尔胜出：选择首先炮击的窄口要塞（ Maidos 或 Canakkale ）")
				res.space(MAIDOS)
				res.space(CANAKKALE)
			} else if (step === 3) {
				let first = event.churchill_prevails_first_fort
				let second = first === MAIDOS ? CANAKKALE : MAIDOS
				res.prompt(`丘吉尔胜出：继续炮击第二个窄口要塞（${rules.space_name(second)}）`)
				res.space(second)
			} else if (step === 4) {
				res.prompt("丘吉尔胜出：最后炮击加里波利要塞（ Gallipoli ）")
				res.space(GALLIPOLI)
			}
		},
		space(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "churchill_prevails")
			let s = ctx.arg
			rules.push_undo()

			let cf = data.spaces[s].fort || 1
			let roll = rules.roll_die(6, game)
			let success = roll > cf
			log_churchill_bombardment(rules, rules.space_name(s), cf, roll, success)

			if (success) {
				rules.log(`${rules.space_name(s)} 要塞被摧毁。`)
				if (!game.forts) game.forts = { destroyed: [] }
				if (!game.forts.destroyed) game.forts.destroyed = []
				rules.set_add(game.forts.destroyed, s)

				if (event.churchill_prevails_step === 0) {
					event.churchill_prevails_first_fort = s
					event.churchill_prevails_step = 1
				} else if (event.churchill_prevails_step === 1) {
					event.churchill_prevails_step = 2
				} else if (event.churchill_prevails_step === 2) {
					event.churchill_prevails_first_fort = s
					event.churchill_prevails_step = 3
				} else if (event.churchill_prevails_step === 3) {
					event.churchill_prevails_step = 4
				} else if (event.churchill_prevails_step === 4) {
					rules.log("加里波利要塞被摧毁，皇家海军驶入马尔马拉海。")
					game.state = "event_churchill_prevails_constantinople"
				}
			} else {
				rules.log("炮击受挫，后续计划终止。")
				rules.goto_end_operations()
			}
		}
	}

	states.event_churchill_prevails_constantinople = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("皇家海军驶入马尔马拉海。是否选择炮击君士坦丁堡？")
			res.action("bombard")
			res.action("skip")
		},
		bombard(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			rules.log("皇家海军炮击君士坦丁堡，VP -1，圣战等级 +1。")
			game.vp -= 1
			game.state = "event_churchill_prevails_place_units"
			rules.update_jihad_level(game, 1)
		},
		skip(ctx) {
			let { game, rules } = ctx
			rules.log("协约国放弃炮击君士坦丁堡。")
			game.state = "event_churchill_prevails_place_units"
		}
	}

	states.event_churchill_prevails_place_units = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "churchill_prevails")
			if (!event.reinf_to_place) {
				event.reinf_to_place = ["BR Elite DIV #1", "BR Elite DIV #2"]
			}
			let unit = event.reinf_to_place[0]
			res.prompt(`丘吉尔胜出：将 ${unit} 放置在预备军格或任何协约国控制的爱琴海/东地中海港口。`)

			for (let s = 1; s < data.spaces.length; s++) {
				if (is_churchill_reinf_space(ctx, s)) {
					res.space(s)
				}
			}
		},
		space(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "churchill_prevails")
			let s = ctx.arg

			// 验证选择的地块是否合法
			if (!is_churchill_reinf_space(ctx, s)) {
				return
			}

			if (!event.reinf_to_place || event.reinf_to_place.length === 0) {
				event.reinf_to_place = ["BR Elite DIV #1", "BR Elite DIV #2"]
			}
			if (event.reinf_to_place.length === 0) {
				game.state = "event_churchill_prevails_bosphorus"
				return
			}
			rules.push_undo()
			let unit = event.reinf_to_place.shift()
			rules.reinforce(game, unit, AP, s)
			if (event.reinf_to_place.length === 0) {
				delete event.reinf_to_place
				game.state = "event_churchill_prevails_bosphorus"
			}
		}
	}

	states.event_churchill_prevails_bosphorus = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("丘吉尔胜出：是否继续炮击博斯普鲁斯海峡要塞？")
			res.action("bombard")
			res.action("skip")
		},
		bombard(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			let cf = BOSPHORUS_FORTS >= 0 ? data.spaces[BOSPHORUS_FORTS].fort || 1 : 3
			let roll = rules.roll_die(6, game)
			let success = roll > cf
			log_churchill_bombardment(rules, "博斯普鲁斯海峡要塞", cf, roll, success)
			if (success) {
				if (!game.forts) game.forts = { destroyed: [] }
				if (!game.forts.destroyed) game.forts.destroyed = []
				if (BOSPHORUS_FORTS >= 0) rules.set_add(game.forts.destroyed, BOSPHORUS_FORTS)
				game.events["bosphorus_destroyed"] = true
				if (!game.events["german_subs"]) {
					if (!Engine.events.can_record_russian_rp || Engine.events.can_record_russian_rp(game)) {
						game.rp_ap.ru += 2
					}
					rules.log(
						"博斯普鲁斯海峡要塞被摧毁，俄国立即获得 2 点补员点数，此后每回合额外获得 1 点，直到【地中海潜艇猎袭】打出。"
					)
				} else {
					rules.log(
						"博斯普鲁斯海峡要塞被摧毁，但【地中海潜艇猎袭】已生效，俄国不获得额外补员点数。"
					)
				}
				rules.goto_end_operations()
			} else {
				rules.log("炮击受挫，后续计划终止。")
				rules.goto_end_operations()
			}
		},
		skip(ctx) {
			let { rules } = ctx
			rules.log("协约国不继续炮击博斯普鲁斯海峡要塞。")
			rules.goto_end_operations()
		}
	}

	// === EVENT: ARAB REVOLT (ID 16) ===

	states.event_arab_revolt_place = {
		prompt(ctx) {
			let { game, res } = ctx
			let { units } = get_reinforcement_units(game)
			if (!units || units.length === 0) {
				res.prompt("阿拉伯起义：所有单位已放置在麦加。是否启动它们进行战斗？")
				res.action("activate")
				return
			}
			let unit = units[0]
			res.prompt(`阿拉伯起义：在麦加放置 ${unit}。`)
			res.space(MECCA)
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			if (s !== MECCA) return
			let { units } = get_reinforcement_units(game)
			if (!units || units.length === 0) return
			rules.push_undo() // 保存每个单位放置前的状态
			let unit = units.shift()
			rules.reinforce(game, unit, AP, s)
			let p = rules.find_piece(AP, unit)
			if (!game.arab_revolt_pieces) game.arab_revolt_pieces = []
			rules.set_add(game.arab_revolt_pieces, p)
		},
		activate(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.state = "event_arab_revolt_attack"
			game.selected_pieces = []
		}
	}

	states.event_arab_revolt_attack = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let revolt_pieces = game.arab_revolt_pieces || []

			// If not all 3 pieces selected, allow selecting them
			if (game.selected_pieces.length < 3) {
				res.prompt(`阿拉伯起义：请选中麦加的所有 3 个起义单位以发起战斗 (${game.selected_pieces.length}/3)。`)
				for (let p of revolt_pieces) {
					if (!game.selected_pieces.includes(p)) {
						res.piece(p)
					}
				}
				return
			}

			// All 3 selected, now pick target
			res.who(game.selected_pieces)
			if (game.attack && game.attack.space !== -1) {
				res.prompt(`阿拉伯起义：确认向 ${rules.space_name(game.attack.space)} 进攻`)
				res.where(game.attack.space)
				res.action("confirm")
			} else {
				res.prompt("阿拉伯起义：请选择攻击目标地块。")
			}
			let targets = rules.get_attackable_spaces(game.selected_pieces)
			if (targets.length === 0 && (!game.attack || game.attack.space === -1)) {
				res.prompt("阿拉伯起义：没有可攻击的目标。事件结束。")
				res.action("done")
			} else {
				for (let t of targets) {
					if (!game.attack || t !== game.attack.space) {
						res.space(t)
					}
				}
			}
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			rules.set_add(game.selected_pieces, p)
			// Reset target when piece list changes
			if (game.attack) game.attack.space = -1
		},
		space(ctx) {
			let { game, rules, arg: t } = ctx
			rules.push_undo()
			if (!game.attack) {
				game.attack = { pieces: [...game.selected_pieces], space: -1 }
			}
			if (game.attack.space === t) {
				game.attack.space = -1
			} else {
				game.attack.space = t
			}
		},
		confirm(ctx) {
			let { game } = ctx
			if (game.attack && game.attack.space !== -1) {
				delete game.selected_pieces
				delete game.arab_revolt_pieces
				game.state = "confirm_attack"
				game.event_next_state = "event_arab_revolt_cleanup"
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			delete game.selected_pieces
			delete game.arab_revolt_pieces
			rules.goto_end_event()
		}
	}

	states.event_arab_revolt_cleanup = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("阿拉伯起义：战斗结束。")
			res.action("done")
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	// === EVENT: ALLIED SOLIDARITY (ID 17) ===

	states.event_allied_solidarity_place = {
		prompt(ctx) {
			let { game, res } = ctx
			let { units } = get_reinforcement_units(game)
			if (!units || units.length === 0) {
				res.prompt("盟军团结：所有增援已放置。")
				res.action("done")
				return
			}
			let unit = units[0]
			let options =
				Engine.events && typeof Engine.events.get_allied_solidarity_space_options === "function"
					? Engine.events.get_allied_solidarity_space_options(game, unit)
					: []
			let has_salonika_option = options.includes(SALONIKA)

			if (unit === "RU 2/4 Special") {
				res.prompt(
					`盟军团结：将 ${unit} 放置在巴尔干内任一协约国控制港口或滩头标记，包括利姆诺斯岛；也可放置至协约国控制的敖德萨。`
				)
			} else if (unit === "GR National Defense" && has_salonika_option) {
				res.prompt(
					`盟军团结：将 ${unit} 放置在巴尔干内任一协约国控制港口或滩头标记，包括利姆诺斯岛；也可放置至中立萨洛尼卡。`
				)
			} else {
				res.prompt(`盟军团结：将 ${unit} 放置在巴尔干内任一协约国控制港口或滩头标记，包括利姆诺斯岛。`)
			}

			for (let s of options) {
				res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let { units, source } = get_reinforcement_units(game)
			if (!units || units.length === 0) return
			let unit = units[0]
			let options =
				Engine.events && typeof Engine.events.get_allied_solidarity_space_options === "function"
					? Engine.events.get_allied_solidarity_space_options(game, unit)
					: []
			if (!options.includes(s)) return

			rules.push_undo() // 保存每个单位放置前的状态
			units.shift()
			rules.reinforce(game, unit, AP, s)

			if (unit === "GR National Defense" && s === SALONIKA && !rules.is_controlled_by(game, s, AP)) {
				rules.set_control(game, s, AP)
				if (!game.events) game.events = {}
				game.events["salonika_is_port"] = true
				rules.log("萨洛尼卡现在是协约国港口。")
			}

			if (units.length === 0) {
				if (source) delete source.reinf_to_place
				rules.goto_end_event()
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			let { source } = get_reinforcement_units(game)
			if (source) delete source.reinf_to_place
			rules.goto_end_event()
		}
	}

	// === EVENT: INVASION EVENTS (ID 22, 30, 34) ===

	states.event_kitcheners_invasion_choice = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("基钦纳入侵：选择一项：")
			if (can_start_invasion_event(game, rules) && get_available_beachhead_placement_spaces(game).length > 0) {
				res.action("invasion")
			}
			res.action("reinforcement")
		},
		invasion(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			mark_ap_invasion_event_used_this_turn(game)
			let event = get_active_event_data(game)
			if (event) {
				event.beachheads_to_place = 1
				event.reinf_to_place = ["BR IX Corps", "BR DIV #2", "BR DIV #3"]
				event.direct_to_beachhead = true
				event.allow_beachhead_reserve_box = false
			}
			game.state = "event_invasion_place_beachhead"
		},
		reinforcement(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			rules.log("基钦纳入侵：用作增援")
			let event = get_active_event_data(game)
			if (event) {
				event.reinf_to_place = ["BR IX Corps", "BR DIV #2", "BR DIV #3"]
				event.reinf_logic = "is_ap_invasion_rein"
				event.reinf_prompt_prefix = "基钦纳入侵（增援）"
			}
			game.state = "event_place_reinforcements"
		}
	}

	states.event_gallipoli_invasion_choice = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("加里波利入侵：选择一项：")
			if (can_start_invasion_event(game, rules)) {
				res.action("invasion")
			}
			res.action("reinforcement")
		},
		invasion(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			mark_ap_invasion_event_used_this_turn(game)
			let event = get_active_event_data(game)
			if (event) {
				event.reinf_to_place = ["BR VIII Corps", "ANZ ANZAC", "BR DIV #4", "FR DIV #1", "FR DIV #2"]
				event.flip_lcu_if_scu = true
				event.beachheads_to_place = 2
			}
			game.state = "event_invasion_place_units_island"
		},
		reinforcement(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			rules.log("加里波利入侵：用作增援")
			let event = get_active_event_data(game)
			if (event) {
				event.reinf_to_place = ["BR VIII Corps", "ANZ ANZAC", "BR DIV #4", "FR DIV #1", "FR DIV #2"]
				event.reinf_logic = "is_ap_invasion_rein"
				event.reinf_prompt_prefix = "加里波利入侵（增援）"
				let viii = rules.find_piece(AP, "BR VIII Corps")
				if (viii >= 0) rules.set_add(game.reduced, viii)
				let anzac = rules.find_piece(AP, "ANZ ANZAC")
				if (anzac >= 0) rules.set_add(game.reduced, anzac)
			}
			game.state = "event_place_reinforcements"
		}
	}

	states.event_salonika_invasion_choice = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("萨洛尼卡入侵：选择一项：")
			if (can_start_invasion_event(game, rules)) {
				res.action("invasion")
			}
			res.action("reinforcement")
		},
		invasion(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			mark_ap_invasion_event_used_this_turn(game)
			let event = get_active_event_data(game)
			if (event) {
				event.reinf_to_place = ["BR XVI Corps", "BR XII Corps", "FR DIV #3", "FR DIV #4"]
				event.allow_sr_to_island = 3
				event.beachheads_to_place = 1
			}
			game.state = "event_invasion_place_units_island"
		},
		reinforcement(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			rules.log("萨洛尼卡入侵：用作增援")
			let event = get_active_event_data(game)
			if (event) {
				event.reinf_to_place = ["BR XVI Corps", "BR XII Corps", "FR DIV #3", "FR DIV #4"]
				event.reinf_logic = "is_ap_invasion_rein"
				event.reinf_prompt_prefix = "萨洛尼卡入侵（增援）"
				let xii = rules.find_piece(AP, "BR XII Corps")
				if (xii >= 0) rules.set_add(game.reduced, xii)
			}
			game.state = "event_place_reinforcements"
		}
	}

	states.event_invasion_place_beachhead = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = get_active_event_data(game)
			let prompt_prefix = get_event_prompt_prefix(game, "海上入侵")
			let b = (event && event.beachheads_to_place) || 0
			if (b <= 0) {
				res.prompt(`${prompt_prefix}：滩头放置完毕。`)
				res.action("done")
				return
			}
			res.prompt(`${prompt_prefix}：放置一个滩头标记（剩余 ${b} 个）。`)
			for (let s of get_available_beachhead_placement_spaces(game)) {
				res.space(s)
			}
			if (!(event && event.allow_beachhead_reserve_box === false)) {
				res.action("skip", "暂时不放置（存入预备）")
			}
		},
		skip(ctx) {
			let { game, rules } = ctx
			let event = get_active_event_data(game)
			if (event && event.allow_beachhead_reserve_box === false) return
			let b = (event && event.beachheads_to_place) || 0
			if (b > 0) {
				rules.push_undo()
				Engine.events.add_ap_beachhead_reserve(game, b)
				if (event) event.beachheads_to_place = 0
				rules.log(`AP暂不放置 ${b} 个滩头标记。`)
			}
			this.done(ctx)
		},
		done(ctx) {
			let { game } = ctx
			let event = get_active_event_data(game)
			let direct_to_beachhead = event && event.direct_to_beachhead
			if (direct_to_beachhead) {
				game.state = "event_invasion_place_units_beachhead"
			} else {
				game.state = "event_invasion_place_units_island"
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = get_active_event_data(game)
			if (!Engine.map.can_ap_place_beachhead_marker(game, s)) return
			if (!is_allowed_event_beachhead_space(game, s)) return
			rules.push_undo()
			if (!game.beachheads) game.beachheads = []
			rules.set_add(game.beachheads, s)
			let b = (event && event.beachheads_to_place) || 0
			b--
			if (event) event.beachheads_to_place = b
			if (b <= 0) {
				let direct_to_beachhead = event && event.direct_to_beachhead
				if (direct_to_beachhead) {
					game.state = "event_invasion_place_units_beachhead"
				} else {
					game.state = "event_invasion_place_units_island"
				}
			}
			rules.log(`滩头放置在 ${rules.space_name(s)}。`)
			Engine.neutral.on_beachhead_placed(game, s, AP)
		}
	}

	states.event_invasion_place_units_beachhead = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let { units } = get_reinforcement_units(game)
			let prompt_prefix = get_event_prompt_prefix(game, "海上入侵")
			if (!units || units.length === 0) {
				rules.goto_end_event()
				return
			}
			let unit = units[0]
			res.prompt(`${prompt_prefix}：将 ${unit} 放置在任何滩头。`)
			let has_space = false
			for (let s of game.beachheads || []) {
				if (get_capacity(game, s) > 0) {
					res.space(s)
					has_space = true
				}
			}
			if (!has_space) {
				res.action("done")
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			let invasion = get_active_event_data(game)
			let { source } = get_reinforcement_units(game)
			if (source) delete source.reinf_to_place
			if (invasion) delete invasion.direct_to_beachhead
			rules.goto_end_event()
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			let invasion = get_active_event_data(game)
			let { units, source } = get_reinforcement_units(game)
			if (!units || units.length === 0) return
			let unit = units.shift()
			rules.reinforce(game, unit, AP, s)
			if (units.length === 0) {
				if (source) delete source.reinf_to_place
				if (invasion) delete invasion.direct_to_beachhead
				rules.goto_end_event()
			}
		}
	}

	states.event_invasion_place_units_island = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let invasion = get_active_event_data(game)
			let { units } = get_reinforcement_units(game)
			let prompt_prefix = get_event_prompt_prefix(game, "海上入侵")
			if (!units || units.length === 0) {
				res.prompt(`${prompt_prefix}：岛屿增援放置完毕。`)
				res.action("done")
				return
			}
			let unit = units[0]
			let island_base = invasion && invasion.invasion_island_base
			if (island_base) {
				res.prompt(`${prompt_prefix}：将 ${unit} 放置在 ${rules.space_name(island_base)}。`)
			} else {
				res.prompt(`${prompt_prefix}：为本次入侵选择一个协约国控制的岛屿基地，并将 ${unit} 放置于其上。`)
			}
			let spaces = island_base ? [island_base] : get_available_invasion_island_bases(game, rules)
			let has_space = false
			for (let s of spaces) {
				res.space(s)
				has_space = true
			}
			if (!has_space) {
				res.action("done")
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			let invasion = get_active_event_data(game)
			if (invasion && invasion.flip_lcu_if_scu) {
				enter_gallipoli_invasion_flip_or_finish(game, rules)
			} else if (((invasion && invasion.allow_sr_to_island) || 0) > 0) {
				game.state = "event_salonika_invasion_sr"
			} else {
				if (invasion) delete invasion.invasion_island_base
				rules.goto_end_event()
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			let invasion = get_active_event_data(game)
			let { units, source } = get_reinforcement_units(game)
			if (!units || units.length === 0) return
			if (invasion && !invasion.invasion_island_base) {
				invasion.invasion_island_base = s
			}
			let island_base = invasion && invasion.invasion_island_base
			if (island_base && s !== island_base) return
			let unit = units.shift()

			if (unit === "BR VIII Corps" || unit === "ANZ ANZAC" || unit === "BR XII Corps") {
				rules.reinforce(game, unit, AP, island_base || s)
				let p = rules.find_piece(AP, unit)
				if (p >= 0 && !rules.set_has(game.reduced, p)) {
					rules.set_add(game.reduced, p)
				}
			} else {
				rules.reinforce(game, unit, AP, island_base || s)
			}

			if (units.length === 0) {
				if (source) delete source.reinf_to_place
				if (invasion && invasion.flip_lcu_if_scu) {
					enter_gallipoli_invasion_flip_or_finish(game, rules)
				} else if (((invasion && invasion.allow_sr_to_island) || 0) > 0) {
					game.state = "event_salonika_invasion_sr"
				} else {
					if (invasion) delete invasion.invasion_island_base
					rules.goto_end_event()
				}
			}
		}
	}

	states.event_gallipoli_invasion_flip = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let invasion = get_active_event_data(game)
			let island_base = invasion && invasion.invasion_island_base
			if (!island_base) {
				res.prompt("加里波利入侵：未确定岛屿基地。")
				res.action("done")
				return
			}

			let pending_lcus = get_gallipoli_invasion_lcus(game, rules).filter((p) =>
				Engine.game_utils.is_piece_reduced(game, p)
			)
			if (pending_lcus.length === 0) {
				res.prompt("加里波利入侵：完成。")
				res.action("done")
				return
			}

			let scu_candidates = []
			for (let p = 1; p < data.pieces.length; p++) {
				if (can_gallipoli_scu_sr_to_reserve(game, rules, p)) scu_candidates.push(p)
			}

			if (scu_candidates.length > 0) {
				res.prompt(
					`加里波利入侵：将对应 SCU 战略调整 至 预备军格 以使 ${rules.space_name(island_base)} 上对应的LCU翻正。`
				)
				for (let p of scu_candidates) res.piece(p)
			} else {
				res.prompt("加里波利入侵：当前没有合法的对应 SCU。")
			}
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			let target_lcu = get_gallipoli_target_lcu_for_scu(game, rules, p)
			if (target_lcu < 0) return
			if (!can_gallipoli_scu_sr_to_reserve(game, rules, p)) return

			rules.push_undo()
			if (!rules.is_in_reserve(game, p)) {
				if (!game.sr_moved) game.sr_moved = []
				rules.set_add(game.sr_moved, p)
				Engine.map.apply_sr_control_effects(game, p, game.pieces[p], rules.get_reserve_box(AP), AP)
				game.pieces[p] = rules.get_reserve_box(AP)
				rules.log(`${rules.piece_name(p)} 战略调整回预备军格。`)
			}
			rules.set_delete(game.reduced, target_lcu)
			rules.log(`${rules.piece_name(target_lcu)} 翻面。`)
		},
		done(ctx) {
			let { game, rules } = ctx
			auto_flip_gallipoli_lcus_with_reserve_scus(game, rules)
			finish_gallipoli_invasion(game, rules)
		}
	}

	states.event_salonika_invasion_sr = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let invasion = get_active_event_data(game)
			let sr_count = (invasion && invasion.allow_sr_to_island) || 0
			let island_base = invasion && invasion.invasion_island_base
			if (!island_base) {
				res.prompt("萨洛尼卡入侵：未确定岛屿基地。")
				res.action("done")
				return
			}
			res.prompt(
				`萨洛尼卡入侵：你可以将最多 ${sr_count} 个英国/印度/澳新 SCU 战略调整至 ${rules.space_name(island_base)}。`
			)
			for (let p = 0; p < data.pieces.length; p++) {
				if (can_salonika_invasion_sr_piece(game, rules, p, island_base)) res.piece(p)
			}
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			let invasion = get_active_event_data(game)
			let island_base = invasion && invasion.invasion_island_base
			if (!island_base) return
			if (!can_salonika_invasion_sr_piece(game, rules, p, island_base)) return
			rules.push_undo()
			if (!game.sr_moved) game.sr_moved = []
			rules.set_add(game.sr_moved, p)
			Engine.map.apply_sr_control_effects(game, p, game.pieces[p], island_base, AP)
			game.pieces[p] = island_base
			rules.log(`${rules.piece_name(p)} 战略调整至 ${rules.space_name(island_base)}.`)
			let sr_count = (invasion && invasion.allow_sr_to_island) || 0
			sr_count--
			if (invasion) invasion.allow_sr_to_island = sr_count
			if (sr_count <= 0) {
				finish_salonika_invasion(game, rules)
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			finish_salonika_invasion(game, rules)
		}
	}

	// === EVENT: GRAND DUKE TO TIFLIS (ID 23) ===

	states.event_grand_duke_to_tiflis_select_port = {
		prompt(ctx) {
			let { res, rules, game } = ctx
			res.prompt("尼古拉大公抵达第比利斯 ：选择一个里海港口放置增援。")
			for (let s of get_grand_duke_to_tiflis_ports(game, rules)) {
				res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			rules.push_undo()
			event.event_port = s
			rules.log(`尼古拉大公抵达第比利斯：协约国选择 ${rules.space_name(s)} 作为增援港口。`)

			rules.reinforce(game, "RU DIV #14", AP, s)
			rules.reinforce(game, "RU Cavalry #8", AP, s)
			rules.reinforce(game, "RU Baratov HQ", AP, s)

			let pieces = rules.get_pieces_in_space(game, s)
			let cp_units = pieces.filter((p) => data.pieces[p].faction === CP)

			if (cp_units.length > 0) {
				game.grand_duke_to_tiflis_retreat_pieces = cp_units
				event.cp_retreat_steps = {}
				game.selected_piece = null
				game.active = CP
				game.state = "event_grand_duke_to_tiflis_cp_retreat"
			} else {
				game.state = "event_grand_duke_to_tiflis_sr"
			}
		}
	}

	states.event_grand_duke_to_tiflis_cp_retreat = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			let retreating = game.grand_duke_to_tiflis_retreat_pieces || []
			if (retreating.length === 0) {
				res.prompt("尼古拉大公抵达第比利斯 ：同盟国后撤完成。")
				res.action("done")
				return
			}

			if (game.selected_piece === null || game.selected_piece === undefined) {
				res.prompt(`尼古拉大公抵达第比利斯 ：选择从 ${rules.space_name(event.event_port)} 后撤的同盟国单位。`)
				for (let p of retreating) {
					res.piece(p)
				}
				return
			}

			let piece = game.selected_piece
			let steps_taken = event.cp_retreat_steps?.[piece] || 0
			let valid = get_grand_duke_to_tiflis_retreat_options(game, piece, event.event_port)

			res.prompt(
				`尼古拉大公抵达第比利斯 ：${rules.piece_name(piece)} 必须从 ${rules.space_name(event.event_port)} 向后撤退 1-2 格 (${steps_taken}/2)。`
			)
			if (valid.length > 0) {
				for (let s of valid) {
					res.space(s)
				}
			}
			if (steps_taken >= 1) {
				res.action("finish_piece")
			}
			if (valid.length === 0 && steps_taken === 0) {
				res.action("cannot_retreat")
			}
			if (valid.length === 0 && steps_taken >= 1) {
				res.action("finish_piece")
			}
			res.piece(piece)
		},
		piece(ctx) {
			let { game, arg: p } = ctx
			if (game.selected_piece === p) {
				game.selected_piece = null
			} else if ((game.grand_duke_to_tiflis_retreat_pieces || []).includes(p)) {
				game.selected_piece = p
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			let piece = game.selected_piece
			if (piece === null || piece === undefined) return

			rules.push_undo()
			game.pieces[piece] = s
			if (!event.cp_retreat_steps) {
				event.cp_retreat_steps = {}
			}
			event.cp_retreat_steps[piece] = (event.cp_retreat_steps[piece] || 0) + 1
			rules.log(
				`${rules.piece_name(piece)} retreats to ${rules.space_name(s)} (away from ${rules.space_name(event.event_port)}).`
			)

			let steps_taken = event.cp_retreat_steps[piece]
			let more_options = get_grand_duke_to_tiflis_retreat_options(game, piece, event.event_port)
			if (steps_taken >= 2 || more_options.length === 0) {
				finish_grand_duke_to_tiflis_cp_piece_retreat(game, rules, event, piece)
				if ((game.grand_duke_to_tiflis_retreat_pieces || []).length === 0) {
					finish_grand_duke_to_tiflis_cp_retreat(game, event)
				}
			}
		},
		finish_piece(ctx) {
			let { game, rules } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			let piece = game.selected_piece
			if (piece === null || piece === undefined) return

			let steps_taken = event.cp_retreat_steps?.[piece] || 0
			if (steps_taken <= 0) return
			rules.push_undo()
			finish_grand_duke_to_tiflis_cp_piece_retreat(game, rules, event, piece)
			if ((game.grand_duke_to_tiflis_retreat_pieces || []).length === 0) {
				finish_grand_duke_to_tiflis_cp_retreat(game, event)
			}
		},
		cannot_retreat(ctx) {
			let { game, rules } = ctx
			let piece = game.selected_piece
			if (piece === null || piece === undefined) return

			rules.push_undo()
			rules.log(
				`${rules.piece_name(piece)} 无法从 ${rules.space_name(use_event(game, "grand_duke_to_tiflis").event_port)} 向后撤退并被消灭。`
			)
			Engine.game_utils.eliminate_piece(game, piece, rules.log)
			set_delete(game.grand_duke_to_tiflis_retreat_pieces, piece)
			let event = use_event(game, "grand_duke_to_tiflis")
			if (event.cp_retreat_steps) {
				delete event.cp_retreat_steps[piece]
			}
			game.selected_piece = null
			if ((game.grand_duke_to_tiflis_retreat_pieces || []).length === 0) {
				finish_grand_duke_to_tiflis_cp_retreat(game, event)
			}
		},
		done(ctx) {
			let { game } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			finish_grand_duke_to_tiflis_cp_retreat(game, event)
		}
	}

	states.event_grand_duke_to_tiflis_sr = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			res.prompt(
				"尼古拉大公抵达第比利斯 ：可选操作，将 1 个俄国骑兵师战略调整至 " + rules.space_name(event.event_port)
			)
			if (get_capacity(game, event.event_port) > 0) {
				for (let p = 0; p < game.pieces.length; p++) {
					let info = data.pieces[p]
					if (info && info.faction === AP && info.name.includes("RU Cavalry") && info.piece_class === "SCU") {
						if (
							game.pieces[p] !== event.event_port &&
							game.pieces[p] > 0 &&
							Engine.map.can_sr_to_space(game, p, event.event_port, AP)
						) {
							res.piece(p)
						}
					}
				}
			}
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			if (!event || !Engine.map.can_sr_to_space(game, p, event.event_port, AP)) return
			rules.push_undo()
			if (!game.sr_moved) game.sr_moved = []
			set_add(game.sr_moved, p)
			Engine.map.apply_sr_control_effects(game, p, game.pieces[p], event.event_port, AP)
			game.pieces[p] = event.event_port
			rules.log(`${rules.piece_name(p)} 战略调整至 ${rules.space_name(event.event_port)}`)
			game.state = "event_grand_duke_to_tiflis_place_cordons"
		},
		done(ctx) {
			let { game } = ctx
			game.state = "event_grand_duke_to_tiflis_place_cordons"
		}
	}

	states.event_grand_duke_to_tiflis_place_cordons = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			if (!event.placed_ru_police) {
				res.prompt("尼古拉大公抵达第比利斯 ：将俄国北波斯军警队放置在阿塞拜疆的空置地区。")
				for (let s of get_grand_duke_to_tiflis_vacant_azerbaijan_spaces(game, rules)) {
					res.space(s)
				}
			} else {
				let count = event.br_cordons_to_place || 3
				res.prompt(`尼古拉大公抵达第比利斯 ：在任意波斯大区内放置${count} 个英国波斯宪兵师。`)
				for (let s = 1; s < data.spaces.length; s++) {
					if (Engine.map.is_persian_region(s)) {
						res.space(s)
					}
				}
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "grand_duke_to_tiflis")
			rules.push_undo()
			if (!event.placed_ru_police) {
				rules.reinforce(game, "RU/PE Police North", AP, s)
				event.placed_ru_police = true
				event.br_cordons_to_place = 3
			} else {
				let names = ["BR Persian Cordon #1", "BR Persian Cordon #2", "BR Persian Cordon #3"]
				let index = 3 - event.br_cordons_to_place
				rules.reinforce(game, names[index], AP, s)
				event.br_cordons_to_place--
				if (event.br_cordons_to_place === 0) {
					delete event.event_port
					delete event.placed_ru_police
					delete event.br_cordons_to_place
					delete game.event_next_state
					rules.goto_end_operations()
				}
			}
		}
	}

	// === EVENT: FRESH RECRUITS (ID 57) ===

	states.event_fresh_recruits = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let spent = game.fresh_recruits_spent || 0
			let remaining = Number(game.fresh_recruits_bonus_tu || 0) - spent
			res.prompt(`新兵征募: 剩余 ${remaining} 土耳其补员点数`)

			if (remaining > 0) {
				for (let p = 0; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (info.faction !== CP) continue
					if (info.nation !== "tu" && info.nation !== "tua") continue
					if (info.symbol === "dot") continue
					if (info.notreplaceable) continue
					if (rules.is_replacement_capital_restricted(game, info.nation)) continue

					let cost = rules.get_replacement_cost(game, p)
					if (cost > 0 && cost <= remaining) {
						if (rules.is_eliminated(game, p)) {
							if (info.symbol === "triangle") continue
							let valid_spaces = rules.get_valid_rebuild_spaces(game, p, CP)
							if (valid_spaces.length > 0) {
								res.piece(p)
							}
						} else if (rules.set_has(game.reduced, p)) {
							let s = game.pieces[p]
							if (s === RESERVE || rules.is_in_supply(game, s, CP, p)) {
								res.piece(p)
							}
						}
					}
				}
			}

			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			let cost = rules.get_replacement_cost(game, p)
			if (!game.fresh_recruits_spent) game.fresh_recruits_spent = 0
			game.fresh_recruits_spent += cost

			if (rules.is_eliminated(game, p)) {
				game.state = "event_fresh_recruits_rebuild"
				game.rebuild_piece = p
			} else {
				rules.set_delete(game.reduced, p)
				rules.log(`${rules.piece_name(p)} (${rules.space_name(game.pieces[p])}) 补员至满员状态。`)
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			delete game.fresh_recruits_spent
			delete game.fresh_recruits_bonus_tu
			delete game.fresh_recruits_pieces
			rules.goto_end_action()
		}
	}

	states.event_fresh_recruits_rebuild = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let p = game.rebuild_piece
			res.who(p)
			res.prompt(`重建 ${rules.piece_name(p)}: 选择一个有效的空格。`)
			let spaces = rules.get_valid_rebuild_spaces(game, p, CP)
			for (let s of spaces) {
				res.space(s)
			}
			res.action("cancel")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let p = game.rebuild_piece
			game.pieces[p] = s
			rules.set_add(game.reduced, p)
			rules.log(`${rules.piece_name(p)} 在 ${rules.space_name(s)} 重建。`)
			game.rebuild_piece = null
			game.state = "event_fresh_recruits"
		},
		cancel(ctx) {
			let { rules } = ctx
			rules.pop_undo()
		}
	}

	// === COMBAT CARD: CZAR'S ARMORIES (ID 97) ===

	const CZARS_ARMORIES_AREAS = new Set(["caucasus", "russia", "azerbaijan"])

	function get_czars_armories_context(game) {
		if (!game.czars_armories_rp || typeof game.czars_armories_rp !== "object") {
			game.czars_armories_rp = { bonus: 4, spent: 0, return_state: "post_advance_cc_cp" }
		}
		return game.czars_armories_rp
	}

	function get_czars_armories_remaining(game) {
		let context = get_czars_armories_context(game)
		return Number(context.bonus || 0) - Number(context.spent || 0)
	}

	function is_czars_armories_space(s) {
		let space = data.spaces[s]
		return !!(space && CZARS_ARMORIES_AREAS.has(space.area))
	}

	function is_czars_armories_turkish_unit(info) {
		return !!(info && info.faction === CP && (info.nation === "tu" || info.nation === "tua"))
	}

	function get_czars_armories_rebuild_spaces(game, p, rules) {
		return rules.get_valid_rebuild_spaces(game, p, CP).filter(is_czars_armories_space)
	}

	function is_czars_armories_piece_eligible(game, p, rules) {
		let info = data.pieces[p]
		if (!is_czars_armories_turkish_unit(info)) return false
		let cost = rules.get_replacement_cost(game, p)
		if (cost <= 0 || cost > get_czars_armories_remaining(game)) return false

		if (rules.is_eliminated(game, p)) {
			return info.piece_class === "LCU" && get_czars_armories_rebuild_spaces(game, p, rules).length > 0
		}

		let s = game.pieces[p]
		return rules.set_has(game.reduced, p) && is_czars_armories_space(s)
	}

	function finish_czars_armories(game) {
		let return_state = game.czars_armories_rp?.return_state || "post_advance_cc_cp"
		delete game.czars_armories_rp
		delete game.rebuild_piece
		game.active = CP
		game.state = return_state
	}

	states.event_czars_armories = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let remaining = get_czars_armories_remaining(game)
			res.prompt(`缴获沙皇军火: 剩余 ${remaining} 土耳其补员点数`)

			if (remaining > 0) {
				for (let p = 0; p < data.pieces.length; p++) {
					if (is_czars_armories_piece_eligible(game, p, rules)) res.piece(p)
				}
			}

			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg } = ctx
			let p = Number(arg)
			if (!Number.isInteger(p) || !is_czars_armories_piece_eligible(game, p, rules)) return
			let cost = rules.get_replacement_cost(game, p)
			rules.push_undo()
			let context = get_czars_armories_context(game)
			context.spent = Number(context.spent || 0) + cost

			if (rules.is_eliminated(game, p)) {
				game.rebuild_piece = p
				game.state = "event_czars_armories_rebuild"
			} else {
				rules.set_delete(game.reduced, p)
				rules.log(`${rules.piece_name(p)} (${rules.space_name(game.pieces[p])}) 由缴获沙皇军火补员至满员状态。`)
			}
		},
		done(ctx) {
			finish_czars_armories(ctx.game)
		}
	}

	states.event_czars_armories_rebuild = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let p = game.rebuild_piece
			res.who(p)
			res.prompt(`缴获沙皇军火: 选择 ${rules.piece_name(p)} 的重建位置。`)
			for (let s of get_czars_armories_rebuild_spaces(game, p, rules)) res.space(s)
			res.action("cancel")
		},
		space(ctx) {
			let { game, rules, arg } = ctx
			let s = Number(arg)
			let p = game.rebuild_piece
			if (!Number.isInteger(p) || !get_czars_armories_rebuild_spaces(game, p, rules).includes(s)) return
			game.pieces[p] = s
			rules.set_add(game.reduced, p)
			rules.log(`${rules.piece_name(p)} 在 ${rules.space_name(s)} 由缴获沙皇军火重建。`)
			delete game.rebuild_piece
			game.state = "event_czars_armories"
		},
		cancel(ctx) {
			ctx.rules.pop_undo()
		}
	}

	// === EVENT: RESERVES TO THE FRONT (ID 59) ===

	function get_reserves_to_front_rebuild_space(game, p) {
		if (!game.attack || !(game.attack.space > 0)) return null
		let recorded = game.attack.reserves_to_front_rebuild_space_by_piece?.[p]
		if (recorded > 0) return recorded
		let origin = game.attack.origin_by_piece?.[p]
		if (origin > 0) return origin
		return game.attack.space
	}

	states.event_reserves_to_front = {
		prompt(ctx) {
			let { game, res } = ctx
			let spent = game.reserves_to_front_spent || 0
			let remaining = 2 - spent
			res.prompt(`前线预备役: 剩余 ${remaining} 土耳其补员点数`)

			if (remaining > 0) {
				for (let p of game.reserves_to_front_pieces || []) {
					let cost = Engine.combat_cards.get_reserves_to_front_piece_cost(game, p)
					if (cost > 0 && cost <= remaining) {
						res.piece(p)
					}
				}
			}

			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!Array.isArray(game.reserves_to_front_pieces) || !game.reserves_to_front_pieces.includes(p)) return
			let spent = game.reserves_to_front_spent || 0
			let remaining = 2 - spent
			if (remaining <= 0) return
			let cost = Engine.combat_cards.get_reserves_to_front_piece_cost(game, p)
			if (cost <= 0 || cost > remaining) return
			let is_elim_or_removed_exception =
				rules.is_eliminated(game, p) || Engine.combat_cards.is_reserves_to_front_removed_exception(game, p)
			let rebuild_space = is_elim_or_removed_exception ? get_reserves_to_front_rebuild_space(game, p) : null
			// 战斗后原地重建：进攻方回到记录的出发格，防守方回到战斗格。
			if (is_elim_or_removed_exception && !rebuild_space) return

			rules.push_undo()
			rules.spend_replacement_points(game, p, cost, true)
			if (!game.reserves_to_front_spent) game.reserves_to_front_spent = 0
			game.reserves_to_front_spent += cost

			if (game.attack && game.attack.attacker === CP) {
				if (!game.reserves_to_front_effected_pieces) game.reserves_to_front_effected_pieces = []
				rules.set_add(game.reserves_to_front_effected_pieces, p)
				if (!Array.isArray(game.attacked)) game.attacked = []
				rules.set_add(game.attacked, p)
				delete game.attack_eligibility_cache
			}

			if (is_elim_or_removed_exception) {
				game.pieces[p] = rebuild_space
				rules.set_add(game.reduced, p)
				rules.log(`>> ${rules.piece_name(p)} 在 ${rules.space_name(rebuild_space)} 重建`)
			} else {
				rules.set_delete(game.reduced, p)
				rules.log(`>> ${rules.piece_name(p)} 补员至满员状态`)
			}
		},
		done(ctx) {
			let { game } = ctx
			let leftover = 2 - (game.reserves_to_front_spent || 0)
			if (leftover > 0) {
				game.rp_cp.tu -= leftover
			}
			Engine.combat.refresh_post_battle_defender_retreat(game)
			delete game.reserves_to_front_spent
			delete game.reserves_to_front_pieces
			
			if (game.post_battle_cc_resume) {
				game.state = "post_battle_cc_cp"
			} else {
				Engine.states_combat.continue_after_post_battle_cc()
			}
		}
	}

	// === EVENT: GOEBEN (ID 62) ===

	states.event_goeben = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("戈本号：炮击巴统（Batum）。")
			res.action("bombard")
		},
		bombard(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			let roll = rules.roll_die(6, game)
			rules.log(`戈本号炮击掷骰：${roll}`)
			let success = false
			if (roll % 2 !== 0) {
				// 奇数时摧毁要塞
				success = true
				if (!game.forts) game.forts = { destroyed: [], besieged: [] }
				if (!game.forts.destroyed) game.forts.destroyed = []
				// Batum
				set_add(game.forts.destroyed, BATUM)
				rules.log("戈本号炮击摧毁巴统要塞！")
			} else {
				rules.log("戈本号炮击未能摧毁巴统要塞。")
			}
			game.goeben_result = { roll, success }
			game.state = "event_goeben_result"
		}
	}

	states.event_goeben_result = {
		prompt(ctx) {
			let { game, res } = ctx
			let { roll, success } = game.goeben_result
			let msg = `掷骰：(${roll})，`
			if (success) {
				msg += "炮击成功，巴统被摧毁。"
			} else {
				msg += "炮击失败。"
			}
			res.prompt(msg)
			res.action("done")
		},
		done(ctx) {
			let { game, rules } = ctx
			delete game.goeben_result
			rules.goto_end_event()
		}
	}

	// === EVENT: GERMAN MILITARY ADVISERS (ID 63) ===

	states.event_german_military_advisers_trench = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event_data = use_event(game, "german_military_advisers")
			let count = event_data.trenches_to_place || 0
			res.prompt(`德国军事顾问：在安纳托利亚或加里波利放置${count}个 1 级战壕。`)

			for (let s = 1; s < data.spaces.length; s++) {
				let area = rules.get_area(s)
				if (area === "anatolia" || area === "gallipoli") {
					// 只能在尚未有战壕、同盟国控制且不是岛屿基地、滩头或潜在登陆点 (beach_for) 的空间放置
					let is_empty_trench = rules.has_trench(game, s) === 0
					let is_controlled = rules.is_controlled_by(game, s, CP)
					let is_beachhead = rules.is_beachhead_space(game, s) || !!data.spaces[s].beach_for
					let is_valid_type = !rules.is_island_base(game, s) && !is_beachhead

					if (is_empty_trench && is_controlled && is_valid_type) {
						res.space(s)
					}
				}
			}

			res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event_data = use_event(game, "german_military_advisers")
			rules.push_undo()
			rules.place_trench(game, s, CP)
			rules.log(`德国军事顾问：在 ${rules.space_name(s)} 放置 1 级战壕。`)
			event_data.trenches_to_place -= 1
			if (event_data.trenches_to_place <= 0) {
				rules.goto_end_event()
			}
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	// === EVENT: GERMAN INTRIGUES IN PERSIA (ID 78) ===

	states.event_armenian_uprising_unit = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "armenian_uprising_32")
			let unit_name = event.unit_name || "Armenian Uprising"
			let options = get_armenian_uprising_unit_spaces(game, event)
			res.prompt(`亚美尼亚起义：选择一个蓝色 A 地区放置 ${unit_name}。`)
			for (let s of options) {
				if (s > 0 && data.spaces[s]) res.space(s)
			}
			if (options.length === 0) res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "armenian_uprising_32")
			let options = get_armenian_uprising_unit_spaces(game, event)
			if (!options.includes(s)) return
			rules.push_undo()
			rules.reinforce(game, event.unit_name || "Armenian Uprising", AP, s)
			if (!Array.isArray(event.marker_spaces)) event.marker_spaces = []
			game.armenian_uprising_markers = event.marker_spaces.slice()
			if ((event.markers_to_place || 0) <= 0) {
				delete event.markers_to_place
				delete event.marker_spaces
				rules.goto_end_event()
				return
			}
			game.state = "event_armenian_uprising_markers"
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_armenian_uprising_markers = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "armenian_uprising_32")
			let remaining = Math.max(0, event.markers_to_place || 0)
			if (remaining <= 0) {
				ctx.rules.goto_end_event()
				return
			}
			let options = Array.isArray(event.blue_a_spaces) ? event.blue_a_spaces : []
			let chosen = new Set(Array.isArray(event.marker_spaces) ? event.marker_spaces : [])
			res.prompt(`亚美尼亚起义：选择 ${remaining} 个蓝色 A 地区放置起义标记。`)
			let found = false
			for (let s of options) {
				if (!(s > 0 && data.spaces[s]) || chosen.has(s)) continue
				res.space(s)
				found = true
			}
			if (!found) res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "armenian_uprising_32")
			let options = Array.isArray(event.blue_a_spaces) ? event.blue_a_spaces : []
			if (!options.includes(s)) return
			if (!Array.isArray(event.marker_spaces)) event.marker_spaces = []
			if (event.marker_spaces.includes(s)) return
			rules.push_undo()
			event.marker_spaces.push(s)
			event.markers_to_place = Math.max(0, (event.markers_to_place || 0) - 1)
			game.armenian_uprising_markers = event.marker_spaces.slice()
			if (event.markers_to_place <= 0) {
				delete event.markers_to_place
				delete event.marker_spaces
				rules.goto_end_event()
			}
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_german_intrigues_persia_unit = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "german_intrigues_persia")
			let unit_name = event.unit_name || "PE Uprising"
			let options = Array.isArray(event.unit_spaces) ? event.unit_spaces : []
			res.prompt(`德国的波斯密谋：将 ${unit_name} 放置在任意空置或同盟国控制的中立波斯地区。`)
			for (let s of options) {
				if (s > 0 && data.spaces[s]) res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "german_intrigues_persia")
			let options = Array.isArray(event.unit_spaces) ? event.unit_spaces : []
			if (!options.includes(s)) return
			rules.push_undo()
			rules.reinforce(game, event.unit_name || "PE Uprising", CP, s)
			delete event.unit_spaces
			set_event_state_after_interrupt(game, "event_german_intrigues_persia_markers")
		}
	}

	states.event_german_intrigues_persia_markers = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "german_intrigues_persia")
			let remaining = Math.max(0, event.markers_to_place || 0)
			if (remaining <= 0) {
				ctx.rules.goto_end_event()
				return
			}
			let chosen = new Set(Array.isArray(event.marker_spaces) ? event.marker_spaces : [])
			res.prompt(`德国的波斯密谋：选择 ${remaining} 个中立波斯地区放置波斯起义标记。`)
			for (let s = 1; s < data.spaces.length; s++) {
				if (!Engine.map.is_neutral_persia_space(s) || chosen.has(s)) continue
				res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "german_intrigues_persia")
			if (!Engine.map.is_neutral_persia_space(s)) return
			if (!Array.isArray(event.marker_spaces)) event.marker_spaces = []
			if (event.marker_spaces.includes(s)) return
			rules.push_undo()
			event.marker_spaces.push(s)
			event.markers_to_place = Math.max(0, (event.markers_to_place || 0) - 1)
			game.persian_uprising_markers = event.marker_spaces.slice()
			if (event.markers_to_place <= 0) {
				delete event.markers_to_place
				delete event.marker_spaces
				rules.goto_end_event()
			}
		}
	}

	// === EVENT: PERSIAN PUSH (ID 65) ===

	states.event_persian_push_place = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = use_event(game, "persian_push")
			if (!event.reinf_to_place) event.reinf_to_place = ["TU-A DIV #10"]
			if (event.reinf_to_place.length === 0) {
				res.prompt("波斯攻势：增援放置完毕。")
				res.action("done")
				return
			}
			let unit = event.reinf_to_place[0]
			res.prompt(`波斯攻势：将 ${unit} 放置在任何同盟国控制的美索不达米亚地区。`)
			let has_option = false
			for (let s = 1; s < data.spaces.length; s++) {
				if (rules.is_mesopotamia(s) && rules.is_controlled_by(game, s, CP) && get_capacity(game, s) > 0) {
					res.space(s)
					has_option = true
				}
			}
			if (!has_option) {
				res.prompt(`波斯攻势：美索不达米亚无可放置位置，将 ${unit} 放入预备军。`)
				res.space(rules.get_reserve_box(CP))
			}
		},
		done(ctx) {
			let { game } = ctx
			game.state = "event_persian_push_move"
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = use_event(game, "persian_push")
			if (!event.reinf_to_place) event.reinf_to_place = ["TU-A DIV #10"]
			if (!event.reinf_to_place || event.reinf_to_place.length === 0) {
				game.state = "event_persian_push_move"
				return
			}
			rules.push_undo()
			let unit = event.reinf_to_place.shift()
			rules.reinforce(game, unit, CP, s)
			if (event.reinf_to_place.length === 0) {
				delete event.reinf_to_place
				game.state = "event_persian_push_move"
			}
		}
	}

	states.event_persian_push_move = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("波斯攻势：你可以立即激活高加索、阿塞拜疆或美索不达米亚的一个地块进行移动。")
			let has_option = false
			for (let s = 1; s < data.spaces.length; s++) {
				if (rules.is_caucasus(s) || rules.is_azerbaijan(s) || rules.is_mesopotamia(s)) {
					let pieces = rules.get_pieces_in_space(game, s).filter((p) => data.pieces[p].faction === CP)
					if (pieces.length > 0) {
						res.space(s)
						has_option = true
					}
				}
			}
			if (!has_option) res.action("done")
			res.action("skip")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			game.activated = { move: [s], attack: [] }
			game.activation_cost = {}
			game.moved = []
			game.attacked = []
			game.attacked_spaces = []
			game.move_from_event = true
			game.state = "choose_move_space"
		},
		skip(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	// === EVENT: LIBERATE SUEZ (ID 67) ===

	/**
	 * 检查 67 号事件 (解放苏伊士) 的 OP 分配是否合法。
	 * 必须至少分配 2 OP 在埃及地区进行进攻激活。
	 */
	function check_liberate_suez_ops(game, log_fn) {
		if (!game.liberate_suez_op_required) return true
		let need_ops = game.liberate_suez_min_egypt_attack_ops || 2
		let used_ops = get_liberate_suez_egypt_activated_attack_ops(game)
		if (used_ops >= need_ops) return true
		if (log_fn)
			log_fn(`解放苏伊士：必须在埃及地区分配至少 ${need_ops} OP 进行进攻激活。当前仅分配 ${used_ops} OP。`)
		return false
	}

	function get_liberate_suez_egypt_activated_attack_ops(game) {
		let total = 0
		if (!game || !game.activated || !Array.isArray(game.activated.attack)) return total
		for (let s of game.activated.attack) {
			if (!Engine.map.is_egypt(s)) continue
			let cost = game.activation_cost && game.activation_cost[s] !== undefined ? game.activation_cost[s] : 0
			total += cost
		}
		// Also count OPs from spaces activated for Egypt-only attack (e.g. Sinai → Egypt)
		if (Array.isArray(game.activated.attack_egypt)) {
			for (let s of game.activated.attack_egypt) {
				let cost = game.activation_cost && game.activation_cost[s] !== undefined ? game.activation_cost[s] : 0
				total += cost
			}
		}
		return total
	}

	function remember_liberate_suez_required_attack_spaces(game) {
		let spaces = []
		if (!game || !game.activated) return spaces
		if (Array.isArray(game.activated.attack)) {
			for (let s of game.activated.attack) {
				if (Engine.map.is_egypt(s)) set_add(spaces, s)
			}
		}
		if (Array.isArray(game.activated.attack_egypt)) {
			for (let s of game.activated.attack_egypt) set_add(spaces, s)
		}
		game.liberate_suez_required_attack_spaces = spaces
		return spaces
	}

	states.event_liberate_suez_check_ops = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			if (check_liberate_suez_ops(game, (msg) => res.log(msg))) {
				delete game.liberate_suez_op_required
				game.liberate_suez_egypt_attack_activation_valid = true
				remember_liberate_suez_required_attack_spaces(game)
				// 2OP Egypt-attack requirement satisfied; merge Egypt-only attacks
				// into normal attacks for eligibility while keeping attack_egypt
				// so target selection remains limited to Egypt.
				if (Array.isArray(game.activated.attack_egypt) && game.activated.attack_egypt.length > 0) {
					for (let s of game.activated.attack_egypt) {
						set_add(game.activated.attack, s)
					}
				}
				if (game.activated.move.length > 0) {
					game.state = "choose_move_space"
				} else {
					if (rules && rules.refresh_attack_eligibility) {
						rules.refresh_attack_eligibility()
					}
					if (game.eligible_attackers && game.eligible_attackers.length > 0) {
						game.state = "attack"
					} else {
						game.state = "end_operations"
					}
				}
			} else {
				res.prompt("解放苏伊士：OP 分配不满足要求，请重新分配。")
				res.action("re-activate")
			}
		},
		"re-activate"(ctx) {
			let { game } = ctx
			game.state = "activate_spaces"
		}
	}

	// === EVENT: TURKISH REINFORCEMENTS (ID 81) ===

	states.event_turkish_reinf_81_combine = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "turkish_reinf_81")
			if (event.combine_used) {
				res.prompt("土耳其增援：已完成本次事件赠送的 1 次 LCU 组合。")
				res.action("done")
				return
			}
			res.prompt("土耳其增援：你可以立即对此次增援的单位进行 LCU 组合，请选择地点进行 LCU 组合。")

			// 找出此次增援新加入的 LCU ID
			let new_lcu_names = ["TU XIV Corps", "TU XV Corps", "TU XVI Corps", "TU XVII Corps", "TU-A XVIII Corps"]

			let new_lcus = new_lcu_names.map((name) => find_piece(CP, name)).filter((id) => id >= 0)

			// 允许用任意符合正常规则的土耳其/TU-A SCU，立即组织本次加入的一个 Corps。
			let possible_spaces = []
			for (let s = 1; s < data.spaces.length; s++) {
				if (Engine.game_utils.can_combine_in_space(game, s, CP, new_lcus)) {
					possible_spaces.push(s)
				}
			}

			for (let s of possible_spaces) {
				res.space(s)
			}

			res.action("done")
		},
		space(ctx) {
			this.combine(ctx)
		},
		combine(ctx) {
			let { game, rules, arg: s } = ctx
			if (!s) return
			rules.push_undo()
			game.where = s
			game.move_from_event = true
			game.event_next_state = "event_turkish_reinf_81_combine"

			// 为通用组合状态设置限制参数
			let new_lcu_names = ["TU XIV Corps", "TU XV Corps", "TU XVI Corps", "TU XVII Corps", "TU-A XVIII Corps"]
			let new_lcus = new_lcu_names.map((name) => find_piece(CP, name)).filter((id) => id >= 0)

			game.combine_ctx = {
				selected_scus: [],
				allowed_lcus: new_lcus,
				space: s,
				faction: CP,
				event_flag_on_success: { key: "turkish_reinf_81", field: "combine_used" }
			}
			game.state = "combine_lcu"
		},
		done(ctx) {
			let { game, rules } = ctx
			delete game.move_from_event
			delete game.event_next_state
			delete game.combine_ctx
			rules.goto_end_event()
		}
	}

	states.event_jerusalem_by_christmas_select_space = {
		prompt(ctx) {
			let { game, res } = ctx
			let event = use_event(game, "jerusalem_by_christmas")
			let targets = get_jerusalem_by_christmas_targets(game)
			res.prompt("圣诞节前收复圣城：选择一个由同盟国控制的圣战城市或完全补给源。")
			for (let s of targets) {
				res.space(s)
			}
			if (targets.length === 0) {
				res.prompt("圣诞节前收复圣城：没有合法目标，事件结束。")
				res.action("done")
			}
			if (event.target_space > 0) {
				res.where(event.target_space)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let targets = get_jerusalem_by_christmas_targets(game)
			if (!targets.includes(s)) return
			rules.push_undo()
			let event = use_event(game, "jerusalem_by_christmas")
			let marker = {
				target_space: s,
				turn: game.turn + 2
			}
			Object.assign(event, marker)
			if (!game.events) game.events = {}
			game.events["jerusalem_by_christmas"] = marker
			rules.log(`圣诞节前收复圣城：目标设为 ${rules.space_name(s)}，将在第 ${event.turn} 回合开始时结算。`)
			rules.goto_end_event()
		},
		done(ctx) {
			let { game, rules } = ctx
			clear_romania_event_attack_context(game)
			rules.goto_end_event()
		}
	}

	// === EVENT: ENVER-FALKENHAYN MEETING (ID 84) ===

	function with_enver_falkenhayn_sr_overlay(game, event, fn) {
		let previous = game.sr_moved
		game.sr_moved = Array.isArray(event && event.moved) ? [...event.moved] : []
		try {
			return fn()
		} finally {
			if (previous === undefined) delete game.sr_moved
			else game.sr_moved = previous
		}
	}

	function is_enver_falkenhayn_piece(p) {
		let info = data.pieces[p]
		return !!(info && info.faction === CP && (info.nation === "tu" || info.nation === "tua"))
	}

	function is_enver_falkenhayn_galicia_lcu(p) {
		let info = data.pieces[p]
		return !!(info && (info.nation === "tu" || info.nation === "tua") && info.piece_class === "LCU")
	}

	function is_enver_falkenhayn_turkish_lcu_to_galicia(p, s) {
		return s === GALICIA && is_enver_falkenhayn_galicia_lcu(p)
	}

	function create_enver_falkenhayn_sr_planner(game, rules, event) {
		let destinations_cache = new Map()
		let legal_destinations_cache = new Map()
		let cost_cache = new Map()
		let galicia_candidate_cache = new Map()

		function get_cost(p) {
			if (!cost_cache.has(p)) {
				cost_cache.set(p, rules.get_sr_cost(p))
			}
			return cost_cache.get(p)
		}

		function get_destinations_no_overlay(p) {
			if (!destinations_cache.has(p)) {
				destinations_cache.set(
					p,
					Engine.map
						.get_sr_destinations(game, p, CP)
						.filter((s) => s > 0 && s !== game.pieces[p] && Engine.map.is_balkans(s))
				)
			}
			return destinations_cache.get(p)
		}

		function has_galicia_candidate_no_overlay(remaining_points, excluded_piece = 0) {
			let excluded_key = is_enver_falkenhayn_galicia_lcu(excluded_piece) ? excluded_piece : 0
			let key = `${remaining_points}|${excluded_key}`
			if (galicia_candidate_cache.has(key)) return galicia_candidate_cache.get(key)

			for (let p = 1; p < data.pieces.length; p++) {
				if (p === excluded_key) continue
				if (!is_enver_falkenhayn_galicia_lcu(p)) continue
				if (!rules.can_sr_piece(game, p, CP)) continue
				if (get_cost(p) > remaining_points) continue
				if (get_destinations_no_overlay(p).includes(GALICIA)) {
					galicia_candidate_cache.set(key, true)
					return true
				}
			}
			galicia_candidate_cache.set(key, false)
			return false
		}

		function can_move_no_overlay(p, s) {
			let cost = get_cost(p)
			let remaining_points = event.sr_points - cost
			if (remaining_points < 0) return false

			let is_to_galicia = is_enver_falkenhayn_turkish_lcu_to_galicia(p, s)
			if (is_to_galicia) return !event.galicia_lcu_moved
			if (event.galicia_lcu_moved) return true
			return has_galicia_candidate_no_overlay(remaining_points, p)
		}

		function get_legal_destinations_no_overlay(p) {
			if (!event || !is_enver_falkenhayn_piece(p)) return []
			if (legal_destinations_cache.has(p)) return legal_destinations_cache.get(p)
			if (!rules.can_sr_piece(game, p, CP)) return []
			let cost = get_cost(p)
			if (cost > event.sr_points) return []

			let result = get_destinations_no_overlay(p).filter((s) => can_move_no_overlay(p, s))
			legal_destinations_cache.set(p, result)
			return result
		}

		return {
			get_legal_destinations(p) {
				return with_enver_falkenhayn_sr_overlay(game, event, () => get_legal_destinations_no_overlay(p))
			},
			get_legal_pieces() {
				return with_enver_falkenhayn_sr_overlay(game, event, () => {
					let pieces = []
					for (let p = 1; p < data.pieces.length; p++) {
						if (get_legal_destinations_no_overlay(p).length > 0) pieces.push(p)
					}
					return pieces
				})
			},
			has_galicia_candidate(remaining_points, excluded_piece = 0) {
				return with_enver_falkenhayn_sr_overlay(game, event, () =>
					has_galicia_candidate_no_overlay(remaining_points, excluded_piece)
				)
			}
		}
	}

	function get_enver_falkenhayn_legal_destinations(game, rules, event, p) {
		return create_enver_falkenhayn_sr_planner(game, rules, event).get_legal_destinations(p)
	}

	function get_enver_falkenhayn_legal_pieces(game, rules, event) {
		return create_enver_falkenhayn_sr_planner(game, rules, event).get_legal_pieces()
	}

	function clear_enver_falkenhayn_sr_state(game) {
		let event = get_active_event_data(game)
		if (event) {
			delete event.sr_points
			delete event.galicia_lcu_moved
			delete event.moved
		}
		delete game.sr_piece
	}

	states.event_enver_falkenhayn_sr = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = get_active_event_data(game)
			let sr_points = event && typeof event.sr_points === "number" ? event.sr_points : 0
			if (sr_points <= 0) {
				clear_enver_falkenhayn_sr_state(game)
				rules.goto_end_event()
				return
			}

			let planner = create_enver_falkenhayn_sr_planner(game, rules, event)
			let mandatory_done = !!event.galicia_lcu_moved
			let mandatory_text = mandatory_done
				? "已满足“1个土耳其LCU进入加利西亚”要求。"
				: "仍必须至少有1个土耳其LCU进入加利西亚。"

			if (game.sr_piece !== undefined && game.sr_piece !== null) {
				let p = game.sr_piece
				let destinations = planner.get_legal_destinations(p)
				res.who(p)
				res.where(game.pieces[p])
				res.prompt(
					`恩维尔-法金汉会晤：为 ${rules.piece_name(p)} 选择巴尔干目的地（剩余 ${sr_points} 点，${mandatory_text}）`
				)
				for (let s of destinations) res.space(s)
				res.action("cancel")
				return
			}

			let has_mandatory_candidate = mandatory_done || planner.has_galicia_candidate(sr_points)
			if (!has_mandatory_candidate) {
				res.prompt(`恩维尔-法金汉会晤：当前不存在满足要求的合法战略调整。`)
				res.action("done")
				return
			}

			let legal_pieces = planner.get_legal_pieces()
			if (legal_pieces.length === 0 && !mandatory_done) {
				res.prompt(`恩维尔-法金汉会晤：当前不存在满足要求的合法战略调整。`)
				res.action("done")
				return
			}

			res.prompt(
				`恩维尔-法金汉会晤：选择土耳其/土耳其-阿拉伯单位进行战略调整（剩余 ${sr_points} 点，${mandatory_text}）`
			)
			for (let p of legal_pieces) res.piece(p)

			if (mandatory_done) {
				res.action("done")
			}
		},
		piece(ctx) {
			let { game, arg: p } = ctx
			game.sr_piece = p
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = get_active_event_data(game)
			let p = game.sr_piece
			if (!event || p === undefined || p === null) return

			let legal_destinations = get_enver_falkenhayn_legal_destinations(game, rules, event, p)
			if (!legal_destinations.includes(s)) return

			let cost = rules.get_sr_cost(p)
			rules.push_undo()
			Engine.map.apply_sr_control_effects(game, p, game.pieces[p], s, CP)
			game.pieces[p] = s
			event.sr_points -= cost
			if (!Array.isArray(event.moved)) event.moved = []
			set_add(event.moved, p)
			if (is_enver_falkenhayn_turkish_lcu_to_galicia(p, s)) {
				event.galicia_lcu_moved = true
			}

			if (Engine.neutral.is_greece_neutral(game) && Engine.neutral.is_athens_space(s)) {
				Engine.neutral.trigger_greece_entry(game, s, CP, "战略调整进入雅典", (msg) => rules.log(msg))
			}

			rules.log(`${rules.piece_name(p)} 战略调整至 ${rules.space_name(s)}（恩维尔-法金汉会晤，耗费 ${cost} 点）`)
			game.sr_piece = null

			if (event.sr_points <= 0 || get_enver_falkenhayn_legal_pieces(game, rules, event).length === 0) {
				clear_enver_falkenhayn_sr_state(game)
				rules.goto_end_event()
			}
		},
		cancel(ctx) {
			let { game } = ctx
			game.sr_piece = null
		},
		done(ctx) {
			let { game, rules } = ctx
			let event = get_active_event_data(game)
			if (
				event &&
				!event.galicia_lcu_moved &&
				create_enver_falkenhayn_sr_planner(game, rules, event).has_galicia_candidate(event.sr_points || 0)
			) {
				return
			}
			clear_enver_falkenhayn_sr_state(game)
			rules.goto_end_event()
		}
	}

	// === EVENT: TURKISH REINFORCEMENTS (ID 92) ===

	states.event_turkish_reinf_92_trench = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("土耳其增援：在叙利亚/巴勒斯坦或西奈放置 1 个战壕。")
			for (let s = 1; s < data.spaces.length; s++) {
				if (rules.is_syria_palestine(s) || rules.is_sinai(s)) {
					// 只能在尚未有战壕、且不是岛屿基地或滩头的空间放置
					if (
						rules.has_trench(game, s) === 0 &&
						!rules.is_island_base(game, s) &&
						!rules.is_beachhead_space(game, s)
					) {
						res.space(s)
					}
				}
			}
			res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			rules.place_trench(game, s, CP)
			rules.goto_end_event()
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	// === GENERAL: PLACE REINFORCEMENTS ===

	states.event_place_reinforcements = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = get_active_event_data(game)

			let { units, source } = get_reinforcement_units(game)

			if (!units || units.length === 0) {
				rules.goto_end_event()
				return
			}

			let unit = units[0]
			let logic_key = get_reinforcement_logic_key(source || event, unit)
			let helper = Engine.reinf_helpers[logic_key]
			let desc = helper ? helper.desc : "指定地点"
			if (typeof desc === "function") desc = desc(game, unit)
			let faction = helper ? helper.faction : game.active || AP
			let placement = get_reinforcement_placement(source, unit)
			let reserve_space = get_reinforcement_reserve_space(faction, unit, placement)
			let reserve_name = data.spaces[reserve_space] ? rules.space_name(reserve_space) : "预备军格"
			let target_desc = desc
			if (placement.mode === "reserve") {
				target_desc = reserve_name
			} else if (placement.mode === "either") {
				target_desc = `${desc} 或 ${reserve_name}`
			}
			let prompt_prefix = (source && source.reinf_prompt_prefix) || "增援"
			res.prompt(`${prompt_prefix}：将 ${unit} 放置在 ${target_desc}。`)

			let allow_map = placement.mode !== "reserve"
			let allow_reserve = placement.mode !== "map"
			let allow_adjacent_overflow = !source || source.reinf_allow_adjacent_overflow !== false
			let seen_spaces = new Set()

			function add_space_option(s) {
				if (s <= 0 || seen_spaces.has(s)) return
				seen_spaces.add(s)
				res.space(s)
			}

			function can_place_reinforcement_unit_in_space(s, p_id) {
				if (p_id < 0) return false
				if (Engine.map.is_potential_beachhead_space(s) && !Engine.map.is_beachhead_space(game, s)) return false
				return Engine.map.can_place_piece_in_space(game, s, p_id)
			}

			function can_place_adjacent_overflow_reinforcement(s, p_id) {
				if (!Engine.map.is_controlled_by(game, s, faction)) return false
				if (Engine.map.is_besieged(game, s)) return false
				return can_place_reinforcement_unit_in_space(s, p_id)
			}

			if (helper && helper.check) {
				let enemy_faction = rules.other_faction(helper.faction)
				let enemy_spaces = []
				for (let s = 1; s < data.spaces.length; s++) {
					let pieces = rules.get_pieces_in_space(game, s)
					if (
						pieces.length > 0 &&
						data.pieces[pieces[0]] &&
						data.pieces[pieces[0]].faction === enemy_faction
					) {
						enemy_spaces.push(s)
					}
				}

				for (let s = 1; s < data.spaces.length; s++) {
					if (helper.check(game, s)) {
						if (Engine.map.is_reserve_space(s)) {
							if (allow_reserve && s === reserve_space) add_space_option(s)
							continue
						}

						if (!allow_map) continue

						// Stacking limit check (Rule 7.7.2 & 8.1.3)
						let p_id = find_piece(faction, unit)
						let can_stack = Engine.map.is_reserve_space(s)
							? p_id >= 0
							: can_place_reinforcement_unit_in_space(s, p_id)

						if (can_stack) {
							add_space_option(s)
						} else if (allow_adjacent_overflow) {
							// Rule 7.7.2: if full, adjacent placement allowed
							let neighbors = rules.get_connected_spaces(game, s)
							let candidates = neighbors.filter((ns) => can_place_adjacent_overflow_reinforcement(ns, p_id))

							if (candidates.length > 0) {
								// Priority to spaces farthest from enemy units
								let max_min_dist = -1
								let best_candidates = []

								for (let ns of candidates) {
									let min_enemy_dist = 999
									for (let es of enemy_spaces) {
										let d = Engine.map.get_distance(ns, es)
										if (d < min_enemy_dist) min_enemy_dist = d
									}

									if (min_enemy_dist > max_min_dist) {
										max_min_dist = min_enemy_dist
										best_candidates = [ns]
									} else if (min_enemy_dist === max_min_dist) {
										best_candidates.push(ns)
									}
								}

								for (let bc of best_candidates) {
									add_space_option(bc)
								}
							}
						}
					}
				}
			}

			if (allow_reserve) add_space_option(reserve_space)
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			let event = get_active_event_data(game)

			let { units, source } = get_reinforcement_units(game)
			if (!units || units.length === 0) {
				rules.goto_end_event()
				return
			}

			let unit_name = units.shift()
			let logic_key = get_reinforcement_logic_key(source || event, unit_name)
			let helper = Engine.reinf_helpers[logic_key]
			let faction = helper ? helper.faction : game.active || AP
			consume_reinforcement_placement(source, unit_name)

			rules.reinforce(game, unit_name, faction, s, {
				allow_from_reserve: !!(source && source.reinf_allow_from_reserve),
				allow_from_eliminated: !!(source && source.reinf_allow_from_eliminated),
				restore_full_strength: !!(source && source.reinf_restore_full_strength)
			})

			if (units.length === 0) {
				let next_state = source && source.reinf_next_state
				let should_check_supply = !!(source && source.reinf_check_supply_on_complete)
				if (source) delete source.reinf_to_place
				if (source) delete source.reinf_placement
				if (source) delete source.reinf_prompt_prefix
				if (source) delete source.reinf_next_state
				if (source) delete source.reinf_allow_adjacent_overflow
				if (source) delete source.reinf_check_supply_on_complete
				if (source) delete source.reinf_allow_from_reserve
				if (source) delete source.reinf_allow_from_eliminated
				if (source) delete source.reinf_restore_full_strength
				if (event) delete event.reinf_logic
				if (should_check_supply && typeof Engine.map.check_supply === "function") {
					Engine.map.check_supply(game)
				}
				if (next_state) {
					game.state = next_state
					return
				}
				rules.goto_end_event()
			}
		}
	}

	states.event_yildrim_place_falkenhayn = {
		prompt(ctx) {
			let { game, res } = ctx
			let spaces = get_yildrim_spaces(game)
			if (!can_place_yildrim_falkenhayn(game) || spaces.length === 0) {
				res.prompt("耶尔德里姆：法金汉HQ当前不可放置。")
				res.action("done")
				return
			}

			res.prompt("耶尔德里姆：你可以选择将法金汉HQ放置到包含耶尔德里姆师的地区。")
			for (let s of spaces) res.space(s)
			res.action("done")
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			if (!can_place_yildrim_falkenhayn(game)) return
			let spaces = get_yildrim_spaces(game)
			if (!spaces.includes(s)) return
			let falkenhayn = find_piece(CP, "GE Falkenhayn HQ")
			if (falkenhayn < 0) return
			rules.push_undo()
			game.pieces[falkenhayn] = s
			rules.log(`耶尔德里姆：GE Falkenhayn HQ 放置到 ${rules.space_name(s)}。`)
			rules.goto_end_event()
		},
		done(ctx) {
			ctx.rules.goto_end_event()
		}
	}

	states.event_allenby_remove_elite = {
		prompt(ctx) {
			let { game, res } = ctx
			let candidates = []
			for (let p = 1; p < data.pieces.length; p++) {
				let info = data.pieces[p]
				if (
					info &&
					info.faction === Engine.constants.AP &&
					info.nation === "br" &&
					info.piece_class === "SCU" &&
					Engine.game_utils.get_piece_badge(p) === "blue"
				) {
					if (
						!Engine.game_utils.is_removed(game, p) &&
						!Engine.game_utils.is_eliminated(game, p) &&
						!Engine.game_utils.is_reinforcement(game, p)
					) {
						candidates.push(p)
					}
				}
			}

			if (candidates.length === 0) {
				res.prompt("艾伦比：没有英国精锐步兵师可以移除。")
				res.action("done")
			} else {
				res.prompt("艾伦比：选择一个英国精锐步兵师移除游戏 (派往西线)。")
				for (let p of candidates) {
					res.piece(p)
				}
			}
		},
		piece(ctx) {
			let { rules, arg: p } = ctx
			rules.push_undo()
			rules.remove_piece(p)
			rules.log(`艾伦比：${rules.piece_name(p)} 被移出游戏 (派往西线)。`)
			rules.goto_end_event()
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_romania_place_combined_bu_ah = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("罗马尼亚：选择 Combined BU/AH 师在保加利亚的放置位置")
			for (let s = 1; s < data.spaces.length; s++) {
				if (can_place_romania_combined_bu_ah_in_space(game, s)) {
					res.space(s)
				}
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			if (!can_place_romania_combined_bu_ah_in_space(game, s)) return
			let name = data.spaces[s].name
			Engine.neutral.place_romania_combined_bu_ah(game, name)
			if (typeof Engine.map.check_supply === "function") {
				Engine.map.check_supply(game)
			}
			Engine.event_states.begin_romania_event_attack_activation(game)
		}
	}

	// === EVENT: BULL'S EYE DIRECTIVE (ID 58) ===

	const BULLS_EYE_SR_OPTIONS = { ignore_stacking: true }

	function can_bulls_eye_sr_piece_to_target(game, p, target) {
		let info = data.pieces[p]
		if (!info || info.piece_class !== "SCU") return false
		if (info.nation !== "tu" && info.nation !== "tua") return false
		if (!Engine.game_utils.is_in_reserve(game, p)) return false
		return Engine.map.can_sr_to_space(game, p, target, CP, BULLS_EYE_SR_OPTIONS)
	}

	function has_bulls_eye_sr_piece_for_target(game, target) {
		let reserve = Engine.game_utils.get_scu_reserve_box(CP)
		for (let p of Engine.map.get_pieces_in_space(game, reserve)) {
			if (can_bulls_eye_sr_piece_to_target(game, p, target)) return true
		}
		return false
	}

	states.event_bulls_eye_sr = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("靶心指令: SR 1 TU/TU-A SCU 至每个已激活的战斗地块 (选择地块)")
			res.action("done")
			for (let s of Engine.events.bulls_eye_get_sr_spaces(game)) {
				if (has_bulls_eye_sr_piece_for_target(game, s)) res.space(s)
			}
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			rules.push_undo()
			game.bulls_eye_target = s
			game.state = "event_bulls_eye_sr_select_unit"
		},
		done(ctx) {
			let { game, rules } = ctx
			Engine.events.bulls_eye_finish_sr(game)
			// Resume normal flow
			if (game.activated.move.length > 0) {
				game.state = "choose_move_space"
			} else {
				rules.refresh_attack_eligibility()
				if (game.eligible_attackers.length > 0) game.state = "attack"
				else rules.goto_end_operations()
			}
		}
	}

	states.event_bulls_eye_sr_select_unit = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt(`靶心指令: 从预备格选择 TU/TU-A SCU 放置于 ${rules.space_name(game.bulls_eye_target)}`)
			res.action("cancel")

			// Find TU/TU-A SCUs in Reserve
			let reserve = rules.find_space("CP Reserve")
			let pieces = rules.get_pieces_in_space(game, reserve)
			for (let p of pieces) {
				if (can_bulls_eye_sr_piece_to_target(game, p, game.bulls_eye_target)) {
					res.piece(p)
				}
			}
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!can_bulls_eye_sr_piece_to_target(game, p, game.bulls_eye_target)) return
			rules.push_undo()
			// Move piece to target space
			game.pieces[p] = game.bulls_eye_target
			Engine.events.bulls_eye_record_sr_space(game, game.bulls_eye_target)
			rules.log(`靶心指令：${rules.piece_name(p)} 战略调整至 ${rules.space_name(game.bulls_eye_target)}。`)

			game.bulls_eye_target = null
			game.state = "event_bulls_eye_sr"
		},
		cancel(ctx) {
			let { game } = ctx
			game.bulls_eye_target = null
			game.state = "event_bulls_eye_sr"
		}
	}

	states.event_warm_water_port = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("不冻港：选择一个爱琴海、东地中海或波斯湾港口作为不冻港")
			if (game.warm_water_port_options) {
				for (let s of game.warm_water_port_options) {
					res.space(s)
				}
			}
		},
		space(ctx) {
			let { game, arg: s, rules } = ctx
			if (!Array.isArray(game.warm_water_port_options) || !game.warm_water_port_options.includes(s)) {
				if (rules && typeof rules.log === "function") rules.log("不冻港：选择无效。")
				return
			}
			rules.push_undo()
			Engine.events.apply_warm_water_port_effect(game, s)
			delete game.warm_water_port_options
			rules.goto_end_event()
		}
	}

	// === NATIONAL COLLAPSE (Rules 19.3.5, 19.4.6, 19.5.6) ===

	function ensure_collapse_choice_ctx(game) {
		// 自愿/自动崩溃都会复用这一段状态，因此这里统一补齐结构。
		if (!game.event_ctx) game.event_ctx = {}
		if (!game.event_ctx.data) game.event_ctx.data = {}
		if (!Array.isArray(game.event_ctx.data.removed)) game.event_ctx.data.removed = []
		if (!Number.isInteger(game.event_ctx.move_limit)) {
			game.event_ctx.move_limit = Engine.collapse.get_collapse_sr_limit()
		}
		return game.event_ctx
	}

	function ensure_collapse_sr_ctx(game) {
		if (!game.event_ctx) game.event_ctx = {}
		if (!game.event_ctx.data) game.event_ctx.data = {}
		if (!Array.isArray(game.event_ctx.data.moved)) game.event_ctx.data.moved = []
		if (!Number.isInteger(game.event_ctx.move_limit)) {
			game.event_ctx.move_limit = Engine.collapse.get_collapse_sr_limit()
		}
		return game.event_ctx
	}

	function handle_collapse_choice_prompt(ctx, nation_name) {
		let { game, res, rules } = ctx
		let event_ctx = ensure_collapse_choice_ctx(game)
		let removed = event_ctx.data.removed
		let count = event_ctx.choice_limit || 0
		// 塞尔维亚与罗马尼亚崩溃的“可选移除名单”不同，这里从 collapse 子系统按国家动态取得。
		let selectable_units = Engine.collapse.get_collapse_choice_unit_names(event_ctx.collapse_nation)

		res.prompt(`${nation_name}崩溃：CP 玩家可以选择 ${count} 个奥匈单位移除以获得后续崩溃 SR (${removed.length}/${count})`)
		res.action("skip")

		if (removed.length >= count) {
			res.action("confirm")
		} else {
			let options = 0
			for (let name of selectable_units) {
				let p = Engine.game_utils.find_piece(CP, name)
				if (p >= 0 && !rules.set_has(removed, p)) {
					if (!rules.is_removed(game, p) && Engine.collapse.is_collapse_choice_piece_available(game, p)) {
						res.piece(p)
						options++
					}
				}
			}
			if (options === 0) {
				res.action("confirm")
			}
		}
	}

	function handle_collapse_choice_confirm(ctx, next_state) {
		let { game, rules } = ctx
		rules.push_undo()
		let event_ctx = ensure_collapse_choice_ctx(game)
		let removed = event_ctx.data.removed
		for (let p of removed) {
			rules.remove_piece(p)
		}
		game.event_ctx = {
			move_limit: event_ctx.move_limit,
			data: { moved: [] }
		}
		// “移除”完成后执行“最多 2 个单位免费 SR”。
		game.state = next_state
		game.active = CP
	}

	function handle_collapse_choice_skip(ctx) {
		let { game, rules } = ctx
		rules.push_undo()
		delete game.event_ctx
		delete game.sr_piece
		if (!Engine.collapse.handle_national_collapse(game, rules.log)) {
			rules.next_phase("war_status_phase")
		}
	}

	states.event_serbian_collapse_choice = {
		prompt(ctx) {
			handle_collapse_choice_prompt(ctx, "塞尔维亚")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			if (!game.event_ctx.data) game.event_ctx.data = { removed: [] }
			rules.set_add(game.event_ctx.data.removed, p)
		},
		confirm(ctx) {
			handle_collapse_choice_confirm(ctx, "event_serbian_collapse_sr")
		},
		skip(ctx) {
			handle_collapse_choice_skip(ctx)
		}
	}

	states.event_romanian_collapse_choice = {
		prompt(ctx) {
			handle_collapse_choice_prompt(ctx, "罗马尼亚")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			if (!game.event_ctx.data) game.event_ctx.data = { removed: [] }
			rules.set_add(game.event_ctx.data.removed, p)
		},
		space() {
			// Dummy handler to prevent "Invalid action: space" if any spaces are highlighted
		},
		confirm(ctx) {
			handle_collapse_choice_confirm(ctx, "event_romanian_collapse_sr")
		},
		skip(ctx) {
			handle_collapse_choice_skip(ctx)
		}
	}

	function handle_collapse_sr_prompt(ctx, nation_name) {
		let { game, res, rules } = ctx
		let event_ctx = ensure_collapse_sr_ctx(game)
		let moved = event_ctx.data.moved
		let move_limit = event_ctx.move_limit

		res.prompt(
			`${nation_name}崩溃：CP 玩家可免费对至多 ${move_limit} 个巴尔干单位进行战略转移 (${moved.length}/${move_limit})`
		)
		res.action("done")

		// 规则 19.4.6 / 19.5.6：崩溃后的免费 SR 上限始终为 2 个单位。
		if (moved.length >= move_limit) return

		if (game.sr_piece !== undefined && game.sr_piece !== null) {
			// 已选定 SR 单位时，只高亮目的地，避免在同一步骤里再次选择其他单位。
			let destinations = Engine.collapse.get_collapse_sr_destination_spaces(game, game.sr_piece)
			for (let s of destinations) {
				res.space(s)
			}
			return
		}

		// Find units that can be SR'd
		for (let p = 0; p < data.pieces.length; p++) {
			if (can_select_collapse_sr_piece(game, p) && !rules.set_has(moved, p)) {
				res.piece(p)
			}
		}
	}

	function can_select_collapse_sr_piece(game, p) {
		let event_ctx = ensure_collapse_sr_ctx(game)
		let moved = event_ctx.data.moved
		if (moved.length >= event_ctx.move_limit) return false
		if (Engine.utils.set_has(moved, p)) return false
		return Engine.collapse.can_collapse_sr_piece(game, p)
	}

	function handle_collapse_sr_done(ctx) {
		let { game, rules } = ctx
		rules.push_undo()
		delete game.event_ctx
		delete game.sr_piece
		if (!Engine.collapse.handle_national_collapse(game, rules.log)) {
			rules.next_phase("war_status_phase")
		}
	}

	function prompt_voluntary_collapse_offer(ctx, nation_key, nation_name) {
		let { res } = ctx
		res.prompt(`${nation_name}符合自愿崩溃条件：AP 玩家可选择令其崩溃`)
		res.action("accept")
		res.action("decline")
	}

	function resolve_voluntary_collapse_decline(ctx, nation_key, nation_name) {
		let { game, rules } = ctx
		rules.push_undo()
		Engine.collapse.decline_voluntary_collapse(game, nation_key)
		rules.log(`${nation_name}暂不崩溃。`)
		if (!Engine.collapse.handle_national_collapse(game, rules.log)) {
			rules.next_phase("war_status_phase")
		}
	}

	states.war_status_serbian_collapse_offer = {
		prompt(ctx) {
			prompt_voluntary_collapse_offer(ctx, "serbia", "塞尔维亚")
		},
		accept(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			if (Engine.collapse.accept_voluntary_collapse(game, "serbia", rules.log) !== "interactive") {
				if (!Engine.collapse.handle_national_collapse(game, rules.log)) {
					rules.next_phase("war_status_phase")
				}
			}
		},
		decline(ctx) {
			resolve_voluntary_collapse_decline(ctx, "serbia", "塞尔维亚")
		}
	}

	states.war_status_romanian_collapse_offer = {
		prompt(ctx) {
			prompt_voluntary_collapse_offer(ctx, "romania", "罗马尼亚")
		},
		accept(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			if (Engine.collapse.accept_voluntary_collapse(game, "romania", rules.log) !== "interactive") {
				if (!Engine.collapse.handle_national_collapse(game, rules.log)) {
					rules.next_phase("war_status_phase")
				}
			}
		},
		decline(ctx) {
			resolve_voluntary_collapse_decline(ctx, "romania", "罗马尼亚")
		}
	}

	states.event_serbian_collapse_sr = {
		prompt(ctx) {
			handle_collapse_sr_prompt(ctx, "塞尔维亚")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!can_select_collapse_sr_piece(game, p)) return
			rules.push_undo()
			game.sr_piece = p
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let p = game.sr_piece
			if (!can_select_collapse_sr_piece(game, p)) return
			if (!Engine.collapse.get_collapse_sr_destination_spaces(game, p).includes(s)) return
			rules.push_undo()
			let from = game.pieces[p]
			Engine.map.apply_sr_control_effects(game, p, from, s, CP)
			rules.move_piece(game, p, s)
			rules.log(
				`塞尔维亚崩溃：${event_piece_name(rules, p)} 从 ${event_space_name(rules, from)} 战略调整至 ${event_space_name(rules, s)}`
			)
			if (!game.event_ctx.data) game.event_ctx.data = { moved: [] }
			rules.set_add(game.event_ctx.data.moved, p)
			game.sr_piece = null
		},
		done(ctx) {
			handle_collapse_sr_done(ctx)
		}
	}

	states.event_romanian_collapse_sr = {
		prompt(ctx) {
			handle_collapse_sr_prompt(ctx, "罗马尼亚")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!can_select_collapse_sr_piece(game, p)) return
			rules.push_undo()
			game.sr_piece = p
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let p = game.sr_piece
			if (!can_select_collapse_sr_piece(game, p)) return
			if (!Engine.collapse.get_collapse_sr_destination_spaces(game, p).includes(s)) return
			rules.push_undo()
			let from = game.pieces[p]
			Engine.map.apply_sr_control_effects(game, p, from, s, CP)
			rules.move_piece(game, p, s)
			rules.log(
				`罗马尼亚崩溃：${event_piece_name(rules, p)} 从 ${event_space_name(rules, from)} 战略调整至 ${event_space_name(rules, s)}`
			)
			if (!game.event_ctx.data) game.event_ctx.data = { moved: [] }
			rules.set_add(game.event_ctx.data.moved, p)
			game.sr_piece = null
		},
		done(ctx) {
			handle_collapse_sr_done(ctx)
		}
	}

	states.event_rupel_move_greek_units = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = get_active_event_data(game)
			if (!event || !Array.isArray(event.greek_units) || event.greek_units.length === 0) {
				let event72 = Engine.events.get_event_by_id(72)
				if (event72 && typeof event72.begin_cp_advance === "function") {
					event72.begin_cp_advance(game, ctx)
				} else {
					rules.goto_end_event()
				}
				return
			}

			res.prompt("鲁贝尔堡的背叛：选择所有希腊部队（希腊国防军除外）的移动目的地")
			res.space(LAMIA)
			res.space(ATHENS)
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = get_active_event_data(game)
			if (!event || !Array.isArray(event.greek_units)) return

			let destinations = Array.isArray(event.destinations) ? event.destinations : [LAMIA, ATHENS]
			if (!destinations.includes(s)) return

			rules.push_undo()
			for (let p of event.greek_units) {
				move_rupel_greek_unit(game, p, s)
			}

			rules.log(`鲁贝尔堡的背叛：所有希腊部队（希腊国防军除外）移动至 ${rules.space_name(s)}。`)

			let event72 = Engine.events.get_event_by_id(72)
			if (event72 && typeof event72.begin_cp_advance === "function") {
				event72.begin_cp_advance(game, ctx)
			} else {
				rules.goto_end_event()
			}
		}
	}

	states.event_rupel_advance_cp_units = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let event = get_active_event_data(game) || rules.get_event_data()
			let event72 = Engine.events.get_event_by_id(72)
			if (!event72 || typeof event72.get_advance_pieces !== "function") {
				res.prompt("鲁贝尔堡的背叛：没有可挺进的同盟国单位")
				res.action("done")
				return
			}
			if (!Array.isArray(event.rupel_advanced_pieces)) event.rupel_advanced_pieces = []

			let selected = event.rupel_selected_piece
			let legal_pieces = event72.get_advance_pieces(game, event)
			if (selected && !legal_pieces.includes(selected)) {
				delete event.rupel_selected_piece
				selected = null
			}

			if (selected) {
				let targets = event72.get_advance_targets(game, selected)
				res.prompt(`鲁贝尔堡的背叛：选择 ${rules.piece_name(selected)} 的挺进目标`)
				res.who(selected)
				for (let target of targets) res.space(target)
				res.piece(selected)
				res.action("cancel")
				return
			}

			res.prompt("鲁贝尔堡的背叛：选择与多里安或鲁贝尔堡相邻的同盟国单位进行挺进")
			for (let p of legal_pieces) res.piece(p)
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			let event = get_active_event_data(game) || rules.get_event_data()
			let event72 = Engine.events.get_event_by_id(72)
			if (!event72 || typeof event72.get_advance_pieces !== "function") return
			let legal_pieces = event72.get_advance_pieces(game, event)
			if (!legal_pieces.includes(p)) return
			rules.push_undo()
			if (event.rupel_selected_piece === p) delete event.rupel_selected_piece
			else event.rupel_selected_piece = p
		},
		space(ctx) {
			let { game, rules, arg: s } = ctx
			let event = get_active_event_data(game) || rules.get_event_data()
			let event72 = Engine.events.get_event_by_id(72)
			let p = event.rupel_selected_piece
			if (!event72 || typeof event72.resolve_cp_advance !== "function") return
			if (!p) return
			let targets = event72.get_advance_targets(game, p)
			if (!targets.includes(s)) return
			rules.push_undo()
			if (event72.resolve_cp_advance(game, p, s, ctx)) {
				delete event.rupel_selected_piece
				if (event72.get_advance_pieces(game, event).length === 0) rules.goto_end_event()
			}
		},
		cancel(ctx) {
			let { game, rules } = ctx
			let event = get_active_event_data(game) || rules.get_event_data()
			if (!event.rupel_selected_piece) return
			rules.push_undo()
			delete event.rupel_selected_piece
		},
		done(ctx) {
			let { game, rules } = ctx
			let event = get_active_event_data(game) || rules.get_event_data()
			rules.push_undo()
			delete event.rupel_selected_piece
			rules.goto_end_event()
		}
	}

	states.event_romania_attack = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			res.prompt("罗马尼亚：选择一个包含罗马尼亚部队的地区，并使用“激活以攻击”。")
			let can_attack = false
			for (let s = 1; s < data.spaces.length; s++) {
				let pieces = rules.get_pieces_in_space(game, s)
				if (
					pieces.some(
						(p) =>
							data.pieces[p] &&
							data.pieces[p].nation === "ro" &&
							rules.can_activate_piece_in_space_to_attack(p, s)
					)
				) {
					res.action("activate_attack", s)
					can_attack = true
				}
			}
			if (!can_attack) res.action("done")
		},
		activate_attack(ctx) {
			let { game, rules, arg: s } = ctx
			let pieces = rules.get_pieces_in_space(game, s)
			let has_romanian_attacker = pieces.some(
				(p) =>
					data.pieces[p] &&
					data.pieces[p].nation === "ro" &&
					rules.can_activate_piece_in_space_to_attack(p, s)
			)
			if (!has_romanian_attacker) return
			let attackers = pieces.filter((p) => rules.can_activate_piece_in_space_to_attack(p, s))
			if (attackers.length === 0) return
			rules.push_undo()
			clear_romania_event_attack_context(game)
			game.activated = { attack: [s], move: [] }
			game.activation_cost = {}
			game.attacked = []
			game.attacked_spaces = []
			game.event_romania_attack_required = true
			game.event_next_state = "event_romania_attack_cleanup"
			game.state = "attack"
		},
		done(ctx) {
			let { game, rules } = ctx
			clear_romania_event_attack_context(game)
			rules.goto_end_event()
		}
	}

	states.event_romania_attack_cleanup = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("罗马尼亚：战斗结束。")
			res.action("done")
		},
		done(ctx) {
			let { game, rules } = ctx
			clear_romania_event_attack_context(game)
			rules.goto_end_event()
		}
	}

	states.event_gorlice_tarnow_choice = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("戈尔利采-塔尔诺夫攻势：选择一项")
			res.action("lose_vp")
			res.action("remove_ru_lcu")
		},
		lose_vp(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.vp += 2
			rules.log("AP 失去 2 VP。")
			finish_gorlice_tarnow_event(game, rules)
		},
		remove_ru_lcu(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.state = "event_gorlice_tarnow_remove_lcu"
		}
	}

	states.event_gorlice_tarnow_remove_lcu = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("戈尔利采-塔尔诺夫攻势：选择一个地图上的俄国LCU暂时移除")
			let found = false
			for (let p = 1; p < data.pieces.length; p++) {
				if (data.pieces[p] && data.pieces[p].nation === "ru" && Engine.game_utils.is_lcu(p)) {
					if (!Engine.game_utils.is_not_on_map(game, p) && !Engine.game_utils.is_in_reserve(game, p)) {
						res.piece(p)
						found = true
					}
				}
			}
			if (!found) res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			// Manually move the piece to the "Removed" box and reset state
			const info = data.pieces[p]
			game.pieces[p] = rules.get_removed_box(info.faction)

			// Reset unit state like eliminate_piece does
			set_delete(game.moved, p)
			set_delete(game.attacked, p)
			if (game.sr_moved) set_delete(game.sr_moved, p)
			if (game.oos) set_delete(game.oos, p)
			if (game.entrenching) set_delete(game.entrenching, p)
			if (game.attack && Array.isArray(game.attack.pieces)) set_delete(game.attack.pieces, p)
			if (game.move && Array.isArray(game.move.pieces)) set_delete(game.move.pieces, p)
			set_delete(game.reduced, p)

			let return_turn = game.turn + 4
			if (!game.delayed_reinforcements) game.delayed_reinforcements = []
			game.delayed_reinforcements.push({ turn: return_turn, piece: p, space: get_reserve_box_for_piece(p) })

			if (!game.events) game.events = {}
			game.events["gorlice_tarnow_return"] = return_turn
			game.events["gorlice_tarnow_piece"] = p
			game.active = use_event(game, "gorlice_tarnow").origin_active ?? CP

			rules.log(`${rules.piece_name(p)} 被移除并派往东线，将在 ${return_turn} 回合返回军资产格。`)
			rules.goto_end_event()
		},
		done(ctx) {
			let { game, rules } = ctx
			game.active = use_event(game, "gorlice_tarnow").origin_active ?? CP
			rules.goto_end_event()
		}
	}

	function prompt_verdun_remove(ctx) {
		let { game, res } = ctx
		let plan = use_event(game, "verdun")
		if (!plan.pool) {
			plan = create_verdun_plan(game)
		}
		let summary = get_verdun_selection_summary(plan)
		let awarded_vp = get_verdun_awarded_vp(plan)
		let selectable = get_verdun_selectable_pieces(plan)
		let current_result =
			awarded_vp === 0 ? "当前为 CP 0 VP" : awarded_vp === 1 ? "当前为 CP +1 VP" : "当前为 CP +2 VP"

		res.prompt(`凡尔登战役：移除单位以抵消VP（${summary.count}个师；${current_result}）。`)
		res.action("confirm")
		for (let p of selectable) res.piece(p)
	}

	function on_verdun_piece(ctx) {
		let { game, rules, arg: p } = ctx
		let plan = use_event(game, "verdun")
		if (!plan.pool) {
			plan = rules.start_event("verdun", create_verdun_plan(game))
		}
		let selectable = get_verdun_selectable_pieces(plan)
		if (!selectable.includes(p)) return
		rules.push_undo()
		select_verdun_piece(game, rules, plan, p)
	}

	function on_verdun_confirm(ctx) {
		let { game, rules } = ctx
		let plan = use_event(game, "verdun")
		if (!plan.pool) {
			rules.start_event("verdun", create_verdun_plan(game))
		}
		rules.push_undo()
		finalize_verdun_plan(game, rules)
	}

	function get_kaiserschlacht_selectable_pieces(plan) {
		let options = []
		let requirements = get_verdun_requirements(plan)
		let current_awarded_vp = get_verdun_awarded_vp(plan)
		for (let p of plan.pool || []) {
			if (plan.selected && plan.selected.includes(p)) continue
			if (
				requirements.some((requirement) => can_finish_verdun_requirement(plan, requirement, p)) ||
				requirements.some((requirement) => requirement.awarded_vp === current_awarded_vp)
			) {
				options.push(p)
			}
		}
		return options
	}

	function prompt_kaiserschlacht_remove(ctx) {
		let { game, res } = ctx
		let plan = use_event(game, "kaiserschlacht")
		if (!plan.pool) {
			plan = create_kaiserschlacht_plan(game)
		}
		let summary = get_verdun_selection_summary(plan)
		let awarded_vp = get_verdun_awarded_vp(plan)
		let selectable = get_kaiserschlacht_selectable_pieces(plan)
		let current_result = awarded_vp === 0 ? "当前 CP 0 VP" : "当前 CP +1 VP"

		res.prompt(`皇帝攻势：移除单位（${summary.count}个师；${current_result}）。`)
		res.action("confirm")
		for (let p of selectable) res.piece(p)
	}

	function select_kaiserschlacht_piece(game, rules, plan, p) {
		if (!plan.original_spaces) plan.original_spaces = {}
		if (!plan.selected) plan.selected = []
		if (plan.original_spaces[p] === undefined) {
			plan.original_spaces[p] = game.pieces[p]
		}
		plan.selected.push(p)
		rules.remove_piece(p)
		game.selected_piece = null
	}

	function on_kaiserschlacht_piece(ctx) {
		let { game, rules, arg: p } = ctx
		let plan = use_event(game, "kaiserschlacht")
		if (!plan.pool) {
			plan = rules.start_event("kaiserschlacht", {
				...create_kaiserschlacht_plan(game),
				origin_active: plan.origin_active
			})
		}
		let selectable = get_kaiserschlacht_selectable_pieces(plan)
		if (!selectable.includes(p)) return
		rules.push_undo()
		select_kaiserschlacht_piece(game, rules, plan, p)
	}

	function finalize_kaiserschlacht_plan(game, rules) {
		let plan = use_event(game, "kaiserschlacht")
		let awarded_vp = get_verdun_awarded_vp(plan)
		delete game.selected_piece
		game.vp += awarded_vp
		if (awarded_vp === 0) {
			rules.log("皇帝攻势：CP 0 VP。")
		} else {
			rules.log("皇帝攻势：CP +1 VP。")
		}
		game.active = plan.origin_active !== undefined ? plan.origin_active : CP
		rules.goto_end_event()
	}

	function on_kaiserschlacht_confirm(ctx) {
		let { game, rules } = ctx
		let plan = use_event(game, "kaiserschlacht")
		if (!plan.pool) {
			rules.start_event("kaiserschlacht", {
				...create_kaiserschlacht_plan(game),
				origin_active: plan.origin_active
			})
		}
		rules.push_undo()
		finalize_kaiserschlacht_plan(game, rules)
	}

	states.event_verdun_choice = {
		prompt(ctx) {
			prompt_verdun_remove(ctx)
		},
		piece(ctx) {
			on_verdun_piece(ctx)
		},
		confirm(ctx) {
			on_verdun_confirm(ctx)
		}
	}

	states.event_verdun_remove = {
		prompt(ctx) {
			prompt_verdun_remove(ctx)
		},
		piece(ctx) {
			on_verdun_piece(ctx)
		},
		confirm(ctx) {
			on_verdun_confirm(ctx)
		}
	}

	states.event_apis_eliminate = {
		prompt(ctx) {
			let { game, res } = ctx
			res.prompt("“蜜蜂”党骚乱：选择一个塞尔维亚集团军消灭")
			let found = false
			for (let p = 1; p < data.pieces.length; p++) {
				if (
					data.pieces[p] &&
					data.pieces[p].nation === "sb" &&
					Engine.game_utils.is_lcu(p) &&
					(Engine.game_utils.is_in_reserve(game, p) || !Engine.game_utils.is_not_on_map(game, p))
				) {
					res.piece(p)
					found = true
				}
			}
			if (!found) res.action("done")
		},
		piece(ctx) {
			let { rules, arg: p } = ctx
			rules.push_undo()
			rules.remove_piece(p)
			rules.goto_end_event()
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_to_help_and_save_you = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let data_event = rules.get_event_data()
			let count = data_event.count || 0
			res.prompt(
				`拯救保加利亚：将摧毁栏/移除栏的 AH/GE 单位以减损面放置在加利西亚 (当前已选 ${count} SCU当量, 每 3 SCU 当量 CP -1VP)。`
			)
			for (let p = 1; p < data.pieces.length; p++) {
				let info = data.pieces[p]
				if (info && (info.nation === "ah" || info.nation === "ge")) {
					// 规则：只能取回"摧毁栏"（eliminated）和"移出游戏"（removed-only）的单位；
					// 永久消灭（permanently eliminated）的单位不可通过此事件返回。
					if (Engine.game_utils.is_eliminated(game, p) || Engine.game_utils.is_removed_only(game, p)) {
						res.piece(p)
					}
				}
			}
			res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			rules.push_undo()
			let cost = Engine.game_utils.is_lcu(p) ? 3 : 1
			let data_event = rules.get_event_data()
			data_event.count = (data_event.count || 0) + cost
			let vps_to_deduct = Math.ceil(data_event.count / 3) - Math.ceil((data_event.count - cost) / 3)
			if (vps_to_deduct > 0) {
				game.vp -= vps_to_deduct
				rules.log(`拯救保加利亚：- ${vps_to_deduct} VP`)
			}
			game.pieces[p] = rules.find_space("Galicia")
			if (!rules.set_has(game.reduced, p)) rules.set_add(game.reduced, p)
			rules.log(`拯救保加利亚：${rules.piece_name(p, true)} 放置在 ${rules.space_name(rules.find_space("Galicia"))}`)
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_robertson_choice = {
		prompt(ctx) {
			let { res } = ctx
			res.prompt("罗伯逊：协约国必须选择一项")
			res.action("vp")
			res.action("remove")
		},
		vp(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.vp += 1
			rules.log("AP 选择了 +1 VP。")
			rules.goto_end_event()
		},
		remove(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.state = "event_robertson_remove"
		}
	}

	states.event_robertson_remove = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let data_event = rules.get_event_data()

			// 首次进入时统计各国及精锐单位可用师当量，用于校验最低比例要求
			if (!data_event.robertson_pool_initialized) {
				let br_avail = 0,
					anz_avail = 0,
					in_avail = 0,
					elite_avail = 0
				for (let p = 1; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (!info || info.faction !== AP) continue
					if (info.nation !== "br" && info.nation !== "anz" && info.nation !== "in") continue
					if (Engine.game_utils.is_not_on_map(game, p)) continue
					let badge = Engine.game_utils.get_piece_badge(p)
					if (
						badge === "cavalry" ||
						info.name.includes("Camel") ||
						info.name.includes("Persian") ||
						info.name.includes("Garrison")
					)
						continue
					if (info.nation === "br" && badge === "yellow") continue
					let cost = Engine.game_utils.is_lcu(p) ? 3 : 1
					if (info.nation === "br") br_avail += cost
					else if (info.nation === "anz") anz_avail += cost
					else if (info.nation === "in") in_avail += cost
					if (is_verdun_elite_or_special(p)) elite_avail += cost
				}
				data_event.robertson_br_avail = br_avail
				data_event.robertson_anz_avail = anz_avail
				data_event.robertson_in_avail = in_avail
				data_event.robertson_elite_avail = elite_avail
				data_event.robertson_pool_initialized = true
			}

			let count = data_event.count || 0
			let br_count = data_event.br_count || 0
			let anz_count = data_event.anz_count || 0
			let elite_count = data_event.elite_count || 0
			let br_avail = data_event.robertson_br_avail || 0
			let anz_avail = data_event.robertson_anz_avail || 0
			let elite_avail = data_event.robertson_elite_avail || 0

			// 校验 BR 优先规则及精锐规则（count=0 时始终通过）
			let is_valid = true
			if (count > 0) {
				let minimum = Math.ceil(count / 2)
				let br_min = Math.min(minimum, br_avail)
				let br_anz_min = Math.min(minimum, br_avail + anz_avail)
				let elite_min = Math.min(minimum, elite_avail)
				is_valid = br_count >= br_min && br_count + anz_count >= br_anz_min && elite_count >= elite_min
			}

			res.prompt(
				`罗伯逊：选择要移除的单位（已选${count}个师当量，至多3个，其中至少一半须为BR且至少一半须为精锐/特殊）`
			)

			if (count < 3) {
				for (let p = 1; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (!info || info.faction !== AP) continue
					if (info.nation !== "br" && info.nation !== "anz" && info.nation !== "in") continue
					if (Engine.game_utils.is_not_on_map(game, p)) continue
					let badge = Engine.game_utils.get_piece_badge(p)
					if (
						badge === "cavalry" ||
						info.name.includes("Camel") ||
						info.name.includes("Persian") ||
						info.name.includes("Garrison")
					)
						continue
					if (info.nation === "br" && badge === "yellow") continue
					let cost = Engine.game_utils.is_lcu(p) ? 3 : 1
					if (count + cost > 3) continue
					res.piece(p)
				}
			}

			if (is_valid) res.action("done")
		},
		piece(ctx) {
			let { rules, arg: p } = ctx
			rules.push_undo()
			let info = data.pieces[p]
			let cost = Engine.game_utils.is_lcu(p) ? 3 : 1
			let data_event = rules.get_event_data()
			data_event.count = (data_event.count || 0) + cost
			if (info.nation === "br") data_event.br_count = (data_event.br_count || 0) + cost
			else if (info.nation === "anz") data_event.anz_count = (data_event.anz_count || 0) + cost
			else if (info.nation === "in") data_event.in_count = (data_event.in_count || 0) + cost
			if (is_verdun_elite_or_special(p)) data_event.elite_count = (data_event.elite_count || 0) + cost
			rules.eliminate_piece(p, true)
		},
		done(ctx) {
			let { rules } = ctx
			rules.goto_end_event()
		}
	}

	states.event_kaiserschlacht_choice = {
		prompt(ctx) {
			prompt_kaiserschlacht_remove(ctx)
		},
		vp(ctx) {
			on_kaiserschlacht_confirm(ctx)
		},
		remove(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			game.state = "event_kaiserschlacht_remove"
		},
		piece(ctx) {
			on_kaiserschlacht_piece(ctx)
		},
		confirm(ctx) {
			on_kaiserschlacht_confirm(ctx)
		}
	}

	states.event_kaiserschlacht_remove = {
		prompt(ctx) {
			prompt_kaiserschlacht_remove(ctx)
		},
		piece(ctx) {
			on_kaiserschlacht_piece(ctx)
		},
		confirm(ctx) {
			on_kaiserschlacht_confirm(ctx)
		}
	}

	states.event_caucasian_army_reforms_eliminate = {
		prompt(ctx) {
			let { game, res, rules } = ctx
			let data_event = rules.get_event_data()
			let count = data_event.count || 0
			res.prompt(
				`高加索军队重组：立即永久消灭4个土耳其/土耳其-阿拉伯LCU当量（LCU=3，步兵SCU=1；LCU限地图/军团资产格，步兵SCU限地图/预备军格） (${count}/${CAUCASIAN_ARMY_REFORMS_TARGET})`
			)
			let found = false
			for (let p = 1; p < data.pieces.length; p++) {
				if (!Engine.events.is_caucasian_army_reforms_piece_eligible(game, p)) continue
				let cost = Engine.events.get_caucasian_army_reforms_piece_cost(p)
				if (count + cost > CAUCASIAN_ARMY_REFORMS_TARGET) continue
				if (!Engine.events.can_pay_caucasian_army_reforms_cost(game, count + cost, p)) continue
				res.piece(p)
				found = true
			}
			if (count >= CAUCASIAN_ARMY_REFORMS_TARGET || !found) res.action("done")
		},
		piece(ctx) {
			let { game, rules, arg: p } = ctx
			if (!Engine.events.is_caucasian_army_reforms_piece_eligible(game, p)) return
			let cost = Engine.events.get_caucasian_army_reforms_piece_cost(p)
			let count = rules.get_event_data().count || 0
			if (cost <= 0 || count + cost > CAUCASIAN_ARMY_REFORMS_TARGET) return
			if (!Engine.events.can_pay_caucasian_army_reforms_cost(game, count + cost, p)) return
			rules.push_undo()
			let data_event = rules.get_event_data()
			data_event.count = count + cost
			rules.eliminate_piece(p, true)
			if (data_event.count >= CAUCASIAN_ARMY_REFORMS_TARGET) {
				start_caucasian_army_reforms_reinforcements(game)
			}
		},
		done(ctx) {
			let { game, rules } = ctx
			rules.push_undo()
			let count = rules.get_event_data().count || 0
			if (count >= CAUCASIAN_ARMY_REFORMS_TARGET) {
				start_caucasian_army_reforms_reinforcements(game)
				return
			}
			rules.goto_end_event()
		}
	}

	return {
		states,
		get_activation_prompt,
		on_activation_done,
		check_liberate_suez_ops,
		begin_russo_british_russian_activation,
		begin_romania_event_attack_activation,
		is_russo_british_russian_activation(game) {
			return !!game.russo_british_russian_activation
		},
		is_romania_event_activation(game) {
			return !!game.romania_event_activation
		}
	}
}
