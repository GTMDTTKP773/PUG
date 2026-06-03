"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findApPiece, findCpPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]

function prepareBritishNoAttackGame() {
	const game = setupGame(26060301, "Historical", { no_supply_warnings: true })
	const basra = findSpace("Basra")
	const qurna = findSpace("Qurna")
	const brDiv = findApPiece("BR DIV #1")
	const tuDiv = findCpPiece("TU DIV #1")

	clearBoard(game)
	game.pieces[brDiv] = basra
	game.pieces[tuDiv] = qurna
	Engine.set_control(game, basra, AP)
	Engine.set_control(game, qurna, CP)

	game.active = AP
	game.state = "activate_spaces"
	game.ops = 3
	game.card_ops = 3
	game.activated = { move: [], attack: [], attack_egypt: [] }
	game.region_activations = { move: {}, attack: {} }
	game.activation_cost = {}
	game.moved = []
	game.attacked = []
	game.attacked_spaces = []
	game.retreated = []
	game.mo_ap = Engine.mo.MO_BRITISH_NO_ATTACK
	game.mo_ap_fulfilled = true
	game.mo_cp = Engine.mo.MO_NONE
	game.mo_cp_fulfilled = true
	game.british_mandate_violated = false
	delete game.br_attack_penalty_paid
	delete game.br_no_attack_activated
	game.vp = 10

	return { game, basra, qurna, brDiv }
}

test("British No Attack does not pay VP for BR attack activation that is cancelled or followed by movement", () => {
	let { game, basra } = prepareBritishNoAttackGame()

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.activate_attack_with_br || []).toContain(basra)

	game = rules.action(game, AP_ROLE, "activate_attack_with_br", basra)
	expect(game.vp).toBe(10)
	expect(game.br_attack_penalty_paid).toBeUndefined()
	expect(game.british_mandate_violated).toBe(false)
	expect(game.br_no_attack_activated).toContain(basra)

	game = rules.action(game, AP_ROLE, "deactivate", basra)
	expect(game.vp).toBe(10)
	expect(game.br_attack_penalty_paid).toBeUndefined()
	expect(game.british_mandate_violated).toBe(false)
	expect(game.br_no_attack_activated || []).not.toContain(basra)

	game = rules.action(game, AP_ROLE, "activate_move", basra)
	expect(game.vp).toBe(10)
	expect(game.br_attack_penalty_paid).toBeUndefined()
	expect(game.british_mandate_violated).toBe(false)
})

test("British No Attack pays VP when a BR attack is actually declared", () => {
	let { game, basra, qurna, brDiv } = prepareBritishNoAttackGame()

	game = rules.action(game, AP_ROLE, "activate_attack_with_br", basra)
	expect(game.vp).toBe(10)

	game = rules.action(game, AP_ROLE, "done")
	expect(game.state).toBe("attack")

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.piece || []).toContain(brDiv)

	game = rules.action(game, AP_ROLE, "piece", brDiv)
	view = rules.view(game, AP_ROLE)
	expect(view.actions.space || []).toContain(qurna)

	game = rules.action(game, AP_ROLE, "space", qurna)
	expect(game.state).toBe("confirm_attack")

	game = rules.action(game, AP_ROLE, "confirm")
	expect(game.vp).toBe(11)
	expect(game.br_attack_penalty_paid).toBe(true)
	expect(game.british_mandate_violated).toBe(true)
})
