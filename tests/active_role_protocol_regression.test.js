"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

test("SERVER-facing state and view expose active as full role names", () => {
	let game = setupGame(2026060901, "Historical", { no_supply_warnings: true })

	expect([AP_ROLE, CP_ROLE]).toContain(game.active)

	game.active = AP
	let view = rules.view(game, AP_ROLE)
	expect(view.active).toBe(AP_ROLE)
	expect(game.active).toBe(AP_ROLE)

	game = rules.action(game, AP_ROLE, "__invalid_action__")
	expect(game.active).toBe(AP_ROLE)

	game.active = CP
	view = rules.view(game, CP_ROLE)
	expect(view.active).toBe(CP_ROLE)
	expect(game.active).toBe(CP_ROLE)
})

test("other_faction accepts role names and token casing used at server boundaries", () => {
	expect(Engine.utils.other_faction(AP)).toBe(CP)
	expect(Engine.utils.other_faction(CP)).toBe(AP)
	expect(Engine.utils.other_faction("AP")).toBe(CP)
	expect(Engine.utils.other_faction("CP")).toBe(AP)
	expect(Engine.utils.other_faction(AP_ROLE)).toBe(CP)
	expect(Engine.utils.other_faction(CP_ROLE)).toBe(AP)
	expect(Engine.map.other_faction(AP_ROLE)).toBe(CP)
	expect(rules.other_faction(CP_ROLE)).toBe(AP)
})
