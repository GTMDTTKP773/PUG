"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]

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
	expect(rules.analysis.version).toBe(10)
	expect(rules.analysis.capabilities).toContain("action_sequence.simulate")
	expect(rules.analysis.capabilities).toContain("activation_analysis.v1")
	expect(rules.analysis.capabilities).toContain("candidate_context.v1")
	expect(rules.analysis.capabilities).toContain("combat_preview.v1")
	expect(rules.analysis.capabilities).toContain("combat_package_analysis.v1")
	expect(rules.analysis.capabilities).toContain("decision.snapshot")
	expect(rules.analysis.capabilities).toContain("decision.step")
	expect(rules.analysis.capabilities).toContain("movement_analysis.v1")
	expect(rules.analysis.capabilities).toContain("jihad_analysis.v1")
	expect(rules.analysis.capabilities).toContain("position.public")
	expect(rules.analysis.capabilities).toContain("position.public.v2")
	expect(rules.analysis.capabilities).toContain("sr_analysis.v1")
	expect(rules.analysis.capabilities).toContain("supply_cut.standard_one_step_regular")
	expect(rules.analysis.activation_analysis).toBeTypeOf("function")
	expect(rules.analysis.candidate_context).toBeTypeOf("function")
	expect(rules.analysis.combat_preview).toBeTypeOf("function")
	expect(rules.analysis.combat_package_analysis).toBeTypeOf("function")
	expect(rules.analysis.decision_snapshot).toBeTypeOf("function")
	expect(rules.analysis.movement_analysis).toBeTypeOf("function")
	expect(rules.analysis.jihad_analysis).toBeTypeOf("function")
	expect(rules.analysis.public_position).toBeTypeOf("function")
	expect(rules.analysis.probe_supply_cut_actions).toBeTypeOf("function")
	expect(rules.analysis.sr_analysis).toBeTypeOf("function")
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

