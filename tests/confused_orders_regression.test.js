const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPieceByName, clearBoard } = require("./helpers.js")

const AP = Engine.constants.AP
const CP = Engine.constants.CP
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]
const CONFUSED_ORDERS = Engine.combat.CC_CP_CONFUSED_ORDERS
const RESERVES_TO_FRONT = Engine.combat.CC_CP_RESERVES_TO_FRONT
const WATER_SHORTAGE = Engine.combat.CC_CP_WATER_SHORTAGE

function createConfusedOrdersState(overrides = {}) {
	const game = setupGame(260512, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Oltu")
	const target = findSpace("Bayburt")
	const reinforcementSpace = findSpace("Erzurum")
	const attacker = findPieceByName("RU DIV #3")
	const defender = findPieceByName("TU DIV #8")
	const reinforcement = findPieceByName("TU DIV #10")

	clearBoard(game)
	game.pieces[attacker] = origin
	game.pieces[defender] = target
	game.pieces[reinforcement] = reinforcementSpace
	game.control[origin] = AP
	game.control[target] = CP
	game.control[reinforcementSpace] = CP
	game.active = CP
	game.state = "post_roll_cc_defender"
	game.events = {}
	game.reduced = []
	game.retreated = []
	game.attacked = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.hand_cp = [CONFUSED_ORDERS]
	game.discard_cp = []
	game.removed_cp = []
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: AP,
		defender: CP,
		origin_by_piece: { [attacker]: origin },
		initial_attackers: [attacker],
		initial_defenders: [defender]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: CP,
		retreating_units: [defender],
		retreat_can_cancel: true,
		retreat_distance: 1,
		no_advance: false,
		attackers: [attacker],
		defenders: [defender],
		advance_with_reduced: false
	}

	Object.assign(game, overrides.game || {})
	if (overrides.attack) Object.assign(game.attack, overrides.attack)
	if (overrides.battle_result) Object.assign(game.battle_result, overrides.battle_result)

	return { game, origin, target, reinforcementSpace, attacker, defender, reinforcement }
}

function playConfusedOrders(game) {
	expect(rules.view(game, CP_ROLE).actions.play_cc || []).toContain(CONFUSED_ORDERS)
	let result = rules.action(game, CP_ROLE, "play_cc", CONFUSED_ORDERS)
	rules.action(result, CP_ROLE, "confirm")
	return result
}

test("Confused Orders is resolved by CP, not by AP", () => {
	let { game } = createConfusedOrdersState()

	game = playConfusedOrders(game)

	expect(game.state).toBe("confused_orders")
	expect(game.active).toBe(CP_ROLE)
	expect(rules.view(game, AP_ROLE).actions).toBeNull()
	expect(rules.view(game, CP_ROLE).actions.move_unit).toBe(1)
})

test("Confused Orders moves only a CP unit into the defending space", () => {
	let { game, target, attacker, reinforcement } = createConfusedOrdersState()

	game = playConfusedOrders(game)
	game = rules.action(game, CP_ROLE, "move_unit")

	let moveView = rules.view(game, CP_ROLE)
	expect(moveView.actions.piece || []).toContain(reinforcement)
	expect(moveView.actions.piece || []).not.toContain(attacker)

	game = rules.action(game, CP_ROLE, "piece", reinforcement)

	expect(game.pieces[reinforcement]).toBe(target)
	expect(game.state).toBe("confused_orders")
	expect(game.active).toBe(CP_ROLE)
})

test("Confused Orders can cancel a CP Turkish Withdrawal retreat", () => {
	let { game, target, defender } = createConfusedOrdersState()
	game.turkish_retreat = true
	Object.assign(game.battle_result, {
		attacker_losses: 0,
		defender_losses: 0,
		retreat_needed: false,
		retreating_faction: null,
		retreating_units: [],
		retreat_can_cancel: false,
		turkish_retreat: true,
		turkish_retreat_units: [defender],
		turkish_retreat_optional_units: [],
		turkish_retreat_defender_retreats: true,
		advance_with_reduced: true
	})

	game = playConfusedOrders(game)
	expect(rules.view(game, CP_ROLE).actions.done).toBe(1)

	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).not.toBe("turkish_retreat")
	expect(game.pieces[defender]).toBe(target)
	expect(game.turkish_retreat).toBeUndefined()
})

test("Confused Orders can cancel AP advance after the defending space is empty", () => {
	let { game, origin, attacker, defender } = createConfusedOrdersState()
	game.pieces[defender] = Engine.game_utils.get_eliminated_box(CP)

	game = playConfusedOrders(game)
	expect(rules.view(game, CP_ROLE).actions.done).toBe(1)

	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).not.toBe("advance")
	expect(game.pieces[attacker]).toBe(origin)
})

test("Confused Orders is not offered again after a post-battle CP card window", () => {
	let { game, reinforcement } = createConfusedOrdersState()
	game.hand_cp = [CONFUSED_ORDERS, RESERVES_TO_FRONT]
	game.reduced = [reinforcement]
	game.attack.reserves_to_front_damaged_pieces = [reinforcement]
	game.attack.reserves_to_front_initial_reduced_pieces = []

	game = playConfusedOrders(game)
	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).toBe("post_battle_cc_cp")
	expect(game.confused_orders_used).toBe(true)

	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).not.toBe("confused_orders")
})

test("Water Shortage cancels the post-roll CP retreat and AP advance", () => {
	const game = setupGame(260513, "Historical", { no_supply_warnings: true })
	const origin = findSpace("Baghdad")
	const target = findSpace("Ctesiphon")
	const attacker = findPieceByName("BR IX Corps")
	const defender = findPieceByName("TU DIV #8")

	clearBoard(game)
	game.pieces[attacker] = origin
	game.pieces[defender] = target
	game.control[origin] = AP
	game.control[target] = CP
	game.active = CP
	game.state = "post_roll_cc_defender"
	game.events = {}
	game.reduced = []
	game.retreated = []
	game.attacked = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.hand_cp = [WATER_SHORTAGE]
	game.discard_cp = []
	game.removed_cp = []
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: AP,
		defender: CP,
		origin_by_piece: { [attacker]: origin },
		initial_attackers: [attacker],
		initial_defenders: [defender]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: CP,
		retreating_units: [defender],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		attackers: [attacker],
		defenders: [defender],
		advance_with_reduced: false
	}

	expect(rules.view(game, CP_ROLE).actions.play_cc || []).toContain(WATER_SHORTAGE)

	const next = rules.action(game, CP_ROLE, "play_cc", WATER_SHORTAGE)
	rules.action(next, CP_ROLE, "confirm")

	expect(next.state).not.toBe("retreat")
	expect(next.state).not.toBe("advance")
	expect(next.pieces[defender]).toBe(target)
	expect(next.pieces[attacker]).toBe(origin)
})
