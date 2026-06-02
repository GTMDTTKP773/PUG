"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants
	const { set_has } = Engine.utils
	const { map, game_utils } = Engine
	const combat = Engine.combat
	const { is_removed, is_eliminated, get_piece_effective_faction, piece_counts_as_nation_for_rule } = game_utils

	const STANDARD_CC_STATES = new Set(["play_cc_attacker", "play_cc_defender"])
	const SINAI_SPACES = new Set([
		"Romani",
		"Bir el Abd",
		"El Arish",
		"Rafa",
		"Magdhaba",
		"Bir Gifgafa",
		"Bir Hasana",
		"Nekhl",
		"Suez",
		"Aqaba"
	])
	const SHORE_SPACES = new Set([
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
		"Ismailia",
		"Suez",
		"Aqaba",
		"Jiddah",
		"Bahrain",
		"Abadan",
		"Fao",
		"Kuwait"
	])
	const MIDDLE_EAST_AREAS = new Set([
		"egypt",
		"sinai",
		"syria_palestine",
		"mesopotamia",
		"arabia",
		"arabistan",
		"persia",
		"anatolia"
	])
	const SURPRISE_AREAS = new Set(["mesopotamia", "syria_palestine", "sinai"])
	const ARMY_OF_ISLAM_AREAS = new Set(["caucasus", "russia", "azerbaijan", "persia"])

	function has_attack(game) {
		return !!game.attack
	}

	function get_active_faction(game) {
		return game.active
	}

	function get_space_pieces(game, s) {
		return map.get_pieces_in_space(game, s)
	}

	function get_attack_pieces(game) {
		return game.attack?.pieces || []
	}

	function is_anz_desert_corps(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "ANZ Desert Corps")
	}

	function is_state(game, state) {
		return game.state === state
	}

	function is_standard_cc_state(game) {
		return STANDARD_CC_STATES.has(game.state)
	}

	function can_play_in_standard_cc_window(game, faction = null) {
		if (!has_attack(game)) return false
		if (!is_standard_cc_state(game)) return false
		return faction === null ? true : get_active_faction(game) === faction
	}

	function can_play_in_window(game, state, faction = null) {
		if (!has_attack(game)) return false
		if (!is_state(game, state)) return false
		return faction === null ? true : get_active_faction(game) === faction
	}

	function attacker_has_piece(game, predicate) {
		return get_attack_pieces(game).some(predicate)
	}

	function is_sinai_space(name) {
		return SINAI_SPACES.has(name)
	}

	function is_shore_bombardment_space(s) {
		if (!(s > 0 && data.spaces[s])) return false
		return SHORE_SPACES.has(data.spaces[s].name) || map.is_gallipoli(s)
	}

	function is_middle_east_area(s) {
		let area = map.get_area(s)
		return MIDDLE_EAST_AREAS.has(area)
	}

	function has_nation_on_side_in_battle(game, nations, faction) {
		if (!has_attack(game)) return false
		let pieces = get_faction_side_pieces_in_battle(game, faction)
		return pieces.some((p) => {
			let p_faction = get_piece_effective_faction(game, p)
			return p_faction === faction && nations.some((nation) => piece_counts_as_nation_for_rule(game, p, nation))
		})
	}

	function get_faction_side_pieces_in_battle(game, faction) {
		if (!has_attack(game)) return []
		let attackers = game.attack.pieces || []
		let attacker_faction = game.attack.attacker
		if (attacker_faction === undefined || attacker_faction === null) {
			attacker_faction = attackers.length > 0 ? get_piece_effective_faction(game, attackers[0]) : null
		}
		if (attacker_faction !== null && faction === attacker_faction) {
			return attackers.filter((p) => get_piece_effective_faction(game, p) === faction)
		}
		return get_space_pieces(game, game.attack.space).filter((p) => get_piece_effective_faction(game, p) === faction)
	}

	function has_faction_on_side_in_battle(game, faction) {
		return get_faction_side_pieces_in_battle(game, faction).length > 0
	}

	function get_battle_piece_pool(game) {
		if (!has_attack(game)) return []
		let seen = new Set()
		let pool = []
		let groups = [
			game.attack.initial_attackers || [],
			game.attack.pieces || [],
			game.attack.initial_defenders || [],
			get_space_pieces(game, game.attack.space),
			game.attack.eliminated_defenders || [],
			game.attack.eliminated_attackers || []
		]
		for (let group of groups) {
			for (let p of group) {
				if (seen.has(p)) continue
				if (Array.isArray(game.retreated) && set_has(game.retreated, p)) continue
				seen.add(p)
				pool.push(p)
			}
		}
		return pool
	}

	function get_reserves_to_front_piece_pool(game) {
		if (!has_attack(game)) return []
		let tracked = game.attack?.reserves_to_front_damaged_pieces || []
		let seen = new Set()
		let pool = []
		for (let p of tracked) {
			if (seen.has(p)) continue
			if (!["tu", "tua"].some((nation) => piece_counts_as_nation_for_rule(game, p, nation))) continue
			if (get_reserves_to_front_piece_cost(game, p) <= 0) continue
			seen.add(p)
			pool.push(p)
		}
		return pool
	}

	function is_reserves_to_front_removed_exception(game, p) {
		let info = data.pieces[p]
		if (!info) return false
		return is_removed(game, p) && (info.symbol === "dot" || info.symbol === "triangle")
	}

	function was_reserves_to_front_initially_reduced(game, p) {
		return !!(game.attack && set_has(game.attack.reserves_to_front_initial_reduced_pieces, p))
	}

	function get_reserves_to_front_piece_cost(game, p) {
		let info = data.pieces[p]
		if (!info) return 0
		let is_elim_or_removed_exception = is_eliminated(game, p) || is_reserves_to_front_removed_exception(game, p)
		if (is_elim_or_removed_exception) {
			return info.piece_class === "LCU" ? 1 : 0.5
		}
		if (set_has(game.reduced, p) && !was_reserves_to_front_initially_reduced(game, p)) {
			return info.piece_class === "LCU" ? 1 : 0.5
		}
		return 0
	}

	function can_play_no_prisoners(game) {
		if (!can_play_in_window(game, "play_cc_attacker")) return false
		let has_ap_arab_attacker = attacker_has_piece(
			game,
			(p) => data.pieces[p].faction === AP && data.pieces[p].nation === "ar"
		)
		let has_cp_tribe_attacker = attacker_has_piece(
			game,
			(p) => data.pieces[p].faction === CP && data.pieces[p].type === "tribe"
		)
		return has_ap_arab_attacker || has_cp_tribe_attacker
	}

	function can_play_shore_bombardment(game) {
		if (!can_play_in_standard_cc_window(game)) return false
		if (is_shore_bombardment_space(game.attack.space)) return true

		for (let p of get_attack_pieces(game)) {
			let s = game.pieces[p]
			if (is_shore_bombardment_space(s)) return true
		}

		return false
	}

	function can_play_armenian_druzhiny(game) {
		if (!can_play_in_standard_cc_window(game)) return false
		let space = game.attack.space
		if (map.is_balkans(space)) return false
		return has_nation_on_side_in_battle(game, ["ru", "arm"], AP)
	}

	function can_play_pugnacity(game) {
		let in_allowed_window =
			can_play_in_window(game, "pre_weather_cc_attacker", AP) || can_play_in_standard_cc_window(game)
		if (!in_allowed_window) return false
		return has_nation_on_side_in_battle(game, ["in"], AP)
	}

	function can_play_gurkhas(game) {
		if (!can_play_in_standard_cc_window(game)) return false
		return has_nation_on_side_in_battle(game, ["br", "in"], AP)
	}

	function get_maude_attack_origin_spaces(game) {
		if (!has_attack(game)) return []
		let seen = new Set()
		let spaces = []
		for (let p of get_attack_pieces(game)) {
			let s = game.pieces[p]
			if (seen.has(s)) continue
			seen.add(s)
			spaces.push(s)
		}
		return spaces
	}

	function space_has_ap_nations(game, s, nations) {
		let pieces = get_space_pieces(game, s).filter((p) => get_piece_effective_faction(game, p) === AP)
		return nations.every((nation) => pieces.some((p) => piece_counts_as_nation_for_rule(game, p, nation)))
	}

	function can_play_maude(game) {
		if (!can_play_in_window(game, "pre_flank_cc_attacker", AP)) return false
		for (let s of get_maude_attack_origin_spaces(game)) {
			if (space_has_ap_nations(game, s, ["br", "in"])) return true
		}
		return false
	}

	function can_play_armored_cars(game) {
		if (!can_play_in_standard_cc_window(game)) return false
		let terrain = data.spaces[game.attack.space].terrain
		return terrain !== "mountain" && terrain !== "swamp"
	}

	function is_desert_or_swamp_battle(game) {
		if (!has_attack(game)) return false
		let is_ds = (s) => {
			let t = data.spaces[s].terrain
			return t === "desert" || t === "swamp"
		}
		if (is_ds(game.attack.space)) return true
		return game.attack.pieces.some((p) => is_ds(game.pieces[p]))
	}

	function can_play_sandstorms(game) {
		if (!can_play_in_window(game, "play_cc_defender", CP)) return false
		if (game.events && game.events["sandstorms_mosquitoes"] === game.turn) return false
		return is_desert_or_swamp_battle(game)
	}

	function can_play_surprise(game) {
		if (!has_attack(game)) return false
		if (game.events && game.events["royal_flying_corps_permanent"]) return false

		// Surprise is defender only
		let is_active_attacker = attacker_has_piece(game, (p) => get_piece_effective_faction(game, p) === game.active)
		if (is_active_attacker) return false

		if (game.active !== CP) return false

		let area = map.get_area(game.attack.space)
		return SURPRISE_AREAS.has(area)
	}

	function can_play_water_shortage(game) {
		if (!can_play_in_window(game, "post_roll_cc_defender", CP)) return false
		let area = map.get_area(game.attack.space)
		return SURPRISE_AREAS.has(area)
	}

	function can_play_confused_orders(game) {
		return can_play_in_window(game, "post_roll_cc_defender", CP)
	}

	function can_play_reserves_to_front(game) {
		if (!can_play_in_window(game, "post_battle_cc_cp", CP)) return false
		return get_reserves_to_front_piece_pool(game).length > 0
	}

	function can_play_war_weary_balkans(game) {
		if (!can_play_in_standard_cc_window(game, AP)) return false
		if (game.turn < 10) return false

		let count = 0
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s].nation === "sb" || data.spaces[s].nation === "bu") {
				if (map.is_controlled_by(game, s, AP)) {
					count++
				}
			}
		}
		if (count < 1) return false // Rule: AP must control at least 1 space in Serbia or Bulgaria

		let defenders = get_space_pieces(game, game.attack.space)
		return defenders.some((p) => data.pieces[p].nation === "bu")
	}

	function can_play_fliegerabteilung(game) {
		return !(game.events && game.events["royal_flying_corps_permanent"])
	}

	function can_play_royal_flying_corps(game) {
		if (!can_play_in_standard_cc_window(game, AP)) return false
		return has_nation_on_side_in_battle(game, ["br", "in", "anz"], AP)
	}

	function can_play_tanks(game) {
		if (!can_play_in_standard_cc_window(game, AP)) return false
		let s = game.attack.space
		let area = map.get_area(s)
		let name = data.spaces[s].name
		let terrain = data.spaces[s].terrain
		let is_sinai = is_sinai_space(name)
		let is_valid_area = area === "egypt" || area === "syria_palestine" || is_sinai
		let is_valid_terrain = !terrain || terrain === "clear" || terrain === "desert"
		let has_br = attacker_has_piece(game, (p) => data.pieces[p].nation === "br")
		return is_valid_area && is_valid_terrain && has_br
	}

	function can_play_massed_cavalry_charge(game) {
		if (!can_play_in_window(game, "pre_flank_cc_attacker", AP)) return false
		return attacker_has_piece(game, (p) => is_anz_desert_corps(p))
	}

	function can_play_push_to_the_breaking_point(game) {
		let in_allowed_window =
			can_play_in_window(game, "post_retreat_cc_ap", AP) || can_play_in_window(game, "post_advance_cc_ap", AP)
		if (!in_allowed_window) return false
		if (game.state === "post_advance_cc_ap" && !game.ptbp_post_retreat_declined) return false
		if (!(game.events && game.events["allenby"])) return false
		if (!game.attack || game.attack.attacker !== AP) return false
		let result = game.battle_result
		if (!result || !(result.defender_losses > result.attacker_losses)) return false
		if (!result.retreat_needed && !game.retreat_phase_done) return false
		return combat.get_ptbp_eligible_units(game, result.attackers).length > 0
	}

	function can_play_haversack_ruse(game) {
		let in_allowed_window =
			can_play_in_window(game, "pre_weather_cc_attacker", AP) || can_play_in_standard_cc_window(game, AP)
		if (!in_allowed_window) return false
		if (!(game.events && game.events["allenby"])) return false
		return attacker_has_piece(game, (p) => data.pieces[p].nation === "br" && map.is_lcu(p))
	}

	function can_play_march_and_countermarch(game) {
		if (!has_attack(game)) return false
		if (get_active_faction(game) !== AP) return false
		if (!(game.events && game.events["allenby"])) return false

		for (let p = 0; p < data.pieces.length; p++) {
			if (!data.pieces[p]) continue
			if (data.pieces[p].nation !== "br") continue
			if (set_has(game.attacked, p)) continue
			if (game_utils.is_not_on_map(game, p)) continue

			let dist = map.get_distance(game.pieces[p], game.attack.space)
			if (dist >= 1 && dist <= 2) return true
		}
		return false
	}

	function can_play_jihad_offensive(game) {
		if (!has_attack(game)) return false
		if (get_active_faction(game) !== CP) return false
		if ((game.jihad || 0) < 8) return false
		return attacker_has_piece(game, (p) => ["tu", "tua"].includes(data.pieces[p].nation))
	}

	function can_play_german_high_command(game) {
		return can_play_in_standard_cc_window(game, CP)
	}

	function can_play_save_tiflis(game) {
		if (!can_play_in_window(game, "retreat_choice_cc_cp")) return false
		if (game.battle_result && game.battle_result.retreat_needed && !game.retreat_phase_done) return false

		// Turkish LCU must have attacked in this battle. Use recorded battle
		// membership so an LCU replaced by an SCU after losses still satisfies this.
		let attacker_candidates = [
			...(game.attack?.initial_attackers || []),
			...(game.attack?.pieces || []),
			...(game.battle_result?.attackers || []),
			...(game.attack?.eliminated_attackers || [])
		]
		let has_tu_lcu_attacker = attacker_candidates.some((p) => {
			return (
				(piece_counts_as_nation_for_rule(game, p, "tu") || piece_counts_as_nation_for_rule(game, p, "tua")) &&
				game_utils.is_lcu(p)
			)
		})
		if (!has_tu_lcu_attacker) return false

		// Russian LCU must have defended in this battle. At this window the
		// ordinary combat retreat may already have moved it out of the battle space.
		let defender_candidates = [
			...(game.attack?.initial_defenders || []),
			...(game.battle_result?.defenders || []),
			...(game.attack?.eliminated_defenders || []),
			...get_space_pieces(game, game.attack.space).filter((p) => data.pieces[p].faction === AP)
		]
		let has_ru_lcu_defender = defender_candidates.some((p) => {
			return piece_counts_as_nation_for_rule(game, p, "ru") && game_utils.is_lcu(p)
		})
		if (!has_ru_lcu_defender) return false

		// Cannot be played after "Grand Duke Nikolai to Tiflis" (Card 23)
		if (game.events && game.events["grand_duke_to_tiflis"]) return false

		// At least one Russian unit in Azerbaijan, Persia, or Turkey
		let has_ru_in_affected_area = false
		for (let p = 0; p < game.pieces.length; p++) {
			let piece_data = data.pieces[p]
			if (piece_data.faction !== AP || piece_data.nation !== "ru") continue
			if (game_utils.is_not_on_map(game, p)) continue

			let space_id = game.pieces[p]
			let space_data = data.spaces[space_id]

			// Affected area: Azerbaijan, Persia, or Turkey (nation: tu)
			let is_in_area =
				space_data.area === "azerbaijan" || space_data.area === "persia" || space_data.nation === "tu"
			if (!is_in_area) continue

			has_ru_in_affected_area = true
			break
		}

		return has_ru_in_affected_area
	}

	function can_play_catastrophic_attack(game) {
		if (!has_attack(game)) return false
		if (get_active_faction(game) !== CP) return false
		if (game.attack.attacker !== AP || game.attack.defender !== CP) return false
		if (!game.battle_result || game.battle_result.attacker_losses <= game.battle_result.defender_losses) return false
		let is_active_attacker = attacker_has_piece(game, (p) => get_piece_effective_faction(game, p) === game.active)
		if (is_active_attacker) return false
		return combat.get_catastrophic_attack_stack_options(game).length > 0
	}

	function can_play_i_order_you_to_die(game) {
		if (!has_attack(game)) return false
		if (get_active_faction(game) !== CP) return false
		let defenders = get_space_pieces(game, game.attack.space).filter(
			(p) => game_utils.get_piece_effective_faction(game, p) === CP
		)
		if (defenders.length === 0) return false
		return defenders.every((p) => data.pieces[p].nation === "tu")
	}

	function can_play_pasha_1(game) {
		if (!has_attack(game)) return false
		return has_faction_on_side_in_battle(game, CP)
	}

	function can_play_czars_armories(game) {
		if (!can_play_in_window(game, "post_advance_cc_cp", CP)) return false
		if (!game.attack || game.attack.attacker !== CP) return false
		if (!game.events || !(game.events["russian_revolution"] >= 1)) return false
		return !!game.captured_russian_vp_in_advance
	}

	function is_czars_armories_trigger_space(s) {
		let space = data.spaces[s]
		return !!(space && space.vp && space.area === "russia")
	}

	function can_play_jafar_pasha(game) {
		if (!has_attack(game)) return false
		let is_active_attacker = attacker_has_piece(game, (p) => get_piece_effective_faction(game, p) === game.active)
		return !is_active_attacker
	}

	function is_army_of_islam_origin_space(s) {
		let info = data.spaces[s]
		if (!info) return false
		if (info.area === "persia") return map.is_neutral_persia_space(s)
		return ARMY_OF_ISLAM_AREAS.has(info.area)
	}

	function get_army_of_islam_space_options(game) {
		if (!has_attack(game)) return []
		let seen = new Set()
		let options = []
		for (let p of get_attack_pieces(game)) {
			if (!["tu", "tua"].includes(data.pieces[p].nation)) continue
			if (get_piece_effective_faction(game, p) !== CP) continue
			let s = game.pieces[p]
			if (seen.has(s)) continue
			if (!is_army_of_islam_origin_space(s)) continue
			seen.add(s)
			options.push(s)
		}
		return options
	}

	function can_play_army_of_islam(game) {
		if (!has_attack(game)) return false
		if (get_active_faction(game) !== CP) return false
		if (!(game.events && game.events["pan_turkism"])) return false
		if ((game.jihad || 0) < 6) return false
		if (!attacker_has_piece(game, (p) => get_piece_effective_faction(game, p) === CP)) return false
		return get_army_of_islam_space_options(game).length > 0
	}

	const STANDARD_CC_WINDOWS = STANDARD_CC_STATES
	const PRE_FLANK_ATTACKER_CC_WINDOWS = new Set(["pre_flank_cc_attacker"])
	const PRE_WEATHER_ATTACKER_CC_WINDOWS = new Set(["pre_weather_cc_attacker"])
	const PRE_WEATHER_BOTH_SIDES_CC_WINDOWS = new Set(["pre_weather_cc_attacker", "pre_weather_cc_defender"])

	function get_pre_weather_attacker_windows(game) {
		return combat.can_battle_trigger_severe_weather(game) ? PRE_WEATHER_ATTACKER_CC_WINDOWS : STANDARD_CC_WINDOWS
	}

	function get_pre_weather_both_sides_windows(game) {
		return combat.can_battle_trigger_severe_weather(game) ? PRE_WEATHER_BOTH_SIDES_CC_WINDOWS : STANDARD_CC_WINDOWS
	}

	// 战斗卡规格表：统一收敛窗口、判定、修正值与打出后的即时效果。
	// 这里的窗口需要严格战斗卡的战斗时序，天气前、掷骰后与撤退选择阶段。
	const COMBAT_CARD_SPECS = {
		[combat.CC_AP_NO_PRISONERS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_no_prisoners,
			dispose(ctx) {
				if (ctx.faction !== AP || ctx.from_retained) return false
				ctx.remove_card_from_hand()
				ctx.add_cc_retained(CP, "discard")
				ctx.log("不留活口：卡牌交给同盟国，正面朝上保留一次使用。")
				return true
			}
		},
		[combat.CC_AP_SHORE_BOMBARDMENT]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_shore_bombardment,
			modifiers: { drm: 1 }
		},
		[combat.CC_AP_ARMENIAN_DRUZHINY]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_armenian_druzhiny,
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["ru", "arm"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_PUGNACITY]: {
			windows: get_pre_weather_attacker_windows,
			can_play: can_play_pugnacity,
			on_play_after_disposition(game, ctx) {
				if (ctx.return_state === "pre_weather_cc_attacker") {
					game.events["pugnacity_tenacity_no_weather"] = game.turn
				}
			},
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["in"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_GURKHAS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_gurkhas,
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["br", "in"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_ARMORED_CARS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_armored_cars,
			modifiers: { drm: 1 }
		},
		[combat.CC_AP_MAUDE]: {
			windows: PRE_FLANK_ATTACKER_CC_WINDOWS,
			can_play: can_play_maude,
			on_play_after_disposition(game, ctx) {
				game.maude_cc = {
					return_state: ctx.return_state,
					prev_active: ctx.faction
				}
				game.state = "maude_place_indian_division"
				return "stop"
			}
		},
		[combat.CC_AP_ROYAL_FLYING_CORPS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_royal_flying_corps,
			on_play_after_disposition(game, ctx) {
				game.events["royal_flying_corps_permanent"] = true
				ctx.mark_effected()
			},
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["br", "in", "anz"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_TANKS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_tanks,
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["br"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_WAR_WEARY_BALKANS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_war_weary_balkans,
			on_play_after_disposition(game, ctx) {
				game.events["war_weary_balkans"] = game.turn
				ctx.mark_effected()
			},
			modifiers: {
				drm({ has_nation, opponent_pieces }) {
					return has_nation(opponent_pieces, ["bu"]) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_MASSED_CAVALRY_CHARGE]: {
			windows: PRE_FLANK_ATTACKER_CC_WINDOWS,
			can_play: can_play_massed_cavalry_charge,
			modifiers: {
				drm({ side_pieces }) {
					return side_pieces.some((p) => is_anz_desert_corps(p)) ? 1 : 0
				}
			}
		},
		[combat.CC_AP_PUSH_TO_THE_BREAKING_POINT]: {
			windows: new Set(["post_retreat_cc_ap", "post_advance_cc_ap"]),
			can_play: can_play_push_to_the_breaking_point,
			on_play_after_disposition(game, ctx) {
				game.events["push_to_breaking_point"] = game.turn
				game.ptbp_active = true
				game.ptbp_units = combat.get_ptbp_eligible_units(game, game.battle_result?.attackers || [])
				ctx.mark_effected()
			}
		},
		[combat.CC_AP_HAVERSACK_RUSE]: {
			windows: get_pre_weather_attacker_windows,
			can_play: can_play_haversack_ruse
		},
		[combat.CC_AP_MARCH_AND_COUNTERMARCH]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_march_and_countermarch,
			on_play_after_disposition(game, ctx) {
				if (!ctx.is_attacker) return
				game.march_and_countermarch = { remaining_moves: 2, piece: -1, space: game.attack.space }
				ctx.mark_effected()
				game.state = "march_and_countermarch_select"
				return "stop"
			},
			modifiers: { drm: 1 }
		},
		[combat.CC_CP_JIHAD_OFFENSIVE]: {
			windows: PRE_FLANK_ATTACKER_CC_WINDOWS,
			can_play: can_play_jihad_offensive,
			on_play_after_disposition(game, ctx) {
				game.events["jihad_offensive"] = game.turn
				ctx.mark_effected()
			},
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["tu", "tua"]) ? 1 : 0
				}
			}
		},
		[combat.CC_CP_RESERVES_TO_FRONT]: {
			windows: new Set(["post_battle_cc_cp"]),
			can_play: can_play_reserves_to_front,
			on_play(ctx) {
				ctx.dispose_standard()
				ctx.apply_war_status()
				ctx.game.rp_cp.tu += 2
				ctx.game.reserves_to_front_pieces = get_reserves_to_front_piece_pool(ctx.game)
				ctx.log(`${ctx.card_name()}：`)
				ctx.mark_effected()
				ctx.game.state = "event_reserves_to_front"
				return "stop"
			}
		},
		[combat.CC_CP_GERMAN_HIGH_COMMAND]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_german_high_command,
			modifiers: { drm: 1 }
		},
		[combat.CC_CP_SANDSTORMS]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_sandstorms,
			on_play_after_disposition(game, ctx) {
				game.events["sandstorms_mosquitoes"] = game.turn
				ctx.mark_effected()
			}
		},
		[combat.CC_CP_SAVE_TIFLIS]: {
			windows: new Set(["retreat_choice_cc_cp"]),
			can_play: can_play_save_tiflis,
			on_play_after_disposition(game, ctx) {
				game.events["save_tiflis"] = game.turn
				ctx.mark_effected()
			}
		},
		[combat.CC_CP_SURPRISE]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_surprise,
			on_play_after_disposition(game, ctx) {
				if (ctx.is_attacker) return
				game.surprise = { remaining: 2, space: game.attack.space }
				ctx.mark_effected()
				game.state = "surprise_sr"
				return "stop"
			},
			modifiers: { drm: 1 }
		},
		[combat.CC_CP_JAFAR_PASHA]: {
			windows: new Set([...STANDARD_CC_WINDOWS, "post_roll_cc_defender"]),
			can_play: can_play_jafar_pasha,
			on_play(ctx) {
				let after_use = ctx.from_retained ? ctx.take_retained_card() : null
				if (!ctx.from_retained) ctx.remove_card_from_hand()
				ctx.game.cc_jafar_pasha = {
					card: ctx.card,
					faction: ctx.faction,
					side: ctx.is_attacker ? "attacker" : "defender",
					return_state: ctx.return_state,
					after_use,
					post_roll: ctx.return_state === "post_roll_cc_defender",
					mode: ctx.return_state === "post_roll_cc_defender" ? "reroll" : "retreat"
				}
				ctx.game.state = "choose_jafar_pasha"
				return "stop"
			}
		},
		[combat.CC_CP_FLIEGERABTEILUNG]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_fliegerabteilung,
			on_play_after_disposition(game, ctx) {
				if (!game.events["fliegerabteilung"]) game.events["fliegerabteilung"] = game.turn
				ctx.mark_effected()
			},
			modifiers: { drm: 1 }
		},
		[combat.CC_CP_CATASTROPHIC_ATTACK]: {
			windows: new Set(["post_roll_cc_defender"]),
			can_play: can_play_catastrophic_attack
		},
		[combat.CC_CP_I_ORDER_YOU_TO_DIE]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_i_order_you_to_die,
			modifiers: {
				drm({ side_pieces }) {
					return side_pieces.length > 0 && side_pieces.every((p) => data.pieces[p].nation === "tu") ? 1 : 0
				}
			}
		},
		[combat.CC_CP_WATER_SHORTAGE]: {
			windows: new Set(["post_roll_cc_defender"]),
			can_play: can_play_water_shortage
		},
		[combat.CC_CP_PASHA_1]: {
			windows: get_pre_weather_both_sides_windows,
			can_play: can_play_pasha_1
		},
		[combat.CC_CP_CZARS_ARMORIES]: {
			windows: new Set(["post_advance_cc_cp"]),
			can_play: can_play_czars_armories,
			on_play_after_disposition(game, ctx) {
				game.czars_armories_rp = {
					bonus: 4,
					spent: 0,
					return_state: ctx.return_state
				}
				ctx.log(`${ctx.card_name()}：同盟国获得 4 点即时土耳其补员点数。`)
				ctx.mark_effected()
				game.state = "event_czars_armories"
				return "stop"
			}
		},
		[combat.CC_CP_CONFUSED_ORDERS]: {
			windows: new Set(["post_roll_cc_defender"]),
			can_play: can_play_confused_orders
		},
		[combat.CC_CP_ARMY_OF_ISLAM]: {
			windows: STANDARD_CC_WINDOWS,
			can_play: can_play_army_of_islam,
			on_play_after_disposition(game, ctx) {
				game.army_of_islam_cc = {
					return_state: ctx.return_state,
					prev_active: ctx.faction
				}
				game.state = "army_of_islam_place_hq"
				return "stop"
			},
			modifiers: {
				drm({ has_nation, side_pieces }) {
					return has_nation(side_pieces, ["tu", "tua"]) ? 1 : 0
				}
			}
		}
	}

	function get_combat_card_spec(card) {
		return COMBAT_CARD_SPECS[card] || null
	}

	function resolve_combat_card_windows(spec, game) {
		if (!spec || spec.windows === undefined || spec.windows === null) return null
		return typeof spec.windows === "function" ? spec.windows(game) : spec.windows
	}

	function is_combat_card_window_allowed(card, state, game) {
		let spec = get_combat_card_spec(card)
		let windows = resolve_combat_card_windows(spec, game)
		if (!windows) return true
		return windows.has(state)
	}

	function can_play_combat_card(game, card) {
		if (
			game?.action_state &&
			Array.isArray(game.action_state.used_ccs) &&
			set_has(game.action_state.used_ccs, card)
		) {
			return false
		}
		let spec = get_combat_card_spec(card)
		if (!spec) return true
		if (!is_combat_card_window_allowed(card, game.state, game)) return false
		return spec.can_play ? spec.can_play(game) : true
	}

	function get_combat_card_modifier_helpers(side, game, attackers, defenders) {
		const side_pieces = side === "attacker" ? attackers : defenders
		const opponent_pieces = side === "attacker" ? defenders : attackers
		return {
			side,
			game,
			attackers,
			defenders,
			side_pieces,
			opponent_pieces,
			has_nation(pieces, nations) {
				return pieces.some((p) => nations.some((nation) => piece_counts_as_nation_for_rule(game, p, nation)))
			}
		}
	}

	function resolve_modifier_value(value, side, game, attackers, defenders) {
		if (value === undefined || value === null) return 0
		if (typeof value === "function") {
			return value(get_combat_card_modifier_helpers(side, game, attackers, defenders))
		}
		return value
	}

	function get_combat_card_drm(card, side, game, attackers, defenders) {
		let spec = get_combat_card_spec(card)
		return resolve_modifier_value(spec?.modifiers?.drm, side, game, attackers, defenders)
	}

	function get_combat_card_penalty(card, side, game, attackers, defenders) {
		if (side !== "attacker") return 0
		let spec = get_combat_card_spec(card)
		return resolve_modifier_value(spec?.modifiers?.attacker_penalty, side, game, attackers, defenders)
	}

	Object.assign(exports, {
		get_battle_piece_pool,
		get_reserves_to_front_piece_pool,
		is_reserves_to_front_removed_exception,
		was_reserves_to_front_initially_reduced,
		get_reserves_to_front_piece_cost,
		is_middle_east_area,
		is_desert_or_swamp_battle,
		can_play_no_prisoners,
		can_play_shore_bombardment,
		can_play_armenian_druzhiny,
		can_play_pugnacity,
		can_play_gurkhas,
		can_play_maude,
		can_play_armored_cars,
		can_play_sandstorms,
		can_play_surprise,
		can_play_water_shortage,
		can_play_confused_orders,
		can_play_reserves_to_front,
		can_play_war_weary_balkans,
		can_play_fliegerabteilung,
		can_play_royal_flying_corps,
		can_play_tanks,
		can_play_massed_cavalry_charge,
		can_play_push_to_the_breaking_point,
		can_play_haversack_ruse,
		can_play_march_and_countermarch,
		can_play_jihad_offensive,
		can_play_german_high_command,
		can_play_save_tiflis,
		can_play_catastrophic_attack,
		can_play_i_order_you_to_die,
		can_play_pasha_1,
		can_play_czars_armories,
		is_czars_armories_trigger_space,
		can_play_jafar_pasha,
		can_play_army_of_islam,
		get_army_of_islam_space_options,
		get_combat_card_spec,
		is_combat_card_window_allowed,
		can_play_combat_card,
		get_combat_card_drm,
		get_combat_card_penalty
	})

	return exports
}
