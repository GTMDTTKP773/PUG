const rules = require("../rules.js")
const data = require("../data.js")
const Engine = require("../modules/engine.js")

function findPieceByName(name) {
	let piece = data.pieces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (piece < 0) throw new Error(`Missing piece: ${name}`)
	return piece
}

function findSpaceByName(name) {
	let space = data.spaces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (space < 0) throw new Error(`Missing space: ${name}`)
	return space
}

test("Pasha 1 logs LCU fire table with three Turkish elite SCUs", () => {
	let game = rules.setup(20260602, "Historical", { seed: 42, no_supply_warnings: true })
	let origin = findSpaceByName("Bayburt")
	let target = findSpaceByName("Oltu")
	let attackers = ["TU Elite DIV #1", "TU Elite DIV #2", "TU Elite DIV #3"].map(findPieceByName)
	let defender = findPieceByName("RU DIV #3")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = origin
	game.pieces[defender] = target
	game.control[origin] = rules.CP
	game.control[target] = rules.AP
	game.active = rules.CP
	game.state = "resolve_battle"
	game.seed = 7
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.combat_cards = { attacker: [Engine.combat.CC_CP_PASHA_1], defender: [] }
	game.combat_cards_effected = []
	game.combat_card_sources = {}
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.attack = {
		space: target,
		pieces: attackers,
		attacker: rules.CP,
		defender: rules.AP,
		origin_by_piece: Object.fromEntries(attackers.map((p) => [p, origin])),
		initial_attackers: attackers.slice(),
		initial_defenders: [defender]
	}

	let logs = []
	Engine.combat.resolve_battle_sequence(game, {
		log: (msg) => logs.push(msg),
		check_mo_fulfillment: () => {},
		get_season: () => "Spring",
		reduce_piece: (p) => {
			if (!game.reduced.includes(p)) game.reduced.push(p)
		}
	})

	expect(logs).toEqual([
		"  帕夏一号：进攻方使用 LCU 火力表",
		"**火力列位移：**",
		">> 进攻方：-1 山地",
		">> 防守方：无",
		"**进攻方开火 (6 CF)：**",
		"> B6 × 5 (LCU) = 5",
		"**防守方开火 (2 CF)：**",
		"> W6 × 2 (SCU) = 2",
		"*5:2 进攻方获胜"
	])
	expect(game.battle_result.att_roll).toBe(6)
	expect(game.battle_result.def_roll).toBe(6)
	expect(game.battle_result.att_cf).toBe(6)
	expect(game.battle_result.def_cf).toBe(2)
	expect(game.battle_result.att_table_type).toBe("lcu")
	expect(game.battle_result.def_table_type).toBe("scu")
	expect(game.battle_result.att_shifts).toBe(-1)
	expect(game.battle_result.def_shifts).toBe(0)
	expect(game.battle_result.attacker_losses).toBe(2)
	expect(game.battle_result.defender_losses).toBe(5)
	expect(game.combat_cards_effected).toContain(Engine.combat.CC_CP_PASHA_1)
})
