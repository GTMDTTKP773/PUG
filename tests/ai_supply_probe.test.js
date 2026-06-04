"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants

function createCaucasusFixture() {
	let game = setupGame(2026060201, "Historical", { no_supply_warnings: true })
	let tiflis = findSpace("TIFLIS")
	let akstafa = findSpace("Akstafa")
	let aleksandropol = findSpace("Aleksandropol")
	let ru = findPiece(AP, "RU DIV #1")
	let tu = findPiece(CP, "TU DIV #1")

	clearBoard(game)
	for (let s = 1; s < Engine.data.spaces.length; s++) {
		if (Engine.data.spaces[s]) game.control[s] = CP
	}

	game.control[tiflis] = AP
	game.control[akstafa] = AP
	game.pieces[ru] = akstafa
	game.pieces[tu] = aleksandropol
	game.supply_dirty = true

	return { game, tiflis, akstafa, aleksandropol, ru, tu }
}

function createCaucasusActionFixture() {
	let fixture = createCaucasusFixture()
	fixture.game.pieces[fixture.ru] = fixture.tiflis
	fixture.game.active = AP
	fixture.game.moved = []
	fixture.game.sr_moved = []
	return fixture
}

test("rules exposes a versioned optional analysis namespace", () => {
	expect(rules.analysis.version).toBe(2)
	expect(rules.analysis.capabilities).toContain("action_sequence.simulate")
	expect(rules.analysis.capabilities).toContain("decision.snapshot")
	expect(rules.analysis.capabilities).toContain("decision.step")
	expect(rules.analysis.capabilities).toContain("supply_cut.standard_one_step_regular")
	expect(rules.analysis.decision_snapshot).toBeTypeOf("function")
	expect(rules.analysis.probe_supply_cut_actions).toBeTypeOf("function")
	expect(rules.analysis.step_decision).toBeTypeOf("function")
})

test("rules AI decision snapshot separates legal actions from search candidates", () => {
	let game = setupGame(2026060300)
	let before = JSON.stringify(game)

	let snapshot = rules.analysis.decision_snapshot(game, CP)

	expect(snapshot.legal_actions).toContainEqual(["flag_supply_warnings", null])
	expect(snapshot.legal_actions.some(([name]) => name === "undo")).toBe(false)
	expect(snapshot.candidates.some(([name]) => name === "card")).toBe(true)
	expect(snapshot.candidates.some(([name]) => name === "undo")).toBe(false)
	expect(snapshot.candidates.some(([name]) => name === "flag_supply_warnings")).toBe(false)
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI decision step is read-only and folds deterministic browser flow", () => {
	let game = setupGame(2026060301)
	let before = JSON.stringify(game)

	let result = rules.analysis.step_decision(game, CP, ["card", 56])

	expect(result.sequence).toEqual([
		["card", 56],
		["next", null]
	])
	expect(result.game.state).toBe("play_card")
	expect(result.game.active).toBe(AP)
	expect(result.decision.candidates.some(([name]) => name === "play_event")).toBe(true)
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI action sequence simulation is read-only and follows the next active role", () => {
	let game = setupGame(2026060303)
	let before = JSON.stringify(game)
	let actions = [
		["card", 56],
		["next", null]
	]

	let expected = rules.action(JSON.parse(before), CP, actions[0][0], actions[0][1])
	expect(expected.active).toBe(AP)
	expected = rules.action(expected, expected.active, actions[1][0], actions[1][1])

	let result = rules.analysis.simulate_action_sequence(game, actions)

	expect(result).toEqual(expected)
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI action sequence rejects an illegal micro-action without mutating the source game", () => {
	let game = setupGame(2026060304)
	let before = JSON.stringify(game)

	expect(() => rules.analysis.simulate_action_sequence(game, [["next", null]])).toThrow(
		"Invalid action sequence step 0: next(null)"
	)
	expect(JSON.stringify(game)).toBe(before)
})

test("AI standard one-step supply probe is read-only and finds an immediate cut", () => {
	let fixture = createCaucasusFixture()
	let before = JSON.stringify(fixture.game)
	let metrics = {}

	let result = Engine.analysis.find_standard_one_step_supply_cut_reply(fixture.game, [fixture.ru], AP, metrics)

	expect(result).toEqual({
		reason: "reply_cut",
		reply: {
			piece: fixture.tu,
			from: fixture.aleksandropol,
			to: fixture.tiflis
		},
		oos_pieces: [fixture.ru]
	})
	expect(metrics.reply_scans).toBe(1)
	expect(JSON.stringify(fixture.game)).toBe(before)
})

test("rules AI supply probe rejects an exposed SR destination without mutating the source game", () => {
	let fixture = createCaucasusActionFixture()
	let before = JSON.stringify(fixture.game)
	fixture.game.state = "sr_move"
	fixture.game.sr_piece = fixture.ru
	fixture.game.sr = 1
	before = JSON.stringify(fixture.game)

	expect(Engine.map.can_sr_to_space(fixture.game, fixture.ru, fixture.akstafa, AP)).toBe(true)
	let result = rules.analysis.probe_supply_cut_actions(fixture.game, AP, [["space", fixture.akstafa]])

	expect(result.safe).toHaveLength(0)
	expect(result.unsafe).toHaveLength(1)
	expect(result.unsafe[0]).toMatchObject({
		action: ["space", fixture.akstafa],
		reason: "reply_cut",
		reply: {
			piece: fixture.tu,
			from: fixture.aleksandropol,
			to: fixture.tiflis
		},
		oos_pieces: [fixture.ru]
	})
	expect(JSON.stringify(fixture.game)).toBe(before)
})

test("rules AI supply probe allows Movement transit but rejects stopping at the exposed destination", () => {
	let fixture = createCaucasusActionFixture()
	let { game, tiflis, akstafa, ru } = fixture
	game.state = "choose_pieces_to_move"
	game.activated = { move: [tiflis], attack: [] }
	game.where = tiflis
	game.move = {
		initial: tiflis,
		current: tiflis,
		spaces_moved: 0,
		pieces: [ru],
		touched_spaces: [tiflis],
		faction: AP
	}

	let before = JSON.stringify(game)
	let transit = rules.analysis.probe_supply_cut_actions(game, AP, [["space", akstafa]])
	expect(transit.unsafe).toHaveLength(0)
	expect(transit.metrics.actions).toBe(1)
	expect(transit.metrics.reply_scans || 0).toBe(0)
	expect(JSON.stringify(game)).toBe(before)

	game.state = "move_stack"
	game.pieces[ru] = akstafa
	game.move.current = akstafa
	game.move.spaces_moved = 1
	before = JSON.stringify(game)
	let stop = rules.analysis.probe_supply_cut_actions(game, AP, [["stop", null]])
	expect(stop.safe).toHaveLength(0)
	expect(stop.unsafe).toHaveLength(1)
	expect(stop.unsafe[0].reason).toBe("reply_cut")
	expect(JSON.stringify(game)).toBe(before)
})