test("rules AI movement analysis validates path sequences without mutating source", () => {
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
	let result = rules.analysis.movement_analysis(game, AP, [
		{
			kind: "movement_path",
			label: `move:${tiflis}->${akstafa}:stop`,
			probe_supply_cut: true,
			sequence: [["space", akstafa], ["stop", null]]
		},
		["space", 9999]
	])

	expect(result).toMatchObject({
		schema: "pug-ai.movement_analysis.v1",
		state: "choose_pieces_to_move",
		active: AP,
		role: AP,
		candidate_count: 2,
		valid_count: 1
	})
	expect(result.movement).toMatchObject({
		initial: tiflis,
		current: tiflis,
		spaces_moved: 0,
		selected_pieces: [ru]
	})

	let path = result.candidates[0]
	expect(path).toMatchObject({
		kind: "movement_path",
		label: `move:${tiflis}->${akstafa}:stop`,
		valid: true,
		movement_relevant: true,
		final_state: "end_operations",
		total_step_cost: 1,
		finalized_pieces: [ru]
	})
	expect(path.steps).toHaveLength(2)
	expect(path.steps[0]).toMatchObject({
		action: ["space", akstafa],
		kind: "destination",
		source: tiflis,
		destination: akstafa,
		stack_legal: true,
		actual_step_cost: 1,
		entered_pieces: [ru],
		continuing_pieces: [ru],
		finalized_pieces: [],
		vp_delta: 0,
		jihad_delta: 0
	})
	expect(path.steps[0].piece_costs[0]).toMatchObject({
		piece: ru,
		from: tiflis,
		to: akstafa,
		legal: true,
		base: 1,
		enemy_fort_entry: 0,
		total: 1,
		spent_before: 0,
		spent_after: 1,
		remaining_after: 3
	})
	expect(path.steps[0].source_space_before.raw_id).toBe(tiflis)
	expect(path.steps[0].destination_space_before.raw_id).toBe(akstafa)
	expect(path.steps[0].destination_space_after.pieces).toContain(ru)
	expect(path.steps[0].movement_after.selected[0]).toMatchObject({
		id: ru,
		supply_status: "FULL"
	})
	expect(path.steps[0].movement_after.current_space.raw_id).toBe(akstafa)
	expect(path.steps[1]).toMatchObject({
		action: ["stop", null],
		kind: "stop",
		finalized_pieces: [ru],
		ends_current_stack: true
	})
	expect(path.supply_cut_probe.safe).toBe(false)
	expect(path.supply_cut_threat).toMatchObject({
		reason: "reply_cut",
		oos_pieces: [ru]
	})

	let invalid = result.candidates[1]
	expect(invalid).toMatchObject({
		valid: false,
		movement_relevant: true,
		error: {
			type: "illegal_action",
			step: 0,
			action: ["space", 9999]
		}
	})
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI movement analysis reports dropped and continuing units", () => {
	let fixture = createCaucasusActionFixture()
	let { game, tiflis, akstafa, ru } = fixture
	let second = findPiece(AP, "RU DIV #2")
	game.state = "move_stack"
	game.activated = { move: [tiflis], attack: [] }
	game.where = akstafa
	game.pieces[ru] = akstafa
	game.pieces[second] = akstafa
	game.move = {
		initial: tiflis,
		current: akstafa,
		spaces_moved: 1,
		pieces: [ru, second],
		touched_spaces: [tiflis, akstafa],
		faction: AP
	}

	let view = rules.view(game, AP)
	expect(view.actions.piece).toContain(second)
	let before = JSON.stringify(game)
	let result = rules.analysis.movement_analysis(game, AP, [["piece", second]])
	let candidate = result.candidates[0]

	expect(candidate.valid).toBe(true)
	expect(candidate.steps[0]).toMatchObject({
		kind: "drop_piece",
		selected_removed: [second],
		continuing_pieces: [ru],
		finalized_pieces: [second],
		ends_current_stack: false,
		movement_after: {
			current: akstafa,
			spaces_moved: 1,
			selected_pieces: [ru]
		}
	})
	expect(candidate.finalized_pieces).toEqual([second])
	expect(candidate.final.selected).toHaveLength(1)
	expect(candidate.final.selected[0].id).toBe(ru)
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI movement analysis handles candidates with shared path prefixes", () => {
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
	let result = rules.analysis.movement_analysis(game, AP, [
		{
			kind: "movement_path",
			label: `move:${tiflis}->${akstafa}:stop`,
			sequence: [["space", akstafa], ["stop", null]]
		},
		{
			kind: "movement_path",
			label: `move:${tiflis}->${akstafa}->${tiflis}:stop`,
			sequence: [["space", akstafa], ["space", tiflis], ["stop", null]]
		}
	])

	expect(result.candidate_count).toBe(2)
	expect(result.valid_count).toBe(2)
	expect(result.candidates[0].steps[0]).toMatchObject({
		action: ["space", akstafa],
		destination: akstafa
	})
	expect(result.candidates[1].steps[0]).toMatchObject({
		action: ["space", akstafa],
		destination: akstafa
	})
	expect(result.candidates[1].steps[1]).toMatchObject({
		action: ["space", tiflis],
		destination: tiflis
	})
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI SR analysis exposes authoritative reserve semantics without mutating source", () => {
	let game = setupGame(2026061102, "Historical", { no_supply_warnings: true })
	game.active = AP
	game.state = "sr_phase"
	game.sr = 6
	game.sr_moved = []

	let reserve = Engine.game_utils.get_scu_reserve_box(AP)
	let piece = game.pieces.findIndex(
		(space, p) =>
			space === reserve &&
			Engine.map.can_sr_piece(game, p, AP) &&
			Engine.map.get_sr_destinations(game, p, AP).length > 0
	)
	expect(piece).toBeGreaterThanOrEqual(0)
	let destination = Engine.map.get_sr_destinations(game, piece, AP)[0]
	let expectedCost = Engine.map.get_sr_cost(game, piece, reserve, destination, AP)
	let before = JSON.stringify(game)
	let originalCanSrPiece = Engine.map.can_sr_piece
	let originalGetSrDestinations = Engine.map.get_sr_destinations
	let canSrPieceCalls = 0
	let getSrDestinationsCalls = 0
	Engine.map.can_sr_piece = function (...args) {
		canSrPieceCalls += 1
		return originalCanSrPiece(...args)
	}
	Engine.map.get_sr_destinations = function (...args) {
		getSrDestinationsCalls += 1
		return originalGetSrDestinations(...args)
	}
	let analysis
	try {
		analysis = rules.analysis.sr_analysis(game, AP, [
			[piece, destination],
			{ piece, destination: reserve },
		])
	} finally {
		Engine.map.can_sr_piece = originalCanSrPiece
		Engine.map.get_sr_destinations = originalGetSrDestinations
	}
	let legal = analysis.packages[0]
	let illegal = analysis.packages[1]

	expect(analysis).toMatchObject({
		schema: "pug-ai.sr_analysis.v1",
		state: "sr_phase",
		active: AP,
		role: AP,
		package_count: 2,
	})
	expect(legal).toMatchObject({
		piece,
		source: reserve,
		destination,
		cost: expectedCost,
		cost_breakdown: {
			base: 1,
			surcharge: 0,
			total: expectedCost,
		},
		remaining_sr: 6,
		affordable: true,
		piece_legal: true,
		destination_legal: true,
		source_reserve: true,
		destination_reserve: false,
		route: {
			kind: "reserve_exit",
			source_reserve: true,
			destination_reserve: false,
			sea_sr: false,
			delayed_suez: false,
		},
		departure: {
			jihad_increase: 0,
		},
	})
	expect(legal.piece_context.id).toBe(piece)
	expect(legal.source_space).toMatchObject({
		raw_id: reserve,
		reserve_box: true,
		friendly_controlled: true,
	})
	expect(legal.destination_space.raw_id).toBe(destination)
	expect(illegal).toMatchObject({
		piece,
		source: reserve,
		destination: reserve,
		piece_legal: true,
		destination_legal: false,
		source_reserve: true,
		destination_reserve: true,
	})
	expect(canSrPieceCalls).toBe(1)
	expect(getSrDestinationsCalls).toBe(1)
	expect(JSON.stringify(game)).toBe(before)
})

