const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPieceByName, clearBoard } = require("./helpers.js")

const AP = Engine.constants.AP
const CP = Engine.constants.CP
const CP_ROLE = rules.roles[1]

function createReservesToFrontState({ initiallyReduced, currentState }) {
	const game = setupGame(260507, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Oltu")
	const target = findSpace("Bayburt")
	const attacker = findPieceByName("RU DIV #3")
	const turkish = findPieceByName("TU DIV #8")

	clearBoard(game)
	game.pieces[attacker] = origin
	game.pieces[turkish] = currentState === "eliminated" ? Engine.game_utils.get_eliminated_box(CP) : target
	game.control[origin] = AP
	game.control[target] = CP
	game.active = CP
	game.state = "event_reserves_to_front"
	game.events = {}
	game.reduced = currentState === "reduced" ? [turkish] : []
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: AP,
		defender: CP,
		initial_attackers: [attacker],
		initial_defenders: [turkish],
		reserves_to_front_damaged_pieces: [turkish],
		reserves_to_front_initial_reduced_pieces: initiallyReduced ? [turkish] : []
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 1,
		turkish_retreat: false,
		retreating_units: []
	}
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)

	return { game, turkish, target }
}

test("Reserves to the Front cannot refill a unit that began the battle reduced", () => {
	const { game, turkish, target } = createReservesToFrontState({
		initiallyReduced: true,
		currentState: "eliminated"
	})

	expect(game.reserves_to_front_pieces).toContain(turkish)
	expect(Engine.combat_cards.get_reserves_to_front_piece_cost(game, turkish)).toBe(0.5)

	rules.action(game, CP_ROLE, "piece", turkish)

	expect(game.pieces[turkish]).toBe(target)
	expect(Engine.game_utils.is_piece_reduced(game, turkish)).toBe(true)
	expect(game.reserves_to_front_spent).toBe(0.5)
	expect(Engine.combat_cards.get_reserves_to_front_piece_cost(game, turkish)).toBe(0)
	expect((rules.view(game, CP_ROLE).actions.piece || [])).not.toContain(turkish)

	rules.action(game, CP_ROLE, "piece", turkish)

	expect(Engine.game_utils.is_piece_reduced(game, turkish)).toBe(true)
	expect(game.reserves_to_front_spent).toBe(0.5)
})

test("Reserves to the Front can refill a unit reduced by the current battle", () => {
	const { game, turkish } = createReservesToFrontState({
		initiallyReduced: false,
		currentState: "reduced"
	})

	expect(game.reserves_to_front_pieces).toContain(turkish)
	expect(Engine.combat_cards.get_reserves_to_front_piece_cost(game, turkish)).toBe(0.5)

	rules.action(game, CP_ROLE, "piece", turkish)

	expect(Engine.game_utils.is_piece_reduced(game, turkish)).toBe(false)
	expect(game.reserves_to_front_spent).toBe(0.5)
	expect(Engine.combat_cards.get_reserves_to_front_piece_cost(game, turkish)).toBe(0)
})

test("Reserves to the Front can refill a Turkish elite reduced by severe weather", () => {
	const game = setupGame(260512, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Samarra")
	const target = findSpace("Baghdad")
	const turkishElite = findPieceByName("TU Elite DIV #1")

	clearBoard(game)
	game.turn = 4
	game.action_round = 1
	game.active = CP
	game.state = "pre_weather_cc_attacker"
	game.events = {}
	game.reduced = []
	game.pieces[turkishElite] = origin
	game.attack = {
		space: target,
		pieces: [turkishElite],
		attacker: CP,
		defender: AP,
		initial_attackers: [turkishElite],
		initial_defenders: [],
		reserves_to_front_initial_reduced_pieces: []
	}

	rules.action(game, CP_ROLE, "done")

	expect(Engine.game_utils.is_piece_reduced(game, turkishElite)).toBe(true)
	expect(game.attack.reserves_to_front_damaged_pieces).toContain(turkishElite)
	expect(Engine.combat_cards.get_reserves_to_front_piece_pool(game)).toContain(turkishElite)

	game.state = "event_reserves_to_front"
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)

	rules.action(game, CP_ROLE, "piece", turkishElite)

	expect(Engine.game_utils.is_piece_reduced(game, turkishElite)).toBe(false)
	expect(game.reserves_to_front_spent).toBe(0.5)
})

