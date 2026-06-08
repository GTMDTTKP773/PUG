const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPieceByName, clearBoard } = require("./helpers.js")

const AP = rules.AP
const CP = rules.CP
const AP_ROLE = rules.roles[0]

function createMarchGame({ sourceSpace = "Amara", amaraControl = AP } = {}) {
	let game = setupGame(260608, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let basra = findSpace("Basra")
	let qurna = findSpace("Qurna")
	let amara = findSpace("Amara")
	let ahwaz = findSpace("Ahwaz")
	let br1 = findPieceByName("BR DIV #1")
	let br2 = findPieceByName("BR DIV #2")
	let tu = findPieceByName("TU DIV #8")
	let card = Engine.combat.CC_AP_MARCH_AND_COUNTERMARCH

	game.pieces[br1] = basra
	game.pieces[br2] = sourceSpace === "Amara" ? amara : ahwaz
	game.pieces[tu] = qurna
	game.control[basra] = AP
	game.control[qurna] = CP
	game.control[amara] = sourceSpace === "Ahwaz" ? amaraControl : AP
	game.control[ahwaz] = AP
	game.reduced = []
	game.retreated = []
	game.events = { allenby: game.turn }
	game.attacked = []
	game.moved = []
	game.activated = { move: [], attack: [basra], attack_egypt: [] }
	game.active = AP
	game.state = "play_cc_attacker"
	game.attack = {
		space: qurna,
		pieces: [br1],
		attacker: AP,
		defender: CP,
		origin_by_piece: { [br1]: basra }
	}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.hand_ap = [card]
	game.discard_ap = []
	game.removed_ap = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}

	return { game, basra, qurna, amara, ahwaz, br1, br2, tu, card }
}

function createMarchDefenseGame() {
	let setup = createMarchGame()
	let { game, basra, qurna, amara, br1, br2, tu } = setup

	game.state = "play_cc_defender"
	game.active = AP
	game.pieces[br1] = qurna
	game.pieces[tu] = basra
	game.control[basra] = CP
	game.control[qurna] = AP
	game.attack = {
		space: qurna,
		pieces: [tu],
		attacker: CP,
		defender: AP,
		origin_by_piece: { [tu]: basra }
	}
	game.activated = { move: [], attack: [basra], attack_egypt: [] }

	return { ...setup, game, basra, qurna, amara, br1, br2, tu }
}

