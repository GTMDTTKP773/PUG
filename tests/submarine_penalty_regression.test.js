const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { findSpace, findPieceByName: findPiece } = require("./helpers.js")

const AP = rules.AP
const CP = rules.CP

function createSubmarineGame() {
	let game = rules.setup(1, "Historical", { seed: 17 })
	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.control = []
	game.events = {}
	game.beachheads = []
	game.active = AP
	return game
}

test("German Subs applies the long-term +1 OP/+1 SR penalty to AP spaces tracing solely through the East Med or Aegean, including Gallipoli beachheads", () => {
	let game = createSubmarineGame()
	let lemnos = findSpace("Lemnos")
	let cyprus = findSpace("Cyprus")
	let gabaTepe = findSpace("Gaba Tepe")
	let apReserve = findSpace("AP Reserve")
	let brIX = findPiece("BR IX Corps")
	let brVIII = findPiece("BR VIII Corps")
	let brXVI = findPiece("BR XVI Corps")
	let anzAnzac = findPiece("ANZ ANZAC")

	game.pieces[brIX] = lemnos
	game.pieces[brVIII] = lemnos
	game.pieces[brXVI] = cyprus
	game.pieces[anzAnzac] = gabaTepe

	game.control[lemnos] = AP
	game.control[cyprus] = AP
	game.control[gabaTepe] = AP
	game.beachheads = [gabaTepe]
	game.events["german_subs"] = true

	expect(Engine.map.get_activation_cost_pair(game, lemnos)).toEqual({ move: 2, attack: 2 })
	expect(Engine.map.get_activation_cost_pair(game, gabaTepe)).toEqual({ move: 2, attack: 2 })
	expect(Engine.map.get_sr_cost(game, brIX, lemnos, apReserve, AP)).toBe(5)
	expect(Engine.map.get_activation_cost_pair(game, cyprus)).toEqual({ move: 2, attack: 2 })
	expect(Engine.map.get_sr_cost(game, brXVI, cyprus, apReserve, AP)).toBe(5)
	expect(Engine.map.get_sr_cost_breakdown(game, brXVI, cyprus, apReserve, AP)).toEqual({
		base: 4,
		disrupted_supply: 0,
		german_subs: 1,
		unrestricted_submarine_warfare: 0,
		surcharge: 1,
		total: 5,
	})
})

test("German Subs does not surcharge Egypt spaces that can trace supply through Suez to Sudan and Darfur", () => {
	let game = createSubmarineGame()
	let portSaid = findSpace("Port Said")
	let ismailia = findSpace("Ismailia")
	let suez = findSpace("Suez")
	let cairo = findSpace("CAIRO")
	let khartoum = findSpace("Khartoum")
	let apReserve = findSpace("AP Reserve")
	let brIX = findPiece("BR IX Corps")

	game.pieces[brIX] = portSaid
	for (let s of [portSaid, ismailia, suez, cairo, khartoum]) game.control[s] = AP
	game.events["german_subs"] = true

	expect(Engine.map.get_activation_cost_pair(game, portSaid)).toEqual({ move: 1, attack: 1 })
	expect(Engine.map.get_sr_cost(game, brIX, portSaid, apReserve, AP)).toBe(4)
})

test("German Subs still surcharges an East Med port when no non-East-Med supply route is available", () => {
	let game = createSubmarineGame()
	let portSaid = findSpace("Port Said")
	let ismailia = findSpace("Ismailia")
	let apReserve = findSpace("AP Reserve")
	let brIX = findPiece("BR IX Corps")

	game.pieces[brIX] = portSaid
	game.control[portSaid] = AP
	game.control[ismailia] = CP
	game.events["german_subs"] = true

	expect(Engine.map.get_activation_cost_pair(game, portSaid)).toEqual({ move: 2, attack: 2 })
	expect(Engine.map.get_sr_cost(game, brIX, portSaid, apReserve, AP)).toBe(5)
})

test("Unrestricted Submarine Warfare applies the +1 OP/+1 SR penalty only to East Mediterranean AP spaces", () => {
	let game = createSubmarineGame()
	let lemnos = findSpace("Lemnos")
	let cyprus = findSpace("Cyprus")
	let apReserve = findSpace("AP Reserve")
	let brIX = findPiece("BR IX Corps")
	let brVIII = findPiece("BR VIII Corps")
	let brXVI = findPiece("BR XVI Corps")
	let brXX = findPiece("BR XX Corps")

	game.pieces[brIX] = lemnos
	game.pieces[brVIII] = lemnos
	game.pieces[brXVI] = cyprus
	game.pieces[brXX] = cyprus

	game.control[lemnos] = AP
	game.control[cyprus] = AP
	game.events["unrestricted_submarine_warfare"] = true

	expect(Engine.map.get_activation_cost_pair(game, cyprus)).toEqual({ move: 2, attack: 2 })
	expect(Engine.map.get_sr_cost(game, brXVI, cyprus, apReserve, AP)).toBe(5)

	expect(Engine.map.get_activation_cost_pair(game, lemnos)).toEqual({ move: 1, attack: 1 })
	expect(Engine.map.get_sr_cost(game, brIX, lemnos, apReserve, AP)).toBe(4)
})

test("East Mediterranean AP spaces pay +2 OP/+2 SR once both German Subs and Unrestricted Submarine Warfare are active", () => {
	let game = createSubmarineGame()
	let cyprus = findSpace("Cyprus")
	let apReserve = findSpace("AP Reserve")
	let brXVI = findPiece("BR XVI Corps")
	let brXX = findPiece("BR XX Corps")

	game.pieces[brXVI] = cyprus
	game.pieces[brXX] = cyprus
	game.control[cyprus] = AP
	game.events["german_subs"] = true
	game.events["unrestricted_submarine_warfare"] = true

	expect(Engine.map.get_activation_cost_pair(game, cyprus)).toEqual({ move: 3, attack: 3 })
	expect(Engine.map.get_sr_cost(game, brXVI, cyprus, apReserve, AP)).toBe(6)
})
