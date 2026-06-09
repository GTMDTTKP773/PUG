const rules = require("../rules.js")
const data = require("../data.js")
const Engine = require("../modules/engine.js")

function findPieceByName(name) {
	let piece = data.pieces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (piece < 0) throw new Error(`Missing piece: ${name}`)
	return piece
}

function findSpaceByName(name) {
	let space = data.spaces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (space < 0) throw new Error(`Missing space: ${name}`)
	return space
}

function createGurkhasBattle(apPieceName, apIsAttacker = true) {
	let game = rules.setup(15015, "Historical", { seed: 42, no_supply_warnings: true })
	let apPiece = findPieceByName(apPieceName)
	let cpPiece = findPieceByName("TU DIV #8")
	let origin = findSpaceByName("Oltu")
	let target = findSpaceByName("Bayburt")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.action_state = {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.combat_cards = { attacker: [], defender: [] }

	if (apIsAttacker) {
		game.pieces[apPiece] = origin
		game.pieces[cpPiece] = target
		game.active = rules.AP
		game.state = "play_cc_attacker"
		game.attack = {
			space: target,
			pieces: [apPiece],
			attacker: rules.AP,
			defender: rules.CP
		}
		return { game, attackers: [apPiece], defenders: [cpPiece] }
	}

	game.pieces[cpPiece] = origin
	game.pieces[apPiece] = target
	game.active = rules.AP
	game.state = "play_cc_defender"
	game.attack = {
		space: target,
		pieces: [cpPiece],
		attacker: rules.CP,
		defender: rules.AP
	}
	return { game, attackers: [cpPiece], defenders: [apPiece] }
}

function canPlayGurkhas(game) {
	return Engine.combat_cards.can_play_combat_card(game, Engine.combat.CC_AP_GURKHAS)
}

function gurkhasDrm(side, game, attackers, defenders) {
	return Engine.combat_cards.get_combat_card_drm(
		Engine.combat.CC_AP_GURKHAS,
		side,
		game,
		attackers,
		defenders
	)
}

test("Gurkhas qualifies BR or IN infantry, blue SCU/LCU, and yellow LCUs", () => {
	for (let name of ["BR DIV #1", "IN DIV #1", "BR Elite DIV #1", "IN Elite DIV #1", "IN 3rd Corps", "BR IX Corps"]) {
		let { game, attackers, defenders } = createGurkhasBattle(name)
		expect(canPlayGurkhas(game)).toBe(true)
		expect(gurkhasDrm("attacker", game, attackers, defenders)).toBe(1)
	}
})

test("Gurkhas rejects BR or IN units without infantry, blue, or yellow LCU status", () => {
	for (let name of ["BR Cavalry #1", "BR IN Garrison #1", "IN 15th DIV", "IN Bikanir Camel"]) {
		let { game, attackers, defenders } = createGurkhasBattle(name)
		expect(canPlayGurkhas(game)).toBe(false)
		expect(gurkhasDrm("attacker", game, attackers, defenders)).toBe(0)
	}
})

test("Gurkhas applies to qualifying BR or IN defenders", () => {
	let { game, attackers, defenders } = createGurkhasBattle("IN DIV #1", false)

	expect(canPlayGurkhas(game)).toBe(true)
	expect(gurkhasDrm("defender", game, attackers, defenders)).toBe(1)
})
