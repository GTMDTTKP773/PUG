"use strict"

module.exports = function (Engine) {
	const { data, game_utils, map } = Engine
	const { get_tribe_type } = map
	const {
		is_tribe,
		is_not_on_map,
		is_in_reserve,
		is_reinforcement,
		is_eliminated,
		is_removed,
		is_piece_reduced,
		get_piece_nation,
		piece_name,
		get_piece_effective_faction,
		get_piece_faction,
		is_regular,
		is_irregular
	} = game_utils
	const exports = {}

	function format_piece_name(game, p) {
		if (!data.pieces[p]) return piece_name(p)
		return is_piece_reduced(game, p) ? `p${p}` : `P${p}`
	}

	function format_space_name(s) {
		if (!data.spaces[s]) return "Unknown Space (" + s + ")"
		return `s${s}`
	}

	function can_select_tribe_for_jihad_placement(game, p) {
		return is_tribe(p) && (is_in_reserve(game, p) || is_reinforcement(game, p))
	}

	function can_place_tribe_in_jihad_space(game, p, s) {
		let tribe_type = get_tribe_type(p)
		if (!tribe_type) return false
		if (data.spaces[s].tribal_activity_grid !== tribe_type) return false
		
		return map.can_place_piece_in_space(game, s, p)
	}

	/**
	 * Pursuit of Glory - Jihad Module
	 * Handles Jihad level changes, tribal unit placement/removal, and rebellions.
	 */

	function update_jihad_level(game, amount, push_state, log_fn) {
		let old = game.jihad || 0
		game.jihad = Math.max(0, old + amount)
		if (game.jihad === old) return
		let message = `圣战等级 ${amount > 0 ? "+" : ""}${amount} (当前: ${game.jihad})`
		if (typeof log_fn === "function") log_fn(message)
		else if (Array.isArray(game.log)) game.log.push(message)
		if (amount > 0) {
			game.tribes_to_place = (game.tribes_to_place || 0) + amount
			if (typeof push_state === "function") {
				push_state("jihad_placement")
			} else if (game && typeof game.push_state === "function") {
				game.push_state("jihad_placement")
			}
			game.active = Engine.constants.CP
		}
	}

	function collect_jihad_city_presence(game, s) {
		if (!data.spaces[s] || !data.spaces[s].jihad_city) return null
		const { AP, CP } = Engine.constants
		let controller = map.get_space_controller(game, s) || 0
		let has_ap_regular = false
		let has_cp_regular = false
		let has_ap_partial = false
		let has_cp_partial = false

		for (let p of map.get_pieces_in_space(game, s)) {
			let info = data.pieces[p]
			if (!info || info.type === "hq") continue
			let faction = get_piece_effective_faction(game, p)
			if (faction !== AP && faction !== CP) continue

			if (is_regular(p)) {
				if (faction === AP) has_ap_regular = true
				else if (faction === CP) has_cp_regular = true
				continue
			}

			if (is_irregular(p) || is_tribe(p)) {
				if (faction === AP) has_ap_partial = true
				else if (faction === CP) has_cp_partial = true
			}
		}

		return { controller, has_ap_regular, has_cp_regular, has_ap_partial, has_cp_partial }
	}

	function get_jihad_city_effective_owner(game, s) {
		let presence = collect_jihad_city_presence(game, s)
		if (!presence) return 0
		const { AP, CP } = Engine.constants
		let { controller, has_ap_regular, has_cp_regular } = presence

		if (has_ap_regular && !has_cp_regular) return AP
		if (has_cp_regular && !has_ap_regular) return CP
		return controller
	}

	function get_jihad_city_scoring_owner(game, s) {
		let presence = collect_jihad_city_presence(game, s)
		if (!presence) return 0
		const { AP, CP } = Engine.constants
		let { controller, has_ap_regular, has_cp_regular, has_ap_partial, has_cp_partial } = presence

		if (has_ap_regular && !has_cp_regular) return AP
		if (has_cp_regular && !has_ap_regular) return CP
		if (has_ap_partial && !has_cp_partial && controller !== AP) return AP
		if (has_cp_partial && !has_ap_partial && controller !== CP) return CP
		return controller
	}

	function log_jihad_city_change(game, s, amount) {
		if (!amount) return
		Engine.log(
			game,
			`圣战城市：${format_space_name(s)}，圣战等级 ${amount > 0 ? "+" : ""}${amount} (当前: ${game.jihad})。`
		)
	}

	function normalize_jihad_city_owner(owner) {
		const { AP, CP } = Engine.constants
		return owner === AP || owner === CP || owner === "neutral" ? owner : undefined
	}

	function sync_jihad_city_state(game, s, previous_override, helpers = {}) {
		if (!data.spaces[s] || !data.spaces[s].jihad_city) return
		const { AP, CP } = Engine.constants
		const push_state =
			typeof helpers.push_state === "function"
				? helpers.push_state
				: (next_state) => {
						if (game && typeof game.push_state === "function") game.push_state(next_state)
					}

		if (!Array.isArray(game.jihad_city_effective_owner)) game.jihad_city_effective_owner = []
		if (!Array.isArray(game.jihad_city_scoring_owner)) game.jihad_city_scoring_owner = []

		let stored_previous = normalize_jihad_city_owner(game.jihad_city_scoring_owner[s])
		if (stored_previous === undefined) stored_previous = normalize_jihad_city_owner(game.jihad_city_effective_owner[s])
		let previous =
			previous_override !== undefined
				? normalize_jihad_city_owner(previous_override) || 0
				: stored_previous !== undefined
					? stored_previous
					: map.get_space_controller(game, s) || 0
		let next = get_jihad_city_scoring_owner(game, s) || 0
		let effective_next = get_jihad_city_effective_owner(game, s) || 0

		if (previous === next) {
			game.jihad_city_effective_owner[s] = effective_next
			game.jihad_city_scoring_owner[s] = next
			return
		}

		let delta = 0
		if (next === CP) delta = 1
		else if (next === AP) delta = -1
		else if (previous === CP) delta = -1
		else if (previous === AP) delta = 1

		if (delta > 0) {
			if (!Array.isArray(game.jihad_cities_flipped)) game.jihad_cities_flipped = []
			if (!game.jihad_cities_flipped.includes(s)) {
				game.jihad_cities_flipped.push(s)
				update_jihad_level(game, 1, push_state, () => log_jihad_city_change(game, s, 1))
			}
		} else if (delta < 0) {
			update_jihad_level(game, -1, push_state, () => log_jihad_city_change(game, s, -1))
		}

		game.jihad_city_effective_owner[s] = effective_next
		game.jihad_city_scoring_owner[s] = next
	}

	function on_control_changed(game, s, previous_controller, faction, helpers = {}) {
		sync_jihad_city_state(game, s, previous_controller, helpers)
	}

	function get_jihad_country_for_space(game, s) {
		if (map.is_egypt(s)) return "Egypt"
		if (map.is_india(s)) return "India"
		if (map.is_afghanistan(s)) return "Afghanistan"
		if (map.is_central_asia(s)) return "Central Asia"
		return null
	}

	function has_jihad_prereq(game, country) {
		if (!game.events || !game.events["pan_turkism"]) return false
		if (country === "Egypt") return !!game.events["liberate_suez_active"]
		if (country === "India") return !!game.events["indian_mutiny"]
		if (country === "Afghanistan" || country === "Central Asia") return !!game.events["mission_to_afghanistan"]
		return false
	}

	function has_cp_regular_in_country(game, country, excluded_pieces = null) {
		const { CP } = Engine.constants
		let excluded = null
		if (Array.isArray(excluded_pieces) && excluded_pieces.length > 0) {
			excluded = new Set(excluded_pieces)
		}
		for (let s = 1; s < data.spaces.length; s++) {
			let c = get_jihad_country_for_space(game, s)
			if (c === country) {
				let pieces = map.get_pieces_in_space(game, s)
				for (let p of pieces) {
					if (excluded && excluded.has(p)) continue
					if (get_piece_faction(p) === CP && is_regular(p) && !is_not_on_map(game, p)) {
						return true
					}
				}
			}
		}
		return false
	}

	function get_jihad_revolt_target(game, country, use_first_rating = false) {
		let rating_1 = 0
		let rating_2 = 0
		if (country === "Egypt") {
			rating_1 = 12
			rating_2 = 17
		}
		if (country === "India") {
			rating_1 = 14
			rating_2 = 19
		}
		if (country === "Afghanistan") {
			rating_1 = 9
			rating_2 = 14
		}
		if (country === "Central Asia") {
			rating_1 = 8
			rating_2 = 13
		}
		if (use_first_rating) return rating_1
		return has_cp_regular_in_country(game, country) ? rating_1 : rating_2
	}

	function trigger_jihad_rebellion(game, country, use_first_rating = false, helpers = {}) {
		const { constants } = Engine
		const { CP } = constants
		if (!has_jihad_prereq(game, country)) return false
		let flag_key = null
		if (country === "Egypt") flag_key = "jihad_revolt_egypt"
		if (country === "India") flag_key = "jihad_revolt_india"
		if (country === "Afghanistan") flag_key = "jihad_revolt_afghanistan"
		if (country === "Central Asia") flag_key = "jihad_revolt_central_asia"
		if (!flag_key || game[flag_key]) return false

		let target = get_jihad_revolt_target(game, country, use_first_rating)
		let roll = helpers.roll_die()
		let total = roll + game.jihad
		helpers.log(`判定 ${country} 叛乱：掷骰 ${roll} + 圣战等级 ${game.jihad} = ${total} (目标: ${target})`)
		if (total < target) {
			helpers.log(`${country} 未发生叛乱。`)
			return true
		}

		helpers.log(`${country} 爆发圣战叛乱！`)
		if (country === "Central Asia") {
			helpers.update_jihad_level(game, 1, helpers.push_state, helpers.log)
			game.jihad_revolt_central_asia = true
			game.events["central_asia_rebellion"] = true
			helpers.reinforce(game, "CAsia Uprising", CP, helpers.find_space("Central Asia"))
			return true
		}
		if (country === "Afghanistan") {
			helpers.update_jihad_level(game, 1, helpers.push_state, helpers.log)
			game.jihad_revolt_afghanistan = true
			game.events["afghan_alliance"] = true
			let af_space = helpers.find_space("Afghanistan")
			helpers.reinforce(game, "Afghan Uprising #1", CP, af_space)
			helpers.reinforce(game, "Afghan Uprising #2", CP, af_space)
			helpers.reinforce(game, "Afghan Uprising #3", CP, af_space)
			if (typeof Engine.set_control === "function" && af_space >= 0) {
				Engine.set_control(game, af_space, CP)
			}
			return true
		}
		if (country === "Egypt") {
			helpers.update_jihad_level(game, 2, helpers.push_state, helpers.log)
			game.jihad_revolt_egypt = true
			game.events["egyptian_rebellion"] = true
			game.egyptian_rebellion_to_place = ["Egypt Rebel #1", "Egypt Rebel #2", "Egypt Rebel #3"]
			delete game.reinf_to_place
			helpers.push_state("place_egyptian_rebellion")
			return true
		}
		if (country === "India") {
			helpers.update_jihad_level(game, 2, helpers.push_state, helpers.log)
			game.jihad_revolt_india = true
			game.events["indian_rebellion"] = true
			for (let p = 0; p < game.pieces.length; p++) {
				if (get_piece_nation(p) !== "in") continue
				if (is_removed(game, p)) continue
				if (is_eliminated(game, p)) {
					helpers.log(`印度哗变：${format_piece_name(game, p)} 已在消灭格 -> 永久消灭`)
					helpers.eliminate_piece(game, p, helpers.log, true)
					continue
				}
				let in_scu_reserve = game.pieces[p] === Engine.game_utils.get_scu_reserve_box(Engine.constants.AP)
				if (in_scu_reserve || !is_not_on_map(game, p)) {
					let kill_roll = helpers.roll_die()
					if (kill_roll <= 2) {
						helpers.log(`印度哗变：${format_piece_name(game, p)} 掷骰 ${kill_roll} -> 永久消灭`)
						helpers.eliminate_piece(game, p, helpers.log, true)
					} else {
						helpers.log(`印度哗变：${format_piece_name(game, p)} 掷骰 ${kill_roll} -> 无效果`)
					}
				}
			}
			let in_space = helpers.find_space("INDIA")
			helpers.reinforce(game, "Indian Mutiny #1", CP, in_space)
			helpers.reinforce(game, "Indian Mutiny #2", CP, in_space)
			helpers.reinforce(game, "Indian Mutiny #3", CP, in_space)
			return true
		}
		return false
	}

	function check_immediate_jihad_rebellion_on_entry(game, from_space, target, pieces_moving, helpers = {}) {
		if (!pieces_moving || pieces_moving.length === 0) return
		if (!game.events || !game.events["pan_turkism"]) return
		if (!Array.isArray(game.entered_regions_this_turn)) game.entered_regions_this_turn = []
		let country = get_jihad_country_for_space(game, target)
		if (!country) return
		if (game.entered_regions_this_turn.includes(country)) return
		let from_country = get_jihad_country_for_space(game, from_space)
		if (from_country === country) return
		let regular_entered = pieces_moving.some((p) => {
			let info = data.pieces[p]
			return info.faction === Engine.constants.CP && info.type === "regular" && (info.cf || 0) > 0
		})
		if (!regular_entered) return
		if (!has_jihad_prereq(game, country)) return
		if (has_cp_regular_in_country(game, country, pieces_moving)) return
		game.entered_regions_this_turn.push(country)
		helpers.log(`首次进入 ${country}，触发圣战即时叛乱检定。`)
		trigger_jihad_rebellion(game, country, true, helpers)
	}

	const states = {}

	states.jihad_removal = {
		active: "cp",
		prompt(res) {
			res.prompt(`圣战等级下降或调整: 请从地图上移除 ${res.game.tribes_to_remove} 个部落单位。`)

			let has_tribes = false
			for (let p = 0; p < res.game.pieces.length; p++) {
				if (is_tribe(p) && !is_not_on_map(res.game, p)) {
					res.piece(p)
					has_tribes = true
				}
			}

			if (!has_tribes || res.game.tribes_to_remove <= 0) {
				res.action("done")
			}
		},
		piece(game, log, p) {
			if (!is_tribe(p) || is_not_on_map(game, p)) return
			let from = game.pieces[p]
			let tribe_type = get_tribe_type(p)
			let rb = -1
			for (let s = 1; s < data.spaces.length; s++) {
				if (
					(data.spaces[s].type === "Reserve Box" || data.spaces[s].map === "Reserve Box") &&
					data.spaces[s].name === tribe_type
				) {
					rb = s
					break
				}
			}

			if (rb === -1) {
				rb = 0
			}

			game.pieces[p] = rb
			game.tribes_to_remove--
			log(`${format_piece_name(game, p)} 返回部落预备格`)
			if (from > 0) {
				Engine.sync_neutral_vp_state(game, from)
				Engine.sync_jihad_city_state(game, from)
				Engine.sync_region_control(game, from)
			}
			if (game.tribes_to_remove <= 0) {
				Engine.resume_previous_state(game)
			}
		},
		done(game) {
			game.tribes_to_remove = 0
			Engine.resume_previous_state(game)
		}
	}

	states.jihad_placement = {
		active: "cp",
		prompt(res) {
			res.prompt(`圣战等级上升: 请放置 ${res.game.tribes_to_place} 个部落单位到对应的活动格。`)

			// Find tribes in reserve
			let tribes_in_reserve = []
			for (let p = 0; p < res.game.pieces.length; p++) {
				if (can_select_tribe_for_jihad_placement(res.game, p)) {
					tribes_in_reserve.push(p)
				}
			}

			if (tribes_in_reserve.length === 0 || res.game.tribes_to_place <= 0) {
				res.action("done")
				return
			}

			let can_place_any = false
			for (let p of tribes_in_reserve) {
				for (let s = 1; s < data.spaces.length; s++) {
					if (can_place_tribe_in_jihad_space(res.game, p, s)) {
						res.piece(p)
						can_place_any = true
						break
					}
				}
			}

			if (!can_place_any) {
				res.action("done")
				return
			}

			if (res.game.selected_piece !== null && res.game.selected_piece !== undefined) {
				res.who(res.game.selected_piece)
				let p = res.game.selected_piece
				for (let s = 1; s < data.spaces.length; s++) {
					if (can_place_tribe_in_jihad_space(res.game, p, s)) {
						res.space(s)
					}
				}
			}
		},
		piece(game, log, p) {
			if (!can_select_tribe_for_jihad_placement(game, p)) return
			game.selected_piece = p
		},
		space(game, log, s) {
			let p = game.selected_piece
			if (p === null || p === undefined) return
			if (!can_place_tribe_in_jihad_space(game, p, s)) return
			game.pieces[p] = s
			game.selected_piece = null
			game.tribes_to_place--
			log(`${format_piece_name(game, p)} 放置在 ${format_space_name(s)}`)
			Engine.sync_neutral_vp_state(game, s)
			Engine.sync_jihad_city_state(game, s)
			Engine.sync_region_control(game, s)
			if (game.tribes_to_place <= 0) {
				Engine.resume_previous_state(game)
			}
		},
		done(game, log) {
			log(`无法放置更多部落单位 (剩余: ${game.tribes_to_place})`)
			game.tribes_to_place = 0
			Engine.resume_previous_state(game)
		}
	}

	states.jihad_rebellion_check = {
		active: "cp",
		prompt(res) {
			res.prompt("圣战叛乱判定：选择一个地区进行判定，或跳过。")
			if (has_jihad_prereq(res.game, "Egypt") && !res.game.jihad_revolt_egypt) {
				res.action("rebel_egypt")
			}
			if (has_jihad_prereq(res.game, "India") && !res.game.jihad_revolt_india) {
				res.action("rebel_india")
			}
			if (has_jihad_prereq(res.game, "Afghanistan") && !res.game.jihad_revolt_afghanistan) {
				res.action("rebel_afghanistan")
			}
			if (has_jihad_prereq(res.game, "Central Asia") && !res.game.jihad_revolt_central_asia) {
				res.action("rebel_central_asia")
			}
			res.action("skip")
		},
		rebel_egypt(game, log) {
			Engine.push_undo(game)
			Engine.resume_previous_state(game)
			trigger_jihad_rebellion(game, "Egypt", false, {
				roll_die: () => Engine.utils.roll_die(6, game),
				log,
				update_jihad_level,
				reinforce: Engine.events.reinforce,
				find_space: Engine.game_utils.find_space,
				push_state: Engine.push_state,
				eliminate_piece: Engine.game_utils.eliminate_piece,
				piece_name: Engine.game_utils.piece_name,
				is_removed: (p) => Engine.game_utils.is_removed(game, p),
				is_eliminated: (p) => Engine.game_utils.is_eliminated(game, p),
				is_in_reserve: (p) => Engine.game_utils.is_in_reserve(game, p),
				is_not_on_map: (p) => Engine.game_utils.is_not_on_map(game, p)
			})
		},
		rebel_india(game, log) {
			Engine.push_undo(game)
			Engine.resume_previous_state(game)
			trigger_jihad_rebellion(game, "India", false, {
				roll_die: () => Engine.utils.roll_die(6, game),
				log,
				update_jihad_level,
				reinforce: Engine.events.reinforce,
				find_space: Engine.game_utils.find_space,
				push_state: Engine.push_state,
				eliminate_piece: Engine.game_utils.eliminate_piece,
				piece_name: Engine.game_utils.piece_name,
				is_removed: (p) => Engine.game_utils.is_removed(game, p),
				is_eliminated: (p) => Engine.game_utils.is_eliminated(game, p),
				is_in_reserve: (p) => Engine.game_utils.is_in_reserve(game, p),
				is_not_on_map: (p) => Engine.game_utils.is_not_on_map(game, p)
			})
		},
		rebel_afghanistan(game, log) {
			Engine.push_undo(game)
			Engine.resume_previous_state(game)
			trigger_jihad_rebellion(game, "Afghanistan", false, {
				roll_die: () => Engine.utils.roll_die(6, game),
				log,
				update_jihad_level,
				reinforce: Engine.events.reinforce,
				find_space: Engine.game_utils.find_space,
				push_state: Engine.push_state,
				eliminate_piece: Engine.game_utils.eliminate_piece,
				piece_name: Engine.game_utils.piece_name,
				is_removed: (p) => Engine.game_utils.is_removed(game, p),
				is_eliminated: (p) => Engine.game_utils.is_eliminated(game, p),
				is_in_reserve: (p) => Engine.game_utils.is_in_reserve(game, p),
				is_not_on_map: (p) => Engine.game_utils.is_not_on_map(game, p)
			})
		},
		rebel_central_asia(game, log) {
			Engine.push_undo(game)
			Engine.resume_previous_state(game)
			trigger_jihad_rebellion(game, "Central Asia", false, {
				roll_die: () => Engine.utils.roll_die(6, game),
				log,
				update_jihad_level,
				reinforce: Engine.events.reinforce,
				find_space: Engine.game_utils.find_space,
				push_state: Engine.push_state,
				eliminate_piece: Engine.game_utils.eliminate_piece,
				piece_name: Engine.game_utils.piece_name,
				is_removed: (p) => Engine.game_utils.is_removed(game, p),
				is_eliminated: (p) => Engine.game_utils.is_eliminated(game, p),
				is_in_reserve: (p) => Engine.game_utils.is_in_reserve(game, p),
				is_not_on_map: (p) => Engine.game_utils.is_not_on_map(game, p)
			})
		},
		skip(game, log) {
			log("跳过圣战叛乱判定")
			Engine.resume_previous_state(game)
		}
	}

	states.place_egyptian_rebellion = {
		active: "cp",
		prompt(res) {
			if (!res.game.egyptian_rebellion_to_place && Array.isArray(res.game.reinf_to_place)) {
				res.game.egyptian_rebellion_to_place = res.game.reinf_to_place
			}
			let queue = res.game.egyptian_rebellion_to_place
			if (!queue || queue.length === 0) {
				res.action("skip")
				return
			}
			let piece = queue[0]
			res.prompt(`埃及叛乱：将 ${piece} 放置在任何空置或同盟国控制的埃及/苏丹地区。`)
			let can_place = false
			const { map } = Engine
			const { CP } = Engine.constants
			for (let s = 1; s < data.spaces.length; s++) {
				if (map.is_egypt(s)) {
					if (map.is_controlled_by(res.game, s, CP) || map.get_pieces_in_space(res.game, s).length === 0) {
						res.space(s)
						can_place = true
					}
				}
			}
			if (!can_place) {
				res.prompt(`无法放置 ${piece}，因为没有合法的空间。`)
				res.action("skip")
			}
		},
		space(game, log, s) {
			Engine.push_undo(game)
			let queue = game.egyptian_rebellion_to_place || game.reinf_to_place
			if (!queue || queue.length === 0) {
				Engine.resume_previous_state(game)
				return
			}
			let piece = queue.shift()
			const { CP } = Engine.constants
			Engine.events.reinforce(game, piece, CP, s)
			if (queue.length === 0) {
				delete game.egyptian_rebellion_to_place
				delete game.reinf_to_place
				Engine.resume_previous_state(game)
			}
		},
		skip(game, log) {
			let queue = game.egyptian_rebellion_to_place || game.reinf_to_place
			if (queue && queue.length > 0) {
				let piece = queue.shift()
				log(`跳过放置 ${piece}`)
			}
			if (!queue || queue.length === 0) {
				delete game.egyptian_rebellion_to_place
				delete game.reinf_to_place
				Engine.resume_previous_state(game)
			}
		}
	}

	function register(global_states) {
		Object.assign(global_states, states)
	}

	Object.assign(exports, {
		update_jihad_level,
		get_jihad_city_effective_owner,
		get_jihad_city_scoring_owner,
		sync_jihad_city_state,
		on_control_changed,
		get_tribe_type,
		has_jihad_prereq,
		has_cp_regular_in_country,
		check_immediate_jihad_rebellion_on_entry,
		register,
		states
	})

	return exports
}