test("rules AI SR analysis compares only unpaid destination cost after the piece is selected", () => {
	let game = setupGame(2026061103, "Historical", { no_supply_warnings: true })
	game.active = AP
	game.state = "sr_phase"
	game.sr_moved = []

	let reserve = Engine.game_utils.get_scu_reserve_box(AP)
	let piece = game.pieces.findIndex(
		(space, p) =>
			space === reserve &&
			Engine.map.can_sr_piece(game, p, AP) &&
			Engine.map.get_sr_destinations(game, p, AP).length > 0
	)
	let destination = Engine.map.get_sr_destinations(game, piece, AP)[0]
	let totalCost = Engine.map.get_sr_cost(game, piece, reserve, destination, AP)
	let paidCost = Engine.map.get_sr_cost(game, piece, reserve, null, AP)

	game.state = "sr_move"
	game.sr_piece = piece
	game.sr = totalCost - paidCost
	let before = JSON.stringify(game)
	let record = rules.analysis.sr_analysis(game, AP, [[piece, destination]]).packages[0]

	expect(record).toMatchObject({
		cost: totalCost,
		paid_cost: paidCost,
		additional_cost: totalCost - paidCost,
		decision_cost: totalCost - paidCost,
		cost_stage: "destination",
		available_sr: totalCost - paidCost,
		affordable: true,
		piece_legal: true,
		destination_legal: true,
	})
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
	expect(result.game.active).toBe(AP_ROLE)
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
	expect(expected.active).toBe(AP_ROLE)
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
