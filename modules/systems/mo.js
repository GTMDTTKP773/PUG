"use strict"

module.exports = function (Engine) {
	const { data, game_utils } = Engine
	const {
		is_regular,
		get_piece_nation,
		get_piece_effective_faction,
		is_not_on_map,
		piece_counts_as_nation_for_rule,
		pieces_count_as_any_nation_for_rule
	} = game_utils
	const exports = {}

	const { roll_die } = Engine.utils
	const {
		is_balkans,
		is_caucasus,
		is_syria_palestine,
		is_mesopotamia,
		is_persia,
		is_afghanistan,
		is_central_asia,
		is_india,
		is_baluchistan,
		get_pieces_in_space,
		can_trace_supply_to_source
	} = Engine.map

	// MO Constants
	const MO_NONE = "none"
	const MO_RUSSIA = "russia"
	const MO_BRITISH = "british"
	const MO_TURKEY = "turkey"
	const MO_ENVER = "enver"
	const MO_MESOPOTAMIA = "mesopotamia"
	const MO_BALKANS = "balkans"
	const MO_EGYPT = "egypt"

	// New Specific Constants
	const MO_BRITISH_MESOPOTAMIA = "british_mesopotamia"
	const MO_BRITISH_EGYPT = "british_egypt"
	const MO_RUSSIA_CAUCASUS = "russia_caucasus"
	const MO_TURKEY_CAUCASUS = "turkey_caucasus"
	const MO_TURKEY_EGYPT = "turkey_egypt"
	const MO_TURKEY_MESOPOTAMIA = "turkey_mesopotamia"

	// Choice Constants
	const MO_AP_CHOICE_5 = "ap_choice_5"
	const MO_BRITISH_NO_ATTACK = "british_no_attack"

	const AP = "ap"
	const CP = "cp"

	const BRITAIN = "br"
	const RUSSIA = "ru"
	const TURKEY = "tu"
	const TURKEY_ARAB = "tua"
	const MO_RULE = "mo"
	const BRITISH_EMPIRE_NATIONS = [BRITAIN, "in", "anz"]
	const TURKISH_MO_NATIONS = [TURKEY, TURKEY_ARAB]
	const MO_VALID = "VALID"
	const MO_NONE_STATUS = "NONE"
	const MO_REROLL = "REROLL"
	const EGYPT_SUPPLY_NAMES = [
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
		"Bahariya Oasis",
		"Khartoum"
	]
	let egypt_supply_spaces = null

	function mo_name(mo) {
		switch (mo) {
			case MO_RUSSIA:
				return "俄国"
			case MO_BRITISH:
				return "大英帝国"
			case MO_TURKEY:
				return "土耳其"
			case MO_ENVER:
				return "恩维尔"
			case MO_MESOPOTAMIA:
				return "美索不达米亚/波斯"
			case MO_BALKANS:
				return "巴尔干"
			case MO_EGYPT:
				return "埃及"
			case MO_BRITISH_NO_ATTACK:
				return "英军禁攻"
			case MO_BRITISH_MESOPOTAMIA:
				return "英军 (美索不达米亚)"
			case MO_BRITISH_EGYPT:
				return "英军 (埃及)"
			case MO_RUSSIA_CAUCASUS:
				return "俄国 (高加索)"
			case MO_TURKEY_CAUCASUS:
				return "土耳其 (高加索)"
			case MO_TURKEY_EGYPT:
				return "土耳其 (埃及)"
			case MO_TURKEY_MESOPOTAMIA:
				return "土耳其 (美索不达米亚)"
			case MO_NONE:
				return "无"
			default:
				return mo
		}
	}

	function fmt_mo_roll(die, drm, faction) {
		if (die === undefined || die === null) return ""
		const color = faction === AP ? "W" : "B"
		let s = `${color}${die}`
		if (drm !== undefined && drm !== 0) {
			const final = Math.max(1, die + drm)
			if (drm > 0) s += ` + ${drm} = ${final}`
			else s += ` - ${-drm} = ${final}`
		}
		return s
	}

	function format_mo_log(mo, die, drm, faction) {
		const roll_str = fmt_mo_roll(die, drm, faction)
		const name = mo_name(mo)
		return roll_str ? `${roll_str} -> ${name}` : name
	}

	function format_cp_mo_result(game) {
		if (game && game.mo_cp === MO_ENVER) {
			const enver = format_mo_log(game.mo_cp, game.mo_cp_die, game.mo_cp_drm, CP)
			const first = mo_name(game.mo_cp_1)
			const second = format_mo_log(game.mo_cp_2, game.mo_cp_die_2, game.mo_cp_drm_2, CP)
			return `${enver}\n（#1${first}）\n（#2 ${second}）`
		}
		return format_mo_log(game && game.mo_cp, game && game.mo_cp_die, game && game.mo_cp_drm, CP)
	}

	function log_mo_results(game, log) {
		if (!game || !log) return
		if (game.turn === 1) {
			log(`AP：俄国`)
			log(`CP：俄国`)
			return
		}
		log(`AP：${format_mo_log(game.mo_ap, game.mo_ap_die, game.mo_ap_drm, AP)}`)
		log(`CP：${format_cp_mo_result(game)}`)
	}

	function determine_mo_ap(roll) {
		// PUG Rules (2.0):
		// 1-2: Russia
		// 3: British No Attack
		// 4-5: British Empire
		// 6: Mesopotamia/Persia
		// 7: None
		// 8: Balkans
		// 9+: Egypt

		if (roll <= 2) return MO_RUSSIA
		if (roll === 3) return MO_BRITISH_NO_ATTACK
		if (roll <= 5) return MO_BRITISH
		if (roll === 6) return MO_MESOPOTAMIA
		if (roll === 7) return MO_NONE
		if (roll === 8) return MO_BALKANS
		if (roll >= 9) return MO_EGYPT
		return MO_NONE
	}

	function determine_mo_cp(roll) {
		// PUG Rules (2.0):
		// 1-2: Russia
		// 3: British Empire
		// 4-5: Turkey
		// 6: Enver

		if (roll <= 2) return MO_RUSSIA
		if (roll === 3) return MO_BRITISH
		if (roll <= 5) return MO_TURKEY
		if (roll === 6) return MO_ENVER
		return MO_NONE
	}

	function find_spaces_by_name(names) {
		const lookup = new Set((names || []).map((n) => String(n).toLowerCase()))
		const found = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!data.spaces[s]) continue
			const name = String(data.spaces[s].name || "").toLowerCase()
			if (lookup.has(name)) found.push(s)
		}
		return found
	}

	function is_russian_mo_ignored_for_cp(game) {
		return !!(game && game.events && game.events["russian_revolution"] >= 4)
	}

	function can_trace_supply_by_land_to_egypt(game, p) {
		if (!game || p === undefined || p === null || !data.pieces[p]) return false
		const start = game.pieces[p]
		if (!start || start <= 0) return false
		if (typeof can_trace_supply_to_source !== "function") return false
		const egypt_spaces = get_egypt_supply_spaces()
		if (egypt_spaces.length === 0) return false
		return can_trace_supply_to_source(game, start, AP, egypt_spaces)
	}

	function get_egypt_supply_spaces() {
		if (!egypt_supply_spaces) egypt_supply_spaces = find_spaces_by_name(EGYPT_SUPPLY_NAMES)
		return egypt_supply_spaces
	}

	function has_piece_counting_as_any_nation(game, pieces, nations) {
		return pieces_count_as_any_nation_for_rule(game, pieces, nations, MO_RULE)
	}

	function has_regular_piece_counting_as_any_nation(game, pieces, nations) {
		if (!Array.isArray(pieces)) return false
		const nation_list = Array.isArray(nations) ? nations : [nations]
		return pieces.some(
			(p) => is_regular(p) && nation_list.some((nation) => piece_counts_as_nation_for_rule(game, p, nation, MO_RULE))
		)
	}

	function get_on_map_pieces_by_faction(game, faction) {
		const pieces = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (data.pieces[p] && data.pieces[p].faction === faction && !is_not_on_map(game, p)) {
				pieces.push(p)
			}
		}
		return pieces
	}

	function any_piece_is_in_area(game, pieces, area_check) {
		return pieces.some((p) => {
			const space = game.pieces[p]
			if (space === undefined || space === null || space < 0) return false
			return area_check(space)
		})
	}

	function is_ap_eastern_mo_space(space) {
		return (
			is_mesopotamia(space) ||
			is_persia(space) ||
			is_afghanistan(space) ||
			is_central_asia(space) ||
			is_india(space) ||
			is_baluchistan(space)
		)
	}

	function can_british_piece_trace_supply_to_egypt(game, pieces) {
		if (!Array.isArray(pieces)) return false
		return pieces.some(
			(p) => piece_counts_as_nation_for_rule(game, p, BRITAIN, MO_RULE) && can_trace_supply_by_land_to_egypt(game, p)
		)
	}

	// Rules 5.2, 5.3, and 3.2.7:
	// MO nationality checks must honor dual-nationality units, so all nationality checks
	// route through piece_counts_as_nation_for_rule(..., "mo") instead of raw piece.nation.
	// Rule 5.3:
	// AP 具体攻势要求只看本次宣告的进攻是否命中规定国别/战区，
	// 战区判定尽量复用 map.js 既有区域辅助函数，避免在 MO 中重复维护地区字符串。
	function check_ap_mo_criteria(game, mo, ctx) {
		const { space, pieces, has_attacking_nation } = ctx
		switch (mo) {
			case MO_RUSSIA:
				return has_attacking_nation(RUSSIA)
			case MO_BRITISH:
				return has_attacking_nation(BRITISH_EMPIRE_NATIONS)
			case MO_MESOPOTAMIA:
				return is_ap_eastern_mo_space(space)
			case MO_EGYPT:
			case MO_BRITISH_EGYPT:
				return is_syria_palestine(space) && can_british_piece_trace_supply_to_egypt(game, pieces)
			case MO_BALKANS:
				return is_balkans(space) && has_attacking_nation(BRITAIN)
			case MO_BRITISH_MESOPOTAMIA:
				return is_mesopotamia(space) && has_attacking_nation(BRITISH_EMPIRE_NATIONS)
			case MO_RUSSIA_CAUCASUS:
				return is_caucasus(space) && has_attacking_nation(RUSSIA)
			default:
				return false
		}
	}

	function check_cp_mo_criteria(game, mo, ctx) {
		const { space, has_attacking_nation, has_defending_nation } = ctx
		switch (mo) {
			case MO_RUSSIA:
				if (is_russian_mo_ignored_for_cp(game)) return true
				return has_defending_nation(RUSSIA)
			case MO_BRITISH:
				return has_defending_nation(BRITISH_EMPIRE_NATIONS)
			case MO_TURKEY:
				return has_attacking_nation(TURKISH_MO_NATIONS)
			case MO_TURKEY_CAUCASUS:
				return is_caucasus(space) && has_attacking_nation(TURKISH_MO_NATIONS)
			case MO_TURKEY_EGYPT:
				return is_syria_palestine(space) && has_attacking_nation(TURKISH_MO_NATIONS)
			case MO_TURKEY_MESOPOTAMIA:
				return is_mesopotamia(space) && has_attacking_nation(TURKISH_MO_NATIONS)
			default:
				return false
		}
	}

	/**
	 * Checks if Mandated Offensive criteria are met for a specific attack.
	 * @param {object} game - Game state
	 * @param {string} mo - Mandated Offensive type
	 * @param {object} ctx - Context object
	 * @param {string} ctx.attacker - AP or CP
	 * @param {number} ctx.space - Space index
	 * @param {number[]} ctx.pieces - Array of attacker piece IDs
	 * @param {number[]} ctx.defender_pieces - Array of defender piece IDs
	 * @returns {boolean}
	 */
	function check_mo_criteria(game, mo, ctx) {
		const { attacker: faction, space, pieces, defender_pieces } = ctx
		if (!mo || mo === MO_NONE) return true
		if (space === undefined || space === null || space < 0) return false

		// Rule 5.1.3: Irregulars/Tribes attacking alone never satisfy an MO.
		if (!Array.isArray(pieces) || !pieces.some(is_regular)) return false

		const criteria_ctx = {
			space,
			pieces,
			has_attacking_nation: (nations) => has_piece_counting_as_any_nation(game, pieces, nations),
			has_defending_nation: (nations) => has_piece_counting_as_any_nation(game, defender_pieces, nations)
		}

		if (faction === AP) return check_ap_mo_criteria(game, mo, criteria_ctx)
		if (faction === CP) return check_cp_mo_criteria(game, mo, criteria_ctx)
		return false
	}

	/**
	 * Checks if any British unit is participating in the attack.
	 * @param game
	 * @param {number[]} pieces - Array of piece IDs
	 * @returns {boolean}
	 */
	function check_british_participation(game, pieces) {
		return has_piece_counting_as_any_nation(game, pieces, BRITAIN)
	}

	function create_attack_context(game, overrides = {}) {
		const attacker = overrides.attacker || game.attack.attacker || game.active
		const space = overrides.space === undefined ? game.attack.space : overrides.space
		const pieces = overrides.pieces || game.attack.pieces || []
		const defender = overrides.defender || game.attack.defender || (attacker === AP ? CP : AP)
		const defender_pieces =
			overrides.defender_pieces ||
			get_pieces_in_space(game, space).filter((p) => get_piece_effective_faction(game, p) === defender)
		return { attacker, space, pieces, defender_pieces }
	}

	function is_russo_british_assault_blocking_russian_mo(game) {
		return (
			game.event_ctx &&
			game.event_ctx.key === "russo_british_assault" &&
			(game.mo_ap === MO_RUSSIA || game.mo_ap === MO_RUSSIA_CAUCASUS)
		)
	}

	function log_russo_british_assault_mo_block(game, pieces, log) {
		const has_russian_attacker = Array.isArray(pieces) && pieces.some((p) => get_piece_nation(p) === RUSSIA)
		if (has_russian_attacker && game.attack && !game.attack.russo_british_mo_block_logged) {
			game.attack.russo_british_mo_block_logged = true
			if (log) log("英俄突袭：不能完成俄国MO")
		}
	}

	function handle_ap_mo_fulfillment(game, ctx, log) {
		const { pieces } = ctx
		if (is_russo_british_assault_blocking_russian_mo(game)) {
			log_russo_british_assault_mo_block(game, pieces, log)
			return
		}

		if (game.mo_ap === MO_BRITISH_NO_ATTACK) {
			if (check_british_participation(game, pieces) && !game.british_mandate_violated) {
				game.british_mandate_violated = true
				if (!game.br_attack_penalty_paid) {
					game.vp += 1
					game.br_attack_penalty_paid = true
					if (log) log("BR部队突破进攻限制：CP +1 VP")
				}
			}
			return
		}

		if (game.mo_ap_fulfilled || !game.mo_ap) return
		if (check_mo_criteria(game, game.mo_ap, ctx)) {
			game.mo_ap_fulfilled = true
			if (log) log("**协约国强制进攻已完成。**")
		}
	}

	function attack_already_fulfilled_enver_mo(game) {
		return !!(
			game &&
			game.attack &&
			Array.isArray(game.attack.mo_fulfilled_indices) &&
			game.attack.mo_fulfilled_indices.some((step) => step === 1 || step === 2)
		)
	}

	function get_enver_mo_fulfillment_candidates(game, ctx) {
		const candidates = []
		if (
			!game.mo_cp_1_fulfilled &&
			game.mo_cp_1 &&
			game.mo_cp_1 !== MO_NONE &&
			check_mo_criteria(game, game.mo_cp_1, ctx)
		) {
			candidates.push({ step: 1, mo: game.mo_cp_1 })
		}
		if (
			!game.mo_cp_2_fulfilled &&
			game.mo_cp_2 &&
			game.mo_cp_2 !== MO_NONE &&
			check_mo_criteria(game, game.mo_cp_2, ctx)
		) {
			candidates.push({ step: 2, mo: game.mo_cp_2 })
		}
		return candidates
	}

	function note_enver_mo_choice(game, candidates) {
		game.enver_mo_choice = {
			options: candidates.map((entry) => entry.step)
		}
	}

	function finish_enver_mo_fulfillment(game, log) {
		if (game.mo_cp_1_fulfilled && game.mo_cp_2_fulfilled) {
			game.mo_cp_fulfilled = true
			if (log) log("同盟国恩维尔攻势已全部完成。")
		}
	}

	function apply_enver_mo_fulfillment(game, step, log) {
		const mo_key = step === 1 ? "mo_cp_1" : step === 2 ? "mo_cp_2" : null
		const fulfilled_key = step === 1 ? "mo_cp_1_fulfilled" : step === 2 ? "mo_cp_2_fulfilled" : null
		if (!mo_key || !fulfilled_key || game[fulfilled_key] || !game[mo_key]) return false
		if (attack_already_fulfilled_enver_mo(game)) return false

		game[fulfilled_key] = true
		if (game.attack) {
			if (!game.attack.mo_fulfilled_indices) game.attack.mo_fulfilled_indices = []
			if (!game.attack.mo_fulfilled_indices.includes(step)) game.attack.mo_fulfilled_indices.push(step)
		}
		if (log) log(`同盟国恩维尔攻势 #${step} (${mo_name(game[mo_key])}) 已完成。`)
		finish_enver_mo_fulfillment(game, log)
		return true
	}

	function handle_enver_mo_fulfillment(game, ctx, log) {
		if (attack_already_fulfilled_enver_mo(game) || game.enver_mo_choice) return

		const candidates = get_enver_mo_fulfillment_candidates(game, ctx)
		if (candidates.length === 0) return
		if (candidates.length === 1) {
			apply_enver_mo_fulfillment(game, candidates[0].step, log)
			return
		}

		if (game.mo_cp_1 === game.mo_cp_2) {
			apply_enver_mo_fulfillment(game, 2, log)
			return
		}

		note_enver_mo_choice(game, candidates)
	}

	function has_pending_enver_mo_choice(game) {
		return !!(game && game.enver_mo_choice && Array.isArray(game.enver_mo_choice.options))
	}

	function get_pending_enver_mo_choice_options(game) {
		if (!has_pending_enver_mo_choice(game)) return []
		const options = []
		for (let step of game.enver_mo_choice.options) {
			if (step === 1 && !game.mo_cp_1_fulfilled && game.mo_cp_1 && game.mo_cp_1 !== MO_NONE) {
				options.push({ step, mo: game.mo_cp_1 })
			}
			if (step === 2 && !game.mo_cp_2_fulfilled && game.mo_cp_2 && game.mo_cp_2 !== MO_NONE) {
				options.push({ step, mo: game.mo_cp_2 })
			}
		}
		return options
	}

	function resolve_pending_enver_mo_choice(game, mo, log) {
		const choice = get_pending_enver_mo_choice_options(game).find((entry) => entry.mo === mo)
		if (!choice) return false
		delete game.enver_mo_choice
		return apply_enver_mo_fulfillment(game, choice.step, log)
	}

	function handle_cp_mo_fulfillment(game, ctx, log) {
		if (game.mo_cp_fulfilled) return
		if (game.mo_cp === MO_ENVER) {
			handle_enver_mo_fulfillment(game, ctx, log)
			return
		}
		if (game.mo_cp && check_mo_criteria(game, game.mo_cp, ctx)) {
			game.mo_cp_fulfilled = true
			if (log) log("**同盟国强制进攻已完成。**")
		}
	}

	/**
	 * Checks if Mandated Offensive requirements were fulfilled by an attack.
	 * @param {Object} game - Game state
	 * @param {Object} ctx - Attack context
	 * @param {string} ctx.attacker - Attacking side
	 * @param {number} ctx.space - Target space
	 * @param {number[]} ctx.pieces - Attacking pieces
	 * @param {number[]} ctx.defender_pieces - Defending pieces
	 * @param {Function} log - Logging function
	 */
	function check_mo_fulfillment_core(game, ctx, log) {
		if (ctx.attacker === AP) {
			handle_ap_mo_fulfillment(game, ctx, log)
			return
		}
		handle_cp_mo_fulfillment(game, ctx, log)
	}

	function check_mo_on_attack_declared(game, log) {
		if (!game || !game.attack) return
		check_mo_fulfillment_core(game, create_attack_context(game), log)
	}

	function check_mo_fulfillment(game, result, log) {
		if (!game || !game.attack || !result) return
		check_mo_fulfillment_core(
			game,
			create_attack_context(game, {
				attacker: game.active,
				pieces: result.attackers || [],
				defender_pieces: result.defenders || []
			}),
			log
		)
	}

	/**
	 * Resolves the second roll for Enver Mandate.
	 * @param {Object} game
	 * @param {Function} log
	 */
	function resolve_enver_2(game, log) {
		if (!game) return
		const die = roll_die(6, game)
		game.mo_cp_die_2 = die
		game.mo_cp_drm_2 = 0
		let second = determine_mo_cp(die)
		if (second === MO_RUSSIA && is_russian_mo_ignored_for_cp(game)) {
			second = MO_NONE
		}

		if (second === MO_ENVER) {
			game.active = CP
			game.state = "mo_enver_choose_2"
		} else {
			game.mo_cp_2 = second
			end_mo_enver(game, log)
		}
	}

	function end_mo_enver(game, log) {
		if (!game) return
		if (game.mo_cp_1 === MO_NONE) game.mo_cp_1_fulfilled = true
		if (game.mo_cp_2 === MO_NONE) game.mo_cp_2_fulfilled = true
		if (game.mo_cp_1_fulfilled && game.mo_cp_2_fulfilled) game.mo_cp_fulfilled = true
		game.active = AP
		delete game.initiative_winner
		game.state = "acknowledge_mo_results"
		log_mo_results(game, log)
	}

	function end_mo_choice(game, log) {
		if (!game) return
		game.active = AP
		delete game.initiative_winner
		game.state = "acknowledge_mo_results"
		log_mo_results(game, log)
	}

	function register(global_states) {
		Object.assign(global_states, states)
	}

	const states = {}

	states.mo_enver_choose_1 = {
		prompt(res) {
			res.prompt("恩维尔亲临前线: 选择同盟国的第一次恩维尔攻势目标")
			if (!is_russian_mo_ignored_for_cp(res.game)) res.action("choose_enver_russia")
			res.action("choose_enver_british")
			res.action("choose_enver_turkey")
		},
		choose_enver_russia(game, log) {
			if (is_russian_mo_ignored_for_cp(game)) {
				game.mo_cp_1 = MO_NONE
			} else {
				game.mo_cp_1 = MO_RUSSIA
			}
			resolve_enver_2(game, log)
		},
		choose_enver_british(game, log) {
			game.mo_cp_1 = MO_BRITISH
			resolve_enver_2(game, log)
		},
		choose_enver_turkey(game, log) {
			game.mo_cp_1 = MO_TURKEY
			resolve_enver_2(game, log)
		}
	}

	states.mo_enver_choose_2 = {
		prompt(res) {
			res.prompt("恩维尔亲临前线: 选择同盟国的第二次恩维尔攻势目标")
			if (!is_russian_mo_ignored_for_cp(res.game)) res.action("choose_enver_russia")
			res.action("choose_enver_british")
			res.action("choose_enver_turkey")
		},
		choose_enver_russia(game, log) {
			if (is_russian_mo_ignored_for_cp(game)) {
				game.mo_cp_2 = MO_NONE
			} else {
				game.mo_cp_2 = MO_RUSSIA
			}
			end_mo_enver(game, log)
		},
		choose_enver_british(game, log) {
			game.mo_cp_2 = MO_BRITISH
			end_mo_enver(game, log)
		},
		choose_enver_turkey(game, log) {
			game.mo_cp_2 = MO_TURKEY
			end_mo_enver(game, log)
		}
	}

	states.mo_choice_ap = {
		prompt(res) {
			res.prompt("强制进攻：选择目标")
			res.action("choose_mesopotamia")
			res.action("choose_egypt")
			res.action("choose_russia")
		},
		choose_mesopotamia(game, log) {
			game.mo_ap = MO_BRITISH_MESOPOTAMIA
			end_mo_choice(game, log)
		},
		choose_egypt(game, log) {
			game.mo_ap = MO_BRITISH_EGYPT
			end_mo_choice(game, log)
		},
		choose_russia(game, log) {
			game.mo_ap = MO_RUSSIA_CAUCASUS
			end_mo_choice(game, log)
		}
	}

	/**
	 * Checks if an MO is valid based on Rule 5.1.2.
	 * - NONE: the mandated nationality has no qualifying units on map, or the acting side
	 *   lacks the required attacking nationality after applying Rule 3.2.7 nationality logic.
	 * - REROLL: the mandated theatre is empty at roll time.
	 * - VALID: the MO remains live and failure can still incur the VP penalty from Rule 5.1.3.
	 * @param {object} game
	 * @param {string} faction - AP or CP
	 * @param {string} mo
	 * @returns {"VALID"|"NONE"|"REROLL"}
	 */
	function check_mo_validity(game, faction, mo) {
		if (!mo || mo === MO_NONE) return MO_VALID

		const opponent_pieces = get_on_map_pieces_by_faction(game, faction === AP ? CP : AP)
		const attacker_pieces = get_on_map_pieces_by_faction(game, faction)
		const opponent_has_nation = (nations) => has_piece_counting_as_any_nation(game, opponent_pieces, nations)
		const attacker_has_regular_nation = (nations) =>
			has_regular_piece_counting_as_any_nation(game, attacker_pieces, nations)
		const attacker_has_any_regular = () => attacker_pieces.some(is_regular)
		const opponent_in_area = (area_check) => any_piece_is_in_area(game, opponent_pieces, area_check)

		if (faction === AP) {
			if (mo === MO_RUSSIA || mo === MO_RUSSIA_CAUCASUS) {
				// Rule 5.1.2 + 5.3.1: 若俄军不存在，或高加索没有可攻击对象，则 MO 取消/重掷。
				if (!attacker_has_regular_nation(RUSSIA)) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (mo === MO_RUSSIA_CAUCASUS) {
					if (!opponent_in_area(is_caucasus)) return MO_REROLL
				}
				return MO_VALID
			}
			if (
				mo === MO_BRITISH ||
				mo === MO_BRITISH_NO_ATTACK ||
				mo === MO_BRITISH_MESOPOTAMIA ||
				mo === MO_BRITISH_EGYPT
			) {
				// Rule 5.3.2: 英帝国 MO 包含英军、印军与 ANZAC，且须按 3.2.7 处理双国籍单位。
				if (!attacker_has_regular_nation(BRITISH_EMPIRE_NATIONS)) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (mo === MO_BRITISH_MESOPOTAMIA) {
					if (!opponent_in_area(is_mesopotamia)) return MO_REROLL
				}
				if (mo === MO_BRITISH_EGYPT) {
					if (!opponent_in_area(is_syria_palestine)) return MO_REROLL
				}
				return MO_VALID
			}
			if (mo === MO_MESOPOTAMIA) {
				// Rule 5.3.3: 该结果要求在东部战区发动进攻，不限定 AP 攻击国别。
				if (!attacker_has_any_regular()) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (!opponent_in_area(is_ap_eastern_mo_space)) return MO_REROLL
				return MO_VALID
			}
			if (mo === MO_BALKANS) {
				// Rule 5.3.4: 巴尔干结果只允许英军完成，因此这里保持 BR 专属而非整组英帝国。
				if (!attacker_has_regular_nation(BRITAIN)) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (!opponent_in_area(is_balkans)) return MO_REROLL
				return MO_VALID
			}
			if (mo === MO_EGYPT) {
				// Rule 5.3.5: 埃及结果看叙利亚/巴勒斯坦战区是否仍有可攻击对象。
				if (!attacker_has_regular_nation(BRITAIN)) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (!opponent_in_area(is_syria_palestine)) return MO_REROLL
				return MO_VALID
			}
		}

		if (faction === CP) {
			if (mo === MO_RUSSIA) {
				// Rule 5.4.1: 俄国革命到第 4 阶段后，同盟国对俄 MO 直接失效。
				if (is_russian_mo_ignored_for_cp(game)) return MO_NONE_STATUS
				if (!attacker_has_any_regular()) return MO_NONE_STATUS
				if (!opponent_has_nation(RUSSIA)) return MO_NONE_STATUS
				return MO_VALID
			}
			if (mo === MO_BRITISH) {
				// Rule 5.4.2: 同盟国只需攻击英帝国任一合格国别单位。
				if (!attacker_has_any_regular()) return MO_NONE_STATUS
				if (!opponent_has_nation(BRITISH_EMPIRE_NATIONS)) return MO_NONE_STATUS
				return MO_VALID
			}
			if (
				mo === MO_TURKEY ||
				mo === MO_TURKEY_CAUCASUS ||
				mo === MO_TURKEY_EGYPT ||
				mo === MO_TURKEY_MESOPOTAMIA
			) {
				// Rule 5.4.3: 土耳其 MO 允许土耳其本国或阿拉伯部队完成，并按抽到的战区细分。
				if (!attacker_has_regular_nation(TURKISH_MO_NATIONS)) return MO_NONE_STATUS
				if (opponent_pieces.length === 0) return MO_NONE_STATUS
				if (mo === MO_TURKEY_CAUCASUS) {
					if (!opponent_in_area(is_caucasus)) return MO_REROLL
				}
				if (mo === MO_TURKEY_EGYPT) {
					if (!opponent_in_area(is_syria_palestine)) return MO_REROLL
				}
				if (mo === MO_TURKEY_MESOPOTAMIA) {
					if (!opponent_in_area(is_mesopotamia)) return MO_REROLL
				}
				return MO_VALID
			}
		}

		return MO_VALID
	}

	/**
	 * Updates MO fulfillment status based on Rule 5.1.2 (target area empty).
	 * @param {object} game
	 */
	function update_mo_fulfillment_status(game) {
		if (!game) return

		if (game.mo_ap !== MO_NONE && !game.mo_ap_fulfilled) {
			if (check_mo_validity(game, AP, game.mo_ap) !== MO_VALID) {
				game.mo_ap_fulfilled = true
			}
		}

		if (game.mo_cp !== MO_NONE && !game.mo_cp_fulfilled) {
			if (game.mo_cp === MO_ENVER) {
				if (!game.mo_cp_1_fulfilled) {
					if (check_mo_validity(game, CP, game.mo_cp_1) !== MO_VALID) {
						game.mo_cp_1_fulfilled = true
					}
				}
				if (!game.mo_cp_2_fulfilled) {
					if (check_mo_validity(game, CP, game.mo_cp_2) !== MO_VALID) {
						game.mo_cp_2_fulfilled = true
					}
				}
				if (game.mo_cp_1_fulfilled && game.mo_cp_2_fulfilled) {
					game.mo_cp_fulfilled = true
				}
			} else {
				if (check_mo_validity(game, CP, game.mo_cp) !== MO_VALID) {
					game.mo_cp_fulfilled = true
				}
			}
		}
	}

	function is_british_no_attack_unpaid(game, faction = AP) {
		return !!(
			game &&
			faction === AP &&
			game.mo_ap === MO_BRITISH_NO_ATTACK &&
			!game.br_attack_penalty_paid
		)
	}

	function get_pending_mo_penalty(game, faction) {
		if (!game) return null

		if (faction === AP) {
			if (!game.mo_ap || game.mo_ap === MO_NONE || game.mo_ap === MO_BRITISH_NO_ATTACK || game.mo_ap_fulfilled) {
				return null
			}
			if (check_mo_validity(game, AP, game.mo_ap) !== MO_VALID) return null
			return { faction: AP, mo: game.mo_ap, vp: "+1", pending: [{ mo: game.mo_ap }] }
		}

		if (faction === CP) {
			if (!game.mo_cp || game.mo_cp === MO_NONE || game.mo_cp_fulfilled) return null

			if (game.mo_cp === MO_ENVER) {
				const pending = []
				if (
					!game.mo_cp_1_fulfilled &&
					game.mo_cp_1 &&
					game.mo_cp_1 !== MO_NONE &&
					check_mo_validity(game, CP, game.mo_cp_1) === MO_VALID
				) {
					pending.push({ index: 1, mo: game.mo_cp_1 })
				}
				if (
					!game.mo_cp_2_fulfilled &&
					game.mo_cp_2 &&
					game.mo_cp_2 !== MO_NONE &&
					check_mo_validity(game, CP, game.mo_cp_2) === MO_VALID
				) {
					pending.push({ index: 2, mo: game.mo_cp_2 })
				}
				if (pending.length === 0) return null
				return { faction: CP, mo: game.mo_cp, vp: "-1", pending }
			}

			if (check_mo_validity(game, CP, game.mo_cp) !== MO_VALID) return null
			return { faction: CP, mo: game.mo_cp, vp: "-1", pending: [{ mo: game.mo_cp }] }
		}

		return null
	}

	function get_final_round_mo_warning(game, faction) {
		const penalty = get_pending_mo_penalty(game, faction)
		if (!penalty) return ""

		if (faction === AP) {
			return ` ${mo_name(penalty.mo)} 强制进攻：最后一轮！`
		}

		if (faction === CP && penalty.mo === MO_ENVER) {
			const detail = penalty.pending.map((entry) => `#${entry.index} ${mo_name(entry.mo)}`).join("、")
			return ` 恩维尔亲临前线：同盟国强制进攻最后一轮（${detail}）！`
		}

		if (faction === CP) {
			return ` ${mo_name(penalty.mo)} 强制进攻：最后一轮！`
		}

		return ""
	}

	Object.assign(exports, {
		MO_NONE,
		MO_RUSSIA,
		MO_BRITISH,
		MO_TURKEY,
		MO_ENVER,
		MO_MESOPOTAMIA,
		MO_BALKANS,
		MO_EGYPT,
		MO_BRITISH_MESOPOTAMIA,
		MO_BRITISH_EGYPT,
		MO_RUSSIA_CAUCASUS,
		MO_TURKEY_CAUCASUS,
		MO_TURKEY_EGYPT,
		MO_TURKEY_MESOPOTAMIA,
		MO_AP_CHOICE_5,
		MO_BRITISH_NO_ATTACK,
		mo_name,
		log_mo_results,
		determine_mo_ap,
		determine_mo_cp,
		create_attack_context,
		check_mo_criteria,
		check_mo_validity,
		update_mo_fulfillment_status,
		is_british_no_attack_unpaid,
		get_pending_mo_penalty,
		get_final_round_mo_warning,
		has_pending_enver_mo_choice,
		get_pending_enver_mo_choice_options,
		resolve_pending_enver_mo_choice,
		check_mo_on_attack_declared,
		check_mo_fulfillment,
		register,
		states
	})

	return exports
}
