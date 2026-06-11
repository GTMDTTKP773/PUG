"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const exports = {}

	const { set_has, set_add, set_delete, roll_die, normalize_faction_token } = Engine.utils
	const { AP, CP } = Engine.constants
	const MO_BALKANS = "balkans"
	const FORT_LOSS = "FORT"
	const {
		find_space,
		is_eliminated,
		is_not_on_map,
		piece_name,
		space_name,
		get_piece_cf,
		get_hq_drm,
		is_turn_event,
		get_piece_faction,
		get_piece_nation,
		is_regular,
		is_irregular,
		is_combat_unit,
		is_hq,
		is_heavy_arty,
		restore_piece,
		eliminate_piece,
		reduce_piece,
		is_lcu,
		get_piece_mf,
		get_piece_badge,
		get_piece_class,
		has_rcf,
		get_piece_lf,
		get_piece_effective_faction,
		is_piece_reduced,
		has_trench,
		get_trench_owner,
		get_piece_nation_groups_for_rule,
		get_replacement_options,
		piece_counts_as_nation_for_rule,
		pieces_count_as_any_nation_for_rule,
		can_piece_be_activated,
		get_season
	} = Engine.game_utils
	const {
		is_black_sea_port,
		can_use_strait,
		get_pieces_in_space,
		contains_enemy_pieces,
		other_faction,
		get_connected_spaces,
		get_piece_connected_spaces_for_rule,
		is_controlled_by,
		get_connection_type,
		get_connection_strait,
		get_crossing_type,
		is_tribe,
		is_region,
		is_island_base,
		get_area,
		is_balkans,
		is_caucasus,
		has_undestroyed_fort,
		get_fort_owner,
		can_besiege,
		can_trace_supply_to_source,
		get_gr_supply_sources,
		get_supply_sources_from_data,
		get_beachhead_spaces
	} = Engine.map
	const { can_enter_area, can_stack_end_in_space } = Engine.map

	function space_log_name(s) {
		if (!data.spaces[s]) return space_name(s)
		return `s${s}`
	}

	function piece_log_name(game, p, reduced = null) {
		if (!data.pieces[p]) return piece_name(p)
		if (reduced === null) reduced = is_piece_reduced(game, p)
		return reduced ? `p${p}` : `P${p}`
	}

	function is_army_of_islam_hq(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "TU Army Islam HQ")
	}

	function is_tribal_circle_space(s) {
		return !!(data.spaces[s] && data.spaces[s].tribal_activity_grid)
	}

	function is_tu_or_tua_unit(game, p) {
		return !!(
			data.pieces[p] &&
			!is_hq(p) &&
			is_combat_unit(p) &&
			(piece_counts_as_nation_for_rule(game, p, "tu") || piece_counts_as_nation_for_rule(game, p, "tua"))
		)
	}

	function has_army_of_islam_tu_tua_stack(game, pieces, hq) {
		return pieces.some((p) => p !== hq && is_tu_or_tua_unit(game, p))
	}

	function award_army_of_islam_tu_rp_bonus(game, log_fn, reason) {
		if (game.army_of_islam_tu_rp_bonus_awarded) return false
		if (!game.rp_cp) game.rp_cp = { ge: 0, ah: 0, tu: 0, a: 0, bu: 0 }
		game.rp_cp.tu = Number(game.rp_cp.tu || 0) + 1
		game.tu_rp_bonus = Number(game.tu_rp_bonus || 0) + 1
		game.army_of_islam_tu_rp_bonus_awarded = true
		if (log_fn) log_fn(`Army of Islam: ${reason}，土耳其奖励 RP +1。`)
		return true
	}

	function award_army_of_islam_combat_win_bonus(game, hq, side_pieces, target_space, log_fn) {
		if (!is_army_of_islam_hq(hq)) return false
		if (!is_tribal_circle_space(target_space)) return false
		if (!has_army_of_islam_tu_tua_stack(game, side_pieces, hq)) return false
		return award_army_of_islam_tu_rp_bonus(game, log_fn, "在部落地块赢得战斗")
	}

	function award_army_of_islam_advance_bonus(game, to_space, faction, log_fn) {
		if (faction !== CP) return false
		if (!is_tribal_circle_space(to_space)) return false
		let pieces = get_pieces_in_space(game, to_space).filter((p) => get_piece_effective_faction(game, p) === CP)
		let hq = pieces.find((p) => is_army_of_islam_hq(p))
		if (hq === undefined) return false
		if (!has_army_of_islam_tu_tua_stack(game, pieces, hq)) return false
		return award_army_of_islam_tu_rp_bonus(game, log_fn, "战后推进进入部落地块")
	}
	const { is_besieged, is_in_supply } = Engine.map
	const { bulls_eye_ru_attack_drm } = Engine.events

	const MOUNTAIN = "mountain"
	const SWAMP = "swamp"
	const FOREST = "forest"

	function eliminate_piece_in_combat(game, p, permanent = false, eliminate_fn = null) {
		if (eliminate_fn) {
			eliminate_fn(p, permanent)
			return
		}
		Engine.game_utils.eliminate_piece(game, p, null, permanent)
	}

	function infer_attack_factions(game) {
		let attacker = game.attack && game.attack.attacker
		if ((attacker === undefined || attacker === null) && game.attack && Array.isArray(game.attack.pieces)) {
			let attacker_piece = game.attack.pieces.find((p) => p !== null && p !== undefined)
			if (attacker_piece !== undefined) {
				attacker = get_piece_effective_faction(game, attacker_piece)
			}
		}
		if (attacker === undefined || attacker === null) attacker = game.active
		let defender = game.attack && game.attack.defender
		if (defender === undefined || defender === null) defender = other_faction(attacker)
		return { attacker, defender }
	}

	function clear_catastrophic_attack_state(game) {
		delete game.catastrophic_attack
	}

	function is_ru_black_sea_piece(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "RU Black Sea")
	}

	function is_anz_desert_corps(p) {
		return !!(data.pieces[p] && data.pieces[p].name === "ANZ Desert Corps")
	}

	function combat_card_played(game, side, card) {
		return !!(game.combat_cards && Array.isArray(game.combat_cards[side]) && game.combat_cards[side].includes(card))
	}

	function mark_combat_card_effected(game, card) {
		if (!game.combat_cards_effected) game.combat_cards_effected = []
		set_add(game.combat_cards_effected, card)
	}

	function is_post_battle_piece_available(game, p) {
		return !is_not_on_map(game, p) && !is_eliminated(game, p)
	}

	function get_region_defender_candidates(game, target_space, defender_faction) {
		if (!(target_space > 0)) return []
		return get_pieces_in_space(game, target_space).filter(
			(p) =>
				get_piece_effective_faction(game, p) === defender_faction &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				!(Array.isArray(game.retreated) && set_has(game.retreated, p))
		)
	}

	function get_region_defense_stack_block_reason(game, target_space, pieces, defender_faction = null) {
		if (!is_region(game, target_space)) return null
		let faction = defender_faction
		if (faction === null || faction === undefined) {
			faction = game.attack?.defender ?? other_faction(game.attack?.attacker ?? game.active)
		}
		let candidate_set = new Set(get_region_defender_candidates(game, target_space, faction))
		if (!Array.isArray(pieces) || pieces.length === 0) return "no defenders selected"
		for (let p of pieces) {
			if (!candidate_set.has(p)) return "selected unit is not an eligible region defender"
		}
		return Engine.map.get_region_activation_stack_block_reason(game, pieces)
	}

	function get_default_region_defense_stack(game, target_space, defender_faction, candidates) {
		let ordered = candidates.filter((p) => is_combat_unit(p)).concat(candidates.filter((p) => !is_combat_unit(p)))
		let selected = []
		for (let p of ordered) {
			let trial = selected.concat(p)
			if (!Engine.map.get_region_activation_stack_block_reason(game, trial)) selected = trial
		}
		return selected
	}

	function find_max_cf_valid_stack(game, candidates) {
		if (!Array.isArray(candidates) || candidates.length === 0) return []
		let best = []
		let best_cf = -1
		let n = candidates.length
		for (let mask = 1; mask < (1 << n); mask++) {
			let subset = []
			for (let i = 0; i < n; i++) {
				if (mask & (1 << i)) subset.push(candidates[i])
			}
			let reason = Engine.map.get_region_activation_stack_block_reason(game, subset)
			if (!reason) {
				let cf = subset.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
				if (cf > best_cf) {
					best_cf = cf
					best = subset.slice()
				}
			}
		}
		return best
	}

	function get_combat_defenders(game, target_space, defender_faction = null) {
		let faction = defender_faction
		if (faction === null || faction === undefined) {
			faction = game.attack?.defender ?? other_faction(game.attack?.attacker ?? game.active)
		}
		let candidates = get_region_defender_candidates(game, target_space, faction)
		if (!is_region(game, target_space)) return candidates

		let selected = Array.isArray(game.attack?.region_defenders)
			? game.attack.region_defenders.filter((p) => candidates.includes(p))
			: []
		if (selected.length > 0 && !get_region_defense_stack_block_reason(game, target_space, selected, faction)) {
			return selected
		}
		if (!Engine.map.get_region_activation_stack_block_reason(game, candidates)) return candidates
		return get_default_region_defense_stack(game, target_space, faction, candidates)
	}

	function get_live_attackers(game) {
		if (!game.attack || !Array.isArray(game.attack.pieces)) return []
		let attacker = game.attack.attacker
		if (attacker === undefined || attacker === null) attacker = infer_attack_factions(game).attacker
		return game.attack.pieces.filter(
			(p) =>
				data.pieces[p] &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				get_piece_effective_faction(game, p) === attacker
		)
	}

	function get_pre_battle_cancel_reason(game) {
		if (!game.attack) return "no attack is pending"
		if (is_black_sea_amphibious_invasion(game)) return null
		let target_space = game.attack.space
		if (!(target_space > 0 && data.spaces[target_space])) return "no target space is selected"
		let factions = infer_attack_factions(game)
		if (get_live_attackers(game).length === 0) return "no attacking units remain"
		let defenders = get_combat_defenders(game, target_space, factions.defender)
		let neutral_greek_target = has_attackable_neutral_greek_defenders(game, target_space, factions.attacker)
		if (
			defenders.length === 0 &&
			!neutral_greek_target &&
			!has_undestroyed_fort(game, target_space, factions.defender)
		) {
			return "no defending units or fort remain"
		}
		return null
	}

	function cancel_battle_before_resolution(game, log_fn, reason) {
		if (game.attack) {
			game.attack.cancelled_before_battle = true
			game.attack.pre_battle_cancel_reason = reason
		}
		if (log_fn) log_fn(`Battle cancelled: ${reason}.`)
		return false
	}

	function is_advance_support_piece(p) {
		return is_hq(p) || is_heavy_arty(p)
	}

	function is_full_strength_attack_combat_unit(game, p) {
		return is_combat_unit(p) && is_post_battle_piece_available(game, p) && !is_piece_reduced(game, p)
	}

	function can_full_strength_attacker_force_defender_retreat(game, p, target_space) {
		if (!is_full_strength_attack_combat_unit(game, p)) return false
		if (get_piece_mf(p) === 0) return false
		if (!can_enter_area(game, p, target_space)) return false
		return can_stack_end_in_space(game, target_space, [p])
	}

	function attacker_has_retreat_forcing_unit(game, result, target_space) {
		let attackers = game.attack && Array.isArray(game.attack.pieces) ? game.attack.pieces : result?.attackers || []
		return attackers.some((p) => can_full_strength_attacker_force_defender_retreat(game, p, target_space))
	}

	function can_piece_stage_black_sea_amphibious_invasion(game, p, faction) {
		if (faction !== AP) return false
		if (!is_ru_black_sea_piece(p)) return false
		if (!(game.events && game.events["black_sea_marines_active"])) return false
		if (game.events && game.events["black_sea_marines_used"]) return false
		let s = game.pieces[p]
		if (!(s > 0 && data.spaces[s])) return false
		if (!is_black_sea_port(game, s)) return false
		return !is_not_on_map(game, p)
	}

	function get_black_sea_amphibious_targets(game, p, faction) {
		if (!can_piece_stage_black_sea_amphibious_invasion(game, p, faction)) return []
		let targets = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!is_black_sea_port(game, s)) continue
			if (!is_controlled_by(game, s, CP)) continue
			if (get_pieces_in_space(game, s).length > 0) continue
			targets.push(s)
		}
		return targets
	}

	function is_black_sea_amphibious_invasion(game) {
		if (!game.attack || !Array.isArray(game.attack.pieces) || game.attack.pieces.length !== 1) return false
		let p = game.attack.pieces[0]
		if (p === undefined || p === null) return false
		return get_black_sea_amphibious_targets(game, p, game.attack.attacker || game.active).includes(
			game.attack.space
		)
	}

	function resolve_black_sea_amphibious_invasion(game, log_fn) {
		if (!is_black_sea_amphibious_invasion(game)) return false
		let p = game.attack.pieces[0]
		let source = game.pieces[p]
		let target = game.attack.space
		let has_intact_cp_fort = has_undestroyed_fort(game, target, CP)

		set_add(game.attacked, p)
		game.pieces[p] = target

		if (!game.events) game.events = {}
		game.events["black_sea_marines_used"] = true
		delete game.events["black_sea_marines_active"]
		delete game.events["black_sea_marines_fort"]

		if (has_intact_cp_fort) {
			game.events["black_sea_marines_fort"] = target
			if (log_fn) {
				log_fn(
					`Russian Amphibious Invasion: ${piece_log_name(game, p)} sails from ${space_log_name(source)} and besieges ${space_log_name(target)}.`
				)
				log_fn("RU Amphibious Assault marker flipped.")
			}
		} else {
			Engine.set_control(game, target, AP)
			if (log_fn) {
				log_fn(
					`Russian Amphibious Invasion: ${piece_log_name(game, p)} sails from ${space_log_name(source)} and occupies ${space_log_name(target)}.`
				)
				log_fn("RU Amphibious Assault marker flipped.")
			}
		}

		if (typeof Engine.sync_region_control === "function") {
			Engine.sync_region_control(game, source)
			Engine.sync_region_control(game, target)
		}
		if (typeof Engine.sync_neutral_vp_state === "function") {
			Engine.sync_neutral_vp_state(game, source)
			Engine.sync_neutral_vp_state(game, target)
		}
		if (typeof Engine.sync_jihad_city_state === "function") {
			Engine.sync_jihad_city_state(game, source)
			Engine.sync_jihad_city_state(game, target)
		}

		finish_attack(game)
		return true
	}

	function remember_attack_piece_origin(game, p) {
		if (!game.attack || p === undefined || p === null) return
		if (!game.attack.origin_by_piece || typeof game.attack.origin_by_piece !== "object") {
			game.attack.origin_by_piece = {}
		}
		if (!(p in game.attack.origin_by_piece) && game.pieces[p] > 0) {
			game.attack.origin_by_piece[p] = game.pieces[p]
		}
	}

	function get_attack_piece_origin(game, p) {
		if (game.attack && game.attack.origin_by_piece && game.attack.origin_by_piece[p] > 0) {
			return game.attack.origin_by_piece[p]
		}
		return game.pieces[p]
	}

	function get_loss_piece_space(game, p) {
		if (game.attack && game.attack.origin_by_piece && game.attack.origin_by_piece[p] > 0) {
			return game.attack.origin_by_piece[p]
		}
		return game.pieces[p]
	}

	function is_variable_loss_piece(game, p, reduced_override = null) {
		let info = data.pieces[p]
		if (!info) return false
		let reduced = reduced_override === null ? is_piece_reduced(game, p) : reduced_override
		let lf = reduced ? info.rlf : info.lf
		return lf === null || lf === "?"
	}

	function remember_variable_loss_other_unit_hit(game, loss_side, p) {
		if (!game.attack || is_variable_loss_piece(game, p)) return
		let space = get_loss_piece_space(game, p)
		if (!(space > 0)) return
		if (!game.attack.variable_loss_other_hit_spaces) {
			game.attack.variable_loss_other_hit_spaces = { attacker: [], defender: [] }
		}
		if (!Array.isArray(game.attack.variable_loss_other_hit_spaces[loss_side])) {
			game.attack.variable_loss_other_hit_spaces[loss_side] = []
		}
		set_add(game.attack.variable_loss_other_hit_spaces[loss_side], space)
	}

	function is_catastrophic_attack_empire_piece(game, p) {
		return (
			piece_counts_as_nation_for_rule(game, p, "br") ||
			piece_counts_as_nation_for_rule(game, p, "in") ||
			piece_counts_as_nation_for_rule(game, p, "anz")
		)
	}

	function get_catastrophic_attack_stack_options(game) {
		if (!game.attack || !Array.isArray(game.attack.pieces) || game.attack.pieces.length === 0) return []
		let stacks = new Map()
		for (let p of game.attack.pieces) {
			let origin = get_attack_piece_origin(game, p)
			if (!(origin > 0)) continue
			if (Engine.map.is_beachhead_space(game, origin)) continue
			if (is_region(game, origin)) continue
			if (!stacks.has(origin)) {
				stacks.set(origin, { origin, participants: [], survivors: [] })
			}
			let stack = stacks.get(origin)
			stack.participants.push(p)
			if (!is_not_on_map(game, p) && !is_eliminated(game, p) && game.pieces[p] === origin) {
				stack.survivors.push(p)
			}
		}

		let options = []
		for (let stack of stacks.values()) {
			let combat_units = stack.participants.filter((p) => is_combat_unit(p))
			if (combat_units.length === 0) continue
			if (!combat_units.some((p) => is_catastrophic_attack_empire_piece(game, p))) continue
			if (stack.survivors.length === 0) continue
			options.push(stack)
		}
		return options.sort((a, b) => a.origin - b.origin)
	}

	function has_catastrophic_attack_surviving_defenders(game) {
		if (!game.attack || !(game.attack.space > 0)) return false
		return get_pieces_in_space(game, game.attack.space).some(
			(p) =>
				get_piece_effective_faction(game, p) === CP &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				!(Array.isArray(game.retreated) && set_has(game.retreated, p))
		)
	}

	function apply_georgian_protectorate_attack_consequences(game) {
		if (game.georgian_protectorate_attacked) return
		if (!game.attack || !(game.attack.space > 0)) return
		let defenders = get_pieces_in_space(game, game.attack.space)
		if (!defenders.some((p) => data.pieces[p] && data.pieces[p].name === "GE GeoProtect")) return
		let factions = infer_attack_factions(game)
		if (factions.attacker !== CP) return

		for (let p = 0; p < game.pieces.length; p++) {
			if (!data.pieces[p] || data.pieces[p].nation !== "ge") continue
			if (data.pieces[p].name === "GE GeoProtect") continue
			if (is_not_on_map(game, p)) continue
			let s = game.pieces[p]
			if (!(s > 0) || !data.spaces[s] || data.spaces[s].area === "balkans") continue
			if (is_lcu(p)) {
				Engine.game_utils.eliminate_piece(game, p, null, true)
			} else {
				Engine.game_utils.remove_piece(game, p)
			}
		}

		game.no_ge_to_tu_rp_conversion = true
		game.georgian_protectorate_attacked = true
	}

	// Combat Card Constants (AP)
	const CC_AP_SHORE_BOMBARDMENT = 4
	const CC_AP_ARMENIAN_DRUZHINY = 5
	const CC_AP_PUGNACITY = 6
	const CC_AP_GURKHAS = 15
	const CC_AP_ARMORED_CARS = 20
	const CC_AP_NO_PRISONERS = 21
	const CC_AP_MAUDE = 28
	const CC_AP_ROYAL_FLYING_CORPS = 38
	const CC_AP_TANKS = 39
	const CC_AP_WAR_WEARY_BALKANS = 44
	const CC_AP_MASSED_CAVALRY_CHARGE = 49
	const CC_AP_PUSH_TO_THE_BREAKING_POINT = 50
	const CC_AP_HAVERSACK_RUSE = 51
	const CC_AP_MARCH_AND_COUNTERMARCH = 52

	// Combat Card Constants (CP)
	const CC_CP_JIHAD_OFFENSIVE = 102
	const CC_CP_RESERVES_TO_FRONT = 59
	const CC_CP_GERMAN_HIGH_COMMAND = 60
	const CC_CP_SANDSTORMS = 61
	const CC_CP_SAVE_TIFLIS = 66
	const CC_CP_SURPRISE = 74
	const CC_CP_JAFAR_PASHA = 75
	const CC_CP_FLIEGERABTEILUNG = 76
	const CC_CP_CATASTROPHIC_ATTACK = 82
	const CC_CP_I_ORDER_YOU_TO_DIE = 83
	const CC_CP_WATER_SHORTAGE = 93
	const CC_CP_PASHA_1 = 94
	const CC_CP_CZARS_ARMORIES = 97
	const CC_CP_CONFUSED_ORDERS = 98
	const CC_CP_ARMY_OF_ISLAM = 99

	Object.assign(exports, {
		CC_AP_SHORE_BOMBARDMENT,
		CC_AP_ARMENIAN_DRUZHINY,
		CC_AP_PUGNACITY,
		CC_AP_GURKHAS,
		CC_AP_ARMORED_CARS,
		CC_AP_NO_PRISONERS,
		CC_AP_MAUDE,
		CC_AP_ROYAL_FLYING_CORPS,
		CC_AP_TANKS,
		CC_AP_WAR_WEARY_BALKANS,
		CC_AP_MASSED_CAVALRY_CHARGE,
		CC_AP_PUSH_TO_THE_BREAKING_POINT,
		CC_AP_HAVERSACK_RUSE,
		CC_AP_MARCH_AND_COUNTERMARCH,
		CC_CP_JIHAD_OFFENSIVE,
		CC_CP_RESERVES_TO_FRONT,
		CC_CP_GERMAN_HIGH_COMMAND,
		CC_CP_SANDSTORMS,
		CC_CP_SAVE_TIFLIS,
		CC_CP_SURPRISE,
		CC_CP_JAFAR_PASHA,
		CC_CP_FLIEGERABTEILUNG,
		CC_CP_CATASTROPHIC_ATTACK,
		CC_CP_I_ORDER_YOU_TO_DIE,
		CC_CP_WATER_SHORTAGE,
		CC_CP_PASHA_1,
		CC_CP_CZARS_ARMORIES,
		CC_CP_CONFUSED_ORDERS,
		CC_CP_ARMY_OF_ISLAM
	})

	// Fire Table（PUG edition)
	const fire_table = {
		scu: [
			{ factors: 0, result: [0, 0, 0, 1, 1, 1], name: "0 (SCU)" },
			{ factors: 1, result: [0, 0, 1, 1, 1, 2], name: "1 (SCU)" },
			{ factors: 2, result: [0, 1, 1, 1, 2, 2], name: "2 (SCU)" },
			{ factors: 3, result: [1, 1, 1, 2, 2, 2], name: "3 (SCU)" },
			{ factors: 4, result: [1, 1, 2, 2, 2, 3], name: "4 (SCU)" },
			{ factors: 5, result: [1, 1, 2, 2, 3, 3], name: "5 (SCU)" },
			{ factors: 6, result: [1, 2, 2, 3, 3, 4], name: "6 (SCU)" },
			{ factors: 7, result: [2, 2, 3, 3, 4, 4], name: "7 (SCU)" },
			{ factors: 8, result: [2, 3, 3, 4, 4, 5], name: "8+ (SCU)" }
		],
		lcu: [
			{ factors: 1, result: [0, 1, 1, 1, 2, 2], name: "1 (LCU)" },
			{ factors: 2, result: [1, 1, 2, 2, 3, 3], name: "2 (LCU)" },
			{ factors: 3, result: [1, 2, 2, 3, 3, 4], name: "3 (LCU)" },
			{ factors: 4, result: [2, 2, 3, 3, 4, 4], name: "4 (LCU)" },
			{ factors: 5, result: [2, 3, 3, 4, 4, 5], name: "5 (LCU)" },
			{ factors: 6, result: [3, 3, 4, 4, 5, 5], name: "6 (LCU)" },
			{ factors: 9, result: [3, 4, 4, 5, 5, 7], name: "9 (LCU)" },
			{ factors: 12, result: [4, 4, 5, 5, 7, 7], name: "12 (LCU)" },
			{ factors: 15, result: [4, 5, 5, 7, 7, 7], name: "15 (LCU)" },
			{ factors: 16, result: [5, 5, 7, 7, 7, 7], name: "16+ (LCU)" }
		]
	}

	function get_fire_col(table, cf, shifts) {
		let col = 1
		while (col < table.length && table[col].factors <= cf) {
			col++
		}
		col--
		col += shifts
		col = Math.min(Math.max(col, 0), table.length - 1)
		return table[col]
	}

	function clear_turkish_retreat_state(game) {
		delete game.turkish_retreat_pending
		delete game.turkish_retreat_space
		delete game.turkish_retreat_mandatory
		delete game.turkish_retreat_optional
		delete game.turkish_retreat_attacker_retreated
	}

	function has_cp_retreat_to_cancel(result) {
		if (!result) return false
		if (result.retreat_needed && result.retreating_faction === CP) return true
		if (!result.turkish_retreat) return false
		return (
			(Array.isArray(result.turkish_retreat_units) && result.turkish_retreat_units.length > 0) ||
			(Array.isArray(result.turkish_retreat_optional_units) && result.turkish_retreat_optional_units.length > 0)
		)
	}

	function cancel_cp_retreat_result(game, result) {
		if (!result) return
		result.retreat_needed = false
		result.retreating_faction = null
		result.retreating_units = []
		result.retreat_can_cancel = false
		result.turkish_retreat = false
		result.turkish_retreat_units = []
		result.turkish_retreat_optional_units = []
		result.turkish_retreat_defender_retreats = false
		delete game.turkish_retreat
		clear_turkish_retreat_state(game)
	}

	function clear_save_tiflis_state(game) {
		delete game.save_tiflis_resolved
		delete game.save_tiflis_failed
		delete game.save_tiflis_vacated_battle_space
		delete game.save_tiflis_pieces
		delete game.save_tiflis_exempt_spaces
		if (game.events) delete game.events["save_tiflis"]
	}

	function ensure_combat_card_context(game) {
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		if (!game.combat_cards_effected) game.combat_cards_effected = []
		if (!game.combat_card_sources) game.combat_card_sources = {}
	}

	function reset_combat_card_context(game) {
		game.combat_cards = { attacker: [], defender: [] }
		game.combat_cards_effected = []
		game.combat_card_sources = {}
		delete game.cancelled_cc_dispositions
	}

	function clear_combat_card_context(game) {
		delete game.combat_cards
		delete game.combat_cards_effected
		delete game.combat_card_sources
		delete game.cancelled_cc_dispositions
	}

	function unmark_cc_used_this_action(game, card) {
		if (!game?.action_state || !Array.isArray(game.action_state.used_ccs)) return
		if (set_has(game.action_state.used_ccs, card)) {
			set_delete(game.action_state.used_ccs, card)
		}
	}

	function record_combat_card_source(game, card, source) {
		ensure_combat_card_context(game)
		game.combat_card_sources[card] = {
			card,
			faction: source.faction,
			side: source.side,
			from_retained: !!source.from_retained,
			after_use: source.after_use || (data.cards[card]?.remove ? "remove" : "discard")
		}
	}

	function get_card_zones(game, faction) {
		if (faction === AP) {
			if (!game.hand_ap) game.hand_ap = []
			if (!game.discard_ap) game.discard_ap = []
			if (!game.removed_ap) game.removed_ap = []
			ensure_cc_retained(game)
			return {
				hand: game.hand_ap,
				discard: game.discard_ap,
				removed: game.removed_ap,
				retained: game.cc_retained.ap,
				retained_after_use: game.cc_retained_after_use.ap
			}
		}
		if (!game.hand_cp) game.hand_cp = []
		if (!game.discard_cp) game.discard_cp = []
		if (!game.removed_cp) game.removed_cp = []
		ensure_cc_retained(game)
		return {
			hand: game.hand_cp,
			discard: game.discard_cp,
			removed: game.removed_cp,
			retained: game.cc_retained.cp,
			retained_after_use: game.cc_retained_after_use.cp
		}
	}

	function infer_combat_card_source(game, card) {
		let info = data.cards[card] || {}
		let faction = info.faction
		let zones = get_card_zones(game, faction)
		let should_remove = set_has(zones.removed, card) || info.remove
		let after_use = should_remove ? "remove" : "discard"
		return {
			card,
			faction,
			side: null,
			from_retained: false,
			after_use
		}
	}

	function get_combat_card_source(game, card) {
		let source = game.combat_card_sources && game.combat_card_sources[card]
		return source || infer_combat_card_source(game, card)
	}

	function played_combat_cards(game) {
		let played = []
		if (Array.isArray(game.combat_cards?.attacker)) played.push(...game.combat_cards.attacker)
		if (Array.isArray(game.combat_cards?.defender)) played.push(...game.combat_cards.defender)
		return played
	}

	function cancelled_cc_returns_to_retained(card, source) {
		return source.from_retained || card === CC_CP_JAFAR_PASHA || card === CC_AP_NO_PRISONERS
	}

	function return_cancelled_combat_card(game, entry) {
		let zones = get_card_zones(game, entry.faction)
		if (cancelled_cc_returns_to_retained(entry.card, entry)) {
			set_add(zones.retained, entry.card)
			if (entry.after_use) zones.retained_after_use[entry.card] = entry.after_use
			if (set_has(zones.discard, entry.card)) set_delete(zones.discard, entry.card)
			if (set_has(zones.removed, entry.card)) set_delete(zones.removed, entry.card)
			unmark_cc_used_this_action(game, entry.card)
			return true
		}
		if (set_has(zones.discard, entry.card)) set_delete(zones.discard, entry.card)
		if (set_has(zones.removed, entry.card)) set_delete(zones.removed, entry.card)
		set_add(zones.hand, entry.card)
		unmark_cc_used_this_action(game, entry.card)
		return true
	}

	function prepare_cancelled_combat_card_dispositions(game, result) {
		delete game.cancelled_cc_dispositions
		if (!game.combat_cards) return []

		const cancelling_cards = result.cancelling_cards || []
		const effected_cards = game.combat_cards_effected || []
		const pending = []

		for (let card of played_combat_cards(game)) {
			if (cancelling_cards.includes(card)) continue
			if (effected_cards.includes(card)) continue
			if (!data.cards[card]?.cc) continue

			let source = get_combat_card_source(game, card)
			let entry = {
				card,
				faction: source.faction,
				side: source.side,
				from_retained: !!source.from_retained,
				after_use: source.after_use || (data.cards[card]?.remove ? "remove" : "discard")
			}

			// Keep the existing retained-card exceptions until those rules are revisited explicitly.
			if (card === CC_CP_JAFAR_PASHA || card === CC_AP_NO_PRISONERS) {
				return_cancelled_combat_card(game, entry)
				continue
			}

			pending.push(entry)
		}

		if (pending.length > 0) game.cancelled_cc_dispositions = pending
		return pending
	}

	function has_cancelled_combat_card_dispositions(game) {
		return Array.isArray(game.cancelled_cc_dispositions) && game.cancelled_cc_dispositions.length > 0
	}

	function apply_cancelled_combat_card_disposition(game, card, choice) {
		if (!has_cancelled_combat_card_dispositions(game)) return false
		let index = game.cancelled_cc_dispositions.findIndex((entry) => entry.card === card)
		if (index < 0) return false
		let entry = game.cancelled_cc_dispositions[index]

		if (choice === "return") {
			return_cancelled_combat_card(game, entry)
		}

		game.cancelled_cc_dispositions.splice(index, 1)
		if (game.cancelled_cc_dispositions.length === 0) delete game.cancelled_cc_dispositions
		return true
	}

	function get_ptbp_eligible_units(game, attackers) {
		if (!attackers) return []
		return attackers.filter((p) =>
			!is_not_on_map(game, p) &&
			!is_piece_reduced(game, p) &&
			(piece_counts_as_nation_for_rule(game, p, "br") ||
				piece_counts_as_nation_for_rule(game, p, "in") ||
				piece_counts_as_nation_for_rule(game, p, "anz"))
		)
	}

	function check_offer_ptbp_extra_attack(game) {
		if (!game.ptbp_active || !Array.isArray(game.ptbp_units) || game.ptbp_units.length === 0) return false
		game.ptbp_units = game.ptbp_units.filter((p) => !is_not_on_map(game, p) && !is_piece_reduced(game, p))
		if (game.ptbp_units.length === 0) {
			delete game.ptbp_active
			delete game.ptbp_units
			return false
		}
		return true
	}

	function finish_attack(game) {
		if (check_offer_ptbp_extra_attack(game)) {
			let attacker = game.attack?.attacker
			if (attacker !== undefined && attacker !== null) game.active = attacker
			game.state = "ptbp_extra_attack_prompt"
			return
		}
		delete game.ptbp_active
		delete game.ptbp_units
		let attacker = game.attack?.attacker
		if (game.attack && !game.attack.keep_context) {
			clear_combat_card_context(game)
		}
		game.attack = null
		if (attacker !== undefined && attacker !== null) game.active = attacker
		game.state = "attack"
		delete game.battle_result
		delete game.battle_resolution_applied
		delete game.battle_resolution_side_effects_applied
		delete game.retreat_choice_cc_cp_done
		delete game.retreat_phase_done
		delete game.retreat_distance
		delete game.retreat_first_spaces
		delete game.confused_orders
		delete game.confused_orders_used
		delete game.turkish_retreat
		delete game.army_of_islam_tu_rp_bonus_awarded
		clear_turkish_retreat_state(game)
		clear_catastrophic_attack_state(game)
	}

	function enter_post_battle_cc_state(game, resume) {
		game.active = CP
		game.post_battle_cc_resume = resume
		game.state = "post_battle_cc_cp"
	}

	function enter_turkish_retreat_state(game) {
		game.active = CP
		game.state = "turkish_retreat"
		game.selected_piece = null
	}

	function get_post_battle_advance_resume(game, advance_space) {
		return {
			kind: "advance",
			advance_space,
			save_tiflis_failed: !!game.save_tiflis_failed
		}
	}

	function log_post_battle_advance(game, result, log_fn) {
		if (!log_fn) return
		if (game.save_tiflis_failed && result.no_advance) {
			log_fn("Russian units could not retreat towards Tiflis; full-strength TU/TUA units may advance.")
		} else if (game.save_tiflis_vacated_battle_space && result.no_advance) {
			log_fn("Russian units vacated the battle space due to Save Tiflis; full-strength TU/TUA units may advance.")
		}
	}

	function can_offer_post_battle_cc_window(game) {
		return !game.post_battle_cc_done && should_offer_post_battle_cc_window(game)
	}

	function handle_post_battle_advance(game, result, advance_space, log_fn) {
		if (can_offer_post_battle_cc_window(game)) {
			enter_post_battle_cc_state(game, get_post_battle_advance_resume(game, advance_space))
			return
		}
		if (begin_advance(game, result, advance_space)) {
			log_post_battle_advance(game, result, log_fn)
			return
		}
		finish_attack(game)
	}

	function handle_post_battle_finish_attack(game, log_fn, message) {
		if (can_offer_post_battle_cc_window(game)) {
			enter_post_battle_cc_state(game, { kind: "finish_attack" })
			return
		}
		if (log_fn) log_fn(message)
		finish_attack(game)
	}

	function enter_defender_retreat_state(game, defender_faction, can_cancel) {
		game.retreat_from = game.attack.space
		delete game.retreat_space
		game.active = defender_faction
		game.state = can_cancel ? "retreat_cancel" : "retreat"
	}

	// PUG恶劣天气
	function has_pugnacity_tenacity_weather_immunity(game, p) {
		if (!is_turn_event(game, "pugnacity_tenacity_no_weather")) return false
		return piece_counts_as_nation_for_rule(game, p, "in")
	}

	function has_pasha_1_weather_immunity(game, p) {
		if (!game.attack || !game.combat_cards) return false
		let cp_is_attacker = game.attack.attacker === CP || (game.attack.attacker === undefined && game.active === CP)
		if (!cp_is_attacker) return false
		if (!(game.combat_cards.attacker && game.combat_cards.attacker.includes(CC_CP_PASHA_1))) return false
		return get_piece_effective_faction(game, p) === CP
	}

	function is_russian_winter_offensive_active(game) {
		let event = game.events && game.events["russian_winter_offensive"]
		if (!event || typeof event !== "object") return false
		return event.turn === game.turn && event.action_round === game.action_round
	}

	function current_action_round_marker(game) {
		return { turn: game.turn, action_round: game.action_round }
	}

	function marker_matches_current_action_round(game, event) {
		if (event === true) return true
		if (typeof event === "number") return event === game.turn
		if (!event || typeof event !== "object") return false
		return event.turn === game.turn && event.action_round === game.action_round
	}

	function set_jihad_offensive_active(game) {
		if (!game.events) game.events = {}
		game.events["jihad_offensive"] = current_action_round_marker(game)
	}

	function is_jihad_offensive_active(game) {
		return marker_matches_current_action_round(game, game.events && game.events["jihad_offensive"])
	}

	function set_jihad_offensive_negate_used(game) {
		if (!game.events) game.events = {}
		game.events["jihad_offensive_used"] = current_action_round_marker(game)
	}

	function is_jihad_offensive_negate_used(game) {
		return marker_matches_current_action_round(game, game.events && game.events["jihad_offensive_used"])
	}

	function set_yildrim_offensive_active(game) {
		if (!game.events) game.events = {}
		game.events["yildrim_offensive"] = current_action_round_marker(game)
	}

	function is_yildrim_offensive_active(game) {
		return marker_matches_current_action_round(game, game.events && game.events["yildrim_offensive"])
	}

	function set_yildrim_offensive_trench_used(game) {
		if (!game.events) game.events = {}
		game.events["yildrim_trench_used"] = current_action_round_marker(game)
	}

	function is_yildrim_offensive_trench_used(game) {
		return marker_matches_current_action_round(game, game.events && game.events["yildrim_trench_used"])
	}

	function has_russian_winter_offensive_weather_immunity(game, p, season) {
		return (
			season === "Winter" &&
			is_russian_winter_offensive_active(game) &&
			piece_counts_as_nation_for_rule(game, p, "ru")
		)
	}

	function is_severe_weather_immune_attacker(game, p, season) {
		return (
			has_pugnacity_tenacity_weather_immunity(game, p) ||
			has_pasha_1_weather_immunity(game, p) ||
			has_russian_winter_offensive_weather_immunity(game, p, season)
		)
	}

	function attacker_has_haversack_ruse_terrain_ignore(game, attackers = null) {
		if (!combat_card_played(game, "attacker", CC_AP_HAVERSACK_RUSE)) return false
		let pieces = attackers || game.attack?.pieces || []
		return pieces.some((p) => is_lcu(p) && data.pieces[p]?.nation === "br")
	}

	function attacker_has_massed_cavalry_desert_ignore(game, attackers = null) {
		if (!combat_card_played(game, "attacker", CC_AP_MASSED_CAVALRY_CHARGE)) return false
		let pieces = attackers || game.attack?.pieces || []
		return pieces.some((p) => is_anz_desert_corps(p))
	}

	function attacker_has_maude_trench_ignore(game, target_space = null) {
		if (!combat_card_played(game, "attacker", CC_AP_MAUDE)) return false
		let s = target_space || game.attack?.space
		return !!(s > 0 && data.spaces[s] && !data.spaces[s].vp)
	}

	function has_jihad_offensive_attackers(game, attackers = null) {
		let pieces = attackers || game.attack?.pieces || []
		return pieces.some((p) => ["tu", "tua"].includes(data.pieces[p]?.nation))
	}

	function has_yildrim_offensive_attackers(game, attackers = null) {
		let pieces = attackers || game.attack?.pieces || []
		return pieces.some((p) => data.pieces[p]?.symbol === "Y")
	}

	function get_jihad_offensive_negate_targets(game, attackers = null, target_space = null) {
		let pieces = attackers || game.attack?.pieces || []
		let s = target_space || game.attack?.space
		if (!(s > 0) || pieces.length === 0) return { trench: false, river: false }
		let factions = infer_attack_factions(game)
		let defender_faction = factions.defender
		let defenders = get_combat_defenders(game, s, defender_faction)
		return {
			trench: get_defender_trench_level(game, s, defender_faction, defenders) > 0,
			river: are_all_attackers_crossing_water(game, pieces, s)
		}
	}

	function can_offer_jihad_offensive_negate(game, attackers = null, target_space = null) {
		if (normalize_faction_token(game.active) !== CP) return false
		if (!is_jihad_offensive_active(game)) return false
		if (is_jihad_offensive_negate_used(game)) return false
		if (!has_jihad_offensive_attackers(game, attackers)) return false
		let targets = get_jihad_offensive_negate_targets(game, attackers, target_space)
		return targets.trench || targets.river
	}

	function use_jihad_offensive_negate(game) {
		if (!game.attack) return false
		if (!can_offer_jihad_offensive_negate(game, game.attack.pieces, game.attack.space)) return false
		game.attack.jihad_offensive_negate = true
		set_jihad_offensive_negate_used(game)
		mark_combat_card_effected(game, CC_CP_JIHAD_OFFENSIVE)
		return true
	}

	function attacker_has_jihad_offensive_trench_ignore(game, attackers = null) {
		return (
			normalize_faction_token(game.active) === CP &&
			game.attack?.jihad_offensive_negate === true &&
			has_jihad_offensive_attackers(game, attackers)
		)
	}

	function can_offer_yildrim_offensive_trench_negate(game, attackers = null, target_space = null) {
		if (normalize_faction_token(game.active) !== CP) return false
		if (!is_yildrim_offensive_active(game)) return false
		if (is_yildrim_offensive_trench_used(game)) return false
		if (!has_yildrim_offensive_attackers(game, attackers)) return false
		let s = target_space || game.attack?.space
		if (!(s > 0)) return false
		let factions = infer_attack_factions(game)
		let defenders = get_combat_defenders(game, s, factions.defender)
		return get_defender_trench_level(game, s, factions.defender, defenders) > 0
	}

	function use_yildrim_offensive_trench_negate(game) {
		if (!game.attack) return false
		if (!can_offer_yildrim_offensive_trench_negate(game, game.attack.pieces, game.attack.space)) return false
		game.attack.yildrim_offensive_trench_negate = true
		set_yildrim_offensive_trench_used(game)
		return true
	}

	function attacker_has_yildrim_offensive_trench_ignore(game, attackers = null) {
		return (
			normalize_faction_token(game.active) === CP &&
			game.attack?.yildrim_offensive_trench_negate === true &&
			has_yildrim_offensive_attackers(game, attackers)
		)
	}

	function attacker_ignores_persistent_trench_effects(game, attackers = null, target_space = null) {
		return (
			attacker_has_massed_cavalry_desert_ignore(game, attackers) ||
			attacker_has_maude_trench_ignore(game, target_space)
		)
	}

	function attacker_ignores_trench_for_flank(game, attackers = null, target_space = null) {
		return (
			attacker_ignores_persistent_trench_effects(game, attackers, target_space) ||
			attacker_has_jihad_offensive_trench_ignore(game, attackers) ||
			attacker_has_yildrim_offensive_trench_ignore(game, attackers)
		)
	}

	function attacker_ignores_river_for_flank(game, attackers = null) {
		return attacker_has_jihad_offensive_trench_ignore(game, attackers)
	}

	function get_attacker_weather_terrain_ignore(game, attackers = null) {
		return {
			all: attacker_has_haversack_ruse_terrain_ignore(game, attackers),
			desert: attacker_has_massed_cavalry_desert_ignore(game, attackers)
		}
	}

	function is_severe_weather_space_for_attack(game, s, season, terrain_ignore = {}) {
		let info = data.spaces[s]
		if (!info) return false
		if (terrain_ignore.all) return false
		let terrain = info.terrain
		if (season === "Summer" && terrain === "desert") return !terrain_ignore.desert
		if (season === "Summer" && terrain === "swamp") return true
		if (season === "Winter" && terrain === "mountain") return get_area(s) !== "syria_palestine"
		return false
	}

	function can_battle_trigger_severe_weather(game, season = null) {
		if (!game.attack) return false

		const target_space = game.attack.space
		const current_season = season || get_season(game)
		const terrain_ignore = get_attacker_weather_terrain_ignore(game, game.attack.pieces)

		let regular_attackers = game.attack.pieces.filter(
			(p) => is_regular(p) && !is_severe_weather_immune_attacker(game, p, current_season)
		)
		if (regular_attackers.length === 0) return false

		for (let p of regular_attackers) {
			const s = game.pieces[p]
			if (
				is_severe_weather_space_for_attack(game, s, current_season, terrain_ignore) ||
				is_severe_weather_space_for_attack(game, target_space, current_season, terrain_ignore)
			) {
				return true
			}
		}

		return false
	}

	function apply_severe_weather(game, log, season, reduce_piece_fn) {
		const target_space = game.attack.space
		const round = game.action_round
		const terrain_ignore = get_attacker_weather_terrain_ignore(game, game.attack.pieces)

		let spaces_to_roll = new Set()

		// 只影响进攻方的正规部队
		let regular_attackers = game.attack.pieces.filter((p) => is_regular(p))
		let threatened_after_terrain = regular_attackers.filter((p) => {
			const s = game.pieces[p]
			return (
				is_severe_weather_space_for_attack(game, s, season, terrain_ignore) ||
				is_severe_weather_space_for_attack(game, target_space, season, terrain_ignore)
			)
		})

		if (terrain_ignore.all) {
			let haversack_prevented_weather = regular_attackers.some((p) => {
				if (is_severe_weather_immune_attacker(game, p, season)) return false
				const s = game.pieces[p]
				let threatened_without_ignore =
					is_severe_weather_space_for_attack(game, s, season, {}) ||
					is_severe_weather_space_for_attack(game, target_space, season, {})
				let threatened_with_ignore =
					is_severe_weather_space_for_attack(game, s, season, terrain_ignore) ||
					is_severe_weather_space_for_attack(game, target_space, season, terrain_ignore)
				return threatened_without_ignore && !threatened_with_ignore
			})
			if (haversack_prevented_weather) mark_combat_card_effected(game, CC_AP_HAVERSACK_RUSE)
		}

		if (terrain_ignore.desert && combat_card_played(game, "attacker", CC_AP_MASSED_CAVALRY_CHARGE)) {
			let cavalry_prevented_weather = regular_attackers.some((p) => {
				if (is_severe_weather_immune_attacker(game, p, season)) return false
				const s = game.pieces[p]
				let threatened_without_ignore =
					is_severe_weather_space_for_attack(game, s, season, {}) ||
					is_severe_weather_space_for_attack(game, target_space, season, {})
				let threatened_with_ignore =
					is_severe_weather_space_for_attack(game, s, season, terrain_ignore) ||
					is_severe_weather_space_for_attack(game, target_space, season, terrain_ignore)
				return threatened_without_ignore && !threatened_with_ignore
			})
			if (cavalry_prevented_weather) mark_combat_card_effected(game, CC_AP_MASSED_CAVALRY_CHARGE)
		}

		for (let p of threatened_after_terrain) {
			if (has_pugnacity_tenacity_weather_immunity(game, p)) {
				mark_combat_card_effected(game, CC_AP_PUGNACITY)
			}
			if (has_pasha_1_weather_immunity(game, p)) {
				mark_combat_card_effected(game, CC_CP_PASHA_1)
			}
		}

		let weather_checked_attackers = regular_attackers.filter(
			(p) => !is_severe_weather_immune_attacker(game, p, season)
		)
		if (regular_attackers.length === 0) return
		if (weather_checked_attackers.length === 0) return

		// 识别包含进攻方正规部队且满足地形/季节条件的地区
		for (let p of weather_checked_attackers) {
			const s = game.pieces[p]
			// 规则：从或者向恶劣地形进攻时触发
			if (
				is_severe_weather_space_for_attack(game, s, season, terrain_ignore) ||
				is_severe_weather_space_for_attack(game, target_space, season, terrain_ignore)
			) {
				spaces_to_roll.add(s)
			}
		}

		for (let s of spaces_to_roll) {
			const roll = roll_die(6, game)
			let status_msg = `恶劣天气 (${space_log_name(s)}): 掷骰=${roll}, 行动轮=${round}`
			if (roll >= round) {
				let reduced_units = []
				// 仅翻转该地区中参与进攻的正规部队
				for (let p of weather_checked_attackers) {
					if (game.pieces[p] === s && !is_piece_reduced(game, p)) {
						if (reduce_piece_fn) {
							reduce_piece_fn(p)
						} else {
							Engine.game_utils.reduce_piece(game, p)
						}
						reduced_units.push(format_piece_for_battle_log(game, p))
					}
				}
				if (reduced_units.length > 0) {
					log(`${status_msg} -> ${reduced_units.join(", ")} 被减损。`)
				} else {
					log(status_msg)
				}
			} else {
				log(status_msg)
			}
		}
	}

	/**
	 * 获取火力结算结果 (Losses)
	 * @param {string} table_type - 火力表类型 ("lcu" 或 "scu")
	 * @param {number} cf - 参与战斗的战斗力总值 (Combat Factor)
	 * @param {number} shifts - 火力列偏移量 (Column Shifts)
	 * @param {number} die - 最终掷骰值 (1-6)
	 * @returns {number} 返回导致的伤害量 (Losses)
	 */
	function get_fire_result(table_type, cf, shifts, die) {
		let table = fire_table[table_type.toLowerCase()]
		if (!table) return 0

		let column = get_fire_col(table, cf, shifts)

		let index = die - 1
		if (index < 0) index = 0
		if (index > 5) index = 5

		return column.result[index]
	}

	function die_color(faction) {
		return faction === AP ? "W" : "B"
	}

	function fmt_roll(roll, drm, faction) {
		let s = `${die_color(faction)}${roll}`
		if (drm !== undefined && drm !== 0) {
			let final = Math.max(1, Math.min(6, roll + drm))
			if (drm > 0) s += ` + ${drm} = ${final} `
			else s += ` - ${-drm} = ${final} `
		}
		return s
	}

	function log_detail(log_fn, msg) {
		if (log_fn && msg) {
			log_fn(`  ${msg}`)
		}
	}

	function format_piece_for_battle_log(game, p) {
		return piece_log_name(game, p)
	}

	function log_attack_overview(game, log_fn) {
		if (!log_fn || !game.attack || !(game.attack.space > 0)) return

		let factions = infer_attack_factions(game)
		let attacker_faction = factions.attacker
		let defender_faction = factions.defender
		let target_space = game.attack.space
		let attack_sources = Array.from(
			new Set(
				game.attack.pieces
					.filter((p) => !is_not_on_map(game, p))
					.map((p) => game.pieces[p])
					.filter((s) => s > 0)
			)
		)
		let defenders = get_combat_defenders(game, target_space, defender_faction)

		log_fn("")
		if (attacker_faction === AP) log_fn(`#ap 战斗：${space_log_name(target_space)}`)
		else log_fn(`#cp 战斗：${space_log_name(target_space)}`)

		log_fn("**进攻方**：")
		for (let source of attack_sources) {
			let attackers_in_space = game.attack.pieces.filter(
				(p) => !is_not_on_map(game, p) && game.pieces[p] === source
			)
			if (attackers_in_space.length > 0) {
				log_fn(
					`>> ${attackers_in_space.map((p) => format_piece_for_battle_log(game, p)).join(", ")} (${space_log_name(source)})`
				)
			}
		}

		log_fn("**防守方**：")
		if (has_undestroyed_fort(game, target_space, defender_faction)) {
			if (defenders.length > 0) {
				log_fn(`>> ${defenders.map((p) => format_piece_for_battle_log(game, p)).join(", ")}，要塞（${space_name(target_space)}）`)
			} else {
				log_fn(`>> 要塞（${space_name(target_space)}）`)
			}
			return
		}

		if (defenders.length > 0) {
			log_fn(`>> ${defenders.map((p) => format_piece_for_battle_log(game, p)).join(", ")}`)
		} else {
			log_fn(">> （空）")
		}
	}

	function resolve_flank_attempt(game, log_fn) {
		if (!game.attack || !game.attack.flank_attempt || game.attack.flank_resolved) return

		let factions = infer_attack_factions(game)
		let attacker_faction = factions.attacker
		let target_space = game.attack.space
		let attackers = game.attack.pieces.filter((p) => !is_not_on_map(game, p))
		let sorted_spaces = Array.from(new Set(attackers.map((p) => game.pieces[p]))).sort((a, b) => {
			let a_adds = adds_flanking_drm(game, a, attacker_faction, target_space) ? 1 : 0
			let b_adds = adds_flanking_drm(game, b, attacker_faction, target_space) ? 1 : 0
			return a_adds - b_adds
		})
		let flank_drm = 0

		sorted_spaces.shift()

		if (log_fn) log_fn("侧翼尝试：")
		for (let s of sorted_spaces) {
			if (adds_flanking_drm(game, s, attacker_faction, target_space)) {
				flank_drm += 1
				log_detail(log_fn, `+1 ${space_log_name(s)}`)
			}
		}

		let flank_roll = roll_die(6, game)
		game.attack.flank_resolved = true
		game.attack.flank_successful = flank_roll + flank_drm >= 4
		game.attack.flank_failed = !game.attack.flank_successful

		if (game.attack.flank_successful)
			log_detail(log_fn, `${fmt_roll(flank_roll, flank_drm, attacker_faction)} 成功`)
		else log_detail(log_fn, `${fmt_roll(flank_roll, flank_drm, attacker_faction)} 失败`)
	}

	function get_advance_pieces(game, result) {
		if (!result || !result.attackers) return []
		let attackers = result.attackers.filter((p) => !is_not_on_map(game, p))

		// Rule 66: Save Tiflis override
		let save_tiflis_override =
			(game.save_tiflis_failed || game.save_tiflis_vacated_battle_space) && result.no_advance

		let eligible = attackers.filter((p) => {
			if (!is_combat_unit(p)) return false
			if (get_piece_mf(p) === 0) return false

			if (save_tiflis_override) {
				// Only full-strength Turkish/Turkish-Arab units
				let is_tu_tua =
					piece_counts_as_nation_for_rule(game, p, "tu") || piece_counts_as_nation_for_rule(game, p, "tua")
				let is_full = !is_piece_reduced(game, p)
				return is_tu_tua && is_full
			}

			if (result.advance_with_reduced) return true
			return !is_piece_reduced(game, p)
		})

		if (eligible.length === 0) return []

		// Rule 12.9.1: HQs and Heavy Artillery may advance only when accompanied
		// by another Combat Unit eligible to advance from their stack.
		let attacker_faction = game.attack?.attacker ?? game.active
		let eligible_origins = new Set(eligible.map((p) => get_attack_piece_origin(game, p)).filter((s) => s > 0))
		let support_units = []
		for (let space of eligible_origins) {
			for (let p of get_pieces_in_space(game, space)) {
				if (!is_advance_support_piece(p)) continue
				if (!is_post_battle_piece_available(game, p)) continue
				if (get_piece_mf(p) === 0) continue
				if (get_piece_effective_faction(game, p) !== attacker_faction) continue
				support_units.push(p)
			}
		}

		for (let unit of support_units) {
			if (!eligible.includes(unit)) {
				eligible.push(unit)
			}
		}

		return eligible
	}

	function get_battle_advance_limit(game) {
		if (game.mcc_advance || game.ptbp_active || is_turn_event(game, "bulls_eye_directive")) {
			return 4
		}
		return 3
	}

	function begin_advance(game, result, advance_space) {
		let advance_pieces = get_advance_pieces(game, result)
		if (advance_pieces.length === 0) return false
		game.advance_pieces = advance_pieces
		game.advance_space = advance_space
		game.advance_count = 0
		game.advance_limit = get_battle_advance_limit(game)
		game.advance_trench_processed = false
		game.active = game.attack?.attacker || game.active
		game.state = "advance"
		return true
	}

	function is_advance_stop_terrain(game, s) {
		if (!data.spaces[s]) return false
		let terrain = data.spaces[s].terrain
		if (terrain === "forest" || terrain === "desert" || terrain === "swamp" || terrain === "mountain") return true
		return has_trench(game, s) > 0
	}

	function get_defender_trench_level(game, s, defender_faction, defenders = null) {
		let level = has_trench(game, s)
		if (level <= 0) return 0
		if (Array.isArray(defenders) && defenders.length === 0) return 0
		return get_trench_owner(game, s) === defender_faction ? level : 0
	}

	function can_cancel_defender_retreat(game, target_space, retreating_faction, retreating_units) {
		if (!(target_space > 0) || !Array.isArray(retreating_units) || retreating_units.length === 0) return false
		let target_terrain = get_combat_target_terrain(game, target_space, game.attack?.pieces)
		let desert_cancelled = attacker_has_massed_cavalry_desert_ignore(game, game.attack?.pieces)
		let trench = attacker_ignores_persistent_trench_effects(game, game.attack?.pieces, target_space)
			? 0
			: get_defender_trench_level(game, target_space, retreating_faction, retreating_units)
		let defensive_ground =
			target_terrain === FOREST ||
			(target_terrain === "desert" && !desert_cancelled) ||
			target_terrain === SWAMP ||
			target_terrain === MOUNTAIN ||
			trench > 0
		if (!defensive_ground) return false
		if (is_turn_event(game, "war_weary_balkans")) {
			if (retreating_units.some((p) => piece_counts_as_nation_for_rule(game, p, "bu"))) return false
		}
		return can_absorb_extra_step_to_cancel_retreat(game, retreating_units)
	}

	function can_absorb_extra_step_to_cancel_retreat(game, retreating_units) {
		if (count_steps(game, retreating_units) > 1) return true
		return retreating_units.some(
			(p) => is_lcu(p) && is_piece_reduced(game, p) && get_replacement_options(game, p).length > 0
		)
	}

	function is_cp_attacking_beachhead(game, target_space, attackers = null) {
		if (!(target_space > 0 && Engine.map.is_beachhead_space(game, target_space))) return false
		if (Array.isArray(attackers) && attackers.length > 0) {
			return attackers.every((p) => get_piece_effective_faction(game, p) === CP)
		}
		if (game.attack && game.attack.attacker) return game.attack.attacker === CP
		return normalize_faction_token(game.active) === CP
	}

	function get_combat_target_terrain(game, target_space, attackers = null) {
		if (is_cp_attacking_beachhead(game, target_space, attackers)) return "clear"
		return data.spaces[target_space]?.terrain
	}

	function is_water_crossing_attack_edge(game, from, target, attackers = null) {
		if (!(from > 0 && target > 0) || !data.spaces[from] || !data.spaces[target]) return false
		if (is_cp_attacking_beachhead(game, target, attackers)) return false
		let type = get_connection_type(from, target)
		return type === "river" || type === "strait" || !!get_crossing_type(from, target)
	}

	function are_all_attackers_crossing_water(game, attackers, target_space) {
		if (!Array.isArray(attackers) || attackers.length === 0) return false
		return attackers.every((p) => is_water_crossing_attack_edge(game, game.pieces[p], target_space, attackers))
	}

	function is_river_defense(game) {
		if (!game.attack || !game.attack.pieces || game.attack.pieces.length === 0) return false
		let target = game.attack.space
		return are_all_attackers_crossing_water(game, game.attack.pieces, target)
	}

	function can_declare_turkish_retreat(game) {
		let space = game.attack?.space
		if (space === undefined || space === null) return false
		if (!is_controlled_by(game, space, CP)) return false
		let defenders = get_pieces_in_space(game, space).filter(
			(p) =>
				get_piece_effective_faction(game, p) === CP &&
				!(Array.isArray(game.retreated) && set_has(game.retreated, p))
		)
		if (defenders.length === 0) return false
		let turkish_scus = defenders.filter(
			(p) => (get_piece_nation(p) === "tu" || get_piece_nation(p) === "tua") && get_piece_class(p) === "SCU"
		)
		if (turkish_scus.length === 0) return false
		let has_cp_lcu = defenders.some((p) => get_piece_class(p) === "LCU")
		if (has_cp_lcu) return false

		// Rule 12.8.1: Must have a valid retreat space (not enemy-occupied, no fortress)
		// Use the first TU SCU to check for connected spaces
		let p = turkish_scus[0]
		let adj = get_piece_connected_spaces_for_rule(game, space, p)
		let has_valid_space = adj.some((s) => {
			if (contains_enemy_pieces(game, s, CP)) return false
			return !has_undestroyed_fort(game, s, AP)
		})
		if (!has_valid_space) return false

		let terrain = data.spaces[space].terrain
		if (is_region(game, space)) return false

		// Rule 12.8.1: Defensive conditions
		// 1. Terrain: Mountain, Swamp, Desert, Forest
		let has_terrain_defense =
			terrain === "mountain" || terrain === "swamp" || terrain === "desert" || terrain === "forest"

		// 2. Trenches
		let trench_level = get_defender_trench_level(game, space, CP, defenders)
		let has_trench_defense = trench_level > 0

		// 3. Undestroyed Fort
		let has_fort_defense = has_undestroyed_fort(game, space, CP)

		// 4. River/Strait crossing (Defender is across from ALL attackers)
		let has_river_defense_val = is_river_defense(game)

		return has_terrain_defense || has_trench_defense || has_fort_defense || has_river_defense_val
	}

	function can_piece_attack_current_fort(game, p, faction) {
		let s = game.pieces[p]
		if (!(s > 0 && data.spaces[s])) return false
		let enemy = other_faction(faction)
		if (!has_undestroyed_fort(game, s, enemy)) return false
		if (!is_besieged(game, s)) return false
		if (!Engine.collapse.can_piece_attack_after_serbian_collapse(game, p, s)) return false
		return can_pieces_attack_target(game, [p], s)
	}

	function get_remaining_besieging_pieces(game, space, attacking_pieces) {
		let fort_owner = get_fort_owner(game, space)
		if (fort_owner !== AP && fort_owner !== CP) return []
		let besieging_faction = other_faction(fort_owner)
		return get_pieces_in_space(game, space).filter((p) => {
			if (set_has(attacking_pieces, p)) return false
			if (Array.isArray(game.attacked) && set_has(game.attacked, p)) return false
			if (is_not_on_map(game, p)) return false
			if (get_piece_effective_faction(game, p) !== besieging_faction) return false
			return !is_tribe(p)
		})
	}

	function apply_besieged_origin_attack_restrictions(game, pieces, targets) {
		let besieged_spaces = []
		for (let p of pieces) {
			let s = game.pieces[p]
			if (s > 0 && data.spaces[s] && is_besieged(game, s)) set_add(besieged_spaces, s)
		}
		if (besieged_spaces.length === 0) return targets

		if (besieged_spaces.length === 1 && pieces.every((p) => game.pieces[p] === besieged_spaces[0])) {
			let siege_space = besieged_spaces[0]
			let remaining = get_remaining_besieging_pieces(game, siege_space, pieces)
			if (can_besiege(game, siege_space, remaining)) {
				if (!set_has(targets, siege_space) && can_pieces_attack_target(game, pieces, siege_space)) {
					targets.push(siege_space)
				}
			} else {
				targets = can_pieces_attack_target(game, pieces, siege_space) ? [siege_space] : []
			}
		}

		for (let siege_space of besieged_spaces) {
			let remaining = get_remaining_besieging_pieces(game, siege_space, pieces)
			if (!can_besiege(game, siege_space, remaining)) {
				targets = targets.filter((target) => target === siege_space)
			}
		}

		return targets
	}

	function mark_attacked_space(game) {
		if (!game.attack || !(game.attack.space > 0)) return
		if (!Array.isArray(game.attacked_spaces)) game.attacked_spaces = []
		set_add(game.attacked_spaces, game.attack.space)
	}

	function clear_cancelled_cc_attacked_space(game, result) {
		if (!game.attack || !(game.attack.space > 0)) return
		if (!Array.isArray(game.attacked_spaces)) return
		// Cancel-type CCs must return cancelling_cards so the target space can be attacked again.
		if (!result || !Array.isArray(result.cancelling_cards) || result.cancelling_cards.length === 0) return
		set_delete(game.attacked_spaces, game.attack.space)
	}

	function can_lcu_attack_across_desert(game, p, from, to, faction, is_rail_connected_to_supply_fn) {
		if (!is_lcu(p) || is_anz_desert_corps(p)) return true
		let from_is_desert = data.spaces[from]?.terrain === "desert"
		let to_is_desert = data.spaces[to]?.terrain === "desert"
		if (!from_is_desert && !to_is_desert) return true

		let rail_connections =
			Engine.map && typeof Engine.map.get_rail_connections === "function"
				? Engine.map.get_rail_connections(game, from, faction)
				: []
		if (!rail_connections.includes(to)) return false

		let rail_supply =
			is_rail_connected_to_supply_fn ||
			((space, side) => Engine.map.is_rail_connected_to_supply(game, space, side))
		return !!(rail_supply(from, faction) && rail_supply(to, faction))
	}

	function get_attackable_spaces(game, pieces, faction, get_season_fn, is_rail_connected_to_supply_fn) {
		if (!pieces || pieces.length === 0) return []
		if (
			Engine.events &&
			typeof Engine.events.is_russian_revolution_ru_attack_blocked === "function" &&
			Engine.events.is_russian_revolution_ru_attack_blocked(game, pieces)
		)
			return []
		let enemy = other_faction(faction)
		let enemy_in_space = new Uint8Array(data.spaces.length)
		for (let q = 0; q < game.pieces.length; q++) {
			let sq = game.pieces[q]
			if (!(sq > 0 && data.spaces[sq])) continue
			if (get_piece_effective_faction(game, q) !== enemy) continue
			enemy_in_space[sq] = 1
		}

		let common_targets = null

		for (let p of pieces) {
			if (p === undefined || p === null) continue
			if (!can_piece_be_activated(p)) continue
			let s = game.pieces[p]
			let is_lcu_p = is_lcu(p)

			let adj = get_piece_connected_spaces_for_rule(game, s, p, "attack")
			let targets = []
			for (let t of get_black_sea_amphibious_targets(game, p, faction)) {
				if (can_pieces_attack_target(game, pieces, t)) targets.push(t)
			}
			if (can_piece_attack_current_fort(game, p, faction) && can_pieces_attack_target(game, pieces, s)) {
				targets.push(s)
			}
			if (
				is_region(game, s) &&
				enemy_in_space[s] &&
				!targets.includes(s) &&
				can_pieces_attack_target(game, pieces, s)
			) {
				targets.push(s)
			}
			for (let t of adj) {
				let neutral_greek_target = has_attackable_neutral_greek_defenders(game, t, faction)
				if (enemy_in_space[t] === 0 && !neutral_greek_target && !has_undestroyed_fort(game, t, enemy)) {
					continue
				}
				let defenders = get_pieces_in_space(game, t).filter(
					(q) => get_piece_effective_faction(game, q) === enemy
				)
				if (
					enemy_in_space[t] !== 0 &&
					defenders.length > 0 &&
					defenders.every((q) => Array.isArray(game.retreated) && set_has(game.retreated, q)) &&
					!has_undestroyed_fort(game, t, enemy)
				) {
					continue
				}
				if (is_lcu_p && !can_lcu_attack_across_desert(game, p, s, t, faction, is_rail_connected_to_supply_fn))
					continue
				if (!Engine.collapse.can_piece_attack_after_serbian_collapse(game, p, t)) continue
				if (can_pieces_attack_target(game, pieces, t)) targets.push(t)
			}

			let current_common_targets = common_targets
			if (current_common_targets === null) {
				common_targets = targets
				if (common_targets.length === 0) return []
			} else {
				let target_set = new Set(targets)
				common_targets = current_common_targets.filter((t) => target_set.has(t))
				if (common_targets.length === 0) return []
			}
		}
		return apply_besieged_origin_attack_restrictions(game, pieces, common_targets || [])
	}

	function can_activate_piece_in_space_to_attack(game, p, s, faction, get_season_fn, is_rail_connected_to_supply_fn) {
		if (!can_piece_be_activated(p)) return false
		let supply_status = Engine.map.get_supply_status(game, s, faction, p)
		if (supply_status === "OOS" || Engine.map.is_limited_supply_status(supply_status)) return false
		if (game.events && game.events["apis"] === game.turn && data.pieces[p].nation === "sb") return false
		if (Engine.map.is_afghanistan(s) && !(game.events && game.events["afghan_alliance"])) return false
		let enemy = other_faction(faction)
		let adj = get_piece_connected_spaces_for_rule(game, s, p, "attack")
		let enemy_in_space = new Uint8Array(data.spaces.length)
		for (let q = 0; q < game.pieces.length; q++) {
			let sq = game.pieces[q]
			if (!(sq > 0 && data.spaces[sq])) continue
			if (get_piece_effective_faction(game, q) !== enemy) continue
			enemy_in_space[sq] = 1
		}

		let is_lcu_p = is_lcu(p)
		let region_limit = data.pieces[p].region_limit
		if (get_black_sea_amphibious_targets(game, p, faction).length > 0) return true
		if (can_piece_attack_current_fort(game, p, faction)) return true
		if (is_region(game, s) && enemy_in_space[s] && can_pieces_attack_target(game, [p], s)) return true
		for (let t of adj) {
			if (region_limit === "B" && data.spaces[t].area !== "balkans") continue
			if (region_limit === "I" && !Engine.map.is_india(t)) continue
			if (
				region_limit === "P" &&
				!Engine.map.is_greater_persia(t) &&
				!Engine.map.is_india(t) &&
				!Engine.map.is_baluchistan(t)
			)
				continue
			let neutral_greek_target = has_attackable_neutral_greek_defenders(game, t, faction)
			if (enemy_in_space[t] === 0 && !neutral_greek_target && !has_undestroyed_fort(game, t, enemy)) continue
			let defenders = get_pieces_in_space(game, t).filter((q) => get_piece_effective_faction(game, q) === enemy)
			if (
				enemy_in_space[t] !== 0 &&
				defenders.length > 0 &&
				defenders.every((q) => Array.isArray(game.retreated) && set_has(game.retreated, q)) &&
				!has_undestroyed_fort(game, t, enemy)
			) {
				continue
			}
			if (is_lcu_p && !can_lcu_attack_across_desert(game, p, s, t, faction, is_rail_connected_to_supply_fn))
				continue
			if (!Engine.collapse.can_piece_attack_after_serbian_collapse(game, p, t)) continue
			if (!can_pieces_attack_target(game, [p], t)) continue
			return true
		}

		for (let conn of adj) {
			if (is_controlled_by(game, conn, other_faction(faction)) && is_besieged(game, conn)) return true
		}

		return false
	}

	function ensure_balkan_attack_targets(game) {
		if (!game.balkan_attack_targets) {
			game.balkan_attack_targets = { ap: -1, ap_mo: -1, cp: -1 }
			return
		}
		if (game.balkan_attack_targets.ap === undefined) game.balkan_attack_targets.ap = -1
		if (game.balkan_attack_targets.ap_mo === undefined) game.balkan_attack_targets.ap_mo = -1
		if (game.balkan_attack_targets.cp === undefined) game.balkan_attack_targets.cp = -1
	}

	function reset_balkan_attack_targets(game) {
		game.balkan_attack_targets = { ap: -1, ap_mo: -1, cp: -1 }
	}

	function is_greece_space(space_id) {
		let info = data.spaces[space_id]
		return !!info && info.nation === "gr"
	}

	function get_multinational_attack_group(game, p) {
		// Rules 17.1.8 and 17.2.1: tribes and irregulars have no nationality
		// for coordinated attacks, so they may accompany any friendly nation.
		if (is_tribe(p) || is_irregular(p)) return []
		return get_piece_nation_groups_for_rule(game, p)
	}

	function get_attack_origin_key(game, p) {
		let space = get_attack_piece_origin(game, p)
		if (!(space > 0)) return null
		let region_attacks = game.region_activations && game.region_activations.attack
		let stacks = region_attacks && Array.isArray(region_attacks[space]) ? region_attacks[space] : null
		if (stacks) {
			for (let index = 0; index < stacks.length; index++) {
				let stack = stacks[index]
				if (Array.isArray(stack.pieces) && set_has(stack.pieces, p)) {
					return `R:${space}:${index}`
				}
			}
		}
		return `S:${space}`
	}

	function is_attack_support_piece(p) {
		return is_hq(p) || is_heavy_arty(p)
	}

	function is_march_and_countermarch_attack_piece(game, p) {
		return Array.isArray(game.attack?.march_and_countermarch_pieces) && set_has(game.attack.march_and_countermarch_pieces, p)
	}

	function get_attack_support_block_reason(game, pieces) {
		if (!Array.isArray(pieces) || pieces.length === 0) return null
		for (let p of pieces) {
			if (!is_attack_support_piece(p)) continue
			if (is_march_and_countermarch_attack_piece(game, p)) continue
			let origin = get_attack_origin_key(game, p)
			let has_combat_companion = pieces.some(
				(q) =>
					q !== p &&
					is_combat_unit(q) &&
					get_attack_origin_key(game, q) === origin &&
					get_piece_effective_faction(game, q) === get_piece_effective_faction(game, p)
			)
			if (!has_combat_companion) {
				return "HQ/Heavy Artillery must attack with a friendly Combat Unit from the same stack"
			}
		}
		return null
	}

	function is_invalid_multinational_attack(game, attackers) {
		let all_groups = new Set()
		let pieces_by_origin = {}
		for (let p of attackers) {
			if (p === undefined || p === null) continue
			let groups = get_multinational_attack_group(game, p)
			let origin = get_attack_origin_key(game, p)
			if (!groups || groups.length === 0 || !origin) continue
			for (let group of groups) all_groups.add(group)
			if (!pieces_by_origin[origin]) pieces_by_origin[origin] = []
			pieces_by_origin[origin].push(p)
		}

		if (all_groups.size <= 1) return false

		for (let origin in pieces_by_origin) {
			let cover_sets = new Set([0])
			let group_ids = new Map()
			for (let p of pieces_by_origin[origin]) {
				let ids = get_multinational_attack_group(game, p).map((group) => {
					if (!group_ids.has(group)) group_ids.set(group, group_ids.size)
					return group_ids.get(group)
				})
				let next = new Set()
				for (let mask of cover_sets) {
					for (let id of ids) next.add(mask | (1 << id))
				}
				cover_sets = next
			}
			for (let mask of cover_sets) {
				let valid = true
				for (let p of attackers) {
					if (get_attack_origin_key(game, p) === origin) continue
					let groups = get_multinational_attack_group(game, p)
					if (!groups || groups.length === 0) continue
					if (!groups.some((group) => group_ids.has(group) && (mask & (1 << group_ids.get(group))) !== 0)) {
						valid = false
						break
					}
				}
				if (valid) return false
			}
		}

		return true
	}

	function draws_supply_solely_through_greek_port(game, p) {
		let info = data.pieces[p]
		if (!info || info.faction !== AP) return false
		let space = game.pieces[p]
		if (!(space > 0 && data.spaces[space])) return false

		let greek_sources = get_gr_supply_sources(game, false)
		if (greek_sources.length === 0) return false
		if (!can_trace_supply_to_source(game, space, AP, greek_sources)) return false

		let greek_source_set = new Set(greek_sources)
		let alternate_sources = get_supply_sources_from_data(game, AP, false)
			.concat(get_beachhead_spaces(game, AP))
			.filter((source) => !greek_source_set.has(source))

		if (alternate_sources.length === 0) return true
		return !can_trace_supply_to_source(game, space, AP, alternate_sources)
	}

	function has_ap_greek_port_only_attackers(game, pieces) {
		return pieces.some((p) => draws_supply_solely_through_greek_port(game, p))
	}

	function has_br_attacker(game, pieces) {
		return pieces_count_as_any_nation_for_rule(game, pieces, ["br", "in", "anz"])
	}

	function is_attack_in_or_into_greece(game, pieces, target) {
		if (is_greece_space(target)) return true
		return pieces.some((p) => is_greece_space(game.pieces[p]))
	}

	function apply_balkan_attack_target_restrictions(game, pieces, targets, faction) {
		ensure_balkan_attack_targets(game)

		if (faction === AP && !game.events["desperey"] && game.balkan_attack_targets.ap > 0) {
			if (has_ap_greek_port_only_attackers(game, pieces)) {
				if (
					game.mo_ap === MO_BALKANS &&
					has_br_attacker(game, pieces) &&
					game.balkan_attack_targets.ap_mo <= 0
				) {
					return targets
				}
				let allowed_targets = [game.balkan_attack_targets.ap]
				if (
					game.mo_ap === MO_BALKANS &&
					has_br_attacker(game, pieces) &&
					game.balkan_attack_targets.ap_mo > 0 &&
					game.balkan_attack_targets.ap_mo !== game.balkan_attack_targets.ap
				) {
					allowed_targets.push(game.balkan_attack_targets.ap_mo)
				}
				targets = targets.filter((target) => !is_balkans(target) || allowed_targets.includes(target))
			}
		}

		if (faction === CP && !game.events["robertson"] && game.balkan_attack_targets.cp > 0) {
			let locked_target = game.balkan_attack_targets.cp
			targets = targets.filter(
				(target) => !is_attack_in_or_into_greece(game, pieces, target) || target === locked_target
			)
		}

		return targets
	}

	function get_legal_attackable_spaces(game, pieces, faction, get_season_fn, is_rail_connected_to_supply_fn) {
		if (get_attack_support_block_reason(game, pieces)) return []
		let targets = get_attackable_spaces(game, pieces, faction, get_season_fn, is_rail_connected_to_supply_fn)
		if (targets.length === 0) return targets
		if (Array.isArray(game.attacked_spaces) && game.attacked_spaces.length > 0) {
			targets = targets.filter((s) => !set_has(game.attacked_spaces, s))
			if (targets.length === 0) return targets
		}
		if (is_invalid_multinational_attack(game, pieces)) return []
		// Liberate Suez: units from attack_egypt spaces can only target Egypt
		if (Array.isArray(game.activated?.attack_egypt)) {
			let all_from_egypt_activation = pieces.every((p) => {
				let from = game.pieces[p]
				return from > 0 && set_has(game.activated.attack_egypt, from)
			})
			if (all_from_egypt_activation) {
				targets = targets.filter((t) => Engine.map.is_egypt(t))
			}
		}
		if (game.active === CP && Array.isArray(game.liberate_suez_required_attack_spaces)) {
			let uses_liberate_suez_required_source = pieces.some((p) => {
				let from = game.pieces[p]
				return from > 0 && set_has(game.liberate_suez_required_attack_spaces, from)
			})
			if (uses_liberate_suez_required_source) {
				targets = targets.filter((t) => Engine.map.is_egypt(t))
			}
		}
		return apply_balkan_attack_target_restrictions(game, pieces, targets, faction)
	}

	function can_choose_attack_with_piece(game, p, s, faction, get_season_fn, is_rail_connected_to_supply_fn) {
		if (
			!can_activate_piece_in_space_to_attack(game, p, s, faction, get_season_fn, is_rail_connected_to_supply_fn)
		) {
			return false
		}
		return get_legal_attackable_spaces(game, [p], faction, get_season_fn, is_rail_connected_to_supply_fn).length > 0
	}

	function register_balkan_attack_target(game) {
		if (!game.attack || !Array.isArray(game.attack.pieces) || game.attack.space <= 0) return

		ensure_balkan_attack_targets(game)

		if (
			game.active === AP &&
			!game.events["desperey"] &&
			is_balkans(game.attack.space) &&
			has_ap_greek_port_only_attackers(game, game.attack.pieces)
		) {
			if (game.balkan_attack_targets.ap <= 0) {
				game.balkan_attack_targets.ap = game.attack.space
			} else if (
				game.attack.space !== game.balkan_attack_targets.ap &&
				game.mo_ap === MO_BALKANS &&
				has_br_attacker(game, game.attack.pieces) &&
				game.balkan_attack_targets.ap_mo <= 0
			) {
				game.balkan_attack_targets.ap_mo = game.attack.space
			}
		}

		if (
			game.active === CP &&
			!game.events["robertson"] &&
			game.balkan_attack_targets.cp <= 0 &&
			is_attack_in_or_into_greece(game, game.attack.pieces, game.attack.space)
		) {
			game.balkan_attack_targets.cp = game.attack.space
		}
	}

	function can_pieces_attack_target(game, pieces, target) {
		let defenders = get_pieces_in_space(game, target).filter((q) => !is_not_on_map(game, q))
		if (defenders.length === 0) return true
		let has_geoprotect = defenders.some((q) => data.pieces[q] && data.pieces[q].name === "GE GeoProtect")
		if (!has_geoprotect) return true
		return pieces.every(
			(p) => piece_counts_as_nation_for_rule(game, p, "tu") || piece_counts_as_nation_for_rule(game, p, "tua")
		)
	}

	function has_attackable_neutral_greek_defenders(game, target, faction) {
		return !!(
			Engine.neutral &&
			typeof Engine.neutral.should_trigger_greece_entry_on_attack === "function" &&
			Engine.neutral.should_trigger_greece_entry_on_attack(game, target, faction)
		)
	}

	/**
	 * 获取当前可分配损失的单位选项 (Rule 12.6.2 & 12.6.3)
	 *
	 * @param {object} game - 游戏状态
	 * @param {number[]} pieces - 待分配损失的单位 ID 列表
	 * @param {number} to_satisfy - 还需要分配的伤害量 (Losses)
	 * @param {number} fort_strength - 堡垒的 LF 值 (默认为 0)
	 * @returns {number[]} 返回当前可以合法选择以承受损失的单位 ID 列表
	 *
	 * 逻辑说明:
	 * 1. 伤害承受制 (Damage Consumption): 每个单位翻面/移除 (1 Step) 承受的伤害量等于其 LF (Loss Factor)。
	 * 2. 阈值检查: 如果单位的 LF 大于剩余待分配伤害 (to_satisfy)，该单位无法被选中 (12.6.2)。
	 * 3. 最大化原则: 必须优先选择能使剩余 to_satisfy 最小化的路径 (12.6.1)。
	 * 4. PUG 规则: game.attack.attacker_losses / defender_losses 记录总伤害，
	 *    game.attack.attacker_losses_absorbed / defender_losses_absorbed 记录已承受的 LF 总和。
	 */
	function get_loss_options(game, pieces, to_satisfy, fort_strength = 0, loss_side = null) {
		// Rule 337: "?" loss value units must be hit last in combat
		// Wait, if they must be hit last, we should just prioritize non-variable first.
		// However, for correct "absorb as much as possible" logic, we need to generate valid paths.

		function get_tree_unit_piece(unit) {
			if (typeof unit === "object") {
				if (unit.tree_reduced) return unit.piece
				if (unit.simulated) return unit.parent
			}
			return unit
		}

		function make_tree_reduced_unit(unit) {
			if (typeof unit === "object" && unit.tree_reduced) return unit
			if (typeof unit === "object" && unit.simulated) {
				return { simulated: true, tree_reduced: true, parent: unit.parent }
			}
			return { piece: unit, tree_reduced: true }
		}

		function get_tree_unit_lf(unit) {
			if (typeof unit === "object" && unit.simulated) return 1
			let piece = get_tree_unit_piece(unit)
			if (typeof unit === "object" && unit.tree_reduced) {
				return data.pieces[piece].rlf ?? data.pieces[piece].lf ?? 1
			}
			return get_piece_lf(game, piece)
		}

		function get_tree_unit_space(unit) {
			if (typeof unit === "object" && unit.simulated) return get_tree_unit_space(unit.parent)
			let piece = get_tree_unit_piece(unit)
			return get_loss_piece_space(game, piece)
		}

		function is_tree_variable_loss_unit(unit) {
			if (typeof unit === "object" && unit.simulated) return false
			let piece = get_tree_unit_piece(unit)
			let reduced_override = typeof unit === "object" && unit.tree_reduced ? true : null
			return is_variable_loss_piece(game, piece, reduced_override)
		}

		function variable_loss_space_is_unlocked(parent, unit) {
			let space = get_tree_unit_space(unit)
			if (!(space > 0)) return false
			let unlocked = game.attack?.variable_loss_other_hit_spaces?.[loss_side]
			if (Array.isArray(unlocked) && set_has(unlocked, space)) return true
			return parent.picked.some((picked) => {
				if (is_tree_variable_loss_unit(picked)) return false
				return get_tree_unit_space(picked) === space
			})
		}

		function variable_loss_unit_must_wait(parent, unit) {
			if (!is_tree_variable_loss_unit(unit)) return false
			if (variable_loss_space_is_unlocked(parent, unit)) return false
			let space = get_tree_unit_space(unit)
			if (!(space > 0)) return false
			let other_units = parent.full_strength.concat(parent.reduced)
			return other_units.some(
				(other) =>
					other !== unit &&
					get_tree_unit_space(other) === space &&
					!is_tree_variable_loss_unit(other) &&
					get_tree_unit_lf(other) <= parent.to_satisfy
			)
		}

		// Helper to get reserve SCUs for an LCU
		function get_available_replacements(unit) {
			let piece = get_tree_unit_piece(unit)
			if (get_piece_class(piece) !== "LCU") return { full: [], reduced: [] }
			let options = get_replacement_options(game, piece)
			let full = options.filter((p) => !is_piece_reduced(game, p))
			let reduced = options.filter((p) => is_piece_reduced(game, p))
			return { full, reduced }
		}

		let loss_tree = {
			picked: [],
			to_satisfy: to_satisfy,
			full_strength: pieces.filter((p) => !is_piece_reduced(game, p)),
			reduced: pieces.filter((p) => is_piece_reduced(game, p)),
			fort_strength: fort_strength,
			options: []
		}

		let valid_paths = []

		function build_loss_tree(parent, valid_paths) {
			for (let i = 0; i < parent.full_strength.length; i++) {
				let unit = parent.full_strength[i]
				let unit_lf = get_tree_unit_lf(unit)
				if (variable_loss_unit_must_wait(parent, unit)) continue
				if (unit_lf <= parent.to_satisfy) {
					let node = {
						picked: [...parent.picked, unit],
						to_satisfy: parent.to_satisfy - unit_lf,
						full_strength: parent.full_strength.filter((u) => u !== unit),
						reduced: [...parent.reduced, make_tree_reduced_unit(unit)],
						fort_strength: parent.fort_strength,
						options: []
					}
					parent.options.push(node)
				}
			}

			for (let i = 0; i < parent.reduced.length; i++) {
				let unit = parent.reduced[i]
				let unit_lf = get_tree_unit_lf(unit)
				if (variable_loss_unit_must_wait(parent, unit)) continue
				if (unit_lf <= parent.to_satisfy) {
					let node = {
						picked: [...parent.picked, unit],
						to_satisfy: parent.to_satisfy - unit_lf,
						full_strength: [...parent.full_strength],
						reduced: parent.reduced.filter((u) => u !== unit),
						fort_strength: parent.fort_strength,
						options: []
					}
					// Check replacement for LCU
					if (!(typeof unit === "object" && unit.simulated)) {
						if (get_piece_class(get_tree_unit_piece(unit)) === "LCU") {
							// Simplification: assume we can replace with an SCU with LF=1.
							// In PUG, almost all regular SCUs have LF=1.
							// We check if a replacement is available.
							let reps = get_available_replacements(unit)
							if (reps.full.length > 0) {
								node.full_strength.push(reps.full[0])
							} else if (reps.reduced.length > 0) {
								node.reduced.push(reps.reduced[0])
							} else {
								// Rule 12.6.5: If no appropriate SCU is in reserve, and it would be possible to fulfill more LN if it were,
								// losses must be taken as if such an SCU existed, resulting in permanent elimination.
								// So we simulate an SCU with LF=1 anyway to enforce this rule!
								node.full_strength.push({ simulated: true, parent: unit })
							}
						}
					}
					parent.options.push(node)
				}
			}

			if (
				parent.full_strength.length === 0 &&
				parent.reduced.length === 0 &&
				parent.fort_strength > 0 &&
				parent.to_satisfy >= parent.fort_strength
			) {
				let node = {
					picked: [...parent.picked, FORT_LOSS],
					to_satisfy: parent.to_satisfy - parent.fort_strength,
					full_strength: [],
					reduced: [],
					fort_strength: 0,
					options: []
				}
				parent.options.push(node)
			}

			for (let i = 0; i < parent.options.length; i++) {
				let current_best = valid_paths.length === 0 ? parent.to_satisfy : valid_paths[0].to_satisfy
				let option = parent.options[i]

				if (option.to_satisfy < current_best) {
					valid_paths.length = 0
				}

				if (option.to_satisfy <= current_best) {
					valid_paths.push(option)
				}

				build_loss_tree(option, valid_paths)
			}
		}

		build_loss_tree(loss_tree, valid_paths)

		let valid_units = []
		valid_paths.forEach((path) => {
			if (path.picked.length > 0) {
				let first_pick = get_tree_unit_piece(path.picked[0])
				if (!valid_units.includes(first_pick)) {
					valid_units.push(first_pick)
				}
			}
		})

		return valid_units
	}

	function fmt_attack_odds(game) {
		if (!game.attack || game.attack.space < 0 || !game.attack.pieces || game.attack.pieces.length === 0) return ""
		let attackers = game.attack.pieces
		let { defender: defender_faction } = infer_attack_factions(game)
		let defenders = get_combat_defenders(game, game.attack.space, defender_faction)
		let has_fort = has_undestroyed_fort(game, game.attack.space, defender_faction)
		if (defenders.length === 0 && !has_fort) return ""

		let attack_factors = attackers.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		let defense_factors = defenders.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		// 规则 15.1.3：未被摧毁的要塞 CF 始终加入防守火力；空要塞自身提供战力（15.1.5）。
		if (has_fort) {
			defense_factors += data.spaces[game.attack.space].fort || 0
		}

		let attacker_table = attackers.some(is_lcu) ? "lcu" : "scu"
		let defender_table = defenders.some(is_lcu) ? "lcu" : "scu"

		let attacker_shifts = 0
		let defender_shifts = 0

		let terrain = get_combat_target_terrain(game, game.attack.space, attackers)
		if (terrain === "mountain" || terrain === "swamp") attacker_shifts--

		let target_is_desert = terrain === "desert"
		let attacker_from_desert = attackers.some((p) => data.spaces[game.pieces[p]]?.terrain === "desert")
		if (target_is_desert || attacker_from_desert) attacker_shifts--

		let all_crossing = are_all_attackers_crossing_water(game, attackers, game.attack.space)
		if (all_crossing) attacker_shifts--

		let trench_level = get_defender_trench_level(game, game.attack.space, defender_faction, defenders)
		if (trench_level > 0) {
			attacker_shifts -= trench_level
			defender_shifts += 1
		}

		let attacker_col = find_fire_column(attacker_table, attack_factors, attacker_shifts)
		let defender_col = find_fire_column(defender_table, defense_factors, defender_shifts)
		if (!attacker_col || !defender_col) return ""

		let attacker_label = attacker_col.name
		let defender_label = defender_col.name

		return `${attacker_label} vs ${defender_label}`
	}

	function fmt_attack_odds_with_max(game) {
		if (!game.attack || game.attack.space < 0 || !game.attack.pieces || game.attack.pieces.length === 0) return ""
		let attackers = game.attack.pieces
		let { defender: defender_faction } = infer_attack_factions(game)
		let target_space = game.attack.space

		let attack_factors = attackers.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		let attacker_table = attackers.some(is_lcu) ? "lcu" : "scu"
		let attacker_shifts = 0

		let terrain = get_combat_target_terrain(game, target_space, attackers)
		if (terrain === "mountain" || terrain === "swamp") attacker_shifts--

		let target_is_desert = terrain === "desert"
		let attacker_from_desert = attackers.some((p) => data.spaces[game.pieces[p]]?.terrain === "desert")
		if (target_is_desert || attacker_from_desert) attacker_shifts--

		let all_crossing = are_all_attackers_crossing_water(game, attackers, target_space)
		if (all_crossing) attacker_shifts--

		let attacker_col = find_fire_column(attacker_table, attack_factors, attacker_shifts)
		if (!attacker_col) return ""
		let attacker_label = attacker_col.name

		let has_fort = has_undestroyed_fort(game, target_space, defender_faction)
		let candidates = get_region_defender_candidates(game, target_space, defender_faction)
		if (candidates.length === 0 && !has_fort) return ""
		let best_stack = find_max_cf_valid_stack(game, candidates)
		if (best_stack.length === 0 && !has_fort) return ""

		let defense_factors = best_stack.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		if (has_fort) {
			defense_factors += data.spaces[target_space].fort || 0
		}
		let defender_table = best_stack.some(is_lcu) ? "lcu" : "scu"
		let defender_shifts = 0
		let trench_level = get_defender_trench_level(game, target_space, defender_faction, best_stack)
		if (trench_level > 0) {
			defender_shifts += 1
		}
		let defender_col = find_fire_column(defender_table, defense_factors, defender_shifts)
		if (!defender_col) return ""
		let defender_label = defender_col.name

		return `${attacker_label} vs (MAX ${defender_label})`
	}

	function start_attack_sequence(game, log_fn) {
		delete game.cc_jafar_pasha_retreat
		let support_reason = get_attack_support_block_reason(game, game.attack?.pieces)
		if (support_reason) {
			if (log_fn) log_fn(`Cannot attack: ${support_reason}.`)
			if (game.attack) game.attack.space = -1
			return false
		}

		// Normalize legacy event payloads that still use attacker_faction.
		// The combat state machine uses attack.attacker/attack.defender as canonical fields.
		if (game.attack) {
			if ((game.attack.attacker === undefined || game.attack.attacker === null) && game.attack.attacker_faction) {
				game.attack.attacker = game.attack.attacker_faction
			}
			if (
				(game.attack.defender === undefined || game.attack.defender === null) &&
				game.attack.attacker !== undefined &&
				game.attack.attacker !== null
			) {
				game.attack.defender = other_faction(game.attack.attacker)
			}
			let factions = infer_attack_factions(game)
			game.attack.attacker = factions.attacker
			game.attack.defender = factions.defender
		}

		let pre_battle_cancel_reason = get_pre_battle_cancel_reason(game)
		if (pre_battle_cancel_reason) {
			return cancel_battle_before_resolution(game, log_fn, pre_battle_cancel_reason)
		}

		register_balkan_attack_target(game)

		// Rule 19.2.1: Attack on neutral Greek unit triggers Greek entry
		Engine.neutral.check_attack_trigger(game, game.attack.space, game.active)

		apply_georgian_protectorate_attack_consequences(game)

		game.turkish_retreat = undefined
		clear_turkish_retreat_state(game)
		clear_save_tiflis_state(game)
		delete game.post_roll_cc_done
		delete game.post_battle_cc_done
		delete game.captured_russian_vp_in_advance
		if (game.attack) {
			delete game.attack.flank_attempt
			delete game.attack.flank_resolved
			delete game.attack.flank_successful
			delete game.attack.flank_failed
			delete game.attack.severe_weather_checked
			delete game.attack.reserves_to_front_damaged_pieces
			delete game.attack.reserves_to_front_initial_reduced_pieces
			delete game.attack.reserves_to_front_rebuild_space_by_piece
			delete game.attack.variable_loss_other_hit_spaces
		}
		if (game.attack && game.attack.space > 0) {
			mark_attacked_space(game)
			if (Engine.events && typeof Engine.events.register_russian_revolution_ru_attack === "function") {
				Engine.events.register_russian_revolution_ru_attack(game, game.attack.pieces || [])
			}
			if (!game.attack.origin_by_piece || typeof game.attack.origin_by_piece !== "object") {
				game.attack.origin_by_piece = {}
			}
			for (let p of game.attack.pieces || []) {
				remember_attack_piece_origin(game, p)
			}
			let defender_faction = other_faction(game.active)
			game.attack.initial_attackers = (game.attack.pieces || []).slice()
			game.attack.initial_defenders = get_combat_defenders(game, game.attack.space, defender_faction)
			game.attack.reserves_to_front_initial_reduced_pieces = []
			for (let p of game.attack.pieces || []) {
				if (is_piece_reduced(game, p)) set_add(game.attack.reserves_to_front_initial_reduced_pieces, p)
			}
			for (let p of game.attack.initial_defenders || []) {
				if (is_piece_reduced(game, p)) set_add(game.attack.reserves_to_front_initial_reduced_pieces, p)
			}
		}

		// Keep combat context (cards played) for continued sequence (like Enver Goes East)
		if (game.attack && game.attack.keep_context) ensure_combat_card_context(game)
		else reset_combat_card_context(game)

		log_attack_overview(game, log_fn)
		if (Engine.mo && Engine.mo.check_mo_on_attack_declared) Engine.mo.check_mo_on_attack_declared(game, log_fn)
	}

	function is_battle_cancelled_by_cc(game) {
		if (game.combat_cards && game.combat_cards.defender && game.combat_cards.defender.includes(CC_CP_SANDSTORMS)) {
			if (Engine.combat_cards.is_desert_or_swamp_battle(game)) {
				return true
			}
		}
		if (game.cc_jafar_pasha_retreat) {
			return !jafar_pasha_retreat_continues_as_fort_attack(game)
		}
		return false
	}

	function jafar_pasha_retreat_continues_as_fort_attack(game) {
		if (!game.cc_jafar_pasha_retreat || !game.attack || !(game.attack.space > 0)) return false
		let factions = infer_attack_factions(game)
		return has_undestroyed_fort(game, game.attack.space, factions.defender)
	}

	function resolve_battle_sequence(game, context) {
		const { log: log_fn, check_mo_fulfillment: check_mo_fulfillment_fn } = context

		// Anchor attacker/defender once per battle sequence to avoid active-side drift
		// when this function is re-entered (e.g. Turkish retreat declaration round-trip).
		if (game.attack) {
			let factions = infer_attack_factions(game)
			game.attack.attacker = factions.attacker
			game.attack.defender = factions.defender
			game.active = factions.attacker
		} else {
			game.active = other_faction(game.active)
		}
		let result = resolve_battle(game, log_fn)

		delete game.battle_resolution_applied
		delete game.battle_resolution_side_effects_applied
		delete game.retreat_choice_cc_cp_done
		delete game.retreat_phase_done
		game.battle_result = result

		// Check Mandated Offensive Fulfillment
		if (check_mo_fulfillment_fn) {
			check_mo_fulfillment_fn(game, result, log_fn)
		}

		if (result.cancelled) {
			clear_cancelled_cc_attacked_space(game, result)
			prepare_cancelled_combat_card_dispositions(game, result)

			return "end"
		}

		// Interactive Loss Application
		game.attack.defender_losses = result.defender_losses
		game.attack.attacker_losses = result.attacker_losses
		game.attack.defender_losses_absorbed = 0
		game.attack.attacker_losses_absorbed = 0

		if (result.att_fire_first) {
			game.active = other_faction(game.active) // Defender takes losses first
			game.state = get_defender_losses_state(game)
			game.attack.second_fire = "defender"
		} else if (result.def_fire_first) {
			game.state = "apply_attacker_losses"
			game.attack.second_fire = "attacker"
		} else if (game.attack.defender_losses > 0) {
			game.active = other_faction(game.active) // Defender takes losses first
			game.state = get_defender_losses_state(game)
		} else if (game.attack.attacker_losses > 0) {
			game.state = "apply_attacker_losses"
		} else {
			return "end" // Signal to end battle sequence
		}
	}

	function ensure_cc_retained(game) {
		if (!game.cc_retained) game.cc_retained = { ap: [], cp: [] }
		if (!game.cc_retained_after_use) game.cc_retained_after_use = { ap: {}, cp: {} }
	}

	function get_defender_losses_state(game) {
		if (!game.attack || game.attack.space <= 0 || game.attack.defender_losses <= 0) return "apply_defender_losses"
		let defender_faction = game.attack.defender || other_faction(game.attack.attacker || game.active)
		let retreated_defenders = get_pieces_in_space(game, game.attack.space).filter(
			(p) =>
				get_piece_effective_faction(game, p) === defender_faction &&
				Array.isArray(game.retreated) &&
				set_has(game.retreated, p)
		)
		return retreated_defenders.length > 0 ? "eliminate_retreated_units" : "apply_defender_losses"
	}

	function retain_winning_combat_cards(game, result, log_fn) {
		if (!game.combat_cards || !result) return

		let attacker_faction = game.active
		let defender_faction = other_faction(attacker_faction)
		let attacker_won = result.defender_losses > result.attacker_losses
		let defender_won = result.attacker_losses > result.defender_losses
		if (!attacker_won && !defender_won) return

		let played = []
		if (Array.isArray(game.combat_cards.attacker)) played.push(...game.combat_cards.attacker)
		if (Array.isArray(game.combat_cards.defender)) played.push(...game.combat_cards.defender)
		if (played.length === 0) return

		ensure_cc_retained(game)

		for (let c of played) {
			let info = data.cards[c]
			if (!info || !info.cc) continue
			if (info.remove) continue
			if (c === CC_AP_NO_PRISONERS || c === CC_CP_JAFAR_PASHA || c === CC_CP_SANDSTORMS) continue

			let owner = info.faction
			let owner_won = (owner === attacker_faction && attacker_won) || (owner === defender_faction && defender_won)
			if (!owner_won) continue

			let retained = owner === AP ? game.cc_retained.ap : game.cc_retained.cp
			let retained_after_use = owner === AP ? game.cc_retained_after_use.ap : game.cc_retained_after_use.cp
			let discard = owner === AP ? game.discard_ap : game.discard_cp
			let removed = owner === AP ? game.removed_ap : game.removed_cp

			let already_retained = set_has(retained, c)
			set_add(retained, c)
			if (retained_after_use) delete retained_after_use[c]

			// Remove from discard/removed as it's now in retained area
			if (set_has(discard, c)) set_delete(discard, c)
			if (set_has(removed, c)) set_delete(removed, c)

			if (!already_retained && log_fn) {
				if (c === CC_CP_RESERVES_TO_FRONT) log_fn(`${Engine.card_name(c)}：保留`)
				else log_fn(`保留 CC: ${Engine.card_name(c)}`)
			}
		}
	}

	function ensure_fort_state(game) {
		if (!game.forts) game.forts = { destroyed: [], besieged: [], owner: {} }
		if (!Array.isArray(game.forts.destroyed)) game.forts.destroyed = []
		if (!Array.isArray(game.forts.besieged)) game.forts.besieged = []
		if (!game.forts.owner || typeof game.forts.owner !== "object" || Array.isArray(game.forts.owner)) {
			game.forts.owner = {}
		}
	}

	function ensure_broken_siege_state(game) {
		if (!Array.isArray(game.broken_sieges)) game.broken_sieges = []
	}

	function contains_piece_of_faction(game, space, faction) {
		return get_pieces_in_space(game, space).some((p) => get_piece_effective_faction(game, p) === faction)
	}

	function apply_fort_destruction(game, space, defender_faction, log_fn) {
		if (!has_undestroyed_fort(game, space, defender_faction)) return false
		let fort_strength = data.spaces[space]?.fort || 0
		if (!(fort_strength > 0)) return false

		let attacker_faction = other_faction(defender_faction)
		let was_besieged = Engine.map.is_besieged(game, space)
		let was_broken_siege = Array.isArray(game.broken_sieges) && set_has(game.broken_sieges, space)
		let has_attacker_in_space = contains_piece_of_faction(game, space, attacker_faction)

		ensure_fort_state(game)
		set_add(game.forts.destroyed, space)
		set_delete(game.forts.besieged, space)

		if (was_besieged) {
			Engine.set_control(game, space, attacker_faction)
			if (log_fn) log_fn(`Fort at ${space_log_name(space)} destroyed; besieging forces take control.`)
		} else if (was_broken_siege && has_attacker_in_space) {
			ensure_broken_siege_state(game)
			set_delete(game.broken_sieges, space)
			Engine.set_control(game, space, attacker_faction)
			if (log_fn) log_fn(`Fort at ${space_log_name(space)} destroyed; former besiegers take control.`)
		} else {
			if (log_fn) log_fn(`Fort at ${space_log_name(space)} destroyed.`)
		}

		return true
	}

	function update_siege_after_combat_losses(game, space) {
		if (!(space > 0) || !data.spaces[space]?.fort) return false
		ensure_fort_state(game)
		let fort_owner = Engine.map.get_fort_owner(game, space)
		if (fort_owner !== AP && fort_owner !== CP) {
			set_delete(game.forts.besieged, space)
			return false
		}
		if (!has_undestroyed_fort(game, space, fort_owner)) {
			set_delete(game.forts.besieged, space)
			return false
		}
		let besiegers = Engine.map.get_besieging_pieces(game, space, fort_owner)
		if (can_besiege(game, space, besiegers)) {
			set_add(game.forts.besieged, space)
			return true
		}
		set_delete(game.forts.besieged, space)
		return false
	}

	function mark_broken_siege_if_needed(game, space, fort_owner) {
		if (!(space > 0) || (fort_owner !== AP && fort_owner !== CP)) return false
		if (!has_undestroyed_fort(game, space, fort_owner)) return false
		if (Engine.map.is_besieged(game, space)) return false
		let besieging_faction = other_faction(fort_owner)
		if (!contains_piece_of_faction(game, space, besieging_faction)) return false
		ensure_broken_siege_state(game)
		set_add(game.broken_sieges, space)
		return true
	}

	// Rule 15.1.5/15.1.6: if defender losses still cover an empty fort, destroy it.
	function check_fort_destruction(game, log_fn, target_space, defender_faction) {
		if (has_undestroyed_fort(game, target_space, defender_faction)) {
			let fort_lf = data.spaces[target_space].fort || 0
			let remaining_losses = game.attack.defender_losses - game.attack.defender_losses_absorbed

			// Rule 15.1.5 & 15.1.6: Fort destroyed if no units AND remaining losses >= LF
			let defenders = get_combat_defenders(game, target_space, defender_faction)
			if (defenders.length === 0 && remaining_losses >= fort_lf) {
				if (apply_fort_destruction(game, target_space, defender_faction, log_fn)) {
					game.attack.defender_losses_absorbed += fort_lf
				}
			}
		}
	}

	function check_save_tiflis_event(game, log_fn) {
		if (game.events && game.events["save_tiflis"] === game.turn && !game.save_tiflis_resolved) {
			// Rule 66: Save Tiflis
			let ru_pieces = []
			let exempt_spaces = []
			for (let p = 0; p < game.pieces.length; p++) {
				if (
					get_piece_effective_faction(game, p) === AP &&
					get_piece_nation(p) === "ru" &&
					!is_not_on_map(game, p)
				) {
					let s = game.pieces[p]
					let s_data = data.spaces[s]
					if (!s_data) continue

					// Affected area: Azerbaijan, Persia, or Turkey (nation: tu)
					if (s_data.area === "azerbaijan" || s_data.area === "persia" || s_data.nation === "tu") {
						ru_pieces.push(p)
						let pieces_here = get_pieces_in_space(game, s)
						let with_yudenitch = pieces_here.some((p2) => data.pieces[p2].name === "RU Yudenitch HQ")
						let in_fort = has_undestroyed_fort(game, s, AP) || has_undestroyed_fort(game, s, CP)
						if (with_yudenitch || in_fort) set_add(exempt_spaces, s)
					}
				}
			}

			if (ru_pieces.length > 0) {
				game.save_tiflis_pieces = ru_pieces
				game.save_tiflis_exempt_spaces = exempt_spaces
				game.save_tiflis_failed = false
				game.save_tiflis_resolved = true
				game.active = AP
				game.state = "save_tiflis_retreat"
				if (log_fn) log_fn("CP plays Save Tiflis: Russian units in affected areas must retreat towards Tiflis.")
				return true
			} else {
				game.save_tiflis_resolved = true
				if (log_fn) log_fn("CP plays Save Tiflis, but no Russian units are affected.")
			}
		}
		return false
	}

	function check_confused_orders(game, result) {
		if (
			game.combat_cards &&
			game.combat_cards.defender &&
			game.combat_cards.defender.includes(CC_CP_CONFUSED_ORDERS) &&
			!game.confused_orders_used
		) {
			let can_cancel_retreat = has_cp_retreat_to_cancel(result)
			let defenders_now = get_combat_defenders(game, game.attack.space, other_faction(game.active))
			let can_cancel_advance = false
			if (result.retreat_needed || result.turkish_retreat) {
				if (!result.no_advance) can_cancel_advance = true
			} else if (
				defenders_now.length === 0 &&
				!result.no_advance
			) {
				can_cancel_advance = true
			}
			game.confused_orders = {
				space: game.attack.space,
				can_cancel_retreat,
				can_cancel_advance: can_cancel_advance,
				prev_active: game.active
			}
			game.active = CP
			game.state = "confused_orders"
			return true
		}
		return false
	}

	function should_offer_post_battle_cc_window(game) {
		if (!game.attack) return false
		let hand_cp = game.hand_cp || []
		let retained_cp = (game.cc_retained && game.cc_retained.cp) || []
		if (!hand_cp.includes(CC_CP_RESERVES_TO_FRONT) && !retained_cp.includes(CC_CP_RESERVES_TO_FRONT)) return false
		return Engine.combat_cards.get_reserves_to_front_piece_pool(game).length > 0
	}

	function apply_post_roll_battle_card_result_overrides(game, result, log_fn) {
		if (!game.attack || !result) return
		if (combat_card_played(game, "defender", CC_CP_WATER_SHORTAGE) && !result.water_shortage_applied) {
			let area = Engine.map.get_area(game.attack.space)
			if (area === "mesopotamia" || area === "syria_palestine" || area === "sinai") {
				result.no_advance = true
				cancel_cp_retreat_result(game, result)
				result.water_shortage_applied = true
				if (log_fn) {
					log_fn("Water Shortage: winning AP units may not advance; defeated CP units do not retreat.")
				}
			}
		}
		if (
			combat_card_played(game, "defender", CC_CP_CATASTROPHIC_ATTACK) &&
			!result.catastrophic_attack &&
			game.attack.defender === CP &&
			get_catastrophic_attack_stack_options(game).length > 0 &&
			has_catastrophic_attack_surviving_defenders(game) &&
			result.attacker_losses > result.defender_losses
		) {
			result.catastrophic_attack = true
			result.turkish_retreat = false
			result.turkish_retreat_units = []
			result.turkish_retreat_optional_units = []
			result.turkish_retreat_defender_retreats = false
			result.advance_with_reduced = true
			clear_turkish_retreat_state(game)
		}
	}

	function check_advance_siege_requirement(game, result, defender_faction, log_fn) {
		if (has_undestroyed_fort(game, game.attack.space, defender_faction)) {
			let attackers_ready = game.attack.pieces.filter(
				(p) =>
					is_post_battle_piece_available(game, p) &&
					(!is_piece_reduced(game, p) || result.advance_with_reduced)
			)
			if (!can_besiege(game, game.attack.space, attackers_ready)) {
				result.no_advance = true
				if (log_fn) log_fn("Attacker cannot advance: insufficient forces to besiege the fort.")
			}
		}
	}

	function attackers_already_in_target_space(game) {
		if (!game.attack || !Array.isArray(game.attack.pieces) || !(game.attack.space > 0)) return false
		let attackers = game.attack.pieces.filter((p) => !is_not_on_map(game, p))
		if (attackers.length === 0) return false
		return attackers.every((p) => game.pieces[p] === game.attack.space)
	}

	function end_battle_sequence(game, log_fn) {
		if (!game.attack) {
			game.state = "attack"
			return
		}
		let result = game.battle_result
		if (!result || result.cancelled) {
			finish_attack(game)
			return
		}
		let target_space = game.attack.space

		// POG 12.4.6: Fort Destruction
		let factions = infer_attack_factions(game)
		let attacker_faction = factions.attacker
		let defender_faction = factions.defender
		game.attack.attacker = attacker_faction
		game.attack.defender = defender_faction
		if (!game.battle_resolution_applied) {
			if (!game.battle_resolution_side_effects_applied) {
				check_fort_destruction(game, log_fn, target_space, defender_faction)

				retain_winning_combat_cards(game, result, log_fn)

				// Rule 16.2.2: HQ Bonus or Penalty
				if (result.used_hqs) {
					let winner = null
					if (result.defender_losses > result.attacker_losses) winner = game.active
					else if (result.attacker_losses > result.defender_losses) winner = other_faction(game.active)

					if (winner) {
						// Attacker HQs
						for (let p of result.used_hqs.attacker) {
							if (winner === game.active) {
								if (is_piece_reduced(game, p)) {
									log_fn(
										`Rule 16.2.2: Winning HQ ${piece_log_name(game, p)} flipped to full strength.`
									)
									restore_piece(game, p)
								}
								if (data.pieces[p].name.includes("Army of Islam")) {
									award_army_of_islam_combat_win_bonus(game, p, result.attackers, target_space, log_fn)
								}
							} else {
								log_fn(`Rule 16.2.2: Losing HQ ${piece_log_name(game, p)} loses 1 step.`)
								if (is_piece_reduced(game, p)) {
									eliminate_piece(game, p, log_fn, true)
								} else {
									reduce_piece(game, p)
								}
							}
						}
						for (let p of result.used_hqs.defender) {
							if (winner === other_faction(game.active)) {
								if (is_piece_reduced(game, p)) {
									log_fn(
										`Rule 16.2.2: Winning HQ ${piece_log_name(game, p)} flipped to full strength.`
									)
									restore_piece(game, p)
								}
								if (data.pieces[p].name.includes("Army of Islam")) {
									award_army_of_islam_combat_win_bonus(game, p, result.defenders, target_space, log_fn)
								}
							} else {
								log_fn(`Rule 16.2.2: Losing HQ ${piece_log_name(game, p)} loses 1 step.`)
								if (is_piece_reduced(game, p)) {
									eliminate_piece(game, p, log_fn, true)
								} else {
									reduce_piece(game, p)
								}
							}
						}
					}
				}

				if (result.used_arty && result.used_arty.attacker) {
					for (let p of result.used_arty.attacker) {
						if (is_piece_reduced(game, p)) {
							log_fn(`Rule 16.4: Heavy Artillery ${piece_log_name(game, p)} removed after second use.`)
							eliminate_piece(game, p, log_fn, true)
						} else {
							log_fn(`Rule 16.4: Heavy Artillery ${piece_log_name(game, p)} flips after first use.`)
							reduce_piece(game, p)
						}
					}
				}

				const check_12_6_8 = (space, faction) => {
					let pieces = get_pieces_in_space(game, space).filter(
						(p) => get_piece_effective_faction(game, p) === faction
					)
					if (pieces.length > 0) {
						let combat_units = pieces.filter((p) => is_combat_unit(p))
						if (combat_units.length === 0) {
							let hqs = pieces.filter((p) => is_hq(p) || is_heavy_arty(p))
							for (let p of hqs) {
								log_fn(
									`Rule 12.6.8: ${piece_log_name(game, p)} is eliminated because no combat units remain in its space.`
								)
								eliminate_piece(game, p, log_fn, true)
							}
						}
					}
				}

				check_12_6_8(target_space, defender_faction)
				if (game.attack.from) {
					for (let s of game.attack.from) {
						check_12_6_8(s, game.active)
					}
				}

				game.battle_resolution_side_effects_applied = true
			}

			game.retreat_distance = result.retreat_distance || 1
			if (game.turkish_retreat && result.retreat_needed && result.retreating_faction === CP) {
				game.retreat_distance = 1
			}
			game.retreat_steps_left = null

			let can_offer_initial_post_battle_cc = can_offer_post_battle_cc_window(game)

			if (result.turkish_retreat) {
				let alive_cp_defenders = get_combat_defenders(game, target_space, CP)
				let alive_cp_set = new Set(alive_cp_defenders)
				let mandatory = (result.turkish_retreat_units || []).filter((p) => alive_cp_set.has(p))
				let optional = (result.turkish_retreat_optional_units || []).filter((p) => alive_cp_set.has(p))
				if (mandatory.length > 0 || optional.length > 0 || can_offer_initial_post_battle_cc) {
					game.turkish_retreat_pending = true
					game.turkish_retreat_space = game.attack.space
					game.turkish_retreat_mandatory = mandatory
					game.turkish_retreat_optional = optional
				} else {
					result.turkish_retreat = false
					clear_turkish_retreat_state(game)
				}
			} else {
				clear_turkish_retreat_state(game)
			}

			game.battle_resolution_applied = true
		}

		let can_offer_post_battle_cc = can_offer_post_battle_cc_window(game)

		if (!game.post_roll_cc_done && defender_faction === CP) {
			game.active = CP
			game.state = "post_roll_cc_defender"
			return
		}

		apply_post_roll_battle_card_result_overrides(game, result, log_fn)

		if (
			result.catastrophic_attack &&
			get_catastrophic_attack_stack_options(game).length > 0 &&
			has_catastrophic_attack_surviving_defenders(game)
		) {
			clear_turkish_retreat_state(game)
			delete game.turkish_retreat
			if (!game.combat_cards_effected) game.combat_cards_effected = []
			set_add(game.combat_cards_effected, CC_CP_CATASTROPHIC_ATTACK)
			game.catastrophic_attack = {
				options: get_catastrophic_attack_stack_options(game).map((stack) => ({
					origin: stack.origin,
					participants: stack.participants.slice(),
					survivors: stack.survivors.slice()
				})),
				defender_space: target_space
			}
			game.active = CP
			game.state = "catastrophic_attack_choose_stack"
			if (log_fn) log_fn("灾难性攻击：将含英/印/澳新单位的进攻堆叠撤退1格，同盟国防守部队随后挺进。")
			return
		}

		if (check_confused_orders(game, result)) {
			return
		}

		let defenders_in_space = get_combat_defenders(game, target_space, defender_faction)

		// Rule 12.7.1: A defender never retreats if the attacker has no full-strength units after damage is absorbed
		let attacker_has_full_strength_unit = attacker_has_retreat_forcing_unit(game, result, target_space)
		let attacker_blocks_retreat = !attacker_has_full_strength_unit
		if (attacker_blocks_retreat && !result.turkish_retreat) {
			result.retreat_needed = false
		}

		if (can_offer_post_battle_cc) {
			enter_post_battle_cc_state(game, { kind: "resolve_battle" })
			return
		}

		if (game.turkish_retreat_pending) {
			enter_turkish_retreat_state(game)
			return
		}

		if (result.retreat_needed && defenders_in_space.length > 0 && !game.retreat_phase_done) {
			let actual_retreating = result.retreating_units.filter((p) => !is_not_on_map(game, p) && !is_eliminated(game, p))
			game.retreat_pieces = actual_retreating

			// If all retreating units were eliminated during loss application, no retreat needed.
			if (game.retreat_pieces.length === 0) {
				result.retreat_needed = false
			} else {
				result.retreating_units = actual_retreating
				if (!result.turkish_retreat) {
					result.retreat_can_cancel = can_cancel_defender_retreat(
						game,
						target_space,
						defender_faction,
						actual_retreating
					)
				}

				// POG 12.4.6: Massed Cavalry Charge and Push to the Breaking Point
				if (game.combat_cards && game.combat_cards.attacker && game.active === AP) {
					let ap_won = result.retreat_needed || defenders_in_space.length === 0
					if (ap_won) {
						if (game.combat_cards.attacker.includes(CC_AP_MASSED_CAVALRY_CHARGE)) {
							game.mcc_advance = true
						}
						if (game.combat_cards.attacker.includes(CC_AP_PUSH_TO_THE_BREAKING_POINT)) {
							game.ptbp_active = true
							game.ptbp_units = get_ptbp_eligible_units(game, result.attackers)
						}
					}
				}

				if (result.retreat_can_cancel) {
					enter_defender_retreat_state(game, defender_faction, true)
					return
				}
				enter_defender_retreat_state(game, defender_faction, false)

				// PUG 12.5.1 / 15.2.3: Siege requirement for advance
				check_advance_siege_requirement(game, result, defender_faction, log_fn)
				return
			}
		}

		if (!game.retreat_choice_cc_cp_done && attacker_faction === CP && defender_faction === AP) {
			let has_save_tiflis =
				(game.hand_cp && game.hand_cp.includes(CC_CP_SAVE_TIFLIS)) ||
				(game.cc_retained && game.cc_retained.cp && game.cc_retained.cp.includes(CC_CP_SAVE_TIFLIS))
			if (has_save_tiflis) {
				let saved_state = game.state
				game.state = "retreat_choice_cc_cp"
				let can_play = Engine.combat_cards.can_play_combat_card(game, CC_CP_SAVE_TIFLIS)
				game.state = saved_state
				if (can_play) {
					game.active = CP
					game.state = "retreat_choice_cc_cp"
					return
				}
			}
		}

		if (check_save_tiflis_event(game, log_fn)) {
			return
		}

		if (!result.retreat_needed || defenders_in_space.length === 0 || game.retreat_phase_done) {
			// No retreat needed, everyone is dead, or retreat already resolved.
			if (defenders_in_space.length === 0) {
				// POG 12.4.6: Push to the Breaking Point (defenders eliminated case)
				if (!game.ptbp_active && game.combat_cards && game.combat_cards.attacker && game.active === AP) {
					if (game.combat_cards.attacker.includes(CC_AP_PUSH_TO_THE_BREAKING_POINT)) {
						game.ptbp_active = true
						game.ptbp_units = get_ptbp_eligible_units(game, result.attackers)
					}
				}
				// PUG 12.5.1 / 15.2.3: Siege requirement for advance
				check_advance_siege_requirement(game, result, defender_faction, log_fn)

				if (attackers_already_in_target_space(game)) {
					handle_post_battle_finish_attack(game, log_fn)
				} else if (!result.no_advance || game.save_tiflis_failed || game.save_tiflis_vacated_battle_space) {
					handle_post_battle_advance(game, result, game.attack.space, log_fn)
				} else {
					handle_post_battle_finish_attack(game, log_fn)
				}
			} else {
				handle_post_battle_finish_attack(game, log_fn)
			}

			// Cleanup Rule 66 flags
			clear_save_tiflis_state(game)
		}
	}

	function get_retreat_distance(game, result) {
		// PUG 12.7.2: Standard retreat is 2 spaces.
		// Exception: If Attacker's modified die roll is only 1 greater than Defender's, retreat 1.
		if (result && result.att_roll !== undefined && result.def_roll !== undefined) {
			let diff = result.att_roll - result.def_roll
			if (diff === 1) return 1
			return 2
		}
		return 2 // Default PUG retreat is 2
	}

	function get_valid_retreat_spaces(
		game,
		piece,
		avoided_spaces = [],
		spaces_to_retreat = 1,
		ignore_stacking = false
	) {
		let faction = get_piece_faction(piece)
		let find_valid_steps = (from_space, steps_left, local_avoided) => {
			let adj = get_piece_connected_spaces_for_rule(game, from_space, piece)
			let valid = []
			if (is_ru_black_sea_piece(piece) && is_black_sea_port(game, from_space)) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (s === from_space || local_avoided.includes(s)) continue
					if (!is_black_sea_port(game, s) || !is_controlled_by(game, s, AP)) continue
					if (!ignore_stacking && !can_stack_end_in_space(game, s, [piece])) continue
					valid.push(s)
				}
			}
			for (let next of adj) {
				if (Engine.map.is_beachhead_space(game, from_space) && !is_island_base(game, next)) continue
				if (contains_enemy_pieces(game, next, faction) && !is_region(game, next)) continue
				if (has_undestroyed_fort(game, next, other_faction(faction))) continue
				if (local_avoided.includes(next)) continue
				if (Engine.map.is_potential_beachhead_space(next) && !Engine.map.is_beachhead_space(game, next))
					continue
				if (!can_enter_area(game, piece, next, { retreat: true })) continue

				if (steps_left === 1) {
					if (!ignore_stacking && !can_stack_end_in_space(game, next, [piece])) continue
					valid.push(next)
					continue
				}

				if (is_region(game, next)) {
					if (!ignore_stacking && !can_stack_end_in_space(game, next, [piece])) continue
					valid.push(next)
					continue
				}

				if (is_island_base(game, next)) {
					if (!ignore_stacking && !can_stack_end_in_space(game, next, [piece])) continue
					valid.push(next)
					continue
				}

				let second_steps = find_valid_steps(next, steps_left - 1, [from_space, ...local_avoided])
				if (second_steps.length > 0) {
					valid.push(next)
				}
			}
			return [...new Set(valid)]
		}

		return find_valid_steps(game.pieces[piece], spaces_to_retreat, avoided_spaces)
	}

	function apply_retreat_priorities(game, piece, valid) {
		if (valid.length <= 1) return valid
		let faction = get_piece_faction(piece)

		// Priority 1: Friendly in supply
		let friendly_in_supply = valid.filter(
			(s) => is_controlled_by(game, s, faction) && Engine.map.is_in_supply(game, s, faction, piece)
		)
		if (friendly_in_supply.length > 0) return friendly_in_supply

		// Priority 2: Friendly OOS
		let friendly_oos = valid.filter((s) => is_controlled_by(game, s, faction))
		if (friendly_oos.length > 0) return friendly_oos

		// Priority 3: Enemy in supply
		let enemy_in_supply = valid.filter((s) => Engine.map.is_in_supply(game, s, faction, piece))
		if (enemy_in_supply.length > 0) return enemy_in_supply

		return valid
	}

	function get_valid_advance_spaces(game, piece, target_space) {
		if (game.pieces[piece] === target_space) return []
		let from_space = game.pieces[piece]
		let faction = get_piece_faction(piece)
		if (!can_advance_leave_besieged_space(game, piece, from_space, faction)) return []
		let connected = get_piece_connected_spaces_for_rule(game, from_space, piece)
		let participated_in_current_attack =
			game.attack &&
			game.attack.space === target_space &&
			Array.isArray(game.attack.pieces) &&
			game.attack.pieces.includes(piece)
		if (!connected.includes(target_space)) {
			if (!participated_in_current_attack) return []
			// Rule 3.1.2 / 12.1.5: units may attack across restricted map edges, but
			// may not Advance After Combat across an edge they could not move across.
			if (Engine.map.has_map_connection(from_space, target_space)) return []
		}
		if (!can_enter_area(game, piece, target_space)) return []
		// Rule 17.2.2: Irregular units cannot advance out of their supply area.
		if (!Engine.map.is_space_in_irregular_supply_area(piece, target_space)) return []
		if (!is_region(game, target_space) && contains_enemy_pieces(game, target_space, faction)) return []
		if (!can_stack_end_in_space(game, target_space, [piece])) return []
		return [target_space]
	}

	function can_advance_leave_besieged_space(game, piece, from_space, faction) {
		if (!(from_space > 0) || !is_besieged(game, from_space)) return true
		if (get_fort_owner(game, from_space) !== other_faction(faction)) return true

		let remaining = get_pieces_in_space(game, from_space).filter(
			(p) => p !== piece && get_piece_effective_faction(game, p) === faction
		)
		return can_besiege(game, from_space, remaining)
	}

	function resolve_russian_winter_offensive_advance(game, p, advance_space, log_fn) {
		if (
			is_russian_winter_offensive_active(game) &&
			game.active === AP &&
			piece_counts_as_nation_for_rule(game, p, "ru")
		) {
			if (is_caucasus(advance_space) && has_undestroyed_fort(game, advance_space, CP)) {
				set_add(game.forts.destroyed, advance_space)
				if (log_fn)
					log_fn(
						`Russian Winter Offensive: Fort in ${space_log_name(advance_space)} destroyed by advancing Russian troops.`
					)
			}
		}
	}

	function find_fire_column(type, cf, shifts = 0) {
		let table = fire_table[type.toLowerCase()]
		if (!table) return null
		return get_fire_col(table, cf, shifts)
	}

	// Helpers adapted from rules.js

	function apply_losses(game, pieces, count, eliminate_fn = null) {
		let applied = 0
		let eliminate = (p) => eliminate_piece_in_combat(game, p, false, eliminate_fn)

		// 1. Reduce Full Strength units first
		for (let i = 0; i < pieces.length; i++) {
			if (applied >= count) break
			let p = pieces[i]

			// Skip if already eliminated in this pass (shouldn't happen with this logic but good to check)
			if (is_eliminated(game, p)) continue

			if (!is_piece_reduced(game, p)) {
				let loss_value = get_piece_lf(game, p)
				if (has_rcf(p)) {
					Engine.game_utils.reduce_piece(game, p)
				} else {
					eliminate(p)
				}
				applied += loss_value
			}
		}

		// 2. Eliminate Reduced units
		if (applied < count) {
			for (let i = 0; i < pieces.length; i++) {
				if (applied >= count) break
				let p = pieces[i]
				if (is_eliminated(game, p)) continue

				if (is_piece_reduced(game, p)) {
					let loss_value = get_piece_lf(game, p)
					eliminate(p)
					applied += loss_value
				}
			}
		}

		return applied
	}

	function get_piece_steps(game, p) {
		if (is_not_on_map(game, p)) return 0
		if (has_rcf(p)) {
			return is_piece_reduced(game, p) ? 1 : 2
		}
		return 1
	}

	function count_steps(game, pieces) {
		let total = 0
		for (let p of pieces) total += get_piece_steps(game, p)
		return total
	}

	function any_capital_occupied_or_besieged(game, nation) {
		const { is_besieged } = Engine.map
		let capitals = []
		if (nation === "tu") capitals = ["CONSTANTINOPLE"]
		if (nation === "ge") capitals = ["BERLIN"]
		if (nation === "ah") capitals = ["VIENNA", "BUDAPEST"]
		if (nation === "ru") capitals = ["TIFLIS"]
		if (nation === "br") capitals = ["LONDON"]
		if (nation === "fr") capitals = ["PARIS"]
		if (nation === "it") capitals = ["ROME"]
		if (nation === "bu") capitals = ["SOFIA"]
		if (nation === "ro") capitals = ["BUCHAREST"]
		if (nation === "gr") capitals = ["ATHENS"]
		if (nation === "pe") capitals = ["TEHERAN"]
		if (nation === "sb") capitals = ["BELGRADE"]

		if (capitals.length === 0) return false

		let faction = ["tu", "ge", "ah", "bu"].includes(nation) ? CP : AP
		for (let name of capitals) {
			let s = find_space(name)
			if (s >= 0) {
				if (!Engine.map.is_controlled_by(game, s, faction) || is_besieged(game, s)) return true
			}
		}
		return false
	}

	function resolve_siege_phase(game, log_fn, set_control_fn) {
		for (let s = 1; s < data.spaces.length; s++) {
			if (data.spaces[s].fort && data.spaces[s].fort > 0) {
				resolve_siege(game, s, log_fn, set_control_fn)
			}
		}
	}

	function resolve_siege(game, s, log_fn, set_control_fn) {
		const { is_besieged } = Engine.map
		if (!data.spaces[s].fort || data.spaces[s].fort <= 0) return
		if (set_has(game.forts.destroyed, s)) return

		if (is_besieged(game, s)) {
			let lf = data.spaces[s].fort
			let roll = roll_die(6, game)
			if (log_fn) log_fn(`Siege roll for ${space_log_name(s)} (LF ${lf}): ${roll}`)

			if (roll > lf) {
				if (log_fn) log_fn(`${space_log_name(s)} surrenders!`)
				set_add(game.forts.destroyed, s)

				// Determine besieging faction
				let besieging_faction = null
				let fort_owner = Engine.map.get_fort_owner(game, s)

				// Find an enemy unit to determine who captured it
				let pieces = get_pieces_in_space(game, s)
				for (let p of pieces) {
					// Check for valid besieger (non-tribe enemy)
					let faction = get_piece_effective_faction(game, p)
					if (faction !== fort_owner && (faction === AP || faction === CP)) {
						if (!is_tribe(p)) {
							besieging_faction = faction
							break
						}
					}
				}

				if (besieging_faction) {
					// Transfer Control
					if (set_control_fn) {
						set_control_fn(game, s, besieging_faction)
					} else {
						game.control[s] = besieging_faction
					}
					if (log_fn) log_fn(`${besieging_faction === AP ? "AP" : "CP"} capture ${space_log_name(s)}.`)

					// VP Adjustment - Engine.set_control already handles VP, so we only do it if set_control_fn is NOT provided
					if (!set_control_fn) {
						let vp_val = data.spaces[s].vp || 0
						if (vp_val > 0) {
							if (besieging_faction === CP) {
								game.vp += vp_val
								if (log_fn) log_fn(`CP gains ${vp_val} VP.`)
							} else {
								game.vp -= vp_val
								if (log_fn) log_fn(`AP gains ${vp_val} VP.`)
							}
						}
					}
				}
			} else {
				if (log_fn) log_fn(`${space_log_name(s)} holds out.`)
			}
		}
	}

	function finish_turkish_retreat(game) {
		let retreat_space = game.turkish_retreat_space ?? game.attack?.space
		let attacker_retreated = !!game.turkish_retreat_attacker_retreated
		game.retreat_steps_left = null
		game.selected_piece = null
		delete game.turkish_retreat_pending
		delete game.turkish_retreat_space
		delete game.turkish_retreat_mandatory
		delete game.turkish_retreat_optional
		delete game.turkish_retreat_attacker_retreated
		delete game.turkish_retreat_chosen_space
		if (game.battle_result) delete game.battle_result.turkish_retreat

		// ALWAYS restore active player to the attacker before determining next state.
		// If defender needs to take losses or perform other actions, we will switch again.
		let factions = game.attack ? infer_attack_factions(game) : { attacker: AP, defender: CP }
		if (game.attack) {
			game.attack.attacker = factions.attacker
			game.attack.defender = factions.defender
		}
		game.active = factions.attacker

		let defender_losses_left = (game.attack?.defender_losses || 0) - (game.attack?.defender_losses_absorbed || 0)
		if (game.attack && defender_losses_left > 0) {
			game.active = CP
			game.state = get_defender_losses_state(game)
			return
		}

		if (!retreat_space || attacker_retreated) {
			finish_attack(game)
			return
		}

		let defenders = get_pieces_in_space(game, retreat_space).filter(
			(p) =>
				get_piece_effective_faction(game, p) === CP &&
				!(Array.isArray(game.retreated) && set_has(game.retreated, p))
		)
		if (defenders.length === 0) {
			if (!game.battle_result || !game.battle_result.no_advance) {
				if (begin_advance(game, game.battle_result, retreat_space)) {
					return
				}
			}
		}
		finish_attack(game)
	}

	function get_cp_defenders(game, defenders) {
		return defenders.filter((p) => get_piece_effective_faction(game, p) === CP)
	}

	function get_turkish_retreat_space(game, defenders) {
		// PUG Rule 12.8: Turkish retreat (Withdrawal) is exactly one space.
		// It must follow retreat priorities in 12.7.6d:
		// 1) Into a friendly space in supply.
		// 2) Into a friendly space Out of Supply.
		// 3) Into an enemy space that would result in the retreating unit being in supply.
		// 4) Into an enemy space that that would result in the retreating unit being Out of Supply.

		// Note: Rule 12.8.1 states Turkish Withdrawal cannot be used in Regions.
		// is_turkish_retreat_active already checks for is_region(game.attack.space).

		let space = game.attack.space
		let cp_defenders = get_cp_defenders(game, defenders)
		if (cp_defenders.length === 0) return space

		// We use the first TU/TUA SCU to determine valid retreat spaces
		let p = cp_defenders.find(
			(p) => (get_piece_nation(p) === "tu" || get_piece_nation(p) === "tua") && get_piece_class(p) === "SCU"
		)
		if (!p) return space

		let nation = get_piece_nation(p)
		let faction = get_piece_faction(p)
		let neighbors = get_connected_spaces(game, space, nation, faction, p)
		let valid = []

		// Avoided spaces: The spaces attackers came from (Rule 12.7.6f logic applied to 1-space retreat)
		let avoided = game.attack.from || []

		for (let next of neighbors) {
			// Rule 12.7.6b: Cannot enter space with enemy unit or unbesieged enemy Fort
			if (contains_enemy_pieces(game, next, faction)) continue
			if (has_undestroyed_fort(game, next, other_faction(faction))) continue
			if (avoided.includes(next)) continue

			// Priority scoring based on Rule 12.7.6d
			let score = 0
			let friendly = is_controlled_by(game, next, faction)
			let in_supply = is_in_supply(game, next, faction)

			if (friendly && in_supply) score = 4
			else if (friendly && !in_supply) score = 3
			else if (!friendly && in_supply) score = 2
			else if (!friendly && !in_supply) score = 1

			valid.push({ id: next, score: score })
		}

		// Sort by score (highest first)
		valid.sort((a, b) => b.score - a.score)

		if (valid.length > 0) {
			// If there are multiple best options, the player should ideally choose,
			// but for now we return the first one or the list for the engine to handle.
			return valid[0].id
		}

		return space // No valid retreat space, units will be eliminated in retreat_units
	}

	function is_turkish_retreat_active(game, defenders) {
		if (!game.turkish_retreat) return false
		if (game.attack && is_region(game, game.attack.space)) return false
		let cp_defenders = get_cp_defenders(game, defenders)
		if (cp_defenders.length === 0) return false
		return cp_defenders.some(
			(p) => (get_piece_nation(p) === "tu" || get_piece_nation(p) === "tua") && get_piece_class(p) === "SCU"
		)
	}

	function retreat_units(game, units, distance, avoided_spaces = []) {
		for (let p of units) {
			if (is_eliminated(game, p)) continue

			let current = game.pieces[p]
			let retreated_dist = 0

			while (retreated_dist < distance) {
				let nation = get_piece_nation(p)
				let faction = get_piece_faction(p)
				let neighbors = get_connected_spaces(game, current, nation, faction, p)
				let valid = []
				for (let next of neighbors) {
					// Rule 12.7.6b: Cannot retreat to space with enemy pieces or unbesieged enemy Fort
					if (contains_enemy_pieces(game, next, faction)) continue
					if (has_undestroyed_fort(game, next, other_faction(faction))) continue
					if (!can_enter_area(game, p, next)) continue
					if (retreated_dist === distance - 1 && !can_stack_end_in_space(game, next, [p])) continue

					// Rule 12.7.6f: Cannot retreat back into the original defending space (for 2nd space)
					if (next === game.attack.space) continue

					// Rule 12.7.6f: Avoid attacker origins
					if (avoided_spaces.includes(next)) continue

					// Rule 12.7.6d Priority scoring:
					// 1) Into a friendly space in supply. (Score: 4)
					// 2) Into a friendly space Out of Supply. (Score: 3)
					// 3) Into an enemy space that would result in the retreating unit being in supply. (Score: 2)
					// 4) Into an enemy space that that would result in the retreating unit being Out of Supply. (Score: 1)
					let score = 0
					let friendly = is_controlled_by(game, next, faction)
					let in_supply = is_in_supply(game, next, faction)

					if (friendly && in_supply) score = 4
					else if (friendly && !in_supply) score = 3
					else if (!friendly && in_supply) score = 2
					else if (!friendly && !in_supply) score = 1

					valid.push({ id: next, score: score })
				}

				// Sort by score
				valid.sort((a, b) => b.score - a.score)

				if (valid.length > 0) {
					// Pick best
					let best = valid[0].id
					game.pieces[p] = best
					retreated_dist++
					current = best
				} else {
					// Rule 12.7.11: RU Black Sea sea retreat
					if (data.pieces[p].name === "RU Black Sea") {
						const { is_black_sea_port } = Engine.map
						let ports = []
						for (let s = 1; s < data.spaces.length; s++) {
							if (is_black_sea_port(game, s) && is_controlled_by(game, s, AP)) {
								ports.push(s)
							}
						}
						if (ports.length > 0) {
							// For an automated function, we pick the first one.
							game.pieces[p] = ports[0]
							Engine.log(game, `${piece_log_name(game, p)} 通过海上撤退至 ${space_log_name(ports[0])}.`)
							break
						}
					}
					// No valid retreat path - Eliminate unit
					eliminate_piece_in_combat(game, p, true)
					break
				}
			}

			if (!is_eliminated(game, p) && !is_not_on_map(game, p) && retreated_dist > 0) {
				set_add(game.retreated, p)
			}
		}
	}

	function get_combat_card_drm(card, side, game, attackers, defenders) {
		return Engine.combat_cards.get_combat_card_drm(card, side, game, attackers, defenders)
	}

	function get_combat_card_penalty(card, side, game, attackers, defenders) {
		return Engine.combat_cards.get_combat_card_penalty(card, side, game, attackers, defenders)
	}

	function no_prisoners_applies(attackers) {
		return attackers.some((p) => {
			let info = data.pieces[p]
			if (!info) return false
			let is_ap_arab = info.faction === AP && info.nation === "ar"
			let is_cp_tribe = info.faction === CP && info.type === "tribe"
			return is_ap_arab || is_cp_tribe
		})
	}

	// Main Resolve Battle Function
	function adds_flanking_drm(game, space, attacker_faction, target_space) {
		let connected = get_connected_spaces(game, space)
		let enemy_faction = other_faction(attacker_faction)
		for (let s of connected) {
			if (s === target_space) continue
			let pieces = get_pieces_in_space(game, s)
			let enemy_units = pieces.filter((p) => get_piece_effective_faction(game, p) === enemy_faction)

			// Rule 12.4.2: Spaces that contain only an enemy Fort are not considered enemy-occupied.
			if (enemy_units.length === 0) continue

			// Rule 12.4.2: Enemy-occupied spaces connected to friendly attacking units only by colored railroads
			// or Trans-Regional Paths are not considered enemy-occupied for this purpose.
			let type = get_connection_type(space, s)
			if (type === "green") continue

			// Colored railroads: Check if it's a rail and if it's limited for the attacker's nation
			if (type === "rail") {
				// If ANY attacking unit in 'space' can use this railroad normally, it's not "colored" for them?
				// Rule says "connected to friendly attacking units only by colored railroads".
				// This usually means the railroad itself is colored (limited).
				let is_colored = false
				let space_info = data.spaces[space]
				if (space_info.limited_connections) {
					// In PUG data, limited_connections[nation] = [targets]
					// If a connection is NOT in ANY nation's limited_connections, it's normal.
					// If it IS in limited_connections, it's colored.
					let targets = Object.values(space_info.limited_connections).flat()
					if (targets.includes(s)) is_colored = true
				}
				if (is_colored) continue
			}

			return false
		}
		return true
	}

	function check_can_flank(game) {
		if (!game.attack || !game.attack.pieces || game.attack.pieces.length === 0) return false

		let attackers = game.attack.pieces
		let target_space = game.attack.space
		let target_terrain = get_combat_target_terrain(game, target_space, attackers)
		let defender_faction = other_faction(game.active)
		let defenders = get_combat_defenders(game, target_space, defender_faction)
		let trench_level_at_target = get_defender_trench_level(game, target_space, defender_faction, defenders)
		let is_river_def = is_river_defense(game)
		let ignore_trench = attacker_ignores_trench_for_flank(game, attackers, target_space)
		let ignore_river = attacker_ignores_river_for_flank(game, attackers)

		let has_lcu = attackers.some((p) => is_lcu(p))
		let attacking_spaces = new Set()
		for (let p of attackers) {
			attacking_spaces.add(game.pieces[p])
		}

		let has_fort = has_undestroyed_fort(game, target_space, defender_faction)
		let has_defending_units = defenders.filter((p) => is_combat_unit(p)).length > 0
		let has_undefended_fort = has_fort && !has_defending_units
		let is_region_val = is_region(game, target_space)

		return (
			attacking_spaces.size >= 2 &&
			has_lcu &&
			target_terrain !== MOUNTAIN &&
			target_terrain !== SWAMP &&
			(trench_level_at_target === 0 || ignore_trench) &&
			!has_undefended_fort &&
			!is_region_val &&
			(!is_river_def || ignore_river)
		)
	}

	function resolve_battle(game, log_fn) {
		const log = (msg) => {
			if (log_fn) log_fn(msg)
		}

		if (game.cc_jafar_pasha_retreat) {
			if (jafar_pasha_retreat_continues_as_fort_attack(game)) {
				log("贾法尔帕夏：防守方撤退，进攻方继续攻击要塞。")
				delete game.cc_jafar_pasha_retreat
				delete game.jafar_pasha_advance_after_cancel
				if (game.attack) game.attack.jafar_pasha_retreat_before_fort = true
			} else {
				let attackers = get_live_attackers(game)
				let defenders = Array.isArray(game.attack?.initial_defenders) ? game.attack.initial_defenders.slice() : []
				log("贾法尔帕夏：防守方撤退，战斗不进行。")
				delete game.cc_jafar_pasha_retreat
				return {
					jafar_pasha_retreat: true,
					attackers,
					defenders,
					attacker_losses: 0,
					defender_losses: 0,
					retreat_needed: false,
					retreating_faction: null,
					retreating_units: [],
					retreat_can_cancel: false,
					retreat_distance: 1,
					no_advance: false,
					catastrophic_attack: false,
					turkish_retreat: false,
					turkish_retreat_units: [],
					turkish_retreat_optional_units: [],
					turkish_retreat_defender_retreats: false,
					advance_with_reduced: false
				}
			}
		}

		let pre_battle_cancel_reason = get_pre_battle_cancel_reason(game)
		if (pre_battle_cancel_reason) {
			let attackers = get_live_attackers(game)
			let defenders = []
			if (game.attack && game.attack.space > 0) {
				let factions = infer_attack_factions(game)
				defenders = get_combat_defenders(game, game.attack.space, factions.defender)
			}
			log(`Battle cancelled: ${pre_battle_cancel_reason}.`)
			return {
				cancelled: true,
				cancelling_cards: [],
				pre_battle_cancel: true,
				pre_battle_cancel_reason,
				attackers,
				defenders
			}
		}

		let attackers = get_live_attackers(game)
		game.attack.pieces = attackers.slice()
		let support_reason = get_attack_support_block_reason(game, attackers)
		if (support_reason) {
			log(`Cannot attack: ${support_reason}.`)
			return { cancelled: true, cancelling_cards: [], attackers, defenders: [] }
		}
		let target_space = game.attack.space
		let target_terrain = get_combat_target_terrain(game, target_space, attackers)
		// Mark attackers as having attacked in this action round
		for (let p of attackers) {
			set_add(game.attacked, p)
		}

		let defender_faction = other_faction(game.active)
		let defenders = get_combat_defenders(game, target_space, defender_faction)

		// 0. Strait Crossing Check (Moved early to avoid logging dice rolls if cancelled)
		let all_crossing_strait = !is_cp_attacking_beachhead(game, target_space, attackers)
		let strait_violation = false

		for (let p of attackers) {
			let from = game.pieces[p]
			let to = target_space

			// Check connection type
			let strait_num = get_connection_strait(from, to)

			if (!is_cp_attacking_beachhead(game, target_space, attackers)) {
				if (strait_num !== undefined && strait_num !== null && strait_num !== 0) {
					// Numbered Dardanelles straits must satisfy the full sequential control rule.
					let faction = data.pieces[p].faction
					if (!can_use_strait(game, from, to, faction)) {
						strait_violation = true
						log(
							`Strait Control Violation! ${faction.toUpperCase()} does not control required straits for Strait #${strait_num}.`
						)
					}
				} else if (!is_water_crossing_attack_edge(game, from, to, attackers)) {
					all_crossing_strait = false
				}
			}
		}

		if (strait_violation) {
			log("战斗取消。")
			return { cancelled: true, cancelling_cards: [], attackers, defenders }
		}

		if (game.liberate_suez_battle_required && game.active === CP && Engine.map.is_egypt(target_space)) {
			if (!Array.isArray(game.liberate_suez_egypt_attacked_spaces)) game.liberate_suez_egypt_attacked_spaces = []
			for (let p of attackers) {
				let from = game.pieces[p]
				// Source may be outside Egypt (e.g., Sinai) as long as the target is in Egypt
				if (
					game.activated &&
					(set_has(game.activated.attack, from) || set_has(game.activated.attack_egypt, from))
				) {
					set_add(game.liberate_suez_egypt_attacked_spaces, from)
					game.liberate_suez_egypt_battle_done = true
				}
			}
		}

		// 1. Check Sandstorms (Cancel) - CP Card 61
		if (game.combat_cards && game.combat_cards.defender && game.combat_cards.defender.includes(CC_CP_SANDSTORMS)) {
			if (Engine.combat_cards.is_desert_or_swamp_battle(game)) {
				log("战斗取消。")
				return { cancelled: true, cancelling_cards: [CC_CP_SANDSTORMS], attackers, defenders }
			}
		}

		// 2. Jafar Pasha Retreat (Cancel)
		if (game.cc_jafar_pasha_retreat) {
			log("战斗取消。")
			delete game.cc_jafar_pasha_retreat
			return { cancelled: true, cancelling_cards: [CC_CP_JAFAR_PASHA], attackers, defenders }
		}

		// Rule 12.8: Turkish Retreat (Withdrawal) is declared before battle resolution.
		// If active, defender (CP) losses are reduced by 1 (to a minimum of 0).
		let turkish_retreat_active = is_turkish_retreat_active(game, defenders)
		let turkish_loss_reduction_logged = false

		// Rule 337: "?" loss value determination for current combat
		game.attack.piece_lf = {}
		let variable_loss_pieces = [...attackers, ...defenders].filter(
			(p) => data.pieces[p].lf === null || data.pieces[p].lf === "?"
		)
		for (let p of variable_loss_pieces) {
			let roll = roll_die(6, game)
			game.attack.piece_lf[p] = roll
			log(`${piece_log_name(game, p)} 血量掷骰：${roll}`)
		}

		// Combat Card Flags
		let att_fire_first = !!(game.attack && game.attack.flank_successful)
		let def_fire_first = !!(game.attack && game.attack.flank_failed)
		let ignore_terrain = false
		let ignore_trench = false
		let ignore_desert = false
		let jihad_ignore = false
		let trench_bonus_cp = 0
		let i_order_you_to_die_trench_bonus = false
		const mark_effected = (card) => {
			if (!game.combat_cards_effected) game.combat_cards_effected = []
			if (!game.combat_cards_effected.includes(card)) {
				game.combat_cards_effected.push(card)
			}
		}

		if (game.combat_cards) {
			// Attacker Cards
			if (game.combat_cards.attacker) {
				if (game.combat_cards.attacker.includes(CC_AP_HAVERSACK_RUSE)) {
					if (attackers.some((p) => is_lcu(p) && data.pieces[p].nation === "br")) {
						att_fire_first = true
						ignore_terrain = true
						mark_effected(CC_AP_HAVERSACK_RUSE)
						log_detail(log, "背包计谋：进攻方率先开火且忽略地形效果")
					}
				}
				if (game.combat_cards.attacker.includes(CC_AP_MASSED_CAVALRY_CHARGE)) {
					if (attackers.some((p) => is_anz_desert_corps(p))) {
						ignore_trench = true
						ignore_desert = true
						mark_effected(CC_AP_MASSED_CAVALRY_CHARGE)
						log_detail(log, "集群骑兵冲锋：无视战壕与沙漠")
					}
				}
				if (game.combat_cards.attacker.includes(CC_AP_MAUDE)) {
					if (!data.spaces[target_space].vp) {
						ignore_trench = true
						mark_effected(CC_AP_MAUDE)
						log_detail(log, "莫德：战壕效果取消（非VP格）")
					}
				}
				if (game.combat_cards.attacker.includes(CC_AP_PUSH_TO_THE_BREAKING_POINT)) {
					mark_effected(CC_AP_PUSH_TO_THE_BREAKING_POINT)
					log_detail(log, "竭尽全力：符合条件的单位若获胜可再次进攻。")
				}
				if (game.combat_cards.attacker.includes(CC_CP_ARMY_OF_ISLAM)) {
					att_fire_first = true
					mark_effected(CC_CP_ARMY_OF_ISLAM)
					log_detail(log, "伊斯兰军：进攻方率先开火")
				}
			}
			// Defender Cards
			if (game.combat_cards.defender) {
				if (game.combat_cards.defender.includes(CC_CP_I_ORDER_YOU_TO_DIE)) {
					if (defenders.every((p) => data.pieces[p].nation === "tu")) {
						trench_bonus_cp = 1
						i_order_you_to_die_trench_bonus = true
						mark_effected(CC_CP_I_ORDER_YOU_TO_DIE)
					}
				}
				if (game.combat_cards.defender.includes(CC_CP_ARMY_OF_ISLAM)) {
					def_fire_first = true
					mark_effected(CC_CP_ARMY_OF_ISLAM)
					log_detail(log, "伊斯兰军：防守方率先开火")
				}
			}
		}

		if (
			game.active === CP &&
			game.attack?.yildrim_offensive_trench_negate === true &&
			is_yildrim_offensive_active(game) &&
			has_yildrim_offensive_attackers(game, attackers)
		) {
			ignore_trench = true
			set_yildrim_offensive_trench_used(game)
			log_detail(log, "耶尔德里姆攻势：取消战壕")
		}

		// Tables
		let att_table = attackers.some((p) => is_lcu(p)) ? fire_table.lcu : fire_table.scu
		let def_table = defenders.some((p) => is_lcu(p)) ? fire_table.lcu : fire_table.scu

		// Combat Cards (DRMs)
		let att_drm = 0
		let def_drm = 0

		if (
			game.active === CP &&
			game.combat_cards &&
			game.combat_cards.attacker &&
			game.combat_cards.attacker.includes(CC_CP_PASHA_1)
		) {
			att_table = fire_table.lcu
			mark_effected(CC_CP_PASHA_1)
			log_detail(log, "帕夏一号：进攻方使用 LCU 火力表")
		}
		if (
			game.active === AP &&
			game.combat_cards &&
			game.combat_cards.defender &&
			game.combat_cards.defender.includes(CC_CP_PASHA_1)
		) {
			def_table = fire_table.lcu
			mark_effected(CC_CP_PASHA_1)
			log_detail(log, "帕夏一号：防守方使用 LCU 火力表")
		}

		if (game.active === CP) {
			let bulls_eye_drm = bulls_eye_ru_attack_drm(game, defenders)
			if (bulls_eye_drm) {
				att_drm += bulls_eye_drm
				log_detail(log, "靶心指令：对俄国单位 +1 DRM")
			}
			if (game.events && game.events["arab_desertion"]) {
				if (attackers.some((p) => data.pieces[p].nation === "tua")) {
					att_drm -= 1
					log_detail(log, "阿拉伯人背弃：TU-A单位-1 DRM")
				}
			}
		}

		if (game.active === AP) {
			if (game.events && game.events["arab_desertion"]) {
				if (defenders.some((p) => data.pieces[p].nation === "tua")) {
					def_drm -= 1
					log_detail(log, "阿拉伯人背弃：TU-A单位-1 DRM")
				}
			}
		}

		// Attacker Strength
		let att_cf = attackers.reduce((sum, p) => sum + get_piece_cf(game, p), 0)

		// Defender Strength
		let def_cf = defenders.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		let has_fort = has_undestroyed_fort(game, target_space, defender_faction)
		if (has_fort) {
			let fort_val = data.spaces[target_space].fort || 0
			// 俄军冬季攻势期间高加索要塞火力归零。
			if (is_russian_winter_offensive_active(game) && game.active === AP) {
				if (is_caucasus(target_space)) {
					fort_val = 0
					log_detail(log, "俄军冬季攻势：高加索要塞火力归零。")
				}
			}
			// 规则 15.1.3：要塞 CF 始终加入防守火力；空要塞自身提供战力（15.1.5）。
			def_cf += fort_val
		}

		if (game.combat_cards && game.combat_cards.attacker) {
			if (game.combat_cards.attacker.includes(CC_AP_MARCH_AND_COUNTERMARCH)) {
				att_drm += 1
				mark_effected(CC_AP_MARCH_AND_COUNTERMARCH)
				log_detail(log, "前后佯动: +1 DRM")
			}
		}
		if (game.combat_cards && game.combat_cards.defender) {
			if (game.combat_cards.defender.includes(CC_AP_MARCH_AND_COUNTERMARCH)) {
				def_drm += 1
				mark_effected(CC_AP_MARCH_AND_COUNTERMARCH)
				log_detail(log, "前后佯动: +1 DRM")
			}
		}

		// HQ and Heavy Artillery Support
		let used_hqs = { attacker: [], defender: [] }
		let used_arty = { attacker: [] } // Arty only attacks

		// Helper: Check if HQ matches unit nation
		const hq_matches = (hq_p, unit_p) => {
			let hq_nat = data.pieces[hq_p].nation
			let unit_nat = data.pieces[unit_p].nation
			if (hq_nat === unit_nat) return true

			// Special HQs
			let hq_name = data.pieces[hq_p].name
			// Rule 16.3.1: Allenby/Maude matches BR/ANZ/IN
			if (hq_name.includes("Allenby") || hq_name.includes("Maude")) {
				if (["br", "anz", "in"].includes(unit_nat)) return true
			}
			// Rule 16.3.2: Falkenhayn/Mackensen matches all CP units
			if (hq_name.includes("Falkenhayn") || hq_name.includes("Mackensen")) {
				if (get_piece_faction(unit_p) === "cp") return true
			}
			if (hq_name === "TU Army Islam HQ") {
				if (unit_nat === "tu" || unit_nat === "tua") return true
			}
			return false
		}

		// 1. Attacker HQs
		for (let p of attackers) {
			if (data.pieces[p] && data.pieces[p].type === "hq") {
				// Check if any other attacker matches
				let match = attackers.some((other) => p !== other && data.pieces[other] && hq_matches(p, other))
				if (match) {
					let bonus = get_hq_drm(game, p)
					att_drm += bonus
					used_hqs.attacker.push(p)
					log_detail(log, `进攻方指挥部 ${piece_log_name(game, p)} 提供 +${bonus} DRM`)
				}
			}
		}

		// 2. Defender HQs
		for (let p of defenders) {
			if (data.pieces[p] && data.pieces[p].type === "hq") {
				// Check if any other defender matches
				let match = defenders.some((other) => p !== other && data.pieces[other] && hq_matches(p, other))
				if (match) {
					let bonus = get_hq_drm(game, p)
					def_drm += bonus
					used_hqs.defender.push(p)
					log_detail(log, `防守方指挥部 ${piece_log_name(game, p)} 提供 +${bonus} DRM`)
				}
			}
		}

		// 3. Attacker Heavy Artillery (Rule 16.4: functions as HQ, uses LF as DRM, requires nationality match)
		for (let p of attackers) {
			if (data.pieces[p] && data.pieces[p].name.includes("Hvy Arty")) {
				let match = attackers.some(
					(other) =>
						other !== p &&
						data.pieces[other] &&
						!is_hq(other) &&
						!is_heavy_arty(other) &&
						hq_matches(p, other)
				)
				if (match) {
					let bonus = set_has(game.reduced, p) ? data.pieces[p].rlf || 0 : data.pieces[p].lf || 0
					att_drm += bonus
					used_arty.attacker.push(p)
					log_detail(log, `进攻方重炮部队提供 +${bonus} DRM`)
				}
			}
		}

		// Rolls
		let att_roll = roll_die(6, game)
		let def_roll = roll_die(6, game)

		// 4. Flank Attack
		// PUG 12.3: If attacking from 2 or more spaces, and at least one LCU is involved.
		let can_flank = check_can_flank(game)
		let attempt_flank = can_flank && game.attack.flank_attempt

		// Handle Jihad Offensive event if applicable (even if not flanking, it might ignore trench/river for DRM)
		if (
			game.active === CP &&
			game.attack?.jihad_offensive_negate === true &&
			is_jihad_offensive_active(game) &&
			has_jihad_offensive_attackers(game, attackers)
		) {
			set_jihad_offensive_negate_used(game)
			ignore_trench = true
			jihad_ignore = true
			mark_effected(CC_CP_JIHAD_OFFENSIVE)
			log_detail(log, "圣战进攻：本次战斗忽略战壕和河流惩罚。")
		}

		if (!attempt_flank) {
			let attacking_spaces_count = new Set(attackers.map((p) => game.pieces[p])).size
			if (attacking_spaces_count >= 2) {
				attackers.some((p) => is_lcu(p))
				is_river_defense(game)
				get_defender_trench_level(game, target_space, defender_faction, defenders)
				let defenders_in_space = defenders
				has_undestroyed_fort(game, target_space, defender_faction)
				is_besieged(game, target_space) && defenders_in_space.length > 0
			}
		}

		// 5. Event DRMs
		if (game.active === AP) {
			let is_ru_attacking = attackers.some((p) => piece_counts_as_nation_for_rule(game, p, "ru"))
			if (is_ru_attacking) {
				if (is_turn_event(game, "kitchener")) {
					if (is_caucasus(target_space)) {
						att_drm += 1
						log_detail(log, "基钦纳: +1 DRM")
					}
				}
				if (is_russian_winter_offensive_active(game)) {
					att_drm += 1
					log_detail(log, "俄国冬季攻势: +1 DRM")
				}
			}
		} else if (game.active === CP) {
			let is_tu_attacking = attackers.some(
				(p) => piece_counts_as_nation_for_rule(game, p, "tu") || piece_counts_as_nation_for_rule(game, p, "tua")
			)
			if (is_tu_attacking && is_yildrim_offensive_active(game)) {
				att_drm += 1
				log_detail(log, "耶尔德里姆攻势：TU/TU-A攻击+1 DRM")
			}
			if (
				is_tu_attacking &&
				is_jihad_offensive_active(game) &&
				!combat_card_played(game, "attacker", CC_CP_JIHAD_OFFENSIVE)
			) {
				att_drm += 1
				mark_effected(CC_CP_JIHAD_OFFENSIVE)
				log_detail(log, "圣战攻势：TU/TU-A攻击+1 DRM")
			}
			// 67: LIBERATE SUEZ - Attacks in Egypt get +1 DRM
			if (game.liberate_suez_drm && Engine.map.is_egypt(target_space) && game.active === CP) {
				att_drm += 1
				log_detail(log, "解放苏伊士：在埃及的攻击+1 DRM")
			}
			// 69: INDIAN MUTINY - Attacks against Indian units get +1 DRM
			if (game.indian_mutiny_drm && game.active === CP) {
				let has_indian_defenders = defenders.some((p) => piece_counts_as_nation_for_rule(game, p, "in"))
				if (has_indian_defenders) {
					att_drm += 1
					log_detail(log, "印度哗变：对印度部队的攻击+1 DRM")
				}
			}
			if (game.cc_jafar_pasha && game.cc_jafar_pasha.post_roll && game.active === CP) {
				mark_effected(CC_CP_JAFAR_PASHA)
			}
		}

		// 7. Cavalry / Camel / Armored Car Bonus
		// Rule 3.2.9: +1 DRM if you have one and the opponent doesn't. Not applicable if combat involves a Beachhead.
		let involves_beachhead = false
		if (game.beachheads) {
			involves_beachhead =
				set_has(game.beachheads, target_space) ||
				attackers.some((p) => set_has(game.beachheads, game.pieces[p]))
		}

		if (!involves_beachhead) {
			let get_special_unit_label = (pieces) => {
				for (let p of pieces) {
					let badge = get_piece_badge(p)
					if (badge === "cavalry") return "骑兵"
					if (badge === "camel") return "骆驼兵"
					if (badge === "armored" || badge === "armor_brigade") return "装甲旅"
				}
				return null
			}

			let att_special_label = get_special_unit_label(attackers)
			let def_special_label = get_special_unit_label(defenders)

			if (att_special_label && !def_special_label) {
				att_drm += 1
				log_detail(log, `${att_special_label}: 进攻方 +1 DRM`)
			} else if (def_special_label && !att_special_label) {
				def_drm += 1
				log_detail(log, `${def_special_label}: 防守方 +1 DRM`)
			}
		}

		// 8. Alpenkorps Bonus
		// +1 DRM if attacking into mountains or defending in mountains
		let is_mountain = target_terrain === MOUNTAIN
		if (is_mountain) {
			let att_has_alpenkorps = attackers.some((p) => data.pieces[p] && data.pieces[p].name === "GE Alpenkorps")
			let def_has_alpenkorps = defenders.some((p) => data.pieces[p] && data.pieces[p].name === "GE Alpenkorps")
			if (att_has_alpenkorps) {
				att_drm += 1
				log_detail(log, "Alpenkorps：进攻方位于，山地+1 DRM")
			}
			if (def_has_alpenkorps) {
				def_drm += 1
				log_detail(log, "Alpenkorps：防守方位于山地，+1 DRM")
			}
		}

		if (game.combat_cards) {
			if (game.combat_cards.attacker) {
				for (let c of game.combat_cards.attacker) {
					let bonus = get_combat_card_drm(c, "attacker", game, attackers, defenders)
					let penalty = get_combat_card_penalty(c, "attacker", game, attackers, defenders)
					att_drm += bonus
					def_drm -= penalty
					if (bonus !== 0 || penalty !== 0) {
						mark_effected(c)
						if (c === CC_CP_JIHAD_OFFENSIVE && bonus !== 0) {
							log_detail(log, "圣战攻势CC：TU/TU-A攻击+1 DRM")
						}
					}
				}
			}
			if (game.combat_cards.defender) {
				for (let c of game.combat_cards.defender) {
					let bonus = get_combat_card_drm(c, "defender", game, attackers, defenders)
					let penalty = get_combat_card_penalty(c, "defender", game, attackers, defenders)
					def_drm += bonus
					att_drm -= penalty
					if (bonus !== 0 || penalty !== 0) {
						mark_effected(c)
					}
				}
			}
		}

		let att_final_roll = Math.max(1, Math.min(6, att_roll + att_drm))
		let def_final_roll = Math.max(1, Math.min(6, def_roll + def_drm))

		// Shifts
		let att_shifts = 0
		let def_shifts = 0
		let att_shift_factors = []
		let def_shift_factors = []

		if (!ignore_terrain) {
			if (target_terrain === MOUNTAIN) {
				att_shifts -= 1
				att_shift_factors.push("-1 山地")
			}
			if (target_terrain === SWAMP) {
				att_shifts -= 1
				att_shift_factors.push("-1 沼泽")
			}
			// PUG Rule: Desert shifts attacker 1 left if attacking INTO or FROM desert
			let target_is_desert = target_terrain === "desert"
			let attacker_from_desert = attackers.some((p) => data.spaces[game.pieces[p]].terrain === "desert")

			if ((target_is_desert || attacker_from_desert) && !ignore_desert) {
				att_shifts -= 1
				att_shift_factors.push("-1 沙漠")
			}

			if (all_crossing_strait && !jihad_ignore) {
				att_shifts -= 1
				att_shift_factors.push("-1 河流/海峡进攻")
				def_fire_first = true
				log_detail(log, "跨河/海进攻：进攻方火力列左移1列，防守方先开火")
			}
		}

		// PUG Rule: Trench shifts attacker 1 left, defender 1 right
		let trench_level = get_defender_trench_level(game, target_space, defender_faction, defenders)

		if (trench_bonus_cp > 0) {
			if (trench_level === 0) trench_level = 1
			else if (trench_level === 1) trench_level = 2
		}

		if (trench_level > 0 && !ignore_trench) {
			att_shifts -= trench_level
			att_shift_factors.push(`-${trench_level} 战壕`)
			def_shifts += 1
			def_shift_factors.push("+1 战壕")
			if (
				game.combat_cards &&
				game.combat_cards.defender &&
				game.combat_cards.defender.includes(CC_CP_I_ORDER_YOU_TO_DIE)
			) {
				mark_effected(CC_CP_I_ORDER_YOU_TO_DIE)
			}
		}

		// Resolve Fire (Sequential or Simultaneous)
		let att_losses
		let def_losses = 0
		let att_table_type = att_table === fire_table.lcu ? "lcu" : "scu"
		let def_table_type = def_table === fire_table.lcu ? "lcu" : "scu"
		let fmt_shift_factors = (factors) => (factors.length > 0 ? factors.join("，") : "无")
		log(`**火力列位移：**`)
		log(`>> 进攻方：${fmt_shift_factors(att_shift_factors)}`)
		log(`>> 防守方：${fmt_shift_factors(def_shift_factors)}`)

		// Combat Card Loss Modifiers
		let att_loss_mod = 0
		let def_loss_mod = 0

		if (
			game.combat_cards &&
			game.combat_cards.attacker &&
			game.combat_cards.attacker.includes(CC_AP_NO_PRISONERS) &&
			no_prisoners_applies(attackers)
		) {
			att_loss_mod += 1
			def_loss_mod -= 1
			mark_effected(CC_AP_NO_PRISONERS)
			log_detail(log, "不留活口：进攻方伤害+1，防守方伤害-1")
		}

		function log_fire(faction, cf, roll, drm, losses, table, shifts) {
			let col = find_fire_column(table === fire_table.lcu ? "lcu" : "scu", cf, shifts)
			let name = faction === game.active ? "进攻方" : "防守方"
			log(`**${name}开火 (${cf} CF)：**`)
			log(`> ${fmt_roll(roll, drm, faction)} × ${col.name} = ${losses}`)
		}

		if (att_fire_first) {
			def_losses = get_fire_result(att_table_type, att_cf, att_shifts, att_final_roll)
			def_losses += att_loss_mod
			if (def_losses < 0) def_losses = 0
			log_fire(game.active, att_cf, att_roll, att_drm, def_losses, att_table, att_shifts)
			apply_turkish_retreat_loss_reduction()

			// Defender fire is pending
			att_losses = 0
		} else if (def_fire_first) {
			att_losses = get_fire_result(def_table_type, def_cf, def_shifts, def_final_roll)
			att_losses += def_loss_mod
			if (att_losses < 0) att_losses = 0
			log_fire(other_faction(game.active), def_cf, def_roll, def_drm, att_losses, def_table, def_shifts)

			// Attacker fire is pending
			def_losses = 0
			apply_turkish_retreat_loss_reduction()
		} else {
			// Simultaneous
			def_losses = get_fire_result(att_table_type, att_cf, att_shifts, att_final_roll)
			def_losses += att_loss_mod
			if (def_losses < 0) def_losses = 0
			log_fire(game.active, att_cf, att_roll, att_drm, def_losses, att_table, att_shifts)

			att_losses = get_fire_result(def_table_type, def_cf, def_shifts, def_final_roll)
			att_losses += def_loss_mod
			if (att_losses < 0) att_losses = 0
			log_fire(other_faction(game.active), def_cf, def_roll, def_drm, att_losses, def_table, def_shifts)
			apply_turkish_retreat_loss_reduction()
		}

		function apply_turkish_retreat_loss_reduction() {
			if (turkish_retreat_active && def_losses > 0 && !turkish_loss_reduction_logged) {
				def_losses -= 1
				log("土耳其撤退：防守方损失-1")
				turkish_loss_reduction_logged = true
			}
		}

		if (!att_fire_first && !def_fire_first) {
			if (def_losses > att_losses) {
				log(`*${def_losses}:${att_losses} 进攻方获胜`)
			} else if (att_losses > def_losses) {
				log(`*${def_losses}:${att_losses} 防守方获胜`)
			} else {
				log(`*${def_losses}:${att_losses} 平局`)
			}
		}

		// Return results for rules.js to handle post-combat (MO, Retreat)
		let retreat_needed = false
		let retreating_faction = null
		let retreating_units = []
		let retreat_can_cancel = false
		let no_advance = false
		let no_retreat = false
		let catastrophic_attack = false
		let retreat_distance = 1
		let turkish_retreat = false
		let turkish_retreat_units = []
		let turkish_retreat_optional_units = []
		let turkish_retreat_defender_retreats = false
		let advance_with_reduced = false

		// Only the defender retreats if they lose (take more hits than they dealt).
		if (def_losses > att_losses && !is_region(game, target_space)) {
			retreat_needed = true
			retreating_faction = other_faction(game.active) // Defender retreats
			let loss_diff = def_losses - att_losses
			retreat_distance = loss_diff >= 2 ? 2 : 1
			retreating_units = get_combat_defenders(game, target_space, retreating_faction)

			// Rule 16.3.3: Yudenitch HQ negates ONE space of retreat for RU units
			if (retreating_faction === AP) {
				let pieces_in_space = get_pieces_in_space(game, target_space)
				let has_yudenitch = pieces_in_space.some(
					(p) => data.pieces[p].name === "RU Yudenitch HQ" && !is_eliminated(game, p)
				)
				let has_ru_units = pieces_in_space.some(
					(p) => data.pieces[p].nation === "ru" && !is_hq(p) && !is_eliminated(game, p)
				)
				if (has_yudenitch && has_ru_units) {
					retreat_distance -= 1
					if (retreat_distance <= 0) {
						retreat_needed = false
						log("尤登尼奇：无需撤退")
					} else {
						log("尤登尼奇：仍需撤退1格")
					}
				}
			}
		}

		if (
			game.combat_cards &&
			game.combat_cards.defender &&
			game.combat_cards.defender.includes(CC_CP_WATER_SHORTAGE)
		) {
			let area = Engine.map.get_area(target_space)
			if (area === "mesopotamia" || area === "syria_palestine" || area === "sinai") {
				no_advance = true
				no_retreat = true
				log("淡水缺乏：获胜的协约国部队战斗后无法挺进，战败的同盟国部队无需撤退。")
			}
		}

		if (no_retreat) {
			retreat_needed = false
			retreating_faction = null
			retreating_units = []
		}

		if (retreat_needed) {
			retreat_can_cancel = can_cancel_defender_retreat(game, target_space, retreating_faction, retreating_units)
		}

		if (turkish_retreat_active) {
			turkish_retreat = true
			advance_with_reduced = true // Rule 12.8.3: AP may advance with reduced units
			let cp_defenders = get_cp_defenders(game, defenders)
			let mandatory = []
			let optional

			// Rule 12.3:
			// If Allies win, all CP units in space must retreat 1.
			if (retreat_needed && retreating_faction === CP) {
				mandatory = cp_defenders
				optional = []
				retreat_distance = 1
				retreating_units = cp_defenders
			} else {
				// If Allies didn't win, or CP was the attacker:
				// Turkish SCUs must retreat, others may optionally retreat.
				mandatory = cp_defenders.filter(
					(p) =>
						(get_piece_nation(p) === "tu" || get_piece_nation(p) === "tua") && get_piece_class(p) === "SCU"
				)
				optional = cp_defenders.filter((p) => !mandatory.includes(p))
				turkish_retreat_defender_retreats = true
			}

			turkish_retreat_units = mandatory
			turkish_retreat_optional_units = optional
			retreat_can_cancel = false
		}

		if (
			defender_faction === CP &&
			game.combat_cards &&
			game.combat_cards.defender &&
			game.combat_cards.defender.includes(CC_CP_CATASTROPHIC_ATTACK) &&
			get_catastrophic_attack_stack_options(game).length > 0 &&
			att_losses > def_losses
		) {
			catastrophic_attack = true
			turkish_retreat = false
			turkish_retreat_units = []
			turkish_retreat_optional_units = []
			turkish_retreat_defender_retreats = false
			advance_with_reduced = true
		}

		return {
			att_fire_result: def_losses,
			def_fire_result: att_losses,
			attacker_losses: att_losses, // losses suffered by attacker
			defender_losses: def_losses, // losses suffered by defender
			attackers: attackers,
			defenders: defenders,
			jafar_pasha_retreat: !!game.attack?.jafar_pasha_retreat_before_fort,
			att_fire_first,
			def_fire_first,
			att_roll,
			def_roll,
			att_final_roll,
			def_final_roll,
			att_cf,
			def_cf,
			att_table_type,
			def_table_type,
			att_shifts,
			def_shifts,
			att_drm,
			def_drm,
			att_loss_mod,
			def_loss_mod,
			retreat_needed,
			retreating_faction,
			retreating_units,
			retreat_can_cancel,
			retreat_distance,
			no_advance,
			catastrophic_attack,
			turkish_retreat,
			turkish_retreat_units,
			turkish_retreat_optional_units,
			turkish_retreat_defender_retreats,
			advance_with_reduced,
			used_hqs,
			used_arty
		}
	}

	function get_jafar_pasha_reroll_side(game, request) {
		let side = request && typeof request === "object" ? request.side : null
		let faction = request && typeof request === "object" ? request.faction : request
		if (side === "attacker" || side === "defender") return side
		if (faction === game.attack?.attacker) return "attacker"
		if (faction === game.attack?.defender) return "defender"
		return null
	}

	function recompute_jafar_pasha_reroll_outcome(game, result, log) {
		let target_space = game.attack.space
		let defender_faction = game.attack.defender || other_faction(game.attack.attacker || game.active)
		let suffered_by_attacker = result.attacker_losses
		let suffered_by_defender = result.defender_losses

		if (suffered_by_defender > suffered_by_attacker) {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 进攻方获胜`)
		} else if (suffered_by_attacker > suffered_by_defender) {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 防守方获胜`)
		} else {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 平局`)
		}

		result.retreat_needed = false
		result.retreating_faction = null
		result.retreating_units = []
		result.retreat_can_cancel = false

		if (suffered_by_defender > suffered_by_attacker && !is_region(game, target_space)) {
			result.retreat_needed = true
			result.retreating_faction = defender_faction
			let loss_diff = suffered_by_defender - suffered_by_attacker
			result.retreat_distance = loss_diff >= 2 ? 2 : 1
			result.retreating_units = result.defenders || get_combat_defenders(game, target_space, defender_faction)
		}

		if (combat_card_played(game, "defender", CC_CP_WATER_SHORTAGE)) {
			let area = Engine.map.get_area(target_space)
			if (area === "mesopotamia" || area === "syria_palestine" || area === "sinai") {
				result.no_advance = true
				cancel_cp_retreat_result(game, result)
			}
		}

		if (result.retreat_needed) {
			result.retreat_can_cancel = can_cancel_defender_retreat(
				game,
				target_space,
				result.retreating_faction,
				result.retreating_units
			)
		}

		if (game.turkish_retreat) {
			result.turkish_retreat = true
			result.advance_with_reduced = true
			let cp_defenders = get_combat_defenders(game, target_space, CP)
			if (result.retreat_needed && result.retreating_faction === CP) {
				result.retreat_distance = 1
				result.retreating_units = cp_defenders
				result.turkish_retreat_units = cp_defenders
				result.turkish_retreat_optional_units = []
				result.turkish_retreat_defender_retreats = false
			} else {
				let mandatory = cp_defenders.filter(
					(p) =>
						(data.pieces[p].nation === "tu" || data.pieces[p].nation === "tua") &&
						data.pieces[p].piece_class === "SCU"
				)
				result.turkish_retreat_units = mandatory
				result.turkish_retreat_optional_units = cp_defenders.filter((p) => !mandatory.includes(p))
				result.turkish_retreat_defender_retreats = true
			}
			result.retreat_can_cancel = false
		}

		result.catastrophic_attack = false
		if (
			game.attack?.defender === CP &&
			combat_card_played(game, "defender", CC_CP_CATASTROPHIC_ATTACK) &&
			get_catastrophic_attack_stack_options(game).length > 0 &&
			suffered_by_attacker > suffered_by_defender
		) {
			result.catastrophic_attack = true
			result.turkish_retreat = false
			result.turkish_retreat_units = []
			result.turkish_retreat_optional_units = []
			result.turkish_retreat_defender_retreats = false
			result.advance_with_reduced = true
		}
	}

	function reroll_jafar_pasha_combat_die(game, request, log_fn) {
		if (!game.attack || !game.battle_result) return false
		let result = game.battle_result
		let side = get_jafar_pasha_reroll_side(game, request)
		if (side !== "attacker" && side !== "defender") return false

		const log = (msg) => {
			if (log_fn) log_fn(msg)
		}

		let roll_key = side === "attacker" ? "att_roll" : "def_roll"
		let final_key = side === "attacker" ? "att_final_roll" : "def_final_roll"
		let drm_key = side === "attacker" ? "att_drm" : "def_drm"
		let cf_key = side === "attacker" ? "att_cf" : "def_cf"
		let table_key = side === "attacker" ? "att_table_type" : "def_table_type"
		let shifts_key = side === "attacker" ? "att_shifts" : "def_shifts"
		let loss_mod_key = side === "attacker" ? "att_loss_mod" : "def_loss_mod"
		let old_roll = result[roll_key]
		let new_roll = roll_die(6, game)
		let drm = result[drm_key] || 0
		let final_roll = Math.max(1, Math.min(6, new_roll + drm))
		let cf = result[cf_key]
		if (cf === undefined) {
			let pieces = side === "attacker" ? result.attackers || [] : result.defenders || []
			cf = pieces.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
		}
		let table_type = result[table_key] || "scu"
		let losses = get_fire_result(table_type, cf, result[shifts_key] || 0, final_roll)
		losses += result[loss_mod_key] || 0
		if (losses < 0) losses = 0
		if (side === "attacker" && result.turkish_retreat && losses > 0) losses -= 1

		result[roll_key] = new_roll
		result[final_key] = final_roll
		if (side === "attacker") {
			result.att_fire_result = losses
			result.defender_losses = losses
			game.attack.defender_losses = losses
		} else {
			result.def_fire_result = losses
			result.attacker_losses = losses
			game.attack.attacker_losses = losses
		}

		let label = side === "attacker" ? "进攻方" : "防守方"
		let new_roll_log = drm === 0 ? `${new_roll}` : `${new_roll}${drm > 0 ? "+" : ""}${drm}=${final_roll}`
		log_detail(log, `贾法尔帕夏：${label}重掷，${old_roll} -> ${new_roll_log}`)
		mark_combat_card_effected(game, CC_CP_JAFAR_PASHA)
		recompute_jafar_pasha_reroll_outcome(game, result, log)
		return true
	}

	function resolve_second_fire(game, log_fn) {
		let result = game.battle_result
		if (!result) return
		let target_space = game.attack.space

		const log = (msg) => {
			if (log_fn) log_fn(msg)
		}

		function log_fire(faction, cf, roll, drm, losses, table, shifts) {
			let col = find_fire_column(table === fire_table.lcu ? "lcu" : "scu", cf, shifts)
			let name = faction === game.active ? "进攻方" : "防守方"
			log(`**${name}开火 (${cf} CF)：**`)
			log(`> ${fmt_roll(roll, drm, faction)} × ${col.name} = ${losses}`)
		}

		if (result.att_fire_first) {
			// Defender fires now (hits on attacker)
			let defenders = get_combat_defenders(game, target_space, other_faction(game.active))
			let def_cf = defenders.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
			if (has_undestroyed_fort(game, target_space, other_faction(game.active))) {
				def_cf += data.spaces[target_space].fort || 0
			}
			let def_table = defenders.some((p) => is_lcu(p)) ? fire_table.lcu : fire_table.scu
			let def_table_type = def_table === fire_table.lcu ? "lcu" : "scu"
			let def_roll = result.def_roll
			let def_final_roll = result.def_final_roll

			let att_losses = get_fire_result(def_table_type, def_cf, result.def_shifts, def_final_roll)
			att_losses += result.def_loss_mod
			if (att_losses < 0) att_losses = 0

			log_fire(
				other_faction(game.active),
				def_cf,
				def_roll,
				result.def_drm,
				att_losses,
				def_table,
				result.def_shifts
			)

			game.attack.attacker_losses = att_losses
			result.def_fire_result = att_losses
			result.attacker_losses = att_losses
		} else if (result.def_fire_first) {
			// Attacker fires now (hits on defender)
			let attackers = game.attack.pieces.filter((p) => !is_eliminated(game, p))
			let att_cf = attackers.reduce((sum, p) => sum + get_piece_cf(game, p), 0)
			let att_table = attackers.some((p) => is_lcu(p)) ? fire_table.lcu : fire_table.scu
			let att_table_type = att_table === fire_table.lcu ? "lcu" : "scu"
			let att_roll = result.att_roll
			let att_final_roll = result.att_final_roll

			let def_losses = get_fire_result(att_table_type, att_cf, result.att_shifts, att_final_roll)
			def_losses += result.att_loss_mod
			if (def_losses < 0) def_losses = 0

			log_fire(
				game.active,
				att_cf,
				att_roll,
				result.att_drm,
				def_losses,
				att_table,
				result.att_shifts
			)

			// Turkish Retreat check after attacker fire
			let defenders = get_combat_defenders(game, target_space, other_faction(game.active))
			if (is_turkish_retreat_active(game, defenders) && def_losses > 0) {
				def_losses -= 1
				log("土耳其撤退：防守方受到伤害-1.")
			}

			game.attack.defender_losses = def_losses
			result.att_fire_result = def_losses
			result.defender_losses = def_losses
		}

		// Recalculate victory/draw
		let suffered_by_attacker = result.attacker_losses
		let suffered_by_defender = result.defender_losses

		if (suffered_by_defender > suffered_by_attacker) {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 进攻方获胜`)
		} else if (suffered_by_attacker > suffered_by_defender) {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 防守方获胜`)
		} else {
			log(`*${suffered_by_defender}:${suffered_by_attacker} 平局`)
		}

		// Recalculate retreat and Turkish Retreat
		if (suffered_by_defender > suffered_by_attacker && !is_region(game, target_space)) {
			result.retreat_needed = true
			result.retreating_faction = other_faction(game.active)
			let loss_diff = suffered_by_defender - suffered_by_attacker
			result.retreat_distance = loss_diff >= 2 ? 2 : 1
			result.retreating_units = get_combat_defenders(game, target_space, result.retreating_faction)

			// Rule 16.3.3: Yudenitch HQ negates ONE space of retreat for RU units
			if (result.retreating_faction === AP) {
				let pieces_in_space = get_pieces_in_space(game, target_space)
				let has_yudenitch = pieces_in_space.some(
					(p) => data.pieces[p].name === "RU Yudenitch HQ" && !is_eliminated(game, p)
				)
				let has_ru_units = pieces_in_space.some(
					(p) => data.pieces[p].nation === "ru" && !is_hq(p) && !is_eliminated(game, p)
				)
				if (has_yudenitch && has_ru_units) {
					result.retreat_distance -= 1
					if (result.retreat_distance <= 0) {
						result.retreat_needed = false
						log("尤登尼奇：无需撤退")
					} else {
						log("尤登尼奇：仍需撤退1格")
					}
				}
			}
		} else {
			result.retreat_needed = false
			result.retreating_faction = null
			result.retreating_units = []
		}

		if (game.turkish_retreat) {
			result.turkish_retreat = true
			result.advance_with_reduced = true // Rule 12.8.3: AP may advance with reduced units
			let cp_defenders = get_combat_defenders(game, target_space, CP)
			let mandatory = []
			let optional

			if (result.retreat_needed && result.retreating_faction === CP) {
				mandatory = cp_defenders
				optional = []
				result.retreat_distance = 1
				result.retreating_units = cp_defenders
			} else {
				mandatory = cp_defenders.filter(
					(p) =>
						(data.pieces[p].nation === "tu" || data.pieces[p].nation === "tua") &&
						data.pieces[p].piece_class === "SCU"
				)
				optional = cp_defenders.filter((p) => !mandatory.includes(p))
				result.turkish_retreat_defender_retreats = true
			}

			result.turkish_retreat_units = mandatory
			result.turkish_retreat_optional_units = optional
			result.retreat_can_cancel = false
		}

		if (
			game.attack?.defender === CP &&
			game.combat_cards &&
			game.combat_cards.defender &&
			game.combat_cards.defender.includes(CC_CP_CATASTROPHIC_ATTACK) &&
			get_catastrophic_attack_stack_options(game).length > 0 &&
			suffered_by_attacker > suffered_by_defender
		) {
			result.catastrophic_attack = true
			result.turkish_retreat = false
			result.turkish_retreat_units = []
			result.turkish_retreat_optional_units = []
			result.turkish_retreat_defender_retreats = false
			result.advance_with_reduced = true
		}
	}

	function refresh_post_battle_defender_retreat(game) {
		let result = game.battle_result
		if (!result || !game.attack || !(game.attack.space > 0)) return

		// Post-battle cards like Reserves to the Front can rebuild/restore defenders
		// after the initial result was computed, so retreat eligibility must be recalculated.

		let defender_faction = game.attack.defender
		if (defender_faction === undefined || defender_faction === null) {
			defender_faction = other_faction(game.attack.attacker ?? game.active)
		}
		if (defender_faction !== CP) return

		let target_space = game.attack.space
		let defenders_in_space = get_combat_defenders(game, target_space, defender_faction)
		let attacker_has_full_strength_unit = attacker_has_retreat_forcing_unit(game, result, target_space)
		let attacker_won = result.defender_losses > result.attacker_losses
		let can_defender_retreat = attacker_won && attacker_has_full_strength_unit && !is_region(target_space)

		if (result.turkish_retreat) {
			let mandatory = []
			let optional = []

			if (can_defender_retreat) {
				result.retreat_needed = defenders_in_space.length > 0
				result.retreating_faction = defender_faction
				result.retreating_units = defenders_in_space.slice()
				result.retreat_distance = 1
				mandatory = defenders_in_space.slice()
				result.turkish_retreat_defender_retreats = false
			} else {
				mandatory = defenders_in_space.filter(
					(p) =>
						(get_piece_nation(p) === "tu" || get_piece_nation(p) === "tua") && get_piece_class(p) === "SCU"
				)
				optional = defenders_in_space.filter((p) => !mandatory.includes(p))
				result.turkish_retreat_defender_retreats = true
			}

			result.turkish_retreat_units = mandatory
			result.turkish_retreat_optional_units = optional
			result.retreat_can_cancel = false

			if (mandatory.length > 0 || optional.length > 0) {
				game.turkish_retreat_pending = true
				game.turkish_retreat_space = target_space
				game.turkish_retreat_mandatory = mandatory
				game.turkish_retreat_optional = optional
			} else {
				clear_turkish_retreat_state(game)
			}
			return
		}

		if (!can_defender_retreat) {
			result.retreat_needed = false
			result.retreating_faction = null
			result.retreating_units = []
			result.retreat_can_cancel = false
			return
		}

		result.retreat_needed = defenders_in_space.length > 0
		result.retreating_faction = defender_faction
		result.retreating_units = defenders_in_space.slice()
		result.retreat_can_cancel = false

		if (defenders_in_space.length === 0) return

		result.retreat_can_cancel = can_cancel_defender_retreat(
			game,
			target_space,
			defender_faction,
			defenders_in_space
		)
	}

	Object.assign(exports, {
		get_piece_name: piece_name,
		get_space_name: space_name,
		get_advance_pieces,
		begin_advance,
		remember_attack_piece_origin,
		get_attack_piece_origin,
		get_catastrophic_attack_stack_options,
		enter_turkish_retreat_state,
		clear_save_tiflis_state,
		clear_catastrophic_attack_state,
		is_advance_stop_terrain,
		set_jihad_offensive_active,
		is_jihad_offensive_active,
		can_offer_jihad_offensive_negate,
		use_jihad_offensive_negate,
		set_yildrim_offensive_active,
		is_yildrim_offensive_active,
		can_offer_yildrim_offensive_trench_negate,
		use_yildrim_offensive_trench_negate,
		get_retreat_distance,
		get_region_defender_candidates,
		get_region_defense_stack_block_reason,
		get_combat_defenders,
		is_water_crossing_attack_edge,
		get_turkish_retreat_space,
		is_turkish_retreat_active,
		finish_turkish_retreat,
		cancel_cp_retreat_result,
		can_cancel_defender_retreat,
		get_valid_retreat_spaces,
		apply_retreat_priorities,
		get_valid_advance_spaces,
		resolve_russian_winter_offensive_advance,
		award_army_of_islam_combat_win_bonus,
		award_army_of_islam_advance_bonus,
		fire_table,
		get_fire_result,
		find_fire_column,
		check_can_flank,
		resolve_battle,
		reroll_jafar_pasha_combat_die,
		resolve_second_fire,
		refresh_post_battle_defender_retreat,
		retreat_units,
		get_piece_cf,
		get_piece_lf,
		apply_losses,
		can_battle_trigger_severe_weather,
		apply_severe_weather,
		has_undestroyed_fort,
		has_trench,
		count_steps,
		is_river_defense,
		can_declare_turkish_retreat,
		is_battle_cancelled_by_cc,
		ensure_balkan_attack_targets,
		reset_balkan_attack_targets,
		is_invalid_multinational_attack,
		apply_balkan_attack_target_restrictions,
		can_piece_stage_black_sea_amphibious_invasion,
		get_black_sea_amphibious_targets,
		is_black_sea_amphibious_invasion,
		resolve_black_sea_amphibious_invasion,
		can_piece_attack_current_fort,
		get_attackable_spaces,
		get_legal_attackable_spaces,
		can_activate_piece_in_space_to_attack,
		can_choose_attack_with_piece,
		get_attack_support_block_reason,
		register_balkan_attack_target,
		get_loss_options,
		is_variable_loss_piece,
		remember_variable_loss_other_unit_hit,
		fmt_attack_odds,
		fmt_attack_odds_with_max,
		find_max_cf_valid_stack,
		start_attack_sequence,
		resolve_flank_attempt,
		resolve_battle_sequence,
		end_battle_sequence,
		apply_fort_destruction,
		update_siege_after_combat_losses,
		mark_broken_siege_if_needed,
		check_offer_ptbp_extra_attack,
		get_ptbp_eligible_units,
		record_combat_card_source,
		has_cancelled_combat_card_dispositions,
		apply_cancelled_combat_card_disposition,
		get_defender_losses_state,
		any_capital_occupied_or_besieged,
		resolve_siege,
		resolve_siege_phase,
		// Export CC constants
		CC_AP_SHORE_BOMBARDMENT,
		CC_AP_ARMENIAN_DRUZHINY,
		CC_AP_PUGNACITY,
		CC_AP_GURKHAS,
		CC_AP_ARMORED_CARS,
		CC_AP_NO_PRISONERS,
		CC_AP_MAUDE,
		CC_AP_ROYAL_FLYING_CORPS,
		CC_AP_TANKS,
		CC_AP_WAR_WEARY_BALKANS,
		CC_AP_MASSED_CAVALRY_CHARGE,
		CC_AP_PUSH_TO_THE_BREAKING_POINT,
		CC_AP_HAVERSACK_RUSE,
		CC_AP_MARCH_AND_COUNTERMARCH,
		CC_CP_RESERVES_TO_FRONT,
		CC_CP_GERMAN_HIGH_COMMAND,
		CC_CP_SANDSTORMS,
		CC_CP_SAVE_TIFLIS,
		CC_CP_SURPRISE,
		CC_CP_JAFAR_PASHA,
		CC_CP_FLIEGERABTEILUNG,
		CC_CP_CATASTROPHIC_ATTACK,
		CC_CP_I_ORDER_YOU_TO_DIE,
		CC_CP_WATER_SHORTAGE,
		CC_CP_PASHA_1,
		CC_CP_CZARS_ARMORIES,
		CC_CP_CONFUSED_ORDERS,
		CC_CP_ARMY_OF_ISLAM,
		CC_CP_JIHAD_OFFENSIVE,
		FORT_LOSS
	})

	return exports
}