test("Reserves to the Front exposes a dot unit killed into PE as selectable", () => {
	const game = setupGame(260513, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Oltu")
	const target = findSpace("Bayburt")
	const attacker = findPieceByName("RU DIV #3")
	const stanke = findPieceByName("TU Stanke Bey")

	clearBoard(game)
	game.pieces[attacker] = origin
	game.pieces[stanke] = target
	game.control[origin] = AP
	game.control[target] = CP
	game.active = CP
	game.state = "apply_defender_losses"
	game.events = {}
	game.reduced = [stanke]
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: AP,
		defender: CP,
		initial_attackers: [attacker],
		initial_defenders: [stanke],
		reserves_to_front_initial_reduced_pieces: [stanke],
		attacker_losses: 0,
		attacker_losses_absorbed: 0,
		defender_losses: 1,
		defender_losses_absorbed: 0
	}
	game.battle_result = {
		attackers: [attacker],
		defenders: [stanke],
		attacker_losses: 0,
		defender_losses: 1,
		turkish_retreat: false,
		retreating_units: []
	}

	rules.action(game, CP_ROLE, "piece", stanke)

	expect(Engine.game_utils.is_permanently_eliminated(game, stanke)).toBe(true)
	expect(game.attack.reserves_to_front_damaged_pieces).toContain(stanke)

	game.state = "event_reserves_to_front"
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)
	let view = rules.view(game, CP_ROLE)

	expect(view.actions.piece || []).toContain(stanke)

	rules.action(game, CP_ROLE, "piece", stanke)

	expect(game.pieces[stanke]).toBe(target)
	expect(Engine.game_utils.is_piece_reduced(game, stanke)).toBe(true)
})

test("Reserves to the Front rebuilds an eliminated Turkish attacker in its attack origin", () => {
	const game = setupGame(260509, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Bayburt")
	const target = findSpace("Oltu")
	const turkish = findPieceByName("TU DIV #8")
	const defender = findPieceByName("RU DIV #3")

	clearBoard(game)
	game.pieces[turkish] = Engine.game_utils.get_eliminated_box(CP)
	game.pieces[defender] = target
	game.control[origin] = CP
	game.control[target] = AP
	game.active = CP
	game.state = "event_reserves_to_front"
	game.events = {}
	game.reduced = []
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [],
		origin_by_piece: { [turkish]: origin },
		attacker: CP,
		defender: AP,
		initial_attackers: [turkish],
		initial_defenders: [defender],
		reserves_to_front_damaged_pieces: [turkish],
		reserves_to_front_initial_reduced_pieces: []
	}
	game.battle_result = {
		attackers: [turkish],
		defenders: [defender],
		attacker_losses: 1,
		defender_losses: 0,
		turkish_retreat: false,
		retreating_units: []
	}
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)

	expect(game.reserves_to_front_pieces).toContain(turkish)

	rules.action(game, CP_ROLE, "piece", turkish)

	expect(game.pieces[turkish]).toBe(origin)
	expect(game.pieces[turkish]).not.toBe(target)
	expect(Engine.game_utils.is_piece_reduced(game, turkish)).toBe(true)
})

test("Reserves to the Front rebuilt attackers stay marked as already attacked", () => {
	const game = setupGame(260511, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Bayburt")
	const target = findSpace("Oltu")
	const otherTarget = findSpace("Erzurum")
	const turkish = findPieceByName("TU DIV #8")
	const defender = findPieceByName("RU DIV #3")
	const otherDefender = findPieceByName("RU DIV #4")

	clearBoard(game)
	game.pieces[turkish] = origin
	game.pieces[defender] = target
	game.pieces[otherDefender] = otherTarget
	game.control[origin] = CP
	game.control[target] = AP
	game.control[otherTarget] = AP
	game.active = CP
	game.state = "event_reserves_to_front"
	game.events = {}
	game.reduced = []
	game.attacked = [turkish]
	game.attacked_spaces = [target]
	game.activated = { attack: [origin], move: [] }
	game.region_activations = { attack: {}, move: {} }
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [turkish],
		origin_by_piece: { [turkish]: origin },
		attacker: CP,
		defender: AP,
		initial_attackers: [turkish],
		initial_defenders: [defender],
		reserves_to_front_damaged_pieces: [turkish],
		reserves_to_front_initial_reduced_pieces: []
	}
	game.battle_result = {
		attackers: [turkish],
		defenders: [defender],
		attacker_losses: 1,
		defender_losses: 0,
		turkish_retreat: false,
		retreating_units: []
	}
	Engine.game_utils.eliminate_piece(game, turkish, () => {}, false)
	expect(game.attacked).not.toContain(turkish)

	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)
	rules.action(game, CP_ROLE, "piece", turkish)

	expect(game.pieces[turkish]).toBe(origin)
	expect(game.attacked).toContain(turkish)

	game.attack = null
	game.state = "attack"
	let view = rules.view(game, CP_ROLE)

	expect(game.eligible_attackers).not.toContain(turkish)
	expect(view.actions.piece || []).not.toContain(turkish)
})