function createMarchRegionGame() {
	let game = setupGame(260609, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let basra = findSpace("Basra")
	let cyprus = findSpace("Cyprus")
	let toHaifa = findSpace("To Haifa")
	let brAttack = findPieceByName("BR DIV #1")
	let brActivated = findPieceByName("BR DIV #2")
	let brEligible = findPieceByName("BR DIV #3")
	let tu = findPieceByName("TU DIV #8")
	let card = Engine.combat.CC_AP_MARCH_AND_COUNTERMARCH

	game.pieces[brAttack] = basra
	game.pieces[brActivated] = cyprus
	game.pieces[brEligible] = cyprus
	game.pieces[tu] = toHaifa
	game.control[basra] = AP
	game.control[cyprus] = AP
	game.control[toHaifa] = CP
	game.reduced = []
	game.retreated = []
	game.events = { allenby: game.turn }
	game.attacked = []
	game.moved = []
	game.activated = { move: [], attack: [basra], attack_egypt: [] }
	game.active = AP
	game.state = "play_cc_attacker"
	game.attack = {
		space: toHaifa,
		pieces: [brAttack],
		attacker: AP,
		defender: CP,
		origin_by_piece: { [brAttack]: basra }
	}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.hand_ap = [card]
	game.discard_ap = []
	game.removed_ap = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.region_activations = {
		move: {},
		attack: {
			[cyprus]: [{ pieces: [brActivated].sort((a, b) => a - b), cost: 1 }]
		}
	}

	return { game, basra, cyprus, toHaifa, brAttack, brActivated, brEligible, tu, card }
}

test("March and Countermarch is playable only for an unactivated BR unit with a legal AP-controlled path", () => {
	let { game, br2, qurna, card, basra } = createMarchGame()

	expect(Engine.combat_cards.can_play_march_and_countermarch(game)).toBe(true)
	expect(Engine.combat_cards.get_march_and_countermarch_piece_options(game)).toEqual([br2])
	expect(Engine.combat_cards.get_march_and_countermarch_move_options(game, br2, 2)).toEqual([qurna])
	expect(rules.view(game, AP_ROLE).actions.play_cc || []).toContain(card)

	game.pieces[br2] = basra
	expect(Engine.combat_cards.can_play_march_and_countermarch(game)).toBe(false)
	expect(Engine.combat_cards.get_march_and_countermarch_piece_options(game)).toEqual([])

	let blocked = createMarchGame({ sourceSpace: "Ahwaz", amaraControl: CP }).game
	expect(Engine.combat_cards.can_play_march_and_countermarch(blocked)).toBe(false)
	expect(Engine.combat_cards.get_march_and_countermarch_piece_options(blocked)).toEqual([])
})

test("March and Countermarch can also be played by AP while defending", () => {
	let { game, br2, qurna, card, basra, tu } = createMarchDefenseGame()

	expect(Engine.combat_cards.can_play_march_and_countermarch(game)).toBe(true)
	expect(rules.view(game, AP_ROLE).actions.play_cc || []).toContain(card)

	game = rules.action(game, AP_ROLE, "play_cc", card)
	game = rules.action(game, AP_ROLE, "confirm")

	expect(game.state).toBe("march_and_countermarch_select")
	expect(game.combat_cards.defender).toContain(card)
	expect(rules.view(game, AP_ROLE).actions.piece || []).toContain(br2)

	game = rules.action(game, AP_ROLE, "piece", br2)
	game = rules.action(game, AP_ROLE, "space", qurna)

	expect(game.state).toBe("play_cc_defender")
	expect(game.pieces[br2]).toBe(qurna)
	expect(game.attack.pieces).toEqual([tu])
	expect(game.attack.origin_by_piece[br2]).toBeUndefined()
	expect(game.combat_cards.defender).toContain(card)
	expect(game.control[basra]).toBe(CP)
})

test("March and Countermarch moves the selected unit into battle and preserves its origin", () => {
	let { game, br2, amara, qurna, card } = createMarchGame()

	game = rules.action(game, AP_ROLE, "play_cc", card)
	game = rules.action(game, AP_ROLE, "confirm")

	expect(game.state).toBe("march_and_countermarch_select")
	expect(game.combat_cards.attacker).toContain(card)
	expect(game.combat_cards_effected).toContain(card)
	expect(rules.view(game, AP_ROLE).actions.piece || []).toContain(br2)

	game = rules.action(game, AP_ROLE, "piece", br2)
	expect(rules.view(game, AP_ROLE).actions.space || []).toContain(qurna)

	game = rules.action(game, AP_ROLE, "space", qurna)

	expect(game.state).toBe("play_cc_attacker")
	expect(game.pieces[br2]).toBe(qurna)
	expect(game.attack.pieces).toContain(br2)
	expect(game.attack.origin_by_piece[br2]).toBe(amara)
	expect(game.attack.march_and_countermarch_pieces).toContain(br2)
	expect(game.attacked).toContain(br2)
})

test("March and Countermarch keeps region or island-base activation at unit scope", () => {
	let { game, brEligible, brActivated, toHaifa, card } = createMarchRegionGame()

	expect(Engine.combat_cards.can_play_march_and_countermarch(game)).toBe(true)
	expect(Engine.combat_cards.get_march_and_countermarch_piece_options(game)).toEqual([brEligible])
	expect(Engine.combat_cards.get_march_and_countermarch_move_options(game, brEligible, 2)).toEqual([toHaifa])
	expect(rules.view(game, AP_ROLE).actions.play_cc || []).toContain(card)
	expect(Engine.combat_cards.get_march_and_countermarch_piece_options(game)).not.toContain(brActivated)
})

test("March and Countermarch cancel rolls back after an intermediate move", () => {
	let { game, br2, ahwaz, amara, card } = createMarchGame({ sourceSpace: "Ahwaz", amaraControl: AP })

	game = rules.action(game, AP_ROLE, "play_cc", card)
	game = rules.action(game, AP_ROLE, "confirm")
	game = rules.action(game, AP_ROLE, "piece", br2)
	expect(rules.view(game, AP_ROLE).actions.space || []).toContain(amara)

	game = rules.action(game, AP_ROLE, "space", amara)
	expect(game.state).toBe("march_and_countermarch_move")
	expect(game.pieces[br2]).toBe(amara)

	game = rules.action(game, AP_ROLE, "cancel")

	expect(game.state).toBe("play_cc_attacker")
	expect(game.pieces[br2]).toBe(ahwaz)
	expect(game.combat_cards.attacker).toEqual([])
	expect(game.hand_ap).toContain(card)
	expect(game.march_and_countermarch).toBeUndefined()
})

test("March and Countermarch adds exactly one attacker DRM after the unit joins battle", () => {
	let { game, br2, qurna, card } = createMarchGame()

	game = rules.action(game, AP_ROLE, "play_cc", card)
	game = rules.action(game, AP_ROLE, "confirm")
	game = rules.action(game, AP_ROLE, "piece", br2)
	game = rules.action(game, AP_ROLE, "space", qurna)

	game.combat_cards = { attacker: [card], defender: [] }
	game.combat_cards_effected = [card]
	game.hand_ap = []
	game.discard_ap = [card]
	game.removed_ap = []
	game.action_state = {}

	Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(game.battle_result.att_drm).toBe(1)
})

test("March and Countermarch adds exactly one defender DRM when AP uses it while defending", () => {
	let { game, br2, qurna, card } = createMarchDefenseGame()

	game = rules.action(game, AP_ROLE, "play_cc", card)
	game = rules.action(game, AP_ROLE, "confirm")
	game = rules.action(game, AP_ROLE, "piece", br2)
	game = rules.action(game, AP_ROLE, "space", qurna)

	game.active = CP
	game.combat_cards = { attacker: [findPieceByName("TU DIV #8")], defender: [card] }
	game.combat_cards_effected = [card]
	game.hand_ap = []
	game.discard_ap = [card]
	game.removed_ap = []
	game.action_state = {}

	Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(game.battle_result.def_drm).toBe(1)
})
