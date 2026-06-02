"use strict"

const Engine = require("../modules/engine.js")
const turnStates = require("../modules/states/states_turn.js")

const { setupGame } = require("./helpers.js")

const { AP, CP } = Engine.constants

test("AP MO keeps its cumulative DRM after Talaat Pasha cancels CP MO", () => {
	let game = setupGame(2026060203)
	let rollCount = 0
	let states = {}

	turnStates.set_globals(game)
	let turn = turnStates.register(states, Engine, {
		log: () => {},
		log_h1: () => {},
		log_h2: () => {},
		roll_die: () => {
			rollCount++
			return 3
		},
		determine_mo_ap: Engine.mo.determine_mo_ap,
		determine_mo_cp: () => {
			throw new Error("CP MO should not be rolled after Talaat Pasha")
		},
		check_mo_validity: Engine.mo.check_mo_validity,
		MO_NONE: Engine.mo.MO_NONE,
		MO_RUSSIA: Engine.mo.MO_RUSSIA,
		MO_AP_CHOICE_5: Engine.mo.MO_AP_CHOICE_5,
		MO_BRITISH_NO_ATTACK: Engine.mo.MO_BRITISH_NO_ATTACK,
		MO_ENVER: Engine.mo.MO_ENVER,
		AP,
		CP
	})

	game.turn = 1
	game.mo_ap_modifier = 4
	game.mo_ap_drm = 1
	game.mo_cp_cancelled = true
	game.mo_cp_die = 6
	game.mo_cp_drm = 0

	turn.start_turn()

	expect(game.turn).toBe(2)
	expect(rollCount).toBe(1)
	expect(game.mo_ap_drm).toBe(4)
	expect(game.mo_ap_die).toBe(3)
	expect(game.mo_cp).toBe(Engine.mo.MO_NONE)
	expect(game.mo_cp_die).toBeUndefined()
	expect(game.mo_cp_drm).toBeUndefined()
})
