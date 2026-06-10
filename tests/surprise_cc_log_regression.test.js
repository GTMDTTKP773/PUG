const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPieceByName: findPiece, clearBoard } = require("./helpers.js")

const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]
const SURPRISE = Engine.combat.CC_CP_SURPRISE

function createSurpriseCcGame() {
	let game = setupGame(2026061001, "Historical", { no_supply_warnings: true })
	let abadan = findSpace("Abadan")
	let basra = findSpace("Basra")
	let haifa = findSpace("Haifa")
	let suez = findSpace("Suez")
	let attacker = findPiece("BR DIV #1")
	let defender = findPiece("TU DIV #8")
	let reinforcement = findPiece("TU DIV #1")

	clearBoard(game)
	game.pieces[attacker] = abadan
	game.pieces[defender] = basra
	game.pieces[reinforcement] = haifa
	game.control[basra] = rules.CP
	game.control[haifa] = rules.CP
	game.control[suez] = rules.CP
	game.active = rules.AP
	game.state = "play_cc_attacker"
	game.hand_ap = []
	game.hand_cp = [SURPRISE]
	game.discard_cp = []
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.attack = {
		space: basra,
		pieces: [attacker],
		attacker: rules.AP,
		defender: rules.CP
	}

	return { game, basra, haifa, reinforcement }
}

function createMedinaSurpriseGameWithoutSrCandidate() {
	let game = setupGame(2026061002, "Historical", { no_supply_warnings: true })
	let medina = findSpace("Medina")
	let yenbo = findSpace("Yenbo")
	let attacker = findPiece("Arab Revolt #1")
	let defender = findPiece("TU DIV #8")

	clearBoard(game)
	game.pieces[attacker] = yenbo
	game.pieces[defender] = medina
	game.control[medina] = rules.CP
	game.active = rules.CP
	game.state = "play_cc_defender"
	game.hand_cp = [SURPRISE]
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.attack = {
		space: medina,
		pieces: [attacker],
		attacker: rules.AP,
		defender: rules.CP
	}

	return game
}

test("Surprise is unavailable when no TU/TU-A SCU can SR into the defender space", () => {
	let game = createMedinaSurpriseGameWithoutSrCandidate()

	expect(Engine.combat_cards.get_surprise_sr_piece_options(game)).toEqual([])
	expect(Engine.combat_cards.can_play_surprise(game)).toBe(false)
	expect(rules.view(game, CP_ROLE).actions.play_cc || []).not.toContain(SURPRISE)
})

test("Surprise returns to the defender CC window and logs its combat card summary", () => {
	let { game, basra, haifa, reinforcement } = createSurpriseCcGame()

	game = rules.action(game, AP_ROLE, "done")
	expect(game.state).toBe("play_cc_defender")
	expect(rules.view(game, CP_ROLE).actions.play_cc || []).toContain(SURPRISE)

	game = rules.action(game, CP_ROLE, "play_cc", SURPRISE)
	game = rules.action(game, CP_ROLE, "confirm")
	expect(game.state).toBe("surprise_sr")
	expect(rules.view(game, CP_ROLE).actions.piece || []).toContain(reinforcement)

	game = rules.action(game, CP_ROLE, "piece", reinforcement)
	expect(game.pieces[reinforcement]).toBe(basra)
	expect(game.log).toContain(`惊喜：P${reinforcement} 战略调整：s${haifa} → s${basra}`)
	expect(game.state).toBe("surprise_sr")

	game = rules.action(game, CP_ROLE, "done")
	expect(game.state).toBe("play_cc_defender")

	game = rules.action(game, CP_ROLE, "done")
	expect(game.log).toContain(`>> 防守方：c${SURPRISE}`)
})
