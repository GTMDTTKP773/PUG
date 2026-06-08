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
	expect(rules.analysis.version).toBe(6)
	expect(rules.analysis.capabilities).toContain("action_sequence.simulate")
	expect(rules.analysis.capabilities).toContain("activation_analysis.v1")
	expect(rules.analysis.capabilities).toContain("candidate_context.v1")
	expect(rules.analysis.capabilities).toContain("combat_preview.v1")
	expect(rules.analysis.capabilities).toContain("decision.snapshot")
	expect(rules.analysis.capabilities).toContain("decision.step")
	expect(rules.analysis.capabilities).toContain("position.public")
	expect(rules.analysis.capabilities).toContain("position.public.v2")
	expect(rules.analysis.capabilities).toContain("supply_cut.standard_one_step_regular")
	expect(rules.analysis.activation_analysis).toBeTypeOf("function")
	expect(rules.analysis.candidate_context).toBeTypeOf("function")
	expect(rules.analysis.combat_preview).toBeTypeOf("function")
	expect(rules.analysis.decision_snapshot).toBeTypeOf("function")
	expect(rules.analysis.public_position).toBeTypeOf("function")
	expect(rules.analysis.probe_supply_cut_actions).toBeTypeOf("function")
	expect(rules.analysis.step_decision).toBeTypeOf("function")
})

test("rules AI candidate context is read-only and describes opening card choices", () => {
	let game = setupGame(2026060305)
	let before = JSON.stringify(game)

	let context = rules.analysis.candidate_context(game, CP, [["card", 56]])

	expect(context.schema).toBe("pug-ai.candidate_context.v1")
	expect(context.state).toBe("cp_opening_mobilization_pick")
	expect(context.role).toBe(CP)
	expect(context.contexts).toHaveLength(1)
	expect(context.contexts[0]).toMatchObject({
		action: ["card", 56],
		category: "card",
		card: { id: 56 }
	})
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI activation analysis exposes stack, cost, and target facts without mutating source", () => {
	let game = setupGame(2026060306, "Historical", { no_supply_warnings: true })
	game.active = CP
	game.state = "activate_spaces"
	game.ops = 4
	game.moved = []
	game.activated = { move: [], attack: [], attack_egypt: [] }

	let view = rules.view(game, CP)
	let space = (view.actions.activate_move || [])[0]
	expect(space).toBeGreaterThan(0)
	let before = JSON.stringify(game)

	let context = rules.analysis.candidate_context(game, CP, [["activate_move", space]])
	let activation = rules.analysis.activation_analysis(game, CP, [["activate_move", space]])
	let entry = context.contexts[0]

	expect(entry.category).toBe("activation")
	expect(entry.space_context.raw_id).toBe(space)
	expect(entry.space_context.stack.counts.friendly.pieces).toBeGreaterThan(0)
	expect(entry.activation).toMatchObject({
		mode: "move",
		space,
		remaining_ops: 4
	})
	expect(entry.activation.cost).toBeGreaterThan(0)
	expect(entry.activation.pieces.available.length).toBeGreaterThan(0)
	expect(activation.schema).toBe("pug-ai.activation_analysis.v1")
	expect(activation.actions).toHaveLength(1)
	expect(activation.spaces[0].space).toBe(space)
	expect(activation.spaces[0].modes).toContain("move")
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI combat preview describes attack targets without mutating source", () => {
	let game = setupGame(2026060801, "Historical", { no_supply_warnings: true })
	let kut = findSpace("Kut")
	let theHai = findSpace("The Hai")
	let tuCorps = findPiece(CP, "TU I Corps")
	let inDiv = findPiece(AP, "IN DIV #1")

	clearBoard(game)
	game.active = CP
	game.state = "attack"
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

	let view = rules.view(game, CP)
	expect(view.actions.piece).toContain(tuCorps)
	let before = JSON.stringify(game)

	let preview = rules.analysis.combat_preview(game, CP, [["piece", tuCorps]])
	let entry = preview.previews[0]
	let target = entry.attack.target_options.find((option) => option.space === theHai)

	expect(preview.schema).toBe("pug-ai.combat_preview.v1")
	expect(preview.role).toBe(CP)
	expect(entry.action).toEqual(["piece", tuCorps])
	expect(entry.state).toBe("attack")
	expect(entry.attack.selected_pieces).toEqual([tuCorps])
	expect(target).toBeTruthy()
	expect(target.odds).toBe("2 (LCU) vs 0 (SCU)")
	expect(target.attackers.pieces).toContain(tuCorps)
	expect(target.defenders.pieces).toContain(inDiv)
	expect(target.river_defense).toBe(false)
	expect(JSON.stringify(game)).toBe(before)
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

test("rules AI public position is read-only and summarizes per-space facts", () => {
	let fixture = createCaucasusFixture()
	let { game, akstafa, ru, tu } = fixture
	let before = JSON.stringify(game)

	let position = rules.analysis.public_position(game)
	let akstafa_row = position.spaces.find((space) => space.raw_id === akstafa)
	let ru_piece = position.pieces.find((piece) => piece.id === ru)

	expect(position.schema).toBe("pug-ai.public_position.v2")
	expect(position.spaces).toHaveLength(301)
	expect(akstafa_row.control).toBe(AP)
	expect(akstafa_row.pieces).toContain(ru)
	expect(akstafa_row.counts.ap.scu + akstafa_row.counts.ap.lcu).toBeGreaterThan(0)
	expect(akstafa_row.counts.ap.cf).toBeGreaterThan(0)
	expect(akstafa_row.counts.ap.lf).toBeGreaterThan(0)
	expect(ru_piece).toMatchObject({
		id: ru,
		raw_id: akstafa,
		effective_faction: AP,
		regular: true,
		scu: true
	})
	expect(ru_piece.cf).toBeGreaterThanOrEqual(0)
	expect(ru_piece.lf).toBeGreaterThan(0)
	expect(ru_piece.mf).toBeGreaterThan(0)
	expect(position.spaces.some((space) => space.pieces.includes(tu))).toBe(true)
	expect(position.spaces.some((space) => space.raw_id === 90)).toBe(false)
	expect(JSON.stringify(game)).toBe(before)
})
