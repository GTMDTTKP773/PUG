const rules = require("../rules.js")

const { findSpace, findPieceByName: findPiece } = require("./helpers.js")

const AP_ROLE = rules.roles[0]
const AP = rules.AP
const CP = rules.CP
const SHORE_BOMBARDMENT = 4

function createCcWindowGame({ attackerSpace, defenderSpace, state, attacker = AP }) {
	let game = rules.setup(1, "Historical", { seed: 42 })
	let apPiece = findPiece("RU DIV #3")
	let cpPiece = findPiece("TU DIV #8")
	let attackingPiece = attacker === AP ? apPiece : cpPiece
	let defendingPiece = attacker === AP ? cpPiece : apPiece

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0

	game.pieces[attackingPiece] = attackerSpace
	game.pieces[defendingPiece] = defenderSpace
	game.active = AP
	game.state = state
	game.hand_ap = [SHORE_BOMBARDMENT]
	game.hand_cp = []
	game.combat_cards = { attacker: [], defender: [] }
	game.attack = {
		space: defenderSpace,
		pieces: [attackingPiece],
		attacker,
		defender: attacker === AP ? CP : AP
	}

	return game
}

test("Shore Bombardment can be played for battles in Gallipoli", () => {
	let game = createCcWindowGame({
		attackerSpace: findSpace("Bergaz"),
		defenderSpace: findSpace("Canakkale"),
		state: "play_cc_attacker"
	})

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).toContain(SHORE_BOMBARDMENT)
})

test("Shore Bombardment can be played when defending in Gallipoli", () => {
	let game = createCcWindowGame({
		attackerSpace: findSpace("Bandirma"),
		defenderSpace: findSpace("Gallipoli"),
		state: "play_cc_defender",
		attacker: CP
	})

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).toContain(SHORE_BOMBARDMENT)
})

test("Shore Bombardment remains unavailable for inland battles", () => {
	let game = createCcWindowGame({
		attackerSpace: findSpace("Oltu"),
		defenderSpace: findSpace("Bayburt"),
		state: "play_cc_attacker"
	})

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).not.toContain(SHORE_BOMBARDMENT)
})

test("Shore Bombardment can be played when AP defends Basra as an AP port", () => {
	let basra = findSpace("Basra")
	let fao = findSpace("Fao")
	let game = createCcWindowGame({
		attackerSpace: findSpace("Baghdad"),
		defenderSpace: basra,
		state: "play_cc_defender",
		attacker: CP
	})
	game.control[basra] = AP
	game.control[fao] = AP

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).toContain(SHORE_BOMBARDMENT)
})

test("Shore Bombardment can be played when AP attacks CP-controlled Basra without controlling Fao", () => {
	let basra = findSpace("Basra")
	let fao = findSpace("Fao")
	let game = createCcWindowGame({
		attackerSpace: findSpace("Abadan"),
		defenderSpace: basra,
		state: "play_cc_attacker"
	})
	game.control[basra] = CP
	game.control[fao] = CP

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).toContain(SHORE_BOMBARDMENT)
})

test("Shore Bombardment cannot defend Basra before it is an AP port", () => {
	let basra = findSpace("Basra")
	let fao = findSpace("Fao")
	let game = createCcWindowGame({
		attackerSpace: findSpace("Baghdad"),
		defenderSpace: basra,
		state: "play_cc_defender",
		attacker: CP
	})
	game.control[basra] = AP
	game.control[fao] = CP

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).not.toContain(SHORE_BOMBARDMENT)
})
