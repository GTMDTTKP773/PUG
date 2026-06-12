"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants

function combatFixture(seed = 2026061204) {
	let game = setupGame(seed, "Historical", { no_supply_warnings: true })
	let kut = findSpace("Kut")
	let theHai = findSpace("The Hai")
	let tuCorps = findPiece(CP, "TU I Corps")
	let inDiv = findPiece(AP, "IN DIV #1")

	clearBoard(game)
	game.active = CP
	game.activated = { move: [], attack: [kut], attack_egypt: [] }
	game.region_activations = { move: {}, attack: {} }
	game.moved = []
	game.attacked = []
	game.retreated = []
	game.combat_cards = { attacker: [], defender: [] }
	Engine.set_control(game, kut, CP)
	Engine.set_control(game, theHai, AP)
	game.pieces[tuCorps] = kut
	game.pieces[inDiv] = theHai
	return { game, kut, theHai, tuCorps, inDiv }
}

test("combat package analysis validates an attack declaration without rolling dice", () => {
	let { game, theHai, tuCorps } = combatFixture()
	game.state = "attack"
	let before = JSON.stringify(game)
	let seed = game.seed

	let analysis = rules.analysis.combat_package_analysis(game, CP, [{
		kind: "combat_attack",
		label: `attack:${tuCorps}->${theHai}`,
		sequence: [["piece", tuCorps], ["space", theHai], ["confirm", null]]
	}])
	let candidate = analysis.candidates[0]

	expect(analysis).toMatchObject({
		schema: "pug-ai.combat_package_analysis.v1",
		state: "attack",
		phase: "attack",
		candidate_count: 1,
		valid_count: 1
	})
	expect(candidate.valid).toBe(true)
	expect(candidate.complete).toBe(true)
	expect(candidate.random_changed).toBe(false)
	expect(candidate.steps[1].after.attack.target).toBe(theHai)
	expect(candidate.steps[2].before.state).toBe("confirm_attack")
	expect(game.seed).toBe(seed)
	expect(JSON.stringify(game)).toBe(before)
})

test("combat package analysis exposes authoritative loss absorption deltas", () => {
	let { game, theHai, tuCorps, inDiv } = combatFixture(2026061205)
	game.active = AP
	game.state = "apply_defender_losses"
	game.attack = {
		attacker: CP,
		defender: AP,
		pieces: [tuCorps],
		space: theHai,
		attacker_losses: 0,
		attacker_losses_absorbed: 0,
		defender_losses: 1,
		defender_losses_absorbed: 0
	}
	let before = JSON.stringify(game)
	let analysis = rules.analysis.combat_package_analysis(game, AP, [[
		["piece", inDiv],
		["done", null]
	]])
	let candidate = analysis.candidates[0]

	expect(analysis.context.loss).toMatchObject({ side: "defender", total: 1, absorbed: 0, needed: 1 })
	expect(candidate.valid).toBe(true)
	expect(candidate.steps[0].delta.pieces.some((row) => row.piece === inDiv)).toBe(true)
	expect(candidate.steps[0].after.loss.needed).toBe(0)
	expect(candidate.complete).toBe(true)
	expect(JSON.stringify(game)).toBe(before)
})

test("combat package analysis validates a retreat piece and destination package", () => {
	let { game, theHai, tuCorps, inDiv } = combatFixture(2026061206)
	game.active = AP
	game.state = "retreat"
	game.attack = { attacker: CP, defender: AP, pieces: [tuCorps], space: theHai }
	game.retreat_pieces = [inDiv]
	game.retreat_distance = 1
	game.retreat_steps_left = { [inDiv]: 1 }
	game.selected_piece = null
	let selected = rules.action(JSON.parse(JSON.stringify(game)), AP, "piece", inDiv)
	let destination = rules.view(selected, AP).actions.space[0]
	let before = JSON.stringify(game)

	let analysis = rules.analysis.combat_package_analysis(game, AP, [[
		["piece", inDiv],
		["space", destination]
	]])
	let candidate = analysis.candidates[0]

	expect(candidate.valid).toBe(true)
	expect(candidate.delta.pieces).toContainEqual(expect.objectContaining({
		piece: inDiv,
		from: theHai,
		to: destination
	}))
	expect(candidate.complete).toBe(true)
	expect(JSON.stringify(game)).toBe(before)
})

test("combat package analysis validates advance and reports control effects", () => {
	let game = setupGame(2026061207, "Historical", { no_supply_warnings: true })
	let from = findSpace("Bayburt")
	let target = findSpace("Oltu")
	let unit = findPiece(CP, "TU DIV #8")
	clearBoard(game)
	game.active = CP
	game.state = "advance"
	game.attack = { attacker: CP, defender: AP, pieces: [unit], space: target }
	game.battle_result = { retreat_distance: 1 }
	game.pieces[unit] = from
	game.control[from] = CP
	game.control[target] = AP
	game.advance_pieces = [unit]
	game.advance_space = target
	game.advance_count = 0
	game.advance_limit = 3
	game.selected_piece = null
	let before = JSON.stringify(game)

	let analysis = rules.analysis.combat_package_analysis(game, CP, [[
		["piece", unit],
		["end_advance", null]
	]])
	let candidate = analysis.candidates[0]

	expect(candidate.valid).toBe(true)
	expect(candidate.delta.pieces).toContainEqual(expect.objectContaining({
		piece: unit,
		from,
		to: target
	}))
	expect(candidate.complete).toBe(true)
	expect(JSON.stringify(game)).toBe(before)
})
