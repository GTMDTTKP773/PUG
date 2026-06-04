"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { setupGame, findSpace, findApPiece, findCpPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function setupCpMove(game, piece, from) {
	game.active = CP
	game.state = "move_stack"
	game.ops = 1
	game.card_ops = 1
	game.activated = { move: [from], attack: [] }
	game.region_activations = { move: {}, attack: {} }
	game.activation_cost = { move: 0, attack: 0 }
	game.attacked = []
	game.retreated = []
	game.moved = []
	game.move = {
		initial: from,
		current: from,
		spaces_moved: 0,
		pieces: [piece],
		touched_spaces: [from]
	}
}

function setupJerusalemAttack(game, enableJerusalemRule = true) {
	clearBoard(game)
	game.options.optional_jerusalem_rule = enableJerusalemRule
	let jerusalem = findSpace("Jerusalem")
	let beersheba = findSpace("Beersheba")
	let attackers = [findApPiece("BR DIV #1"), findApPiece("BR DIV #2"), findApPiece("BR DIV #3")]
	let defender = findCpPiece("TU DIV #1")

	for (let p of attackers) game.pieces[p] = beersheba
	game.pieces[defender] = jerusalem
	game.control[beersheba] = AP
	game.control[jerusalem] = CP
	game.active = AP
	game.state = "confirm_attack"
	game.events = {}
	game.attack = {
		space: jerusalem,
		pieces: attackers
	}

	return { jerusalem, attackers, defender }
}

