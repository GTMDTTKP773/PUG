const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const turnStates = require("../modules/states/states_turn.js")

const { setupGame, findSpace, findCpPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const CP_ROLE = rules.roles[1]

function getTurnFuncs(game) {
	turnStates.set_globals(game)
	return turnStates.register({}, Engine, {
		log: () => {},
		log_h1: () => {},
		get_pieces_in_space: Engine.map.get_pieces_in_space,
		find_space: Engine.game_utils.find_space,
		space_name: Engine.game_utils.space_name,
		piece_name: Engine.game_utils.piece_name,
		other_faction: Engine.utils.other_faction,
		set_control: Engine.set_control,
		check_supply: Engine.map.check_supply,
		eliminate_piece: (p, permanent = false) => Engine.game_utils.eliminate_piece(game, p, () => {}, permanent),
		roll_die: () => 1,
		MO_NONE: "NONE",
		PHASE_SEQUENCE: {},
		AP,
		CP
	})
}

function prepareMoveActivation(game, faction, spaces) {
	game.active = faction
	game.state = "choose_move_space"
	game.activated = { move: spaces.slice(), attack: [] }
	game.region_activations = { move: {}, attack: {} }
	game.activation_cost = {}
	game.moved = []
	game.attacked = []
	game.retreated = []
	game.where = -1
	delete game.move
	delete game.combine_ctx
}

test("OOS trench attrition waits for the Attrition Phase instead of check_supply", () => {
	let game = setupGame(2026052901, "Historical", { no_supply_warnings: true })
	let turn = getTurnFuncs(game)
	let kronstadt = findSpace("Kronstadt")

	game.control[kronstadt] = AP
	Engine.game_utils.set_trench_level(game, kronstadt, 2, AP)

	Engine.map.check_supply(game)

	expect(game.oos_spaces || []).toContain(kronstadt)
	expect(Engine.game_utils.has_trench(game, kronstadt)).toBe(2)
	expect(Engine.game_utils.get_trench_owner(game, kronstadt)).toBe(AP)

	turn.start_attrition_phase()

	expect(Engine.game_utils.has_trench(game, kronstadt)).toBe(1)
	expect(Engine.game_utils.get_trench_owner(game, kronstadt)).toBe(CP)
	expect(Engine.map.get_space_controller(game, kronstadt)).toBe(CP)
})

test("done while choosing pieces ends that move activation", () => {
	let game = setupGame(2026052902, "Historical", { no_supply_warnings: true })
	let constantinople = findSpace("Constantinople")
	let ankara = findSpace("Ankara")
	let div1 = findCpPiece("TU DIV #1")
	let div2 = findCpPiece("TU DIV #2")

	clearBoard(game)
	game.pieces[div1] = constantinople
	game.pieces[div2] = ankara
	prepareMoveActivation(game, CP, [constantinople, ankara])

	game = rules.action(game, CP_ROLE, "space", constantinople)
	expect(game.state).toBe("choose_pieces_to_move")

	game = rules.action(game, CP_ROLE, "done")

	expect(game.activated.move).not.toContain(constantinople)
	expect(game.activated.move).toContain(ankara)
	expect(game.state).toBe("choose_move_space")
	expect(rules.view(game, CP_ROLE).actions.space || []).not.toContain(constantinople)
})

test("combine resolves immediately during movement before entrench rolls", () => {
	let game = setupGame(2026052903, "Historical", { no_supply_warnings: true })
	let tabuk = findSpace("Tabuk")
	let ankara = findSpace("Ankara")
	let div1 = findCpPiece("TU DIV #1")
	let div2 = findCpPiece("TU DIV #2")
	let entrenchUnit = findCpPiece("TU DIV #3")
	let corps = findCpPiece("TU I Corps")

	clearBoard(game)
	game.control[tabuk] = CP
	game.control[ankara] = CP
	game.pieces[div1] = tabuk
	game.pieces[div2] = tabuk
	game.pieces[entrenchUnit] = ankara
	game.pieces[corps] = Engine.game_utils.get_lcu_reserve_box(CP)
	game.entrenching = [entrenchUnit]
	game.entrench_attempts = [ankara]
	prepareMoveActivation(game, CP, [tabuk])
	game.entrenching = [entrenchUnit]
	game.entrench_attempts = [ankara]

	expect(Engine.game_utils.can_combine_in_space(game, tabuk, CP)).toBe(true)

	game = rules.action(game, CP_ROLE, "space", tabuk)
	expect(game.state).toBe("choose_pieces_to_move")
	expect(game).not.toHaveProperty("state", "choose_move_action")

	game = rules.action(game, CP_ROLE, "piece", div1)
	game = rules.action(game, CP_ROLE, "piece", div2)
	expect(rules.view(game, CP_ROLE).actions.combine).toBe(1)

	game = rules.action(game, CP_ROLE, "combine")

	expect(game.state).toBe("combine_lcu_select_lcu")
	expect(game.combine_ctx).toMatchObject({
		selected_scus: [div1, div2],
		allowed_scus: [div1, div2],
		space: tabuk,
		faction: CP,
		immediate_resolution: true,
		return_to_move_phase: true
	})
	expect(Engine.map.get_pieces_in_space(game, tabuk)).toEqual(expect.arrayContaining([div1, div2]))

	game = rules.action(game, CP_ROLE, "piece", corps)
	expect(game.state).toBe("combine_lcu_dispose_reserve")
	game = rules.action(game, CP_ROLE, "piece", div1)
	expect(game.state).toBe("combine_lcu_dispose_removed")
	game = rules.action(game, CP_ROLE, "piece", div2)

	expect(game.pieces[corps]).toBe(tabuk)
	expect(game.reduced).toContain(corps)
	expect(game.state).toBe("entrench_roll")
})

test("selected SCUs can move or combine, and moving clears the combine action", () => {
	let game = setupGame(2026052904, "Historical", { no_supply_warnings: true })
	let tabuk = findSpace("Tabuk")
	let div1 = findCpPiece("TU DIV #1")
	let div2 = findCpPiece("TU DIV #2")
	let corps = findCpPiece("TU I Corps")

	clearBoard(game)
	game.control[tabuk] = CP
	game.pieces[div1] = tabuk
	game.pieces[div2] = tabuk
	game.pieces[corps] = Engine.game_utils.get_lcu_reserve_box(CP)
	prepareMoveActivation(game, CP, [tabuk])

	game = rules.action(game, CP_ROLE, "space", tabuk)
	game = rules.action(game, CP_ROLE, "piece", div1)
	game = rules.action(game, CP_ROLE, "piece", div2)

	let view = rules.view(game, CP_ROLE)
	expect(view.actions.combine).toBe(1)
	expect((view.actions.space || []).length).toBeGreaterThan(0)

	let destination = (view.actions.space || [])[0]
	game = rules.action(game, CP_ROLE, "space", destination)

	expect(game.state).toBe("move_stack")
	expect(rules.view(game, CP_ROLE).actions.combine).toBeUndefined()
})
