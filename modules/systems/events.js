"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const exports = {}

	const { set_add, set_has, random } = Engine.utils
	const { AP, CP, RESERVE, REMOVED } = Engine.constants
	const {
		find_space,
		find_piece,
		get_capacity,
		get_tribe_key_space,
		get_scu_reserve_box,
		get_lcu_reserve_box,
		is_reinforcement,
		get_season,
		get_year,
		is_turn_event,
		is_scu,
		is_lcu,
		is_eliminated,
		is_in_reserve,
		is_removed_only,
		is_piece_reduced,
		get_piece_effective_faction,
		get_piece_faction,
		get_reserve_box_for_piece,
		count_tribes_on_map,
		get_piece_nation,
		piece_counts_as_nation_for_rule,
		get_piece_badge,
		space_name,
		piece_name
	} = Engine.game_utils
	const {
		is_controlled_by,
		is_beachhead_space,
		get_pieces_in_space,
		is_balkans,
		is_neutral_persia_space,
		is_anatolia,
		is_caucasus,
		is_gallipoli,
		is_besieged,
		get_connected_spaces,
		get_rail_connections,
		get_connection_type,
		is_russia_controlled_space,
		has_allied_control_of_balfour_spaces
	} = Engine.map
	const { update_jihad_level } = Engine

	function space_log_name(s) {
		if (!data.spaces[s]) return space_name(s)
		return `s${s}`
	}

	function piece_log_name(game, p, reduced = null) {
		if (!data.pieces[p]) return piece_name(p)
		if (reduced === null) reduced = is_piece_reduced(game, p)
		return reduced ? `p${p}` : `P${p}`
	}
	// === Constants for Space IDs ===
	const SALONIKA = find_space("Salonika")
	const LEMNOS = find_space("Lemnos")
	const BAGHDAD = find_space("Baghdad")
	const GALICIA = find_space("Galicia")
	const PETROVSK = find_space("Petrovsk")
	const AP_ELIMINATED = find_space("AP Eliminated")
	const AP_REMOVED = find_space("AP Removed Box")
	const AP_PE = find_space("AP Permanently Eliminated Box")
	const AQABA = find_space("Aqaba")
	const JIDDAH = find_space("Jiddah")
	const CYPRUS = find_space("Cyprus")
	const DOIRAN = find_space("Doiran")
	const FORT_RUPEL = find_space("Ft. Rupel")
	const LAMIA = find_space("Lamia")
	const ATHENS = find_space("ATHENS")
	const CONSTANTINOPLE = find_space("CONSTANTINOPLE")
	const THERMAIKOS_BAY = find_space("Thermaikos Bay")
	const TO_ATHENS = find_space("to Athens")
	const ODESSA = find_space("Odessa")
	const CYPRUS_BEACHHEADS = ["To Adana", "To Beirut", "To Haifa", "To Jaffa"].map(find_space)
	const CAUCASIAN_ARMY_REFORMS_TARGET = 12
	const YILDRIM_OTTOMAN_SUPPLY_SOURCES = ["CONSTANTINOPLE", "Kayseri", "Erzincan", "Damascus", "Baghdad"]

	const WARM_WATER_PORTS = [
		"Mugla",
		"Antalya",
		"Mersin",
		"Adana",
		"Alexandretta",
		"Beirut",
		"Haifa",
		"Jaffa",
		"Fao",
		"Kuwait",
		"Smyrna"
	].map(find_space)
	const WARM_WATER_PORT_SET = new Set(WARM_WATER_PORTS)
	const ARMENIAN_UPRISING_BLUE_A_SPACES = [
		"Yozgat",
		"Sivas",
		"Kayseri",
		"Harput",
		"Diyarbekir",
		"Mus",
		"Bitlis",
		"Van",
		"Erzurum",
		"Alexandretta",
		"Erevan",
		"Trabzon"
	]

	function get_grand_duke_to_tiflis_vacant_azerbaijan_spaces(game) {
		let spaces = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!Engine.map.is_azerbaijan(s)) continue
			if (get_pieces_in_space(game, s).length === 0) {
				spaces.push(s)
			}
		}
		return spaces
	}

	// === Game Constants ===
	const STACKING_LIMIT = 3
	const NEUTRAL_ENTRY_CARD_IDS = new Set([29, 45, 88])

	/**
	 * 事件编写约定：
	 * 1) 事件临时数据统一写入 event_ctx.data（通过 start_event_data）。
	 * 2) 需要进入事件状态机（game.state = "event_*"）的事件，必须设置 defer_end: true。
	 * 3) 事件状态机内读取数据应使用 use_event / get_active_event_data（位于 event_states.js）。
	 * 4) 跨状态流程必须显式设置 game.active，避免提示方错误。
	 */

	/**
	 * 向游戏日志添加消息，支持 context.log 或 fallback 到 game.log
	 * @param {object} game 游戏实例
	 * @param {string} msg 消息内容
	 * @param {object} ctx 上下文对象
	 */
	function log(game, msg, ctx) {
		if (ctx && typeof ctx.log === "function") {
			ctx.log(msg)
			return
		}
		let text = msg
		if (text === null || text === undefined) text = ""
		if (typeof text !== "string") text = String(text)
		if (game && Array.isArray(game.log)) game.log.push(text)
		else console.log(text)
	}

	function card_names(cards, ctx) {
		if (ctx && typeof ctx.card_name === "function") {
			return Array.isArray(cards) ? cards.map((card) => ctx.card_name(card)) : []
		}
		return Engine.card_names(cards)
	}

	function ensure_cp_auto_victory_marker(game) {
		if (game.cp_auto_victory_marker === undefined) game.cp_auto_victory_marker = null
		return game.cp_auto_victory_marker
	}

	function set_cp_auto_victory_marker(game, value, ctx) {
		let next = Number(value)
		if (!Number.isFinite(next)) return null
		next = Math.max(0, Math.floor(next))
		game.cp_auto_victory_marker = next
		log(game, `同盟国自动胜利标记设为 ${next}。`, ctx)
		return next
	}

	function shift_cp_auto_victory_marker(game, delta, ctx, reason) {
		if (delta === 0) return ensure_cp_auto_victory_marker(game)
		let current = ensure_cp_auto_victory_marker(game)
		if (!Number.isFinite(current)) return null
		let next = Math.max(0, Math.floor(current + Number(delta)))
		if (next !== current) {
			game.cp_auto_victory_marker = next
			if (reason) log(game, `${reason}：同盟国自动胜利标记移动至 ${next}。`, ctx)
			else log(game, `同盟国自动胜利标记移动至 ${next}。`, ctx)
		}
		return next
	}

	const PARVUS_MARKER_TURN = 5
	const REVOLUTION_MARKER_TURN = 9
	const SINAI_RAILROAD_EVENT = "xinai"

	function get_parvus_marker_turn(game) {
		if (!game.events || game.events["parvus_to_berlin"] === undefined) return undefined
		return PARVUS_MARKER_TURN
	}

	function get_revolution_marker_turn(game) {
		if (!game.events || game.events["parvus_to_berlin"] === undefined) return undefined
		return REVOLUTION_MARKER_TURN
	}

	function get_long_live_czar_turn(game) {
		if (!game.events || game.events["parvus_to_berlin"] === undefined) return undefined
		let offset = game.events["warm_water_port"] ? 2 : 0
		return PARVUS_MARKER_TURN + (game.russian_vp || 0) + offset
	}

	function get_sinai_railroad_value(game) {
		return game && game.events ? game.events[SINAI_RAILROAD_EVENT] : undefined
	}

	function is_sinai_railroad_complete(game) {
		let value = get_sinai_railroad_value(game)
		return value === true || (typeof value === "number" && game.turn >= value)
	}

	function get_sinai_railroad_turn(game) {
		let value = get_sinai_railroad_value(game)
		return typeof value === "number" && game.turn < value ? value : undefined
	}

	function can_use_sinai_railroad(game, faction) {
		return faction === AP && is_sinai_railroad_complete(game)
	}

	function complete_sinai_railroad_if_ready(game, log_fn) {
		if (!game || !game.events || typeof game.events[SINAI_RAILROAD_EVENT] !== "number") return false
		if (game.turn < game.events[SINAI_RAILROAD_EVENT]) return false
		game.events[SINAI_RAILROAD_EVENT] = true
		if (typeof log_fn === "function") {
			log_fn("Sinai Railroad completed: AP may use it for the remainder of the game.")
		}
		return true
	}

	function sync_russian_revolution_markers(game) {
		if (!game.events || game.events["parvus_to_berlin"] === undefined) return
		game.events["parvus_to_berlin"] = PARVUS_MARKER_TURN
		game.events["russian_revolution_timer"] = REVOLUTION_MARKER_TURN
		game.god_save_the_tsar = get_long_live_czar_turn(game)
	}

	function is_warm_water_port_space(s) {
		let info = data.spaces[s]
		if (!info || !WARM_WATER_PORT_SET.has(s)) return false
		if (!info.port) return false
		return info.nation === "tu" || info.nation === "tua"
	}

	function is_russian_warm_water_port_unit(game, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP || !info.piece_class) return false
		if (get_piece_effective_faction(game, p) !== AP) return false
		return info.nation === "ru" || piece_counts_as_nation_for_rule(game, p, "ru")
	}

	function has_russian_unit_in_space(game, s) {
		for (let p of get_pieces_in_space(game, s)) {
			if (is_russian_warm_water_port_unit(game, p)) return true
		}
		return false
	}

	function is_warm_water_port_russian_controlled(game, s) {
		let info = data.spaces[s]
		if (!info || !is_controlled_by(game, s, AP)) return false
		if (is_russia_controlled_space(game, s)) return true
		return !info.vp && has_russian_unit_in_space(game, s)
	}

	function is_warm_water_port_land_connection(game, a, b) {
		if (is_beachhead_space(game, a) || is_beachhead_space(game, b)) return false
		return get_connection_type(a, b) !== "strait"
	}

	function is_warm_water_port_trace_space(game, s, target) {
		let info = data.spaces[s]
		if (!info || !is_controlled_by(game, s, AP)) return false
		if (s === target) return is_warm_water_port_russian_controlled(game, s)
		if (s === PETROVSK) return true
		if (is_russia_controlled_space(game, s)) return true
		// Non-VP spaces do not record AP national control separately; AP land control is the available proxy.
		return !info.vp
	}

	function can_trace_warm_water_port_land_to_petrovsk(game, start) {
		if (start === PETROVSK) return true
		if (!is_warm_water_port_trace_space(game, start, start)) return false
		let visited = new Set([start])
		let queue = [start]
		let queue_head = 0
		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			for (let next of get_connected_spaces(game, current, undefined, AP, undefined, "supply")) {
				if (visited.has(next)) continue
				if (!is_warm_water_port_land_connection(game, current, next)) continue
				if (!is_warm_water_port_trace_space(game, next, start)) continue
				if (next === PETROVSK) return true
				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	function is_warm_water_port_option(game, s) {
		if (!is_warm_water_port_space(s)) return false
		if (!has_russian_unit_in_space(game, s)) return false
		if (!is_warm_water_port_russian_controlled(game, s)) return false
		return can_trace_warm_water_port_land_to_petrovsk(game, s)
	}

	function get_warm_water_port_options(game) {
		return WARM_WATER_PORTS.filter((s) => is_warm_water_port_option(game, s))
	}

	function apply_warm_water_port_effect(game, s) {
		game.warm_water_port = s
		game.warm_water_port_vp = s
		game.events["warm_water_port"] = true
		if (game.events["parvus_to_berlin"] !== undefined) sync_russian_revolution_markers(game)
		log(game, `不冻港：已在 ${space_log_name(s)} 建立。`)
	}

	function get_russian_revolution_level(game) {
		return (game.events && game.events["russian_revolution"]) || 0
	}

	function is_russian_revolution_subject_piece(p) {
		let info = data.pieces[p]
		if (!info) return false
		if (info.nation === "ru") return true
		return !!(info.name && info.name.startsWith("RU/PE"))
	}

	function is_yugoslav_revolution_survivor(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "RU/SB Yugo Infantry")
	}

	function is_russian_revolution_cavalry_candidate(p) {
		let info = data.pieces[p]
		return !!(
			info &&
			info.nation === "ru" &&
			info.piece_class === "SCU" &&
			info.badge === "cavalry" &&
			info.name &&
			info.name.startsWith("RU Cavalry")
		)
	}

	function is_russian_revolution_survivor_cavalry(game, p) {
		return !!(game && game.russian_revolution_survivor_cavalry === p)
	}

	function is_russian_revolution_survivor_piece(game, p) {
		return is_yugoslav_revolution_survivor(p) || is_russian_revolution_survivor_cavalry(game, p)
	}

	function is_transcaucasian_federation_piece(p) {
		let info = data.pieces[p]
		return !!(info && (info.name || "").match(/^(Arm Transcas|Geo Transcaucasian)/))
	}

	const RUSSIAN_REVOLUTION_TRANSCAS_NAMES = [
		"Arm Transcas #1",
		"Arm Transcas #2",
		"Arm Transcas #3",
		"Geo Transcaucasian #1",
		"Geo Transcaucasian #2"
	]

	const RUSSIAN_REVOLUTION_GE_REPLACEMENT_NAMES = ["GE DIV #1", "GE DIV #2", "GE DIV #3", "GE DIV #4"]

	function is_available_revolution_cavalry_choice(game, p) {
		if (!is_russian_revolution_cavalry_candidate(p)) return false
		if (Engine.game_utils.is_permanently_eliminated(game, p)) return false
		if (Engine.game_utils.is_eliminated(game, p)) return false
		return !(is_reinforcement(game, p) || is_removed_only(game, p));
	}

	function choose_default_revolution_cavalry_survivor(game) {
		if (Number.isInteger(game.russian_revolution_survivor_cavalry)) return game.russian_revolution_survivor_cavalry
		let candidates = get_russian_revolution_cavalry_choices(game)
		if (candidates.length === 0) return -1
		game.russian_revolution_survivor_cavalry = candidates[0]
		return candidates[0]
	}

	function get_russian_revolution_cavalry_choices(game) {
		let candidates = []
		for (let p = 1; p < data.pieces.length; p++) {
			if (is_available_revolution_cavalry_choice(game, p)) candidates.push(p)
		}
		candidates.sort((a, b) => {
			let a_on_map = game.pieces[a] > 0 && data.spaces[game.pieces[a]] && !Engine.game_utils.is_not_on_map(game, a)
			let b_on_map = game.pieces[b] > 0 && data.spaces[game.pieces[b]] && !Engine.game_utils.is_not_on_map(game, b)
			if (a_on_map !== b_on_map) return a_on_map ? -1 : 1
			return a - b
		})
		return candidates
	}

	function select_russian_revolution_cavalry_survivor(game, p) {
		if (!game.events) game.events = {}
		if (p === -1 || p === null || p === undefined) {
			game.russian_revolution_survivor_cavalry = -1
			game.events["russian_revolution_stage_4_cavalry_chosen"] = true
			return true
		}
		p = Number(p)
		if (!Number.isInteger(p)) return false
		if (!is_available_revolution_cavalry_choice(game, p) && game.russian_revolution_survivor_cavalry !== p) return false
		game.russian_revolution_survivor_cavalry = p
		game.events["russian_revolution_stage_4_cavalry_chosen"] = true
		return true
	}

	function is_piece_available_for_revolution_stage_effect(game, p) {
		if (!data.pieces[p]) return false
		if (Engine.game_utils.is_permanently_eliminated(game, p)) return false
		if (Engine.game_utils.is_eliminated(game, p)) return false
		if (is_removed_only(game, p)) return false
		return !is_reinforcement(game, p);
	}

	function apply_russian_revolution_stage_1(game, ctx) {
		if (game.events["russian_revolution_stage_1_applied"]) return
		game.events["russian_revolution_stage_1_applied"] = true
		if (!game.events["romania"]) {
			game.vp += 2
			game.events["romania_barred_by_russian_revolution"] = true
			log(game, "俄国革命阶段 1：罗马尼亚中立，VP +2，罗马尼亚不得通过事件参战。", ctx)
		}
	}

	function apply_russian_revolution_stage_2(game, ctx) {
		if (game.events["russian_revolution_stage_2_applied"]) return
		game.events["russian_revolution_stage_2_applied"] = true
		let corps_assets = get_lcu_reserve_box(AP)
		for (let p = 1; p < data.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info || !is_russian_revolution_subject_piece(p)) continue
			if (!is_piece_available_for_revolution_stage_effect(game, p)) continue
			if (info.type === "hq") continue
			if (info.piece_class === "LCU" && game.pieces[p] === corps_assets) {
				game.pieces[p] = Engine.game_utils.get_eliminated_box(AP)
				log(game, `俄国革命阶段 2：${info.name} 从预备军格中移除。`, ctx)
				continue
			}
			if (!set_has(game.reduced, p)) {
				set_add(game.reduced, p)
				log(game, `俄国革命阶段 2：${info.name} 减损。`, ctx)
			}
		}
	}

	function apply_russian_revolution_stage_3(game, ctx) {
		if (game.events["russian_revolution_stage_3_applied"]) return
		game.events["russian_revolution_stage_3_applied"] = true
		game.russian_revolution_limited_attack_turn = game.turn + 1
		game.russian_revolution_ru_attack_used = false
		log(game, `俄国革命阶段 3：俄国单位在第 ${game.russian_revolution_limited_attack_turn} 回合只能进行一次进攻。`, ctx)
	}

	function remove_russian_revolution_stage_4_ru_units(game, ctx) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_ru_units_removed"]) return
		game.events["russian_revolution_stage_4_ru_units_removed"] = true
		let kept_cavalry = Number.isInteger(game.russian_revolution_survivor_cavalry)
			? game.russian_revolution_survivor_cavalry
			: choose_default_revolution_cavalry_survivor(game)
		for (let p = 1; p < data.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info || !is_russian_revolution_subject_piece(p)) continue
			if (is_yugoslav_revolution_survivor(p) || p === kept_cavalry) continue
			if (Engine.game_utils.is_permanently_eliminated(game, p)) continue
			Engine.game_utils.eliminate_piece(game, p, (msg) => log(game, msg, ctx), true)
		}
		if (kept_cavalry >= 0) {
			log(game, `俄国革命阶段 4：${data.pieces[kept_cavalry].name} 保留，其被视为英国单位（MO除外）。`, ctx)
		}
	}

	function get_georgian_protectorate_piece(game) {
		let p = find_piece(CP, "GE GeoProtect")
		if (p < 0 || !is_reinforcement(game, p)) return -1
		return p
	}

	function get_georgian_protectorate_placement_spaces(game) {
		if (get_georgian_protectorate_piece(game) < 0) return []
		return [find_space("Batum"), find_space("TIFLIS")].filter((s) => {
			if (!(s > 0 && data.spaces[s])) return false
			return get_pieces_in_space(game, s).length === 0
		})
	}

	function sort_georgian_protectorate_default_spaces(game, spaces) {
		return spaces.slice().sort((a, b) => {
			let a_ap = is_controlled_by(game, a, AP)
			let b_ap = is_controlled_by(game, b, AP)
			if (a_ap !== b_ap) return a_ap ? -1 : 1
			return a - b
		})
	}

	function place_georgian_protectorate(game, s, ctx) {
		let p = get_georgian_protectorate_piece(game)
		if (p < 0) return false
		let options = get_georgian_protectorate_placement_spaces(game)
		if (!options.includes(s)) return false
		if (!game.events) game.events = {}
		game.events["russian_revolution_stage_4_geoprotect_done"] = true
		if (is_controlled_by(game, s, CP)) {
			game.vp -= 1
			log(game, `俄国革命阶段 4：Georgian Protectorate放置在同盟国控制的 ${space_log_name(s)}，VP -1。`, ctx)
		} else {
			log(game, `俄国革命阶段 4：Georgian Protectorate放置在 ${space_log_name(s)}。`, ctx)
		}
		game.pieces[p] = s
		return true
	}

	function place_default_georgian_protectorate(game, ctx) {
		let options = sort_georgian_protectorate_default_spaces(game, get_georgian_protectorate_placement_spaces(game))
		if (options.length === 0) return
		place_georgian_protectorate(game, options[0], ctx)
	}

	function skip_georgian_protectorate(game, ctx) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_geoprotect_done"]) return
		game.events["russian_revolution_stage_4_geoprotect_done"] = true
		if (get_georgian_protectorate_piece(game) >= 0) {
			log(game, "俄国革命阶段 4：Georgian Protectorate未放置。", ctx)
		}
	}

	function can_place_transcaucasian_federation_piece(game, p, s) {
		if (!data.pieces[p] || !is_transcaucasian_federation_piece(p)) return false
		if (!(s > 0 && data.spaces[s])) return false
		if (!is_controlled_by(game, s, AP)) return false
		if (!(Engine.map.is_russia(s) || Engine.map.is_caucasus(s))) return false
		return Engine.map.can_place_piece_in_space(game, s, p)
	}

	function get_transcaucasian_placement_spaces(game, p) {
		let spaces = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (can_place_transcaucasian_federation_piece(game, p, s)) spaces.push(s)
		}
		return spaces
	}

	function get_unplaced_transcaucasian_federation_pieces(game) {
		let skipped = new Set(game.russian_revolution_stage_4_transcas_skipped || [])
		let pieces = []
		for (let name of RUSSIAN_REVOLUTION_TRANSCAS_NAMES) {
			let p = find_piece(CP, name)
			if (p >= 0 && is_reinforcement(game, p) && !skipped.has(p)) pieces.push(p)
		}
		return pieces
	}

	function get_next_transcaucasian_federation_piece_to_place(game, ctx) {
		while (true) {
			let pieces = get_unplaced_transcaucasian_federation_pieces(game)
			if (pieces.length === 0) return -1
			let p = pieces[0]
			if (get_transcaucasian_placement_spaces(game, p).length > 0) return p
			skip_transcaucasian_federation_piece(game, p, ctx)
		}
	}

	function get_current_transcaucasian_federation_piece_to_place(game) {
		for (let p of get_unplaced_transcaucasian_federation_pieces(game)) {
			if (get_transcaucasian_placement_spaces(game, p).length > 0) return p
		}
		return -1
	}

	function skip_transcaucasian_federation_piece(game, p, ctx) {
		if (!Array.isArray(game.russian_revolution_stage_4_transcas_skipped)) {
			game.russian_revolution_stage_4_transcas_skipped = []
		}
		set_add(game.russian_revolution_stage_4_transcas_skipped, p)
		let name = data.pieces[p] ? data.pieces[p].name : `p${p}`
		log(game, `俄国革命阶段 4：没有合法的协约国控制的俄国/高加索地块来放置 ${name}。`, ctx)
	}

	function place_transcaucasian_federation_piece(game, p, s, ctx) {
		if (!can_place_transcaucasian_federation_piece(game, p, s)) return false
		if (!is_reinforcement(game, p)) return false
		game.pieces[p] = s
		log(game, `俄国革命阶段 4：${data.pieces[p].name} 放置在 ${space_log_name(s)}。`, ctx)
		return true
	}

	function finish_transcaucasian_federation_placement(game) {
		if (!game.events) game.events = {}
		game.events["russian_revolution_stage_4_transcas_done"] = true
		delete game.russian_revolution_stage_4_transcas_selected
		delete game.russian_revolution_stage_4_transcas_skipped
	}

	function place_default_transcaucasian_federation(game, ctx) {
		while (true) {
			let units = get_unplaced_transcaucasian_federation_pieces(game)
			if (units.length === 0) break
			let p = units[0]
			let spaces = get_transcaucasian_placement_spaces(game, p)
			if (spaces.length === 0) {
				skip_transcaucasian_federation_piece(game, p, ctx)
				continue
			}
			place_transcaucasian_federation_piece(game, p, spaces[0], ctx)
		}
		finish_transcaucasian_federation_placement(game)
	}

	function place_soviet_uprising_markers(game, ctx) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_soviet_done"]) return
		game.events["russian_revolution_stage_4_soviet_done"] = true
		let spaces = ["Baku", "Central Asia", "Enzeli"].map(find_space).filter((s) => s > 0)
		game.soviet_uprising_markers = spaces
		log(game, "俄国革命阶段 4：苏维埃起义标记已放置。", ctx)
	}

	function prepare_ge_ix_army_replacement(game, ctx) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_ge_ix_prepared"]) return
		game.events["russian_revolution_stage_4_ge_ix_prepared"] = true
		let ge_ix = find_piece(CP, "GE IX Army")
		if (ge_ix < 0 || !is_piece_available_for_revolution_stage_effect(game, ge_ix)) {
			game.events["russian_revolution_stage_4_ge_ix_done"] = true
			return
		}
		game.russian_revolution_stage_4_ge_ix_space = game.pieces[ge_ix]
		Engine.game_utils.eliminate_piece(game, ge_ix, (msg) => log(game, msg, ctx), true)
	}

	function get_ge_ix_replacement_space(game) {
		let s = game.russian_revolution_stage_4_ge_ix_space
		return s > 0 && data.spaces[s] ? s : -1
	}

	function get_ge_ix_replacement_pieces(game) {
		let reserve = get_scu_reserve_box(CP)
		let pieces = []
		for (let name of RUSSIAN_REVOLUTION_GE_REPLACEMENT_NAMES) {
			let p = find_piece(CP, name)
			if (p >= 0 && game.pieces[p] === reserve) pieces.push(p)
		}
		return pieces
	}

	function replace_ge_ix_army_with_scu(game, p, ctx) {
		if (!get_ge_ix_replacement_pieces(game).includes(p)) return false
		let space = get_ge_ix_replacement_space(game)
		if (!(space > 0)) return false
		if (!game.events) game.events = {}
		game.events["russian_revolution_stage_4_ge_ix_done"] = true
		game.pieces[p] = space
		log(game, `俄国革命阶段 4：GE IX Army 被 ${data.pieces[p].name} 替换。`, ctx)
		delete game.russian_revolution_stage_4_ge_ix_space
		return true
	}

	function skip_ge_ix_army_replacement(game, ctx) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_ge_ix_done"]) return
		game.events["russian_revolution_stage_4_ge_ix_done"] = true
		if (get_ge_ix_replacement_space(game) > 0 && get_ge_ix_replacement_pieces(game).length > 0) {
			log(game, "俄国革命阶段 4：GE IX Army 未被替换。", ctx)
		}
		delete game.russian_revolution_stage_4_ge_ix_space
	}

	function apply_russian_revolution_stage_4(game, ctx) {
		if (game.events["russian_revolution_stage_4_applied"]) return
		let kept_cavalry = choose_default_revolution_cavalry_survivor(game)
		select_russian_revolution_cavalry_survivor(game, kept_cavalry)
		remove_russian_revolution_stage_4_ru_units(game, ctx)
		place_default_georgian_protectorate(game, ctx)
		if (!game.events["russian_revolution_stage_4_geoprotect_done"]) skip_georgian_protectorate(game, ctx)
		place_default_transcaucasian_federation(game, ctx)
		place_soviet_uprising_markers(game, ctx)
		prepare_ge_ix_army_replacement(game, ctx)
		let replacements = get_ge_ix_replacement_pieces(game)
		if (replacements.length > 0 && get_ge_ix_replacement_space(game) > 0) {
			replace_ge_ix_army_with_scu(game, replacements[0], ctx)
		} else {
			skip_ge_ix_army_replacement(game, ctx)
		}
		game.events["russian_revolution_stage_4_applied"] = true
		delete game.russian_revolution_stage_4_transcas_selected
		delete game.russian_revolution_stage_4_transcas_skipped
		delete game.russian_revolution_stage_4_ge_ix_space
	}

	function begin_russian_revolution_stage_4_interactive(game) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_applied"]) return false
		game.events["russian_revolution_stage_4_started"] = true
		return true
	}

	function finish_russian_revolution_stage_4(game) {
		if (!game.events) game.events = {}
		game.events["russian_revolution_stage_4_applied"] = true
		delete game.russian_revolution_stage_4_transcas_selected
		delete game.russian_revolution_stage_4_transcas_skipped
		delete game.russian_revolution_stage_4_ge_ix_space
	}

	function apply_russian_revolution_stage_effects(game, stage, ctx) {
		if (!game.events) game.events = {}
		if (stage >= 1) apply_russian_revolution_stage_1(game, ctx)
		if (stage >= 2) apply_russian_revolution_stage_2(game, ctx)
		if (stage >= 3) apply_russian_revolution_stage_3(game, ctx)
		if (stage >= 4) apply_russian_revolution_stage_4(game, ctx)
	}

	function can_record_russian_rp(game) {
		if (get_russian_revolution_level(game) >= 1) return false
		return !exports.is_ru_rp_blocked(game)
	}

	function has_russian_piece_for_revolution_rule(game, pieces, purpose = "activation") {
		if (!Array.isArray(pieces)) return false
		return pieces.some((p) => piece_counts_as_nation_for_rule(game, p, "ru", purpose))
	}

	function has_russian_combat_activation_penalty(game, pieces) {
		return get_russian_revolution_level(game) >= 1 && has_russian_piece_for_revolution_rule(game, pieces, "activation")
	}

	function is_russian_revolution_ru_attack_limited(game) {
		return !!(
			game &&
			game.russian_revolution_limited_attack_turn === game.turn &&
			game.russian_revolution_ru_attack_used
		)
	}

	function is_russian_revolution_ru_attack_blocked(game, pieces) {
		return is_russian_revolution_ru_attack_limited(game) && has_russian_piece_for_revolution_rule(game, pieces, "activation")
	}

	function register_russian_revolution_ru_attack(game, pieces) {
		if (!(game && game.russian_revolution_limited_attack_turn === game.turn)) return
		if (has_russian_piece_for_revolution_rule(game, pieces, "activation")) {
			game.russian_revolution_ru_attack_used = true
		}
	}

	function format_mo_log_name(mo) {
		return Engine.mo && typeof Engine.mo.mo_name === "function" ? Engine.mo.mo_name(mo) : mo
	}

	function start_event_data(game, ctx, key, data) {
		if (ctx && typeof ctx.start_event === "function") {
			return ctx.start_event(key, data)
		}
		if (!game.event_ctx || typeof game.event_ctx !== "object" || Array.isArray(game.event_ctx)) {
			game.event_ctx = {}
		}
		if (game.event_ctx.key === key) {
			if (!game.event_ctx.data || typeof game.event_ctx.data !== "object" || Array.isArray(game.event_ctx.data)) {
				game.event_ctx.data = {}
			}
			if (data && typeof data === "object" && !Array.isArray(data)) {
				Object.assign(game.event_ctx.data, data)
			}
			return game.event_ctx.data
		}
		game.event_ctx = { key, data: {} }
		if (data && typeof data === "object" && !Array.isArray(data)) {
			Object.assign(game.event_ctx.data, data)
		}
		return game.event_ctx.data
	}

	function block_kaiserschlacht_german_rp(game, ctx) {
		if (!game.events) game.events = {}
		game.events["kaiserschlacht_rp_block_turn"] = game.turn
		if (game.rp_cp && game.rp_cp.ge > 0) {
			game.rp_cp.ge = 0
			log(game, "皇帝攻势：本回合德国补员点数不可用，现有 GE RP 清零。", ctx)
		}
	}

	function get_caucasian_army_reforms_piece_cost(p) {
		if (is_lcu(p)) return 3
		if (!is_scu(p)) return 0
		let badge = get_piece_badge(p)
		return badge === "infantry" || badge === "blue" ? 1 : 0
	}

	function is_caucasian_army_reforms_piece_eligible(game, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== CP) return false
		if (info.nation !== "tu" && info.nation !== "tua") return false

		let cost = get_caucasian_army_reforms_piece_cost(p)
		if (cost <= 0) return false

		if (Engine.game_utils.is_in_reserve(game, p)) return true
		return !Engine.game_utils.is_not_on_map(game, p)
	}

	function can_pay_caucasian_army_reforms_cost(game, current_cost = 0, skip_piece = -1) {
		let remaining_cost = CAUCASIAN_ARMY_REFORMS_TARGET - current_cost
		if (remaining_cost < 0) return false
		if (remaining_cost === 0) return true

		let lcu_count = 0
		let scu_count = 0
		for (let p = 1; p < data.pieces.length; p++) {
			if (p === skip_piece) continue
			if (!is_caucasian_army_reforms_piece_eligible(game, p)) continue
			if (is_lcu(p)) lcu_count++
			else scu_count++
		}

		for (let lcus_to_use = 0; lcus_to_use <= Math.min(lcu_count, Math.floor(remaining_cost / 3)); lcus_to_use++) {
			let scu_needed = remaining_cost - lcus_to_use * 3
			if (scu_needed <= scu_count) return true
		}

		return false
	}

	function has_allied_lcu_in_verdun_restricted_zone(game) {
		for (let p = 1; p < data.pieces.length; p++) {
			if (!is_lcu(p) || get_piece_faction(p) !== AP) continue
			if (Engine.game_utils.is_not_on_map(game, p)) continue
			let s = game.pieces[p]
			if (is_beachhead_space(game, s)) continue
			if (is_anatolia(s) || is_gallipoli(s)) return true
		}
		return false
	}

	function get_pending_reinf_units(game) {
		if (
			game.event_ctx &&
			game.event_ctx.data &&
			Array.isArray(game.event_ctx.data.reinf_to_place) &&
			game.event_ctx.data.reinf_to_place.length > 0
		) {
			return game.event_ctx.data.reinf_to_place
		}
		if (game.event_ctx && game.event_ctx.key && game.events) {
			let event = game.events[game.event_ctx.key]
			if (event && Array.isArray(event.reinf_to_place) && event.reinf_to_place.length > 0) {
				return event.reinf_to_place
			}
		}
		return null
	}

	/**
	 * 检查地块是否被围攻
	 * @param {object} game 游戏实例
	 * @param {number} s 地块 ID
	 * @returns {boolean}
	 */
	/**
	 * 增援检查通用辅助函数
	 * @param {object} game 游戏实例
	 * @param {number} s 地块 ID
	 * @param {number} faction 阵营 (AP 或 CP)
	 * @param {function} extra_check 额外的地块检查逻辑
	 * @returns {boolean}
	 */
	function check_reinforcement_space(game, s, faction, extra_check) {
		let space = data.spaces[s]
		if (!space) return false
		if (extra_check(space, s)) {
			if (Engine.map.is_controlled_by(game, s, faction)) {
				return !is_besieged(game, s)
			}
		}
		return false
	}

	function has_enemy_units_in_space(game, s, faction) {
		let enemy = Engine.map.other_faction(faction)
		let pieces = get_pieces_in_space(game, s)
		for (let p of pieces) {
			let info = data.pieces[p]
			if (info && info.faction === enemy) return true
		}
		return false
	}

	function is_allied_solidarity_balkan_beachhead(game, s) {
		if (!is_beachhead_space(game, s)) return false
		return s === THERMAIKOS_BAY || s === TO_ATHENS
	}

	function is_allied_solidarity_general_space(game, s) {
		return check_reinforcement_space(game, s, AP, (space, s) => {
			if (is_german_subs_blocked_port(game, s)) return false
			return !!(
				space &&
				((space.port && is_balkans(s)) || is_allied_solidarity_balkan_beachhead(game, s) || s === LEMNOS)
			)
		})
	}

	function can_allied_solidarity_use_neutral_salonika(game, unit_name) {
		if (unit_name !== "GR National Defense") return false
		if (SALONIKA < 0 || !data.spaces[SALONIKA]) return false
		if (!Engine.neutral || typeof Engine.neutral.is_greece_neutral !== "function") return false
		if (!Engine.neutral.is_greece_neutral(game)) return false
		if (is_controlled_by(game, SALONIKA, AP) || is_controlled_by(game, SALONIKA, CP)) return false
		if (is_german_subs_blocked_port(game, SALONIKA)) return false
		return true
	}

	function get_allied_solidarity_location_options(game, unit_name) {
		let options = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (is_allied_solidarity_general_space(game, s)) {
				options.push(s)
			}
		}
		if (unit_name === "RU 2/4 Special" && check_reinforcement_space(game, ODESSA, AP, () => true)) {
			options.push(ODESSA)
		}
		if (can_allied_solidarity_use_neutral_salonika(game, unit_name)) {
			options.push(SALONIKA)
		}
		return options
	}

	function get_allied_solidarity_space_options(game, unit_name) {
		let options = get_allied_solidarity_location_options(game, unit_name)
		let p = unit_name ? find_piece(AP, unit_name) : -1
		if (p < 0) return options
		return options.filter((s) => Engine.map.can_place_piece_in_space(game, s, p))
	}

	function can_place_allied_solidarity_units(game, units, index = 0) {
		if (!Array.isArray(units) || index >= units.length) return true
		let unit_name = units[index]
		let options = get_allied_solidarity_space_options(game, unit_name)
		for (let s of options) {
			let next = Engine.utils.object_copy(game)
			reinforce(next, unit_name, AP, s)
			if (unit_name === "GR National Defense" && s === SALONIKA && !is_controlled_by(next, s, AP)) {
				if (typeof Engine.set_control === "function") {
					Engine.set_control(next, s, AP)
				} else {
					if (!next.control) next.control = []
					next.control[s] = AP
				}
				if (!next.events) next.events = {}
				next.events["salonika_is_port"] = true
			}
			if (can_place_allied_solidarity_units(next, units, index + 1)) {
				return true
			}
		}
		return false
	}

	function is_brf_35_dunsterforce_space(game, s) {
		return is_brf_35_spers_space(game, s) || (s === BAGHDAD && Engine.map.is_controlled_by(game, s, AP))
	}

	function is_brf_35_spers_space(game, s) {
		return (Engine.map.is_persia(s) || Engine.map.is_arabistan(s)) && Engine.map.is_controlled_by(game, s, AP)
	}

	function is_constantinople_rail_connected_to_galicia(game) {
		if (CONSTANTINOPLE < 0 || GALICIA < 0) return false
		if (!is_controlled_by(game, CONSTANTINOPLE, CP) || !is_controlled_by(game, GALICIA, CP)) return false
		let queue = [CONSTANTINOPLE]
		let queue_head = 0
		let visited = new Set([CONSTANTINOPLE])
		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			if (current === GALICIA) return true
			for (let next of get_rail_connections(game, current, CP)) {
				if (visited.has(next)) continue
				if (Engine.map.contains_enemy_pieces(game, next, CP) && !is_besieged(game, next)) continue
				if (!is_controlled_by(game, next, CP)) continue
				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	function is_yildrim_supply_source_connected_to_galicia(game, source) {
		let space = data.spaces[source]
		if (!space || GALICIA < 0) return false
		if (!YILDRIM_OTTOMAN_SUPPLY_SOURCES.includes(space.name)) return false
		if (!is_controlled_by(game, source, CP) || !is_controlled_by(game, GALICIA, CP)) return false
		if (is_besieged(game, source)) return false

		let queue = [GALICIA]
		let queue_head = 0
		let visited = new Set([GALICIA])
		while (queue_head < queue.length) {
			let current = queue[queue_head++]
			if (current === source) return true
			for (let next of get_connected_spaces(game, current, undefined, CP, undefined, "supply")) {
				if (visited.has(next)) continue
				if (Engine.map.contains_enemy_pieces(game, next, CP) && !is_besieged(game, next)) continue
				if (!is_controlled_by(game, next, CP)) continue
				visited.add(next)
				queue.push(next)
			}
		}
		return false
	}

	Engine.reinf_helpers = {
		is_br: {
			faction: AP,
			desc: "任何英国补给源或协约国控制的港口",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space) return false
				if (s === SALONIKA && !Engine.map.is_controlled_by(game, s, AP)) return false
				if (is_german_subs_blocked_port(game, s)) return false

				// 1. 英国补给源 (根据 7.7.5, 即使被敌方控制也可以放置)
				if (Engine.map.is_base_supply_source(game, s, AP, "br", true)) {
					return true
				}

				// 2. 协约国控制的港口/已建立滩头 (排除特定地块)
				if (Engine.map.is_ap_controlled_port_or_beachhead(game, s)) {
					// 排除 阿卡巴、吉达、黑海港口、里海港口
					if (s === AQABA || s === JIDDAH) return false
					if (Engine.map.is_black_sea_port(game, s) || Engine.map.is_caspian_sea_port(game, s)) return false

					let besieged = is_besieged(game, s)
					if (!besieged) {
						return true
					}
				}

				// 3. 岛屿基地 (如果被协约国控制)
				if (space.island_base && Engine.map.is_controlled_by(game, s, AP)) {
					let besieged = is_besieged(game, s)
					if (!besieged) {
						if (game.debug)
							console.log(
								`[调试] 地块 ${space.name} (ID: ${s}) 是协约国控制的岛屿基地且未被围攻，允许放置增援。`
							)
						return true
					}
				}
				return false
			}
		},
		is_brf_35_rein: {
			faction: AP,
			desc: (game, unit_name) => {
				if (unit_name === "BR Dunsterforce")
					return "协约国控制的波斯或阿拉伯斯坦地区/大区、或协约国控制的巴格达"
				return "协约国控制的波斯或阿拉伯斯坦地区/大区"
			},
			check: function (game, s) {
				let units = get_pending_reinf_units(game)
				if (!units || units.length === 0) return false
				let unit = units[0]
				if (s === get_scu_reserve_box(AP)) return true
				if (unit === "BR Dunsterforce") {
					return is_brf_35_dunsterforce_space(game, s)
				}
				return is_brf_35_spers_space(game, s)
			}
		},
		is_brf_35_dunsterforce_rein: {
			faction: AP,
			desc: "协约国控制的波斯或阿拉伯斯坦地区/大区、或协约国控制的巴格达",
			check: is_brf_35_dunsterforce_space
		},
		is_brf_35_spers_rein: {
			faction: AP,
			desc: "协约国控制的波斯或阿拉伯斯坦地区/大区",
			check: is_brf_35_spers_space
		},
		is_tu: {
			faction: CP,
			desc: "君士坦丁堡、开塞利、埃尔津詹或者预备军格",
			check: (game, s) =>
				check_reinforcement_space(game, s, CP, (space) => {
					const allowed = ["CONSTANTINOPLE", "Kayseri", "Erzincan", "CP Reserve"]
					return allowed.includes(space.name)
				})
		},
		is_tua: {
			faction: CP,
			desc: "巴格达、大马士革或者预备军格",
			check: (game, s) =>
				check_reinforcement_space(game, s, CP, (space) => {
					const allowed = ["Baghdad", "Damascus", "CP Reserve"]
					return allowed.includes(space.name)
				})
		},
		is_grah: {
			faction: CP,
			desc: "加里西亚 (Galicia)",
			check: (game, s) => check_reinforcement_space(game, s, CP, () => s === GALICIA)
		},
		is_frit: {
			faction: AP,
			desc: "协约国控制的东地中海或爱琴海港口",
			check: (game, s) =>
				check_reinforcement_space(game, s, AP, (space, s) => {
					// Rule 13.3.2: 德国潜艇地中海猎袭期间，不能在特定港口增援
					if (is_german_subs_blocked_port(game, s)) return false
					return Engine.map.is_aegean_east_med_port_or_beachhead(game, s)
				})
		},
		is_ru_sphere_rein: {
			faction: AP,
			desc: "协约国控制、空置且有铁路连接至俄国补给点的俄国或阿塞拜疆地区",
			check: (game, s) =>
				check_reinforcement_space(game, s, AP, (space, s) => {
					let is_ru_or_az = Engine.map.is_russia(s) || Engine.map.is_azerbaijan(s)
					let is_empty = Engine.map.get_pieces_in_space(game, s).length === 0
					let ru_sources = Engine.map.get_ru_supply_sources(game, true)
					let is_rail_connected = Engine.map.is_connected_by_rail(game, s, AP, ru_sources)

					return !!(is_ru_or_az && is_empty && is_rail_connected)
				})
		},
		is_ru_rein: {
			faction: AP,
			desc: "协约国控制的俄国补给点 (敖德萨、第比利斯、彼得罗夫斯克、中亚大区或被占领的特拉布宗)",
			check: (game, s) =>
				check_reinforcement_space(game, s, AP, (space, s) => {
					const name = space.name
					if (["Odessa", "TIFLIS", "Central Asia", "Petrovsk"].includes(name)) return true
					return !!(name === "Trabzon" && game.vps && game.vps[s] === "ru")
				})
		},
		is_arab_revolt_rein: {
			faction: AP,
			desc: "汉志大区",
			check: (game, s) => check_reinforcement_space(game, s, AP, (space, s) => Engine.map.is_hejaz(s))
		},
		is_allied_solidarity_rein: {
			faction: AP,
			desc: "巴尔干内任一协约国控制港口或滩头标记，包括利姆诺斯岛；希腊国防军也可放置至中立萨洛尼卡",
			check: (game, s) => {
				let units = get_pending_reinf_units(game)
				let unit_name = units && units.length > 0 ? units[0] : null
				if (can_allied_solidarity_use_neutral_salonika(game, unit_name) && s === SALONIKA) {
					return true
				}
				return is_allied_solidarity_general_space(game, s)
			}
		},
		is_ap_invasion_rein: {
			faction: AP,
			desc: (game, unit_name) => {
				let p = find_piece(AP, unit_name)
				let info = p >= 0 ? data.pieces[p] : null
				if (!info) return "该单位的正常协约国增援位置"
				if (["fr", "it"].includes(info.nation)) return "任何协约国控制的东地中海或爱琴海港口"
				return "任何英国补给源或协约国控制的港口"
			},
			check: (game, s) => {
				let units = get_pending_reinf_units(game)
				if (!units || units.length === 0) return false
				let unit_name = units[0]
				let p = find_piece(AP, unit_name)
				let info = p >= 0 ? data.pieces[p] : null
				if (!info) return false
				if (["fr", "it"].includes(info.nation)) {
					return Engine.reinf_helpers.is_frit.check(game, s)
				}
				return Engine.reinf_helpers.is_br.check(game, s)
			}
		},
		is_serb_return_rein: {
			faction: AP,
			desc: "利姆诺斯 (Lemnos)、协约国控制的萨洛尼卡 (Salonika) 或协约国预备军格",
			check: function (game, s) {
				let units = get_pending_reinf_units(game)
				if (!units || units.length === 0) return false
				let unit_name = units[0]
				let is_army = unit_name.includes("Army")

				if (is_army) {
					// LCU只能放协约国预备军格 (AP Corps Assets)
					return s === get_lcu_reserve_box(AP)
				} else {
					// 师和骑兵可以放萨洛尼卡(需协约国控制)或利姆诺斯或预备军格
					// Rule 13.3.2: 德国潜艇地中海猎袭期间，不能在萨洛尼卡或利姆诺斯增援
					if (is_german_subs_blocked_port(game, s)) return false

					if (s === SALONIKA || s === LEMNOS) {
						return Engine.map.is_controlled_by(game, s, AP) && !is_besieged(game, s)
					}
					if (s === get_scu_reserve_box(AP)) {
						return true
					}
				}
				return false
			}
		},
		is_bulgarian_entry_rein: {
			faction: CP,
			desc: "任何未驻有协约国单位的保加利亚地块",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space || space.nation !== "bu") return false
				if (!game.events || !game.events["bulgaria"]) return false
				return !has_enemy_units_in_space(game, s, CP)
			}
		},
		is_bu_bulgaria: {
			faction: CP,
			desc: "任何保加利亚境内同盟国控制地区",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space || space.nation !== "bu") return false
				if (is_besieged(game, s)) return false
				return Engine.map.is_controlled_by(game, s, CP)
			}
		},
		is_serbian_entry_rein: {
			faction: AP,
			desc: "任何未驻有同盟国单位的塞尔维亚地块",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space || space.nation !== "sb") return false
				if (!game.events || !game.events["bulgaria"]) return false
				return !has_enemy_units_in_space(game, s, AP)
			}
		},
		is_romanian_entry_rein: {
			faction: AP,
			desc: "任何未驻有同盟国单位的罗马尼亚地块",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space || space.nation !== "ro") return false
				if (!game.events || !game.events["romania"]) return false
				return !has_enemy_units_in_space(game, s, AP)
			}
		},
		is_yildrim_rein: {
			faction: CP,
			desc: "任何同盟国控制且可经同盟国控制地块连接至加利西亚(Galicia)的土耳其补给源",
			check: function (game, s) {
				let space = data.spaces[s]
				if (!space) return false
				return is_yildrim_supply_source_connected_to_galicia(game, s)
			}
		},
		is_caucasian_army_reforms_rein: {
			faction: CP,
			desc: "安纳托利亚、高加索或加里波利的同盟国控制地区",
			check: (game, s) =>
				check_reinforcement_space(
					game,
					s,
					CP,
					(space, s) => is_anatolia(s) || is_caucasus(s) || is_gallipoli(s)
				)
		},
		is_secret_treaty_rein: {
			faction: AP,
			desc: "任何波斯大区",
			check: (game, s) => {
				// 英国波斯宪兵师只能在三个波斯大区（东、中、南波斯）重建/增援，即使被同盟国控制
				const region = Engine.map.get_region(s)
				return region === "east persia" || region === "central persia" || region === "south persia"
			}
		}
	}

	function finish_event(ctx) {
		if (ctx && typeof ctx.goto_end_event === "function") {
			ctx.goto_end_event()
			return
		}
		if (ctx && typeof ctx.goto_end_operations === "function") {
			ctx.goto_end_operations()
		}
	}

	function can_play_neutral_entry_this_turn(game) {
		function was_neutral_entry_event_action(action) {
			return !!(action && action.type === "event" && NEUTRAL_ENTRY_CARD_IDS.has(action.card))
		}
		let ap_actions = Array.isArray(game.ap_actions) ? game.ap_actions : []
		let cp_actions = Array.isArray(game.cp_actions) ? game.cp_actions : []
		return !ap_actions.some(was_neutral_entry_event_action) && !cp_actions.some(was_neutral_entry_event_action)
	}

	function is_bulls_eye_active(game) {
		return is_turn_event(game, "bulls_eye_directive")
	}

	function bulls_eye_should_prompt_sr(game) {
		return is_bulls_eye_active(game) && !game.bulls_eye_sr_done
	}

	function bulls_eye_get_sr_spaces(game) {
		let spaces = game.activated && game.activated.attack ? game.activated.attack : []
		let used = game.bulls_eye_sr_spaces || []
		return spaces.filter((s) => !set_has(used, s))
	}

	function bulls_eye_record_sr_space(game, s) {
		if (!game.bulls_eye_sr_spaces) game.bulls_eye_sr_spaces = []
		set_add(game.bulls_eye_sr_spaces, s)
	}

	function bulls_eye_finish_sr(game) {
		game.bulls_eye_sr_done = true
	}

	function bulls_eye_record_advanced_piece(game, p) {
		if (!is_bulls_eye_active(game)) return
		if (!game.bulls_eye_advanced_stack) game.bulls_eye_advanced_stack = []
		set_add(game.bulls_eye_advanced_stack, p)
	}

	function bulls_eye_can_extra_attack(game) {
		if (!is_bulls_eye_active(game)) return false
		if (!game.bulls_eye_advanced_stack || game.bulls_eye_advanced_stack.length === 0) return false
		if (game.events.bulls_eye_used) return false
		let has_non_tu = game.bulls_eye_advanced_stack.some((p) => {
			let n = get_piece_nation(p)
			return n !== "tu" && n !== "tua"
		})
		if (has_non_tu) return false
		let has_reduced = game.bulls_eye_advanced_stack.some((p) => is_piece_reduced(game, p))
		if (has_reduced) return false
		return true
	}

	function bulls_eye_use_extra_attack(game) {
		game.events.bulls_eye_used = true
	}

	function bulls_eye_ru_attack_drm(game, defenders) {
		if (!is_bulls_eye_active(game)) return 0
		return defenders.some((p) => piece_counts_as_nation_for_rule(game, p, "ru")) ? 1 : 0
	}

	function bulls_eye_cleanup_scus(game) {
		const { get_stack_count, get_stack_counted_pieces } = Engine.map || {}
		for (let s = 1; s < data.spaces.length; s++) {
			let pieces = get_pieces_in_space(game, s).filter((p) => get_piece_effective_faction(game, p) === CP)
			if (pieces.length === 0) continue
			let stack_count = get_stack_count ? get_stack_count(pieces) : 0
			if (stack_count > STACKING_LIMIT) {
				let excess = stack_count - STACKING_LIMIT
				let scus = get_stack_counted_pieces ? get_stack_counted_pieces(pieces).filter((p) => is_scu(p)) : []
				for (let i = 0; i < excess; i++) {
					if (scus.length > 0) {
						let p = scus.pop()
						game.pieces[p] = get_scu_reserve_box(CP)
						log(game, `靶心指令清理：${piece_log_name(game, p)} 从 ${space_log_name(s)} 返回预备格。`)
					}
				}
			}
		}
	}

	function is_persia_open(game) {
		return !!(game.events && (game.events.secret_treaty || game.events.persian_push))
	}

	function has_enemy_unit_in_space(game, s, faction) {
		let enemy = Engine.map.other_faction(faction)
		let pieces = get_pieces_in_space(game, s)
		return pieces.some((p) => {
			let info = data.pieces[p]
			return info && info.faction === enemy
		})
	}

	function get_german_intrigues_unit_spaces(game) {
		let options = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!is_neutral_persia_space(s)) continue
			if (has_enemy_unit_in_space(game, s, CP)) continue
			let pieces = get_pieces_in_space(game, s)
			if (pieces.length === 0 || is_controlled_by(game, s, CP)) options.push(s)
		}
		return options
	}

	function get_armenian_uprising_blue_a_spaces() {
		// Event-local strict source: use curated blue-A list only.
		return ARMENIAN_UPRISING_BLUE_A_SPACES.map(find_space).filter((s) => s > 0)
	}

	function is_ap_invasion_event_used_this_turn(game) {
		return !!(game && game.events && game.events["ap_invasion_event"] === game.turn)
	}

	function get_generic_ap_beachhead_reserve_count(game) {
		return Math.max(0, game.unplaced_beachheads || 0)
	}

	function add_ap_beachhead_reserve(game, count = 1) {
		count = Number(count) || 0
		if (count <= 0) return 0
		game.unplaced_beachheads = Math.max(0, game.unplaced_beachheads || 0) + count
		return count
	}

	function has_available_cyprus_beachhead(game) {
		return CYPRUS_BEACHHEADS.some((s) => Engine.map.can_ap_place_beachhead_marker(game, s, CYPRUS))
	}

	function can_play_project_alexandria(game) {
		return (
			game.events["egyptian_coup"] &&
			get_season(game) !== "Winter" &&
			!game.events["unrestricted_submarine_warfare"] &&
			!is_ap_invasion_event_used_this_turn(game) &&
			has_available_cyprus_beachhead(game)
		)
	}

	function has_enver_falkenhayn_bu4_placement(game) {
		let p = find_piece(CP, "BU 4 Army")
		if (p < 0) return false
		let helper = Engine.reinf_helpers && Engine.reinf_helpers.is_bu_bulgaria
		if (!helper || typeof helper.check !== "function") return false

		function can_place_reinforcement_unit_in_space(s) {
			if (Engine.map.is_potential_beachhead_space(s) && !Engine.map.is_beachhead_space(game, s)) return false
			return Engine.map.can_place_piece_in_space(game, s, p)
		}

		function can_place_adjacent_overflow_reinforcement(s) {
			if (!Engine.map.is_controlled_by(game, s, CP)) return false
			if (Engine.map.is_besieged(game, s)) return false
			return can_place_reinforcement_unit_in_space(s)
		}

		for (let s = 1; s < data.spaces.length; s++) {
			if (!helper.check(game, s)) continue
			if (can_place_reinforcement_unit_in_space(s)) return true

			for (let ns of Engine.map.get_connected_spaces(game, s)) {
				if (can_place_adjacent_overflow_reinforcement(ns)) return true
			}
		}
		return false
	}

	function with_enver_falkenhayn_can_play_overlay(game, fn) {
		let previous_state = game.state
		let previous_event_ctx = game.event_ctx
		let previous_sr_moved = game.sr_moved
		game.state = "event_enver_falkenhayn_sr"
		game.event_ctx = { key: "enver_falkenhayn_summit", data: { sr_points: 8, moved: [] } }
		game.sr_moved = []
		try {
			return fn()
		} finally {
			game.state = previous_state
			if (previous_event_ctx === undefined) delete game.event_ctx
			else game.event_ctx = previous_event_ctx
			if (previous_sr_moved === undefined) delete game.sr_moved
			else game.sr_moved = previous_sr_moved
		}
	}

	function has_enver_falkenhayn_galicia_sr_candidate(game) {
		return with_enver_falkenhayn_can_play_overlay(game, () => {
			for (let p = 1; p < data.pieces.length; p++) {
				let info = data.pieces[p]
				if (!info || (info.nation !== "tu" && info.nation !== "tua") || info.piece_class !== "LCU") continue
				if (!Engine.map.can_sr_piece(game, p, CP)) continue
				if (Engine.map.get_sr_cost(game, p) > 8) continue
				if (Engine.map.get_sr_destinations(game, p, CP).includes(GALICIA)) return true
			}
			return false
		})
	}

	function can_play_enver_falkenhayn_summit(game) {
		return (
			Engine.map.is_rail_connected_to_galicia(game) &&
			has_enver_falkenhayn_bu4_placement(game) &&
			has_enver_falkenhayn_galicia_sr_candidate(game)
		)
	}

	/**
	 * 检查当前是否处于德国潜艇 (German Subs) 封锁协约国增援的当回合
	 * @param {object} game 游戏实例
	 * @returns {boolean}
	 */
	function is_german_subs_reinforcement_turn(game) {
		return !!(game && game.events && game.events["german_subs"] && game.events["german_subs_turn"] === game.turn)
	}

	/**
	 * 检查地块是否受德国潜艇 (German Subs) 事件影响而被封锁
	 * @param {object} game 游戏实例
	 * @param {number} s 地块 ID
	 * @returns {boolean}
	 */
	function is_german_subs_blocked_port(game, s) {
		if (!is_german_subs_reinforcement_turn(game)) return false
		// Rule 13.3.2: German Subs in the Med only blocks Allied reinforcements to the
		// E. Mediterranean or Aegean Sea on the turn the card is played.
		return Engine.map.is_aegean_east_med_port_or_beachhead(game, s)
	}

	/**
	 * 应用土耳其战争疲劳 (Turkish War Weariness) 的 RP 惩罚
	 * @param {object} game 游戏实例
	 * @param {function} log_fn 日志函数
	 * @returns {number} 亏损的单位数量（如果 RP 不足）
	 */
	function apply_turkish_war_weariness_rp(game, log_fn) {
		if (!game.events["turkish_war_weariness"]) return 0
		const penalty = 2
		if (game.rp_cp.tu < penalty) {
			let deficit = penalty - game.rp_cp.tu
			game.rp_cp.tu = 0
			if (log_fn) log_fn(`Turkish War Weariness: TU RP deficit ${deficit}. Must reduce units.`)
			return deficit
		}
		game.rp_cp.tu -= penalty
		if (log_fn) log_fn("Turkish War Weariness: -2 TU RP")
		return 0
	}

	/**
	 * 检查土耳其补员是否被战争疲劳封锁
	 * @param {object} game 游戏实例
	 * @param {number} p 棋子 ID
	 * @returns {boolean}
	 */
	function is_turkish_replacement_blocked(game, p) {
		if (!game.events["turkish_war_weariness"]) return false
		let nation = get_piece_nation(p)
		if (nation !== "tu" && nation !== "tua") return false
		let badge = get_piece_badge(p)
		return badge === "blue" || badge === "cavalry"
	}

	/**
	 * 放置增援部队
	 * @param {object} game 游戏实例
	 * @param {string} name 棋子名称
	 * @param {number} faction 阵营
	 * @param {null} space 地块 ID 或名称
	 * @returns {boolean}
	 */
	function reinforce(game, name, faction, space = null, options = {}) {
		let p = find_piece(faction, name)
		if (p < 0) return false
		let revolution_level = get_russian_revolution_level(game)
		if (
			revolution_level >= 4 &&
			is_russian_revolution_subject_piece(p) &&
			!is_russian_revolution_survivor_piece(game, p)
		) {
			log(game, `Russian Revolution Stage 4: ${name} may not enter the game.`)
			return false
		}

		if (
			is_reinforcement(game, p) ||
			game.pieces[p] === RESERVE ||
			game.pieces[p] === 0 ||
			game.pieces[p] === REMOVED ||
			is_removed_only(game, p) ||
			(options.allow_from_reserve && is_in_reserve(game, p)) ||
			(options.allow_from_eliminated && is_eliminated(game, p))
		) {
			if (space === null) {
				space = get_reserve_box_for_piece(p)
			} else if (typeof space === "string") {
				let s = find_space(space)
				if (s >= 0) {
					space = s
				} else {
					console.error(`reinforce: Space "${space}" not found. Falling back to default.`)
					space = get_reserve_box_for_piece(p)
				}
			}

			game.pieces[p] = space
			if (options.restore_full_strength) {
				Engine.utils.set_delete(game.reduced, p)
			}
			if (
				revolution_level >= 2 &&
				revolution_level <= 3 &&
				is_russian_revolution_subject_piece(p) &&
				data.pieces[p].type !== "hq"
			) {
				set_add(game.reduced, p)
			}
			let sn = space === RESERVE ? "Reserve" : space_log_name(space)
			log(game, `增援：${name} 放置到 ${sn}`)
			if (space !== null && space !== RESERVE) {
				let can_capture_persia_control =
					is_persia_open(game) &&
					Engine.map.is_persia(space) &&
					!Engine.map.is_controlled_by(game, space, faction) &&
					Engine.game_utils.is_regular(p) &&
					data.pieces[p].type !== "hq"
				if (can_capture_persia_control) {
					Engine.set_control(game, space, faction)
				}
				if (Engine.check_persia_entry_vp_penalty) {
					Engine.check_persia_entry_vp_penalty(game, space, [p])
				}
				Engine.sync_neutral_vp_state(game, space)
				Engine.sync_region_control(game, space)
				if (typeof Engine.sync_jihad_city_state === "function") {
					Engine.sync_jihad_city_state(game, space)
				}
			}

			// Rule 19.2.1: Entering neutral Athens triggers Greek entry
			if (
				space !== null &&
				space !== RESERVE &&
				Engine.neutral.is_greece_neutral(game) &&
				Engine.neutral.is_athens_space(space)
			) {
				// Only trigger if the reinforced piece is NOT a Greek piece (Greek pieces are reinforced to Athens when they join)
				if (!Engine.neutral.is_greek_piece(p)) {
					Engine.neutral.trigger_greece_entry(
						game,
						space,
						Engine.utils.other_faction(faction),
						"增援进入雅典",
						(msg) => log(game, msg)
					)
				}
			}

			return true
		}
		return false
	}

	function get_event_entry(card) {
		let entry = events_by_id[card.num]
		if (!entry && card.event) entry = events_by_name[card.event]
		return entry
	}

	/**
	 * 确保游戏实例中有增援记录
	 * @param {object} game
	 * @returns {object}
	 */
	function ensure_rein_record(game) {
		if (!game.rein_record) {
			game.rein_record = { ru: 0, br: 0, in_anz: 0, tu: 0 }
		}
		const keys = ["ru", "br", "in_anz", "tu"]
		for (let key of keys) {
			if (typeof game.rein_record[key] !== "number") {
				game.rein_record[key] = 0
			}
		}
		return game.rein_record
	}

	/**
	 * 获取增援记录的 key
	 * @param {object} card 卡牌数据
	 * @param {object} entry 事件条目
	 * @returns {string|null}
	 */
	function get_rein_record_key(card, entry) {
		if (!entry || !card) return null
		if (entry.add_rein_record) return entry.add_rein_record
		let name = String(entry.name || card.event || "").toUpperCase()
		const mapping = {
			"RUSSIAN REINFORCEMENTS": "ru",
			"BRITISH REINFORCEMENTS": "br",
			"INDIAN REINFORCEMENTS": "in_anz",
			"ANZAC REINFORCEMENTS": "in_anz",
			"TURKISH REINFORCEMENTS": "tu"
		}
		return mapping[name] || null
	}

	exports.reinforce = reinforce

	exports.can_play_event = function (game, card_index) {
		let card = data.cards[card_index]
		if (!card) return false
		if (card.cc) return false
		let entry = get_event_entry(card)
		if (entry && typeof entry.can_play === "function") {
			if (!entry.can_play(game)) return false
		}
		let key = get_rein_record_key(card, entry)
		if (get_russian_revolution_level(game) >= 4 && (key === "ru" || (entry && entry.blocks_after_russian_revolution_stage4))) {
			return false
		}
		if (key) {
			let record = ensure_rein_record(game)
			if ((record[key] || 0) >= 1) return false
		}
		return true
	}

	exports.get_event_entry = function (card_index) {
		let card = data.cards[card_index]
		if (!card) return null
		return get_event_entry(card)
	}

	exports.play_event = function (game, card_index, ctx) {
		let card = data.cards[card_index]
		if (!card) return false
		if (card.cc) return false
		let entry = get_event_entry(card)
		if (entry && (entry.play || entry.handler)) {
			let rein_key = get_rein_record_key(card, entry)
			let fn = entry.play || entry.handler
			let result = fn(game, ctx)
			let use_ops = !!entry.use_ops
			if (result !== false && rein_key) {
				let record = ensure_rein_record(game)
				record[rein_key] = (record[rein_key] || 0) + 1
			}
			if (use_ops && result !== false) {
				game.event_ops_card = card_index
			}
			if (!entry.defer_end && result !== false) finish_event(ctx)
			return result !== false
		}
		return false
	}

	const events_by_id = {
		1: {
			name: "RUSSO-BRITISH ASSAULT",
			name_cn: "英俄突袭",
			effect_cn:
				"(该事件不能完成俄国MO。不能在1914年秋季第一行动轮后当作事件打出)。启动波斯湾滩头的部队进行登陆(如果目标是法奥港则直接摧毁其要塞)，随后激活进行战斗。另外，启动两个包含俄国部队的地区进行战斗。",
			can_play: function (game) {
				return game.turn === 1 && game.action_round === 1
			},
			handler: function (game, ctx) {
				if (ctx && typeof ctx.start_event === "function") {
					ctx.start_event("russo_british_assault")
				}
				game.events["russo_british_assault"] = true
				game.active = AP
				game.state = "event_russo_british_assault_fao_fort"
			},
			defer_end: true
		},
		2: {
			name: "ANZAC REINFORCEMENTS",
			add_rein_record: "in_anz",
			name_cn: "澳新增援",
			effect_cn: "增援:澳新步兵师，[1个澳新骑兵师]",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "anzac_reinf")
				game.active = AP
				let units = ["ANZ Elite DIV", "ANZ Cavalry #1"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				event.reinf_logic = "is_br"

				// ANZ Cavalry #1 enters reduced strength
				let cav = find_piece(AP, "ANZ Cavalry #1")
				if (cav >= 0) {
					set_add(game.reduced, cav)
				}

				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		3: {
			name: "EGYPTIAN COUP",
			name_cn: "埃及政变",
			effect_cn: "-1圣战等级。在地图上放置英国塞浦路斯补给标记，塞浦路斯现在成为协约国岛屿基地。",
			handler: function (game, ctx) {
				update_jihad_level(game, -1)
				game.events["egyptian_coup"] = true
				// 替换塞浦路斯 Token
				if (game.ui_tokens) {
					game.ui_tokens["Cyprus Allowed"] = "MCYPBR.png"
				}
				Engine.set_control(game, CYPRUS, "ap")
				for (let s of CYPRUS_BEACHHEADS) Engine.set_control(game, s, "ap")

				log(game, "塞浦路斯成为协约国岛屿基地", ctx)
			}
		},
		4: {
			name: "SHORE BOMBARDMENT CC",
			name_cn: "海岸炮击",
			effect_cn: "在或者对东地中海、红海、波斯湾沿岸地区、苏伊士运河沿岸地区或加里波利地区的一次进攻/防御+1drm"
		},
		5: {
			name: "ARMENIAN DRUZHINY CC",
			name_cn: "亚美尼亚志愿队",
			effect_cn: "一次俄国或者亚美尼亚部队在**巴尔干地区外**的进攻/防御+1drm"
		},
		6: {
			name: "PUGNACITY & TENACITY CC",
			name_cn: "坚韧不拔",
			effect_cn:
				"一次包含了印度部队的攻击/防御+1drm，并取消本次战斗及本回合剩余时间印度军队战斗时面临的恶劣天气修正。"
		},
		7: {
			name: "ENVER GOES EAST",
			name_cn: "恩维尔东方攻势",
			effect_cn:
				"协约国玩家启动和一个俄国部队占据地区相邻的两个土耳其/土耳其-阿拉伯部队控制地区，并为每一个土军堆叠选择一个攻击目标。(意味着协约国可以通过本事件启动同盟国单位，并为其选择攻击目标)",
			handler: function (game, ctx) {
				let event = ctx && typeof ctx.start_event === "function" ? ctx.start_event("enver_goes_east") : null
				if (event) {
					event.enver_expected_count = 2
					event.enver_selected_spaces = []
					event.enver_plans = []
					event.enver_queue = []
				}
				game.active = AP
				game.state = "event_enver_goes_east_select_space"
			},
			defer_end: true
		},
		8: {
			name: "SECRET TREATY",
			name_cn: "秘密条约",
			effect_cn:
				"+1圣战等级。增援:英国波斯宪兵师 至任何波斯大区。启动以下选项中的其中一种内的**一个地区格**的协约国单位进行移动:A:波斯大区、中亚大区B:高加索、阿塞拜疆C:美索不达米亚地区。从现在开始到游戏结束，双方玩家的部队都可以进入中立的波斯地区。",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "secret_treaty")
				game.events["secret_treaty"] = true
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["Persian_Neutrality"] = "MPENV.png"
				game.active = AP
				let units = ["BR Persian Cordon #4"]
				event.reinf_to_place = units
				event.reinf_logic = "is_secret_treaty_rein"
				game.state = "event_secret_treaty_place_reinforcement"

				update_jihad_level(game, 1)
			},
			defer_end: true
		},
		9: {
			name: "SPHERE OF INFLUENCE",
			blocks_after_russian_revolution_stage4: true,
			name_cn: "俄国势力范围",
			effect_cn:
				"增援:2个俄国步兵师，1个俄国近卫步兵师 至 协约国控制下的空置的、可以用铁路连接至俄国补给点的俄国、阿塞拜疆地区。",
			can_play: function (game) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (Engine.reinf_helpers.is_ru_sphere_rein.check(game, s)) {
						return true
					}
				}
				return false
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "sphere_of_influence")
				game.active = AP
				let units = ["RU Elite DIV #3", "RU DIV #11", "RU DIV #12"]
				event.reinf_to_place = units

				game.state = "event_sphere_of_influence_place"
			},
			defer_end: true
		},
		10: {
			name: "RUSSIAN REINFORCEMENTS",
			add_rein_record: "ru",
			name_cn: "俄国增援",
			effect_cn: "增援:(高加索第4军团，以受损面进入)增援:1个近卫步兵师、1个步兵师、1个骑兵师",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "russian_reinf")
				game.active = AP
				let units = ["RU IV Caucasian", "RU Elite DIV #4", "RU DIV #13", "RU Cavalry #7"]
				event.reinf_to_place = units
				event.reinf_placement = {
					"RU IV Caucasian": "map",
					"RU Elite DIV #4": "either",
					"RU DIV #13": "either",
					"RU Cavalry #7": "either"
				}
				event.reinf_logic = "is_ru_rein"
				let caucasian = find_piece(AP, "RU IV Caucasian")
				if (caucasian >= 0) set_add(game.reduced, caucasian)
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		11: {
			name: "ROYAL NAVY BLOCKADE",
			name_cn: "皇家海军封锁",
			effect_cn:
				"把土耳其最大补给限度标记放置在25，每次土耳其打出RP卡记录其补员点数时扣除相应数值。当扣减为0时，土耳其无法通过RP卡再记录补员点数。(注:使用同盟国事件和其他规则获得的奖励补员点数、德国补员点数转换的土耳其补员点数不会影响该标志的移动。补员阶段时，若有土耳其补员点数未使用，则将最大补给限度标志向更高处移动等同于尚未使用的土耳其补员点数的格数)每个冬季回合战争状态结算阶段时-1VP，直到同盟国进入全面战争状态**和**柏林-君士坦丁堡的铁路第一次完成连通(铁路沿途地区全部被同盟国控制)。如果同盟国玩家在一个冬季回合使战争状态抵达全面战争(且完成铁路连通条件)，则封锁扣分先于同盟国战争状态调整进行(**意味着还是必须先扣这一分**)。。封锁效果**一旦**被同盟国玩家取消，则无法再适用，即使在以上两个条件都被满足后，柏林-君士坦丁堡铁路再次被协约国夺取并占据，也无法继续带来罚分效果。此后的游戏中，同盟国不能通过爱琴海、东地中海、波斯湾或红海运送补给或者战略调整。(这意味着被同盟国所控制的黑海、里海以外的港口不能给其部队提供补给，也无法接受海上SR)",
			handler: function (game) {
				game.events["royal_navy_blockade"] = true
				game.tu_rp_limit = 25
				game.blockade_vp_penalty_active = true
				game.events["royal_navy_blockade_transport_lock_placeholder"] = true
				game.events["royal_navy_blockade_restricted_seas"] = [
					"aegean",
					"east_mediterranean",
					"persian_gulf",
					"red_sea"
				]
			}
		},
		12: {
			name: "PROJECT ALEXANDRIA",
			name_cn: "亚历山大计划",
			effect_cn:
				"(只能在【埃及政变】后打出，不能在冬季打出)海上入侵：获得一个滩头标志，立刻将其放置在塞浦路斯旁的滩头地区。随后战略调整至多3支英国/印度/澳新步兵师至滩头标志。",
			can_play: function (game) {
				return can_play_project_alexandria(game)
			},
			handler: function (game, ctx) {
				let event = ctx && typeof ctx.start_event === "function" ? ctx.start_event("project_alexandria") : {}
				game.events["project_alexandria"] = event
				game.events["ap_invasion_event"] = game.turn
				game.active = AP
				game.state = "event_project_alexandria_place_beachhead"
			},
			defer_end: true
		},
		13: {
			name: "CHURCHILL PREVAILS",
			name_cn: "丘吉尔胜出",
			effect_cn:
				"允许打出【海上入侵】事件(亚历山大计划除外)。协约国玩家派遣皇家海军舰队，开始掷骰并按照顺序**从加里波利沿达达尼尔海峡向上**开始对**土耳其海峡沿岸要塞**实施炮击。若掷骰结果**大于**该要塞火力值，则要塞被摧毁，并继续向上对下一个要塞进行炮击。**一旦其中一次失败，则终止一切以下步骤。**。若**炮击加里波利要塞成功并将其摧毁**，则皇家海军驶入马尔马拉海，协约国玩家获得以下效果:。❶此时协约国玩家**可以选择**是否炮击君士坦丁堡。如果选择炮击，则获得:。1、-1VP。2、+1圣战等级。❷在预备军格或者地中海东部任何协约国控制的港口增援2个英国精锐步兵师。视为基钦纳被丘吉尔说服，从西线战场调来精锐部队。。❸此时协约国玩家**还可以选择**继续炮击博斯普鲁斯海峡要塞。若本次炮击成功则该要塞被摧毁，本回合立即获得2点俄国补员点数。此后的每回合额外获得1点俄国补员点数，直到【地中海潜艇猎袭】打出为止。",
			handler: function (game, ctx) {
				let event = ctx && typeof ctx.start_event === "function" ? ctx.start_event("churchill_prevails") : null
				game.events["churchill_prevails"] = true
				if (event) event.churchill_prevails_step = 0
				else game.churchill_prevails_step = 0
				game.active = AP
				game.state = "event_churchill_prevails_bombardment"
			},
			defer_end: true
		},
		14: {
			name: "KITCHENER",
			name_cn: "基钦纳",
			effect_cn:
				"(不能在【劳合乔治接管指挥权】后打出)在本回合剩余行动轮:任何俄国部队在高加索地区的进攻+1drm。获得1点英国补员点数、1点印度补员点数、1点协约国补员点数、1点俄国补员点数。从现在开始每回合可以将1点英国补员点数转化为1点俄国补员点数。",
			can_play: function (game) {
				return !game.events["lloyd_george_takes_command"]
			},
			handler: function (game) {
				game.events["kitchener"] = game.turn
				game.events["kitchener_conversion"] = true
				game.rp_ap.br += 1
				game.rp_ap.in += 1
				game.rp_ap.a += 1
				if (can_record_russian_rp(game)) game.rp_ap.ru += 1
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["BR RPs TO RU"] = "MKitch.png"
				let p = find_piece(undefined, "Kitch.token")
				if (p >= 0) {
					game.pieces[p] = REMOVED
				}
			}
		},
		15: {
			name: "GURKHAS CC",
			name_cn: "廓尔喀人",
			effect_cn: "一次英国/印度军队的进攻或者防御+1drm"
		},
		16: {
			name: "ARAB REVOLT",
			name_cn: "阿拉伯起义",
			effect_cn: "(只能【劳伦斯】后，且圣战等级不大于7时打出)在汉志大区放置3个阿拉伯起义军并全部启动进行战斗。",
			can_play: function (game) {
				return game.events["lawrence"] && (game.jihad || 0) <= 7
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "arab_revolt")
				game.events["arab_revolt"] = true
				event.reinf_to_place = ["Arab faisal Revolt", "Arab Revolt #1", "Arab Revolt #2"]
				event.reinf_logic = "is_arab_revolt_rein"
				game.state = "event_arab_revolt_place"
			},
			defer_end: true
		},
		17: {
			name: "ALLIED SOLIDARITY",
			blocks_after_russian_revolution_stage4: true,
			name_cn: "盟军团结",
			effect_cn:
				"增援:俄国2/4特别旅、意大利步兵师、希腊国防军 至巴尔干内任一协约国控制港口或滩头标记，包括利姆诺斯岛。希腊国防军可以选择直接增援至中立的萨洛尼卡地区并保持不破坏希腊的中立；随后萨洛尼卡成为协约国控制的港口。俄国2/4特别旅虽然遵循俄国部队的一般规则，无法和英国单位堆叠在一起，但是其可以从非俄国补给源(英国补给源)获得完全补给。并且在被摧毁并重建在俄国补给源或者预备军格后，俄国2/4特别旅可以通过海上战略调整再次进入协约国控制的希腊港口，无视相关的黑海-地中海海上战略调整禁止规则。",
			can_play: function (game) {
				return can_place_allied_solidarity_units(game, ["RU 2/4 Special", "IT DIV", "GR National Defense"])
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "allied_solidarity")
				game.active = AP
				event.reinf_to_place = ["RU 2/4 Special", "IT DIV", "GR National Defense"]
				event.reinf_logic = "is_allied_solidarity_rein"
				game.state = "event_allied_solidarity_place"
			},
			defer_end: true
		},
		18: {
			name: "LAWRENCE",
			name_cn: "劳伦斯",
			effect_cn:
				"(黄色事件)<当作事件打出时，正常使用此牌记录的OP点数。本回合剩余时间同盟国手牌需要持续公开>-1圣战等级。允许打出【阿拉伯起义】事件。",
			use_ops: true,
			handler: function (game, ctx) {
				update_jihad_level(game, -1)
				game.events["lawrence"] = true

				// 公开同盟国手牌逻辑：直接记录 Log
				if (game.hand_cp && game.hand_cp.length > 0) {
					let hand_names = card_names(game.hand_cp, ctx)
					log(game, `同盟国当前手牌: ${hand_names.join(", ")}`, ctx)
				} else {
					log(game, "同盟国当前没有手牌。", ctx)
				}
			}
		},
		19: {
			name: "MURRAY TAKES COMMAND",
			name_cn: "默里接管指挥权",
			effect_cn:
				"增援:1个澳新骑兵师，澳新帝国骆驼师。把西奈铁路标记放置在4回合后的纪录条位置。当回合标记抵达西奈铁路标记所在回合时，西奈铁路完成。一旦西奈铁路完成，接下来的游戏里，**协约国**就可以利用西奈铁路进行LCU的移动、战斗、战略调整和组合以及SCU的战略调整。(注:即使西奈铁路完成后，**同盟国**也**不能**利用该铁路进行LCU移动、战斗、战略调整和组合，这是因为一旦该铁路经过地区格被同盟国控制，英国可以选择切断输水管，继续使同盟国大规模军队的补给成为徒劳)",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "murray_takes_command")
				game.active = AP
				let units = ["ANZ Cavalry #2", "ANZ Imp Camel"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				game.events["xinai"] = game.turn + 4
				log(game, "西奈铁路将在第" + (game.turn + 4) + "回合完成")
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		20: {
			name: "ARMORED CARS CC",
			name_cn: "装甲车",
			effect_cn: "一次协约国对或者在非山区、非沼泽地区的攻击/防御+1drm"
		},
		21: {
			name: "NO PRISONERS CC",
			name_cn: "不留活口",
			effect_cn:
				"(在战斗的掷骰前打出)一次攻击堆叠包含协约国阿拉伯起义部队或者同盟国部落部队的战斗中，攻击方受到的伤害+1，防御方受到的伤害-1。当你使用完这张卡后，该卡交予同盟国方并保持正面朝上，使其可以选择在一次战斗中当作战斗牌使用。以此法使用完毕的这张卡丢入弃牌堆",
			handler: function (game) {
				game.events["no_prisoners"] = game.turn
			}
		},
		22: {
			name: "KITCHENER'S INVASION",
			name_cn: "基钦纳入侵",
			effect_cn:
				"(只能在【丘吉尔胜出】后打出，不能在冬季回合打出。可以当作英国增援打出以代替入侵)。——海上入侵——。获得一个滩头标记，立即将其放置在一个滩头处。。入侵:英国第9军团、2个英国步兵师 至任何滩头标记地区。。增援:1个英国精锐步兵师，1个英国骑兵师至预备军格。",
			can_play: function (game) {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "kitcheners_invasion")
				game.events["kitcheners_invasion"] = true
				game.active = AP
				event.reinf_to_place = ["BR Elite DIV #3", "BR Cavalry #1"]
				event.reinf_placement = "reserve"
				event.reinf_prompt_prefix = "基钦纳入侵"
				event.reinf_next_state = "event_kitcheners_invasion_choice"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		23: {
			name: "GRAND DUKE TO TIFLIS",
			name_cn: "尼古拉大公抵达第比利斯",
			effect_cn:
				"(只能在【秘密条约】或者【波斯攻势】后打出)。增援:1个俄国骑兵师、1个俄国步兵师、HQ:巴拉托夫 至任何里海港口。同盟国**必须**从该港口将所有占据该地的单位**向后撤出1-2格**。协约国还可以立即战略调整1个俄国骑兵师至该港口。。增援:俄国北波斯军警队 至阿塞拜疆境内的空置格。。增援:3个英国波斯宪兵师 至任何波斯大区内。",
			can_play: function (game) {
				if (!game.events["secret_treaty"] && !game.events["persian_push"]) return false
				if (Engine.events.get_russian_revolution_level(game) >= 4) return true
				let has_port = false
				for (let s = 1; s < data.spaces.length; s++) {
					if (!Engine.map.is_caspian_sea_port(s)) continue
					let pieces = get_pieces_in_space(game, s)
					// CP units will retreat, so we only count AP units already there that count toward stacking.
					let ap_pieces = pieces.filter((p) => data.pieces[p].faction === AP)
					let ap_stack_count = Engine.map.get_stack_count(pieces.filter((p) => data.pieces[p].faction === AP))
					//  for 2 SCUs (RU DIV #14, RU Cavalry #8). Baratov HQ doesn't count.
					if (ap_pieces.length <= 1 && ap_stack_count <= 1) {
						has_port = true
						break
					}
				}
				if (!has_port) return false

				return get_grand_duke_to_tiflis_vacant_azerbaijan_spaces(game).length > 0
			},
			handler: function (game, ctx) {
				game.events["grand_duke_to_tiflis"] = game.turn
				let event
				if (ctx && typeof ctx.start_event === "function") {
					event = ctx.start_event("grand_duke_to_tiflis")
				} else {
					if (!game.event_ctx || game.event_ctx.key !== "grand_duke_to_tiflis") {
						game.event_ctx = { key: "grand_duke_to_tiflis", data: {} }
					} else if (!game.event_ctx.data) {
						game.event_ctx.data = {}
					}
					event = game.event_ctx.data
				}
				game.active = AP
				if (Engine.events.get_russian_revolution_level(game) >= 4) {
					if (event) {
						event.placed_ru_police = true
						event.br_cordons_to_place = 3
					}
					game.state = "event_grand_duke_to_tiflis_place_cordons"
				} else {
					game.state = "event_grand_duke_to_tiflis_select_port"
				}
			},
			defer_end: true
		},
		24: {
			name: "THE SERBS RETURN!",
			name_cn: "塞尔维亚人重返",
			effect_cn:
				"(只能在塞尔维亚崩溃后打出)。增援:6个塞尔维亚步兵师、1个塞尔维亚骑兵师至利姆诺斯岛屿基地、协约国控制的萨洛尼卡或者预备军格。。增援:塞尔维亚第1集团军、第2集团军、第3集团军至预备军格。",
			can_play: function (game) {
				return Engine.collapse.has_serbia_collapsed(game)
			},
			handler: function (game, ctx) {
				game.events["the_serbs_return"] = game.turn
				let event = start_event_data(game, ctx, "the_serbs_return")
				game.active = AP
				let units = [
					"SB 1 Army",
					"SB 2 Army",
					"SB 3 Army",
					"SB DIV #1",
					"SB DIV #2",
					"SB DIV #3",
					"SB DIV #4",
					"SB DIV #5",
					"SB DIV #6",
					"SB Cavalry"
				].filter((unit_name) => {
					let p = find_piece(AP, unit_name)
					if (p < 0) return false
					if (Engine.game_utils.is_permanently_eliminated(game, p)) return false
					return Engine.game_utils.is_not_on_map(game, p)
				})
				event.reinf_to_place = units
				event.reinf_placement = {
					"SB 1 Army": "reserve",
					"SB 2 Army": "reserve",
					"SB 3 Army": "reserve",
					"SB DIV #1": "either",
					"SB DIV #2": "either",
					"SB DIV #3": "either",
					"SB DIV #4": "either",
					"SB DIV #5": "either",
					"SB DIV #6": "either",
					"SB Cavalry": "either"
				}
				event.reinf_logic = "is_serb_return_rein"
				event.reinf_allow_from_reserve = true
				event.reinf_allow_from_eliminated = true
				event.reinf_restore_full_strength = true
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		25: {
			name: "RUSSIAN REINFORCEMENTS",
			add_rein_record: "ru",
			name_cn: "俄国增援",
			effect_cn:
				"增援:俄国高加索第5军团、俄国黑海陆战队、1个近卫步兵师。俄国黑海陆战队每局一次可从黑海港发动两栖突袭，占领空的同盟国黑海港；若登陆博斯普鲁斯或特拉布宗要塞，则单独围攻并按3个SCU计算。",
			can_play: function (game) {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "russian_reinf_25")
				game.active = AP
				let units = ["RU V Caucasian", "RU Black Sea", "RU Elite DIV #5"]
				event.reinf_to_place = units
				game.events["black_sea_marines_active"] = true
				event.reinf_placement = "either"
				event.reinf_logic = "is_ru_rein"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		26: {
			name: "INDIAN REINFORCEMENTS",
			add_rein_record: "in_anz",
			name_cn: "印度增援",
			effect_cn: "增援:印度底格里斯军团。增援:印度第2军团 至预备军格。增援:1个步兵师",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "indian_reinf_26")
				game.active = AP
				let units = ["IN Tigris Corps", "IN 2nd Corps", "IN DIV #7"]
				event.reinf_to_place = units
				event.reinf_placement = {
					"IN Tigris Corps": "map",
					"IN 2nd Corps": "reserve",
					"IN DIV #7": "either"
				}
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		27: {
			name: "LET THE FRENCH BLEED",
			name_cn: "让法国人流血",
			effect_cn: "增援:3个英国精锐步兵师(视作从西线战场调来)至 任何协约国控制港口/滩头。+1VP",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "let_the_french_bleed")
				game.vp += 1
				log(game, "让法国人流血: CP +1 VP", ctx)
				game.active = AP
				let units = ["BR Elite DIV #4", "BR Elite DIV #5", "BR Elite DIV #6"]
				event.reinf_to_place = units
				event.reinf_placement = "map"
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		28: {
			name: "MAUDE CC",
			name_cn: "莫德",
			effect_cn:
				"增援:HQ:莫德，印度第15步兵师。。在战斗开始前，可以立即把莫德HQ立即移动至任一本轮参与战斗的包含有至少1个英国部队和1个印度部队的堆叠。。只在本次战斗中，若莫德所在堆叠攻击的是非VP点，则取消所有战壕效果。。(在战斗前将印度第15步兵师完成放置)",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "maude_cc")
				game.active = AP
				let units = ["BR Maude HQ", "IN 15th DIV"]
				event.reinf_to_place = units
				game.events["maude"] = true
				event.reinf_placement = "map"
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		29: {
			name: "ROMANIA",
			name_cn: "罗马尼亚",
			effect_cn:
				"——中立国参战——。(只有在巴尔干地区存在至少一个协约国LCU时才能打出)。罗马尼亚加入协约国，按照规则中的罗马尼亚参战条目放置同盟国和协约国单位。。立即启动1个包含罗马尼亚部队的地区进行战斗。。若此卡没有在俄国革命前打出，则+2VP并永久禁止该卡在剩余游戏时间当作事件打出。(除非单纯为了提升战争状态)",
			can_play: function (game) {
				if (!can_play_neutral_entry_this_turn(game)) return false
				if (game.events["russian_revolution"]) return false
				let has_ap_lcu = false
				for (let p = 1; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (info && info.piece_class === "LCU" && get_piece_effective_faction(game, p) === AP) {
						let s = game.pieces[p]
						if (s > 0 && is_balkans(s)) {
							has_ap_lcu = true
							break
						}
					}
				}
				return has_ap_lcu
			},
			handler: function (game, ctx) {
				start_event_data(game, ctx, "romania_entry_29")
				Engine.neutral.trigger_romania_entry(game)
				if (game.events["bulgaria"]) {
					Engine.neutral.place_romania_combined_bu_ah(game)
					game.active = CP
					game.state = "event_romania_place_combined_bu_ah"
				} else {
					Engine.neutral.place_romania_combined_bu_ah(game)
					if (typeof Engine.map.check_supply === "function") {
						Engine.map.check_supply(game)
					}
					Engine.event_states.begin_romania_event_attack_activation(game)
				}
			},
			defer_end: true
		},
		30: {
			name: "GALLIPOLI INVASION",
			name_cn: "加里波利入侵",
			effect_cn:
				"(只能在【丘吉尔胜出】后打出，不能在冬季回合打出。可以当作英国增援打出以代替入侵)。——海上入侵——。入侵:(英国第8军团)、(澳新军团)、2个法国步兵师、1个英国步兵师 至岛屿基地。。若预备军格有参与入侵的LCU所对应的SCU单位，则可以立即将本次增援的受损的LCU翻至满员面。(可以立即从地图上战略调整SCU至预备军格来达成该条件)。获得两个滩头标记。",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				start_event_data(game, ctx, "gallipoli_invasion")
				game.events["gallipoli_invasion"] = true

				game.active = AP
				game.state = "event_gallipoli_invasion_choice"
			},
			defer_end: true
		},
		31: {
			name: "RUSSIAN WINTER OFFENSIVE",
			name_cn: "俄国冬季攻势",
			effect_cn:
				"(只能在冬季打出)。(黄色事件)。当作事件打出时，正常使用此牌记录的OP点数。当前行动轮中适用以下效果:。从山地地区发起的或者向山地地区进行的俄国部队进攻无视恶劣天气修正。。所有俄国进攻+1drm。所有土耳其高加索地区的要塞火力值暂时视为0。如果俄国部队在战斗后得以挺进上述要塞地区，则可以**立即摧毁要塞，无视围攻规则。**",
			can_play: function (game) {
				return get_season(game) === "Winter"
			},
			use_ops: true,
			handler: function (game) {
				game.events["russian_winter_offensive"] = {
					turn: game.turn,
					action_round: game.action_round
				}
			}
		},
		32: {
			name: "ARMENIAN UPRISING",
			name_cn: "亚美尼亚起义",
			effect_cn:
				"(只能在【泛突厥主义】后打出)。-1VP。放置亚美尼亚起义军和3个亚美尼亚起义标志在地图上的蓝色A标记地区，亚美尼亚起义军必须和其中一个起义标志放置在一个地区格。",
			can_play: function (game) {
				return game.events["pan_turkism"]
			},
			handler: function (game, ctx) {
				game.vp -= 1
				game.events["armenian_uprising"] = true
				game.active = AP
				game.armenian_uprising_markers = []
				start_event_data(game, ctx, "armenian_uprising_32", {
					unit_name: "Armenian Uprising",
					blue_a_spaces: get_armenian_uprising_blue_a_spaces(),
					markers_to_place: 3,
					marker_spaces: []
				})
				game.state = "event_armenian_uprising_unit"
			},
			defer_end: true
		},
		33: {
			name: "ASQUITH/LLOYD GEORGE COALITION",
			name_cn: "阿斯奎斯-劳合乔治联合政府",
			effect_cn:
				"增援:1个英国骑兵师。获得2点英国补员点数。在本场游戏剩余的时间内，可以在补员阶段将任何数量的英国补员点数转化为俄国补员点数。。在剩余的游戏时间内协约国MO掷骰+1drm。",
			handler: function (game, ctx) {
				game.mo_ap_modifier += 1
				game.rp_ap.br += 2
				game.events["asquith_coalition"] = true
				let event = start_event_data(game, ctx, "asquith_coalition")
				game.active = AP
				event.reinf_to_place = ["BR Cavalry #2"]
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"

				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["BR RPs TO RU"] = "MLG.png"
			},
			defer_end: true
		},
		34: {
			name: "SALONIKA INVASION",
			name_cn: "萨洛尼卡入侵",
			effect_cn:
				"(只能在【丘吉尔胜出】后打出，不能在冬季回合打出)可以当作英国增援打出以代替入侵)。——海上入侵——。入侵:英国第16军团、(英国第12军团)、2个法国步兵师 至 岛屿基地。增援:法国东方集团军-1至预备军格。。可以将地图上最多三支英国/印度/澳新SCU战略调整至岛屿基地。。获得1个滩头标记。",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "salonika_invasion")
				game.events["salonika_invasion"] = true
				game.active = AP
				event.reinf_to_place = ["FR Army Orient 1"]
				event.reinf_placement = "reserve"
				event.reinf_prompt_prefix = "萨洛尼卡入侵"
				event.reinf_next_state = "event_salonika_invasion_choice"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		35: {
			name: "BRITISH REINFORCEMENTS",
			add_rein_record: "br",
			name_cn: "英国增援",
			effect_cn:
				"增援:邓斯特部队，英国南波斯洋枪队。两者均可增援至协约国控制的波斯或阿拉伯斯坦地区/大区，或预备格；邓斯特部队还可以增援至协约国控制的巴格达。- **邓斯特部队可以只花费4点移动力作为代价跨越绿色连线。**",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "british_reinf_35")
				game.active = AP
				event.reinf_to_place = ["BR Dunsterforce", "BR/PE SPers Rifles"]
				event.reinf_placement = "either"
				event.reinf_logic = {
					"BR Dunsterforce": "is_brf_35_dunsterforce_rein",
					"BR/PE SPers Rifles": "is_brf_35_spers_rein"
				}
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		36: {
			name: "INDIAN REINFORCEMENTS",
			add_rein_record: "in_anz",
			name_cn: "印度增援",
			effect_cn: "增援:印度第17步兵师、印度第18步兵师，2个骑兵师",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "indian_reinf")
				game.active = AP
				let units = ["IN 17th DIV", "IN 18th DIV", "IN Cavalry #4", "IN Cavalry #5"]
				event.reinf_to_place = units
				event.reinf_placement = "map"
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		37: {
			name: "RUSSIAN REINFORCEMENTS",
			add_rein_record: "ru",
			name_cn: "俄国增援",
			effect_cn: "增援:3个俄国步兵师",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "russian_reinf_37")
				game.active = AP
				let units = ["RU DIV #15", "RU DIV #16", "RU DIV #17"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				event.reinf_logic = "is_ru_rein"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		38: {
			name: "ROYAL FLYING CORPS CC",
			name_cn: "皇家空军",
			effect_cn:
				"任何英国/印度/澳新部队的进攻/防御+1drm。此牌第一次打出后，阻止同盟国在剩余的游戏时间打出【飞行分队】",
			handler: function (game) {
				game.events["royal_flying_corps"] = game.turn
				game.events["royal_flying_corps_permanent"] = true
			}
		},
		39: {
			name: "TANKS CC",
			name_cn: "坦克",
			effect_cn: "(只能在埃及、西奈或叙利亚/巴勒斯坦的平地或者沙漠地区使用)。一次包含英国部队的进攻+1drm。",
			handler: function (game) {
				game.events["tanks"] = game.turn
			}
		},
		40: {
			name: "WARM WATER PORT",
			name_cn: "不冻港",
			effect_cn:
				"(只能在能通过陆地计算补给线至彼得罗夫斯克的俄国部队控制原本属于土耳其的爱琴海、东地中海和波斯湾港口时打出。不能在俄国革命后打出)。如果该港口地区不为VP点，则在游戏的剩余时间视其为VP点**(同样在革命结算时算作俄国VP数的一部分)**。现在开始\"上帝保佑沙皇\"标记永远位于俄国VP数+2的位置。**(即使该港口随后被同盟国夺回)**",
			can_play: function (game) {
				//return get_russian_revolution_level(game) < 1 && get_warm_water_port_options(game).length > 0
				return false
			},
			handler: function (game, ctx) {
				let options = get_warm_water_port_options(game)
				if (options.length === 1) {
					apply_warm_water_port_effect(game, options[0])
					finish_event(ctx)
				} else {
					game.active = AP
					game.state = "event_warm_water_port"
					game.warm_water_port_options = options
				}
			},
			defer_end: true
		},
		41: {
			name: "BALFOUR DECLARATION",
			name_cn: "贝尔福宣言",
			effect_cn: "(只有在协约国控制耶路撒冷、雅法、海法和纳布卢斯时才能打出)。-1VP。",
			can_play: has_allied_control_of_balfour_spaces,
			handler: function (game) {
				game.vp -= 1
				game.events["balfour_declaration"] = true
			}
		},
		42: {
			name: "JERUSALEM BY CHRISTMAS",
			name_cn: "圣诞节前收复圣城",
			effect_cn:
				"协约国在一个同盟国控制的**圣战城市**或者**完全补给点**和两个回合后的纪录条上各放置一个\"圣诞节前收复圣城\"标志。如果在两回合后该地区被英国/印度/澳新部队占据，则-1VP，反之+1VP。",
			handler: function (game, ctx) {
				if (ctx && typeof ctx.start_event === "function") {
					ctx.start_event("jerusalem_by_christmas")
				}
				game.active = AP
				game.state = "event_jerusalem_by_christmas_select_space"
			},
			defer_end: true
		},
		43: {
			name: "RUSSIAN REINFORCEMENTS",
			add_rein_record: "ru",
			name_cn: "俄国增援",
			effect_cn: "增援:俄国高加索骑兵军团、俄国高加索第7军团 至预备军格。增援:2个俄国近卫步兵师。",
			handler: function (game, ctx) {
				// 这些去预备军格
				reinforce(game, "RU Caucasian Cav", AP)
				reinforce(game, "RU VII Caucasian", AP)

				// 这些去地图上的补给点
				let event = start_event_data(game, ctx, "russian_reinf_43")
				game.active = AP
				event.reinf_to_place = ["RU Elite DIV #6", "RU Elite DIV #7"]
				event.reinf_placement = "either"
				event.reinf_logic = "is_ru_rein"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		44: {
			name: "WAR WEARY BALKANS CC",
			name_cn: "巴尔干厌战",
			effect_cn:
				"(只有在协约国在塞尔维亚或保加利亚至少控制了1个地区时打出。不能在1917年冬季前打出)。一回合一次，一次对保加利亚部队的攻击+1drm。在本次战斗及本回合的剩余时间内，包含保加利亚部队的堆叠无法取消撤退。",
			can_play: function (game) {
				return game.turn >= 13
			},
			handler: function (game) {
				game.events["war_weary_balkans"] = game.turn
			}
		},
		45: {
			name: "GREECE",
			name_cn: "希腊",
			effect_cn:
				"——中立国参战——。(只有在希腊仍处于中立状态且在巴尔干地区至少存在1支英国/法国LCU时。或罗马尼亚已经加入战争且尚未崩溃时才能打出)。-1VP(获得中立地区格雅典的VP)。希腊加入协约国。",
			can_play: function (game) {
				if (!can_play_neutral_entry_this_turn(game)) return false
				const { neutral } = Engine
				if (!neutral.is_greece_neutral(game)) return false

				// Check for 1 BR/FR LCUs in Balkans
				let br_fr_lcus_in_balkans = 0
				for (let p = 0; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (
						info.piece_class === "LCU" &&
						(info.nation === "br" || info.nation === "fr") &&
						game.pieces[p] > 0
					) {
						let s = game.pieces[p]
						if (is_balkans(s)) {
							br_fr_lcus_in_balkans++
						}
					}
				}
				if (br_fr_lcus_in_balkans >= 1) return true

				return Engine.collapse.is_romania_uncollapsed(game)
			},
			handler: function (game, ctx) {
				const { neutral } = Engine

				let gr_snapshot = {}
				for (let p = 0; p < data.pieces.length; p++) {
					if (data.pieces[p] && data.pieces[p].nation === "gr") {
						gr_snapshot[p] = {
							space: game.pieces[p],
							reduced: !!(game.reduced && game.reduced.includes(p))
						}
					}
				}
				game.events["greece_snapshot"] = {
					pieces: gr_snapshot,
					turn: game.turn,
					action_round: game.action_round,
					war_status_ap: game.war_status_ap,
					combined_war: game.combined_war
				}

				neutral.trigger_greece_entry(game, null, AP, "希腊事件", (msg) => log(game, msg, ctx))
				game.events["greece_event_played"] = true
			}
		},
		46: {
			name: "ARAB DESERTION",
			name_cn: "阿拉伯人背弃",
			effect_cn:
				"(只有在【阿拉伯起义】后且联合战争状态大于29时才能打出。不能在1917年冬季前打出)。阿拉伯人背弃奥斯曼帝国。在接下来的游戏时间内:土耳其-阿拉伯部队无法接受补员，不能进行土耳其-阿拉伯LCU的组合。任何包含有土耳其-阿拉伯部队的同盟国地区战斗-1drm",
			can_play: function (game) {
				return game.events["arab_revolt"] && game.combined_war > 29 && game.turn >= 10
			},
			handler: function (game) {
				game.events["arab_desertion"] = true
			}
		},
		47: {
			name: "INDIAN REINFORCEMENTS",
			add_rein_record: "in_anz",
			name_cn: "印度增援",
			effect_cn: "增援:印度第3军团。增援:1个精锐步兵师，1个骑兵师至预备军格",
			can_play: function () {
				return true
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "indian_reinf")
				game.active = AP
				let units = ["IN 3rd Corps", "IN Elite DIV #3", "IN Cavalry #6"]
				event.reinf_to_place = units
				event.reinf_placement = {
					"IN 3rd Corps": "map",
					"IN Elite DIV #3": "either",
					"IN Cavalry #6": "either"
				}
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		48: {
			name: "TURKISH WAR WEARINESS",
			name_cn: "土耳其厌战",
			effect_cn:
				"(只能在联合战争状态大于27时打出。不能在1917年冬季前打出)。在接下来的游戏时间里，每回合土耳其补员点数-2。如果在补员阶段土耳其补员点数因此效果小于0，则必须把地图上或者预备军格的土耳其/土耳其-阿拉伯单位翻至减损面或者消灭。。剩余的游戏时间内，土耳其/土耳其-阿拉伯的**精锐部队(蓝色图标)**和骑兵部队再也无法接受补员。",
			can_play: function (game) {
				let year = get_year(game)
				if (game.combined_war <= 27) return false
				if (year < 1917) return false
				return !(year === 1917 && get_season(game) === "Fall")
			},
			handler: function (game, ctx) {
				game.events["turkish_war_weariness"] = true
				log(game, "土耳其厌战: 每回合土耳其补员点数-2.", ctx)
			}
		},
		49: {
			name: "MASSED CAVALRY CHARGE CC",
			name_cn: "集群骑兵冲锋",
			effect_cn:
				"一次由包含澳新沙漠军团的堆叠发起的攻击获得+1drm并取消所有战壕效果**(和沙漠地形效果(LCU沙漠限制效果除外)*这是可选规则的一部分，双方玩家需要在游戏开始前决定是否采用澳新沙漠军团可选规则【该规则较大地加强了澳新沙漠军团】)**。若协约国赢得这场战斗，则所有参与战斗的满员骑兵单位可以挺进最多3格。",
			handler: function (game) {
				game.events["massed_cavalry_charge"] = game.turn
			}
		},
		50: {
			name: "PUSH TO THE BREAKING POINT CC",
			name_cn: "竭尽全力",
			effect_cn:
				"(只能在【艾伦比】后打出)。在一次攻击胜利后，参与本次战斗的满员的英国/印度/澳新部队(可以在挺进后)可以立即被再度启动来进行一次额外的攻击。",
			can_play: function (game) {
				return game.events["allenby"]
			},
			handler: function (game) {
				game.events["push_to_breaking_point"] = game.turn
			}
		},
		51: {
			name: "HAVERSACK RUSE CC",
			name_cn: "背包计谋",
			effect_cn:
				"(只能在【艾伦比】后打出)。一次包含了英国LCU的攻击中，协约国部队可以首先开火并取消所有地形效果。",
			can_play: function (game) {
				return game.events["allenby"]
			},
			handler: function (game) {
				game.events["haversack_ruse"] = game.turn
			}
		},
		52: {
			name: "MARCH AND COUNTERMARCH CC",
			name_cn: "前后佯动",
			effect_cn:
				"(只能在【艾伦比】后打出)。一个没有在本次行动轮中被启动的英国单位(SCU、LCU或者HQ)可以立即被启动并移动穿过1-2个协约国控制地区加入本次战斗(需要满足堆叠限制)。本次战斗获得+1drm。",
			can_play: function (game) {
				return game.events["allenby"]
			},
			handler: function (game) {
				game.events["march_and_countermarch"] = game.turn
			}
		},
		53: {
			name: "D'ESPEREY",
			name_cn: "德斯佩雷",
			effect_cn:
				"(只能在【劳合乔治接管指挥权】后打出)。增援:法国东方集团军-2 至预备军格。增援:2个法国步兵师，HQ:德斯佩雷。在剩余的游戏时间中，解除协约国在巴尔干地区的攻击限制。",
			can_play: function (game) {
				if (!game.events["lloyd_george_takes_command"]) return false
				let capacity = 0
				let has_hq_space = false
				for (let s = 1; s < data.spaces.length; s++) {
					// 使用与 is_allied_solidarity_rein 相同的地块判定逻辑
					if (is_german_subs_blocked_port(game, s)) continue

					let space = data.spaces[s]
					let is_port = space.port
					let is_beachhead = Engine.map.is_beachhead_space(game, s) && space.beach_for === "Lemnos"
					let is_lemnos = s === LEMNOS
					let is_salonika = s === SALONIKA

					if ((is_port || is_beachhead || is_lemnos || is_salonika) && is_controlled_by(game, s, AP)) {
						capacity += get_capacity(game, s)
						if (Engine.map.get_stack_hq_count(get_pieces_in_space(game, s)) === 0) {
							has_hq_space = true
						}
					}
				}
				// 需要 2 个师的空间，且至少有一个空间能放下 HQ
				return capacity >= 2 && has_hq_space
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "desperey")
				game.active = AP
				event.reinf_to_place = ["FR Army Orient 2", "FR DIV #5", "FR DIV #6", "FR D'Esperey HQ"]
				event.reinf_placement = {
					"FR Army Orient 2": "reserve",
					"FR DIV #5": "map",
					"FR DIV #6": "map",
					"FR D'Esperey HQ": "map"
				}
				event.reinf_logic = "is_allied_solidarity_rein"
				game.state = "event_place_reinforcements"
				game.events["desperey"] = true
			},
			defer_end: true
		},
		54: {
			name: "ALLENBY",
			name_cn: "艾伦比",
			effect_cn:
				"(只有在【劳合乔治接管指挥权】后才能打出)。增援:英国第20军团、英国第21军团 至 预备军格。增援:2个英国步兵师，1个澳新骑兵师，1个英国骑兵师，HQ:艾伦比。增援:北阿拉伯军 至协约国控制的亚喀巴 或者 被摧毁栏。如果地图上或者预备军格存在英国精锐步兵师，则将其中一个移除游戏(派往西线)。在剩余的游戏时间内协约国MO掷骰+1drm",
			can_play: function (game) {
				return !!game.events["lloyd_george_takes_command"]
			},
			handler: function (game, ctx) {
				game.mo_ap_modifier += 1
				let event = start_event_data(game, ctx, "allenby")
				game.active = AP
				let units = [
					"BR XX Corps",
					"BR XXI Corps",
					"BR DIV #5",
					"BR DIV #6",
					"ANZ Cavalry #3",
					"BR Cavalry #3",
					"BR Allenby HQ"
				]
				event.reinf_to_place = units
				event.reinf_placement = {
					"BR XX Corps": "reserve",
					"BR XXI Corps": "reserve",
					"BR DIV #5": "map",
					"BR DIV #6": "map",
					"ANZ Cavalry #3": "map",
					"BR Cavalry #3": "map",
					"BR Allenby HQ": "map"
				}
				event.reinf_logic = "is_br"
				// 增援完成后进入移除精锐师状态
				event.reinf_next_state = "event_allenby_remove_elite"

				game.state = "event_place_reinforcements"
				if (is_controlled_by(game, AQABA, AP)) {
					reinforce(game, "BR ANA Arab", AP, AQABA)
				} else {
					let arab = find_piece(AP, "BR ANA Arab")
					if (arab >= 0) Engine.game_utils.remove_piece(game, arab)
				}
				game.events["allenby"] = true
			},
			defer_end: true
		},
		55: {
			name: "LLOYD GEORGE TAKES COMMAND",
			name_cn: "劳合乔治接管指挥权",
			effect_cn:
				"(不能在1916年秋季回合前打出，除非联合战争状态不小于26)。增援:澳新沙漠军团 至预备军格。增援:1个英国步兵师，1个英国骑兵师。在剩余的游戏时间中，每回合获得额外1点英国补员点数，在剩余的游戏时间内协约国MO掷骰+2drm",
			can_play: function (game) {
				let year = get_year(game)
				let season = get_season(game)
				let is_1916_fall_or_later = year > 1916 || (year === 1916 && season === "Fall")
				let is_ws_26_or_higher = (game.combined_war || 0) >= 26
				return is_1916_fall_or_later || is_ws_26_or_higher
			},
			handler: function (game, ctx) {
				game.mo_ap_modifier += 2
				let event = start_event_data(game, ctx, "lloyd_george_takes_command")
				game.active = AP
				let units = ["ANZ Desert Corps", "BR DIV #7", "BR Cavalry #4"]
				event.reinf_to_place = units
				event.reinf_placement = {
					"ANZ Desert Corps": "reserve",
					"BR DIV #7": "map",
					"BR Cavalry #4": "map"
				}
				event.reinf_logic = "is_br"
				game.state = "event_place_reinforcements"
				game.events["lloyd_george_takes_command"] = true
			},
			defer_end: true
		},

		// === CP ===

		56: {
			name: "JIHAD",
			name_cn: "圣战",
			effect_cn: "(不能在同盟国战争状态达到8之后打出)圣战等级+3，获得2点土耳其补员点数",
			can_play: function (game) {
				return (game.war_status_cp || 0) < 8
			},
			handler: function (game) {
				update_jihad_level(game, 3)
				game.rp_cp.tu += 2
				game.events["jihad"] = game.turn
			}
		},
		57: {
			name: "FRESH RECRUITS",
			name_cn: "新兵征募",
			effect_cn: "同盟国玩家获得2点土耳其补员点数，来立即进行土耳其部队的补员",
			handler: function (game) {
				game.fresh_recruits_bonus_tu = 2
				game.fresh_recruits_pieces = []
				game.state = "event_fresh_recruits"
			},
			defer_end: true
		},
		58: {
			name: "ENVER TO CONSTANTINOPLE",
			name_cn: "恩维尔坐镇君士坦丁堡",
			effect_cn:
				"(只能在当前MO为\"恩维尔亲临前线\"时打出)取消本回合的**一次**\"恩维尔亲临前线\"规定的的恩维尔攻势(没有VP惩罚)**(意味着还有一次规定的恩维尔攻势依然必须完成)**，从协约国玩家手中选择三张手牌观看并归还。",
			can_play: function (game) {
				return (
					game.mo_cp === "enver" &&
					!game.mo_cp_fulfilled &&
					!game.mo_cp_1_fulfilled &&
					game.mo_cp_1 !== null &&
					game.mo_cp_1 !== undefined &&
					game.mo_cp_1 !== "none"
				)
			},
			handler: function (game, ctx) {
				if (
					game.mo_cp === "enver" &&
					!game.mo_cp_fulfilled &&
					!game.mo_cp_1_fulfilled &&
					game.mo_cp_1 !== null &&
					game.mo_cp_1 !== undefined &&
					game.mo_cp_1 !== "none"
				) {
					game.mo_cp_1_fulfilled = true
					log(
						game,
						`恩维尔坐镇君士坦丁堡：取消恩维尔强制攻势 #1（${format_mo_log_name(game.mo_cp_1)}）。`,
						ctx
					)
					if (game.mo_cp_1_fulfilled && game.mo_cp_2_fulfilled) {
						game.mo_cp_fulfilled = true
						log(game, "恩维尔坐镇君士坦丁堡：同盟国恩维尔强制攻势已全部完成。", ctx)
					}
				} else {
					log(game, "恩维尔坐镇君士坦丁堡：没有可取消的恩维尔强制攻势 #1。", ctx)
				}
				let hand = Array.isArray(game.hand_ap) ? game.hand_ap.slice() : []
				if (hand.length === 0) {
					log(game, "恩维尔坐镇君士坦丁堡：协约国没有手牌。", ctx)
					return
				}
				let reveal_count = Math.min(3, hand.length)
				let revealed = []
				for (let i = 0; i < reveal_count; i++) {
					let index = random(hand.length, game)
					revealed.push(hand[index])
					hand.splice(index, 1)
				}
				let revealed_names = card_names(revealed, ctx)
				log(game, `协约国手牌：[${revealed_names.join(", ")}]`, ctx)
			}
		},
		59: {
			name: "RESERVES TO THE FRONT CC",
			name_cn: "前线预备役",
			effect_cn:
				"(在战斗结束后打出)。同盟国玩家立即获得2点奖励的土耳其补员点数来对本次战斗中受损的土耳其部队补员(包括在原地重建本次战斗中被摧毁的部队)。受到影响的单位必须停留在原地无法挺进。。该效果可以无视某些单位的无法重建、补员限制进行补员。**(意味着可以对带有圆点标记的、带有三角标记的部队进行补员和原地重建)**"
		},
		60: {
			name: "GERMAN HIGH COMMAND CC",
			name_cn: "德国最高司令部",
			effect_cn: "一次同盟国部队攻击/防御+1drm。"
		},
		61: {
			name: "SANDSTORMS & MOSQUITOES CC",
			name_cn: "沙尘暴和疟蚊",
			effect_cn: "一回合只能有一次，取消一次从沙漠/沼泽地区发起 或 向沙漠/沼泽地区进行的协约国攻击。",
			handler: function (game) {
				game.events["sandstorms_mosquitoes"] = game.turn
			}
		},
		62: {
			name: "GOEBEN",
			name_cn: "戈本号",
			effect_cn:
				"立即减少2点俄国补员点数（不能被取消）炮击巴统，掷一次骰子，结果为奇数时，摧毁巴统的要塞（要塞内的俄军不受伤害）",
			handler: function (game) {
				// 立即减少 2 点俄国补员点数
				let current_ru_rp = game.rp_ap.ru || 0
				game.rp_ap.ru = Math.max(0, current_ru_rp - 2)
				// 切换到炮击状态，让玩家掷骰
				game.active = CP
				game.state = "event_goeben"
				game.events["goeben"] = true
			},
			defer_end: true
		},
		63: {
			name: "GERMAN MILITARY ADVISERS",
			name_cn: "德国军事顾问",
			effect_cn: "获得1点土耳其补员点数。在任何安纳托利亚地区或者加里波利地图内的地区放置4处1级战壕",
			handler: function (game, ctx) {
				game.rp_cp.tu += 1
				game.active = CP
				game.events["german_military_advisers"] = true
				start_event_data(game, ctx, "german_military_advisers").trenches_to_place = 4
				game.state = "event_german_military_advisers_trench"
			},
			defer_end: true
		},
		64: {
			name: "PARLIAMENTARY INQUIRY",
			name_cn: "议会质询",
			effect_cn:
				"(只有在有英国/印度的LCU存在于摧毁格栏，或者被永久移除(包括从滩头撤退)时打出。注:若协约国方只有通过调离战线被永久移除的LCU，则不能满足发动条件)(不能在【劳合乔治接管指挥权】后打出)在本回合剩余的时间内，协约国不能再记录英国补员点数。任何包括英国或者印度军队的堆叠需要耗费额外1点OP启动。",
			can_play: function (game) {
				if (game.events["lloyd_george_takes_command"]) return false
				for (let p = 1; p < data.pieces.length; p++) {
					let info = data.pieces[p]
					if (!info || info.faction !== AP) continue
					if (!is_lcu(p)) continue
					if (info.nation !== "br" && info.nation !== "in" && info.nation !== "in-g") continue
					let loc = game.pieces[p]
					if (loc === AP_ELIMINATED || loc === AP_REMOVED || loc === AP_PE) return true
				}
				return false
			},
			handler: function (game) {
				game.events["parliamentary_inquiry"] = game.turn
			}
		},
		65: {
			name: "PERSIAN PUSH",
			name_cn: "波斯攻势",
			effect_cn:
				"增援:1个土耳其-阿拉伯步兵师 至任何同盟国控制的美索不达米亚地区。可以立即启动一处高加索、阿赛拜疆或美索不达米亚的部队进行移动。从现在开始到游戏结束，双方玩家的部队都可以进入中立的波斯地区。",
			handler: function (game, ctx) {
				game.events["persian_push"] = true
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["Persian_Neutrality"] = "MPENV.png"
				game.active = CP
				start_event_data(game, ctx, "persian_push", { reinf_to_place: ["TU-A DIV #10"] })
				game.state = "event_persian_push_place"
			},
			defer_end: true
		},
		66: {
			name: "SAVE TIFLIS CC",
			name_cn: "回援第比利斯",
			effect_cn:
				"(只能在土耳其LCU攻击俄国LCU的战斗撤退选择阶段时打出。不能在【尼古拉大公抵达第比利斯】后打出)协约国玩家需要把所有阿塞拜疆、波斯和土耳其的俄国单位向第比利斯方向撤退一格。俄国位于完好要塞内的部队、有尤德尼奇HQ驻扎的部队可以免受影响。如果不能进行合法撤退或无法更接近第比利斯，这些单位留在原地。满员的土耳其/土耳其-阿拉伯部队可以照常挺进。",
			handler: function (game) {
				game.events["save_tiflis"] = game.turn
			}
		},
		67: {
			name: "LIBERATE SUEZ",
			name_cn: "解放苏伊士",
			effect_cn:
				"(黄色事件)(只有在圣战等级不小于1时才能打出)当作事件打出时，正常使用此牌记录的OP点数，其中至少2OP必须用于在埃及地区对协约国的战斗，这些战斗获得+1drm修正。获得1点土耳其补员点数，圣战等级+1，允许在【泛突厥主义】后在埃及进行圣战叛乱。",
			can_play: function (game) {
				return game.jihad >= 1
			},
			use_ops: true,
			handler: function (game) {
				game.rp_cp.tu += 1
				update_jihad_level(game, 1)
				game.events["liberate_suez"] = game.turn
				game.events["liberate_suez_active"] = true
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["Egypt Uprising"] = "MEGRBA.PNG"

				// 规则补充：至少2OP必须用于在埃及地区对协约国的战斗，这些战斗获得+1drm修正。
				game.liberate_suez_op_required = true
				game.liberate_suez_battle_required = true
				game.liberate_suez_min_egypt_attack_ops = 2
				game.liberate_suez_egypt_attacked_spaces = []
				game.liberate_suez_egypt_battle_done = false
				game.liberate_suez_drm = true
			}
		},
		68: {
			name: "PAN-TURKISM",
			name_cn: "泛突厥主义",
			effect_cn:
				"(黄色事件)增援: 2个土耳其精锐步兵师，1个土耳其骑兵师。获得1点土耳其补员点数，圣战等级+1，允许实施圣战叛乱。允许协约国打出【亚美尼亚起义】。",
			use_ops: true,
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "pan_turkism")
				game.active = CP
				let units = ["TU Elite DIV #9", "TU Elite DIV #10", "TU Cavalry #5"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				game.rp_cp.tu += 1
				game.events["pan_turkism"] = true
				event.reinf_logic = "is_tu"
				game.state = "event_place_reinforcements"

				update_jihad_level(game, 1)
			},
			defer_end: true
		},
		69: {
			name: "INDIAN MUTINY",
			name_cn: "印度哗变",
			effect_cn:
				"(只有在圣战等级不小于9时才能打出)(黄色事件)当作事件打出时，正常使用此牌记录的OP点数。本轮任何土耳其对印度部队的攻击+1drm。+1圣战等级，允许在【泛突厥主义】后在印度进行圣战叛乱。",
			can_play: function (game) {
				return game.jihad >= 9
			},
			use_ops: true,
			handler: function (game) {
				update_jihad_level(game, 1)
				game.events["indian_mutiny"] = game.turn
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["Indian_Mutiny"] = "MINMUTA.png"
				// 规则补充：本轮任何土耳其对印度部队的攻击+1drm
				game.indian_mutiny_drm = true
			}
		},
		70: {
			name: "DJEMEAL CRUSHES SECRET SOCIETIES",
			name_cn: "杰马勒粉碎秘密社团",
			effect_cn:
				"(黄色事件)当作事件打出时，正常使用此牌记录的OP点数。本回合剩余时间协约国手牌需要持续公开。+1圣战等级",
			use_ops: true,
			handler: function (game, ctx) {
				update_jihad_level(game, 1)
				game.events["djemeal_crushes_secret_societies"] = game.turn

				// 公开协约国手牌逻辑：直接记录 Log
				if (game.hand_ap && game.hand_ap.length > 0) {
					let hand_names = card_names(game.hand_ap, ctx)
					log(game, `协约国当前手牌: ${hand_names.join(", ")}`, ctx)
				} else {
					log(game, "协约国当前没有手牌。", ctx)
				}
			}
		},
		71: {
			name: "CONSTANTINE",
			name_cn: "康斯坦丁国王",
			effect_cn:
				"只有当【鲁贝尔堡的背叛】在弃牌堆或者已移出游戏时才能打出。或者在希腊事件打出后的紧接着的CP行动轮打出，取消希腊的所有效果。同盟国控制塞萨洛尼基。增援: 3个希腊师，1个希腊骑兵师。+1VP",
			can_play: function (game) {
				let snap = game.events["greece_snapshot"]
				if (snap && snap.turn === game.turn && snap.action_round === game.action_round) {
					return true
				}
				return Engine.neutral.check_constantine_entry_conditions(game)
			},
			handler: function (game, ctx) {
				const { neutral } = Engine

				let snap = game.events["greece_snapshot"]
				if (snap && snap.turn === game.turn && snap.action_round === game.action_round) {
					game.vp += 1
					log(game, "康斯坦丁国王取消【希腊】事件效果，+1 VP 恢复。", ctx)

					for (let p_str in snap.pieces) {
						let p = Number(p_str)
						let saved = snap.pieces[p_str]
						game.pieces[p] = saved.space
						if (saved.reduced) {
							if (!game.reduced) game.reduced = []
							if (!game.reduced.includes(p)) game.reduced.push(p)
						} else if (game.reduced) {
							let idx = game.reduced.indexOf(p)
							if (idx >= 0) game.reduced.splice(idx, 1)
						}
					}

					if (snap.war_status_ap !== undefined) {
						game.war_status_ap = snap.war_status_ap
						game.combined_war = snap.combined_war !== undefined ? snap.combined_war : Math.min(40, game.war_status_ap + game.war_status_cp)
						log(game, `AP 战争状态恢复至 ${game.war_status_ap}，联合战争状态恢复至 ${game.combined_war}。`, ctx)
					}

					delete game.events["greece"]
					delete game.events["greece_event_played"]
					delete game.entry_gr

					for (let s = 1; s < data.spaces.length; s++) {
						if (data.spaces[s] && data.spaces[s].nation === "gr") {
							if (game.control && game.control[s] !== undefined) {
								delete game.control[s]
							}
						}
					}
					if (game.neutral_vp_first_captor) {
						delete game.neutral_vp_first_captor[ATHENS]
					}

					if (game.removed_ap) {
						let idx = game.removed_ap.indexOf(45)
						if (idx >= 0) {
							game.removed_ap.splice(idx, 1)
							if (!game.discard_ap) game.discard_ap = []
							game.discard_ap.push(45)
						}
					}

					log(game, "【希腊】从移除牌堆回到弃牌堆，希腊单位恢复原状。", ctx)
					delete game.events["greece_snapshot"]
				}

				if (neutral.is_greece_neutral(game) && neutral.check_constantine_entry_conditions(game)) {
					neutral.trigger_greece_entry(game, null, CP, "康斯坦丁国王事件", (msg) => log(game, msg, ctx))
				}

				game.events["constantine"] = true
			}
		},
		72: {
			name: "TREACHERY AT FORT RUPEL",
			name_cn: "鲁贝尔堡的背叛",
			effect_cn:
				"(只有在希腊仍保持中立，协约国部队占据萨洛尼卡时才能打出)所有希腊部队(希腊国防军除外)移动至拉米亚或者雅典(同盟国玩家选择其一)，随后与多里安或鲁贝尔堡相邻的同盟国部队可以挺进一格，进入相邻的多里安或鲁贝尔堡。挺进多里安时接收当地2级战壕，该战壕不会降级；挺进鲁贝尔堡时同盟国直接控制鲁贝尔堡，该要塞转为同盟国控制且不需要进攻。打出该卡不会侵犯希腊的中立。",
			can_play: function (game) {
				const { neutral } = Engine
				if (game.events["constantine"]) return false
				if (!neutral.is_greece_neutral(game)) return false

				let salonika = find_space("Salonika")
				if (salonika >= 0) {
					let pieces = get_pieces_in_space(game, salonika)
					return pieces.some((p) => data.pieces[p].faction === AP)
				}
				return false
			},
			handler: function (game, ctx) {
				const { neutral } = Engine

				let greek_units_to_move = []
				for (let p = 1; p < game.pieces.length; p++) {
					if (
						neutral.is_greek_piece(p) &&
						!neutral.is_greek_cnd(p) &&
						!Engine.game_utils.is_not_on_map(game, p)
					) {
						greek_units_to_move.push(p)
					}
				}

				game.events["rupel"] = true
				start_event_data(game, ctx, "rupel", {
					greek_units: greek_units_to_move,
					destinations: [LAMIA, ATHENS],
					rupel_advanced_pieces: []
				})

				if (greek_units_to_move.length > 0) {
					game.active = CP
					game.state = "event_rupel_move_greek_units"
					return
				}

				events_by_id[72].begin_cp_advance(game, ctx)
			},
			begin_cp_advance: function (game, ctx) {
				let event = start_event_data(game, ctx, "rupel")
				if (!Array.isArray(event.rupel_advanced_pieces)) event.rupel_advanced_pieces = []
				delete event.rupel_selected_piece
				game.active = CP
				game.state = "event_rupel_advance_cp_units"
			},
			get_advance_targets: function (game, p) {
				if (!data.pieces[p]) return []
				if (Engine.game_utils.is_not_on_map(game, p)) return []
				if (Engine.game_utils.get_piece_effective_faction(game, p) !== CP) return []
				let from = game.pieces[p]
				if (!(from > 0) || !data.spaces[from]) return []
				let connections = data.spaces[from].connections || []
				return [DOIRAN, FORT_RUPEL].filter((target) => target > 0 && connections.includes(target))
			},
			get_advance_pieces: function (game, event) {
				let advanced = Array.isArray(event && event.rupel_advanced_pieces) ? event.rupel_advanced_pieces : []
				let pieces = []
				for (let p = 1; p < game.pieces.length; p++) {
					if (advanced.includes(p)) continue
					if (events_by_id[72].get_advance_targets(game, p).length > 0) pieces.push(p)
				}
				return pieces
			},
			resolve_cp_advance: function (game, p, target, ctx) {
				let targets = events_by_id[72].get_advance_targets(game, p)
				if (!targets.includes(target)) return false

				let event = start_event_data(game, ctx, "rupel")
				if (!Array.isArray(event.rupel_advanced_pieces)) event.rupel_advanced_pieces = []
				if (event.rupel_advanced_pieces.includes(p)) return false

				let from = game.pieces[p]
				game.pieces[p] = target
				if (from > 0) {
					Engine.sync_neutral_vp_state(game, from)
					Engine.sync_jihad_city_state(game, from)
					Engine.sync_region_control(game, from)
				}
				Engine.sync_neutral_vp_state(game, target)
				Engine.sync_jihad_city_state(game, target)
				Engine.sync_region_control(game, target)
				if (!game.move_animation) game.move_animation = []
				game.move_animation.push([p, target])

				Engine.utils.set_add(event.rupel_advanced_pieces, p)
				let effects = []
				if (Engine.game_utils.has_trench(game, target) > 0) {
					let trench_result = Engine.game_utils.enter_trench(game, target, CP, {
						capture_level_2_intact: target === DOIRAN
					})
					if (trench_result.action === "captured_intact") effects.push("接收当地2级战壕")
					else if (trench_result.action === "degraded") effects.push("当地2级战壕降为同盟国1级战壕")
					else if (trench_result.action === "removed") effects.push("清除当地战壕")
				}
				if (typeof Engine.set_control === "function") Engine.set_control(game, target, CP)
				if (data.spaces[target].fort && typeof Engine.map.set_fort_owner === "function") {
					Engine.map.set_fort_owner(game, target, CP)
					if (game.forts && Array.isArray(game.forts.destroyed))
						Engine.utils.set_delete(game.forts.destroyed, target)
					effects.push("接收当地要塞")
				}

				let suffix = effects.length > 0 ? `，${effects.join("并")}。` : "。"
				log(
					game,
					`鲁贝尔堡的背叛：${piece_log_name(game, p)} 从 ${space_log_name(from)} 挺进 ${space_log_name(target)}${suffix}`,
					ctx
				)
				return true
			},
			defer_end: true
		},
		73: {
			name: "TURKISH REINFORCEMENTS",
			add_rein_record: "tu",
			name_cn: "土耳其增援",
			effect_cn: "增援: 4个土耳其-阿拉伯精锐步兵师。如果在【阿拉伯起义】后打出，则这些部队以受损面进入。",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "turkish_reinf_73")
				game.active = CP
				let units = ["TU-A DIV #11", "TU-A DIV #12", "TU-A DIV #13", "TU-A DIV #14"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				let reduced = !!game.events["arab_revolt"]
				if (reduced) {
					for (let unit of units) {
						let p = find_piece(CP, unit)
						if (p >= 0 && data.pieces[p].piece_class === "SCU" && !set_has(game.reduced, p)) {
							set_add(game.reduced, p)
						}
					}
					log(game, "因为阿拉伯起义，这些部队以受损面进入。")
				}

				event.reinf_logic = "is_tua"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		74: {
			name: "SURPRISE CC",
			name_cn: "惊喜",
			effect_cn:
				"(只能在防守部队位于美索不达米亚、叙利亚/巴勒斯坦或者西奈时才能打出)(不能在【皇家空军】后打出)同盟国可以立即将1-2个土耳其/土耳其-阿拉伯师的战略调整至防守地区。这次行动不被计入战略调整。(意味着下一个行动轮同盟国玩家还可以选择进行战略调整行动)",
			can_play: function (game) {
				// CC cards played as events must meet the same conditions as CC
				if (!game.attack) return false
				if (game.active !== CP) return false
				if (game.events && game.events["royal_flying_corps_permanent"]) return false

				// Surprise is defender only (when played during combat)
				// Note: in RTT combat sequence, game.active is the defender when playing defender CCs.
				// However, if this is called via an Event action, game.active is the attacker!
				// But we check has_attack(game), which is only true during combat.
				// If we are in combat, game.active is the player whose turn it is to play CC.
				// So if it's the defender's turn to play CC, game.active is the defender.
				let is_active_attacker = game.attack.pieces.some(
					(p) => Engine.game_utils.get_piece_effective_faction(game, p) === game.active
				)
				if (is_active_attacker) return false

				let area = Engine.map.get_area(game.attack.space)
				return ["mesopotamia", "syria_palestine", "sinai"].includes(area)
			},
			handler: function (game) {
				game.events["surprise"] = game.turn
				if (game.attack) {
					game.surprise = { remaining: 2, space: game.attack.space }
					game.state = "surprise_sr"
				}
			}
		},
		75: {
			name: "JAFAR PASHA CC",
			name_cn: "贾法尔帕夏",
			effect_cn:
				"允许防守方选择。A:在战斗发生前后撤一格。B:在第一次掷骰结果发生后，重新进行一次掷骰。。在战斗发生后，进行一次掷骰，结果为1-3时，将其交予协约国方保持正面朝上，使其可以选择在一次战斗中当作CC使用。以此方法使用后该卡移除游戏。结果为4-6时，丢入弃牌堆。",
			handler: function (game) {
				reinforce(game, "Jafar Pasha HQ", CP)
				game.events["jafar_pasha"] = true
			}
		},
		76: {
			name: "FLIEGERABTEILUNG CC",
			name_cn: "飞行分队",
			effect_cn: "(不能在协约国打出【皇家空军】后打出)一次同盟国攻击/防御+1drm。",
			can_play: function (game) {
				return !(game.events && game.events["royal_flying_corps_permanent"])
			},
			handler: function (game) {
				game.events["fliegerabteilung"] = game.turn
			}
		},
		77: {
			name: "GERMAN SUBS IN THE MED",
			name_cn: "地中海潜艇猎袭",
			effect_cn:
				"本回合内，协约国不能将增援送入东地中海或爱琴海。这同样适用于任何允许把单位直接放上地图的事件，以及作为英国增援打出的入侵牌；但不阻止作为入侵打出的入侵牌，也不阻止这些入侵附带的战略调整。此后当雅典不被协约国控制时，任何仅通过东地中海或爱琴海计算补给线的协约国部队启动花费+1，战略调整花费+1。",
			// Rule 13.3.2: the reinforcement block lasts only for the turn played.
			// The persistent flag remains because later effects care that the card has been played.
			handler: function (game, ctx) {
				game.events["german_subs"] = true
				game.events["german_subs_turn"] = game.turn
				log(game, "地中海潜艇猎袭：本回合协约国不能将增援送入东地中海或爱琴海。", ctx)
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["SUB IN THE MED"] = "MUBMed.png"
				let p = find_piece(undefined, "U_boats in the Med token")
				if (p >= 0) {
					game.pieces[p] = REMOVED
				}
			}
		},
		78: {
			name: "GERMAN INTRIGUES IN PERSIA",
			name_cn: "德国的波斯密谋",
			effect_cn:
				"(只有在同盟国控制巴格达时才能打出)。+1圣战等级。在任何不被占据的或者同盟国占据的中立波斯地区放置波斯起义军。在中立波斯的任意三个地区(可以包括VP)放置波斯起义标记。",
			can_play: function (game) {
				let baghdad = find_space("Baghdad")
				return baghdad >= 0 && is_controlled_by(game, baghdad, CP)
			},
			handler: function (game, ctx) {
				game.events["german_intrigue_persia"] = true
				let event = start_event_data(game, ctx, "german_intrigues_persia", {
					unit_name: "PE Uprising",
					unit_spaces: get_german_intrigues_unit_spaces(game),
					markers_to_place: 3,
					marker_spaces: []
				})
				game.active = CP
				if (!Array.isArray(game.persian_uprising_markers)) game.persian_uprising_markers = []
				event.unit_spaces = get_german_intrigues_unit_spaces(game)
				game.state = "event_german_intrigues_persia_unit"
				update_jihad_level(game, 1)
			},
			defer_end: true
		},
		79: {
			name: "MISSION TO AFGHANISTAN",
			name_cn: "阿富汗使团",
			effect_cn:
				"(只能在圣战等级不小于4时打出)。+1圣战等级。允许在【泛突厥主义】打出后在阿富汗地区和中亚地区发动圣战叛乱。",
			can_play: function (game) {
				return game.jihad >= 4
			},
			handler: function (game) {
				update_jihad_level(game, 1)
				game.events["mission_to_afghanistan"] = true
				if (!game.ui_tokens) game.ui_tokens = {}
				game.ui_tokens["Afghan_Alliance"] = "MAFALA.png"
				game.ui_tokens["C.Asia_Revolt"] = "MCASRVA.png"
			}
		},
		80: {
			name: "TURKISH REINFORCEMENTS",
			add_rein_record: "tu",
			name_cn: "土耳其增援",
			effect_cn: "增援: 5个土耳其步兵师，1个土耳其骑兵师。",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "turkish_reinf_80")
				game.active = CP
				let units = ["TU DIV #13", "TU DIV #14", "TU DIV #15", "TU DIV #16", "TU DIV #17", "TU Cavalry #6"]
				event.reinf_to_place = units
				event.reinf_placement = "either"
				event.reinf_logic = "is_tu"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		81: {
			name: "TURKISH REINFORCEMENTS",
			add_rein_record: "tu",
			name_cn: "土耳其增援",
			effect_cn:
				"增援: 将土耳其第14军团、土耳其第15军团、土耳其第16军团、土耳其第17军团和土耳其-阿拉伯第18军团放置在预备军格。增援: 1个土耳其步兵师，1个土耳其-阿拉伯步兵师。可以立即对这些军进行符合条件的LCU组合。",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "turkish_reinf_81")
				game.active = CP
				let units = [
					"TU XIV Corps",
					"TU XV Corps",
					"TU XVI Corps",
					"TU XVII Corps",
					"TU-A XVIII Corps",
					"TU DIV #18",
					"TU-A DIV #15"
				]
				event.reinf_to_place = units
				event.reinf_placement = {
					"TU XIV Corps": "reserve",
					"TU XV Corps": "reserve",
					"TU XVI Corps": "reserve",
					"TU XVII Corps": "reserve",
					"TU-A XVIII Corps": "reserve",
					"TU DIV #18": "either",
					"TU-A DIV #15": "either"
				}

				event.reinf_logic = {
					"TU XIV Corps": "is_tu",
					"TU XV Corps": "is_tu",
					"TU XVI Corps": "is_tu",
					"TU XVII Corps": "is_tu",
					"TU-A XVIII Corps": "is_tua",
					"TU DIV #18": "is_tu",
					"TU-A DIV #15": "is_tua"
				}
				game.state = "event_place_reinforcements"
				event.reinf_next_state = "event_turkish_reinf_81_combine"
			},
			defer_end: true
		},
		82: {
			name: "CATASTROPHIC ATTACK CC",
			name_cn: "灾难性攻击",
			effect_cn:
				"同盟国防守战斗卡。选择一个参战且包含英国/印度/澳新战斗单位的进攻堆叠，使其整堆撤退 1 格；若无法撤退则永久消灭。若触发 Turkish Withdrawal，则取消该撤退。随后参战的同盟国防守部队可最多挺进 3 格；第一格必须进入被腾空的进攻来源地，之后可以穿过该撤退堆叠所在地，但不能停在那里。",
			handler: function (game) {
				game.events["catastrophic_attack"] = game.turn
			}
		},
		83: {
			name: "I ORDER YOU TO DIE CC",
			name_cn: "战斗至死！",
			effect_cn: "一个完全由土耳其部队组成的堆叠在防御时视为处于1级战壕内。若已在1级战壕内则视为处于2级战壕内。",
			handler: function (game) {
				game.events["i_order_you_to_die"] = game.turn
			}
		},
		84: {
			name: "ENVER-FALKENHAYN SUMMIT",
			name_cn: "恩维尔-法金汉首脑会议",
			effect_cn:
				"(只能在君士坦丁堡-加利西亚的铁路相连时打出)。增援:(保加利亚第4集团军)至任何保加利亚境内同盟国控制地区。同盟国获得并使用最多8点战略调整点数将土耳其/土耳其-阿拉伯部队战略调整至巴尔干。*这其中至少应包含一个至加利西亚的土耳其LCU*。每个回合损耗结算阶段，若俄国革命还未达到第4阶段，则位于加利西亚的土耳其LCU需要进行一次伤害结算，因为其在加利西亚战线对抗俄国军队经历了激烈的战斗。*进行一次掷骰来决定受到伤害的多少。**。每个夏季回合的战争状态结算阶段，若有土耳其LCU仍位于加利西亚，则由于土耳其军队在东线对抗俄国的战果，可以获得+1VP(在俄国革命阶段达到第4阶段时，无法继续获得VP)。- **(注:土耳其单位只能通过该事件进入加利西亚大区。土耳其永远不能在加利西亚重建LCU或者进行LCU组合。当能够通过己方控制地区连接至君士坦丁堡等土耳其补给源时，加利西亚的受损土耳其LCU可以接受补员)",
			can_play: function (game) {
				return can_play_enver_falkenhayn_summit(game)
			},
			handler: function (game, ctx) {
				game.active = CP
				let event = start_event_data(game, ctx, "enver_falkenhayn_summit")
				event.sr_points = 8
				game.events["enver_falkenhayn_summit_active"] = true
				event.reinf_logic = "is_bu_bulgaria"
				event.reinf_to_place = ["BU 4 Army"]
				event.reinf_placement = "map"
				event.reinf_next_state = "event_enver_falkenhayn_sr"
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		85: {
			name: "BULL'S EYE DIRECTIVE",
			name_cn: "靶心指令",
			effect_cn:
				"(黄色事件)。当作事件打出时，正常使用此牌记录的OP点数。在**所有**被本轮启动战斗的地区从预备军格战略调整1个土耳其/土耳其-阿拉伯SCU**(此时忽略堆叠限制，意味着这些地区在本次战斗中可以容纳3个以上的单位)**。本轮任何对俄国的进攻+1drm。战斗胜利后挺进的一支土耳其/土耳其-阿拉伯部队堆叠可以被再度启动进行一次额外攻击。。战斗全部结束后，将所有超过堆叠限制的SCU放回预备军格。",
			use_ops: true,
			handler: function (game) {
				game.events["bulls_eye_directive"] = game.turn
				game.events["bulls_eye_used"] = false
				game.bulls_eye_sr_done = false
				game.bulls_eye_sr_spaces = []
				game.bulls_eye_advanced_stack = []
			}
		},
		86: {
			name: "GORLICE-TARNOW",
			can_play: function (game) {
				return get_russian_revolution_level(game) < 1
			},
			name_cn: "戈尔利采-塔尔诺夫攻势",
			effect_cn:
				"协约国玩家需要选择:。A: VP+2。B: 将一个地图上的俄国LCU暂时移除游戏(派往东线)，4个回合后重新放置在预备军格。阻止继续记录本回合的俄国补员点数。",
			handler: function (game) {
				start_event_data(game, null, "gorlice_tarnow", { origin_active: game.active })
				game.events["gorlice_tarnow"] = game.turn
				game.active = AP
				game.state = "event_gorlice_tarnow_choice"
			},
			defer_end: true
		},
		87: {
			name: "VERDUN",
			name_cn: "凡尔登战役",
			effect_cn:
				"(只有在安纳托利亚地区以及加里波利小地图的陆上没有协约国LCU时才能打出)。协约国玩家可将合法单位移至移除格；确认后系统自动结算：未满足条件则同盟国 +2VP，达到至少2个师当量则同盟国仅 +1VP，达到至少4个师当量则同盟国不获得 VP。(注: 1LCU=3SCU；可超额移除但不会找零。必须满足规则 21.1 的精锐/特种、BR→ANZ→IN 优先和补给要求。骑兵、骆驼以及英国特殊部队不能用于此效果。)",
			can_play: function (game) {
				return !has_allied_lcu_in_verdun_restricted_zone(game)
			},
			handler: function (game, ctx) {
				start_event_data(game, ctx, "verdun", { origin_active: CP })
				game.events["verdun"] = true
				game.active = AP
				game.state = "event_verdun_remove"
			},
			defer_end: true
		},
		88: {
			name: "BULGARIA",
			name_cn: "保加利亚",
			effect_cn: "——中立国参战——。保加利亚加入同盟国，按照规则中的保加利亚参战条目放置同盟国和协约国单位。",
			can_play: function (game) {
				return can_play_neutral_entry_this_turn(game)
			},
			handler: function (game, ctx) {
				Engine.neutral.trigger_bulgaria_entry(game)
				Engine.neutral.place_bulgaria_third_army(game)
				if (typeof Engine.map.check_supply === "function") {
					Engine.map.check_supply(game)
				}
				if (ctx && typeof ctx.goto_end_event === "function") ctx.goto_end_event()
				else game.state = "end_event"
			},
			defer_end: true
		},
		89: {
			name: "PARVUS TO BERLIN",
			name_cn: "帕尔乌斯游说柏林",
			effect_cn:
				"开始进行俄国革命计时。把帕尔乌斯标志放置在第五回合，把俄国革命标志放置在第九回合。把\"上帝保佑沙皇\"标志放置在帕尔乌斯的同一回合，随后根据俄国VP标记调整其位置。俄国VP标记反映的是俄国在高加索战场所取得的成果。每当*接受俄国补给源补给*的俄国部队(或俄国波斯部队、亚美尼亚起义军)**占领一个非协约国原始VP点**，或者**解放一个协约国原始VP点**时，放置1个俄国占领标志，该标记向后移动一格。。每当俄国境内(俄国和阿塞拜疆)VP点被同盟国占领，或者放置了俄国占领标记的VP点被同盟国解放时，该标记向前移动一格。\"上帝保佑沙皇\"标志和俄国VP标志保持一致进行移动，但是当【不冻港】事件发生后，\"上帝保佑沙皇\"标志永远位于俄国VP标志+2的位置(革命推迟2个回合)。每个回合革命阶段，检查俄国革命标志和\"上帝保佑沙皇\"标志的位置。当回合纪录标志到达俄国革命标志及其以后的回合，同时满足到达\"上帝保佑沙皇\"标志及其以后的回合时，俄国革命开始，移除帕尔乌斯标志和\"上帝保佑沙皇\"标志，将俄国革命标志放置在革命进程进度条内的1位置，并在每个接下来的回合革命阶段前进一格。。- **(例外:某个回合革命阶段，当俄国占领了君士坦丁堡时，即使已经满足革命发生的条件，未发生的俄国革命不会发生，已发生的革命不会继续推进)**",
			handler: function (game) {
				game.events["parvus_to_berlin"] = PARVUS_MARKER_TURN
				game.events["russian_revolution_timer"] = REVOLUTION_MARKER_TURN
				sync_russian_revolution_markers(game)
			}
		},
		90: {
			name: "TOWNSHEND TO LEMNOS",
			name_cn: "汤森德谈判",
			effect_cn: "(只有在联合战争状态不小于32且【英国厌战】后才能打出)。同盟国自动胜利标记左移1格。",
			can_play: function (game) {
				return game.combined_war >= 32 && game.events["british_war_weariness"]
			},
			handler: function (game, ctx) {
				game.events["townshend_to_lemnos"] = true
				shift_cp_auto_victory_marker(game, -1, ctx, "汤森德谈判")
			}
		},
		91: {
			name: "APIS",
			name_cn: "\"蜜蜂\"党骚乱",
			effect_cn:
				"立即消灭一个塞尔维亚集团军(同盟国选择)。本回合塞尔维亚军队无法用于进攻**(但是协约国玩家在启动包含这些单位的地区时，仍需计算其启动花费)**",
			handler: function (game) {
				game.events["apis"] = game.turn
				game.active = CP
				game.state = "event_apis_eliminate"
			},
			defer_end: true
		},
		92: {
			name: "TURKISH REINFORCEMENTS",
			add_rein_record: "tu",
			name_cn: "土耳其增援",
			effect_cn:
				"增援:4个土耳其-阿拉伯步兵师。在叙利亚/巴勒斯坦地区或者西奈地区增加1处战壕。。如果在【阿拉伯起义】后打出，则这些部队以受损面进入。",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "turkish_reinf_92")
				game.active = CP
				event.reinf_to_place = ["TU-A DIV #16", "TU-A DIV #17", "TU-A DIV #18", "TU-A DIV #19"]
				event.reinf_placement = "either"
				event.reinf_logic = "is_tua"
				event.reinf_next_state = "event_turkish_reinf_92_trench"
				let reduced = !!game.events["arab_revolt"]
				for (let unit of event.reinf_to_place) {
					let p = find_piece(CP, unit)
					if (p >= 0 && reduced && data.pieces[p].piece_class === "SCU" && !set_has(game.reduced, p)) {
						set_add(game.reduced, p)
					}
				}

				event.trenches_to_place = 1
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		93: {
			name: "WATER SHORTAGE CC",
			name_cn: "淡水短缺",
			effect_cn:
				"(可以在战斗掷骰阶段后打出。只能适用于美索不达米亚、叙利亚/巴勒斯坦或者西奈的防守战斗)。获胜的协约国部队战斗后无法挺进，战败的同盟国部队无需撤退。",
			handler: function (game) {
				game.events["water_shortage"] = game.turn
			}
		},
		94: {
			name: "PASHA 1 CC",
			name_cn: "帕夏一号",
			effect_cn: "这次战斗中，同盟国进攻或防守部队忽略恶劣天气修正，并可以以强火力表(LCU火力表)开火。",
			handler: function (game) {
				game.events["pasha_1"] = game.turn
			}
		},
		95: {
			name: "TO HELP AND SAVE YOU",
			name_cn: "拯救保加利亚",
			effect_cn:
				"(只有在保加利亚/塞尔维亚地区存在协约国LCU时才能打出)。同盟国可以以每个LCU，每三个SCU-1VP合作将位于**摧毁栏**以及**此前永久移除**的任何奥匈或者德国单位重新以减损面放置在加利西亚地区。",
			can_play: function (game) {
				let has_ap_lcu = false
				for (let p = 1; p < data.pieces.length; p++) {
					if (is_lcu(p) && get_piece_effective_faction(game, p) === AP) {
						let s = game.pieces[p]
						if (s > 0) {
							let nation = data.spaces[s].nation
							if (nation === "bu" || nation === "sb") {
								has_ap_lcu = true
								break
							}
						}
					}
				}
				return has_ap_lcu
			},
			handler: function (game) {
				game.events["to_help_and_save_you"] = true
				game.active = CP
				game.state = "event_to_help_and_save_you"
			},
			defer_end: true
		},
		96: {
			name: "TALAAT PASHA REFORMS CABINET",
			name_cn: "塔拉特帕夏内阁改革",
			effect_cn: "(只有在VP小于10时才能打出)。本次游戏剩余的时间取消所有的同盟国MO掷骰(本回合的MO也会被取消)。",
			can_play: function (game) {
				return game.vp < 10
			},
			handler: function (game) {
				game.mo_cp_cancelled = true
				game.events["talaat_pasha"] = true
				game.mo_cp = "none"
				game.mo_cp_fulfilled = true
				game.mo_cp_1_fulfilled = true
				game.mo_cp_2_fulfilled = true
			}
		},
		97: {
			name: "CZAR'S ARMORIES CC",
			name_cn: "缴获沙皇军火",
			effect_cn:
				"(只能在俄国革命开始后，且在本次战斗中俄国境内VP被同盟国部队挺进占领时，挺进结束后才能打出)。同盟国立即获得4点土耳其补员点数来给高加索、俄国或者阿塞拜疆的土耳其部队补员。",
			can_play: function (game) {
				return game.events["russian_revolution"]
			},
			handler: function (game) {
				game.rp_cp.tu += 4
			}
		},
		98: {
			name: "CONFUSED ORDERS CC",
			name_cn: "混乱指令",
			effect_cn:
				"(只能在战斗掷骰后、挺进/撤退阶段前打出)。取消一次协约国的挺进和(或者)同盟国的撤退。。可以立即移动一个同盟国单位进入防守部队所在地区。(需要满足堆叠限制)",
			handler: function (game) {
				game.events["confused_orders"] = game.turn
			}
		},
		99: {
			name: "ARMY OF ISLAM CC",
			name_cn: "伊斯兰军",
			effect_cn:
				"(只能在【泛突厥主义】后、圣战等级不小于6时打出)。- **在战斗开始前，**增援:HQ:土耳其伊斯兰军，至任何被启动进行攻击的高加索、俄国、阿塞拜疆或者中立波斯的土耳其/土耳其-阿拉伯部队。。- 仅在这次战斗中，同盟国可以首先开火。",
			can_play: function (game) {
				return game.events["pan_turkism"] && game.jihad >= 6
			},
			handler: function (game) {
				reinforce(game, "TU Army Islam HQ", CP)
				game.events["army_of_islam"] = true
			}
		},
		100: {
			name: "YILDRIM",
			name_cn: "耶尔德里姆",
			effect_cn:
				"增援:3个德国耶尔德里姆步兵师，至任何可以连接至加利西亚的土耳其补给点。。如果法金汉HQ尚未被消灭，则还可以将其放置到存在耶尔德里姆师的地区。",
			can_play: function (game) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (Engine.reinf_helpers.is_yildrim_rein.check(game, s)) return true
				}
				return false
			},
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "yildrim")
				game.active = CP
				let units = ["GE Yildrim #1", "GE Yildrim #2", "GE Yildrim #3"]
				event.reinf_to_place = units
				event.reinf_placement = "map"
				event.reinf_logic = "is_yildrim_rein"
				event.reinf_next_state = "event_yildrim_place_falkenhayn"
				game.state = "event_place_reinforcements"
				game.events["yildrim"] = true
			},
			defer_end: true
		},
		101: {
			name: "JIHAD SUPREMACY",
			name_cn: "圣战至上",
			effect_cn:
				"(黄色事件)。(只能在圣战等级不小于10时打出)。当作事件打出时，正常使用此牌记录的OP点数，其OP只能启动包含部落单位的地区格。。所有被消灭的部落重新放置至部落预备格，随后将地图上可存在的部落补至最大数量。本轮中，任何包含部落单位的部队发起的攻击+1drm。",
			can_play: function (game) {
				return game.jihad >= 10
			},
			use_ops: true,
			handler: function (game, ctx) {
				for (let p = 0; p < game.pieces.length; p++) {
					if (!data.pieces[p] || data.pieces[p].type !== "tribe") continue
					if (!is_eliminated(game, p)) continue
					let key = get_tribe_key_space(p)
					if (key >= 0) {
						game.pieces[p] = key
					}
				}
				let tribes_to_place = Math.max(0, (game.jihad || 0) - count_tribes_on_map(game))
				if (tribes_to_place > 0) {
					game.tribes_to_place = Math.max(game.tribes_to_place || 0, tribes_to_place)
					if (ctx && typeof ctx.push_state === "function") ctx.push_state("jihad_placement")
				}
				game.events["jihad_supremacy"] = game.turn
			}
		},
		102: {
			name: "JIHAD OFFENSIVE",
			name_cn: "圣战攻势",
			effect_cn:
				"(只能在圣战等级不小于8时打出)。本轮中任何土耳其/土耳其-阿拉伯部队获得+1drm。仅有一次，土耳其/土耳其-阿拉伯部队的进攻可以取消任何战壕、跨河惩罚效果。",
			can_play: function (game) {
				return game.jihad >= 8
			},
			handler: function (game) {
				game.events["jihad_offensive"] = { turn: game.turn, action_round: game.action_round }
			}
		},
		103: {
			name: "ROBERTSON",
			name_cn: "罗伯逊",
			effect_cn:
				"(只能在1917年冬季后、【英国厌战】、【皇帝攻势】后，以及VP不小于13时打出)。协约国玩家必须选择:。A:+1VP。B:将最多3个英国/印度/澳新师移除游戏(派往西线)。。同盟国自动胜利标记左移1格。。在剩余的游戏中，每回合英国补员点数-1，协约国MO掷骰-2drm(**此外，掷骰\"无\"和\"俄国\"现在开始视为英国禁攻**)。解除同盟国在巴尔干地区的攻击限制。。(注:协约国选择移除师时，也可以以1LCU=3SCU的代价进行。选择移除师时，不能选择骑兵/骆驼师和英国特殊部队(例如英国波斯宪兵或者印度卫戍师等))",
			can_play: function (game) {
				let year = get_year(game)
				let is_after_winter_1917 = year > 1916
				return (
					is_after_winter_1917 &&
					game.events["british_war_weariness"] &&
					game.events["kaiserschlacht"] &&
					game.vp >= 13
				)
			},
			handler: function (game, ctx) {
				game.mo_ap_modifier = Math.max(0, (game.mo_ap_modifier || 0) - 2)
				game.events["robertson"] = true
				shift_cp_auto_victory_marker(game, -1, ctx, "罗伯逊")
				game.active = AP
				game.state = "event_robertson_choice"
			},
			defer_end: true
		},
		104: {
			name: "BERLIN-BAGHDAD RAILROAD",
			name_cn: "柏林-巴格达铁路",
			effect_cn:
				"完成亚达纳和阿勒颇附近的铁路修建(君士坦丁堡-大马士革的铁路完成连通)。。现在同盟国在限制地区内可以存在最多3支LCU。。+1VP",
			handler: function (game, ctx) {
				game.events.berlin_baghdad = 1
				game.vp += 1
				log(game, "柏林-巴格达铁路：CP 获得 1 VP。", ctx)
			}
		},
		105: {
			name: "KAISERSCHLACHT",
			name_cn: "皇帝攻势",
			effect_cn:
				"协约国玩家可将合法单位移至移除格；确认后系统自动结算：达到至少3个师当量且满足规则 21.1 限制，则同盟国不获得 VP，否则同盟国 +1VP。本回合德国补员点数无法使用。(注: 1LCU=3SCU；可超额移除但不会找零。必须满足规则 21.1 的精锐/特种、BR→ANZ→IN 优先和补给要求。骑兵、骆驼以及英国特殊部队不能用于此效果。)",
			handler: function (game, ctx) {
				block_kaiserschlacht_german_rp(game, ctx)
				start_event_data(game, ctx, "kaiserschlacht", { origin_active: CP })
				game.events["kaiserschlacht"] = true
				game.active = AP
				game.state = "event_kaiserschlacht_remove"
			},
			defer_end: true
		},
		106: {
			name: "TURKISH REINFORCEMENTS",
			add_rein_record: "tu",
			name_cn: "土耳其增援",
			effect_cn: "增援:土耳其-阿拉伯左翼集团，1个土耳其-阿拉伯步兵师。增援:土耳其第20军团、第22军团至预备军格",
			handler: function (game, ctx) {
				let event = start_event_data(game, ctx, "turkish_reinf_106")
				game.active = CP
				let units = ["TU-A Left Wing Gp", "TU-A DIV #20", "TU XX Corps", "TU XXII Corps"]
				event.reinf_to_place = units
				event.reinf_placement = {
					"TU-A Left Wing Gp": "either",
					"TU-A DIV #20": "either",
					"TU XX Corps": "reserve",
					"TU XXII Corps": "reserve"
				}

				event.reinf_logic = {
					"TU-A Left Wing Gp": "is_tua",
					"TU-A DIV #20": "is_tua",
					"TU XX Corps": "is_tu",
					"TU XXII Corps": "is_tu"
				}
				game.state = "event_place_reinforcements"
			},
			defer_end: true
		},
		107: {
			name: "CAUCASIAN ARMY REFORMS",
			name_cn: "高加索军队重组",
			effect_cn:
				"立即永久消灭4个土耳其/土耳其-阿拉伯LCU当量作为代价（每个LCU=3点，3个步兵SCU=1个LCU；LCU可来自地图或军团资产格，步兵SCU可来自地图或预备军格）。。增援:土耳其高加索第1军团、土耳其高加索第2军团 至安纳托利亚、高加索或者加里波利的同盟国控制区域。",
			can_play: function (game) {
				return can_pay_caucasian_army_reforms_cost(game)
			},
			handler: function (game, ctx) {
				start_event_data(game, ctx, "caucasian_army_reforms", { count: 0 })
				game.events["caucasian_army_reforms"] = true
				game.active = CP
				game.state = "event_caucasian_army_reforms_eliminate"
			},
			defer_end: true
		},
		108: {
			name: "UNRESTRICTED SUBMARINE WARFARE",
			name_cn: "无限制潜艇战",
			effect_cn:
				"(不能在1917年冬季前打出，只能在【地中海潜艇猎袭】后打出)。-1VP。。剩余的游戏时间内，阻止新的海上入侵行动事件和行动(并且移除所有预备军格(未使用的)滩头标志，海上入侵事件牌此后只能当作增援打出)。在剩余的游戏时间里，当雅典不被协约国控制的场合，协约国任何**仅通过东地中海计算补给线的部队**启动花费+1，战略调整花费+1**(指仅从塞浦路斯岛屿基地或者东地中海沿岸港口计算补给线的部队)**",
			can_play: function (game) {
				let year = get_year(game)
				return year >= 1917 && game.events["german_subs"]
			},
			handler: function (game, ctx) {
				game.vp -= 1
				log(game, "无限制潜艇战: -1 VP", ctx)
				game.events["unrestricted_submarine_warfare"] = true
				game.unplaced_beachheads = 0
			}
		},
		109: {
			name: "YILDRIM OFFENSIVE",
			name_cn: "耶尔德里姆攻势",
			effect_cn:
				"(黄色事件)。(只能在君士坦丁堡-加利西亚的铁路相连时打出)。当作事件打出时，正常使用此牌记录的OP点数。本轮所有土耳其/土耳其-阿拉伯部队进攻+1drm，一次包含有耶尔德里姆师的堆叠进攻时取消所有战壕效果。",
			can_play: function (game) {
				return is_constantinople_rail_connected_to_galicia(game)
			},
			use_ops: true,
			handler: function (game) {
				game.events["yildrim_offensive"] = game.turn
			}
		},
		110: {
			name: "BRITISH WAR WEARINESS",
			name_cn: "英国厌战",
			effect_cn:
				"(只能在联合战争状态不小于28时打出)。将同盟国自动胜利标记放置在19，且接下来游戏中每个冬季回合结算时间-1格。。当战争状态结算阶段时，VP抵达同盟国自动胜利标记时，同盟国自动胜利。",
			can_play: function (game) {
				return game.combined_war >= 28
			},
			handler: function (game, ctx) {
				game.events["british_war_weariness"] = game.turn
				set_cp_auto_victory_marker(game, 19, ctx)
			}
		}
	}

	const events_by_name = {}
	for (let id in events_by_id) {
		let entry = events_by_id[id]
		if (!entry) continue
		entry.id = Number(id)
		if (entry.name) events_by_name[entry.name] = entry
	}

	for (let c = 1; c < data.cards.length; c++) {
		let card = data.cards[c]
		if (!card || !card.cc || !card.event) continue
		let entry = events_by_name[card.event]
		if (!entry) continue
		delete entry.can_play
		delete entry.handler
		delete entry.play
	}

	function get_event_by_id(id) {
		return events_by_id[id]
	}

	exports.get_event_by_id = get_event_by_id
	exports.events_by_id = events_by_id
	exports.bulls_eye_should_prompt_sr = bulls_eye_should_prompt_sr
	exports.bulls_eye_get_sr_spaces = bulls_eye_get_sr_spaces
	exports.bulls_eye_record_sr_space = bulls_eye_record_sr_space
	exports.bulls_eye_finish_sr = bulls_eye_finish_sr
	exports.bulls_eye_record_advanced_piece = bulls_eye_record_advanced_piece
	exports.bulls_eye_can_extra_attack = bulls_eye_can_extra_attack
	exports.bulls_eye_use_extra_attack = bulls_eye_use_extra_attack
	exports.bulls_eye_ru_attack_drm = bulls_eye_ru_attack_drm
	exports.bulls_eye_cleanup_scus = bulls_eye_cleanup_scus

	// --- Generic Event Queries (Decoupling from map/game_utils) ---
	function is_event_active(game, event_id) {
		return game.events && !!game.events[event_id]
	}
	function is_turn_event_active(game, event_id) {
		return game.events && game.events[event_id] === game.turn
	}

	exports.is_br_rp_blocked = function (game) {
		return game.active === Engine.constants.AP && is_turn_event_active(game, "parliamentary_inquiry")
	}
	exports.is_ru_rp_blocked = function (game) {
		return is_turn_event_active(game, "gorlice_tarnow")
	}
	exports.is_ge_rp_blocked = function (game) {
		return !!(game && game.events && game.events["kaiserschlacht_rp_block_turn"] === game.turn)
	}
	exports.get_russian_revolution_level = get_russian_revolution_level
	exports.is_royal_navy_blockade_active = function (game) {
		return is_event_active(game, "royal_navy_blockade")
	}
	exports.is_arab_desertion_active = function (game) {
		return is_event_active(game, "arab_desertion")
	}
	exports.is_egyptian_coup_active = function (game) {
		return is_event_active(game, "egyptian_coup")
	}
	exports.is_bulgaria_active = function (game) {
		return is_event_active(game, "bulgaria")
	}
	exports.is_romania_active = function (game) {
		return is_event_active(game, "romania")
	}
	exports.is_afghan_alliance_active = function (game) {
		return is_event_active(game, "afghan_alliance")
	}
	exports.is_rupel_active = function (game) {
		return is_event_active(game, "rupel")
	}
	exports.is_berlin_baghdad_active = function (game) {
		return is_event_active(game, "berlin_baghdad")
	}
	// ----------------------------------------------------------------

	exports.is_persia_open = is_persia_open
	exports.is_german_subs_reinforcement_turn = is_german_subs_reinforcement_turn
	exports.is_german_subs_blocked_port = is_german_subs_blocked_port
	exports.get_allied_solidarity_space_options = get_allied_solidarity_space_options
	exports.get_generic_ap_beachhead_reserve_count = get_generic_ap_beachhead_reserve_count
	exports.add_ap_beachhead_reserve = add_ap_beachhead_reserve
	exports.apply_turkish_war_weariness_rp = apply_turkish_war_weariness_rp
	exports.is_turkish_replacement_blocked = is_turkish_replacement_blocked
	exports.ensure_cp_auto_victory_marker = ensure_cp_auto_victory_marker
	exports.set_cp_auto_victory_marker = set_cp_auto_victory_marker
	exports.shift_cp_auto_victory_marker = shift_cp_auto_victory_marker
	exports.apply_warm_water_port_effect = apply_warm_water_port_effect
	exports.get_warm_water_port_options = get_warm_water_port_options
	exports.is_warm_water_port_option = is_warm_water_port_option
	exports.apply_russian_revolution_stage_effects = apply_russian_revolution_stage_effects
	exports.begin_russian_revolution_stage_4_interactive = begin_russian_revolution_stage_4_interactive
	exports.finish_russian_revolution_stage_4 = finish_russian_revolution_stage_4
	exports.can_record_russian_rp = can_record_russian_rp
	exports.is_russian_revolution_subject_piece = is_russian_revolution_subject_piece
	exports.is_russian_revolution_survivor_piece = is_russian_revolution_survivor_piece
	exports.is_russian_revolution_survivor_cavalry = is_russian_revolution_survivor_cavalry
	exports.is_transcaucasian_federation_piece = is_transcaucasian_federation_piece
	exports.get_russian_revolution_cavalry_choices = get_russian_revolution_cavalry_choices
	exports.select_russian_revolution_cavalry_survivor = select_russian_revolution_cavalry_survivor
	exports.remove_russian_revolution_stage_4_ru_units = remove_russian_revolution_stage_4_ru_units
	exports.get_georgian_protectorate_piece = get_georgian_protectorate_piece
	exports.get_georgian_protectorate_placement_spaces = get_georgian_protectorate_placement_spaces
	exports.place_georgian_protectorate = place_georgian_protectorate
	exports.skip_georgian_protectorate = skip_georgian_protectorate
	exports.get_unplaced_transcaucasian_federation_pieces = get_unplaced_transcaucasian_federation_pieces
	exports.get_next_transcaucasian_federation_piece_to_place = get_next_transcaucasian_federation_piece_to_place
	exports.get_current_transcaucasian_federation_piece_to_place = get_current_transcaucasian_federation_piece_to_place
	exports.get_transcaucasian_placement_spaces = get_transcaucasian_placement_spaces
	exports.place_transcaucasian_federation_piece = place_transcaucasian_federation_piece
	exports.skip_transcaucasian_federation_piece = skip_transcaucasian_federation_piece
	exports.finish_transcaucasian_federation_placement = finish_transcaucasian_federation_placement
	exports.place_soviet_uprising_markers = place_soviet_uprising_markers
	exports.prepare_ge_ix_army_replacement = prepare_ge_ix_army_replacement
	exports.get_ge_ix_replacement_space = get_ge_ix_replacement_space
	exports.get_ge_ix_replacement_pieces = get_ge_ix_replacement_pieces
	exports.replace_ge_ix_army_with_scu = replace_ge_ix_army_with_scu
	exports.skip_ge_ix_army_replacement = skip_ge_ix_army_replacement
	exports.has_russian_combat_activation_penalty = has_russian_combat_activation_penalty
	exports.is_russian_revolution_ru_attack_blocked = is_russian_revolution_ru_attack_blocked
	exports.register_russian_revolution_ru_attack = register_russian_revolution_ru_attack
	exports.get_parvus_marker_turn = get_parvus_marker_turn
	exports.get_revolution_marker_turn = get_revolution_marker_turn
	exports.get_long_live_czar_turn = get_long_live_czar_turn
	exports.is_sinai_railroad_complete = is_sinai_railroad_complete
	exports.get_sinai_railroad_turn = get_sinai_railroad_turn
	exports.can_use_sinai_railroad = can_use_sinai_railroad
	exports.complete_sinai_railroad_if_ready = complete_sinai_railroad_if_ready
	exports.sync_russian_revolution_markers = sync_russian_revolution_markers
	exports.reinforce = reinforce
	exports.finish_event = finish_event
	exports.get_caucasian_army_reforms_piece_cost = get_caucasian_army_reforms_piece_cost
	exports.is_caucasian_army_reforms_piece_eligible = is_caucasian_army_reforms_piece_eligible
	exports.can_pay_caucasian_army_reforms_cost = can_pay_caucasian_army_reforms_cost

	return exports
}