test("CP moving into own-controlled Baghdad does not add Jihad from a legacy empty owner snapshot", () => {
	let game = setupGame(2026050701, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let baghdad = findSpace("Baghdad")
	let ctesiphon = findSpace("Ctesiphon")
	let unit = findCpPiece("TU-A DIV #10")

	game.pieces[unit] = ctesiphon
	game.jihad = 0
	game.jihad_city_effective_owner[baghdad] = 0
	setupCpMove(game, unit, ctesiphon)

	game = rules.action(game, CP_ROLE, "space", baghdad)

	expect(game.pieces[unit]).toBe(baghdad)
	expect(Engine.map.get_space_controller(game, baghdad)).toBe(CP)
	expect(game.jihad).toBe(0)
	expect(game.jihad_city_effective_owner[baghdad]).toBe(CP)
	expect(game.state).not.toBe("jihad_placement")
})

test("CP leaving own-controlled Baghdad does not add Jihad from a legacy empty owner snapshot", () => {
	let game = setupGame(2026050702, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let baghdad = findSpace("Baghdad")
	let ctesiphon = findSpace("Ctesiphon")
	let unit = findCpPiece("TU-A DIV #10")

	game.pieces[unit] = baghdad
	game.jihad = 0
	game.jihad_city_effective_owner[baghdad] = 0
	setupCpMove(game, unit, baghdad)

	game = rules.action(game, CP_ROLE, "space", ctesiphon)

	expect(game.pieces[unit]).toBe(ctesiphon)
	expect(Engine.map.get_space_controller(game, baghdad)).toBe(CP)
	expect(game.jihad).toBe(0)
	expect(game.jihad_city_effective_owner[baghdad]).toBe(CP)
	expect(game.state).not.toBe("jihad_placement")
})

test("CP recapturing AP-controlled Baghdad still adds Jihad with a legacy empty owner snapshot", () => {
	let game = setupGame(2026050703, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let baghdad = findSpace("Baghdad")
	let ctesiphon = findSpace("Ctesiphon")
	let unit = findCpPiece("TU-A DIV #10")

	game.control[baghdad] = Engine.constants.AP
	game.pieces[unit] = ctesiphon
	game.jihad = 0
	game.jihad_city_effective_owner[baghdad] = 0
	setupCpMove(game, unit, ctesiphon)

	game = rules.action(game, CP_ROLE, "space", baghdad)

	expect(game.pieces[unit]).toBe(baghdad)
	expect(Engine.map.get_space_controller(game, baghdad)).toBe(CP)
	expect(game.jihad).toBe(1)
	expect(game.jihad_city_effective_owner[baghdad]).toBe(CP)
	expect(game.state).toBe("jihad_placement")
})

test("AP irregular partial control of CP-controlled Mecca lowers Jihad without changing control", () => {
	let game = setupGame(2026051601, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let mecca = findSpace("Mecca")
	let arab = findApPiece("Arab Revolt #1")

	game.pieces[arab] = mecca
	game.control[mecca] = null
	game.jihad = 3
	game.vp = 10
	game.jihad_city_effective_owner[mecca] = CP
	game.jihad_city_scoring_owner[mecca] = CP

	Engine.sync_region_control(game, mecca)
	Engine.sync_neutral_vp_state(game, mecca)
	Engine.sync_jihad_city_state(game, mecca)

	expect(Engine.map.get_space_controller(game, mecca)).toBe(CP)
	expect(game.region_disruption[mecca]).toBe(AP)
	expect(game.vp_partial_disruption[mecca]).toBe(AP)
	expect(Engine.get_jihad_city_effective_owner(game, mecca)).toBe(CP)
	expect(Engine.get_jihad_city_scoring_owner(game, mecca)).toBe(AP)
	expect(game.jihad_city_effective_owner[mecca]).toBe(CP)
	expect(game.jihad_city_scoring_owner[mecca]).toBe(AP)
	expect(game.vp).toBe(9)
	expect(game.jihad).toBe(2)
})

test("Jerusalem special rule entered from attack confirmation is interactive for the defender", () => {
	let game = setupGame(2026051203, "Historical", { no_supply_warnings: true })
	setupJerusalemAttack(game)

	game = rules.action(game, AP_ROLE, "confirm")
	let cp_view = rules.view(game, CP_ROLE)

	expect(game.state).toBe("jerusalem_defender_choice")
	expect(game.active).toBe(CP)
	expect(cp_view.prompt).toBe("耶路撒冷特殊规则：防守方必须选择战斗或撤退。")
	expect(cp_view.actions.fight).toBe(1)
	expect(cp_view.actions.withdraw).toBe(1)

	game = rules.action(game, CP_ROLE, "fight")

	expect(game.state).toBe("jerusalem_attacker_choice")
	expect(game.active).toBe(AP)
})

test("Jerusalem optional rule is off by default", () => {
	let game = setupGame(2026051207, "Historical", { no_supply_warnings: true })
	setupJerusalemAttack(game, false)

	game = rules.action(game, AP_ROLE, "confirm")
	let cp_view = rules.view(game, CP_ROLE)

	expect(game.options.optional_jerusalem_rule).toBe(false)
	expect(game.state).not.toBe("jerusalem_defender_choice")
	expect(game.active).toBe(AP)
	expect(cp_view.actions?.fight).toBeUndefined()
	expect(cp_view.actions?.withdraw).toBeUndefined()
})

test("Jerusalem defender withdrawal branch exposes a retreat action instead of stalling", () => {
	let game = setupGame(2026051204, "Historical", { no_supply_warnings: true })
	let { defender } = setupJerusalemAttack(game)

	game = rules.action(game, AP_ROLE, "confirm")
	game = rules.action(game, CP_ROLE, "withdraw")
	let cp_view = rules.view(game, CP_ROLE)

	expect(game.state).toBe("retreat")
	expect(game.active).toBe(CP)
	expect(game.retreat_pieces).toContain(defender)
	expect(cp_view.actions.piece).toContain(defender)
})

test("AP continuing a Jerusalem battle pauses for the Jihad placement before combat resumes", () => {
	let game = setupGame(2026051201, "Historical", { no_supply_warnings: true })
	let jerusalem = findSpace("Jerusalem")

	game.options.optional_jerusalem_rule = true
	game.active = AP
	game.state = "jerusalem_attacker_choice"
	game.state_stack = []
	game.jihad = 4
	game.tribes_to_place = 0
	game.attack = {
		space: jerusalem,
		pieces: [findApPiece("BR DIV #1"), findApPiece("BR DIV #2"), findApPiece("BR DIV #3")],
		attacker: AP,
		defender: CP
	}

	game = rules.action(game, AP_ROLE, "continue_attack")

	expect(game.jihad).toBe(5)
	expect(game.tribes_to_place).toBe(1)
	expect(game.state).toBe("jihad_placement")
	expect(game.active).toBe(CP)
	expect(game.state_stack.at(-1).state).toBe("jerusalem_continue_after_jihad")

	game = rules.action(game, CP_ROLE, "done")
	expect(game.state).toBe("jerusalem_continue_after_jihad")
	expect(game.active).toBe(AP)

	game = rules.action(game, AP_ROLE, "next")
	expect(game.state).not.toBe("jerusalem_continue_after_jihad")
	expect(game.state).not.toBe("jerusalem_attacker_choice")
})

test("CP continuing a Jerusalem battle does not add the AP-only Jihad point", () => {
	let game = setupGame(2026051202, "Historical", { no_supply_warnings: true })
	let jerusalem = findSpace("Jerusalem")

	game.options.optional_jerusalem_rule = true
	game.active = CP
	game.state = "jerusalem_attacker_choice"
	game.state_stack = []
	game.jihad = 4
	game.tribes_to_place = 0
	game.attack = {
		space: jerusalem,
		pieces: [findCpPiece("TU DIV #1"), findCpPiece("TU DIV #2"), findCpPiece("TU DIV #3")],
		attacker: CP,
		defender: AP
	}

	game = rules.action(game, CP_ROLE, "continue_attack")

	expect(game.jihad).toBe(4)
	expect(game.tribes_to_place).toBe(0)
	expect(game.state).not.toBe("jihad_placement")
	expect(game.state_stack).toEqual([])
})

test("same action round Jihad city gain then loss keeps the counter and resume state aligned", () => {
	let game = setupGame(2026051206, "Historical", { no_supply_warnings: true })
	let baghdad = findSpace("Baghdad")

	game.active = CP
	game.state = "play_card"
	game.jihad = 3
	game.jihad_cities_flipped = []
	game.jihad_city_effective_owner[baghdad] = AP
	game.control[baghdad] = AP

	Engine.set_control(game, baghdad, CP)

	expect(game.jihad).toBe(4)
	expect(game.state).toBe("jihad_placement")
	expect(game.state_stack.at(-1)).toEqual({ state: "play_card", active: CP })

	game = rules.action(game, CP_ROLE, "done")
	expect(game.state).toBe("play_card")
	expect(game.state_stack).toEqual([])

	game.active = AP
	Engine.set_control(game, baghdad, AP)

	expect(game.jihad).toBe(3)
	expect(game.state).toBe("play_card")
	expect(game.state_stack).toEqual([])
	expect(game.jihad_city_effective_owner[baghdad]).toBe(AP)
})

test("Jihad placement from German Intrigues resumes to the event placement state", () => {
	let game = setupGame(2026051205, "Historical", { no_supply_warnings: true })
	let baghdad = findSpace("Baghdad")
	let card = 78

	game.active = CP
	game.state = "play_card"
	game.control[baghdad] = CP
	game.jihad = 0
	game.tribes_to_place = 0
	if (!game.hand_cp.includes(card)) game.hand_cp.push(card)

	game = rules.action(game, CP_ROLE, "play_event", card)

	expect(game.jihad).toBe(1)
	expect(game.tribes_to_place).toBe(1)
	expect(game.state).toBe("jihad_placement")
	expect(game.state_stack.at(-1)).toEqual({
		state: "event_german_intrigues_persia_unit",
		active: CP
	})
	expect(rules.view(game, CP_ROLE).actions.undo).toBe(1)

	let undone = rules.action(JSON.parse(JSON.stringify(game)), CP_ROLE, "undo")
	expect(undone.state).toBe("play_card")
	expect(undone.active).toBe(CP)
	expect(undone.jihad).toBe(0)

	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).toBe("event_german_intrigues_persia_unit")
	expect(game.active).toBe(CP)
})

test("PE Uprising placed on Qum interrupts for Jihad placement then resumes German Intrigues markers", () => {
	let game = setupGame(2026052001, "Historical", { no_supply_warnings: true })
	let baghdad = findSpace("Baghdad")
	let qum = findSpace("Qum")
	let peUprising = findCpPiece("PE Uprising")
	let card = 78

	game.active = CP
	game.state = "play_card"
	game.control[baghdad] = CP
	game.jihad = 0
	game.tribes_to_place = 0
	if (!game.hand_cp.includes(card)) game.hand_cp.push(card)

	game = rules.action(game, CP_ROLE, "play_event", card)
	game = rules.action(game, CP_ROLE, "done")
	game = rules.action(game, CP_ROLE, "space", qum)

	expect(game.pieces[peUprising]).toBe(qum)
	expect(game.jihad).toBe(2)
	expect(game.tribes_to_place).toBe(1)
	expect(game.state).toBe("jihad_placement")
	expect(game.state_stack.at(-1)).toEqual({
		state: "event_german_intrigues_persia_markers",
		active: CP
	})
	expect(game.jihad_city_scoring_owner[qum]).toBe(CP)
	expect(Engine.map.get_space_controller(game, qum)).toBe("neutral")

	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).toBe("event_german_intrigues_persia_markers")
	expect(game.active).toBe(CP)
})
