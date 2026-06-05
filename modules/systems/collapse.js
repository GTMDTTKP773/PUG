"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const ROMANIA_COLLAPSE_EVENT_KEY = "romania_collapse"
	const COLLAPSE_SR_LIMIT = 2
	const BELGRADE = Engine.game_utils.find_space("BELGRADE")
	const SKOPJE = Engine.game_utils.find_space("Skopje")
	const BUCHAREST = Engine.game_utils.find_space("BUCHAREST")
	const PLOESTI = Engine.game_utils.find_space("Ploesti")
	const CONSTANTA = Engine.game_utils.find_space("Constanta")
	const SOFIA = Engine.game_utils.find_space("SOFIA")

	const BULGARIA_ENTRY_CP_PLACEMENTS = Object.freeze([
		Object.freeze({ name: "BU 1 Army", space: "Vidin" }),
		Object.freeze({ name: "BU DIV #1", space: "Vidin" }),
		Object.freeze({ name: "BU 2 Army", space: "SOFIA" }),
		Object.freeze({ name: "BU DIV #2", space: "SOFIA" }),
		Object.freeze({ name: "BU DIV #3", space: "Xanthi" }),
		Object.freeze({ name: "BU DIV #4", space: "Strumica" }),
		Object.freeze({ name: "BU DIV #5", space: "Varna" }),
		Object.freeze({ name: "BU DIV #6", space: "CP Reserve" }),
		Object.freeze({ name: "BU DIV #7", space: "CP Reserve" }),
		Object.freeze({ name: "GE IV R Corps", space: "Galicia" }),
		Object.freeze({ name: "German 11th Army", space: "Galicia" }),
		Object.freeze({ name: "GE Hvy Arty", space: "Galicia" }),
		Object.freeze({ name: "GE Mackenson HQ", space: "Galicia" }),
		Object.freeze({ name: "GE Alpenkorps", space: "Vidin" }),
		Object.freeze({ name: "GE DIV #1", space: "CP Reserve" }),
		Object.freeze({ name: "GE DIV #2", space: "CP Reserve" }),
		Object.freeze({ name: "AH VIII Corps", space: "Galicia" }),
		Object.freeze({ name: "AH XXII R Corps", space: "Galicia" }),
		Object.freeze({ name: "AH DIV #1", space: "Galicia" }),
		Object.freeze({ name: "AH DIV #2", space: "CP Reserve" })
	])
	const BULGARIA_ENTRY_AP_PLACEMENTS = Object.freeze([
		Object.freeze({ name: "SB 1 Army", space: "BELGRADE" }),
		Object.freeze({ name: "SB 3 Army", space: "BELGRADE" }),
		Object.freeze({ name: "SB DIV #1", space: "BELGRADE" }),
		Object.freeze({ name: "SB 2 Army", space: "Nis" }),
		Object.freeze({ name: "SB DIV #2", space: "Nis" }),
		Object.freeze({ name: "SB Cavalry", space: "Nis" }),
		Object.freeze({ name: "SB DIV #3", space: "Veles" }),
		Object.freeze({ name: "SB DIV #4", space: "Veles" }),
		Object.freeze({ name: "SB DIV #5", space: "AP Reserve" }),
		Object.freeze({ name: "SB DIV #6", space: "AP Reserve" }),
		Object.freeze({ name: "SB DIV #7", space: "AP Reserve" })
	])
	const BULGARIA_ENTRY_PLAN = Object.freeze({
		cp: Object.freeze({
			placements: BULGARIA_ENTRY_CP_PLACEMENTS,
			third_army_name: "BU 3 Army",
			third_army_default_space: "Rustchuk",
			ah_divisions: Object.freeze(["AH DIV #1", "AH DIV #2"])
		}),
		ap: Object.freeze({
			placements: BULGARIA_ENTRY_AP_PLACEMENTS
		})
	})
	const ROMANIA_ENTRY_PLAN = Object.freeze({
		ap: Object.freeze({
			immediate: Object.freeze([
				Object.freeze({ name: "RO 1 Army", space: "Craiova" }),
				Object.freeze({ name: "RO DIV #1", space: "Craiova" }),
				Object.freeze({ name: "RO DIV #2", space: "Targu Jiu" }),
				Object.freeze({ name: "RO 2 Army", space: "Ploesti" }),
				Object.freeze({ name: "RO DIV #3", space: "Ploesti" }),
				Object.freeze({ name: "RO Cavalry", space: "Ploesti" }),
				Object.freeze({ name: "RO 3 Army", space: "Turtukai", reduced: true }),
				Object.freeze({ name: "RO DIV #4", space: "BUCHAREST" }),
				Object.freeze({ name: "RO DIV #5", space: "AP Reserve" }),
				Object.freeze({ name: "RO DIV #6", space: "AP Reserve" }),
				Object.freeze({ name: "RU Dobruja", space: "Constanta", reduced: true }),
				Object.freeze({ name: "RU/SB Yugo Infantry", space: "AP Reserve" })
			]),
			ru_division_pool: Object.freeze(["RU DIV #18", "RU DIV #19", "RU DIV #20", "RU DIV #21", "RU DIV #22"]),
			delayed: Object.freeze([
				Object.freeze({ name: "RU Danube Army", turn_offset: 1, space: "Odessa" }),
				Object.freeze({ name: "RU 6 Army", turn_offset: 2, space: "Odessa" }),
				Object.freeze({ name: "FR DIV #7", turn_offset: 1, space: "Lemnos" }),
				Object.freeze({ name: "FR DIV #8", turn_offset: 1, space: "Lemnos" })
			])
		}),
		cp: Object.freeze({
			immediate: Object.freeze([
				Object.freeze({ name: "GE IX Army", space: "Galicia", reduced: true }),
				Object.freeze({ name: "GE Falkenhayn HQ", space: "Galicia" }),
				Object.freeze({ name: "GE Alpenkorps", space: "Galicia", unlock_bulgaria_display: true }),
				Object.freeze({ name: "AH VI R Corps", space: "Galicia", reduced: true }),
				Object.freeze({ name: "Combined BU/AH Div", space: "CP Reserve", bulgaria_space: "SOFIA" })
			]),
			combined_bu_ah_name: "Combined BU/AH Div",
			combined_bu_ah_default_space: "CP Reserve",
			ge_division_pool: Object.freeze(["GE DIV #2", "GE DIV #3"]),
			ah_hermannstadt_pool: Object.freeze(["AH DIV #3", "AH DIV #4"]),
			ah_reserve_pool: Object.freeze(["AH DIV #2"]),
			delayed: Object.freeze([Object.freeze({ name: "GE Schmettow", turn_offset: 1, space: "Galicia" })]),
			ge_units: Object.freeze(["GE IX Army", "GE Falkenhayn HQ", "GE Hvy Arty", "GE Schmettow"]),
			ah_units: Object.freeze(["Combined BU/AH Div", "AH DIV #2", "AH DIV #3", "AH DIV #4"])
		})
	})

	const BULGARIAN_ENTRY_UNIT_NAMES = new Set([
		...BULGARIA_ENTRY_CP_PLACEMENTS.map((entry) => entry.name),
		BULGARIA_ENTRY_PLAN.cp.third_army_name,
		...BULGARIA_ENTRY_AP_PLACEMENTS.map((entry) => entry.name)
	])
	const ROMANIAN_ENTRY_UNIT_NAMES = new Set([
		...ROMANIA_ENTRY_PLAN.ap.immediate.map((entry) => entry.name),
		...ROMANIA_ENTRY_PLAN.ap.ru_division_pool,
		...ROMANIA_ENTRY_PLAN.ap.delayed.map((entry) => entry.name),
		...ROMANIA_ENTRY_PLAN.cp.immediate.map((entry) => entry.name),
		...ROMANIA_ENTRY_PLAN.cp.ge_division_pool,
		...ROMANIA_ENTRY_PLAN.cp.ah_hermannstadt_pool,
		...ROMANIA_ENTRY_PLAN.cp.ah_reserve_pool,
		...ROMANIA_ENTRY_PLAN.cp.delayed.map((entry) => entry.name),
		...ROMANIA_ENTRY_PLAN.cp.ah_units
	])
	const SERBIAN_COLLAPSE_GE_EXCEPTION_NAMES = new Set([
		"German 11th Army",
		"GE Mackenson HQ",
		"GE Hvy Arty",
		"GE DIV #1",
		"GE DIV #2"
	])
	const ENTRY_AH_DIVISION_NAMES = Object.freeze(
		data.pieces
			.filter(
				(piece) =>
					piece &&
					piece.nation === "ah" &&
					piece.piece_class === "SCU" &&
					/^AH DIV #[1-4]$/.test(piece.name)
			)
			.map((piece) => piece.name)
	)
	const SERBIAN_COLLAPSE_AH_DIVISION_NAMES = BULGARIA_ENTRY_PLAN.cp.ah_divisions
	const ROMANIAN_COLLAPSE_AH_ENTRY_UNIT_NAMES = new Set(["AH VI R Corps", ...ROMANIA_ENTRY_PLAN.cp.ah_units])
	const ROMANIAN_COLLAPSE_AH_DIVISION_NAMES = Object.freeze([
		"Combined BU/AH Div",
		...ENTRY_AH_DIVISION_NAMES
	])
	// 两个崩溃事件的“可选保留/移除”名单并不相同：
	// 塞尔维亚崩溃在罗马尼亚未崩溃时只从 Bulgaria 入场的 AH 师中选择 2 个移除；
	// 罗马尼亚崩溃在塞尔维亚未崩溃时可从 AH 师中选择 3 个移除。
	const COLLAPSE_OPTIONAL_REMOVAL_PLAN = Object.freeze({
		serbia: SERBIAN_COLLAPSE_AH_DIVISION_NAMES,
		romania: ROMANIAN_COLLAPSE_AH_DIVISION_NAMES
	})
	const {
		eliminate_piece,
		remove_piece_from_game,
		find_piece,
		is_eliminated,
		is_permanently_eliminated,
		is_not_on_map,
		is_in_reserve,
		is_lcu,
		is_scu,
		is_piece_reduced,
		get_piece_nation,
		get_piece_effective_faction,
		get_capacity,
		piece_counts_as_nation_for_rule
	} = Engine.game_utils

	const { is_controlled_by, get_pieces_in_space, is_balkans } = Engine.map

	const exports = {}

	function validate_entry_rules() {
		const bulgarianUnitSets = [
			BULGARIA_ENTRY_CP_PLACEMENTS.map((entry) => entry.name),
			BULGARIA_ENTRY_AP_PLACEMENTS.map((entry) => entry.name),
			[BULGARIA_ENTRY_PLAN.cp.third_army_name]
		]

		for (let units of bulgarianUnitSets) {
			for (let name of units) {
				if (!BULGARIAN_ENTRY_UNIT_NAMES.has(name)) {
					throw new Error(`Invalid Bulgarian entry rules: missing unit ${name}`)
				}
			}
		}

		if (!ROMANIAN_ENTRY_UNIT_NAMES.has("GE IX Army")) {
			throw new Error("Invalid Romanian entry rules: missing unit GE IX Army")
		}
		if (ROMANIAN_ENTRY_UNIT_NAMES.has("GE 9 Army")) {
			throw new Error("Invalid Romanian entry rules: deprecated unit GE 9 Army")
		}

		const pieceNames = new Set()
		for (let info of data.pieces) {
			if (info && info.name) pieceNames.add(info.name)
		}

		const hardcodedUnitNames = new Set([
			...BULGARIAN_ENTRY_UNIT_NAMES,
			...ROMANIAN_ENTRY_UNIT_NAMES,
			...ROMANIAN_COLLAPSE_AH_ENTRY_UNIT_NAMES,
			...ROMANIAN_COLLAPSE_AH_DIVISION_NAMES,
			...SERBIAN_COLLAPSE_GE_EXCEPTION_NAMES,
			...SERBIAN_COLLAPSE_AH_DIVISION_NAMES
		])
		for (let name of hardcodedUnitNames) {
			if (!pieceNames.has(name)) {
				throw new Error(`Invalid collapse rules: unknown hardcoded unit ${name}`)
			}
		}

		const hardcodedSpaceNames = new Set([
			...BULGARIA_ENTRY_CP_PLACEMENTS.map((entry) => entry.space),
			...BULGARIA_ENTRY_AP_PLACEMENTS.map((entry) => entry.space),
			BULGARIA_ENTRY_PLAN.cp.third_army_default_space,
			...ROMANIA_ENTRY_PLAN.ap.immediate.map((entry) => entry.space),
			...ROMANIA_ENTRY_PLAN.ap.delayed.map((entry) => entry.space),
			...ROMANIA_ENTRY_PLAN.cp.immediate.flatMap((entry) =>
				"bulgaria_space" in entry ? [entry.space, entry.bulgaria_space] : [entry.space]
			),
			...ROMANIA_ENTRY_PLAN.cp.delayed.map((entry) => entry.space)
		])
		for (let name of hardcodedSpaceNames) {
			if (!name) continue
			if (Engine.game_utils.find_space(name) < 0) {
				throw new Error(`Invalid collapse rules: unknown hardcoded space ${name}`)
			}
		}
	}

	function is_bulgarian_entry_piece(info) {
		if (!info) return false
		return BULGARIAN_ENTRY_UNIT_NAMES.has(info.name)
	}

	function is_romanian_entry_piece(info) {
		if (!info) return false
		return ROMANIAN_ENTRY_UNIT_NAMES.has(info.name)
	}

	function get_bulgaria_entry_plan() {
		return BULGARIA_ENTRY_PLAN
	}

	function get_bulgarian_entry_ah_divisions() {
		return BULGARIA_ENTRY_PLAN.cp.ah_divisions
	}

	function get_collapse_choice_unit_names(nation) {
		return COLLAPSE_OPTIONAL_REMOVAL_PLAN[nation] || []
	}

	function is_collapse_choice_piece_available(game, p) {
		if (p < 0 || !data.pieces[p]) return false
		return game.pieces[p] > 0 || is_in_reserve(game, p) || is_eliminated(game, p)
	}

	function get_romanian_entry_plan() {
		return ROMANIA_ENTRY_PLAN
	}

	function get_collapse_sr_limit() {
		return COLLAPSE_SR_LIMIT
	}

	function has_serbia_collapsed(game) {
		return !!(game && game.events && game.events["serbian_collapse"])
	}

	function has_romania_collapsed(game) {
		return !!(game && game.events && game.events[ROMANIA_COLLAPSE_EVENT_KEY])
	}

	function is_romania_uncollapsed(game) {
		return !!(game && game.events && game.events["romania"] && !has_romania_collapsed(game))
	}

	function ensure_collapse_status(game) {
		if (!game.collapse_status || game.collapse_status.turn !== game.turn) {
			game.collapse_status = {
				turn: game.turn,
				serbia_considered: false,
				romania_considered: false
			}
		}
		return game.collapse_status
	}

	function mark_collapse_considered(game, nation) {
		let status = ensure_collapse_status(game)
		status[`${nation}_considered`] = true
	}

	function has_sb_lcu_in_serbia(game) {
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s] && data.spaces[s].nation === "sb") {
				let pieces = get_pieces_in_space(game, s)
				for (let p of pieces) {
					if (get_piece_nation(p) === "sb" && is_lcu(p)) return true
				}
			}
		}
		return false
	}

	function are_all_ro_lcus_eliminated(game) {
		for (let p = 0; p < data.pieces.length; p++) {
			if (get_piece_nation(p) === "ro" && is_lcu(p)) {
				if (!is_not_on_map(game, p)) return false
			}
		}
		return true
	}

	function has_ru_lcu_in_romania(game) {
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s] && data.spaces[s].nation === "ro") {
				let pieces = get_pieces_in_space(game, s)
				for (let p of pieces) {
					if (get_piece_nation(p) === "ru" && is_lcu(p)) return true
				}
			}
		}
		return false
	}

	function can_offer_serbian_collapse(game) {
		// 19.4.5：只要贝尔格莱德已被 CP 控制，AP 每个战争状态阶段都可以选择宣布塞尔维亚崩溃。
		if (has_serbia_collapsed(game)) return false
		if (!game.events["bulgaria"]) return false
		return BELGRADE >= 0 && is_controlled_by(game, BELGRADE, CP)
	}

	function should_auto_serbian_collapse(game) {
		// 19.4.5：自动崩溃需要同时满足“贝尔格莱德与斯科普里皆为 CP 控制”且“塞尔维亚境内无 SB LCU”。
		if (has_serbia_collapsed(game)) return false
		if (!game.events["bulgaria"]) return false

		if (
			BELGRADE < 0 ||
			SKOPJE < 0 ||
			!is_controlled_by(game, BELGRADE, CP) ||
			!is_controlled_by(game, SKOPJE, CP)
		) {
			return false
		}

		return !has_sb_lcu_in_serbia(game)
	}

	function can_offer_romanian_collapse(game) {
		// 19.5.5：只要罗马尼亚已经参战且尚未崩溃，AP 就可以在战争状态阶段主动宣布其崩溃。
		if (has_romania_collapsed(game)) return false
		return !!game.events["romania"]
	}

	function should_auto_romanian_collapse(game) {
		// 19.5.5：自动崩溃二选一——三座关键城市全失，或 RO LCU 全灭且罗马尼亚境内没有 RU LCU。
		if (has_romania_collapsed(game)) return false
		if (!game.events["romania"]) return false

		let cond_a =
			BUCHAREST >= 0 &&
			is_controlled_by(game, BUCHAREST, CP) &&
			PLOESTI >= 0 &&
			is_controlled_by(game, PLOESTI, CP) &&
			CONSTANTA >= 0 &&
			is_controlled_by(game, CONSTANTA, CP)

		let cond_b = are_all_ro_lcus_eliminated(game)

		return cond_a || (cond_b && !has_ru_lcu_in_romania(game))
	}

	function can_piece_attack_after_serbian_collapse(game, p, target) {
		if (!piece_counts_as_nation_for_rule(game, p, "sb")) return true
		if (!has_serbia_collapsed(game)) return true

		let info = data.spaces[target]
		if (!info) return false

		// 19.4.6：塞军在贝尔格莱德收复前只能攻击塞尔维亚/希腊；一旦贝尔格莱德回到 AP 手中，限制扩展为整个巴尔干。
		if (BELGRADE >= 0 && is_controlled_by(game, BELGRADE, AP)) {
			return is_balkans(target)
		}

		return info.nation === "sb" || info.nation === "gr"
	}

	function can_collapse_sr_piece(game, p) {
		if (!data.pieces[p] || data.pieces[p].faction !== CP) return false
		if (get_piece_effective_faction(game, p) !== CP) return false
		if (is_not_on_map(game, p)) return false
		let s = game.pieces[p]
		return s > 0 && is_balkans(s) && Engine.map.can_sr_piece(game, p, CP)
	}

	function get_collapse_sr_destination_spaces(game, p = null) {
		if (p === null || p === undefined || p < 0 || !data.pieces[p]) return []
		return Engine.map.get_sr_destinations(game, p, CP).filter((s) => {
			if (!data.spaces[s] || !is_balkans(s)) return false
			if (!is_controlled_by(game, s, CP)) return false
			if (s === game.pieces[p]) return false
			return Engine.map.can_sr_to_space(game, p, s, CP)
		})
	}

	function create_collapse_choice_ctx(collapse_nation, choice_limit) {
		// 选择移除阶段结束后，还要无缝衔接“最多 2 个单位免费 SR”的后续步骤。
		return {
			collapse_nation,
			choice_limit,
			move_limit: COLLAPSE_SR_LIMIT,
			data: { removed: [] }
		}
	}

	function create_collapse_sr_ctx() {
		return {
			move_limit: COLLAPSE_SR_LIMIT,
			data: { moved: [] }
		}
	}

	function remove_delayed_reinforcements_for_piece(game, p) {
		if (!Array.isArray(game.delayed_reinforcements)) return
		game.delayed_reinforcements = game.delayed_reinforcements.filter((entry) => !entry || entry.piece !== p)
	}

	function apply_bulgarian_collapse(game, log) {
		if (game.events && game.events["bulgarian_collapse"]) return "none"
		if (!game.events["bulgaria"]) return "none"

		if (SOFIA >= 0 && is_controlled_by(game, SOFIA, AP)) {
			game.events["bulgarian_collapse"] = game.turn
			log("保加利亚崩溃。")

			for (let p = 0; p < data.pieces.length; p++) {
				if (get_piece_nation(p) === "bu") {
					eliminate_piece(game, p, log, true)
				}
			}

			let gebu_xi = find_piece(CP, "German 11th Army")
			if (gebu_xi >= 0) {
				// 19.3.5：无论在地图上还是在预备盒/消灭盒，GE-BU 第 11 集团军都必须移除。
				let was_on_map = !is_not_on_map(game, gebu_xi)
				let s = was_on_map ? game.pieces[gebu_xi] : -1
				// 19.3.5：规则明确 "permanently eliminate"，GE-BU 第 11 集团军永久消灭，不可通过事件取回。
				eliminate_piece(game, gebu_xi, log, true)
				if (was_on_map) {
					// 替换仅在它原本在地图上时才执行（需要目标地块）。只能用 GE 步兵师（GE DIV #N），不含 Alpenkorps/HQ/炮兵/骑兵/Yildrim。
					for (let p = 0; p < data.pieces.length; p++) {
						let info = data.pieces[p]
						if (
							info &&
							get_piece_nation(p) === "ge" &&
							is_scu(p) &&
							is_in_reserve(game, p) &&
							info.name.startsWith("GE DIV #")
						) {
							game.pieces[p] = s
							let name = is_piece_reduced(game, p) ? `p${p}` : `P${p}`
							log(`德布第11集团军被 ${name} 替换。`)
							break
						}
					}
				}
			}

			return "resolved"
		}
		return "none"
	}

	function apply_serbian_collapse(game, log, options = {}) {
		if (has_serbia_collapsed(game)) return "none"
		if (!game.events["bulgaria"]) return "none"
		if (!options.force && !should_auto_serbian_collapse(game)) return "none"

		mark_collapse_considered(game, "serbia")

		game.events["serbian_collapse"] = game.turn
		log("塞尔维亚崩溃。")

		let no_br_lcu = true
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s] && (data.spaces[s].nation === "sb" || data.spaces[s].nation === "gr")) {
				if (Engine.map.is_beachhead_space(game, s)) continue
				if (data.spaces[s].name === "Lemnos" || data.spaces[s].name === "LEMNOS") continue
				let pieces = get_pieces_in_space(game, s)
				for (let p of pieces) {
					if (get_piece_nation(p) === "br" && is_lcu(p)) {
						no_br_lcu = false
						break
					}
				}
			}
			if (!no_br_lcu) break
		}
		if (no_br_lcu) {
			game.vp += 1
			log("CP 获得 1 VP (塞尔维亚/希腊没有英国 LCU)。")
		}

		for (let p = 0; p < data.pieces.length; p++) {
			if (get_piece_nation(p) === "sb") {
				if (is_permanently_eliminated(game, p)) continue
				if (is_lcu(p)) {
					remove_piece_from_game(game, p, log)
				} else if (is_scu(p)) {
					let s = game.pieces[p]
					if (!is_not_on_map(game, p) && !Engine.map.can_trace_supply_to_ap_port(game, s, AP)) {
						remove_piece_from_game(game, p, log)
					}
				}
			}
		}

		let cp_collapse_sr_available = is_romania_uncollapsed(game)

		for (let p = 0; p < data.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info) continue

			let is_bulgarian_entry = is_bulgarian_entry_piece(info)
			if (!is_bulgarian_entry) continue
			if (info.nation !== "ge" && info.nation !== "ah") continue

			let is_exception = false
			if (info.nation === "ge") {
				// 19.4.6：保留 11th Army、Mackensen HQ、Heavy Artillery、以及 2 个 GE Inf SCU。
				// GE Alpenkorps 不是这 2 个 GE Inf SCU；只有罗马尼亚已参战且尚未崩溃时才额外保留。
				is_exception =
					SERBIAN_COLLAPSE_GE_EXCEPTION_NAMES.has(info.name) ||
					(cp_collapse_sr_available && info.name === "GE Alpenkorps")
			}
			// 19.4.6：只有罗马尼亚已参战且尚未崩溃时，AH 师不立即自动移除，
			// 而是交给后续“选择移除 2 个 AH 师以换取崩溃 SR”步骤处理。
			if (
				info.nation === "ah" &&
				cp_collapse_sr_available &&
				SERBIAN_COLLAPSE_AH_DIVISION_NAMES.includes(info.name)
			) {
				is_exception = true
			}

			if (!is_exception) {
				remove_piece_from_game(game, p, log)
			}
		}

		if (cp_collapse_sr_available) {
			game.active = CP
			game.state = "event_serbian_collapse_choice"
			game.event_ctx = create_collapse_choice_ctx("serbia", 2)
			return "interactive"
		}

		return "resolved"
	}

	function apply_romanian_collapse(game, log, options = {}) {
		if (has_romania_collapsed(game)) return "none"
		if (!game.events["romania"]) return "none"
		if (!options.force && !should_auto_romanian_collapse(game)) return "none"

		mark_collapse_considered(game, "romania")

		game.events[ROMANIA_COLLAPSE_EVENT_KEY] = game.turn
		log("罗马尼亚崩溃。")

		for (let p = 0; p < data.pieces.length; p++) {
			if (get_piece_nation(p) === "ro") {
				remove_piece_from_game(game, p, log)
			}
		}

		let ge_cav = find_piece(CP, "GE Schmettow")
		if (ge_cav >= 0) {
			remove_piece_from_game(game, ge_cav, log)
			remove_delayed_reinforcements_for_piece(game, ge_cav)
		}

		let cp_collapse_sr_available = !!game.events["bulgaria"] && !has_serbia_collapsed(game)
		// 19.5.6：若保加利亚已参战且塞尔维亚尚未崩溃，则 AH 师进入“选择 3 个移除以换取崩溃 SR”步骤；
		// 非师级的 Romania 入场 AH 单位（例如 AH VI R Corps）仍会立即移除。
		for (let p = 0; p < data.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info || !ROMANIAN_COLLAPSE_AH_ENTRY_UNIT_NAMES.has(info.name)) continue
			if (cp_collapse_sr_available && ROMANIAN_COLLAPSE_AH_DIVISION_NAMES.includes(info.name)) continue
			remove_piece_from_game(game, p, log)
		}

		if (cp_collapse_sr_available) {
			game.active = CP
			game.state = "event_romanian_collapse_choice"
			game.event_ctx = create_collapse_choice_ctx("romania", 3)
			return "interactive"
		}

		return "resolved"
	}

	function maybe_offer_serbian_collapse(game) {
		let status = ensure_collapse_status(game)
		if (status.serbia_considered || !can_offer_serbian_collapse(game)) return "none"
		game.active = AP
		game.state = "war_status_serbian_collapse_offer"
		return "interactive"
	}

	function maybe_offer_romanian_collapse(game) {
		let status = ensure_collapse_status(game)
		if (status.romania_considered || !can_offer_romanian_collapse(game)) return "none"
		game.active = AP
		game.state = "war_status_romanian_collapse_offer"
		return "interactive"
	}

	function accept_voluntary_collapse(game, nation, log) {
		if (nation === "serbia") return apply_serbian_collapse(game, log, { force: true })
		if (nation === "romania") return apply_romanian_collapse(game, log, { force: true })
		return "none"
	}

	function decline_voluntary_collapse(game, nation) {
		mark_collapse_considered(game, nation)
	}

	function handle_national_collapse(game, log) {
		ensure_collapse_status(game)

		while (true) {
			let result = apply_bulgarian_collapse(game, log)
			if (result === "interactive") return true
			if (result === "resolved") continue

			result = apply_serbian_collapse(game, log)
			if (result === "interactive") return true
			if (result === "resolved") continue

			result = maybe_offer_serbian_collapse(game)
			if (result === "interactive") return true

			result = apply_romanian_collapse(game, log)
			if (result === "interactive") return true
			if (result === "resolved") continue

			result = maybe_offer_romanian_collapse(game)
			return result === "interactive"
		}
	}

	validate_entry_rules()

	exports.handle_national_collapse = handle_national_collapse
	exports.get_bulgaria_entry_plan = get_bulgaria_entry_plan
	exports.get_bulgarian_entry_ah_divisions = get_bulgarian_entry_ah_divisions
	exports.get_collapse_choice_unit_names = get_collapse_choice_unit_names
	exports.is_collapse_choice_piece_available = is_collapse_choice_piece_available
	exports.get_romanian_entry_plan = get_romanian_entry_plan
	exports.get_collapse_sr_limit = get_collapse_sr_limit
	exports.is_bulgarian_entry_piece = is_bulgarian_entry_piece
	exports.is_romanian_entry_piece = is_romanian_entry_piece
	exports.has_serbia_collapsed = has_serbia_collapsed
	exports.has_romania_collapsed = has_romania_collapsed
	exports.is_romania_uncollapsed = is_romania_uncollapsed
	exports.ensure_collapse_status = ensure_collapse_status
	exports.accept_voluntary_collapse = accept_voluntary_collapse
	exports.decline_voluntary_collapse = decline_voluntary_collapse
	exports.can_piece_attack_after_serbian_collapse = can_piece_attack_after_serbian_collapse
	exports.can_collapse_sr_piece = can_collapse_sr_piece
	exports.get_collapse_sr_destination_spaces = get_collapse_sr_destination_spaces

	return exports
}
