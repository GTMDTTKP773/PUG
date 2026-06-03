"use strict"

let game

exports.set_globals = function (g) {
	game = g
}

exports.register = function (states, Engine, context) {
	const { data, combat } = Engine
	const { set_has, set_add } = Engine.utils

	const {
		log,
		log_h2,
		get_pieces_in_space,
		find_space,
		other_faction,
		set_control,
		check_supply,
		eliminate_piece,
		is_tribe,
		is_eliminated,
		is_not_on_map,
		get_reserve_box,
		log_h1,
		space_name,
		piece_name,
		MO_NONE,
		PHASE_SEQUENCE,
		push_state,
		goto_game_over,
		faction_name,
		has_jihad_prereq,
		get_connected_spaces,
		is_controlled_by,
		is_gallipoli,
		pieces_count_as_any_nation_for_rule,
		reinforce,
		push_undo,
		roll_die,
		determine_mo_ap,
		determine_mo_cp,
		check_mo_validity,
		get_season,
		discard_all_retained_cc,
		deal_cards,
		discard_card,
		card_name,
		clear_undo,
		MO_RUSSIA,
		MO_AP_CHOICE_5,
		MO_BRITISH_NO_ATTACK,
		MO_ENVER,
		COMMITMENT_TOTAL,
		COMMITMENT_MOBILIZATION,
		COMMITMENT_LIMITED,
		AP,
		CP
	} = context

	function final_victory_from_vp(vp) {
		if (vp >= 14) return { result: CP, victory: "CP Marginal Victory" }
		if (vp >= 10) return { result: CP, victory: "CP Victory of Endurance" }
		if (vp >= 7) return { result: AP, victory: "AP Victory of Endurance" }
		return { result: AP, victory: "AP Marginal Victory" }
	}

	function is_tu_tua_piece(p) {
		let info = data.pieces[p]
		return !!(info && (info.nation === "tu" || info.nation === "tua"))
	}

	function calculate_protocol_victory_adjustments() {
		let adjustments = 0

		let oilfields = new Set(["ploesti", "baku", "mosul", "ahwaz"])
		for (let s = 1; s < data.spaces.length; s++) {
			let name = data.spaces[s].name
			let key = name && name.toLowerCase()
			if (key && oilfields.has(key)) {
				if (is_controlled_by(game, s, AP)) adjustments -= 1
				else if (is_controlled_by(game, s, CP) || key === "ploesti") adjustments += 1
			}
		}

		let suez = find_space("Suez")
		if (suez >= 0) {
			let spaces = get_connected_spaces(game, suez)
			spaces.push(suez)
			let has_turkish = spaces.some((space) => {
				let pieces = get_pieces_in_space(game, space)
				return pieces.some(is_tu_tua_piece)
			})
			if (has_turkish) adjustments += 1
		}

		let has_turkish_in_india = false
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s].region === "india") {
				let pieces = get_pieces_in_space(game, s)
				if (pieces.some(is_tu_tua_piece)) {
					has_turkish_in_india = true
					break
				}
			}
		}
		if (has_turkish_in_india) adjustments += 1

		let cairo = find_space("Cairo")
		if (cairo >= 0) {
			let pieces = get_pieces_in_space(game, cairo)
			if (pieces.some((p) => data.pieces[p].faction === CP)) adjustments += 1
		}

		let has_ap_on_gallipoli = false
		for (let s = 1; s < data.spaces.length; s++) {
			if (is_gallipoli(s)) {
				let pieces = get_pieces_in_space(game, s)
				if (pieces.some((p) => data.pieces[p].faction === AP)) {
					has_ap_on_gallipoli = true
					break
				}
			}
		}
		if (has_ap_on_gallipoli) adjustments -= 1

		let constantinople = find_space("CONSTANTINOPLE")
		if (constantinople < 0) constantinople = find_space("Constantinople")
		let has_ap_in_constantinople = false
		if (constantinople >= 0) {
			let pieces = get_pieces_in_space(game, constantinople)
			has_ap_in_constantinople = pieces.some((p) => data.pieces[p].faction === AP)
		}
		if (has_ap_in_constantinople) adjustments -= 1

		if (game.jihad <= 3) adjustments -= 1
		if (game.jihad >= 8) adjustments += 1

		return adjustments
	}

	function log_mandated_offensive_results() {
		if (Engine.mo && typeof Engine.mo.log_mo_results === "function") {
			Engine.mo.log_mo_results(game, log)
		}
	}

	states.revolution_phase = {
		active: CP,
		prompt(res) {
			continue_revolution_phase()
			if (
				game.state !== "revolution_phase" &&
				states[game.state] &&
				typeof states[game.state].prompt === "function"
			) {
				states[game.state].prompt(res)
				return
			}
			res.prompt("革命阶段结算中")
		}
	}

	states.attrition_phase = {
		active: CP,
		prompt(res) {
			if (game.attrition_jihad_pending_finish) {
				finish_attrition_phase()
				if (
					game.state !== "attrition_phase" &&
					states[game.state] &&
					typeof states[game.state].prompt === "function"
				) {
					states[game.state].prompt(res)
					return
				}
			}
			res.prompt("补给结算阶段")
		}
	}

	function is_jihad_oos_attrition_unit(p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP) return false
		if (info.type !== "regular") return false
		if (!Engine.game_utils.is_lcu(p) && !Engine.game_utils.is_scu(p)) return false
		let s = game.pieces[p]
		if (!(s > 0) || !data.spaces[s]) return false
		if (data.spaces[s].area === "balkans") return false
		return Engine.game_utils.pieces_count_as_any_nation_for_rule(game, [p], ["ru", "br", "in", "anz"])
	}

	function finish_attrition_phase() {
		delete game.attrition_jihad_pending_finish
		next_phase("attrition_phase")
	}

	function record_missed_mo(faction) {
		let key = faction === AP ? "missed_mo_ap" : "missed_mo_cp"
		if (!Array.isArray(game[key])) game[key] = []
		set_add(game[key], game.turn)
	}

	function start_attrition_phase() {
		game.state = "attrition_phase"
		log_h1("补给结算阶段")

		// Rule 5.1.2: If the affected area is emptied of enemy troops, the VP penalty for failure no longer applies.
		Engine.mo.update_mo_fulfillment_status(game)

		let galicia = find_space("Galicia")
		let enver_falkenhayn_active = !!game.events["enver_falkenhayn_summit_active"]
		let russian_revolution_stage = game.events["russian_revolution"] || 0
		if (enver_falkenhayn_active && russian_revolution_stage < 4 && galicia >= 0) {
			let pieces = get_pieces_in_space(game, galicia)
			for (let p of pieces) {
				let info = data.pieces[p]
				if ((info.nation === "tu" || info.nation === "tua") && info.piece_class === "LCU") {
					let roll = roll_die()
					let lf = set_has(game.reduced, p) ? info.rlf : info.lf
					log(`加利西亚激战：${info.name} 掷骰${roll} (血量${lf})`)
					if (roll > lf) {
						if (set_has(game.reduced, p)) {
							log(`加利西亚激战：${info.name} 被消灭`)
							eliminate_piece(p, false)
						} else {
							log(`加利西亚激战：${info.name} 减损`)
							set_add(game.reduced, p)
						}
					}
				}
			}
		}

		check_supply(game)
		let jihad_for_oos_attrition = false

		if (game.oos && game.oos.length > 0) {
			let oos_units = [...game.oos]
			jihad_for_oos_attrition = oos_units.some((p) => is_jihad_oos_attrition_unit(p))
			for (let p of oos_units) {
				log(`${piece_name(p)} 被消灭 (OOS)`)
				eliminate_piece(p, true)
			}
			game.oos = []
		}

		// Rule 14.3.3: OOS spaces change control
		if (game.oos_spaces && game.oos_spaces.length > 0) {
			for (let s of game.oos_spaces) {
				if (Engine.map.is_potential_beachhead_space(s)) continue
				// Rule 14.3.3: Does not apply to neutral spaces or intact friendly forts
				let faction = Engine.map.get_space_controller(game, s)
				if ((faction === AP || faction === CP) && !Engine.map.has_undestroyed_fort(game, s, faction)) {
					// Rule 15.4.6: OOS trench attrition is resolved in the Attrition Phase.
					Engine.game_utils.apply_trench_attrition(game, s)
					let opponent = other_faction(faction)
					log(`${space_name(s)} 因断补损耗转为敌方控制`)
					set_control(game, s, opponent)
					if (
						opponent === AP &&
						Engine.neutral &&
						typeof Engine.neutral.apply_attrition_ru_vp_capture === "function"
					) {
						Engine.neutral.apply_attrition_ru_vp_capture(game, s)
					}
				}
			}
			game.oos_spaces = []
		}

		if (jihad_for_oos_attrition) {
			log("补给阶段断补消灭 AP 正规战斗单位（巴尔干外）：圣战 +1")
			game.attrition_jihad_pending_finish = true
			Engine.update_jihad_level(game, 1)
			if (game.state === "jihad_placement") return
			delete game.attrition_jihad_pending_finish
		}

		finish_attrition_phase()
	}

	function next_phase(current) {
		let next = PHASE_SEQUENCE[current]
		if (next) start_phase(next)
	}

	function start_phase(phase) {
		if (phase === "siege_phase") {
			start_siege_phase()
			return
		}
		if (phase === "revolution_phase") {
			start_revolution_phase()
			return
		}
		if (phase === "war_status_phase") {
			start_war_status_phase()
			return
		}
		if (phase === "replacement_phase") {
			start_replacement_phase()
			return
		}
		if (phase === "draw_cards_phase") {
			start_draw_cards_phase()
			return
		}
		game.state = phase
	}

	function check_victory_conditions() {
		if (Number.isFinite(game.cp_auto_victory_marker) && game.vp >= game.cp_auto_victory_marker) {
			goto_game_over(CP, `同盟国自动胜利 (标记 ${game.cp_auto_victory_marker})`)
			return true
		}
		if (game.vp >= 20) {
			goto_game_over(CP, "同盟国自动胜利 (VP 20+)")
			return true
		}
		if (game.vp <= 0) {
			goto_game_over(AP, "协约国自动胜利 (VP 0)")
			return true
		}
		if (game.protocol_victory) {
			let adjusted_vp = game.vp + calculate_protocol_victory_adjustments()
			let outcome = final_victory_from_vp(adjusted_vp)
			goto_game_over(outcome.result, " 协议胜利 - " + outcome.victory)
			return true
		}
		return false
	}

	function start_siege_phase() {
		game.state = "siege_phase"
		log_h1("围攻阶段")
		combat.resolve_siege_phase(game, log, set_control)
		next_phase("siege_phase")
	}

	function start_revolution_phase() {
		game.state = "revolution_phase"
		log_h1("革命阶段")
		game.active = CP
		game.revolution_step = 1
		continue_revolution_phase()
	}

	function prompt_followup_state(res) {
		if (states[game.state] && typeof states[game.state].prompt === "function") {
			states[game.state].prompt(res)
		}
	}

	function finish_russian_revolution_stage_4_sequence(from_action) {
		Engine.events.finish_russian_revolution_stage_4(game)
		game.active = CP
		if (from_action) {
			game.state = "revolution_phase"
			game.revolution_step = 4
			continue_revolution_phase()
		}
		return false
	}

	function advance_russian_revolution_stage_4_sequence(from_action = false) {
		if (!game.events) game.events = {}
		if (game.events["russian_revolution_stage_4_applied"]) return finish_russian_revolution_stage_4_sequence(from_action)

		while (true) {
			if (!game.events["russian_revolution_stage_4_cavalry_chosen"]) {
				let choices = Engine.events.get_russian_revolution_cavalry_choices(game)
				if (choices.length > 1) {
					game.active = AP
					game.state = "russian_revolution_stage_4_choose_cavalry"
					return true
				}
				Engine.events.select_russian_revolution_cavalry_survivor(game, choices.length === 1 ? choices[0] : -1)
				continue
			}

			if (!game.events["russian_revolution_stage_4_ru_units_removed"]) {
				Engine.events.remove_russian_revolution_stage_4_ru_units(game, { log })
				continue
			}

			if (!game.events["russian_revolution_stage_4_geoprotect_done"]) {
				let p = Engine.events.get_georgian_protectorate_piece(game)
				let spaces = Engine.events.get_georgian_protectorate_placement_spaces(game)
				if (p >= 0 && spaces.length > 0) {
					game.active = AP
					game.state = "russian_revolution_stage_4_georgian_protectorate"
					return true
				}
				Engine.events.skip_georgian_protectorate(game, { log })
				continue
			}

			if (!game.events["russian_revolution_stage_4_transcas_done"]) {
				let next = Engine.events.get_next_transcaucasian_federation_piece_to_place(game, { log })
				if (next < 0) {
					Engine.events.finish_transcaucasian_federation_placement(game)
					continue
				}

				game.active = AP
				game.state = "russian_revolution_stage_4_place_transcaucasian"
				return true
			}

			if (!game.events["russian_revolution_stage_4_soviet_done"]) {
				Engine.events.place_soviet_uprising_markers(game, { log })
				continue
			}

			if (!game.events["russian_revolution_stage_4_ge_ix_prepared"]) {
				Engine.events.prepare_ge_ix_army_replacement(game, { log })
				continue
			}

			if (!game.events["russian_revolution_stage_4_ge_ix_done"]) {
				let replacements = Engine.events.get_ge_ix_replacement_pieces(game)
				let space = Engine.events.get_ge_ix_replacement_space(game)
				if (space > 0 && replacements.length > 0) {
					game.active = CP
					game.state = "russian_revolution_stage_4_ge_ix_replacement"
					return true
				}
				Engine.events.skip_ge_ix_army_replacement(game, { log })
				continue
			}

			return finish_russian_revolution_stage_4_sequence(from_action)
		}
	}

	function begin_russian_revolution_stage_4_sequence() {
		if (!Engine.events.begin_russian_revolution_stage_4_interactive(game)) return false
		return advance_russian_revolution_stage_4_sequence(false)
	}

	states.russian_revolution_stage_4_choose_cavalry = {
		inactive: "俄国革命阶段4：AP 选择保留的 RU Cavalry 师。",
		prompt(res) {
			let choices = Engine.events.get_russian_revolution_cavalry_choices(game)
			if (choices.length <= 1) {
				advance_russian_revolution_stage_4_sequence(true)
				prompt_followup_state(res)
				return
			}
			res.prompt("俄国革命阶段4：AP 选择一个 RU Cavalry 师留在游戏中。")
			for (let p of choices) res.piece(p)
		},
		piece(p) {
			p = Number(p)
			if (!Engine.events.get_russian_revolution_cavalry_choices(game).includes(p)) return
			push_undo()
			if (Engine.events.select_russian_revolution_cavalry_survivor(game, p)) {
				advance_russian_revolution_stage_4_sequence(true)
			}
		}
	}

	states.russian_revolution_stage_4_georgian_protectorate = {
		inactive: "俄国革命阶段4：AP 放置 GE Georgian Protectorate。",
		prompt(res) {
			let p = Engine.events.get_georgian_protectorate_piece(game)
			let spaces = Engine.events.get_georgian_protectorate_placement_spaces(game)
			if (p < 0 || spaces.length === 0) {
				Engine.events.skip_georgian_protectorate(game, { log })
				advance_russian_revolution_stage_4_sequence(true)
				prompt_followup_state(res)
				return
			}
			res.who(p)
			res.prompt(`俄国革命阶段4：AP 可将 ${Engine.game_utils.piece_name(p)} 放置在空置的 Batum 或 TIFLIS。`)
			for (let s of spaces) res.space(s)
			res.action("skip")
		},
		space(s) {
			s = Number(s)
			if (!Engine.events.get_georgian_protectorate_placement_spaces(game).includes(s)) return
			push_undo()
			if (Engine.events.place_georgian_protectorate(game, s, { log })) {
				advance_russian_revolution_stage_4_sequence(true)
			}
		},
		skip() {
			push_undo()
			Engine.events.skip_georgian_protectorate(game, { log })
			advance_russian_revolution_stage_4_sequence(true)
		},
		done() {
			this.skip()
		}
	}

	states.russian_revolution_stage_4_place_transcaucasian = {
		inactive: "俄国革命阶段4：AP 放置 Transcaucasian Federation 单位。",
		prompt(res) {
			let p = Engine.events.get_current_transcaucasian_federation_piece_to_place(game)
			if (p < 0) {
				advance_russian_revolution_stage_4_sequence(true)
				prompt_followup_state(res)
				return
			}
			res.who(p)
			res.prompt(`俄国革命阶段4：将 ${Engine.game_utils.piece_name(p)} 放置在 AP 控制的俄国或高加索地区。`)
			for (let s of Engine.events.get_transcaucasian_placement_spaces(game, p)) res.space(s)
		},
		space(s) {
			s = Number(s)
			let p = Engine.events.get_next_transcaucasian_federation_piece_to_place(game, { log })
			if (p < 0) return
			if (!Engine.events.get_transcaucasian_placement_spaces(game, p).includes(s)) return
			push_undo()
			if (Engine.events.place_transcaucasian_federation_piece(game, p, s, { log })) {
				advance_russian_revolution_stage_4_sequence(true)
			}
		}
	}

	states.russian_revolution_stage_4_ge_ix_replacement = {
		inactive: "俄国革命阶段4：CP 选择 GE IX Army 的替换单位。",
		prompt(res) {
			let replacements = Engine.events.get_ge_ix_replacement_pieces(game)
			let space = Engine.events.get_ge_ix_replacement_space(game)
			if (space <= 0 || replacements.length === 0) {
				Engine.events.skip_ge_ix_army_replacement(game, { log })
				advance_russian_revolution_stage_4_sequence(true)
				prompt_followup_state(res)
				return
			}
			res.where(space)
			res.prompt("俄国革命阶段4：CP 可用预备军中的一个 GE infantry SCU 替换 GE IX Army。")
			for (let p of replacements) res.piece(p)
			res.action("skip")
		},
		piece(p) {
			p = Number(p)
			if (!Engine.events.get_ge_ix_replacement_pieces(game).includes(p)) return
			push_undo()
			if (Engine.events.replace_ge_ix_army_with_scu(game, p, { log })) {
				advance_russian_revolution_stage_4_sequence(true)
			}
		},
		skip() {
			push_undo()
			Engine.events.skip_ge_ix_army_replacement(game, { log })
			advance_russian_revolution_stage_4_sequence(true)
		},
		done() {
			this.skip()
		}
	}

	function check_russian_revolution_step() {
		if (!game.events["parvus_to_berlin"]) return false

		if (typeof Engine.events.sync_russian_revolution_markers === "function") {
			Engine.events.sync_russian_revolution_markers(game)
		}

		let constantinople = find_space("CONSTANTINOPLE")
		let blocked = constantinople >= 0 && Engine.map.is_russia_controlled_space(game, constantinople)
		if (!game.events["russian_revolution"]) {
			let timer =
				typeof Engine.events.get_revolution_marker_turn === "function"
					? Engine.events.get_revolution_marker_turn(game)
					: game.events["russian_revolution_timer"] || 9
			if (game.turn >= timer && game.turn >= game.god_save_the_tsar && !blocked) {
				game.ru_revolution = 1
				game.events["russian_revolution"] = 1
				if (typeof Engine.events.apply_russian_revolution_stage_effects === "function") {
					Engine.events.apply_russian_revolution_stage_effects(game, 1, { log })
				}
				log("俄国革命开始：第1阶段。")
				return false
			}
			return false
		}
		if (blocked) return false
		if (game.events["russian_revolution"] < 4) {
			game.events["russian_revolution"] += 1
			game.ru_revolution = game.events["russian_revolution"]
			let paused = false
			if (
				game.events["russian_revolution"] === 4 &&
				typeof Engine.events.begin_russian_revolution_stage_4_interactive === "function"
			) {
				paused = begin_russian_revolution_stage_4_sequence()
			} else if (typeof Engine.events.apply_russian_revolution_stage_effects === "function") {
				Engine.events.apply_russian_revolution_stage_effects(game, game.events["russian_revolution"], { log })
			}
			log(`俄国革命推进至阶段 ${game.events["russian_revolution"]}。`)
			return paused
		}
		return false
	}

	function continue_revolution_phase() {
		if (game.revolution_step === 1) {
			let tribes_on_map = []
			for (let p = 0; p < game.pieces.length; p++) {
				if (is_tribe(p) && !is_not_on_map(game, p)) tribes_on_map.push(p)
			}

			let diff = game.jihad - tribes_on_map.length
			if (diff > 0) {
				log(`圣战等级 (${game.jihad}) 大于地图上的部落数量 (${tribes_on_map.length}): 需增加 ${diff} 个部落。`)
				game.tribes_to_place = diff
				game.revolution_step = 2
				push_state("jihad_placement")
				return
			}
			if (diff < 0) {
				let to_remove = -diff
				log(
					`圣战等级 (${game.jihad}) 小于地图上的部落数量 (${tribes_on_map.length}): 需移除 ${to_remove} 个部落。`
				)
				game.tribes_to_remove = to_remove
				game.revolution_step = 2
				push_state("jihad_removal")
				return
			}
			game.revolution_step = 2
		}

		if (game.revolution_step === 2) {
			game.revolution_step = 3
			let has_rebellion_option =
				(has_jihad_prereq("Egypt") && !game.jihad_revolt_egypt) ||
				(has_jihad_prereq("India") && !game.jihad_revolt_india) ||
				(has_jihad_prereq("Afghanistan") && !game.jihad_revolt_afghanistan) ||
				(has_jihad_prereq("Central Asia") && !game.jihad_revolt_central_asia)
			if (has_rebellion_option) {
				push_state("jihad_rebellion_check")
				return
			}
		}

		if (game.revolution_step === 3) {
			game.revolution_step = 4
			if (check_russian_revolution_step()) return
		}

		delete game.revolution_step
		next_phase("revolution_phase")
	}

	function start_turn() {
		let max_turn = game.scenario_max_turn || 17
		if (game.turn >= max_turn) {
			log(`游戏结束，回合上限 ${max_turn} 到达。`)
			let adjusted_vp = game.vp + calculate_protocol_victory_adjustments()
			let final = final_victory_from_vp(adjusted_vp)
			goto_game_over(final.result, `游戏结束，回合 ${max_turn} - ` + final.victory)
			return
		}

		game.turn++
		log_h1(`Turn ${game.turn}`)
		delete game.catastrophic_attack_supply_exceptions

		if (Engine.events && typeof Engine.events.complete_sinai_railroad_if_ready === "function") {
			Engine.events.complete_sinai_railroad_if_ready(game, log)
		}

		game.ap_actions = Array(7).fill(null)
		game.cp_actions = Array(7).fill(null)

		// Reset per-turn trackers
		game.mo_ap_fulfilled = false
		game.mo_cp_fulfilled = false
		game.mo_ap = null
		game.mo_cp = null

		// Reset Enver Variables
		game.mo_cp_1 = null
		game.mo_cp_2 = null
		game.mo_cp_1_fulfilled = false
		game.mo_cp_2_fulfilled = false

		game.mo_required_ap = false
		game.mo_required_cp = false
		game.enver_attack_count = 0
		game.british_mandate_violated = false
		delete game.br_attack_penalty_paid
		delete game.br_no_attack_activated
		game.ge_to_tu_rp_used = 0
		game.kitchener_conversion_used = false
		game.entered_regions_this_turn = []
		game.rein_record = { ru: 0, br: 0, in_anz: 0, tu: 0 }
		
		// Handle delayed reinforcements
		if (game.delayed_reinforcements && Array.isArray(game.delayed_reinforcements)) {
			let remaining = []
			for (let r of game.delayed_reinforcements) {
				if (r.turn <= game.turn) {
					log(`Delayed Reinforcement Arrives: ${piece_name(r.piece)}`)
					reinforce(game, data.pieces[r.piece].name, data.pieces[r.piece].faction, r.space)

					if (
						game.events &&
						game.events["gorlice_tarnow_return"] === r.turn &&
						game.events["gorlice_tarnow_piece"] === r.piece
					) {
						delete game.events["gorlice_tarnow_return"]
						delete game.events["gorlice_tarnow_piece"]
					}
				} else {
					remaining.push(r)
				}
			}
			game.delayed_reinforcements = remaining
		}

		// Rule: Churchill Prevails recurring RU RP
		if (game.events["bosphorus_destroyed"] && !game.events["german_subs"]) {
			if (!Engine.events.can_record_russian_rp || Engine.events.can_record_russian_rp(game)) {
				game.rp_ap.ru += 1
				log("Churchill Prevails: Bosphorus is open; Russian RP +1.")
			}
		}
		start_mandated_offensive_phase()
	}

	function get_cp_opening_mobilization_ops4_cards() {
		if (!Array.isArray(game.deck_cp)) return []
		let candidates = game.deck_cp.filter((c) => {
			let card = data.cards[c]
			return (
				card &&
				card.faction === CP &&
				card.commitment === COMMITMENT_MOBILIZATION &&
				Number(card.ops) === 4
			)
		})
		candidates.sort((a, b) => a - b)
		return candidates
	}

	function start_mandated_offensive_phase() {
		game.state = "mandated_offensive_phase"
		log_h2("强制进攻阶段")

		game.mo_ap = MO_NONE
		game.mo_cp = MO_NONE
		game.mo_ap_fulfilled = true
		game.mo_cp_fulfilled = true

		if (game.turn === 1) {
			game.mo_ap = MO_RUSSIA
			game.mo_cp = MO_RUSSIA
			game.mo_ap_fulfilled = false
			game.mo_cp_fulfilled = false
			log_mandated_offensive_results()
			game.active = CP
			game.player_order = [AP, CP]
			if (!game.cp_opening_mobilization_pick_done) {
				game.state = "cp_opening_mobilization_pick"
			} else {
				game.state = "acknowledge_mo_results"
			}
			return
		}

		let ap_die = roll_die()
		let ap_drm = game.mo_ap_modifier || 0
		let ap_roll = ap_die + ap_drm

		let cp_drm = 0
		let cp_die
		let cp_roll
		if (!game.mo_cp_cancelled) {
			cp_die = roll_die()
			cp_roll = cp_die + cp_drm
		}

		let mo_ap = determine_mo_ap(ap_roll)
		// Rule 5.1.2: Validity check (None or Reroll)
		let status_ap = check_mo_validity(game, AP, mo_ap)
		while (status_ap === "REROLL") {
			ap_die = roll_die()
			ap_roll = ap_die + ap_drm
			mo_ap = determine_mo_ap(ap_roll)
			status_ap = check_mo_validity(game, AP, mo_ap)
		}
		if (status_ap === "NONE") {
			mo_ap = MO_NONE
		}
		game.mo_ap = mo_ap
		game.mo_ap_die = ap_die
		game.mo_ap_drm = ap_drm

		if (game.mo_cp_cancelled) {
			game.mo_cp = MO_NONE
			game.mo_cp_fulfilled = true
			delete game.mo_cp_die
			delete game.mo_cp_drm
		} else {
			let mo_cp = determine_mo_cp(cp_roll)
			let status_cp = check_mo_validity(game, CP, mo_cp)
			while (status_cp === "REROLL") {
				cp_die = roll_die()
				cp_roll = cp_die + cp_drm
				mo_cp = determine_mo_cp(cp_roll)
				status_cp = check_mo_validity(game, CP, mo_cp)
			}
			if (status_cp === "NONE") {
				mo_cp = MO_NONE
			}

			game.mo_cp = mo_cp
			game.mo_cp_die = cp_die
			game.mo_cp_drm = cp_drm
		}

		if (game.mo_ap === MO_RUSSIA && game.events["russian_revolution"]) {
			game.mo_ap = MO_NONE
		}
		if (game.mo_cp === MO_RUSSIA && game.events["russian_revolution"] >= 4) {
			game.mo_cp = MO_NONE
		}

		if (game.mo_ap !== MO_NONE) {
			game.mo_ap_fulfilled = game.mo_ap === MO_BRITISH_NO_ATTACK
		} else {
			game.mo_ap_fulfilled = true
		}

		if (game.mo_cp !== MO_NONE) {
			game.mo_cp_fulfilled = false
		} else {
			game.mo_cp_fulfilled = true
		}
		// Handle Enver (CP Roll 6)
		if (game.mo_cp === MO_ENVER) {
			game.active = AP
			game.state = "mo_enver_choose_1"
			return
		}

		// Check for Choices
		if (game.mo_ap === MO_AP_CHOICE_5) {
			game.active = AP
			game.state = "mo_choice_ap"
			return
		}

		game.active = AP
		game.state = "acknowledge_mo_results"
		log_mandated_offensive_results()
	}

	states.cp_opening_mobilization_pick = {
		prompt(res) {
			let candidates = get_cp_opening_mobilization_ops4_cards()
			if (candidates.length === 0) {
				log("开局同盟国未找到可选的动员阶段4点牌，跳过选牌。")
				deal_cards(CP)
				game.cp_opening_mobilization_pick_done = true
				game.active = AP
				game.state = "acknowledge_mo_results"
				states.acknowledge_mo_results.prompt(res)
				return
			}
			res.prompt("同盟国自选一张动员阶段4点牌加入手牌。")
			res.hand(candidates)
			for (let c of candidates) {
				res.action("card", c)
			}
		},
		card(c) {
			c = Number(c)
			if (!Number.isInteger(c)) return
			let candidates = get_cp_opening_mobilization_ops4_cards()
			if (!candidates.includes(c)) return
			push_undo()
			let idx = game.deck_cp.indexOf(c)
			if (idx >= 0) game.deck_cp.splice(idx, 1)
			game.hand_cp.push(c)
			deal_cards(CP)
			game.cp_opening_mobilization_pick_done = true
			log(`同盟国自选牌: ${card_name(c)}`)
			game.active = AP
			game.state = "acknowledge_mo_results"
		}
	}

	function start_war_status_phase() {
		game.state = "war_status_phase"
		log_h1("战争状态阶段")

		let galicia = find_space("Galicia")
		let enver_falkenhayn_active = !!game.events["enver_falkenhayn_summit_active"]
		let russian_revolution_stage = game.events["russian_revolution"] || 0
		if (enver_falkenhayn_active && russian_revolution_stage < 4 && get_season(game) === "Summer" && galicia >= 0) {
			let has_turkish_lcu_in_galicia = get_pieces_in_space(game, galicia).some((p) => {
				let info = data.pieces[p]
				return info && (info.nation === "tu" || info.nation === "tua") && info.piece_class === "LCU"
			})
			if (has_turkish_lcu_in_galicia) {
				game.vp += 1
				log("Enver-Falkenhayn Summit: Turkish LCU in Galicia grants VP +1.")
			}
		}

		if (game.blockade_vp_penalty_active && get_season(game) === "Winter") {
			let total_war_cp = game.war_commitment_cp === COMMITMENT_TOTAL
			let railway_complete = Engine.map.is_rail_connected_to_galicia(game)

			if (total_war_cp && railway_complete) {
				game.blockade_vp_penalty_active = false
				log(
					"柏林-君士坦丁堡铁路建成且同盟国进入全面战争状态: 皇家海军封锁效果被取消。"
				)
			} else {
				game.vp -= 1
				log("皇家海军封锁: -1 VP.")
			}
		}

		if (game.mo_ap !== MO_NONE && !game.mo_ap_fulfilled) {
			game.vp += 1
			record_missed_mo(AP)
			log("AP failed Mandated Offensive: VP +1")
		}
		if (game.british_mandate_violated) {
			if (!game.br_attack_penalty_paid) {
				game.vp += 1
				game.br_attack_penalty_paid = true
				log("AP violated British No Attack Mandate: VP +1")
			}
			record_missed_mo(AP)
		}
		if (game.mo_cp !== MO_NONE && !game.mo_cp_fulfilled) {
			game.vp -= 1
			record_missed_mo(CP)
			log("CP failed Mandated Offensive: VP -1")
		}

		if (
			game.events["jerusalem_by_christmas"] &&
			typeof game.events["jerusalem_by_christmas"] === "object" &&
			game.events["jerusalem_by_christmas"].turn !== undefined &&
			game.events["jerusalem_by_christmas"].turn <= game.turn
		) {
			let event = game.events["jerusalem_by_christmas"]
			let target = event.target_space
			let occupied = false
			if (target > 0) {
				let pieces = get_pieces_in_space(game, target)
				occupied = pieces_count_as_any_nation_for_rule(game, pieces, ["br", "in", "anz"])
			}
			if (occupied) {
				game.vp -= 1
				log(`圣诞节前收复圣城结算：${space_name(target)} 被英国/印度/澳新部队占据，VP -1。`)
			} else {
				game.vp += 1
				let target_name = target > 0 ? space_name(target) : "目标地块"
				log(`圣诞节前收复圣城结算：${target_name} 未被英国/印度/澳新部队占据，VP +1。`)
			}
			delete game.events["jerusalem_by_christmas"]
		}

		if (game.turn === 1) {
			if (check_victory_conditions()) return
			log("第一回合：跳过战争状态阶段")
			next_phase("war_status_phase")
			return
		}

		if (get_season(game) === "Winter" && game.events["british_war_weariness"]) {
			if (Engine.events && typeof Engine.events.shift_cp_auto_victory_marker === "function") {
				Engine.events.shift_cp_auto_victory_marker(game, -1, { log }, "英国厌战冬季结算")
			}
		}

		if (check_victory_conditions()) return

		if (game.armistice_turn && game.turn >= game.armistice_turn) {
			log(`停战回合 ${game.armistice_turn} 到达，游戏结束。`)
			let adjusted_vp = game.vp + calculate_protocol_victory_adjustments()
			let final = final_victory_from_vp(adjusted_vp)
			goto_game_over(final.result, "停战 - " + final.victory)
			return
		}

		let scenario_max_turn = game.scenario_max_turn || 17
		if (game.turn >= scenario_max_turn) {
			log(`回合 ${scenario_max_turn} 结束，未达成自动胜利，停战生效。`)
			let adjusted_vp = game.vp + calculate_protocol_victory_adjustments()
			let final = final_victory_from_vp(adjusted_vp)
			goto_game_over(final.result, "停战 - " + final.victory)
			return
		}

		check_war_commitment_increase()

		if (Engine.collapse.handle_national_collapse(game, log)) return

		next_phase("war_status_phase")
	}

	function check_war_commitment_increase() {
		if (game.turn < 2) return

		// AP
		if (game.war_commitment_ap === COMMITMENT_MOBILIZATION && game.war_status_ap >= 4) {
			game.war_commitment_ap = COMMITMENT_LIMITED
			log("协约国进入有限战争")
			add_commitment_cards(AP, COMMITMENT_LIMITED)
		} else if (game.war_commitment_ap === COMMITMENT_LIMITED && game.war_status_ap >= 11) {
			game.war_commitment_ap = COMMITMENT_TOTAL
			log("协约国进入全面战争")
			add_commitment_cards(AP, COMMITMENT_TOTAL)
		}

		// CP
		if (game.war_commitment_cp === COMMITMENT_MOBILIZATION && game.war_status_cp >= 4) {
			game.war_commitment_cp = COMMITMENT_LIMITED
			log("同盟国进入有限战争")
			add_commitment_cards(CP, COMMITMENT_LIMITED)
		} else if (game.war_commitment_cp === COMMITMENT_LIMITED && game.war_status_cp >= 11) {
			game.war_commitment_cp = COMMITMENT_TOTAL
			log("同盟国进入全面战争")
			add_commitment_cards(CP, COMMITMENT_TOTAL)
		}
	}

	function add_commitment_cards(faction, commitment) {
		let deck = faction === AP ? game.deck_ap : game.deck_cp
		let cards_added = 0
		for (let i = 1; i < data.cards.length; i++) {
			if (data.cards[i].faction === faction && data.cards[i].commitment === commitment) {
				deck.push(i)
				cards_added++
			}
		}
		if (cards_added > 0) {
			let key = faction === AP ? "ap" : "cp"
			if (!game.pending_commitment_shuffle) game.pending_commitment_shuffle = { ap: false, cp: false }
			game.pending_commitment_shuffle[key] = true
		}
	}

	function begin_suez_delayed_sr_arrivals() {
		if (!Array.isArray(game.suez_delayed_sr) || game.suez_delayed_sr.length === 0) return false

		let remaining = []
		let pending = []
		for (let entry of game.suez_delayed_sr) {
			if (!entry || entry.turn > game.turn) {
				remaining.push(entry)
				continue
			}
			let p = entry.piece
			if (!data.pieces[p]) continue
			let ports = Engine.map.get_suez_delayed_sr_arrival_ports(game, entry)
			if (ports.length === 0) {
				entry.turn = game.turn + 1
				entry.allow_any_friendly_port = true
				remaining.push(entry)
				log(`${piece_name(p)} Suez delayed SR: no friendly port is available in the destination area; delayed to turn ${entry.turn}.`)
				continue
			}
			pending.push(entry)
		}

		game.suez_delayed_sr = remaining
		if (pending.length === 0) return false
		game.suez_delayed_sr_pending = pending
		game.active = AP
		game.state = "suez_delayed_sr_arrival"
		return true
	}

	function finish_suez_delayed_sr_arrival() {
		if (Array.isArray(game.suez_delayed_sr_pending) && game.suez_delayed_sr_pending.length > 0) return
		delete game.suez_delayed_sr_pending
		start_replacement_phase()
	}

	function start_replacement_phase() {
		if (begin_suez_delayed_sr_arrivals()) return
		log_h1("补员阶段")

		let deficit = Engine.events.apply_turkish_war_weariness_rp(game, log)
		if (deficit > 0) {
			game.tu_war_weariness_deficit = deficit
			game.active = CP
			game.state = "turkish_war_weariness_penalty"
			return
		}

		enter_replacement_rp_phase()
	}

	function enter_replacement_rp_phase() {
		game.kitchener_conversion_used = false
		game.br_to_ru_rp_used = false

		if (game.events["central_asia_rebellion"]) game.rp_rebel.ca += 1
		if (game.events["afghan_alliance"]) game.rp_rebel.af += 1
		if (game.events["egyptian_rebellion"]) game.rp_rebel.eg += 1
		if (game.events["indian_rebellion"]) game.rp_rebel.in += 1

		if (game.events["lloyd_george_takes_command"]) {
			game.rp_ap.br += 1
			log("劳合乔治接管指挥权：AP 额外获得 1 BR RP。")
		}

		if (game.events["robertson"]) {
			game.rp_ap.br = Math.max(0, game.rp_ap.br - 1)
			log("罗伯逊：AP 减少 1 BR RP。")
		}

		goto_replacement_faction(AP)
	}

	function get_tu_war_weariness_candidates() {
		let candidates = []
		for (let p = 0; p < game.pieces.length; p++) {
			let info = data.pieces[p]
			if (!info) continue
			if (info.faction !== CP) continue
			if (info.nation !== "tu" && info.nation !== "tua") continue
			if (is_eliminated(game, p)) continue
			if (Engine.game_utils.is_removed(game, p)) continue
			if (Engine.game_utils.is_reinforcement(game, p)) continue
			let cost = set_has(game.reduced, p) ? (info.piece_class === "LCU" ? 2 : 1) : info.piece_class === "LCU" ? 1 : 0.5
			if (cost > 0) candidates.push({ p, cost })
		}
		return candidates
	}

	function finish_tu_war_weariness_penalty() {
		delete game.tu_war_weariness_deficit
		enter_replacement_rp_phase()
	}

	function get_blockade_tu_rp_recovery_pool() {
		return Math.max(0, Number(game.tu_rp_recovery_pool || 0))
	}

	function clear_replacement_points_for_active_faction() {
		let rps = game.active === AP ? game.rp_ap : game.rp_cp
		if (game.active === CP && game.events["royal_navy_blockade"]) {
			let unused_tu_rp = Number(rps.tu || 0)
			let total_recovery_pool = get_blockade_tu_rp_recovery_pool()
			let recoverable_tu_rp = Math.min(unused_tu_rp, total_recovery_pool)
			if (recoverable_tu_rp > 0) {
				let max_tu_rp = Math.max(0, Number(game.tu_rp_limit ?? 25))
				game.tu_rp_limit = max_tu_rp + recoverable_tu_rp
				if (game && Array.isArray(game.log)) {
					log(`皇家海军封锁：未使用土耳其 RP ${recoverable_tu_rp}，最大补给限度回升至 ${game.tu_rp_limit}。`)
				}
			}
			game.tu_rp_recovery_pool = 0
			game.tu_rp_ge_converted = 0
		}
		for (let key of Object.keys(rps)) {
			rps[key] = 0
		}
	}

	function has_replacement_points(faction) {
		let rps = faction === AP ? game.rp_ap : game.rp_cp
		if (faction === CP) {
			let has_rebel_rp = Object.values(game.rp_rebel || {}).some(v => v > 0)
			if (has_rebel_rp) return true
		}
		return Object.values(rps).some((value) => value > 0)
	}

	function get_rebuild_spaces(p) {
		let info = data.pieces[p]
		let spaces = new Set()
		if (!info) return spaces
		let faction = Engine.map.get_piece_replacement_faction(game, p)
		if (!faction) return spaces

		if (is_eliminated(game, p)) {
			for (let s of Engine.map.get_valid_rebuild_spaces(game, p, faction)) {
				spaces.add(s)
			}
			if (Engine.map.can_rebuild_in_reserve_box(p)) {
				spaces.add(get_reserve_box(faction))
			}
		} else {
			let s = game.pieces[p]
			if (s > 0 && s < data.spaces.length) {
				spaces.add(s)
			}
		}
		return spaces
	}

	function is_piece_replaceable_in_rp_phase(p, faction = game.active) {
		if (!data.pieces[p] || Engine.map.get_piece_replacement_faction(game, p) !== faction) return false
		let cost = Engine.map.get_replacement_cost(game, p)
		if (cost <= 0) return false
		if (is_eliminated(game, p)) {
			if (get_rebuild_spaces(p).size === 0) return false
		} else if (!set_has(game.reduced, p)) {
			return false
		}
		return Engine.map.can_afford_replacement(game, p, cost)
	}

	function has_valid_replacements(faction) {
		for (let p = 0; p < game.pieces.length; p++) {
			if (is_piece_replaceable_in_rp_phase(p, faction)) return true
		}
		return false
	}

	function finish_replacement_phase() {
		for (let key of Object.keys(game.rp_rebel || {})) {
			game.rp_rebel[key] = 0
		}
		next_phase("replacement_phase")
	}

	function goto_replacement_faction(faction) {
		if (faction === AP) {
			if (has_replacement_points(AP) && has_valid_replacements(AP)) {
				game.active = AP
				game.state = "rp_phase"
				return
			}
			game.active = AP
			clear_replacement_points_for_active_faction()
			goto_replacement_faction(CP)
			return
		}

		if (has_replacement_points(CP) && has_valid_replacements(CP)) {
			game.active = CP
			game.state = "rp_phase"
			return
		}

		game.active = CP
		clear_replacement_points_for_active_faction()
		finish_replacement_phase()
	}

	states.suez_delayed_sr_arrival = {
		prompt(res) {
			let entry = Array.isArray(game.suez_delayed_sr_pending) ? game.suez_delayed_sr_pending[0] : null
			if (!entry || !data.pieces[entry.piece]) {
				if (Array.isArray(game.suez_delayed_sr_pending)) game.suez_delayed_sr_pending.shift()
				finish_suez_delayed_sr_arrival()
				return
			}
			let ports = Engine.map.get_suez_delayed_sr_arrival_ports(game, entry)
			res.who(entry.piece)
			res.prompt(`Suez delayed SR: choose the arrival port for ${piece_name(entry.piece)}.`)
			for (let s of ports) res.space(s)
		},
		space(s) {
			let entry = Array.isArray(game.suez_delayed_sr_pending) ? game.suez_delayed_sr_pending[0] : null
			if (!entry || !data.pieces[entry.piece]) return
			let ports = Engine.map.get_suez_delayed_sr_arrival_ports(game, entry)
			if (!ports.includes(s)) return
			push_undo()
			game.pieces[entry.piece] = s
			log(`${piece_name(entry.piece)} Suez delayed SR arrives at ${space_name(s)}.`)
			game.suez_delayed_sr_pending.shift()
			finish_suez_delayed_sr_arrival()
		}
	}

	states.turkish_war_weariness_penalty = {
		prompt(res) {
			let remaining = Number(game.tu_war_weariness_deficit || 0)
			if (remaining <= 0) {
				finish_tu_war_weariness_penalty()
				states.rp_phase.prompt(res)
				return
			}

			let candidates = get_tu_war_weariness_candidates()
			res.prompt(`土耳其战争疲劳：同盟国需降编 ${remaining} RP`)
			for (let c of candidates) res.piece(c.p)
			if (candidates.length === 0) {
				res.prompt("无可降编土耳其单位，点击 done 继续补员阶段。")
			}
			res.action("done")
		},
		piece(p) {
			p = Number(p)
			if (!Number.isInteger(p)) return
			let remaining = Number(game.tu_war_weariness_deficit || 0)
			if (remaining <= 0) {
				finish_tu_war_weariness_penalty()
				return
			}
			let candidate = get_tu_war_weariness_candidates().find((x) => x.p === p)
			if (!candidate) return

			push_undo()
			let info = data.pieces[p]
			if (set_has(game.reduced, p)) {
				log(`${faction_name(CP)} 因土耳其战争疲劳移除 ${info.name}`)
				game.pieces[p] = Engine.game_utils.get_eliminated_box(info.faction)
				Engine.utils.set_delete(game.reduced, p)
			} else {
				log(`${faction_name(CP)} 因土耳其战争疲劳将 ${info.name} 降为残编`)
				set_add(game.reduced, p)
			}
			game.tu_war_weariness_deficit = Number((remaining - candidate.cost).toFixed(2))
			if (game.tu_war_weariness_deficit <= 0) {
				finish_tu_war_weariness_penalty()
			}
		},
		done() {
			let remaining = Number(game.tu_war_weariness_deficit || 0)
			if (remaining > 0 && get_tu_war_weariness_candidates().length > 0) return
			finish_tu_war_weariness_penalty()
		}
	}

	function start_draw_cards_phase() {
		log_h1("抽牌阶段")

		// Reset markers for next turn
		game.mo_ap = MO_NONE
		game.mo_cp = MO_NONE

		discard_all_retained_cc()
		delete game.combat_cards
		delete game.combat_cards_effected
		delete game.combat_card_sources
		delete game.cancelled_cc_dispositions
		goto_ap_draw_cards_phase()
	}

	function goto_ap_draw_cards_phase() {
		if (game.hand_ap && game.hand_ap.length > 0) {
			game.state = "draw_cards_phase"
			game.active = AP
			game.discarded_ccs = []
		} else {
			deal_cards(AP)
			goto_cp_draw_cards_phase()
		}
	}

	function goto_cp_draw_cards_phase() {
		if (game.hand_cp && game.hand_cp.length > 0) {
			game.state = "draw_cards_phase"
			game.active = CP
			game.discarded_ccs = []
		} else {
			deal_cards(CP)
			start_turn()
		}
	}

	function can_discard_during_draw_phase(c) {
		let card = data.cards[c]
		if (!card) return false
		return !!card.cc;
	}

	states.draw_cards_phase = {
		prompt(res) {
			let hand = game.active === AP ? game.hand_ap : game.hand_cp
			res.prompt(`${faction_name(game.active)} 抽牌阶段: 弃置任意战斗牌。`)
			for (let c of hand) {
				if (can_discard_during_draw_phase(c)) {
					res.action("card", c)
				}
			}
			res.action("done")
		},
		card(c) {
			push_undo()
			discard_card(c)
			if (!Array.isArray(game.discarded_ccs)) game.discarded_ccs = []
			game.discarded_ccs.push(c)
		},
		discard(c) {
			this.card(c)
		},
		done() {
			clear_undo()
			if (!Array.isArray(game.discarded_ccs)) game.discarded_ccs = []
			if (game.discarded_ccs.length > 0) {
				log(`${faction_name(game.active)} 弃置手牌:`)
				for (let c of game.discarded_ccs) {
					log(card_name(c))
				}
			}
			deal_cards(game.active)
			if (game.active === AP) {
				goto_cp_draw_cards_phase()
			} else {
				start_turn()
			}
		}
	}

	states.rp_phase = {
		prompt(res) {
			let faction = game.active === AP ? "AP" : "CP"
			let rps = game.active === AP ? game.rp_ap : game.rp_cp
			let rp_str = Object.entries(rps)
				.filter(([, v]) => v > 0)
				.map(([k, v]) => `${k.toUpperCase()}:${v}`)
				.join(", ")

			if (game.active === CP) {
				let rebel_str = Object.entries(game.rp_rebel || {})
					.filter(([, v]) => v > 0)
					.map(([k, v]) => `${k.toUpperCase()}(Rebel):${v}`)
					.join(", ")
				if (rebel_str) {
					rp_str = rp_str ? `${rp_str}, ${rebel_str}` : rebel_str
				}
			}

			let replaceable_pieces = []
			for (let p = 0; p < game.pieces.length; p++) {
				if (is_piece_replaceable_in_rp_phase(p)) replaceable_pieces.push(p)
			}

			if (replaceable_pieces.length === 0) {
				res.prompt(`${faction} 补员阶段: 完成。`)
				res.action("done")
				return
			}

			res.prompt(`${faction} 补员阶段: ${rp_str || "无可用RP"}`)

			for (let p of replaceable_pieces) res.piece(p)
			res.action("done")
		},
		piece(p) {
			p = Number(p)
			if (!Number.isInteger(p)) return
			let info = data.pieces[p]
			if (!info || Engine.map.get_piece_replacement_faction(game, p) !== game.active) return
			if (!is_piece_replaceable_in_rp_phase(p)) return
			let cost = Engine.map.get_replacement_cost(game, p)
			push_undo()
			Engine.map.spend_replacement_points(game, p, cost)
			if (is_eliminated(game, p)) {
				log(`${faction_name(game.active)} 残血重建 ${info.name}`)
				game.rebuild_piece = p
				game.state = "rp_rebuild_where"
			} else {
				log(`${faction_name(game.active)} 补足 ${info.name}`)
				Engine.utils.set_delete(game.reduced, p)
			}
		},
		done() {
			clear_undo()
			clear_replacement_points_for_active_faction()
			if (game.active === AP) {
				goto_replacement_faction(CP)
			} else {
				finish_replacement_phase()
			}
		}
	}

	states.rp_rebuild_where = {
		prompt(res) {
			let p = game.rebuild_piece
			if (!Number.isInteger(p) || !data.pieces[p]) {
				game.state = "rp_phase"
				return
			}
			res.who(p)
			res.prompt(`选择 ${piece_name(p)} 的重建位置`)
			for (let s of get_rebuild_spaces(p)) res.space(s)
		},
		piece() {},
		space(s) {
			s = Number(s)
			if (!Number.isInteger(s)) return
			let p = game.rebuild_piece
			if (!Number.isInteger(p) || !data.pieces[p]) {
				game.state = "rp_phase"
				return
			}
			let spaces = get_rebuild_spaces(p)
			if (!spaces.has(s)) return
			game.pieces[p] = s
			set_add(game.reduced, p)
			Engine.on_piece_rebuilt(game, p, s)
			delete game.rebuild_piece
			game.state = "rp_phase"
		},
	}

	return {
		start_attrition_phase,
		next_phase,
		start_phase,
		check_victory_conditions,
		start_siege_phase,
		start_revolution_phase,
		check_russian_revolution_step,
		continue_revolution_phase,
		start_turn,
		start_war_status_phase,
		start_replacement_phase,
		start_draw_cards_phase,
		final_victory_from_vp,
		calculate_protocol_victory_adjustments
	}
}
