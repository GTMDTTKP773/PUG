"use strict"

let game

exports.set_globals = function (g) {
	game = g
}

exports.register = function (states, Engine, context) {
	const { data } = Engine
	const DEBUG_ACTION_TRACE = !!(
		typeof process !== "undefined" &&
		process &&
		process.env &&
		(process.env.PUG_DEBUG_ACTION === "1" || process.env.PUG_DEBUG_ACTION === "true")
	)

	const {
		log,
		log_br,
		log_h2,
		log_h3_faction,
		active_faction,
		push_undo,
		pop_undo,
		clear_undo,
		can_play_sr_card_this_round,
		can_play_rp_card_this_round,
		can_play_event,
		play_event,
		get_event_entry,
		record_action,
		discard_card,
		remove_card,
		add_rps,
		update_war_status,
		start_ops_from_event,
		start_event,
		update_jihad_level,
		goto_end_event,
		goto_end_operations,
		ACTION_OPS,
		ACTION_ONE_OP,
		ACTION_SR,
		ACTION_RPS,
		ACTION_EVENT,
		AP,
		CP,
		push_state,
		is_in_reserve,
		is_not_on_map,
		can_use_reserve_sr_for_piece,
		can_sr_piece,
		get_sr_cost,
		piece_name,
		space_name,
		is_reserve_space_id,
		get_sr_destinations,
		save_rollback_point,
		save_pre_replacement_rollback_point,
		has_supply_warnings,
		goto_review_supply_warnings,
		start_attrition_phase,
		get_pieces_in_space,
		clear_event_ctx,
		card_name
	} = context

	function action_now() {
		return Date.now()
	}

	function set_action_round_entry_state() {
		game.state = "play_card"
	}

	function get_catastrophic_attack_overstack_status(entry) {
		if (!entry || entry.space <= 0 || !entry.faction) return null
		let pieces = get_pieces_in_space(game, entry.space).filter(
			(p) => Engine.game_utils.get_piece_effective_faction(game, p) === entry.faction
		)
		let counted = Engine.map.get_stack_counted_pieces(pieces)
		if (counted.length <= 3) return null
		return {
			entry,
			space: entry.space,
			faction: entry.faction,
			pieces,
			counted
		}
	}

	function cleanup_catastrophic_attack_overstacks() {
		if (!Array.isArray(game.catastrophic_attack_overstacks)) return
		game.catastrophic_attack_overstacks = game.catastrophic_attack_overstacks.filter((entry) =>
			get_catastrophic_attack_overstack_status(entry)
		)
		if (game.catastrophic_attack_overstacks.length === 0) delete game.catastrophic_attack_overstacks
	}

	function is_catastrophic_attack_overstack_due(entry) {
		if (!entry || entry.faction !== AP || game.active !== AP) return false
		return entry.created_turn !== game.turn || entry.created_action_round !== game.action_round
	}

	function get_due_catastrophic_attack_overstacks() {
		if (!Array.isArray(game.catastrophic_attack_overstacks)) return []
		return game.catastrophic_attack_overstacks
			.filter((entry) => is_catastrophic_attack_overstack_due(entry))
			.map((entry) => get_catastrophic_attack_overstack_status(entry))
			.filter(Boolean)
	}

	function enter_catastrophic_attack_overstack_pe() {
		cleanup_catastrophic_attack_overstacks()
		if (get_due_catastrophic_attack_overstacks().length === 0) return false
		game.state = "catastrophic_attack_overstack_pe"
		return true
	}

	function log_action_debug(payload) {
		if (!DEBUG_ACTION_TRACE) return
		console.log("[调试][action-perf]", payload)
	}

	function get_final_round_mo_warning() {
		if (game.action_round !== 6) return ""
		if (Engine.mo && typeof Engine.mo.get_final_round_mo_warning === "function") {
			return Engine.mo.get_final_round_mo_warning(game, active_faction())
		}
		return ""
	}

	function set_action_state(next_state) {
		if (
			(game.state === "jihad_placement" ||
				game.state === "jihad_removal" ||
				game.state === "jihad_rebellion_check" ||
				game.state === "place_egyptian_rebellion") &&
			game.state_stack &&
			game.state_stack.length > 0
		) {
			game.state_stack[game.state_stack.length - 1].state = next_state
		} else {
			game.state = next_state
		}
	}

	function begin_ops_action(card, ops) {
		let t0 = DEBUG_ACTION_TRACE ? action_now() : 0
		if (card === undefined || card === null) {
			log(`自动行动 (${ops})`)
			record_action(ACTION_ONE_OP, 0)
			game.card = null
		} else {
			log(`${card_name(card)} -- 行动点 (${ops})`)
			record_action(ACTION_OPS, card)
			discard_card(card)
		}
		game.ops = ops
		game.card_ops = ops
		game.activated = { move: [], attack: [] }
		game.activation_cost = {}
		game.moved = []
		game.attacked = []
		game.attacked_spaces = []
		game.retreated = []
		game.balkan_attack_targets = { ap: -1, ap_mo: -1, cp: -1 }
		game.state = "activate_spaces"
		if (DEBUG_ACTION_TRACE) {
			log_action_debug({
				phase: "begin_ops_action",
				card: card ?? null,
				ops,
				elapsed_ms: action_now() - t0
			})
		}
	}

	function log_card_action(card, mode, value) {
		if (value !== undefined && value !== null) {
			log(`${card_name(card)} -- ${mode} (${value})`)
		} else {
			log(`${card_name(card)} -- ${mode}`)
		}
	}

	function can_use_rp_action(info) {
		return !!(info.rp_a || info.rp_br || info.rp_ru || info.rp_ge || info.rp_tu || info.rp_in || info.rp_ah)
	}

	function format_rp_points(info) {
		const fields = [
			["rp_a", "A"],
			["rp_br", "BR"],
			["rp_ru", "RU"],
			["rp_in", "IN"],
			["rp_ah", "AH"],
			["rp_ge", "GE"],
			["rp_tu", "TU"]
		]
		let parts = []
		for (let [key, label] of fields) {
			let value = Number(info[key] || 0)
			if (value > 0) parts.push(`${label} ${value}`)
		}
		return parts.length > 0 ? parts.join(", ") : null
	}

	const INFORMATION_REVEAL_EVENT_CARDS = new Set([18, 58, 70])

	function is_information_reveal_event(card) {
		return INFORMATION_REVEAL_EVENT_CARDS.has(Number(card))
	}

	function can_play_event_cached(card) {
		return can_play_event(game, card)
	}

	function append_card_actions(res, card, info, allow_sr, allow_rp) {
		if (info.event && !info.cc && can_play_event_cached(card)) res.action("play_event", card)
		if (info.ops) res.action("play_ops", card)
		if (info.sr && allow_sr) res.action("play_sr", card)
		if (can_use_rp_action(info) && allow_rp) res.action("play_rps", card)
	}

	function perform_event_action(card, trace_phase) {
		let info = data.cards[card]
		if (!can_play_event(game, card)) {
			log(`${card_name(card)} 不能作为事件打出`)
			return false
		}
		let t0 = DEBUG_ACTION_TRACE ? action_now() : 0
		let entry = get_event_entry(card)
		let use_ops_fallback = !!(entry && entry.use_ops)
		log_card_action(card, "事件")
		record_action(ACTION_EVENT, card)

		if (info.remove) remove_card(card)
		else discard_card(card)

		if (info.ws) {
			update_war_status(game.active, info.ws)
		}

		let done = play_event(game, card, {
			log,
			goto_end_event,
			goto_end_operations,
			start_ops_from_event,
			start_event,
			push_state,
			clear_event_ctx,
			card_name,
			update_jihad_level: (g, amount) => update_jihad_level(g, amount)
		})
		if (!done) {
			log("事件未实现。")
			if (use_ops_fallback) {
				start_ops_from_event(card)
			} else {
				goto_end_operations()
			}
		}
		if (DEBUG_ACTION_TRACE) {
			log_action_debug({
				phase: trace_phase,
				card,
				use_ops_fallback: !done && use_ops_fallback,
				elapsed_ms: action_now() - t0
			})
		}
		return true
	}

	function clear_undo_after_information_reveal_event(card) {
		if (!is_information_reveal_event(card)) return
		if (game.undo && game.undo.length > 0) game.undo.pop()
	}

	function get_ap_beachheads() {
		return Engine.map.get_beachhead_spaces(game, AP)
	}

	function is_ottoman_port_source(s) {
		let info = data.spaces[s]
		return !!(info && info.port && (info.nation === "tu" || info.nation === "tua"))
	}

	function is_sea_sr_move(from, to) {
		if (!(from > 0 && to > 0 && data.spaces[from] && data.spaces[to])) return false
		if (from === to) return false
		let from_is_sea_port = Engine.map.is_port(from) || Engine.map.is_beachhead_space(game, from)
		let to_is_sea_port = Engine.map.is_port(to) || Engine.map.is_beachhead_space(game, to)
		return from_is_sea_port && to_is_sea_port
	}

	function format_sr_space(s) {
		if (s === Engine.constants.RESERVE) return "预备格"
		return space_name(s)
	}

	function create_sr_cost_cache() {
		return {
			supply_trace_cache: new Map(),
			supply_context:
				typeof Engine.map.create_supply_context === "function" ? Engine.map.create_supply_context(game) : null,
			source_cache: new Map(),
			status_cache: new Map(),
			disrupted_supply_sr_surcharge: new Map(),
			german_subs_sr_surcharge: new Map(),
			unrestricted_submarine_warfare_sr_surcharge: new Map()
		}
	}

	function get_cached_sr_destinations(p, faction) {
		let cache = game.sr_destinations
		if (
			cache &&
			cache.piece === p &&
			cache.faction === faction &&
			cache.source === game.pieces[p] &&
			Array.isArray(cache.destinations)
		) {
			return cache.destinations
		}
		return null
	}

	function cache_sr_destinations(p, faction) {
		let destinations = get_sr_destinations(game, p, faction)
		game.sr_destinations = {
			piece: p,
			faction,
			source: game.pieces[p],
			destinations
		}
		return destinations
	}

	function clear_sr_destinations() {
		delete game.sr_destinations
	}

	function with_temporarily_removed_beachhead(beachhead, fn) {
		let original = Array.isArray(game.beachheads) ? game.beachheads.slice() : []
		if (game.beachheads) Engine.utils.set_delete(game.beachheads, beachhead)
		let result = fn()
		game.beachheads = original
		return result
	}

	function get_port_departure_units(port) {
		return Engine.map.get_ap_units_supplied_solely_through_source(game, port)
	}

	function can_remove_empty_beachhead(beachhead) {
		if (active_faction() !== AP) return false
		if (get_pieces_in_space(game, beachhead).length > 0) return false
		let stranded = 0
		let currently_supplied = []
		for (let p = 0; p < game.pieces.length; p++) {
			if (!data.pieces[p] || data.pieces[p].faction !== AP) continue
			if (is_not_on_map(game, p) || is_in_reserve(game, p)) continue
			let s = game.pieces[p]
			if (s <= 0 || !data.spaces[s]) continue
			if (Engine.map.is_in_supply(game, s, AP, p)) currently_supplied.push(p)
		}
		with_temporarily_removed_beachhead(beachhead, () => {
			for (let p of currently_supplied) {
				let s = game.pieces[p]
				if (!Engine.map.is_in_supply(game, s, AP, p)) stranded++
			}
		})
		return stranded === 0
	}

	states.play_card = {
		inactive: "行动",
		prompt(res) {
			if (res && res._is_noop) return
			let t0 = DEBUG_ACTION_TRACE ? action_now() : 0
			let event_check_count = 0
			res.prompt(
				`第 ${game.turn} 回合, 行动轮 ${game.action_round}: 请选择一项行动${get_final_round_mo_warning()}`
			)
			let hand = game.active === AP ? game.hand_ap : game.hand_cp
			let allow_sr = can_play_sr_card_this_round(active_faction())
			let allow_rp = can_play_rp_card_this_round(active_faction())
			for (let c of hand) {
				let info = data.cards[c]
				if (info.event && !info.cc) event_check_count += 1
				append_card_actions(res, c, info, allow_sr, allow_rp)
			}
			if (active_faction() === AP) {
				for (let beachhead of get_ap_beachheads()) {
					if (can_remove_empty_beachhead(beachhead)) res.action("remove_beachhead", beachhead)
				}
			}
			res.action("single_op")
			if (DEBUG_ACTION_TRACE) {
				log_action_debug({
					phase: "play_card.prompt",
					hand_size: hand.length,
					event_checks: event_check_count,
					elapsed_ms: action_now() - t0
				})
			}
		},
		card(c) {
			push_undo()
			game.card = c
			game.last_card = c
			game.state = "card_action"
		},
		play_card(c) {
			this.card(c)
		},
		play_ops(c) {
			push_undo()
			game.card = c
			game.last_card = c
			let info = data.cards[c]
			begin_ops_action(c, info.ops)
		},
		single_op() {
			push_undo()
			begin_ops_action(null, 1)
		},
		play_sr(c) {
			if (!can_play_sr_card_this_round(active_faction())) {
				log("不能连续打出 SR 卡。")
				return
			}
			push_undo()
			game.card = c
			game.last_card = c
			let info = data.cards[c]
			log_card_action(c, "战略调整", info.sr)
			record_action(ACTION_SR, c)
			discard_card(c)
			game.sr = info.sr
			game.state = "sr_phase"
		},
		play_rps(c) {
			if (!can_play_rp_card_this_round(active_faction())) {
				log("不能连续打出 RP 卡。")
				return
			}
			push_undo()
			game.card = c
			game.last_card = c
			let info = data.cards[c]
			log_card_action(c, "补员", format_rp_points(info))
			record_action(ACTION_RPS, c)
			discard_card(c)
			add_rps(info)
			goto_end_operations()
		},
		play_event(c) {
			push_undo()
			game.card = c
			game.last_card = c
			if (perform_event_action(c, "play_card.play_event")) clear_undo_after_information_reveal_event(c)
		},
		remove_beachhead(beachhead) {
			push_undo()
			game.remove_beachhead_space = beachhead
			game.state = "confirm_remove_beachhead"
		}
	}

	states.confirm_remove_beachhead = {
		prompt(res) {
			let s = game.remove_beachhead_space
			let name = data.spaces[s] ? data.spaces[s].name : space_name(s)
			res.where(s)
			res.prompt(`是否移除 ${name} 的滩头标记？`)
			res.action("confirm")
			res.action("cancel")
		},
		confirm() {
			let s = game.remove_beachhead_space
			Engine.map.clear_beachhead(game, s)
			log(`移除空滩头：${space_name(s)}。`)
			delete game.remove_beachhead_space
			game.state = "play_card"
		},
		cancel() {
			delete game.remove_beachhead_space
			pop_undo()
		}
	}

	states.catastrophic_attack_overstack_pe = {
		inactive: "灾难性进攻超堆叠",
		prompt(res) {
			let violations = get_due_catastrophic_attack_overstacks()
			if (violations.length === 0) {
				res.prompt("灾难性进攻超堆叠已处理。")
				res.action("done")
				return
			}
			let violation = violations[0]
			res.where(violation.space)
			res.who(violation.counted)
			res.prompt(`灾难性进攻：${space_name(violation.space)} 仍然超堆叠，选择一个 AP 单位永久消灭。`)
			for (let p of violation.counted) res.piece(p)
		},
		piece(p) {
			let violations = get_due_catastrophic_attack_overstacks()
			let violation = violations[0]
			if (!violation || !violation.counted.includes(p)) return
			push_undo()
			Engine.game_utils.eliminate_piece(game, p, log, true)
			cleanup_catastrophic_attack_overstacks()
			if (get_due_catastrophic_attack_overstacks().length === 0) goto_end_action()
		},
		done() {
			cleanup_catastrophic_attack_overstacks()
			if (get_due_catastrophic_attack_overstacks().length === 0) goto_end_action()
		}
	}

	states.card_action = {
		prompt(res) {
			if (res && res._is_noop) return
			let t0 = DEBUG_ACTION_TRACE ? action_now() : 0
			let info = data.cards[game.card]
			res.prompt(`打出 ${card_name(game.card)}`)
			let allow_sr = can_play_sr_card_this_round(active_faction())
			let allow_rp = can_play_rp_card_this_round(active_faction())
			append_card_actions(res, game.card, info, allow_sr, allow_rp)
			res.action("cancel")
			if (DEBUG_ACTION_TRACE) {
				log_action_debug({
					phase: "card_action.prompt",
					card: game.card,
					elapsed_ms: action_now() - t0
				})
			}
		},
		play_ops(c) {
			if (c === undefined) c = game.card
			let info = data.cards[c]
			begin_ops_action(c, info.ops)
		},
		play_sr(c) {
			if (c === undefined) c = game.card
			if (!can_play_sr_card_this_round(active_faction())) {
				log("此回合不能连续打出 SR 卡。")
				return
			}
			let info = data.cards[c]
			log_card_action(c, "战略调整", info.sr)
			record_action(ACTION_SR, c)
			discard_card(c)
			game.sr = info.sr
			game.state = "sr_phase"
		},
		play_rps(c) {
			if (c === undefined) c = game.card
			if (!can_play_rp_card_this_round(active_faction())) {
				log("此回合不能连续打出 RP 卡。")
				return
			}
			let info = data.cards[c]
			log_card_action(c, "补员", format_rp_points(info))
			record_action(ACTION_RPS, c)
			discard_card(c)
			add_rps(info)
			goto_end_operations()
		},
		play_event(c) {
			if (c === undefined) c = game.card
			if (perform_event_action(c, "card_action.play_event")) clear_undo_after_information_reveal_event(c)
		},
		cancel() {
			game.card = null
			pop_undo()
		}
	}

	states.sr_phase = {
		prompt(res) {
			if (res && res._is_noop) return
			let sr_cost_cache = create_sr_cost_cache()
			if (game.where !== undefined && game.where !== -1) {
				res.where(game.where)
				res.prompt(`战略调整：选择从 ${space_name(game.where)} SR 的单位 (剩余 SR 点数: ${game.sr})`)
				let pieces = get_pieces_in_space(game, game.where)
				for (let p of pieces) {
					if (can_sr_piece(game, p, active_faction(), sr_cost_cache)) {
						let cost = get_sr_cost(p, game.pieces[p], null, active_faction(), sr_cost_cache)
						if (game.sr >= cost) {
							res.piece(p)
						}
					}
				}
				res.action("back")
			} else {
				res.prompt(`战略调整：选择要调整的单位或堆叠 (剩余 SR 点数: ${game.sr}。)`)
				let spaces = new Set()
				for (let p = 0; p < game.pieces.length; p++) {
					let from_reserve = is_in_reserve(game, p)
					if (is_not_on_map(game, p) && !from_reserve) continue
					if (from_reserve && !can_use_reserve_sr_for_piece(p)) continue
					if (can_sr_piece(game, p, active_faction(), sr_cost_cache)) {
						let from = from_reserve ? null : game.pieces[p]
						let cost = get_sr_cost(p, from, null, active_faction(), sr_cost_cache)
						if (game.sr >= cost) {
							res.piece(p)
							spaces.add(game.pieces[p])
						}
					}
				}
				for (let s of spaces) {
					res.space(s)
				}
			}

			if (game.sr > 0) {
				res.action("confirm_done_sr")
			} else {
				res.action("done")
			}
		},
		space(s) {
			game.where = s
		},
		piece(p) {
			push_undo() // 仅在选择单位进行 SR 时保存撤销点
			let from_reserve = is_in_reserve(game, p)
			let from = from_reserve ? null : game.pieces[p]
			let cost = get_sr_cost(p, from, null, active_faction())
			if (game.sr >= cost) {
				game.sr -= cost
				game.sr_piece = p
				cache_sr_destinations(p, active_faction())
				game.where = -1
				game.state = "sr_move"
			} else {
				log("SR点数不足")
				pop_undo()
			}
		},
		back() {
			game.where = -1
		},
		confirm_done_sr() {
			game.where = -1
			goto_end_operations()
		},
		done() {
			goto_end_operations()
		}
	}

	states.end_event = {
		prompt(res) {
			res.prompt("事件结束")
			res.action("confirm")
		},
		confirm() {
			clear_undo()
			clear_event_ctx()
			goto_end_operations()
		}
	}

	states.sr_move = {
		prompt(res) {
			if (res && res._is_noop) return
			let sr_cost_cache = create_sr_cost_cache()
			let p = game.sr_piece
			let from = game.pieces[p]
			let paid_cost = get_sr_cost(p, from, null, active_faction(), sr_cost_cache)
			res.who(p)
			res.where(game.pieces[p])
			res.prompt(`战略调整：选择 ${piece_name(p)} 的目的地 (已支付 SR: ${paid_cost})`)
			let from_reserve = is_in_reserve(game, p)
			let destinations = get_cached_sr_destinations(p, active_faction()) || get_sr_destinations(game, p, active_faction())
			for (let s of destinations) {
				if (from_reserve && is_reserve_space_id(s)) continue
				if ((from_reserve || is_reserve_space_id(s)) && !can_use_reserve_sr_for_piece(p)) continue
				let total_cost = get_sr_cost(p, from_reserve ? null : from, s, active_faction(), sr_cost_cache)
				let extra_cost = total_cost - paid_cost
				if (game.sr < extra_cost) continue
				res.space(s)
			}
			res.action("cancel")
		},
		space(s) {
			let sr_cost_cache = create_sr_cost_cache()
			let p = game.sr_piece
			let from = game.pieces[p]
			let paid_cost = get_sr_cost(p, is_in_reserve(game, p) ? null : from, null, active_faction(), sr_cost_cache)
			let total_cost = get_sr_cost(p, is_in_reserve(game, p) ? null : from, s, active_faction(), sr_cost_cache)
			let extra_cost = total_cost - paid_cost
			let legal_destinations = get_cached_sr_destinations(p, active_faction()) || get_sr_destinations(game, p, active_faction())
			if (!legal_destinations.includes(s)) return
			let delayed_suez_sr = Engine.map.can_suez_delayed_sr_to_space(game, p, from, s, active_faction())
			if (!delayed_suez_sr && !Engine.map.can_sr_to_space(game, p, s, active_faction())) return
			if (game.sr < extra_cost) return
			game.sr -= extra_cost
			let was_sea_sr = is_sea_sr_move(from, s)
			let from_was_non_balkan_beachhead =
				Engine.map.is_beachhead_space(game, from) && Engine.map.is_non_balkan_beachhead(from)
			let from_was_ottoman_port = is_ottoman_port_source(from)
			let beachhead_departure_units_before = from_was_non_balkan_beachhead
				? Engine.map.get_ap_units_supplied_solely_through_source(game, from)
				: []
			let port_departure_units_before = from_was_ottoman_port ? get_port_departure_units(from) : []
			let apply_ap_sea_sr_departure_jihad = () => {
				if (active_faction() !== AP || !was_sea_sr) return
				let beachhead_emptied =
					from_was_non_balkan_beachhead &&
					beachhead_departure_units_before.length > 0 &&
					Engine.map.get_ap_units_supplied_solely_through_source(game, from).length === 0
				let ottoman_port_emptied =
					from_was_ottoman_port &&
					port_departure_units_before.length > 0 &&
					get_port_departure_units(from).length === 0
				if (beachhead_emptied || ottoman_port_emptied) {
					update_jihad_level(game, 1)
					log(`${space_name(from)} 最后一支仅经此处补给的 AP 单位海上 SR 离开：Jihad +1。`)
				}
			}
			Engine.map.apply_sr_control_effects(game, p, from, s, active_faction())
			if (delayed_suez_sr) {
				if (!game.suez_delayed_sr) game.suez_delayed_sr = []
				game.suez_delayed_sr.push({
					turn: game.turn + 1,
					piece: p,
					arrival_zone: Engine.map.get_suez_sr_arrival_zone(game, s)
				})
				game.pieces[p] = Engine.constants.REINFORCEMENTS
				apply_ap_sea_sr_departure_jihad()
				if (!game.sr_moved) game.sr_moved = []
				Engine.utils.set_add(game.sr_moved, p)
				log(
					`${piece_name(p)} Suez delayed SR: ${format_sr_space(from)} → ${format_sr_space(s)}; will arrive during the Replacement Phase of turn ${game.turn + 1}.`
				)
				game.sr_piece = null
				clear_sr_destinations()
				set_action_state("sr_phase")
				if (game.sr === 0) goto_end_operations()
				return
			}
			// Move piece
			game.pieces[p] = s

			// 战略调整进入雅典，触发希腊参战（规则 19.2.1：进入方的对手成为希腊盟友）
			if (Engine.neutral.is_greece_neutral(game) && Engine.neutral.is_athens_space(s)) {
				Engine.neutral.trigger_greece_entry(
					game,
					s,
					active_faction() === AP ? CP : AP,
					"战略调整进入雅典",
					(msg) => log(msg)
				)
			}

			if (!game.sr_moved) game.sr_moved = []
			Engine.utils.set_add(game.sr_moved, p)
			log(
				`${piece_name(p)} 战略调整：${format_sr_space(from)} → ${format_sr_space(s)}${total_cost !== 1 ? ` (Cost: ${total_cost})` : ""}`
			)
			game.sr_piece = null
			clear_sr_destinations()

			// Rule 13.4.2 / 18.1.2: +1 Jihad if AP sea-SRs away the last unit
			// drawing supply solely through a non-Balkan Beachhead or Ottoman port.
			apply_ap_sea_sr_departure_jihad()

			set_action_state("sr_phase")

			if (game.sr === 0) goto_end_operations()
		},
		cancel() {
			clear_sr_destinations()
			pop_undo()
		}
	}

	function start_action_phase() {
		game.action_round = 1
		game.action_state = {}
		game.jihad_cities_flipped = game.jihad_cities_flipped || []
		let player_order = game.player_order || [AP, CP]
		game.active = player_order[0]
		set_action_round_entry_state()
		log_br()
		log_h2("行动阶段")
		log_h3_faction(game.active, `行动轮 ${game.action_round}`)
		save_rollback_point()
	}

	function end_action_round() {
		delete game.undo
		delete game.ops
		delete game.sr
		delete game.card
		delete game.activated
		delete game.activation_cost
		delete game.moved
		delete game.move
		delete game.where
		delete game.move_space
		delete game.sr_selected
		delete game.sr_destinations
		delete game.attack
		delete game.combat_cards
		delete game.combat_cards_effected
		delete game.combat_card_sources
		delete game.cancelled_cc_dispositions
		delete game.eligible_attackers
		delete game.attacked_spaces
		delete game.combat_rollback_pending
		delete game.retreated
		delete game.advanced_stopped
		delete game.sr_moved
		delete game.entrenching
		delete game.entrench_attempts
		delete game.entrench_roll_faction
		delete game.combine_ctx
		delete game.beachheads_placed_this_action_round
		game.action_state = {}

		// 67: LIBERATE SUEZ - Clear flags
		delete game.liberate_suez_op_required
		delete game.liberate_suez_battle_required
		delete game.liberate_suez_min_egypt_attack_ops
		delete game.liberate_suez_required_attack_spaces
		delete game.liberate_suez_egypt_attacked_spaces
		delete game.liberate_suez_egypt_attack_activation_valid
		delete game.liberate_suez_egypt_battle_done
		delete game.liberate_suez_drm
		delete game.event_ops_card

		// 69: INDIAN MUTINY - Clear flag
		delete game.indian_mutiny_drm

		if (game.state !== "review_supply_warnings") {
			// Determine next player
			let player_order = game.player_order || [game.active, game.active === AP ? CP : AP]
			let current_idx = player_order.indexOf(game.active)
			if (current_idx === 0) {
				game.active = player_order[1]
			} else {
				game.action_round++
				game.jihad_cities_flipped = []
				game.active = player_order[0]
				if (game.events && game.events["greece_snapshot"]) {
					delete game.events["greece_snapshot"]
				}
			}

			// 在对手下个行动轮开始前检查是否有补给警告
			if (has_supply_warnings()) {
				goto_review_supply_warnings()
				return
			}
		}

		if (game.action_round > 6) {
			save_pre_replacement_rollback_point()
			start_attrition_phase()
			return
		}

		set_action_round_entry_state()
		log_br()
		log_h3_faction(game.active, `行动轮 ${game.action_round}`)
		save_rollback_point()
	}

	function goto_end_action() {
		if (enter_catastrophic_attack_overstack_pe()) return
		if (game.events && game.events["bulls_eye_directive"] === game.turn) {
			Engine.events.bulls_eye_cleanup_scus(game)
			// Bull's Eye Directive (黄色事件) effects are scoped to the current
			// Action Round, not the whole turn: the +1 DRM vs RU, the SR of
			// SCUs into attack-activated spaces, and the post-advance extra
			// attack all reference "本轮" = this Action Round (HQ rule 16.2.1
			// treats Bull's Eye as an Action-Round-scoped extra attack).
			delete game.events["bulls_eye_directive"]
			delete game.events["bulls_eye_used"]
			delete game.bulls_eye_sr_done
			delete game.bulls_eye_sr_spaces
			delete game.bulls_eye_advanced_stack
		}
		clear_event_ctx()
		end_action_round()
	}

	return {
		start_action_phase,
		end_action_round,
		goto_end_action
	}
}
