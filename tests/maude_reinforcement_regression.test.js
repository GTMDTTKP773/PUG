"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const AP_ROLE = rules.roles[0]
const { AP, CP } = Engine.constants

function maudeSpaceNames(game) {
	return (rules.view(game, AP_ROLE).actions.space || []).map((s) => Engine.data.spaces[s].name)
}

function setupCyprusMaudeGame() {
	let game = setupGame(2026060802, "Historical", { seed: 42, no_supply_warnings: true })
	let cyprus = findSpace("Cyprus")
	let haifa = findSpace("Haifa")
	let brDiv1 = findPiece(AP, "BR DIV #1")
	let brDiv2 = findPiece(AP, "BR DIV #2")
	let inDiv1 = findPiece(AP, "IN DIV #1")

	clearBoard(game)
	game.pieces[brDiv1] = cyprus
	game.pieces[inDiv1] = cyprus
	game.pieces[brDiv2] = cyprus
	Engine.set_control(game, cyprus, AP)
	game.beachheads = []
	game.active = AP
	game.state = "maude_place_indian_division"
	game.attack = {
		space: haifa,
		pieces: [brDiv1, inDiv1],
		attacker: AP,
		defender: CP
	}

	return game
}

test("Maude Indian division cannot overflow into unestablished Cyprus beachheads", () => {
	let game = setupCyprusMaudeGame()

	let spaces = maudeSpaceNames(game)

	for (let name of ["To Adana", "To Beirut", "To Haifa", "To Jaffa"]) {
		expect(spaces).not.toContain(name)
	}
})

test("Maude Indian division can still use an established beachhead", () => {
	let game = setupCyprusMaudeGame()
	let toHaifa = findSpace("To Haifa")

	Engine.utils.set_add(game.beachheads, toHaifa)
	Engine.set_control(game, toHaifa, AP)

	expect(maudeSpaceNames(game)).toContain("To Haifa")
})
