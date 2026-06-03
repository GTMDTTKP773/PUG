"use strict"

/**
 * Pursuit of Glory - Rule Engine Aggregation Layer
 * This module acts as a central hub for all rule-related logic,
 * decoupling sub-modules from each other and simplifying rules.js.
 */

const data = require("../data.js")
const constants = require("./core/constants.js")
const utils = require("./core/utils.js")

const Engine = {
	data,
	constants,
	utils,

	/**
	 * Result object for logic-view separation.
	 * Helps collect logs, prompts, and actions without direct side effects on view.
	 */
	create_result(game) {
		return {
			game,
			_prompt: undefined,
			_where: undefined,
			_who: undefined,
			_hand: undefined,
			_rollback_proposal: undefined,
			_entrenching: undefined,
			_actions: {},
			logs: [],
			prompt(msg) {
				this._prompt = msg
				return this
			},
			where(s) {
				this._where = s
				return this
			},
			who(p) {
				this._who = p
				return this
			},
			hand(h) {
				this._hand = h
				return this
			},
			rollback_proposal(p) {
				this._rollback_proposal = p
				return this
			},
			entrenching(e) {
				this._entrenching = e
				return this
			},
			log(msg) {
				this.logs.push(msg)
				if (this.game && Array.isArray(this.game.log)) {
					this.game.log.push(msg)
				}
				return this
			},
			action(name, arg) {
				if (arg !== undefined) {
					if (!this._actions[name]) this._actions[name] = []
					if (Array.isArray(this._actions[name])) {
						if (!this._actions[name].includes(arg)) {
							this._actions[name].push(arg)
						}
					}
				} else {
					this._actions[name] = 1
				}
				return this
			},
			piece(p) {
				return this.action("piece", p)
			},
			space(s) {
				return this.action("space", s)
			},
			has_action(name) {
				if (name === undefined) return Object.keys(this._actions).length > 0
				return !!this._actions[name]
			},
			get_action(name) {
				return this._actions[name]
			},
			set_action(name, value) {
				this._actions[name] = value
				return this
			},
			apply(view) {
				if (this._prompt !== undefined) view.prompt = this._prompt
				if (this._where !== undefined) view.where = this._where
				if (this._who !== undefined) view.who = this._who
				if (this._hand !== undefined) view.hand = this._hand
				if (this._rollback_proposal !== undefined) view.rollback_proposal = this._rollback_proposal
				if (this._entrenching !== undefined) view.entrenching = this._entrenching
				view.actions = Object.keys(this._actions).length > 0 ? this._actions : null
			},
			set_control(s, faction) {
				Engine.set_control(this.game, s, faction)
				return this
			},
			update_jihad_level(amount) {
				Engine.update_jihad_level(this.game, amount)
				return this
			}
		}
	},

	// Core state management helpers
	log(game, msg) {
		if (Array.isArray(game.log)) {
			game.log.push(msg)
		}
	},

	card_name(card) {
		if (!Number.isInteger(card) || !Engine.data.cards[card]) return `Unknown Card ${card}`
		return `c${card}`
	},

	card_names(cards) {
		if (!Array.isArray(cards)) return []
		return cards.map((card) => Engine.card_name(card))
	},

	update_jihad_level(game, amount) {
		if (Engine.jihad && typeof Engine.jihad.update_jihad_level === "function") {
			const push_state =
				typeof Engine.push_state === "function"
					? Engine.push_state
					: (next_state) => {
							if (game && typeof game.push_state === "function") {
								game.push_state(next_state)
							}
						}
			Engine.jihad.update_jihad_level(game, amount, push_state, (msg) => Engine.log(game, msg))
			return
		}
		game.jihad = Math.max(0, (game.jihad || 0) + amount)
	},

	is_neutral_vp_space(s) {
		if (!Engine.neutral || typeof Engine.neutral.is_neutral_vp_space !== "function") return false
		return Engine.neutral.is_neutral_vp_space(s)
	},

	check_persia_entry_vp_penalty(game, s, entered_pieces) {
		if (!Engine.neutral || typeof Engine.neutral.check_persia_entry_vp_penalty !== "function") return
		Engine.neutral.check_persia_entry_vp_penalty(game, s, entered_pieces)
	},

	get_neutral_vp_partial_owner(game, s) {
		if (!Engine.neutral || typeof Engine.neutral.get_neutral_vp_partial_owner !== "function") return 0
		return Engine.neutral.get_neutral_vp_partial_owner(game, s)
	},

	get_effective_vp_value(game, s) {
		if (!Engine.neutral || typeof Engine.neutral.get_effective_vp_value !== "function") return 0
		return Engine.neutral.get_effective_vp_value(game, s)
	},

	get_vp_effective_owner(game, s) {
		if (!Engine.neutral || typeof Engine.neutral.get_vp_effective_owner !== "function") return 0
		return Engine.neutral.get_vp_effective_owner(game, s)
	},

	sync_vp_state(game, s, previous_override, options) {
		if (!Engine.neutral || typeof Engine.neutral.sync_vp_state !== "function") return
		Engine.neutral.sync_vp_state(game, s, previous_override, options)
	},

	sync_neutral_vp_state(game, s, previous_override, options) {
		Engine.sync_vp_state(game, s, previous_override, options)
	},

	can_set_control(game, s, faction, options) {
		if (!Engine.neutral || typeof Engine.neutral.can_set_control !== "function") return true
		return Engine.neutral.can_set_control(game, s, faction, options)
	},

	normalize_control(game) {
		if (!game || !Array.isArray(game.control)) return
		for (let s = 1; s < data.spaces.length; s++) {
			let faction = game.control[s]
			if (faction !== constants.AP && faction !== constants.CP) continue
			if (!Engine.can_set_control(game, s, faction)) game.control[s] = null
		}
	},

	on_piece_rebuilt(game, p, s) {
		if (!Engine.neutral || typeof Engine.neutral.on_piece_rebuilt !== "function") return
		Engine.neutral.on_piece_rebuilt(game, p, s)
	},

	get_jihad_city_effective_owner(game, s) {
		if (!Engine.jihad || typeof Engine.jihad.get_jihad_city_effective_owner !== "function") return 0
		return Engine.jihad.get_jihad_city_effective_owner(game, s)
	},

	get_jihad_city_scoring_owner(game, s) {
		if (!Engine.jihad || typeof Engine.jihad.get_jihad_city_scoring_owner !== "function") return 0
		return Engine.jihad.get_jihad_city_scoring_owner(game, s)
	},

	sync_jihad_city_state(game, s, previous_override) {
		if (!Engine.jihad || typeof Engine.jihad.sync_jihad_city_state !== "function") return
		Engine.jihad.sync_jihad_city_state(game, s, previous_override, {
			push_state:
				typeof Engine.push_state === "function"
					? Engine.push_state
					: (next_state) => {
							if (game && typeof game.push_state === "function") game.push_state(next_state)
						}
		})
	},

	sync_region_disruption(game, s) {
		let info = data.spaces[s]
		if (!info || !info.region) return
		if (!Array.isArray(game.region_disruption)) game.region_disruption = []
		if (!Engine.map || typeof Engine.map.get_pieces_in_space !== "function") return
		if (!Engine.game_utils || typeof Engine.game_utils.get_piece_effective_faction !== "function") return

		let regular = { [constants.AP]: false, [constants.CP]: false }
		let disrupting = { [constants.AP]: false, [constants.CP]: false }
		let present = { [constants.AP]: false, [constants.CP]: false }

		for (let p of Engine.map.get_pieces_in_space(game, s)) {
			let pinfo = data.pieces[p]
			if (!pinfo) continue
			let faction = Engine.game_utils.get_piece_effective_faction(game, p)
			if (faction !== constants.AP && faction !== constants.CP) continue

			present[faction] = true
			let can_gain_control =
				!Engine.game_utils.is_irregular(p) &&
				!Engine.game_utils.is_tribe(p) &&
				!Engine.game_utils.is_hq(p) &&
				!Engine.game_utils.is_heavy_arty(p)
			if (can_gain_control) regular[faction] = true
			if (Engine.game_utils.is_irregular(p) || Engine.game_utils.is_tribe(p) || pinfo.nation === "Re") {
				disrupting[faction] = true
			}
		}

		let current = game.region_disruption[s]
		if (current !== constants.AP && current !== constants.CP) current = null

		if (current) {
			if (!disrupting[current] || regular[current] || Engine.map.get_space_controller(game, s) === current) {
				delete game.region_disruption[s]
			}
			return
		}

		for (let faction of [constants.AP, constants.CP]) {
			let enemy = faction === constants.AP ? constants.CP : constants.AP
			if (!disrupting[faction]) continue
			if (regular[faction]) continue
			if (present[enemy]) continue
			if (Engine.map.get_space_controller(game, s) === faction) continue
			game.region_disruption[s] = faction
			return
		}
	},

	sync_region_control(game, s) {
		let info = data.spaces[s]
		if (!info || !info.region) return
		if (!Engine.map || typeof Engine.map.get_pieces_in_space !== "function") return
		if (!Engine.game_utils || typeof Engine.game_utils.get_piece_effective_faction !== "function") return

		// Rule 10.1.4 / 10.2 / 10.1.1 PLAY NOTE:
		// Only regular Combat Units can gain region control.
		// Irregulars, HQs, and Heavy Artillery have only Partial Control and cannot take a region.
		// However, per Rule 10.1.5, any enemy unit makes the region contested,
		// preventing control from changing until ALL enemy units leave.
		Engine.sync_region_disruption(game, s)
		let has_ap_regular = false  // AP regular combat unit present (can gain control)
		let has_cp_regular = false  // CP regular combat unit present (can gain control)
		let ap_present = false      // any AP unit (blocks enemy control)
		let cp_present = false      // any CP unit (blocks enemy control)

		for (let p of Engine.map.get_pieces_in_space(game, s)) {
			let faction = Engine.game_utils.get_piece_effective_faction(game, p)
			let can_gain_control =
				!Engine.game_utils.is_irregular(p) &&
				!Engine.game_utils.is_tribe(p) &&
				!Engine.game_utils.is_hq(p) &&
				!Engine.game_utils.is_heavy_arty(p)
			if (faction === constants.AP) {
				ap_present = true
				if (can_gain_control) has_ap_regular = true
			} else if (faction === constants.CP) {
				cp_present = true
				if (can_gain_control) has_cp_regular = true
			}
			if (ap_present && cp_present) return  // contested, no change
		}

		// No regular combat units on either side — no control change
		if (!has_ap_regular && !has_cp_regular) return

		let desired = has_ap_regular ? constants.AP : constants.CP
		let current_controller =
			Engine.map && typeof Engine.map.get_space_controller === "function"
				? Engine.map.get_space_controller(game, s)
				: game.control[s] || info.faction

		if (current_controller !== desired) {
			Engine.set_control(game, s, desired)
		}
	},

	set_control(game, s, faction, options) {
		if (!Engine.can_set_control(game, s, faction, options)) return
		if (
			Engine.map &&
			typeof Engine.map.is_potential_beachhead_space === "function" &&
			Engine.map.is_potential_beachhead_space(s) &&
			faction === constants.CP
		) {
			faction =
				typeof Engine.map.get_legal_beachhead_controller === "function"
					? Engine.map.get_legal_beachhead_controller(game, s)
					: constants.AP
		}
		const is_vp_space = Engine.get_effective_vp_value(game, s) > 0
		const is_jihad_city = !!(data.spaces[s] && data.spaces[s].jihad_city)
		let previous_jihad_owner = is_jihad_city ? Engine.get_jihad_city_scoring_owner(game, s) || 0 : 0
		let current_controller =
			Engine.map && typeof Engine.map.get_space_controller === "function"
				? Engine.map.get_space_controller(game, s)
				: game.control[s] || (data.spaces[s] && data.spaces[s].faction)
		let previous_vp_owner = is_vp_space && (current_controller === constants.AP || current_controller === constants.CP) ? current_controller : 0
		if (current_controller === faction) {
			if (is_vp_space) {
				Engine.sync_vp_state(game, s)
			}
			if (is_jihad_city) {
				Engine.sync_jihad_city_state(game, s, previous_jihad_owner)
			}
			return
		}
		let default_controller =
			Engine.map && typeof Engine.map.get_default_controller === "function"
				? Engine.map.get_default_controller(game, s)
				: data.spaces[s] && data.spaces[s].faction
		let vp_before_control_change = game.vp
		game.control[s] = faction === default_controller ? null : faction

		if (is_vp_space) {
			Engine.sync_vp_state(game, s, undefined, { silent: true })
		}
		if (is_jihad_city) {
			Engine.sync_jihad_city_state(game, s, previous_jihad_owner)
		}
		if (Engine.neutral && typeof Engine.neutral.apply_control_change === "function") {
			Engine.neutral.apply_control_change(game, s, faction, previous_vp_owner, vp_before_control_change)
		}
	},

	// Contextual helper to pass Engine to sub-modules if needed
	get context() {
		return this
	}
}

// Inject Engine into factories
Engine.game_utils = require("./core/game_utils.js")(Engine)
Engine.neutral = require("./systems/neutral.js")(Engine)
Engine.map = require("./systems/map.js")(Engine)
// Expose map functions as supply and movement for backward compatibility
Engine.supply = Engine.map
Engine.movement = Engine.map

Engine.events = require("./systems/events.js")(Engine)
Engine.combat = require("./systems/combat.js")(Engine)
Engine.mo = require("./systems/mo.js")(Engine)
Engine.setup = require("./systems/setup.js")(Engine)
Engine.collapse = require("./systems/collapse.js")(Engine)
Engine.event_states = require("./states/event_states.js")(Engine)
Engine.combat_cards = require("./systems/combat_cards.js")(Engine)
Engine.jihad = require("./systems/jihad.js")(Engine)
Engine.units = Engine.game_utils
// Optional read-only helpers for external AI clients. Normal game flow does
// not call this module.
Engine.analysis = require("./analysis/index.js")(Engine)

module.exports = Engine
