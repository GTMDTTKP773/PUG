const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const data = require("../data.js")

const { setupGame, findCpPiece, findSpace } = require("./helpers.js")

const { CP } = Engine.constants
const CP_ROLE = rules.roles[1]
const eventStates = Engine.event_states.states
const ENVER_FALKENHAYN_SUMMIT = 84

function createResultStub() {
	return {
		actions: {},
		prompt(value) {
			this.promptText = value
		},
		piece(p) {
			if (!this.actions.piece) this.actions.piece = []
			this.actions.piece.push(p)
		},
		space(s) {
			if (!this.actions.space) this.actions.space = []
			this.actions.space.push(s)
		},
		action(name) {
			this.actions[name] = 1
		},
		who() {},
		where() {}
	}
}

function prepareEnverFalkenhaynState(game, event = {}) {
	game.active = CP
	game.state = "event_enver_falkenhayn_sr"
	game.event_ctx = {
		key: "enver_falkenhayn_summit",
		data: {
			sr_points: 8,
			moved: [],
			...event
		}
	}
	return game.event_ctx.data
}

function getTurkishLcuIds() {
	const ids = []
	for (let p = 1; p < data.pieces.length; p++) {
		const info = data.pieces[p]
		if (info && info.nation === "tu" && info.piece_class === "LCU") {
			ids.push(p)
		}
	}
	return ids
}

function isBalkansOrGalicia(s) {
	const info = data.spaces[s]
	return !!(info && (info.area === "balkans" || info.region === "Galicia"))
}

function prepareRailConnectedSummitGame(seed) {
	let game = setupGame(seed, "Historical", { no_supply_warnings: true })
	Engine.neutral.trigger_bulgaria_entry(game)
	Engine.neutral.place_bulgaria_third_army(game)
	if (!game.control) game.control = []
	for (let s = 1; s < data.spaces.length; s++) {
		if (isBalkansOrGalicia(s) || (data.spaces[s] && data.spaces[s].name === "CONSTANTINOPLE")) {
			game.control[s] = CP
		}
	}
	for (let p = 1; p < data.pieces.length; p++) {
		let s = game.pieces[p]
		if (data.pieces[p] && data.pieces[p].faction !== CP && s > 0 && isBalkansOrGalicia(s)) {
			game.pieces[p] = 0
		}
	}
	return game
}

test("Enver-Falkenhayn Summit SR prompt does not call a missing rules helper", () => {
	let game = setupGame(2026042702, "Historical", { no_supply_warnings: true })

	prepareEnverFalkenhaynState(game)

	let res = createResultStub()
	eventStates.event_enver_falkenhayn_sr.prompt({ game, res, rules })

	expect(res.actions).toBeTruthy()
})

test("Enver-Falkenhayn Summit allows a TU-A LCU to satisfy the Galicia requirement", () => {
	let game = setupGame(2026042703, "Historical", { no_supply_warnings: true })
	let hermannstadt = findSpace("Hermannstadt")
	let galicia = findSpace("Galicia")
	let tuaLcu = findCpPiece("TU-A VI Corps")
	let event = prepareEnverFalkenhaynState(game, {
		moved: getTurkishLcuIds()
	})

	game.pieces[tuaLcu] = hermannstadt
	game.sr_piece = tuaLcu

	let res = createResultStub()
	eventStates.event_enver_falkenhayn_sr.prompt({ game, res, rules })

	expect(event.galicia_lcu_moved).toBeFalsy()
	expect(res.actions.space).toContain(galicia)
})

test("Enver-Falkenhayn Summit does not allow a second TU-A LCU into Galicia", () => {
	let game = setupGame(2026042704, "Historical", { no_supply_warnings: true })
	let hermannstadt = findSpace("Hermannstadt")
	let galicia = findSpace("Galicia")
	let tuaLcu = findCpPiece("TU-A VI Corps")
	prepareEnverFalkenhaynState(game, {
		galicia_lcu_moved: true
	})

	game.pieces[tuaLcu] = hermannstadt
	game.sr_piece = tuaLcu

	let res = createResultStub()
	eventStates.event_enver_falkenhayn_sr.prompt({ game, res, rules })

	expect(res.actions.space || []).not.toContain(galicia)
})

test("Enver-Falkenhayn Summit prompt avoids repeated global SR destination scans", () => {
	let game = setupGame(2026042705, "Historical", { no_supply_warnings: true })
	prepareEnverFalkenhaynState(game)
	let calls = 0
	const original = Engine.map.get_sr_destinations
	Engine.map.get_sr_destinations = function (...args) {
		calls += 1
		return original.apply(this, args)
	}

	try {
		let res = createResultStub()
		eventStates.event_enver_falkenhayn_sr.prompt({ game, res, rules })
		expect(res.actions).toBeTruthy()
		expect(calls).toBeLessThan(100)
	} finally {
		Engine.map.get_sr_destinations = original
	}
})

test("Enver-Falkenhayn Summit cannot be played when no Turkish LCU can enter Galicia", () => {
	let game = prepareRailConnectedSummitGame(2026052301)
	for (let p = 1; p < data.pieces.length; p++) {
		let info = data.pieces[p]
		if (info && (info.nation === "tu" || info.nation === "tua") && info.piece_class === "LCU") {
			game.pieces[p] = 0
		}
	}

	expect(Engine.map.is_rail_connected_to_galicia(game)).toBe(true)
	expect(Engine.events.can_play_event(game, ENVER_FALKENHAYN_SUMMIT)).toBe(false)
})

test("Enver-Falkenhayn Summit can be played when a Turkish LCU can enter Galicia", () => {
	let game = prepareRailConnectedSummitGame(2026052302)
	let galicia = findSpace("Galicia")
	let sofia = findSpace("SOFIA")
	let tuICorps = findCpPiece("TU I Corps")

	expect(Engine.events.can_play_event(game, ENVER_FALKENHAYN_SUMMIT)).toBe(true)

	Engine.events.play_event(game, ENVER_FALKENHAYN_SUMMIT, { log() {} })
	game = rules.action(game, CP_ROLE, "space", sofia)
	game = rules.action(game, CP_ROLE, "piece", tuICorps)

	let view = rules.view(game, CP_ROLE)
	expect(game.state).toBe("event_enver_falkenhayn_sr")
	expect(view.actions.space).toContain(galicia)
}, 15000)