test("Reserves to the Front keeps an eliminated attacking LCU at its original space after SCU replacement", () => {
	const game = setupGame(260510, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Constantinople")
	const target = findSpace("Adrianople")
	const turkishLcu = findPieceByName("TU I Corps")
	const replacement = findPieceByName("TU DIV #1")
	const defender = findPieceByName("RU DIV #3")
	const cpReserve = Engine.game_utils.get_scu_reserve_box(CP)

	clearBoard(game)
	game.pieces[turkishLcu] = origin
	game.pieces[replacement] = cpReserve
	game.pieces[defender] = target
	game.control[origin] = CP
	game.control[target] = AP
	game.active = CP
	game.state = "apply_attacker_losses"
	game.events = {}
	game.reduced = [turkishLcu]
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [turkishLcu],
		origin_by_piece: { [turkishLcu]: origin },
		attacker: CP,
		defender: AP,
		initial_attackers: [turkishLcu],
		initial_defenders: [defender],
		reserves_to_front_damaged_pieces: [],
		reserves_to_front_initial_reduced_pieces: [],
		attacker_losses: 2,
		attacker_losses_absorbed: 0,
		defender_losses: 0,
		defender_losses_absorbed: 0
	}
	game.battle_result = {
		attackers: [turkishLcu],
		defenders: [defender],
		attacker_losses: 2,
		defender_losses: 0,
		turkish_retreat: false,
		retreating_units: []
	}

	rules.action(game, CP_ROLE, "piece", turkishLcu)

	expect(Engine.game_utils.is_eliminated(game, turkishLcu)).toBe(true)
	expect(game.attack.origin_by_piece[turkishLcu]).toBeUndefined()
	expect(game.attack.origin_by_piece[replacement]).toBe(origin)
	expect(game.attack.reserves_to_front_rebuild_space_by_piece[turkishLcu]).toBe(origin)

	game.active = CP
	game.state = "event_reserves_to_front"
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)

	expect(game.reserves_to_front_pieces).toContain(turkishLcu)

	rules.action(game, CP_ROLE, "piece", turkishLcu)

	expect(game.pieces[turkishLcu]).toBe(origin)
	expect(game.pieces[turkishLcu]).not.toBe(target)
	expect(Engine.game_utils.is_piece_reduced(game, turkishLcu)).toBe(true)
})

test("Reserves to the Front returns the replacement SCU to reserve when rebuilding an eliminated LCU", () => {
	const game = setupGame(260514, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Constantinople")
	const target = findSpace("Adrianople")
	const turkishLcu = findPieceByName("TU I Corps")
	const replacement = findPieceByName("TU DIV #1")
	const defender = findPieceByName("RU DIV #3")
	const cpReserve = Engine.game_utils.get_scu_reserve_box(CP)

	clearBoard(game)
	game.pieces[turkishLcu] = origin
	game.pieces[replacement] = cpReserve
	game.pieces[defender] = target
	game.control[origin] = CP
	game.control[target] = AP
	game.active = CP
	game.state = "apply_attacker_losses"
	game.events = {}
	game.reduced = [turkishLcu]
	game.rp_cp.tu = 2
	game.attack = {
		space: target,
		pieces: [turkishLcu],
		origin_by_piece: { [turkishLcu]: origin },
		attacker: CP,
		defender: AP,
		initial_attackers: [turkishLcu],
		initial_defenders: [defender],
		reserves_to_front_damaged_pieces: [],
		reserves_to_front_initial_reduced_pieces: [],
		attacker_losses: 2,
		attacker_losses_absorbed: 0,
		defender_losses: 0,
		defender_losses_absorbed: 0
	}
	game.battle_result = {
		attackers: [turkishLcu],
		defenders: [defender],
		attacker_losses: 2,
		defender_losses: 0,
		turkish_retreat: false,
		retreating_units: []
	}

	rules.action(game, CP_ROLE, "piece", turkishLcu)

	expect(Engine.game_utils.is_eliminated(game, turkishLcu)).toBe(true)
	expect(game.attack.origin_by_piece[replacement]).toBe(origin)
	expect(game.attack.lcu_replacement_map[turkishLcu]).toBe(replacement)

	game.active = CP
	game.state = "event_reserves_to_front"
	game.reserves_to_front_pieces = Engine.combat_cards.get_reserves_to_front_piece_pool(game)

	rules.action(game, CP_ROLE, "piece", turkishLcu)

	expect(game.pieces[turkishLcu]).toBe(origin)
	expect(game.pieces[replacement]).toBe(cpReserve)
	expect(game.attack.lcu_replacement_map[turkishLcu]).toBeUndefined()
	expect(game.attack.pieces).toContain(turkishLcu)
	expect(game.attack.pieces).not.toContain(replacement)
	expect(game.battle_result.attackers).toContain(turkishLcu)
	expect(game.battle_result.attackers).not.toContain(replacement)
	expect(Engine.game_utils.is_piece_reduced(game, turkishLcu)).toBe(true)
})

test("combat start snapshots initially reduced units for Reserves to the Front", () => {
	const game = setupGame(260508, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Oltu")
	const target = findSpace("Bayburt")
	const attacker = findPieceByName("RU DIV #3")
	const defender = findPieceByName("TU DIV #8")

	clearBoard(game)
	game.pieces[attacker] = origin
	game.pieces[defender] = target
	game.control[origin] = AP
	game.control[target] = CP
	game.active = AP
	game.reduced = [defender]
	game.retreated = []
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: AP,
		defender: CP
	}

	Engine.combat.start_attack_sequence(game, () => {})

	expect(game.attack.reserves_to_front_initial_reduced_pieces).toContain(defender)
})
