const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPieceByName, clearBoard } = require("./helpers.js")

const AP_ROLE = rules.roles[0]

function createEmptyTargetAttack() {
	const game = setupGame(26053002, "Historical", { no_supply_warnings: true })
	const fao = findSpace("Fao")
	const basra = findSpace("Basra")
	const attacker = findPieceByName("IN 15th DIV")

	clearBoard(game)
	game.turn = 4
	game.action_round = 1
	game.active = rules.AP
	game.events = {}
	game.reduced = []
	game.attacked = []
	game.attacked_spaces = []
	game.pieces[attacker] = fao
	game.attack = {
		space: basra,
		pieces: [attacker],
		attacker: rules.AP,
		defender: rules.CP
	}

	return { game, attacker, fao, basra }
}

test("battle with no remaining defenders or fort cancels before combat dice", () => {
	const { game, attacker } = createEmptyTargetAttack()
	const logs = []
	const seed = game.seed

	const outcome = Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.battle_result.pre_battle_cancel).toBe(true)
	expect(game.seed).toBe(seed)
	expect(game.attacked).not.toContain(attacker)
	expect(logs.join("\n")).toContain("Battle cancelled")
})

test("battle with no surviving attackers cancels before combat dice", () => {
	const { game, attacker, basra } = createEmptyTargetAttack()
	const defender = findPieceByName("TU DIV #10")
	const logs = []
	const seed = game.seed

	game.pieces[attacker] = 0
	game.pieces[defender] = basra

	const outcome = Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.battle_result.pre_battle_cancel).toBe(true)
	expect(game.seed).toBe(seed)
	expect(game.attacked).not.toContain(attacker)
	expect(logs.join("\n")).toContain("Battle cancelled")
})

test("Enver Goes East skips a queued attack whose target was emptied before resolution", () => {
	let game = setupGame(26053003, "Historical", { no_supply_warnings: true })
	const fao = findSpace("Fao")
	const basra = findSpace("Basra")
	const attacker = findPieceByName("TU DIV #10")
	const seed = game.seed

	clearBoard(game)
	game.turn = 4
	game.action_round = 1
	game.active = rules.AP
	game.state = "event_enver_goes_east_resolve_next_attack"
	game.events = {
		enver_goes_east: {
			enver_queue: [{ from: fao, to: basra, pieces: [attacker] }]
		}
	}
	game.reduced = []
	game.attacked = []
	game.attacked_spaces = []
	game.pieces[attacker] = fao
	game.attack = null

	game = rules.action(game, AP_ROLE, "next")

	expect(game.state).toBe("event_enver_goes_east_resolve_next_attack")
	expect(game.active).toBe(AP_ROLE)
	expect(game.events.enver_goes_east.enver_queue).toEqual([])
	expect(game.attack).toBeNull()
	expect(game.reduced).not.toContain(attacker)
	expect(game.attacked).not.toContain(attacker)
	expect(game.seed).toBe(seed)
})
