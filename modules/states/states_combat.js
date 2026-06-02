"use strict"

let game

exports.set_globals = function (g) {
	game = g
}

exports.register = function (states, Engine, context) {
	const { data, combat } = Engine
	const combat_cards = Engine.combat_cards
	const { set_has, set_add, set_delete, set_toggle, roll_die } = Engine.utils

	const {
		log,
		push_undo,
		pop_undo,
		clear_undo,
		save_combat_rollback_point,
		active_faction,
		get_attackable_spaces: get_legal_attackable_spaces,
		get_pieces_in_space,
		space_name,
		refresh_attack_eligibility,
		is_scu,
		is_lcu,
		is_rail_connected_to_supply,
		get_connected_spaces,
		is_in_reserve,
		is_eliminated,
		find_space,
		piece_name,
		other_faction,
		set_control,
		goto_end_operations,
		goto_end_action,
		get_cc_retained,
		can_enter_area,
		can_stack_end_in_space,
		eliminate_piece,
		bulls_eye_record_advanced_piece,
		bulls_eye_can_extra_attack,
		bulls_eye_use_extra_attack,
		update_war_status,
		remove_cc_retained,
		add_cc_retained,
		get_cc_retained_after_use,
		discard_card,
		remove_card,
		remove_card_from_hand,
		is_not_on_map,
		move_card_to_removed,
		move_card_to_discard,
		get_season,
		mo,
		reduce_piece,
		get_piece_lf,
		replace_lcu_with_scu,
		count_steps,
		get_advance_pieces,
		get_valid_retreat_spaces,
		get_valid_advance_spaces,
		is_advance_stop_terrain,
		resolve_russian_winter_offensive_advance,
		check_immediate_jihad_rebellion_on_entry,
		update_jihad_level,
		card_name,
		AP,
		CP,
		is_enemy_trench,
		enter_trench
	} = context
	const JERUSALEM = find_space("Jerusalem")

	const UPRISING_MARKER_RULES = [
		{ key: "persian_uprising_markers", enemies: [AP], label: "Persian Uprising" },
		{ key: "armenian_uprising_markers", enemies: [CP], label: "Armenian Uprising" },
		{ key: "soviet_uprising_markers", enemies: [AP, CP], label: "Soviet Uprising" }
	]

	function get_enemy_uprising_marker_rule(s, faction = active_faction()) {
		for (let rule of UPRISING_MARKER_RULES) {
			if (!rule.enemies.includes(faction)) continue
			let markers = game[rule.key]
			if (Array.isArray(markers) && markers.includes(s)) return rule
		}
		return null
	}

	function can_piece_participate_in_marker_removal(p, faction = active_faction()) {
		if (p < 0 || !data.pieces[p]) return false
		if (is_not_on_map(game, p)) return false
		if (set_has(game.moved, p) || set_has(game.attacked, p)) return false
		if (!Engine.game_utils.can_piece_be_activated(p)) return false
		if (Engine.game_utils.get_piece_effective_faction(game, p) !== faction) return false
		let s = game.pieces[p]
		let supply_status = Engine.map.get_supply_status(game, s, faction, p)
		if (supply_status === "OOS") return false
		if (Engine.neutral.is_greek_piece(p)) {
			return (
				Engine.neutral.can_move_piece_for_faction(game, p, faction) ||
				Engine.neutral.can_attack_piece_for_faction(game, p, faction)
			)
		}
		return true
	}

	function get_combat_uprising_marker_removal_units(faction = active_faction()) {
		let spaces = new Set([...(game.activated?.attack || []), ...(game.activated?.attack_egypt || [])])
		let units = []
		for (let s of spaces) {
			if (!get_enemy_uprising_marker_rule(s, faction)) continue
			for (let p of get_pieces_in_space(game, s)) {
				if (can_piece_participate_in_marker_removal(p, faction)) set_add(units, p)
			}
		}
		return units
	}

	function can_selected_attack_pieces_remove_uprising_marker(removal_units = null) {
		if (!game.attack || !Array.isArray(game.attack.pieces) || game.attack.pieces.length !== 1) return false
		let p = game.attack.pieces[0]
		return (removal_units || get_combat_uprising_marker_removal_units()).includes(p)
	}

	function remove_enemy_uprising_marker(s, faction = active_faction()) {
		let rule = get_enemy_uprising_marker_rule(s, faction)
		if (!rule) return null
		game[rule.key] = game[rule.key].filter((marker_space) => marker_space !== s)
		return rule
	}

	function finish_combat_uprising_marker_removal(p, rule, s) {
		if (!Array.isArray(game.attacked)) game.attacked = []
		set_add(game.attacked, p)
		delete game.attack_eligibility_cache
		log(`${piece_name(p)} removes ${rule.label} marker in ${space_name(s)}.`)
		if (game.attack) {
			game.attack.pieces = []
			game.attack.space = -1
		}
		reset_attack_focus()
		refresh_attack_eligibility()
		if (game.eligible_attackers.length > 0 || get_combat_uprising_marker_removal_units().length > 0) {
			game.state = "attack"
		} else {
			game.state = "end_operations"
		}
	}

	function count_beachhead_captured_materiel_bonus() {
		let initial_defenders = (game.attack && game.attack.initial_defenders) || []
		let ap_lcu = 0
		let ap_scu = 0
		for (let p of initial_defenders) {
			if (Engine.game_utils.get_piece_effective_faction(game, p) !== AP) continue
			if (is_lcu(p)) ap_lcu += 1
			else if (is_scu(p)) ap_scu += 1
		}
		return ap_lcu + Math.floor(ap_scu / 3)
	}

	function mark_reserves_to_front_damage(p) {
		if (!game.attack) return
		let nation = Engine.game_utils.get_piece_nation(p)
		if (nation !== "tu" && nation !== "tua") return
		if (!game.attack.reserves_to_front_damaged_pieces) game.attack.reserves_to_front_damaged_pieces = []
		set_add(game.attack.reserves_to_front_damaged_pieces, p)
		if (!game.attack.reserves_to_front_rebuild_space_by_piece) {
			game.attack.reserves_to_front_rebuild_space_by_piece = {}
		}
		if (game.attack.reserves_to_front_rebuild_space_by_piece[p] > 0) return
		let rebuild_space = game.attack.origin_by_piece?.[p]
		if (!(rebuild_space > 0)) rebuild_space = game.pieces[p]
		if (!(rebuild_space > 0) && set_has(game.attack.initial_defenders, p)) rebuild_space = game.attack.space
		if (rebuild_space > 0) game.attack.reserves_to_front_rebuild_space_by_piece[p] = rebuild_space
	}

	function reduce_piece_from_severe_weather(p) {
		mark_reserves_to_front_damage(p)
		reduce_piece(p)
	}

	function can_select_all_attackers() {
		if (game.eligible_attackers.length === 0) return false
		let attacking_from_siege = game.eligible_attackers.some((p) => Engine.map.is_besieged(game, game.pieces[p]))
		if (attacking_from_siege) return false
		return get_attackable_spaces(game.eligible_attackers).length > 0
	}

	function get_liberate_suez_required_attack_spaces() {
		if (!game.liberate_suez_battle_required) return []
		if (Array.isArray(game.liberate_suez_required_attack_spaces)) {
			return game.liberate_suez_required_attack_spaces.filter((s) => s > 0 && data.spaces[s])
		}
		let spaces = []
		if (Array.isArray(game.activated?.attack)) {
			for (let s of game.activated.attack) {
				if (Engine.map.is_egypt(s)) set_add(spaces, s)
			}
		}
		if (Array.isArray(game.activated?.attack_egypt)) {
			for (let s of game.activated.attack_egypt) set_add(spaces, s)
		}
		return spaces
	}

	function can_liberate_suez_piece_still_attack_egypt(p) {
		if (set_has(game.attacked, p)) return false
		if (Array.isArray(game.retreated) && set_has(game.retreated, p)) return false
		if (is_not_on_map(game, p)) return false
		if (Engine.game_utils.get_piece_effective_faction(game, p) !== CP) return false
		if (!is_lcu(p) && !is_scu(p)) return false
		return get_attackable_spaces([p]).some((s) => Engine.map.is_egypt(s))
	}

	function get_pending_liberate_suez_attack_spaces() {
		let pending = []
		for (let s of get_liberate_suez_required_attack_spaces()) {
			let pieces = get_pieces_in_space(game, s)
			if (pieces.some((p) => can_liberate_suez_piece_still_attack_egypt(p))) {
				set_add(pending, s)
			}
		}
		return pending
	}

	function has_pending_liberate_suez_attack() {
		return get_pending_liberate_suez_attack_spaces().length > 0
	}

	function reset_attack_focus() {
		game.where = -1
	}

	function format_piece_log(p, reduced = null) {
		let is_reduced = reduced
		if (is_reduced === null) is_reduced = Engine.game_utils.is_piece_reduced(game, p)
		return piece_name(p, is_reduced)
	}

	function ensure_attack_log_section(flag, title) {
		if (!game.attack) return
		if (game.attack[flag]) return
		log(`**${title}**`)
		game.attack[flag] = true
	}

	function needs_jerusalem_special_rule() {
		if (!game.options?.optional_jerusalem_rule) return false
		if (!game.attack || game.attack.space !== JERUSALEM) return false
		if ((game.attack.pieces?.length || 0) < 3) return false
		if (game.attack.jerusalem_special_resolved) return false
		return !game.events["jerusalem_actual_combat"]
	}

	function apply_jerusalem_battleground_penalty() {
		if (!game.attack || game.attack.jerusalem_battleground_penalty_applied) return
		let attacker = game.attack.attacker || game.active
		let defender = game.attack.defender || other_faction(game.attack.attacker || game.active)
		if (defender === CP) game.vp -= 1
		else game.vp += 1
		if (attacker === AP) {
			update_jihad_level(game, 1)
			log("耶路撒冷变为战区，圣战等级 +1。")
		}
		log(`${defender === CP ? "同盟国" : "协约国"}因将耶路撒冷变为战区而承受 1 VP 惩罚。`)
		game.attack.jerusalem_battleground_penalty_applied = true
	}

	function defer_jerusalem_combat_until_after_jihad_placement() {
		if (game.state !== "jihad_placement") return false
		if (!game.state_stack || game.state_stack.length === 0) return false
		game.state_stack[game.state_stack.length - 1] = {
			state: "jerusalem_continue_after_jihad",
			active: game.attack?.attacker || AP
		}
		return true
	}

	function is_jihad_interrupt_state() {
		return (
			(game.state === "jihad_placement" ||
				game.state === "jihad_removal" ||
				game.state === "jihad_rebellion_check" ||
				game.state === "place_egyptian_rebellion") &&
			game.state_stack &&
			game.state_stack.length > 0
		)
	}

	function set_next_state_after_interrupt(next_state, next_active = game.active) {
		if (is_jihad_interrupt_state()) {
			game.state_stack[game.state_stack.length - 1] = {
				state: next_state,
				active: next_active
			}
		} else {
			game.state = next_state
			if (next_active !== undefined) game.active = next_active
		}
	}

	function enter_jerusalem_withdrawal_advance() {
		let attackers = (game.attack?.pieces || []).filter((p) => !is_not_on_map(game, p))
		let advance_pieces = get_advance_pieces(game, {
			attackers,
			advance_with_reduced: true
		}).filter((p) => set_has(attackers, p))
		if (advance_pieces.length === 0) {
			goto_attack()
			return
		}
		game.advance_pieces = advance_pieces
		game.advance_space = game.attack.space
		game.advance_count = 0
		game.advance_limit = 3
		game.advance_trench_processed = false
		game.active = game.attack?.attacker || game.active
		game.state = "advance"
	}

	states.attack = {
		prompt(res) {
			if (res && res._is_noop) return
			refresh_attack_eligibility()
			let removal_units = get_combat_uprising_marker_removal_units()
			let removal_unit_set = new Set(removal_units)
			let eligible_attacker_set = new Set(game.eligible_attackers)
			if (game.eligible_attackers.length === 0 && removal_units.length === 0) {
				res.prompt("操作完成.")
				res.action("end_action")
				return
			}

			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}
			if (typeof game.where !== "number") {
				game.where = -1
			}

			if (has_pending_liberate_suez_attack()) {
				res.prompt("解放苏伊士：已指定进攻埃及的 CP 单位必须攻击埃及目标，然后才能结束进攻阶段。")
			} else {
				res.prompt("请选择攻击单位和目标")
			}
			let selected_pieces = game.attack.pieces || []
			let prompt_attackable_cache = new Map()
			function get_cached_attackable_spaces(pieces) {
				if (!Array.isArray(pieces) || pieces.length === 0) return []
				let key =
					pieces.length === 1
						? `p:${pieces[0]}`
						: `g:${pieces
								.slice()
								.sort((a, b) => a - b)
								.join(",")}`
				if (!prompt_attackable_cache.has(key)) {
					prompt_attackable_cache.set(key, get_legal_attackable_spaces(pieces))
				}
				return prompt_attackable_cache.get(key)
			}
			if (selected_pieces.length > 0) {
				let selected_spaces = [...new Set(selected_pieces.map((p) => game.pieces[p]).filter((s) => s > 0))]
				if (game.attack.space !== -1) {
					res.where(game.attack.space)
				} else if (selected_spaces.length === 1) {
					res.where(selected_spaces[0])
				} else if (selected_spaces.length > 1) {
					res.where(selected_spaces)
				}
				res.who(selected_pieces)
			}

			if (selected_pieces.length === 0) {
				for (let p of game.eligible_attackers) {
					res.piece(p)
				}
				for (let p of removal_units) {
					if (!eligible_attacker_set.has(p)) res.piece(p)
				}
				if (can_select_all_attackers()) {
					res.action("select_all")
				}
			} else {
				let selected_can_attack = selected_pieces.every((p) => eligible_attacker_set.has(p))
				let selected_targets = selected_can_attack ? get_cached_attackable_spaces(selected_pieces) : []

				let prompted_pieces = new Set()
				for (let p of selected_pieces) {
					if (!eligible_attacker_set.has(p) && !removal_unit_set.has(p)) continue
					res.piece(p)
					prompted_pieces.add(p)
				}
				for (let p of game.eligible_attackers) {
					if (set_has(selected_pieces, p)) {
						if (!prompted_pieces.has(p)) res.piece(p)
						continue
					}
					if (selected_can_attack && get_cached_attackable_spaces([...selected_pieces, p]).length > 0) {
						res.piece(p)
					}
				}

				for (let t of selected_targets) {
					res.space(t)
				}

				if (can_selected_attack_pieces_remove_uprising_marker(removal_units)) {
					res.action("remove_uprising_marker")
				}
				res.action("cancel_selection")
			}

			res.action("end_attack")
		},
		piece(p) {
			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}
			if (!game.attack.pieces) {
				game.attack.pieces = []
			}
			let is_selected = set_has(game.attack.pieces, p)
			if (!is_selected) {
				let removal_units = get_combat_uprising_marker_removal_units()
				let eligible_attacker_set = new Set(game.eligible_attackers)
				let is_eligible_attacker = eligible_attacker_set.has(p)
				let is_removal_unit = removal_units.includes(p)
				if (!is_eligible_attacker && !is_removal_unit) return
				if (!is_eligible_attacker && game.attack.pieces.length > 0) return
				if (is_eligible_attacker && game.attack.pieces.some((q) => !eligible_attacker_set.has(q))) return
			}
			if (game.attack.pieces.length === 0) push_undo()
			set_toggle(game.attack.pieces, p)
			game.attack.space = -1
		},
		space(s) {
			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}

			let selected_pieces = game.attack.pieces || []
			if (selected_pieces.length === 0) {
				return
			}

			let targets = get_attackable_spaces(selected_pieces)
			if (!targets.includes(s)) {
				return
			}

			push_undo()
			game.attack.space = s
			game.state = "confirm_attack"
		},
		remove_uprising_marker() {
			if (!can_selected_attack_pieces_remove_uprising_marker()) return
			let p = game.attack.pieces[0]
			let s = game.pieces[p]
			push_undo()
			let rule = remove_enemy_uprising_marker(s)
			if (!rule) return
			finish_combat_uprising_marker_removal(p, rule, s)
		},
		select_all() {
			refresh_attack_eligibility()
			if (!can_select_all_attackers()) return
			if (!game.attack) {
				game.attack = { pieces: [], space: -1 }
			}
			if (!Array.isArray(game.attack.pieces)) {
				game.attack.pieces = []
			}
			push_undo()
			for (let p of game.eligible_attackers) {
				set_add(game.attack.pieces, p)
			}
			reset_attack_focus()
			game.attack.space = -1
		},
		cancel_selection() {
			push_undo()
			if (game.attack) {
				game.attack.pieces = []
				game.attack.space = -1
			}
			reset_attack_focus()
		},
		end_attack() {
			refresh_attack_eligibility()
			if (has_pending_liberate_suez_attack()) {
				log("解放苏伊士：已指定进攻埃及的 CP 单位仍有合法埃及目标，不能结束进攻阶段。")
				game.state = "attack"
				return
			}
			if (game.event_romania_attack_required && game.eligible_attackers.length > 0) {
				log("罗马尼亚：必须用该事件完成一次攻击，不能结束进攻阶段。")
				game.state = "attack"
				return
			}
			push_undo()
			if (game.attack) {
				delete game.attack
			}
			reset_attack_focus()
			refresh_attack_eligibility()
			if (game.eligible_attackers.length > 0) {
				game.state = "confirm_pass_attack"
			} else {
				game.state = "end_operations"
			}
		}
	}

	function get_region_defender_choice_factions() {
		let attacker = game.attack?.attacker ?? active_faction()
		let defender = game.attack?.defender ?? other_faction(attacker)
		return { attacker, defender }
	}

	function begin_region_defender_stack_choice_if_needed() {
		if (!game.attack || !Engine.map.is_region(game, game.attack.space)) return false
		let { attacker, defender } = get_region_defender_choice_factions()
		let candidates = combat.get_region_defender_candidates(game, game.attack.space, defender)
		if (candidates.length === 0) return false
		let reason = combat.get_region_defense_stack_block_reason(game, game.attack.space, candidates, defender)
		if (!reason) {
			game.attack.region_defenders = candidates.slice()
			return false
		}
		game.attack.attacker = attacker
		game.attack.defender = defender
		game.attack.region_defenders = []
		game.region_defender_choice_prev_active = game.active
		game.active = defender
		game.state = "choose_region_defender_stack"
		return true
	}

	function confirm_region_defender_stack_selection() {
		let { attacker, defender } = get_region_defender_choice_factions()
		let selected = Array.isArray(game.attack?.region_defenders) ? game.attack.region_defenders : []
		if (combat.get_region_defense_stack_block_reason(game, game.attack.space, selected, defender)) return false
		delete game.region_defender_choice_prev_active
		game.active = attacker
		save_combat_rollback_point()
		clear_undo()
		start_attack_sequence()
		return true
	}

	states.confirm_attack = {
		prompt(res) {
			if (!game.attack) {
				res.prompt("无效的攻击状态.")
				res.action("cancel")
				return
			}
			res.where(game.attack.space)
			res.who(game.attack.pieces)
			if (combat.is_black_sea_amphibious_invasion(game)) {
				res.prompt("确认黑海两栖突袭")
			} else {
				let odds = fmt_attack_odds(game)
				if (odds) {
					res.prompt(`确认攻击: ${odds}`)
				} else {
					res.prompt("确认攻击")
				}
			}
			res.action("confirm")
			res.action("cancel")
		},
		confirm() {
			if (begin_region_defender_stack_choice_if_needed()) return
			save_combat_rollback_point()
			clear_undo()
			start_attack_sequence()
		},
		cancel() {
			push_undo()
			game.attack.space = -1
			game.state = "attack"
		}
	}

	states.choose_region_defender_stack = {
		prompt(res) {
			if (!game.attack || !Engine.map.is_region(game, game.attack.space)) {
				res.prompt("Invalid Region defense selection.")
				res.action("cancel")
				return
			}
			let { defender } = get_region_defender_choice_factions()
			let candidates = combat.get_region_defender_candidates(game, game.attack.space, defender)
			let selected = Array.isArray(game.attack.region_defenders) ? game.attack.region_defenders : []
			res.where(game.attack.space)
			res.who(selected)
			let odds = combat.fmt_attack_odds_with_max(game)
			if (odds) {
				res.prompt(`选择防御堆叠: ${odds}`)
			} else {
				res.prompt("选择防御堆叠")
			}
			for (let p of candidates) res.piece(p)
			if (!combat.get_region_defense_stack_block_reason(game, game.attack.space, selected, defender)) {
				res.action("confirm")
			}
			if (selected.length > 0) res.action("clear")
			res.action("cancel")
		},
		piece(p) {
			if (!game.attack || !Engine.map.is_region(game, game.attack.space)) return
			let { defender } = get_region_defender_choice_factions()
			let candidates = combat.get_region_defender_candidates(game, game.attack.space, defender)
			if (!candidates.includes(p)) return
			push_undo()
			if (!Array.isArray(game.attack.region_defenders)) game.attack.region_defenders = []
			set_toggle(game.attack.region_defenders, p)
		},
		clear() {
			if (!game.attack) return
			push_undo()
			game.attack.region_defenders = []
		},
		confirm() {
			confirm_region_defender_stack_selection()
		},
		cancel() {
			push_undo()
			delete game.attack.region_defenders
			let prev = game.region_defender_choice_prev_active
			delete game.region_defender_choice_prev_active
			game.active = prev ?? game.attack?.attacker ?? active_faction()
			game.state = "confirm_attack"
		}
	}

	states.confirm_pass_attack = {
		prompt(res) {
			res.prompt("你仍有单位可以攻击.")
			res.action("pass")
			res.action("cancel")
		},
		pass() {
			refresh_attack_eligibility()
			if (has_pending_liberate_suez_attack()) {
				log("解放苏伊士：已指定进攻埃及的 CP 单位仍有合法埃及目标，不能跳过进攻。")
				game.state = "attack"
				return
			}
			if (game.event_romania_attack_required && game.eligible_attackers.length > 0) {
				log("罗马尼亚：必须用该事件完成一次攻击，不能跳过进攻。")
				game.state = "attack"
				return
			}
			game.eligible_attackers = []
			game.state = "end_operations"
		},
		cancel() {
			game.state = "attack"
		}
	}

	states.confirm_event = {
		inactive: "确认事件",
		prompt(res) {
			let c = game.card !== null ? game.card : game.last_card
			let info = data.cards[c]
			res.prompt(`${info ? info.name : "Event"}: 完成.`)
			res.action("end_action")
		},
		end_action() {
			goto_end_action()
		}
	}

	states.end_operations = {
		inactive: "结束行动",
		prompt(res) {
			res.prompt("操作完成.")
			res.action("end_action")
		},
		end_action() {
			refresh_attack_eligibility()
			if (has_pending_liberate_suez_attack()) {
				log("解放苏伊士：已指定进攻埃及的 CP 单位仍有合法埃及目标，当前不能结束行动轮。")
				game.state = "attack"
				return
			}
			if (game.event_romania_attack_required && game.eligible_attackers.length > 0) {
				log("罗马尼亚：必须先完成这次事件攻击。")
				game.state = "attack"
				return
			}
			goto_end_action()
		}
	}

	function resolve_after_turkish_retreat_choice() {
		if (game.turkish_retreat_prev_active) {
			game.active = game.turkish_retreat_prev_active
			delete game.turkish_retreat_prev_active
		}
		resolve_battle_sequence()
	}

	function finalize_attacker_cc_step() {
		clear_undo()
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		log_combat_card_side("attacker")
		game.active = other_faction(game.active)
		enter_combat_card_state("play_cc_defender")
	}

	function finalize_defender_cc_step() {
		clear_undo()
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		log_combat_card_side("defender")
		resolve_battle_sequence()
	}

	function apply_severe_weather_before_cc() {
		if (!game.attack || game.attack.severe_weather_checked) return
		combat.apply_severe_weather(game, log, get_season(game), reduce_piece_from_severe_weather)
		game.attack.severe_weather_checked = true
	}

	function format_combat_card_summary_line(side) {
		let cards = (game.combat_cards && game.combat_cards[side]) || []
		let label = side === "attacker" ? "进攻方" : "防守方"
		return `${label}：${cards.length ? cards.map((c) => card_name(c)).join("，") : "无"}`
	}

	function ensure_combat_card_log_header() {
		if (!game.attack) return
		if (game.attack.cc_log_header) return
		game.attack.cc_log_header = true
		log("*战斗卡：")
	}

	function log_combat_card_side(side) {
		if (!game.attack) return
		if (!game.attack.cc_log_sides) game.attack.cc_log_sides = {}
		if (game.attack.cc_log_sides[side]) return
		game.attack.cc_log_sides[side] = true
		log(`>> ${format_combat_card_summary_line(side)}`)
	}

	function enter_combat_card_state(state) {
		game.state = state
	}

	function start_standard_cc_window() {
		apply_severe_weather_before_cc()
		game.active = game.attack?.attacker || game.active
		ensure_combat_card_log_header()
		enter_combat_card_state("play_cc_attacker")
	}

	function continue_after_pre_flank_cc_step() {
		game.active = game.attack?.attacker || game.active
		if (combat.check_can_flank(game) && game.attack.flank_attempt === undefined) {
			game.state = "choose_flank_attack"
		} else {
			goto_pre_weather_step()
		}
	}

	function goto_pre_flank_step() {
		game.active = game.attack?.attacker || game.active
		if (has_window_cc_options("pre_flank_cc_attacker", game.active, true)) {
			enter_combat_card_state("pre_flank_cc_attacker")
			return
		}
		continue_after_pre_flank_cc_step()
	}

	function finalize_pre_weather_attacker_cc_step() {
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		game.active = game.attack?.defender || other_faction(game.active)
		if (has_window_cc_options("pre_weather_cc_defender", game.active, false)) {
			enter_combat_card_state("pre_weather_cc_defender")
			return
		}
		start_standard_cc_window()
	}

	function finalize_pre_weather_defender_cc_step() {
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		start_standard_cc_window()
	}

	function goto_pre_weather_step() {
		game.active = game.attack?.attacker || game.active
		if (has_window_cc_options("pre_weather_cc_attacker", game.active, true)) {
			enter_combat_card_state("pre_weather_cc_attacker")
			return
		}
		let defender = game.attack?.defender || other_faction(game.active)
		if (has_window_cc_options("pre_weather_cc_defender", defender, false)) {
			game.active = defender
			enter_combat_card_state("pre_weather_cc_defender")
			return
		}
		start_standard_cc_window()
	}

	states.declare_turkish_retreat = {
		prompt(res) {
			res.prompt("土耳其撤退：同盟国是否宣言？")
			if (game.attack && game.attack.space !== -1) {
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			}
			res.action("declare_turkish_retreat")
			res.action("skip_turkish_retreat")
		},
		declare_turkish_retreat() {
			game.turkish_retreat = true
			resolve_after_turkish_retreat_choice()
		},
		skip_turkish_retreat() {
			game.turkish_retreat = false
			resolve_after_turkish_retreat_choice()
		}
	}

	const BATTLE_SUB_STATES = new Set([
		"retreat",
		"advance",
		"catastrophic_attack_choose_stack",
		"catastrophic_attack_retreat",
		"catastrophic_attack_advance",
		"turkish_retreat",
		"jafar_pasha_retreat",
		"retreat_cancel",
		"post_retreat_cancel",
		"save_tiflis_retreat",
		"choose_lcu_replacement",
		"pre_flank_cc_attacker",
		"post_roll_cc_defender",
		"post_battle_cc_cp",
		"post_retreat_cc_ap",
		"post_advance_cc_cp",
		"post_advance_cc_ap",
		"retreat_choice_cc_cp",
		"maude_place_indian_division",
		"maude_place_hq",
		"army_of_islam_place_hq",
		"confused_orders",
		"declare_turkish_retreat",
		"cancelled_combat_card_disposition"
	])

	function can_play_combat_card(c, target_game) {
		return combat_cards.can_play_combat_card(target_game, c)
	}

	function get_used_ccs_this_action(target_game) {
		if (!target_game || !target_game.action_state) return []
		return Array.isArray(target_game.action_state.used_ccs) ? target_game.action_state.used_ccs : []
	}

	function is_cc_used_this_action(target_game, c) {
		return set_has(get_used_ccs_this_action(target_game), c)
	}

	function mark_cc_used_this_action(target_game, c) {
		if (!target_game.action_state || typeof target_game.action_state !== "object") {
			target_game.action_state = {}
		}
		if (!Array.isArray(target_game.action_state.used_ccs)) {
			target_game.action_state.used_ccs = []
		}
		set_add(target_game.action_state.used_ccs, c)
	}

	function mark_combat_card_effected(c) {
		if (!game.combat_cards_effected) game.combat_cards_effected = []
		set_add(game.combat_cards_effected, c)
	}

	function collect_playable_cc_options(target_game, faction, is_attacker) {
		let hand = faction === AP ? target_game.hand_ap || [] : target_game.hand_cp || []
		let retained = get_cc_retained(faction)
		let options = []
		for (let c of hand) {
			if (!data.cards[c].cc) continue
			if (is_cc_used_this_action(target_game, c)) continue
			if (is_attacker && c === combat.CC_CP_JAFAR_PASHA) continue
			if (!can_play_combat_card(c, target_game)) continue
			set_add(options, c)
		}
		for (let c of retained) {
			if (!data.cards[c].cc) continue
			if (is_cc_used_this_action(target_game, c)) continue
			if (is_attacker && c === combat.CC_CP_JAFAR_PASHA) continue
			if (!can_play_combat_card(c, target_game)) continue
			// Only allow play if not already played in this combat
			if (target_game.combat_cards) {
				let already_played = is_attacker ? target_game.combat_cards.attacker : target_game.combat_cards.defender
				if (set_has(already_played, c)) continue
			}
			set_add(options, c)
		}
		return options
	}

	function collect_window_cc_options(target_game, window_state, faction, is_attacker) {
		let window_game = { ...target_game, state: window_state, active: faction }
		return collect_playable_cc_options(window_game, faction, is_attacker)
	}

	function has_window_cc_options(window_state, faction, is_attacker) {
		return collect_window_cc_options(game, window_state, faction, is_attacker).length > 0
	}

	function show_attack_context(res) {
		if (game.attack && game.attack.space !== -1) {
			res.where(game.attack.space)
			res.who(game.attack.pieces)
		}
	}

	function get_reinforcement_space_options(helper) {
		if (!helper || typeof helper.check !== "function") return []
		let options = []
		let enemy_faction = other_faction(helper.faction)
		let enemy_spaces = []
		for (let s = 1; s < data.spaces.length; s++) {
			let pieces = get_pieces_in_space(game, s)
			if (pieces.length > 0 && data.pieces[pieces[0]] && data.pieces[pieces[0]].faction === enemy_faction) {
				enemy_spaces.push(s)
			}
		}

		for (let s = 1; s < data.spaces.length; s++) {
			if (!helper.check(game, s)) continue
			if (Engine.game_utils.get_capacity(game, s) > 0) {
				set_add(options, s)
				continue
			}

			let neighbors = get_connected_spaces(game, s)
			let candidates = neighbors.filter((ns) => {
				if (Engine.map.is_controlled_by(game, ns, enemy_faction)) return false
				if (Engine.map.is_besieged(game, ns)) return false
				if (Engine.map.contains_enemy_pieces(game, ns, helper.faction) && !Engine.map.is_region(game, ns))
					return false
				return Engine.game_utils.get_capacity(game, ns) > 0
			})
			if (candidates.length === 0) continue

			let max_min_dist = -1
			let best_candidates = []
			for (let ns of candidates) {
				let min_enemy_dist = 999
				for (let es of enemy_spaces) {
					let distance = Engine.map.get_distance(ns, es)
					if (distance < min_enemy_dist) min_enemy_dist = distance
				}
				if (min_enemy_dist > max_min_dist) {
					max_min_dist = min_enemy_dist
					best_candidates = [ns]
				} else if (min_enemy_dist === max_min_dist) {
					best_candidates.push(ns)
				}
			}

			for (let ns of best_candidates) set_add(options, ns)
		}

		set_add(options, Engine.game_utils.get_reserve_box(helper.faction))
		return options
	}

	function get_maude_attack_origin_spaces() {
		let seen = new Set()
		let spaces = []
		for (let p of game.attack?.pieces || []) {
			let s = game.pieces[p]
			if (seen.has(s)) continue
			seen.add(s)
			spaces.push(s)
		}
		return spaces
	}

	function get_maude_hq_space_options() {
		let options = []
		for (let s of get_maude_attack_origin_spaces()) {
			let pieces = get_pieces_in_space(game, s).filter(
				(p) => Engine.game_utils.get_piece_effective_faction(game, p) === AP
			)
			let has_br = Engine.game_utils.pieces_count_as_any_nation_for_rule(game, pieces, "br")
			let has_in = Engine.game_utils.pieces_count_as_any_nation_for_rule(game, pieces, "in")
			if (has_br && has_in) options.push(s)
		}
		return options
	}

	function get_maude_reinforcement_space_options() {
		let helper = Engine.reinf_helpers?.is_br
		let options = get_reinforcement_space_options(helper)
		if (get_maude_hq_space_options().length > 0) return options
		let attack_spaces = new Set(get_maude_attack_origin_spaces())
		return options.filter((s) => {
			if (!attack_spaces.has(s)) return false
			let pieces = get_pieces_in_space(game, s).filter(
				(p) => Engine.game_utils.get_piece_effective_faction(game, p) === AP
			)
			return Engine.game_utils.pieces_count_as_any_nation_for_rule(game, pieces, "br")
		})
	}

	function get_army_of_islam_space_options() {
		if (typeof combat_cards.get_army_of_islam_space_options !== "function") return []
		return combat_cards.get_army_of_islam_space_options(game)
	}

	function continue_after_retreat_choice_cc_window() {
		game.retreat_choice_cc_cp_done = true
		game.retreat_choice_cc_done = true
		delete game.retreat_choice_resume_state
		delete game.retreat_choice_prev_active
		end_battle_sequence()
	}

	function resume_window_combat_card_state(return_state) {
		switch (return_state) {
			case "pre_flank_cc_attacker":
				game.active = game.attack?.attacker || game.active
				if (has_window_cc_options("pre_flank_cc_attacker", game.active, true)) {
					enter_combat_card_state("pre_flank_cc_attacker")
				} else {
					continue_after_pre_flank_cc_step()
				}
				return true
			case "pre_weather_cc_attacker":
				game.active = game.attack?.attacker || game.active
				if (has_window_cc_options("pre_weather_cc_attacker", game.active, true)) {
					enter_combat_card_state("pre_weather_cc_attacker")
				} else {
					finalize_pre_weather_attacker_cc_step()
				}
				return true
			case "pre_weather_cc_defender":
				game.active = game.attack?.defender || other_faction(game.active)
				if (has_window_cc_options("pre_weather_cc_defender", game.active, false)) {
					enter_combat_card_state("pre_weather_cc_defender")
				} else {
					finalize_pre_weather_defender_cc_step()
				}
				return true
			case "post_roll_cc_defender":
				game.active = CP
				if (has_window_cc_options("post_roll_cc_defender", CP, false)) {
					game.state = "post_roll_cc_defender"
				} else {
					continue_after_post_roll_cc()
				}
				return true
			case "post_battle_cc_cp":
				game.active = CP
				if (has_window_cc_options("post_battle_cc_cp", CP, false)) {
					game.state = "post_battle_cc_cp"
				} else {
					continue_after_post_battle_cc()
				}
				return true
			case "post_retreat_cc_ap":
				continue_after_post_retreat_ap_cc(false)
				return true
			case "post_advance_cc_cp":
				game.active = CP
				if (has_window_cc_options("post_advance_cc_cp", CP, false)) {
					game.state = "post_advance_cc_cp"
				} else {
					goto_attack()
				}
				return true
			case "post_advance_cc_ap":
				continue_after_post_advance_ap_cc()
				return true
			case "retreat_choice_cc_cp":
				continue_after_retreat_choice_cc_window()
				return true
			default:
				return false
		}
	}

	function get_unabsorbed_post_roll_loss_state() {
		if (!game.attack) return null
		let defender_needed = (game.attack.defender_losses || 0) - (game.attack.defender_losses_absorbed || 0)
		if (defender_needed > 0) {
			game.active = game.attack.defender || other_faction(game.attack.attacker || game.active)
			return combat.get_defender_losses_state(game)
		}

		let attacker_needed = (game.attack.attacker_losses || 0) - (game.attack.attacker_losses_absorbed || 0)
		if (attacker_needed > 0) {
			game.active = game.attack.attacker || AP
			return "apply_attacker_losses"
		}

		return null
	}

	function continue_after_post_roll_cc() {
		game.post_roll_cc_done = true
		let loss_state = get_unabsorbed_post_roll_loss_state()
		if (loss_state) {
			game.state = loss_state
			return
		}
		game.active = game.attack?.attacker || AP
		end_battle_sequence()
	}

	function register_combat_card_state(name, config) {
		states[name] = {
			inactive: "打出战斗卡",
			prompt(res) {
				let options = config.get_options()
				if (options.length === 0) {
					res.prompt(config.prompt + "（无）")
				} else {
					res.prompt(config.prompt)
				}
				show_attack_context(res)
				for (let c of options) res.action("play_cc", c)
				res.action("done")
			},
			play_cc(c) {
				if (is_cc_used_this_action(game, c)) return
				let options = config.get_options()
				if (!options.includes(c)) return
				push_undo()
				if (config.skip_confirm) {
					handle_play_cc(game, c, config.is_attacker, game.state)
				} else {
					game.pending_cc = {
						card: c,
						is_attacker: config.is_attacker,
						return_state: game.state,
						undo_pushed: true
					}
					game.state = "confirm_cc"
				}
			},
			done() {
				config.done()
			}
		}
		if (config.allow_pass) {
			states[name].pass = function () {
				config.done()
			}
		}
	}

	states.confirm_cc = {
		inactive: "确认战斗卡",
		prompt(res) {
			let pending = game.pending_cc
			if (pending) {
				let c = pending.card
				res.prompt(`确认打出 ${card_name(c)}？`)
				res.action("confirm")
				res.action("cancel")
			} else {
				res.prompt("确认战斗卡")
				res.action("cancel")
			}
		},
		confirm() {
			let pending = game.pending_cc
			if (pending) {
				if (is_cc_used_this_action(game, pending.card)) {
					delete game.pending_cc
					return
				}
				let card = pending.card
				let is_attacker = pending.is_attacker
				let return_state = pending.return_state
				delete game.pending_cc
				handle_play_cc(game, card, is_attacker, return_state)
			}
		},
		cancel() {
			let pending = game.pending_cc
			if (pending?.undo_pushed && typeof pop_undo === "function" && game.undo && game.undo.length > 0) {
				pop_undo()
				return
			}
			let return_state = pending?.return_state
			delete game.pending_cc
			if (return_state && states[return_state]) {
				game.state = return_state
			}
		}
	}

	// 统一战斗卡打出上下文，避免状态机里散落每张卡的来源处理与收尾逻辑。
	function create_combat_card_play_context(
		game,
		c,
		info,
		faction,
		is_attacker,
		from_retained,
		return_state,
		mark_effected
	) {
		function dispose_after_use(after_use) {
			if (after_use === "remove") move_card_to_removed(c, faction)
			else move_card_to_discard(c, faction)
		}

		return {
			game,
			card: c,
			info,
			faction,
			is_attacker,
			from_retained,
			return_state,
			log,
			card_name: () => card_name(c),
			mark_effected: () => mark_effected(c),
			remove_card_from_hand() {
				remove_card_from_hand(c, faction)
			},
			add_cc_retained(target_faction, after_use) {
				add_cc_retained(target_faction, c, after_use)
			},
			take_retained_card() {
				let after_use = get_cc_retained_after_use(faction, c)
				remove_cc_retained(faction, c)
				return after_use
			},
			dispose_after_use,
			dispose_standard() {
				if (from_retained) {
					dispose_after_use(this.take_retained_card())
				} else if (info.remove) {
					remove_card(c)
				} else {
					discard_card(c)
				}
			},
			apply_war_status() {
				if (info.ws) {
					update_war_status(faction, info.ws)
				}
			}
		}
	}

	function resume_combat_card_flow(return_state, is_attacker) {
		if (resume_window_combat_card_state(return_state)) {
			return
		}

		enter_combat_card_state(is_attacker ? "play_cc_attacker" : "play_cc_defender")
	}

	function handle_play_cc(game, c, is_attacker, return_state_override) {
		// Defense in depth: the UI should already hide these cards, but some
		// event/state round-trips can re-enter combat windows with stale actions.
		if (is_cc_used_this_action(game, c)) return
		if (!game.combat_cards) game.combat_cards = { attacker: [], defender: [] }
		if (!game.combat_cards_effected) game.combat_cards_effected = []
		let return_state = return_state_override || game.state
		let can_play_game = return_state === game.state ? game : { ...game, state: return_state }
		if (!combat_cards.can_play_combat_card(can_play_game, c)) return
		let faction = game.active
		let info = data.cards[c]
		let retained = get_cc_retained(faction)
		let from_retained = set_has(retained, c)
		let source_after_use = info.remove ? "remove" : "discard"
		if (from_retained) source_after_use = get_cc_retained_after_use(faction, c)
		if (is_attacker) {
			game.combat_cards.attacker.push(c)
		} else {
			game.combat_cards.defender.push(c)
		}
		mark_cc_used_this_action(game, c)
		combat.record_combat_card_source(game, c, {
			faction,
			side: is_attacker ? "attacker" : "defender",
			from_retained,
			after_use: source_after_use
		})
		let spec = combat_cards.get_combat_card_spec(c)
		let ctx = create_combat_card_play_context(
			game,
			c,
			info,
			faction,
			is_attacker,
			from_retained,
			return_state,
			mark_combat_card_effected
		)

		if (spec?.on_play?.(ctx) === "stop") {
			return
		}

		if (!spec?.dispose?.(ctx)) {
			ctx.dispose_standard()
		}
		ctx.apply_war_status()

		let hook_result = spec?.on_play_after_disposition?.(game, ctx)
		if (hook_result === "stop") {
			return
		}

		resume_combat_card_flow(return_state, is_attacker)
	}

	register_combat_card_state("play_cc_attacker", {
		prompt: "进攻方：打出战斗卡",
		is_attacker: true,
		get_options: () => collect_playable_cc_options(game, game.active, true),
		done: finalize_attacker_cc_step,
		allow_pass: true
	})

	register_combat_card_state("play_cc_defender", {
		prompt: "防守方：打出战斗卡",
		is_attacker: false,
		get_options: () => collect_playable_cc_options(game, game.active, false),
		done: finalize_defender_cc_step,
		allow_pass: true
	})

	register_combat_card_state("pre_flank_cc_attacker", {
		prompt: "进攻方：打出先于侧翼判定的战斗卡",
		is_attacker: true,
		get_options: () => collect_window_cc_options(game, "pre_flank_cc_attacker", game.active, true),
		done: continue_after_pre_flank_cc_step,
		allow_pass: true
	})

	register_combat_card_state("pre_weather_cc_attacker", {
		prompt: "进攻方：打出先于恶劣天气判定的战斗卡",
		is_attacker: true,
		get_options: () => collect_window_cc_options(game, "pre_weather_cc_attacker", game.active, true),
		done: finalize_pre_weather_attacker_cc_step,
		allow_pass: true
	})

	register_combat_card_state("pre_weather_cc_defender", {
		prompt: "防守方：打出先于恶劣天气判定的战斗卡",
		is_attacker: false,
		get_options: () => collect_window_cc_options(game, "pre_weather_cc_defender", game.active, false),
		done: finalize_pre_weather_defender_cc_step,
		allow_pass: true
	})

	states.maude_place_indian_division = {
		inactive: "打出战斗卡",
		prompt(res) {
			res.prompt("莫德：放置印度第15步兵师")
			show_attack_context(res)
			for (let s of get_maude_reinforcement_space_options()) res.space(s)
		},
		space(s) {
			push_undo()
			Engine.events.reinforce(game, "IN 15th DIV", AP, s)
			let indian_division = Engine.game_utils.find_piece(AP, "IN 15th DIV")
			if (
				indian_division >= 0 &&
				game.attack &&
				Array.isArray(game.attack.pieces) &&
				get_maude_attack_origin_spaces().includes(s) &&
				!game.attack.pieces.includes(indian_division)
			) {
				game.attack.pieces.push(indian_division)
				combat.remember_attack_piece_origin(game, indian_division)
			}
			// The placement effect has resolved even if the battle is later cancelled.
			mark_combat_card_effected(combat.CC_AP_MAUDE)
			game.active = AP
			game.state = "maude_place_hq"
		}
	}

	states.maude_place_hq = {
		inactive: "打出战斗卡",
		prompt(res) {
			res.prompt("莫德：将莫德HQ放置到包含英国与印度部队的攻击地块")
			show_attack_context(res)
			for (let s of get_maude_hq_space_options()) res.space(s)
		},
		space(s) {
			push_undo()
			let maude_hq = Engine.game_utils.find_piece(AP, "BR Maude HQ")
			if (maude_hq >= 0) {
				game.pieces[maude_hq] = s
				if (game.attack && Array.isArray(game.attack.pieces) && !game.attack.pieces.includes(maude_hq)) {
					game.attack.pieces.push(maude_hq)
					combat.remember_attack_piece_origin(game, maude_hq)
				}
				log(`增援：BR Maude HQ 放置到 ${space_name(s)} 并加入战斗`)
			}
			let return_state = game.maude_cc?.return_state || "play_cc_attacker"
			let prev_active = game.maude_cc?.prev_active || AP
			delete game.maude_cc
			game.active = prev_active
			resume_combat_card_flow(return_state, true)
		}
	}

	states.army_of_islam_place_hq = {
		inactive: "打出战斗卡",
		prompt(res) {
			res.prompt("伊斯兰军：将伊斯兰军HQ放置到已启动攻击的土耳其/土耳其-阿拉伯部队所在攻击地块")
			show_attack_context(res)
			for (let s of get_army_of_islam_space_options()) res.space(s)
		},
		space(s) {
			push_undo()
			let army_of_islam_hq = Engine.game_utils.find_piece(CP, "TU Army Islam HQ")
			if (army_of_islam_hq >= 0) {
				game.pieces[army_of_islam_hq] = s
				if (
					game.attack &&
					Array.isArray(game.attack.pieces) &&
					!game.attack.pieces.includes(army_of_islam_hq)
				) {
					game.attack.pieces.push(army_of_islam_hq)
					combat.remember_attack_piece_origin(game, army_of_islam_hq)
				}
				log(`增援：TU Army Islam HQ 放置到 ${space_name(s)} 并加入战斗`)
			}
			// The placement effect has resolved even if the battle is later cancelled.
			mark_combat_card_effected(combat.CC_CP_ARMY_OF_ISLAM)
			let return_state = game.army_of_islam_cc?.return_state || "play_cc_attacker"
			let prev_active = game.army_of_islam_cc?.prev_active || CP
			delete game.army_of_islam_cc
			game.active = prev_active
			resume_combat_card_flow(return_state, true)
		}
	}

	function finalize_jafar_pasha_choice() {
		if (game.cc_jafar_pasha && game.cc_jafar_pasha.after_use === "remove") {
			move_card_to_removed(game.cc_jafar_pasha.card, game.cc_jafar_pasha.faction)
		} else if (game.cc_jafar_pasha && game.cc_jafar_pasha.after_use === "discard") {
			move_card_to_discard(game.cc_jafar_pasha.card, game.cc_jafar_pasha.faction)
		} else if (game.cc_jafar_pasha) {
			game.cc_jafar_pasha_post_battle = true
		}
		game.cc_jafar_pasha = null
	}

	states.march_and_countermarch_select = {
		prompt(res) {
			res.prompt("前后佯动：选择一个未激活的英国单位")
			if (game.attack && game.attack.space !== -1) {
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			}
			res.action("cancel")
			for (let p = 0; p < data.pieces.length; p++) {
				if (!data.pieces[p]) continue
				if (data.pieces[p].nation !== "br") continue
				if (set_has(game.attacked, p)) continue
				if (is_not_on_map(game, p)) continue
				let dist = Engine.map.get_distance(game.pieces[p], game.attack.space)
				if (dist >= 1 && dist <= 2) {
					res.piece(p)
				}
			}
		},
		piece(p) {
			push_undo()
			game.march_and_countermarch.piece = p
			game.state = "march_and_countermarch_move"
		},
		cancel() {
			delete game.march_and_countermarch
			enter_combat_card_state("play_cc_attacker")
		}
	}

	states.march_and_countermarch_move = {
		prompt(res) {
			let p = game.march_and_countermarch.piece
			let rem = game.march_and_countermarch.remaining_moves
			if (game.pieces[p] === game.attack.space) {
				res.prompt("前后佯动：单位已到达目标区域")
				res.action("done")
				return
			}
			res.prompt(`前后佯动：移动选定的单位 (剩余 ${rem} 步)`)
			if (game.attack && game.attack.space !== -1) {
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			}
			res.action("cancel")
			let adj = get_connected_spaces(game.pieces[p])
			for (let s of adj) {
				// Can only move through AP controlled spaces, to reach target space
				if (s === game.attack.space || Engine.map.is_controlled_by(game, s, AP)) {
					// Check distance from s to target
					let dist = Engine.map.get_distance(s, game.attack.space)
					if (dist <= rem - 1) {
						if (s === game.attack.space) {
							if (can_stack_end_in_space(game, s, [p], game.attack.pieces)) {
								res.space(s)
							}
						} else {
							res.space(s)
						}
					}
				}
			}
		},
		space(s) {
			push_undo()
			let p = game.march_and_countermarch.piece
			game.pieces[p] = s
			game.march_and_countermarch.remaining_moves -= 1
			if (s === game.attack.space) {
				set_add(game.attack.pieces, p)
				combat.remember_attack_piece_origin(game, p)
				set_add(game.attacked, p)
				delete game.march_and_countermarch
				enter_combat_card_state("play_cc_attacker")
			}
		},
		cancel() {
			delete game.march_and_countermarch
			enter_combat_card_state("play_cc_attacker")
		}
	}

	states.surprise_sr = {
		prompt(res) {
			if (!game.surprise) {
				game.surprise = { remaining: 2, space: game.attack.space }
			}
			res.prompt(`奇袭增援：可增援 ${game.surprise.remaining} 个SCU到 ${space_name(game.surprise.space)}`)
			if (game.attack && game.attack.space !== -1) {
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			}
			res.action("done")
			let target = game.surprise.space
			for (let p = 0; p < data.pieces.length; p++) {
				if (!data.pieces[p]) continue
				if (Engine.game_utils.get_piece_effective_faction(game, p) !== CP) continue
				if (!["tu", "tua"].includes(data.pieces[p].nation)) continue
				if (!is_scu(p)) continue
				if (is_not_on_map(game, p) && !is_in_reserve(game, p)) continue
				if (!can_stack_end_in_space(game, target, [p])) continue
				if (game.pieces[p] !== target && Engine.map.can_sr_to_space(game, p, target, CP)) {
					res.piece(p)
				}
			}
		},
		piece(p) {
			push_undo()
			game.pieces[p] = game.surprise.space
			game.surprise.remaining -= 1
			if (game.surprise.remaining <= 0) {
				delete game.surprise
				resolve_battle_sequence()
			}
		},
		done() {
			delete game.surprise
			resolve_battle_sequence()
		}
	}

	function can_confused_orders_move_piece_to_space(p, target) {
		if (!data.pieces[p]) return false
		if (Engine.game_utils.get_piece_effective_faction(game, p) !== CP) return false
		if (is_not_on_map(game, p)) return false
		if (!can_stack_end_in_space(game, target, [p])) return false

		let from = game.pieces[p]
		let previous_move = game.move
		game.move = { current: from, initial: from, pieces: [p], spaces_moved: 0 }
		let can_move = Engine.map.can_piece_move_to(game, p, target, CP)
		if (previous_move === undefined) delete game.move
		else game.move = previous_move
		return can_move
	}

	function get_confused_orders_move_candidates(conf = game.confused_orders) {
		if (!conf || !(conf.space > 0)) return []
		let candidates = []
		for (let p = 0; p < data.pieces.length; p++) {
			if (can_confused_orders_move_piece_to_space(p, conf.space)) candidates.push(p)
		}
		return candidates
	}

	states.confused_orders = {
		prompt(res) {
			let conf = game.confused_orders
			if (!conf) {
				res.prompt("混乱指令：无可用效果")
				res.action("done")
				return
			}
			res.prompt("混乱指令：自动取消可用的撤退/挺进。")
			if (game.attack && game.attack.space !== -1) {
				res.where(game.attack.space)
				res.who(game.attack.pieces)
			}
			if (!conf.moved && get_confused_orders_move_candidates(conf).length > 0) res.action("move_unit")
			res.action("done")
		},
		cancel_retreat() {
			game.confused_orders.cancel_retreat = true
		},
		cancel_advance() {
			game.confused_orders.cancel_advance = true
		},
		cancel_both() {
			game.confused_orders.cancel_retreat = true
			game.confused_orders.cancel_advance = true
		},
		move_unit() {
			game.state = "confused_orders_move"
		},
		done() {
			if (game.confused_orders) {
				if (game.confused_orders.can_cancel_retreat || game.confused_orders.cancel_retreat) {
					combat.cancel_cp_retreat_result(game, game.battle_result)
				}
				if (game.confused_orders.can_cancel_advance || game.confused_orders.cancel_advance) {
					game.battle_result.no_advance = true
				}
			}
			let next_active = game.attack?.attacker || game.confused_orders?.prev_active || AP
			game.active = next_active
			game.confused_orders_used = true
			delete game.confused_orders
			end_battle_sequence()
		}
	}

	states.confused_orders_move = {
		prompt(res) {
			let conf = game.confused_orders
			if (!conf) {
				res.prompt("混乱指令：无可移动单位")
				res.action("done")
				return
			}
			res.prompt("混乱指令：选择单位移动到攻击区域")
			res.action("done")
			for (let p of get_confused_orders_move_candidates(conf)) res.piece(p)
		},
		piece(p) {
			push_undo()
			game.pieces[p] = game.confused_orders.space
			game.confused_orders.moved = true
			game.state = "confused_orders"
		},
		done() {
			game.state = "confused_orders"
		}
	}

	states.choose_jafar_pasha = {
		prompt(res) {
			let mode = game.cc_jafar_pasha?.mode
			res.prompt("贾法尔帕夏：选择效果")
			if (mode !== "reroll") res.action("retreat")
			if (mode !== "retreat") res.action("reroll")
		},
		retreat() {
			push_undo()
			if (!game.attack) return
			let attackers = game.attack.pieces || []
			let defenders = get_pieces_in_space(game, game.attack.space).filter(
				(p) =>
					Engine.game_utils.get_piece_effective_faction(game, p) === game.active &&
					!set_has(game.retreated, p)
			)
			if (!Array.isArray(game.retreated)) game.retreated = []
			game.jafar_pasha_retreat = {
				pieces: defenders,
				avoided_spaces: attackers.map((p) => game.pieces[p])
			}
			game.retreat_distance = 1
			game.retreat_from = game.attack.space
			game.retreat_space = game.attack.space
			game.retreat_steps_left = null
			game.selected_piece = null
			game.state = "jafar_pasha_retreat"
			if (defenders.length === 0) finish_jafar_pasha_retreat()
		},
		reroll() {
			let choice = game.cc_jafar_pasha
			let reroll_request = {
				faction: choice?.faction || game.active,
				side: choice?.side
			}
			let return_state = choice?.return_state || "post_roll_cc_defender"
			finalize_jafar_pasha_choice()
			combat.reroll_jafar_pasha_combat_die(game, reroll_request, log)
			resume_combat_card_flow(return_state, false)
		}
	}

	function get_jafar_pasha_retreat_state() {
		if (!game.jafar_pasha_retreat) {
			game.jafar_pasha_retreat = { pieces: [], avoided_spaces: [] }
		}
		game.jafar_pasha_retreat.pieces = (game.jafar_pasha_retreat.pieces || []).filter(
			(p) => !is_not_on_map(game, p) && !is_eliminated(game, p)
		)
		if (!Array.isArray(game.jafar_pasha_retreat.avoided_spaces)) game.jafar_pasha_retreat.avoided_spaces = []
		return game.jafar_pasha_retreat
	}

	function get_jafar_pasha_retreat_spaces(piece) {
		let state = get_jafar_pasha_retreat_state()
		let valid = get_valid_retreat_spaces(game, piece, state.avoided_spaces, 1, false)
		return combat.apply_retreat_priorities(game, piece, valid)
	}

	function finish_jafar_pasha_retreat() {
		let advance_space = game.attack?.space
		delete game.jafar_pasha_retreat
		delete game.selected_piece
		delete game.retreat_pieces
		delete game.retreat_space
		delete game.retreat_distance
		delete game.retreat_from
		game.retreat_steps_left = null
		finalize_jafar_pasha_choice()
		game.jafar_pasha_advance_after_cancel = { advance_space }
		game.cc_jafar_pasha_retreat = true
		resolve_battle_sequence()
	}

	states.jafar_pasha_retreat = {
		prompt(res) {
			let state = get_jafar_pasha_retreat_state()
			res.who(state.pieces)
			res.where(game.retreat_space)

			if (state.pieces.length === 0) {
				res.prompt("贾法尔帕夏：撤退已完成")
				res.action("done")
				return
			}

			if (game.selected_piece === null || game.selected_piece === undefined) {
				res.prompt("贾法尔帕夏：选择防守单位后撤 1 格")
				for (let p of state.pieces) res.piece(p)
				return
			}

			let piece = game.selected_piece
			if (!set_has(state.pieces, piece)) {
				game.selected_piece = null
				res.prompt("贾法尔帕夏：选择防守单位后撤 1 格")
				for (let p of state.pieces) res.piece(p)
				return
			}

			res.prompt(`贾法尔帕夏：选择 ${piece_name(piece)} 的撤退地块`)
			let valid = get_jafar_pasha_retreat_spaces(piece)
			if (valid.length === 0) {
				res.action("eliminate_retreating")
			} else {
				for (let s of valid) res.space(s)
			}
			res.piece(piece)
		},
		piece(p) {
			let state = get_jafar_pasha_retreat_state()
			if (game.selected_piece === p) {
				game.selected_piece = null
			} else if (set_has(state.pieces, p)) {
				game.selected_piece = p
			}
		},
		space(s) {
			let state = get_jafar_pasha_retreat_state()
			let p = game.selected_piece
			if (p === null || p === undefined || !set_has(state.pieces, p)) return
			let valid = get_jafar_pasha_retreat_spaces(p)
			if (!set_has(valid, s)) return
			push_undo()
			let from = game.pieces[p]
			ensure_attack_log_section("retreat_log_started", "撤退：")
			log(`>> ${format_piece_log(p)} → s${s}`)
			game.pieces[p] = s
			game.retreat_space = s
			if (!Engine.map.is_controlled_by(game, s, game.active) && can_unit_gain_control(p)) {
				set_control(game, s, game.active)
			}
			if (Engine.check_persia_entry_vp_penalty) {
				Engine.check_persia_entry_vp_penalty(game, s, [p])
			}
			if (from > 0) {
				Engine.sync_neutral_vp_state(game, from)
				Engine.sync_jihad_city_state(game, from)
				Engine.sync_region_control(game, from)
			}
			Engine.sync_region_control(game, s)
			Engine.sync_neutral_vp_state(game, s)
			Engine.sync_jihad_city_state(game, s)
			set_delete(state.pieces, p)
			set_add(game.retreated, p)
			game.selected_piece = null
			if (state.pieces.length === 0) finish_jafar_pasha_retreat()
		},
		eliminate_retreating() {
			let state = get_jafar_pasha_retreat_state()
			let p = game.selected_piece
			if (p === null || p === undefined || !set_has(state.pieces, p)) return
			push_undo()
			ensure_attack_log_section("retreat_log_started", "撤退：")
			log(`>> ${format_piece_log(p, true)} 无法撤退并被消灭`)
			eliminate_piece_for_failed_retreat(p)
			set_delete(state.pieces, p)
			game.selected_piece = null
			if (state.pieces.length === 0) finish_jafar_pasha_retreat()
		},
		done() {
			finish_jafar_pasha_retreat()
		}
	}

	function get_enver_mo_choice_action(mo_target) {
		if (mo_target === mo.MO_RUSSIA) return "fulfill_enver_russia"
		if (mo_target === mo.MO_BRITISH) return "fulfill_enver_british"
		if (mo_target === mo.MO_TURKEY) return "fulfill_enver_turkey"
		return null
	}

	function continue_attack_sequence_after_mo_check() {
		if (combat.is_black_sea_amphibious_invasion(game)) {
			combat.resolve_black_sea_amphibious_invasion(game, log)
			return
		}
		if (needs_jerusalem_special_rule()) {
			game.attack.jerusalem_special_resolved = true
			game.active = game.attack.defender || other_faction(game.attack.attacker || game.active)
			game.state = "jerusalem_defender_choice"
			return
		}

		goto_pre_flank_step()
	}

	function finish_enver_mo_choice(mo_target) {
		if (!mo.resolve_pending_enver_mo_choice(game, mo_target, log)) return
		continue_attack_sequence_after_mo_check()
	}

	states.choose_enver_mo_fulfillment = {
		prompt(res) {
			let options = mo.get_pending_enver_mo_choice_options(game)
			res.prompt("恩维尔攻势：选择本次攻击完成的MO")
			let actions = new Set()
			for (let option of options) {
				let action = get_enver_mo_choice_action(option.mo)
				if (action) actions.add(action)
			}
			for (let action of actions) res.action(action)
			if (actions.size === 0) res.action("next")
		},
		fulfill_enver_russia() {
			finish_enver_mo_choice(mo.MO_RUSSIA)
		},
		fulfill_enver_british() {
			finish_enver_mo_choice(mo.MO_BRITISH)
		},
		fulfill_enver_turkey() {
			finish_enver_mo_choice(mo.MO_TURKEY)
		},
		next() {
			delete game.enver_mo_choice
			continue_attack_sequence_after_mo_check()
		}
	}

	function finish_pre_battle_cancelled_attack() {
		let attacker = game.attack?.attacker
		game.attack = null
		clear_battle_runtime_state()
		if (attacker !== undefined && attacker !== null) game.active = attacker
		if (check_event_next_state()) return
		refresh_attack_eligibility()
		if (game.eligible_attackers.length > 0) set_next_state_after_interrupt("attack", game.active)
		else goto_end_operations()
	}

	function start_attack_sequence() {
		delete game.jafar_pasha_retreat
		delete game.turkish_retreat_prev_active
		delete game.turkish_retreat_chosen_space
		delete game.turkish_retreat
		delete game.retreat_choice_cc_done
		delete game.retreat_choice_resume_state
		delete game.retreat_choice_prev_active
		delete game.confused_orders
		delete game.confused_orders_used
		delete game.battle_resolution_applied
		delete game.enver_mo_choice
		if (combat.start_attack_sequence(game, log) === false) {
			if (game.attack?.cancelled_before_battle) {
				finish_pre_battle_cancelled_attack()
				return
			}
			game.state = "attack"
			return
		}
		if (game.attack) {
			delete game.attack.cc_log_header
			delete game.attack.cc_log_sides
		}
		if (mo.has_pending_enver_mo_choice(game)) {
			game.active = CP
			game.state = "choose_enver_mo_fulfillment"
			return
		}
		continue_attack_sequence_after_mo_check()
	}

	function get_attackable_spaces(pieces) {
		if (get_legal_attackable_spaces) {
			return get_legal_attackable_spaces(pieces)
		}
		return combat.get_legal_attackable_spaces(
			game,
			pieces,
			active_faction(),
			() => get_season(game),
			is_rail_connected_to_supply
		)
	}

	function current_cancelled_cc_disposition() {
		return game.cancelled_cc_dispositions && game.cancelled_cc_dispositions[0]
	}

	function cancelled_cc_return_label(entry) {
		if (
			entry.from_retained ||
			entry.card === combat.CC_CP_JAFAR_PASHA ||
			entry.card === combat.CC_AP_NO_PRISONERS
		) {
			return "回到保留区"
		}
		return "回手"
	}

	function enter_cancelled_combat_card_disposition_state() {
		if (!combat.has_cancelled_combat_card_dispositions(game)) return false
		let entry = current_cancelled_cc_disposition()
		game.active = entry.faction
		game.state = "cancelled_combat_card_disposition"
		return true
	}

	function continue_after_cancelled_combat_card_disposition() {
		if (enter_cancelled_combat_card_disposition_state()) return
		if (game.jafar_pasha_advance_after_cancel) {
			continue_after_jafar_pasha_cancelled_battle()
			return
		}
		end_battle_sequence()
	}

	function resolve_battle_sequence() {
		const ctx = {
			log,
			eliminate_piece,
			check_mo_fulfillment: mo.check_mo_fulfillment,
			get_season: () => get_season(game),
			reduce_piece
		}
		if (combat.is_battle_cancelled_by_cc(game)) {
			let res = combat.resolve_battle_sequence(game, ctx)
			if (res === "end" || res === "cancelled") {
				if (enter_cancelled_combat_card_disposition_state()) {
					return
				}
				if (game.jafar_pasha_advance_after_cancel) {
					continue_after_jafar_pasha_cancelled_battle()
					return
				}
				end_battle_sequence()
			}
			return
		}

		if (game.turkish_retreat === undefined && combat.can_declare_turkish_retreat(game)) {
			game.turkish_retreat_prev_active = game.active
			game.active = CP
			game.state = "declare_turkish_retreat"
			return
		}

		combat.resolve_flank_attempt(game, log)

		if (combat.resolve_battle_sequence(game, ctx) === "end") {
			if (game.attack?.space === JERUSALEM) {
				game.events["jerusalem_actual_combat"] = true
			}
			if (enter_cancelled_combat_card_disposition_state()) {
				return
			}
			end_battle_sequence()
		}
	}

	states.cancelled_combat_card_disposition = {
		inactive: "选择战斗卡处置",
		prompt(res) {
			let entry = current_cancelled_cc_disposition()
			if (!entry) {
				res.prompt("战斗卡处置已完成")
				res.action("done")
				return
			}
			let consume_label = entry.after_use === "remove" ? "移除" : "弃置"
			res.prompt(
				`战斗取消：${card_name(entry.card)}，选择${cancelled_cc_return_label(entry)}或${consume_label}。`
			)
			res.action("return_cc")
			if (entry.after_use === "remove") res.action("remove_cc")
			else res.action("discard_cc")
		},
		return_cc() {
			let entry = current_cancelled_cc_disposition()
			if (!entry) return
			push_undo()
			let label = cancelled_cc_return_label(entry)
			combat.apply_cancelled_combat_card_disposition(game, entry.card, "return")
			log(`${card_name(entry.card)}：战斗取消，${label}。`)
			continue_after_cancelled_combat_card_disposition()
		},
		discard_cc() {
			let entry = current_cancelled_cc_disposition()
			if (!entry || entry.after_use === "remove") return
			push_undo()
			combat.apply_cancelled_combat_card_disposition(game, entry.card, "consume")
			log(`${card_name(entry.card)}：战斗取消，弃置。`)
			continue_after_cancelled_combat_card_disposition()
		},
		remove_cc() {
			let entry = current_cancelled_cc_disposition()
			if (!entry || entry.after_use !== "remove") return
			push_undo()
			combat.apply_cancelled_combat_card_disposition(game, entry.card, "consume")
			log(`${card_name(entry.card)}：战斗取消，移除。`)
			continue_after_cancelled_combat_card_disposition()
		},
		done() {
			if (!combat.has_cancelled_combat_card_dispositions(game)) {
				continue_after_cancelled_combat_card_disposition()
			}
		}
	}

	states.jerusalem_defender_choice = {
		prompt(res) {
			res.where(game.attack?.space)
			res.who(game.attack?.pieces || [])
			res.prompt("耶路撒冷特殊规则：防守方必须选择战斗或撤退。")
			res.action("fight")
			res.action("withdraw")
		},
		fight() {
			push_undo()
			game.active = game.attack?.attacker || AP
			game.state = "jerusalem_attacker_choice"
		},
		withdraw() {
			if (!game.attack) return
			let defender = game.attack.defender || other_faction(game.attack.attacker || game.active)
			let defenders = get_pieces_in_space(game, game.attack.space).filter(
				(p) =>
					Engine.game_utils.get_piece_effective_faction(game, p) === defender &&
					!(Array.isArray(game.retreated) && set_has(game.retreated, p))
			)
			push_undo()
			log("耶路撒冷特殊规则：防守方选择在战斗前撤退。")
			game.jerusalem_withdrawal = true
			game.active = defender
			game.retreat_pieces = defenders
			game.retreat_space = game.attack.space
			game.retreat_from = game.attack.space
			game.retreat_distance = 1
			game.retreat_first_spaces = []
			game.retreat_steps_left = null
			game.selected_piece = null
			game.state = "retreat"
		}
	}

	states.jerusalem_attacker_choice = {
		prompt(res) {
			res.where(game.attack?.space)
			res.who(game.attack?.pieces || [])
			res.prompt("耶路撒冷特殊规则：防守方选择战斗。进攻方可以取消攻击，或继续并使耶路撒冷成为战区。")
			res.action("continue_attack")
			res.action("cancel_attack")
		},
		continue_attack() {
			push_undo()
			apply_jerusalem_battleground_penalty()
			if (defer_jerusalem_combat_until_after_jihad_placement()) return
			game.active = game.attack?.attacker || AP
			goto_pre_flank_step()
		},
		cancel_attack() {
			push_undo()
			log("耶路撒冷特殊规则：进攻方取消了本次攻击。")
			goto_attack()
		}
	}

	states.jerusalem_continue_after_jihad = {
		prompt(res) {
			res.where(game.attack?.space)
			res.who(game.attack?.pieces || [])
			res.prompt("耶路撒冷圣战部落放置完成：继续战斗。")
			res.action("next")
		},
		next() {
			game.active = game.attack?.attacker || AP
			goto_pre_flank_step()
		}
	}

	states.choose_flank_attack = {
		prompt(res) {
			res.prompt("你是否要尝试侧翼进攻？")
			res.action("flank")
			res.action("no_flank")
		},
		flank() {
			push_undo()
			game.attack.flank_attempt = true
			goto_pre_weather_step()
		},
		no_flank() {
			push_undo()
			game.attack.flank_attempt = false
			goto_pre_weather_step()
		}
	}

	function end_battle_sequence() {
		let prev_state = game.state
		combat.end_battle_sequence(game, log)
		if (game.cc_jafar_pasha_post_battle) resolve_jafar_pasha_post_battle()

		if (game.state === "post_roll_cc_defender" && !has_window_cc_options("post_roll_cc_defender", CP, false)) {
			continue_after_post_roll_cc()
			return
		}

		if (game.state === "post_battle_cc_cp" && !has_window_cc_options("post_battle_cc_cp", CP, false)) {
			continue_after_post_battle_cc()
			return
		}

		if (game.state === "post_advance_cc_cp" && !has_window_cc_options("post_advance_cc_cp", CP, false)) {
			goto_attack()
			return
		}

		if (
			(game.state === "retreat" || game.state === "retreat_cancel") &&
			!game.retreat_choice_cc_done &&
			has_window_cc_options("retreat_choice_cc_cp", CP, true)
		) {
			game.retreat_choice_resume_state = game.state
			game.retreat_choice_prev_active = game.active
			game.retreat_choice_cc_done = true
			game.active = CP
			game.state = "retreat_choice_cc_cp"
			return
		}

		// If we entered a sub-state (retreat, advance, etc.), don't check event transition yet.
		// Those sub-states will call goto_attack() or check_event_next_state() when they finish.
		if (BATTLE_SUB_STATES.has(game.state)) {
			return
		}

		if (game.attack?.attacker) {
			game.active = game.attack.attacker
		}

		if (check_event_next_state()) {
			return
		}

		if (game.state === prev_state || !game.state) {
			if (!game.attack) {
				refresh_attack_eligibility()
				if (game.eligible_attackers.length > 0) game.state = "attack"
				else game.state = "end_operations"
			} else {
				game.state = "attack"
			}
		}
	}

	function resolve_jafar_pasha_post_battle() {
		let roll = roll_die(6, game)
		if (roll <= 3) {
			add_cc_retained(AP, combat.CC_CP_JAFAR_PASHA, "remove")
			log(`贾法尔帕夏：掷骰${roll}，卡牌交予协约国，正面朝上保留一次使用。`)
		} else {
			move_card_to_discard(combat.CC_CP_JAFAR_PASHA, CP)
			log(`贾法尔帕夏：掷骰${roll}，弃牌。`)
		}
		delete game.cc_jafar_pasha_post_battle
	}

	register_combat_card_state("post_roll_cc_defender", {
		prompt: "防守方：掷骰后战斗卡",
		is_attacker: false,
		get_options: () => collect_window_cc_options(game, "post_roll_cc_defender", CP, false),
		done: continue_after_post_roll_cc
	})

	register_combat_card_state("post_battle_cc_cp", {
		prompt: "同盟国：战斗后战斗卡",
		is_attacker: false,
		get_options: () => collect_window_cc_options(game, "post_battle_cc_cp", CP, false),
		done: continue_after_post_battle_cc
	})

	register_combat_card_state("post_retreat_cc_ap", {
		prompt: "协约国：敌方撤退后战斗卡",
		is_attacker: true,
		get_options: () => collect_window_cc_options(game, "post_retreat_cc_ap", AP, true),
		done() {
			continue_after_post_retreat_ap_cc(true)
		}
	})

	register_combat_card_state("post_advance_cc_cp", {
		prompt: "同盟国：挺近后战斗卡",
		is_attacker: false,
		get_options: () => collect_window_cc_options(game, "post_advance_cc_cp", CP, false),
		done: goto_attack
	})

	register_combat_card_state("post_advance_cc_ap", {
		prompt: "协约国：挺进后战斗卡",
		is_attacker: true,
		get_options: () => collect_window_cc_options(game, "post_advance_cc_ap", AP, true),
		done: continue_after_post_advance_ap_cc
	})

	register_combat_card_state("retreat_choice_cc_cp", {
		prompt: "同盟国：撤退选择阶段战斗卡",
		is_attacker: true,
		skip_confirm: true,
		get_options: () => collect_window_cc_options(game, "retreat_choice_cc_cp", CP, true),
		done() {
			continue_after_retreat_choice_cc_window()
		}
	})

	function fmt_attack_odds(game) {
		return combat.fmt_attack_odds(game)
	}

	/**
	 * 防守方分配损失状态 (Rule 12.6)
	 *
	 * 逻辑:
	 * 1. 计算待满足的伤害总量: game.attack.defender_losses - game.attack.defender_losses_absorbed
	 * 2. 如果伤害 >= 单位的 LF (Loss Factor)，则该单位可选以承受损失。
	 * 3. 必须分配损失直到无法再承受或伤害点数归零。
	 */
	states.apply_defender_losses = {
		prompt(res) {
			if (!game.attack) {
				res.prompt("无效的攻击状态.")
				res.action("done")
				return
			}
			let needed = game.attack.defender_losses - game.attack.defender_losses_absorbed
			if (needed <= 0) {
				res.prompt(`战斗结算: ${space_name(game.attack.space)}（防守方损失已完成）`)
				res.action("done")
				return
			}

			res.prompt(`防守方分配损失：${game.attack.defender_losses_absorbed}/${game.attack.defender_losses}`)
			let defenders = combat
				.get_combat_defenders(game, game.attack.space, active_faction())
				.filter((p) => data.pieces[p].type !== "hq" && !Engine.game_utils.is_heavy_arty(p))
			let fort_strength = 0
			let defender_faction = active_faction()
			if (combat.has_undestroyed_fort(game, game.attack.space, defender_faction)) {
				fort_strength = data.spaces[game.attack.space].fort || 0
			}

			let options = combat.get_loss_options(game, defenders, needed, fort_strength, "defender")
			for (let option of options) {
				if (option === combat.FORT_LOSS) res.space(game.attack.space)
				else res.piece(option)
			}

			if (options.length === 0) {
				res.prompt(`战斗结算: ${space_name(game.attack.space)}（无可分配损失）`)
				res.action("done")
			}
		},
		space(s) {
			if (s !== game.attack.space) return
			push_undo()
			let fort_strength = data.spaces[s].fort || 0
			let defender_faction = active_faction()
			if (combat.apply_fort_destruction(game, s, defender_faction, log)) {
				game.attack.defender_losses_absorbed += fort_strength
			}
		},
		piece(p) {
			push_undo()
			let lf = get_piece_lf(game, p)
			let was_reduced = Engine.game_utils.is_piece_reduced(game, p)
			combat.remember_variable_loss_other_unit_hit(game, "defender", p)
			mark_reserves_to_front_damage(p)
			ensure_attack_log_section("defender_loss_log_started", "防守方承伤：")
			reduce_piece(p)
			if (was_reduced) {
				log(`>> ${format_piece_log(p, true)} 被消灭`)
			} else {
				log(`>> ${format_piece_log(p, false)} 减员`)
			}
			game.attack.defender_losses_absorbed += lf
		},
		done() {
			clear_undo()
			if (game.attack && game.attack.space > 0) {
				combat.update_siege_after_combat_losses(game, game.attack.space)
				combat.mark_broken_siege_if_needed(game, game.attack.space, game.attack.attacker)
			}
			// Back to attacker using absolute anchor
			game.active = (game.attack && game.attack.attacker) || AP
			if (game.attack.second_fire === "defender") {
				delete game.attack.second_fire
				combat.resolve_second_fire(game, log)
				if (game.attack.attacker_losses > 0) {
					game.state = "apply_attacker_losses"
				} else {
					end_battle_sequence()
				}
			} else if (game.attack.attacker_losses > 0) {
				game.state = "apply_attacker_losses"
			} else {
				end_battle_sequence()
			}
		}
	}

	states.eliminate_retreated_units = {
		prompt(res) {
			if (!game.attack) {
				res.prompt("无效的攻击状态.")
				res.action("done")
				return
			}
			let defender_faction = game.attack.defender || active_faction()
			let retreated_defenders = get_pieces_in_space(game, game.attack.space).filter(
				(p) =>
					Engine.game_utils.get_piece_effective_faction(game, p) === defender_faction &&
					set_has(game.retreated, p)
			)
			if (retreated_defenders.length === 0) {
				res.prompt(`战斗结算: ${space_name(game.attack.space)}（无此前退却单位）`)
				res.action("done")
				return
			}
			res.prompt("移除本行动轮先前已退却的防守单位")
			for (let p of retreated_defenders) res.piece(p)
		},
		piece(p) {
			push_undo()
			log(`${format_piece_log(p, true)} 因本行动轮先前已退却，在当前战斗造成损失后被摧毁。`)
			mark_reserves_to_front_damage(p)
			eliminate_piece(p)
			set_delete(game.retreated, p)
		},
		done() {
			game.state = "apply_defender_losses"
		}
	}

	/**
	 * 进攻方分配损失状态 (Rule 12.6)
	 *
	 * 逻辑同 apply_defender_losses，针对进攻方参与战斗的单位。
	 * 使用变量: game.attack.attacker_losses (总伤害) 和 game.attack.attacker_losses_absorbed (已分配 LF)。
	 */
	states.apply_attacker_losses = {
		prompt(res) {
			if (!game.attack) {
				res.prompt("无效的攻击状态.")
				res.action("done")
				return
			}
			let needed = game.attack.attacker_losses - game.attack.attacker_losses_absorbed
			if (needed <= 0) {
				res.prompt(`战斗结算: ${space_name(game.attack.space)}（进攻方损失已完成）`)
				res.action("done")
				return
			}

			res.prompt(
				`攻击方承伤 (已承受: ${game.attack.attacker_losses_absorbed} / 需要: ${game.attack.attacker_losses})`
			)
			let attackers = game.attack.pieces.filter(
				(p) => !is_not_on_map(game, p) && data.pieces[p].type !== "hq" && !Engine.game_utils.is_heavy_arty(p)
			)
			let options = combat.get_loss_options(game, attackers, needed, 0, "attacker")
			for (let p of options) res.piece(p)

			if (options.length === 0) {
				res.prompt(`战斗结算: ${space_name(game.attack.space)} (剩余伤害不足以导致减员)`)
				res.action("done")
			}
		},
		piece(p) {
			push_undo()
			let lf = get_piece_lf(game, p)
			let was_reduced = Engine.game_utils.is_piece_reduced(game, p)
			combat.remember_variable_loss_other_unit_hit(game, "attacker", p)
			mark_reserves_to_front_damage(p)
			ensure_attack_log_section("attacker_loss_log_started", "进攻方承伤：")
			reduce_piece(p)
			if (was_reduced) {
				log(`>> ${format_piece_log(p, true)} 被消灭`)
			} else {
				log(`>> ${format_piece_log(p, false)} 减员`)
			}
			game.attack.attacker_losses_absorbed += lf
		},
		done() {
			clear_undo()
			if (game.attack && game.attack.space > 0) {
				combat.update_siege_after_combat_losses(game, game.attack.space)
				combat.mark_broken_siege_if_needed(game, game.attack.space, game.attack.defender)
			}
			if (game.attack.second_fire === "attacker") {
				delete game.attack.second_fire
				combat.resolve_second_fire(game, log)
				if (game.attack.defender_losses > 0) {
					game.active = other_faction(game.attack.attacker)
					game.state = combat.get_defender_losses_state(game)
				} else {
					end_battle_sequence()
				}
			} else {
				end_battle_sequence()
			}
		}
	}

	states.choose_lcu_replacement = {
		prompt(res) {
			if (!game.attack || !game.attack.replacement) {
				res.prompt("无效的替换状态.")
				res.action("done")
				return
			}
			let lcu = game.attack.replacement.unit
			res.prompt(`LCU ${piece_name(lcu)} 被击溃：请从预备军格选择一个 SCU 进行替换`)
			for (let p of game.attack.replacement.options) res.piece(p)
		},
		piece(p) {
			push_undo()
			let replacement_scu = replace_lcu_with_scu(
				game.attack.replacement.unit,
				game.attack.replacement.space,
				p,
				game.attack.replacement.runtime_state
			)
			if (game.attack && replacement_scu >= 0) {
				if (!game.attack.lcu_replacement_map) game.attack.lcu_replacement_map = {}
				game.attack.lcu_replacement_map[game.attack.replacement.unit] = replacement_scu
			}
			let return_state = game.attack.replacement.return_state
			delete game.attack.replacement
			resume_replacement_return_state(return_state)
		},
		done() {
			if (game.attack && game.attack.replacement) {
				let return_state = game.attack.replacement.return_state
				delete game.attack.replacement
				resume_replacement_return_state(return_state)
			} else {
				game.state = "apply_defender_losses"
			}
		}
	}

	function check_event_next_state() {
		if (game.event_next_state) {
			let next_state = game.event_next_state
			let next_active = game.active
			if (game.event_next_state === "event_russo_british_assault_ru_activation_setup") {
				Engine.event_states.begin_russo_british_russian_activation(game)
				delete game.event_next_state
				return true
			}
			// Russo-British Assault (Card 1) is an AP event
			if (game.event_next_state.startsWith("event_russo_british_assault")) {
				next_active = AP
			}
			// Enver Goes East (Card 7) is an AP event that uses CP pieces
			else if (game.event_next_state.startsWith("event_enver_goes_east")) {
				next_active = AP
			}
			// Arab Revolt Cleanup (Card 16) is an AP event
			else if (game.event_next_state === "event_arab_revolt_cleanup") {
				next_active = AP
			}
			// Grand Duke to Tiflis (Card 20) is an AP event
			else if (game.event_next_state === "event_grand_duke_to_tiflis_sr") {
				next_active = AP
			}
			// Turkish Reinforcements (Card 81) is a CP event
			else if (game.event_next_state === "event_turkish_reinf_81_combine") {
				next_active = CP
			}

			delete game.event_next_state
			set_next_state_after_interrupt(next_state, next_active)

			return true
		}
		return false
	}

	function goto_attack() {
		if (game.attack && game.attack.attacker) {
			game.active = game.attack.attacker
		}
		if (check_event_next_state()) return
		game.attack = null
		clear_battle_runtime_state()

		refresh_attack_eligibility()
		if (game.eligible_attackers.length > 0) {
			set_next_state_after_interrupt("attack", game.active)
		} else {
			goto_end_operations()
		}
	}

	function finish_turkish_retreat() {
		combat.finish_turkish_retreat(game)
		if (game.state === "attack" && !game.attack) {
			check_event_next_state()
		}
	}

	function enter_post_battle_cc_window(resume) {
		if (!has_window_cc_options("post_battle_cc_cp", CP, false)) return false
		game.post_battle_cc_resume = resume
		game.active = CP
		game.state = "post_battle_cc_cp"
		return true
	}

	function enter_post_retreat_ap_cc_window(resume) {
		if (!has_window_cc_options("post_retreat_cc_ap", AP, true)) return false
		game.ptbp_advance_resume = resume
		game.active = AP
		game.state = "post_retreat_cc_ap"
		return true
	}

	function enter_post_advance_ap_cc_window() {
		if (!game.ptbp_post_retreat_declined) return false
		if (!has_window_cc_options("post_advance_cc_ap", AP, true)) return false
		game.active = AP
		game.state = "post_advance_cc_ap"
		return true
	}

	function clear_save_tiflis_flags() {
		combat.clear_save_tiflis_state(game)
	}

	function get_catastrophic_attack_state() {
		return game.catastrophic_attack || null
	}

	function select_catastrophic_attack_stack(origin) {
		let cat = get_catastrophic_attack_state()
		if (!cat) return false
		let option = (cat.options || []).find((entry) => entry.origin === origin)
		if (!option) return false
		cat.origin = origin
		cat.participants = option.participants.slice()
		cat.retreating_pieces = option.participants.filter(
			(p) =>
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				combat.get_attack_piece_origin(game, p) === origin &&
				game.pieces[p] === origin
		)
		cat.retreat_space = null
		cat.advanced_pieces = []
		cat.advance_remaining = {}
		game.selected_piece = null
		game.active = AP
		game.state = "catastrophic_attack_retreat"
		return true
	}

	function get_catastrophic_attack_retreat_spaces() {
		let cat = get_catastrophic_attack_state()
		let retreating = cat?.retreating_pieces || []
		if (retreating.length === 0) return []
		let valid = []
		let first_piece = true
		for (let p of retreating) {
			let piece_valid = get_valid_retreat_spaces(game, p, [], 1, true)
			if (first_piece) {
				valid = piece_valid.slice()
				first_piece = false
			} else {
				valid = valid.filter((s) => set_has(piece_valid, s))
			}
		}
		if (valid.length === 0) return []
		return combat.apply_retreat_priorities(game, retreating[0], valid)
	}

	function complete_catastrophic_attack_retreat(destination = null) {
		let cat = get_catastrophic_attack_state()
		if (!cat) return
		let retreating = (cat.retreating_pieces || []).filter((p) => !is_not_on_map(game, p) && !is_eliminated(game, p))
		let from_space = cat.origin
		if (destination > 0 && retreating.length > 0) {
			ensure_attack_log_section("retreat_log_started", "撤退：")
			log(`>> ${retreating.map((p) => format_piece_log(p)).join(", ")} → s${destination}`)
			for (let p of retreating) {
				game.pieces[p] = destination
				set_add(game.retreated, p)
			}
			if (
				!Engine.map.is_controlled_by(game, destination, AP) &&
				retreating.some((p) => can_unit_gain_control(p))
			) {
				set_control(game, destination, AP)
			}
			if (Engine.check_persia_entry_vp_penalty) {
				Engine.check_persia_entry_vp_penalty(game, destination, retreating)
			}
			if (from_space > 0) {
				Engine.sync_neutral_vp_state(game, from_space)
				Engine.sync_jihad_city_state(game, from_space)
				Engine.sync_region_control(game, from_space)
			}
			Engine.sync_region_control(game, destination)
			Engine.sync_neutral_vp_state(game, destination)
			Engine.sync_jihad_city_state(game, destination)
			cat.retreat_space = destination
			cat.retreat_stack = retreating.slice()
			cat.retreat_stack_oos = retreating.every((p) => !Engine.map.is_in_supply(game, destination, AP, p))
			if (cat.retreat_stack_oos) {
				if (!Array.isArray(game.catastrophic_attack_supply_exceptions)) {
					game.catastrophic_attack_supply_exceptions = []
				}
				game.catastrophic_attack_supply_exceptions = game.catastrophic_attack_supply_exceptions.filter(
					(entry) => !(entry && entry.space === destination)
				)
				game.catastrophic_attack_supply_exceptions.push({
					space: destination,
					retreat_stack: retreating.slice(),
					created_turn: game.turn
				})
			}
			let ap_pieces = get_pieces_in_space(game, destination).filter(
				(p) => Engine.game_utils.get_piece_effective_faction(game, p) === AP
			)
			if (Engine.map.get_stack_count(ap_pieces) > 3) {
				if (!Array.isArray(game.catastrophic_attack_overstacks)) game.catastrophic_attack_overstacks = []
				game.catastrophic_attack_overstacks = game.catastrophic_attack_overstacks.filter(
					(entry) => !(entry && entry.space === destination && entry.faction === AP)
				)
				game.catastrophic_attack_overstacks.push({
					space: destination,
					faction: AP,
					created_turn: game.turn,
					created_action_round: game.action_round
				})
			}
		} else if (retreating.length > 0) {
			ensure_attack_log_section("retreat_log_started", "撤退：")
			for (let p of retreating) {
				log(`>> ${format_piece_log(p, true)} 无法撤退并被永久消灭`)
				eliminate_piece_for_failed_retreat(p)
			}
			if (from_space > 0) {
				Engine.sync_neutral_vp_state(game, from_space)
				Engine.sync_jihad_city_state(game, from_space)
				Engine.sync_region_control(game, from_space)
			}
			cat.retreat_space = null
			cat.retreat_stack = []
			cat.retreat_stack_oos = false
		}
		cat.retreating_pieces = []
		if (enter_post_battle_cc_window({ kind: "catastrophic_attack" })) return
		enter_catastrophic_attack_advance_state()
	}

	function enter_catastrophic_attack_advance_state() {
		let cat = get_catastrophic_attack_state()
		if (!cat) {
			goto_attack()
			return
		}
		let initial_defenders = Array.isArray(game.attack?.initial_defenders)
			? new Set(game.attack.initial_defenders)
			: null
		let defenders = get_pieces_in_space(game, cat.defender_space).filter(
			(p) =>
				(!initial_defenders || initial_defenders.has(p)) &&
				Engine.game_utils.get_piece_effective_faction(game, p) === CP &&
				Engine.game_utils.get_piece_mf(p) > 0 &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				!(Array.isArray(game.retreated) && set_has(game.retreated, p))
		)
		cat.advance_candidates = defenders
		cat.advance_remaining = {}
		for (let p of defenders) {
			cat.advance_remaining[p] = Engine.game_utils.get_piece_mf(p) > 0 ? 3 : 1
		}
		cat.advanced_pieces = []
		game.selected_piece = null
		game.active = CP
		game.state = "catastrophic_attack_advance"
	}

	function is_catastrophic_attack_retreat_transit_space(cat, s) {
		return !!(cat?.retreat_space && s === cat.retreat_space && Engine.map.contains_enemy_pieces(game, s, CP))
	}

	function get_catastrophic_attack_forced_transit_pieces(cat) {
		if (!cat) return []
		return (cat.advance_candidates || []).filter(
			(p) =>
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p) &&
				is_catastrophic_attack_retreat_transit_space(cat, game.pieces[p])
		)
	}

	function is_catastrophic_attack_retreat_stack_oos(cat) {
		if (!cat?.retreat_stack_oos || !cat.retreat_space || !Array.isArray(cat.retreat_stack)) return false
		let retreating = cat.retreat_stack.filter(
			(p) =>
				game.pieces[p] === cat.retreat_space &&
				Engine.game_utils.get_piece_effective_faction(game, p) === AP &&
				!is_not_on_map(game, p) &&
				!is_eliminated(game, p)
		)
		if (retreating.length === 0) return false
		return retreating.every((p) => !Engine.map.is_in_supply(game, cat.retreat_space, AP, p))
	}

	function can_catastrophic_attack_use_retreat_stack_for_supply(cat, s) {
		return !!(cat?.retreat_space && s === cat.retreat_space && is_catastrophic_attack_retreat_stack_oos(cat))
	}

	function can_catastrophic_attack_enter_beachhead(s) {
		if (!Engine.map.is_beachhead_space(game, s)) return true
		let adjacent = get_connected_spaces(s).filter((next) => !Engine.map.is_island_base(next))
		return adjacent.every((next) => !Engine.map.contains_enemy_pieces(game, next, CP))
	}

	function get_catastrophic_attack_supply_status(cat, p, space) {
		let context = Engine.map.create_supply_context(game)
		let status = Engine.map.get_supply_status(game, space, CP, p, false, null, context)
		if (Engine.map.is_supply_status_in_supply(status)) return status
		if (!is_catastrophic_attack_retreat_stack_oos(cat)) return status

		let sources = Engine.map.get_supply_sources_from_data(game, CP)
		return Engine.map.get_supply_trace_status_to_source(game, space, CP, sources, context, {
			allow_enemy_transit(_game, _current, next, faction) {
				return faction === CP && can_catastrophic_attack_use_retreat_stack_for_supply(cat, next)
			}
		})
	}

	function is_catastrophic_attack_supply_legal_after_move(cat, p, to_space) {
		let from_space = game.pieces[p]
		let old_control = game.control[to_space]
		let can_gain_control =
			can_unit_gain_control(p) &&
			!Engine.map.contains_enemy_pieces(game, to_space, CP) &&
			!combat.has_undestroyed_fort(game, to_space, AP) &&
			Engine.can_set_control(game, to_space, CP)

		game.pieces[p] = to_space
		if (can_gain_control) game.control[to_space] = CP
		let status = get_catastrophic_attack_supply_status(cat, p, to_space)
		game.pieces[p] = from_space
		game.control[to_space] = old_control

		return Engine.map.is_supply_status_in_supply(status)
	}

	function get_catastrophic_attack_advance_spaces(p, options = {}) {
		let cat = get_catastrophic_attack_state()
		if (!cat || !cat.advance_remaining) return []
		let from_space = options.from_space ?? game.pieces[p]
		let remaining = options.remaining_steps ?? cat.advance_remaining[p] ?? 0
		let exclude_space = options.exclude_space
		if (!(remaining > 0) || !(from_space > 0)) return []
		let connected = Engine.map.get_piece_connected_spaces_for_rule(game, from_space, p)
		let candidates =
			from_space === cat.defender_space ? connected.filter((s) => s === cat.origin) : connected.slice()
		let valid = []
		for (let s of candidates) {
			if (exclude_space !== undefined && s === exclude_space) continue
			if (!can_enter_area(game, p, s)) continue
			let is_retreat_transit = is_catastrophic_attack_retreat_transit_space(cat, s)
			if (!can_catastrophic_attack_enter_beachhead(s)) continue
			if (!is_retreat_transit && Engine.map.contains_enemy_pieces(game, s, CP)) continue
			if (!is_retreat_transit && !can_stack_end_in_space(game, s, [p])) continue
			if (!is_retreat_transit && !Engine.map.is_beachhead_space(game, s)) {
				if (!is_catastrophic_attack_supply_legal_after_move(cat, p, s)) continue
			}
			if (is_retreat_transit) {
				let remaining_after_move = remaining - 1
				if (remaining_after_move <= 0) continue
				let exits = get_catastrophic_attack_advance_spaces(p, {
					from_space: s,
					remaining_steps: remaining_after_move,
					exclude_space: from_space
				})
				if (exits.length === 0) continue
			}
			valid.push(s)
		}
		return [...new Set(valid)]
	}

	function move_catastrophic_attack_piece(p, to_space) {
		let cat = get_catastrophic_attack_state()
		if (!cat) return false
		let from_space = game.pieces[p]
		let is_retreat_transit = is_catastrophic_attack_retreat_transit_space(cat, to_space)
		if (is_retreat_transit) {
			game.pieces[p] = to_space
		} else if (!advance_piece_into_space(p, from_space, to_space)) {
			return false
		}
		cat.advance_remaining[p] = Math.max(0, (cat.advance_remaining[p] || 0) - 1)
		set_add(cat.advanced_pieces, p)
		return true
	}

	function finish_catastrophic_attack_advance() {
		game.selected_piece = null
		let cat = get_catastrophic_attack_state()
		let forced_transit = get_catastrophic_attack_forced_transit_pieces(cat)
		if (forced_transit.length > 0) {
			game.selected_piece = forced_transit[0]
			return
		}
		if (
			game.active === CP &&
			cat &&
			(cat.advanced_pieces || []).length > 0 &&
			has_window_cc_options("post_advance_cc_cp", CP, false)
		) {
			game.state = "post_advance_cc_cp"
			return
		}
		goto_attack()
	}

	function create_advance_resume(advance_space = game.attack?.space) {
		return {
			kind: "advance",
			advance_space,
			save_tiflis_failed: !!game.save_tiflis_failed
		}
	}

	function enter_finish_attack_window() {
		return enter_post_battle_cc_window({ kind: "finish_attack" })
	}

	function continue_after_post_retreat_cancel() {
		delete game.retreat_cancel_undo_depth
		clear_undo()
		game.retreat_phase_done = true
		if (enter_post_retreat_ap_cc_window(null)) {
			clear_retreat_runtime_state()
			return
		}
		clear_retreat_runtime_state()
		end_battle_sequence()
	}

	function enter_turkish_retreat_state() {
		combat.enter_turkish_retreat_state(game)
		let snapshot = sync_turkish_retreat_state()
		if (!snapshot.pending) {
			finish_turkish_retreat()
		}
	}

	function ensure_retreat_steps(pieces, distance = game.retreat_distance || 1) {
		if (!game.retreat_steps_left) {
			game.retreat_steps_left = {}
			for (let p of pieces) game.retreat_steps_left[p] = distance
		}
	}

	function get_turkish_retreat_pieces() {
		return [...(game.turkish_retreat_mandatory || []), ...(game.turkish_retreat_optional || [])]
	}

	function derive_turkish_retreat_state() {
		if (!game.turkish_retreat_pending) {
			return {
				pending: false,
				retreat_space: game.turkish_retreat_space ?? game.attack?.space,
				mandatory: [],
				optional: [],
				selected_piece: null
			}
		}
		let retreat_space = game.turkish_retreat_space ?? game.attack?.space
		let is_valid_turkish_retreat_piece = (p) =>
			retreat_space !== undefined && !is_not_on_map(game, p) && game.pieces[p] === retreat_space
		let mandatory = (game.turkish_retreat_mandatory || []).filter(is_valid_turkish_retreat_piece)
		let optional = (game.turkish_retreat_optional || []).filter(is_valid_turkish_retreat_piece)
		let can_control = (p) => set_has(mandatory, p) || set_has(optional, p)
		let selected_piece =
			game.selected_piece !== null && game.selected_piece !== undefined && can_control(game.selected_piece)
				? game.selected_piece
				: null
		if (mandatory.length === 0 && optional.length === 0 && game.battle_result) {
			let current_cp_defenders = get_pieces_in_space(game, retreat_space).filter(
				(p) =>
					Engine.game_utils.get_piece_effective_faction(game, p) === CP &&
					!is_not_on_map(game, p) &&
					!is_eliminated(game, p)
			)
			if (game.battle_result.retreat_needed && game.battle_result.retreating_faction === CP) {
				mandatory = current_cp_defenders
				optional = []
			} else {
				mandatory = current_cp_defenders.filter(
					(p) =>
						(data.pieces[p].nation === "tu" || data.pieces[p].nation === "tua") &&
						data.pieces[p].piece_class === "SCU"
				)
				optional = current_cp_defenders.filter((p) => !set_has(mandatory, p))
			}
		}
		return {
			pending: mandatory.length > 0 || optional.length > 0,
			retreat_space,
			mandatory,
			optional,
			selected_piece
		}
	}

	function sync_turkish_retreat_state() {
		let snapshot = derive_turkish_retreat_state()
		game.turkish_retreat_mandatory = snapshot.mandatory
		game.turkish_retreat_optional = snapshot.optional
		game.selected_piece = snapshot.selected_piece
		if (!snapshot.pending) {
			delete game.turkish_retreat_pending
		}
		return snapshot
	}

	function resume_replacement_return_state(return_state) {
		game.state = return_state || "apply_defender_losses"
	}

	function cancel_post_retreat_cancel() {
		let undo_depth = Number.isInteger(game.retreat_cancel_undo_depth)
			? game.retreat_cancel_undo_depth
			: Math.max(0, (game.undo?.length || 0) - 1)
		while ((game.undo?.length || 0) > undo_depth) {
			if (!pop_undo()) break
		}
		delete game.retreat_cancel_undo_depth
	}

	function clear_retreat_runtime_state(options = {}) {
		delete game.retreat_pieces
		delete game.retreat_space
		delete game.retreat_from
		if (!options.preserve_advance_context) {
			delete game.retreat_distance
			delete game.retreat_first_spaces
		}
		game.retreat_steps_left = null
	}

	function can_unit_gain_control(p) {
		return Engine.game_utils.is_regular(p)
	}

	function finalize_retreat_unit(game, p, from, destination) {
		let faction = data.pieces[p].faction
		if (!Engine.map.is_controlled_by(game, destination, faction)) {
			if (can_unit_gain_control(p)) {
				set_control(game, destination, faction)
			}
		}
		if (Engine.check_persia_entry_vp_penalty) {
			Engine.check_persia_entry_vp_penalty(game, destination, [p])
		}
		let retreat_origin = game.attack?.space
		if (from > 0) {
			Engine.sync_neutral_vp_state(game, from)
			Engine.sync_jihad_city_state(game, from)
			Engine.sync_region_control(game, from)
		}
		if (retreat_origin > 0 && retreat_origin !== from) {
			Engine.sync_neutral_vp_state(game, retreat_origin)
			Engine.sync_jihad_city_state(game, retreat_origin)
			Engine.sync_region_control(game, retreat_origin)
		}
		Engine.sync_region_control(game, destination)
		Engine.sync_neutral_vp_state(game, destination)
		Engine.sync_jihad_city_state(game, destination)
	}

	function get_lcu_replaced_by_scu(scu) {
		let replacement_map = game.attack?.lcu_replacement_map
		if (!replacement_map || typeof replacement_map !== "object") return null
		for (let lcu of Object.keys(replacement_map)) {
			if (Number(replacement_map[lcu]) === scu) return Number(lcu)
		}
		return null
	}

	function eliminate_piece_for_failed_retreat(p) {
		if (p === null || p === undefined || !data.pieces[p]) return

		// PUG 12.7.4: non-Tribe units that cannot complete retreat are PE.
		let permanent = data.pieces[p].type !== "tribe"
		eliminate_piece(p, permanent)

		// PUG 12.7.4 note: if a combat replacement SCU fails retreat,
		// the original LCU and the replacement SCU are both PE.
		let replaced_lcu = get_lcu_replaced_by_scu(p)
		if (replaced_lcu && data.pieces[replaced_lcu]) {
			if (!Engine.game_utils.is_permanently_eliminated(game, replaced_lcu)) {
				eliminate_piece(replaced_lcu, true)
			}
			delete game.attack.lcu_replacement_map[replaced_lcu]
		}
	}

	function clear_battle_runtime_state() {
		delete game.reserves_to_front_effected_pieces
		clear_retreat_runtime_state()
		delete game.jafar_pasha_retreat
		delete game.cc_jafar_pasha_retreat
		delete game.jafar_pasha_advance_after_cancel
		delete game.advance_pieces
		delete game.advance_space
		delete game.advance_count
		delete game.advance_limit
		delete game.advance_follow_mode
		delete game.advance_follow_pieces
		delete game.advance_yildirim_used
		delete game.advance_trench_processed
		delete game.turkish_retreat_prev_active
		delete game.turkish_retreat_chosen_space
		delete game.turkish_retreat
		delete game.post_battle_cc_resume
		delete game.ptbp_advance_resume
		delete game.ptbp_post_retreat_declined
		delete game.jerusalem_withdrawal
		delete game.selected_piece
		delete game.battle_result
		delete game.battle_resolution_applied
		delete game.confused_orders
		delete game.confused_orders_used
		delete game.ptbp_active
		delete game.ptbp_units
		combat.clear_catastrophic_attack_state(game)
	}

	function enter_advance_state(resume) {
		if (!combat.begin_advance(game, game.battle_result, resume.advance_space)) {
			clear_save_tiflis_flags()
			if (combat.check_offer_ptbp_extra_attack(game)) {
				game.state = "ptbp_extra_attack_prompt"
				return
			}
			goto_attack()
			return
		}
		if (resume.save_tiflis_failed && game.battle_result?.no_advance) {
			log("Russian units could not retreat towards Tiflis; full-strength TU/TUA units may advance.")
		}
		clear_save_tiflis_flags()
	}

	function continue_after_jafar_pasha_cancelled_battle() {
		let resume = game.jafar_pasha_advance_after_cancel
		delete game.jafar_pasha_advance_after_cancel
		if (game.cc_jafar_pasha_post_battle) resolve_jafar_pasha_post_battle()
		if (!resume || !(resume.advance_space > 0)) {
			goto_attack()
			return
		}
		if (!combat.begin_advance(game, game.battle_result, resume.advance_space)) {
			goto_attack()
		}
	}

	function continue_after_defender_retreat(resume, allow_post_battle_cc) {
		if (!game.battle_result?.no_advance || resume.save_tiflis_failed) {
			if (allow_post_battle_cc && enter_post_battle_cc_window(resume)) {
				clear_retreat_runtime_state()
				return
			}
			if (enter_post_retreat_ap_cc_window(resume)) {
				clear_retreat_runtime_state()
				return
			}
			enter_advance_state(resume)
			clear_retreat_runtime_state()
			return
		}
		clear_save_tiflis_flags()
		goto_attack()
	}

	function continue_after_post_retreat_ap_cc(declined) {
		let resume = game.ptbp_advance_resume
		delete game.ptbp_advance_resume
		if (declined) game.ptbp_post_retreat_declined = true
		game.active = game.attack?.attacker || AP
		if (resume) {
			enter_advance_state(resume)
			clear_retreat_runtime_state()
			return
		}
		if (combat.check_offer_ptbp_extra_attack(game)) {
			game.active = AP
			game.state = "ptbp_extra_attack_prompt"
			return
		}
		goto_attack()
	}

	function continue_after_post_advance_ap_cc() {
		delete game.ptbp_post_retreat_declined
		if (combat.check_offer_ptbp_extra_attack(game)) {
			game.active = AP
			game.state = "ptbp_extra_attack_prompt"
			return
		}
		goto_attack()
	}

	function continue_after_post_battle_cc() {
		let resume = game.post_battle_cc_resume
		delete game.post_battle_cc_resume
		game.active = game.attack?.attacker || AP

		switch (resume?.kind) {
			case "resolve_battle":
				game.post_battle_cc_done = true
				end_battle_sequence()
				return
			case "advance":
				continue_after_defender_retreat(resume, false)
				return
			case "catastrophic_attack":
				enter_catastrophic_attack_advance_state()
				return
		}

		goto_attack()
	}

	function finish_retreat_resolution() {
		if (game.jerusalem_withdrawal) {
			delete game.jerusalem_withdrawal
			game.active = game.attack?.attacker || AP
			enter_jerusalem_withdrawal_advance()
			clear_retreat_runtime_state()
			return
		}
		if (game.active === game.attack?.defender) {
			game.active = game.attack?.attacker || AP
			game.retreat_phase_done = true
			clear_retreat_runtime_state({ preserve_advance_context: true })
			end_battle_sequence()
		} else if (game.turkish_retreat_pending) {
			game.turkish_retreat_attacker_retreated = true
			enter_turkish_retreat_state()
			clear_retreat_runtime_state()
		} else {
			goto_attack()
		}
	}

	function maybe_finish_retreat() {
		if ((game.retreat_pieces?.length || 0) === 0 && game.selected_piece === null) {
			finish_retreat_resolution()
		}
	}

	function maybe_finish_turkish_retreat() {
		if (
			(game.turkish_retreat_mandatory?.length || 0) === 0 &&
			(game.turkish_retreat_optional?.length || 0) === 0 &&
			game.selected_piece === null
		) {
			finish_turkish_retreat()
		}
	}

	function is_save_tiflis_exempt_space(space) {
		if (game.save_tiflis_exempt_spaces && set_has(game.save_tiflis_exempt_spaces, space)) return true
		if (game.save_tiflis_exempt_spaces) return false
		let pieces_here = get_pieces_in_space(game, space)
		return (
			pieces_here.some((p2) => data.pieces[p2].name === "RU Yudenitch HQ") ||
			combat.has_undestroyed_fort(game, space, AP) ||
			combat.has_undestroyed_fort(game, space, CP)
		)
	}

	function get_save_tiflis_retreat_spaces(piece) {
		const TIFLIS = 12
		let current_dist = Engine.map.get_distance(game.pieces[piece], TIFLIS)
		let is_closer_to_tiflis = (s) => Engine.map.get_distance(s, TIFLIS) < current_dist
		let is_friendly = (s) => Engine.map.is_controlled_by(game, s, game.active)
		let legal = combat.get_valid_retreat_spaces(game, piece, [], 1, false).filter(is_closer_to_tiflis)
		let friendly_legal = legal.filter(is_friendly)

		if (friendly_legal.length > 0) return friendly_legal

		let friendly_ignoring_stacking = combat
			.get_valid_retreat_spaces(game, piece, [], 1, true)
			.filter((s) => is_closer_to_tiflis(s) && is_friendly(s))
		let friendly_blocked_by_stacking = friendly_ignoring_stacking.some(
			(s) => !Engine.map.can_stack_end_in_space(game, s, [piece])
		)

		if (!friendly_blocked_by_stacking) return []
		return legal.filter((s) => !is_friendly(s))
	}

	function finish_save_tiflis_exempt_piece() {
		let p = game.selected_piece
		if (p === null || p === undefined) return false
		if (!is_save_tiflis_exempt_space(game.pieces[p])) return false
		push_undo()
		log(`${piece_name(p)} is exempt from Save Tiflis retreat.`)
		set_delete(game.save_tiflis_pieces, p)
		game.selected_piece = null
		return true
	}

	states.save_tiflis_retreat = {
		prompt(res) {
			if (game.selected_piece === null || game.selected_piece === undefined) {
				res.prompt("Save Tiflis：选择向第比利斯撤退的单位")
				for (let p of game.save_tiflis_pieces || []) {
					res.piece(p)
				}
				if ((game.save_tiflis_pieces || []).length === 0) {
					res.action("done")
				}
			} else {
				let piece = game.selected_piece
				res.prompt(`正在撤退 ${piece_name(piece)} 到第比利斯`)

				let valid = get_save_tiflis_retreat_spaces(piece)
				let piece_space = game.pieces[piece]
				let exempt = is_save_tiflis_exempt_space(piece_space)
				let can_decline = exempt || valid.length === 0

				if (valid.length === 0) {
					if (exempt) {
						res.prompt(`${piece_name(piece)} 免于撤退。`)
						res.action("decline_retreat")
					} else {
						res.prompt(`无法让 ${piece_name(piece)} 向第比利斯方向撤退。`)
						res.action("cannot_retreat")
					}
				} else {
					for (let s of valid) res.space(s)
					if (can_decline) res.action("decline_retreat")
				}
				res.piece(piece)
			}
		},
		piece(p) {
			if (game.selected_piece === p) {
				game.selected_piece = null
			} else if (set_has(game.save_tiflis_pieces, p)) {
				game.selected_piece = p
			}
		},
		space(s) {
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				if (!set_has(get_save_tiflis_retreat_spaces(p), s)) return
				push_undo()
				let from = game.pieces[p]
				log(`${piece_name(p)} retreats to ${space_name(s)} (towards Tiflis).`)
				game.pieces[p] = s
				if (from === game.attack?.space) {
					game.save_tiflis_vacated_battle_space = true
				}
				if (!Engine.map.is_controlled_by(game, s, game.active) && data.pieces[p].type === "regular") {
					set_control(game, s, game.active)
				}
				if (Engine.check_persia_entry_vp_penalty) {
					Engine.check_persia_entry_vp_penalty(game, s, [p])
				}
				if (from > 0) Engine.sync_region_control(game, from)
				Engine.sync_region_control(game, s)
				Engine.sync_neutral_vp_state(game, s)
				Engine.sync_jihad_city_state(game, s)
				set_delete(game.save_tiflis_pieces, p)
				game.selected_piece = null
			}
		},
		cannot_retreat() {
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				push_undo()
				log(`${piece_name(p)} cannot retreat towards Tiflis and remains in place.`)
				game.save_tiflis_failed = true
				set_delete(game.save_tiflis_pieces, p)
				game.selected_piece = null
			}
		},
		decline_retreat() {
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				if (!is_save_tiflis_exempt_space(game.pieces[p])) return
				push_undo()
				log(`${piece_name(p)} is exempt from Save Tiflis retreat.`)
				set_delete(game.save_tiflis_pieces, p)
				game.selected_piece = null
			}
		},
		done() {
			if (game.selected_piece !== null && game.selected_piece !== undefined) {
				if (finish_save_tiflis_exempt_piece()) return
			}
			clear_undo()
			delete game.save_tiflis_pieces
			delete game.save_tiflis_exempt_spaces
			delete game.selected_piece

			// Restore active faction to attacker (CP)
			game.active = game.attack.attacker

			end_battle_sequence()
		}
	}

	states.retreat_cancel = {
		prompt(res) {
			res.prompt("防守方可以额外承受 1 级损失以取消撤退")
			let steps = count_steps(game, game.retreat_pieces)
			if (steps > 1) {
				for (let p of game.retreat_pieces) {
					res.piece(p)
				}
			} else {
				res.prompt("防守方必须撤退")
			}
			res.action("proceed_retreat")
		},
		piece(p) {
			let undo_depth = game.undo?.length || 0
			push_undo()
			game.retreat_cancel_undo_depth = undo_depth
			log(`防守方取消撤退 ${format_piece_log(p)} 额外承受1级损失`)

			game.retreat_pieces = []
			game.selected_piece = null
			game.retreat_space = null
			game.retreat_steps_left = null
			game.battle_result.retreat_needed = false

			game.state = "post_retreat_cancel"
			reduce_piece(p)
		},
		proceed_retreat() {
			push_undo()
			game.state = "retreat"
		}
	}

	states.post_retreat_cancel = {
		prompt(res) {
			res.prompt("撤退取消已完成")
			res.action("done")
			res.action("cancel")
		},
		done() {
			continue_after_post_retreat_cancel()
		},
		cancel() {
			cancel_post_retreat_cancel()
		}
	}

	states.catastrophic_attack_choose_stack = {
		prompt(res) {
			let cat = get_catastrophic_attack_state()
			if (!cat || (cat.options || []).length === 0) {
				res.prompt("灾难性攻击：没有包含英印澳新战斗单位的进攻堆叠")
				res.action("done")
				return
			}

			res.prompt("灾难性攻击：选择一个包含英印澳新战斗单位的进攻堆叠撤退 1 格")
			res.where(cat.defender_space)
			res.who(game.attack?.pieces || [])
			for (let option of cat.options) {
				res.space(option.origin)
			}
		},
		space(s) {
			push_undo()
			select_catastrophic_attack_stack(s)
		},
		done() {
			goto_attack()
		}
	}

	states.catastrophic_attack_retreat = {
		prompt(res) {
			let cat = get_catastrophic_attack_state()
			if (!cat) {
				res.prompt("灾难性攻击撤退已结束")
				res.action("done")
				return
			}

			let retreating = cat.retreating_pieces || []
			res.who(retreating)
			if (cat.origin > 0) {
				res.where(cat.origin)
			}

			if (retreating.length === 0) {
				res.prompt("灾难性攻击撤退已完成")
				res.action("done")
				return
			}

			let valid = get_catastrophic_attack_retreat_spaces()
			res.prompt(`灾难性攻击：将 ${space_name(cat.origin)} 的整堆部队撤退 1 格`)
			if (valid.length === 0) {
				res.action("eliminate_stack")
				return
			}

			for (let s of valid) res.space(s)
		},
		space(s) {
			push_undo()
			complete_catastrophic_attack_retreat(s)
		},
		eliminate_stack() {
			push_undo()
			complete_catastrophic_attack_retreat(null)
		},
		done() {
			enter_catastrophic_attack_advance_state()
		}
	}

	states.catastrophic_attack_advance = {
		prompt(res) {
			let cat = get_catastrophic_attack_state()
			if (!cat) {
				res.prompt("灾难性攻击挺进已结束")
				res.action("done")
				return
			}

			let candidates = (cat.advance_candidates || []).filter(
				(p) => !is_not_on_map(game, p) && !is_eliminated(game, p)
			)
			let forced_transit = get_catastrophic_attack_forced_transit_pieces(cat)
			let movable = candidates.filter((p) => get_catastrophic_attack_advance_spaces(p).length > 0)
			res.where(cat.defender_space)
			res.who(candidates)

			if (game.selected_piece === null || game.selected_piece === undefined) {
				res.prompt("灾难性攻击：选择同盟国防守部队进行最多 3 格挺进")
				if (forced_transit.length === 0) res.action("end_advance")
				for (let p of forced_transit.length > 0 ? forced_transit : movable) res.piece(p)
				return
			}

			let piece = game.selected_piece
			let valid = get_catastrophic_attack_advance_spaces(piece)
			if (!candidates.includes(piece) || valid.length === 0) {
				game.selected_piece = null
				res.prompt("灾难性攻击：选择同盟国防守部队进行最多 3 格挺进")
				if (forced_transit.length === 0) res.action("end_advance")
				for (let p of forced_transit.length > 0 ? forced_transit : movable) res.piece(p)
				return
			}

			res.prompt(`灾难性攻击：选择 ${piece_name(piece)} 的挺进地块`)
			if (forced_transit.length === 0 && !is_catastrophic_attack_retreat_transit_space(cat, game.pieces[piece])) {
				res.action("end_advance")
			}
			for (let s of valid) res.space(s)
			res.piece(piece)
		},
		piece(p) {
			let cat = get_catastrophic_attack_state()
			if (!cat) return
			if (game.selected_piece === p) {
				game.selected_piece = null
				return
			}
			if (set_has(cat.advance_candidates || [], p) && get_catastrophic_attack_advance_spaces(p).length > 0) {
				game.selected_piece = p
			}
		},
		space(s) {
			let p = game.selected_piece
			if (p === null || p === undefined) return
			let valid = get_catastrophic_attack_advance_spaces(p)
			if (!set_has(valid, s)) return
			push_undo()
			ensure_attack_log_section("advance_log_started", "挺近：")
			log(`>> ${format_piece_log(p)} → s${s}`)
			if (!move_catastrophic_attack_piece(p, s)) {
				game.selected_piece = null
				return
			}
			if (get_catastrophic_attack_advance_spaces(p).length === 0) {
				game.selected_piece = null
			}
		},
		done() {
			finish_catastrophic_attack_advance()
		},
		end_advance() {
			finish_catastrophic_attack_advance()
		}
	}

	states.retreat = {
		prompt(res) {
			if (!game.retreat_pieces) {
				game.retreat_pieces = []
			}
			res.who(game.retreat_pieces)
			res.where(game.retreat_space)
			if (game.retreat_space) {
				let retreat_from = game.retreat_from ?? game.attack?.space
				let from_name = retreat_from !== undefined ? data.spaces[retreat_from]?.name : null
				let to_name = data.spaces[game.retreat_space]?.name
				if (from_name && to_name && from_name !== to_name) {
					res.prompt(`正在撤退从 ${from_name} 的单位到 ${to_name}`)
				} else if (from_name) {
					res.prompt(`正在从 ${from_name} 撤退单位`)
				} else if (to_name) {
					res.prompt(`正在撤退到 ${to_name}`)
				} else {
					res.prompt("正在选择撤退路径")
				}
			} else {
				res.prompt("正在选择撤退路径")
			}

			if (game.retreat_pieces.length === 0) {
				res.prompt("撤退已完成")
				res.action("done")
				return
			}

			ensure_retreat_steps(game.retreat_pieces)

			let piece = game.retreat_pieces[0] // Default for auto-selection logic if needed
			if (game.selected_piece !== null && game.selected_piece !== undefined) piece = game.selected_piece

			if (game.selected_piece === null || game.selected_piece === undefined) {
				// Select piece phase
				res.prompt("选择撤退单位")
				for (let p of game.retreat_pieces) {
					res.piece(p)
				}
			} else {
				// Move piece phase
				res.prompt(`选择 ${piece_name(piece)} 的撤退路径`)

				let remaining_steps = game.retreat_steps_left[piece] || 1
				let valid = get_valid_retreat_spaces(
					game,
					piece,
					game.attack ? [game.attack.space] : [],
					remaining_steps,
					false // obey stacking limit; overstack retreat destination is illegal
				)
				valid = combat.apply_retreat_priorities(game, piece, valid)

				if (valid.length === 0) {
					// Cannot retreat - Eliminate
					res.action("eliminate_retreating")
				} else {
					for (let s of valid) res.space(s)
				}

				// Allow deselect
				res.piece(piece)
			}
		},
		done() {
			clear_undo()
			finish_retreat_resolution()
		},
		piece(p) {
			ensure_retreat_steps(game.retreat_pieces)
			if (game.selected_piece === p) {
				game.selected_piece = null
			} else if (set_has(game.retreat_pieces, p)) {
				game.selected_piece = p
			}
		},
		space(s) {
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				push_undo()
				let from = game.pieces[p]
				ensure_attack_log_section("retreat_log_started", "撤退：")
				log(`>> ${format_piece_log(p)} → s${s}`)
				game.pieces[p] = s
				game.retreat_from = s
				game.retreat_space = s
				let remaining_before_move = game.retreat_steps_left[p] || 1
				if (remaining_before_move === (game.retreat_distance || 1)) {
					if (!game.retreat_first_spaces) game.retreat_first_spaces = []
					set_add(game.retreat_first_spaces, s)
				}
				let remaining = remaining_before_move - 1
				let ends_retreat_here =
					remaining <= 0 || Engine.map.is_region(game, s) || Engine.map.is_island_base(game, s)
				if (ends_retreat_here) {
					finalize_retreat_unit(game, p, from, s)
					set_delete(game.retreat_pieces, p)
					delete game.retreat_steps_left[p]
					set_add(game.retreated, p)
				} else {
					game.retreat_steps_left[p] = remaining
				}
				game.selected_piece = null
				maybe_finish_retreat()
			}
		},
		eliminate_retreating() {
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				push_undo()
				ensure_attack_log_section("retreat_log_started", "撤退：")
				log(`>> ${format_piece_log(p, true)} 无法撤退并被消灭`)
				eliminate_piece_for_failed_retreat(p)
				set_delete(game.retreat_pieces, p)
				if (game.retreat_steps_left) delete game.retreat_steps_left[p]
				game.selected_piece = null
				maybe_finish_retreat()
			}
		}
	}

	states.turkish_retreat = {
		prompt(res) {
			let snapshot = derive_turkish_retreat_state()
			if (!snapshot.pending) {
				res.prompt("土耳其撤退已完成")
				res.action("done")
				return
			}

			ensure_retreat_steps(get_turkish_retreat_pieces(), 1)

			if (snapshot.selected_piece !== null && snapshot.selected_piece !== undefined) {
				let piece = snapshot.selected_piece
				res.prompt(`正在撤退 ${piece_name(piece)}`)

				let valid = get_valid_retreat_spaces(
					game,
					piece,
					snapshot.retreat_space !== undefined ? [snapshot.retreat_space] : [],
					game.retreat_steps_left[piece] || 1,
					false // obey stacking limit; overstack retreat destination is illegal
				)

				// Rule 6.1.7: Must retreat to a single adjacent space that is not enemy-occupied and does not contain a fortress.
				valid = valid.filter((s) => !combat.has_undestroyed_fort(game, s, other_faction(active_faction())))

				valid = combat.apply_retreat_priorities(game, piece, valid)

				if (valid.length === 0) {
					res.action("eliminate_retreating")
				} else {
					for (let s of valid) res.space(s)
				}

				res.piece(piece)
				return
			}

			if (snapshot.mandatory.length > 0) {
				res.prompt("土耳其撤退：必须选择部队进行撤退")
				for (let p of snapshot.mandatory) res.piece(p)
				// PUG Rule 617: Turkish SCUs MUST retreat. If only mandatory units remain, skip is not allowed.
				return
			}

			if (snapshot.optional.length > 0) {
				res.prompt("土耳其撤退：可以选择其他部队进行撤退")
				for (let p of snapshot.optional) res.piece(p)
				res.action("skip_turkish_retreat")
				return
			}

			res.prompt("土耳其撤退已完成")
			res.action("done")
		},
		done() {
			finish_turkish_retreat()
		},
		piece(p) {
			sync_turkish_retreat_state()
			ensure_retreat_steps(get_turkish_retreat_pieces(), 1)
			if (game.selected_piece === p) {
				game.selected_piece = null
				return
			}
			if (
				(game.turkish_retreat_mandatory && set_has(game.turkish_retreat_mandatory, p)) ||
				(game.turkish_retreat_optional && set_has(game.turkish_retreat_optional, p))
			) {
				game.selected_piece = p
			}
		},
		space(s) {
			sync_turkish_retreat_state()
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				push_undo()
				let from = game.pieces[p]
				ensure_attack_log_section("retreat_log_started", "撤退：")
				log(`>> ${format_piece_log(p)} → s${s}`)
				game.pieces[p] = s

				finalize_retreat_unit(game, p, from, s)

				if (game.turkish_retreat_mandatory && set_has(game.turkish_retreat_mandatory, p)) {
					set_delete(game.turkish_retreat_mandatory, p)
				}
				if (game.turkish_retreat_optional && set_has(game.turkish_retreat_optional, p)) {
					set_delete(game.turkish_retreat_optional, p)
				}
				delete game.retreat_steps_left[p]
				set_add(game.retreated, p)
				game.selected_piece = null
				maybe_finish_turkish_retreat()
			}
		},
		eliminate_retreating() {
			sync_turkish_retreat_state()
			let p = game.selected_piece
			if (p !== null && p !== undefined) {
				push_undo()
				ensure_attack_log_section("retreat_log_started", "撤退：")
				log(`>> ${format_piece_log(p, true)} 无法撤退并被消灭`)
				eliminate_piece_for_failed_retreat(p)
				if (game.turkish_retreat_mandatory && set_has(game.turkish_retreat_mandatory, p)) {
					set_delete(game.turkish_retreat_mandatory, p)
				}
				if (game.turkish_retreat_optional && set_has(game.turkish_retreat_optional, p)) {
					set_delete(game.turkish_retreat_optional, p)
				}
				delete game.retreat_steps_left[p]
				game.selected_piece = null
				maybe_finish_turkish_retreat()
			}
		},
		skip_turkish_retreat() {
			sync_turkish_retreat_state()
			push_undo()
			game.turkish_retreat_optional = []
			finish_turkish_retreat()
		}
	}

	function get_follow_advance_spaces(p) {
		let valid = []
		for (let s of game.retreat_first_spaces || []) {
			if (get_valid_advance_spaces(game, p, s).length > 0) valid.push(s)
		}
		return valid
	}

	function advance_piece_into_space(p, from_space, to_space) {
		game.pieces[p] = to_space
		if (active_faction() === CP && Engine.map.is_beachhead_space(game, to_space)) {
			let has_ap_units = get_pieces_in_space(game, to_space).some(
				(uid) => Engine.game_utils.get_piece_effective_faction(game, uid) === AP
			)
			if (!has_ap_units) {
				Engine.map.clear_beachhead(game, to_space)
				if (Engine.map.is_non_balkan_beachhead(to_space)) {
					update_jihad_level(game, 2)
					let bonus = count_beachhead_captured_materiel_bonus()
					if (bonus > 0) {
						game.tu_rp_bonus = (game.tu_rp_bonus || 0) + bonus
						log(
							`空滩头在推进中被同盟国摧毁：${space_name(to_space)}，圣战等级 +2，土耳其奖励RP +${bonus}。`
						)
					} else {
						log(`空滩头在推进中被同盟国摧毁：${space_name(to_space)}，圣战等级 +2。`)
					}
				} else {
					log(`空滩头在推进中被同盟国摧毁：${space_name(to_space)}。`)
				}
				game.pieces[p] = from_space
				return false
			}
		}
		if (is_enemy_trench(game, to_space, active_faction()) && !game.advance_trench_processed) {
			let trench_result = enter_trench(game, to_space, active_faction())
			if (trench_result.action === "degraded") {
				log(`${space_name(to_space)}处战壕已降级`)
			} else if (trench_result.action === "removed") {
				log(`${space_name(to_space)}处战壕已移除`)
			}
			game.advance_trench_processed = true
		}
		resolve_russian_winter_offensive_advance(game, p, to_space, log)
		let enemy_holds_contested_region =
			!!data.spaces[to_space]?.region && Engine.map.contains_enemy_pieces(game, to_space, active_faction())
		let can_occupy_for_czars_armories =
			!Engine.map.is_controlled_by(game, to_space, active_faction()) &&
			can_unit_gain_control(p) &&
			!enemy_holds_contested_region
		let will_control_to_space =
			can_occupy_for_czars_armories &&
			!combat.has_undestroyed_fort(game, to_space, other_faction(active_faction()))
		// Sync VP and jihad BEFORE set_control so the previous controller is still the old one
		Engine.sync_neutral_vp_state(game, to_space, undefined, { silent: will_control_to_space })
		Engine.sync_jihad_city_state(game, to_space)
		if (!Engine.map.is_controlled_by(game, to_space, active_faction())) {
			if (
				can_occupy_for_czars_armories &&
				active_faction() === CP &&
				combat_cards.is_czars_armories_trigger_space(to_space)
			) {
				game.captured_russian_vp_in_advance = true
			}
			if (!combat.has_undestroyed_fort(game, to_space, other_faction(active_faction()))) {
				if (can_unit_gain_control(p) && !enemy_holds_contested_region) {
					set_control(game, to_space, active_faction())
				}
			}
		}
		if (Engine.check_persia_entry_vp_penalty) {
			Engine.check_persia_entry_vp_penalty(game, to_space, [p])
		}
		if (from_space > 0) {
			Engine.sync_neutral_vp_state(game, from_space)
			Engine.sync_jihad_city_state(game, from_space)
			Engine.sync_region_control(game, from_space)
		}
		Engine.sync_region_control(game, to_space)
		if (Engine.neutral.is_greece_neutral(game) && Engine.neutral.is_athens_space(to_space)) {
			Engine.neutral.trigger_greece_entry(game, to_space, active_faction(), "战斗推进进入雅典", (msg) => log(msg))
		}
		check_immediate_jihad_rebellion_on_entry(from_space, to_space, [p])
		combat.award_army_of_islam_advance_bonus(game, to_space, active_faction(), log)
		return true
	}

	states.advance = {
		prompt(res) {
			let is_blocked_by_reserves_to_front = (p) =>
				game.attack &&
				game.attack.attacker === CP &&
				game.reserves_to_front_effected_pieces &&
				set_has(game.reserves_to_front_effected_pieces, p)

			if (game.advance_follow_mode) {
				let selectable = (game.advance_follow_pieces || []).filter(
					(p) => get_follow_advance_spaces(p).length > 0
				)
				res.prompt("选择继续推进的单位")
				res.action("end_advance")
				if (selectable.length === 0) {
					res.who(game.advance_follow_pieces || [])
					return
				}
				if (game.selected_piece === null || game.selected_piece === undefined) {
					for (let p of selectable) res.piece(p)
				} else if (set_has(selectable, game.selected_piece)) {
					let p = game.selected_piece
					res.prompt(`选择 ${piece_name(p)} 的继续推进地块`)
					for (let s of get_follow_advance_spaces(p)) res.space(s)
					res.piece(p)
				} else {
					game.selected_piece = null
					for (let p of selectable) res.piece(p)
				}
				res.who(game.advance_follow_pieces || [])
				return
			}

			let mandatory = []
			if (game.mcc_advance && (game.advance_count || 0) === 0) {
				mandatory = game.advance_pieces.filter((p) => data.pieces[p].name === "ANZ Desert Corps")
			}

			if (mandatory.length > 0) {
				res.prompt("靶心指令 (MCC)：必须推进 ANZ Desert Corps")
				for (let p of mandatory) res.piece(p)
			} else {
				res.prompt("推进至 " + space_name(game.advance_space))
				res.action("end_advance")

				if ((game.advance_count || 0) < (game.advance_limit || 3)) {
					for (let p of game.advance_pieces) {
						if (is_blocked_by_reserves_to_front(p)) {
							continue
						}
						let valid = get_valid_advance_spaces(game, p, game.advance_space)
						if (valid.length > 0) {
							res.piece(p)
						}
					}
				} else {
					for (let p of game.advance_pieces) {
						if (is_blocked_by_reserves_to_front(p)) {
							continue
						}
						let is_hq = data.pieces[p].type === "hq"
						let is_heavy_arty = Engine.game_utils.is_heavy_arty(p)
						let is_yildirim = data.pieces[p].symbol === "Y" && data.pieces[p].nation === "ge"
						if (is_hq || is_heavy_arty || (is_yildirim && !game.advance_yildirim_used)) {
							let valid = get_valid_advance_spaces(game, p, game.advance_space)
							if (valid.length > 0) {
								res.piece(p)
							}
						}
					}
				}
			}
			res.get_action("piece")
			res.where(game.advance_space)
			res.who(game.advance_pieces)
		},
		piece(p) {
			if (game.advance_follow_mode) {
				if (game.selected_piece === p) game.selected_piece = null
				else if (set_has(game.advance_follow_pieces || [], p)) game.selected_piece = p
				return
			}

			if (!set_has(game.advance_pieces || [], p)) return
			push_undo()
			let from_space = game.pieces[p]
			ensure_attack_log_section("advance_log_started", "挺近：")
			log(`>> ${format_piece_log(p)} → s${game.advance_space}`)
			if (!advance_piece_into_space(p, from_space, game.advance_space)) {
				set_delete(game.advance_pieces, p)
				this.end_advance({ skip_undo: true })
				return
			}

			let is_hq = data.pieces[p].type === "hq"
			let is_heavy_arty = Engine.game_utils.is_heavy_arty(p)
			let is_yildirim = data.pieces[p].symbol === "Y" && data.pieces[p].nation === "ge"
			let yildirim_free = false
			if (is_yildirim && !game.advance_yildirim_used) {
				game.advance_yildirim_used = true
				yildirim_free = true
			}

			if (!is_hq && !is_heavy_arty && !yildirim_free) {
				game.advance_count = (game.advance_count || 0) + 1
			}

			let stop_for_terrain = is_advance_stop_terrain(game, game.advance_space)
			let stop_for_water_crossing = combat.is_water_crossing_attack_edge(game, from_space, game.advance_space, [p])
			let can_follow = false
			if ((game.retreat_distance || 1) > 1 && !stop_for_terrain && !stop_for_water_crossing) {
				can_follow = get_follow_advance_spaces(p).length > 0
			}

			if (stop_for_terrain || stop_for_water_crossing) {
				if (!game.advanced_stopped) game.advanced_stopped = []
				set_add(game.advanced_stopped, p)
			}

			if (can_follow) {
				if (!game.advance_follow_pieces) game.advance_follow_pieces = []
				set_add(game.advance_follow_pieces, p)
			}

			bulls_eye_record_advanced_piece(game, p)
			set_delete(game.advance_pieces, p)

			let count_limited_left = game.advance_pieces.some((uid) => {
				let is_hq = data.pieces[uid].type === "hq"
				let is_heavy_arty = Engine.game_utils.is_heavy_arty(uid)
				let is_yildirim = data.pieces[uid].symbol === "Y" && data.pieces[uid].nation === "ge"
				if (is_hq || is_heavy_arty) return false
				return !(is_yildirim && !game.advance_yildirim_used)
			})
			let limit_reached = (game.advance_count || 0) >= (game.advance_limit || 3)

			if (game.advance_pieces.length === 0 || (limit_reached && !count_limited_left)) {
				let selectable_follow = (game.advance_follow_pieces || []).filter(
					(uid) => get_follow_advance_spaces(uid).length > 0
				)
				if ((game.retreat_distance || 1) > 1 && selectable_follow.length > 0) {
					game.advance_follow_mode = true
					game.selected_piece = null
				}
			} else if (limit_reached) {
				let allowed = game.advance_pieces.filter((uid) => {
					if (data.pieces[uid].type === "hq") return true
					if (Engine.game_utils.is_heavy_arty(uid)) return true
					return (
						!game.advance_yildirim_used &&
						data.pieces[uid].symbol === "Y" &&
						data.pieces[uid].nation === "ge"
					)
				})
				if (allowed.length === 0) {
					let selectable_follow = (game.advance_follow_pieces || []).filter(
						(uid) => get_follow_advance_spaces(uid).length > 0
					)
					if ((game.retreat_distance || 1) > 1 && selectable_follow.length > 0) {
						game.advance_follow_mode = true
						game.selected_piece = null
					}
				}
			}
		},
		space(s) {
			if (!game.advance_follow_mode) return
			let p = game.selected_piece
			if (p === null || p === undefined) return
			let valid = get_follow_advance_spaces(p)
			if (!set_has(valid, s)) return
			push_undo()
			ensure_attack_log_section("advance_log_started", "挺近：")
			log(`>> ${format_piece_log(p)} → s${s}`)
			let from_space = game.pieces[p]
			if (!advance_piece_into_space(p, from_space, s)) {
				set_delete(game.advance_follow_pieces, p)
				game.selected_piece = null
			} else {
				set_delete(game.advance_follow_pieces, p)
				game.selected_piece = null
			}
			let selectable = (game.advance_follow_pieces || []).filter(
				(uid) => get_follow_advance_spaces(uid).length > 0
			)
			if (selectable.length === 0) {
				game.selected_piece = null
			}
		},
		end_advance(options = {}) {
			options ||= {}
			if (!options.skip_undo) push_undo()
			delete game.advance_follow_mode
			delete game.advance_follow_pieces
			delete game.retreat_distance
			delete game.retreat_first_spaces
			delete game.selected_piece
			delete game.advance_yildirim_used
			if (bulls_eye_can_extra_attack(game)) {
				set_next_state_after_interrupt("bulls_eye_extra_attack_prompt", game.active)
				return
			}
			game.bulls_eye_advanced_stack = []
			if (game.active === AP && enter_post_advance_ap_cc_window()) {
				return
			}
			if (combat.check_offer_ptbp_extra_attack(game)) {
				set_next_state_after_interrupt("ptbp_extra_attack_prompt", game.active)
				return
			}
			if (game.active === CP && has_window_cc_options("post_advance_cc_cp", CP, false)) {
				set_next_state_after_interrupt("post_advance_cc_cp", CP)
				return
			}
			goto_attack()
		}
	}

	states.bulls_eye_extra_attack_prompt = {
		prompt(res) {
			res.prompt("靶心指令：激活推进的土耳其部队进行额外进攻？")
			res.action("yes")
			res.action("no")
		},
		yes() {
			game.state = "bulls_eye_attack"
		},
		no() {
			game.bulls_eye_advanced_stack = []
			goto_attack()
		}
	}

	states.bulls_eye_attack = {
		prompt(res) {
			res.prompt("靶心指令：选择额外进攻的目标")

			let targets = get_attackable_spaces(game.bulls_eye_advanced_stack)

			for (let t of targets) {
				res.space(t)
			}
			res.action("cancel")
		},
		space(s) {
			push_undo()
			game.attack = {
				pieces: game.bulls_eye_advanced_stack,
				space: s,
				extra_attack: true
			}
			bulls_eye_use_extra_attack(game)
			game.bulls_eye_advanced_stack = []

			game.state = "confirm_attack"
		},
		cancel() {
			game.bulls_eye_advanced_stack = []
			game.attack = null
			game.state = "attack"
		}
	}

	states.ptbp_extra_attack_prompt = {
		prompt(res) {
			res.prompt("竭尽全力：激活推进的英/印/澳新部队进行额外进攻？")
			res.action("yes")
			res.action("no")
		},
		yes() {
			game.state = "ptbp_attack"
		},
		no() {
			delete game.ptbp_units
			delete game.ptbp_active
			goto_attack()
		}
	}

	states.ptbp_attack = {
		prompt(res) {
			res.prompt("竭尽全力：选择额外进攻的目标")
			let targets = get_attackable_spaces(game.ptbp_units)
			for (let t of targets) {
				res.space(t)
			}
			res.action("cancel")
		},
		space(s) {
			push_undo()
			game.attack = {
				pieces: game.ptbp_units,
				space: s,
				extra_attack: true
			}
			delete game.ptbp_units
			delete game.ptbp_active
			game.state = "confirm_attack"
		},
		cancel() {
			delete game.ptbp_units
			delete game.ptbp_active
			game.attack = null
			game.state = "attack"
		}
	}

	return {
		start_attack_sequence,
		get_attackable_spaces
	}
}
