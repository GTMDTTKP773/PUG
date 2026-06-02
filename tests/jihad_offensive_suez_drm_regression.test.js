const rules = require("../rules.js")
const data = require("../data.js")
const Engine = require("../modules/engine.js")

const CP_ROLE = rules.roles[1]

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

function createSuezJihadBattleGame() {
	let game = rules.setup(20260603, "Historical", { seed: 42, no_supply_warnings: true })
	let origin = findSpaceByName("Nekhi")
	let target = findSpaceByName("Suez")
	let attackers = ["TU-A DIV #7", "TU-A DIV #8"].map(findPieceByName)
	let defender = findPieceByName("IN DIV #2")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = origin
	game.pieces[defender] = target
	game.control[origin] = rules.CP
	game.control[target] = rules.AP
	game.active = rules.CP
	game.state = "resolve_battle"
	game.seed = 7
	game.jihad = 8
	game.action_round = 2
	game.reduced = []
	game.retreated = []
	game.events = {}
	Engine.combat.set_jihad_offensive_active(game)
	game.combat_cards = { attacker: [Engine.combat.CC_CP_JIHAD_OFFENSIVE], defender: [] }
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

	return { game, origin, target, attackers, defender }
}

function resolveBattle(game) {
	let logs = []
	Engine.combat.resolve_battle_sequence(game, {
		log: (msg) => logs.push(msg),
		check_mo_fulfillment: () => {},
		get_season: () => "Spring",
		reduce_piece: (p) => {
			if (!game.reduced.includes(p)) game.reduced.push(p)
		}
	})
	return logs
}

test("Jihad Offensive combat card gives only one DRM in the Suez battle", () => {
	let { game } = createSuezJihadBattleGame()
	game.attack.jihad_offensive_negate = true

	let logs = resolveBattle(game)

	expect(logs).toEqual([
		"  圣战进攻：本次战斗忽略战壕和河流惩罚。",
		"  圣战攻势CC：TU/TU-A攻击+1 DRM",
		"**火力列位移：**",
		">> 进攻方：-1 沙漠",
		">> 防守方：无",
		"**进攻方开火 (2 CF)：**",
		"> B6 + 1 = 6  × 1 (SCU) = 2",
		"**防守方开火 (1 CF)：**",
		"> W6 × 1 (SCU) = 2",
		"*2:2 平局"
	])
	expect(game.battle_result.att_drm).toBe(1)
	expect(game.battle_result.att_roll).toBe(6)
	expect(game.battle_result.att_final_roll).toBe(6)
	expect(game.battle_result.att_shifts).toBe(-1)
	expect(game.battle_result.defender_losses).toBe(2)
	expect(game.battle_result.attacker_losses).toBe(2)
	expect(game.combat_cards_effected).toContain(Engine.combat.CC_CP_JIHAD_OFFENSIVE)
})

test("Jihad Offensive negate prompt is optional and consumed once per action round", () => {
	let { game, target, attackers } = createSuezJihadBattleGame()
	game.state = "jihad_offensive_negate"
	game.combat_cards = { attacker: [], defender: [] }

	expect(Engine.combat.can_offer_jihad_offensive_negate(game, attackers, target)).toBe(true)
	let view = rules.view(game, CP_ROLE)
	expect(view.actions.negate).toBe(1)
	expect(view.actions.decline).toBe(1)

	game = rules.action(game, CP_ROLE, "decline")
	expect(game.attack.jihad_offensive_negate).toBe(false)
	expect(game.events.jihad_offensive_used).toBeUndefined()

	game.attack.jihad_offensive_negate = undefined
	game.state = "jihad_offensive_negate"
	expect(Engine.combat.can_offer_jihad_offensive_negate(game, attackers, target)).toBe(true)
	game = rules.action(game, CP_ROLE, "negate")
	expect(game.attack.jihad_offensive_negate).toBe(true)
	expect(game.events.jihad_offensive_used).toEqual({ turn: game.turn, action_round: game.action_round })

	game.attack = { ...game.attack, jihad_offensive_negate: undefined }
	game.state = "jihad_offensive_negate"
	expect(Engine.combat.can_offer_jihad_offensive_negate(game, attackers, target)).toBe(false)
})

test("Jihad Offensive event DRM remains available after negate is used in the same action round", () => {
	let { game } = createSuezJihadBattleGame()
	game.combat_cards = { attacker: [], defender: [] }
	game.events.jihad_offensive_used = { turn: game.turn, action_round: game.action_round }

	let logs = resolveBattle(game)

	expect(logs).toContain("  圣战攻势：TU/TU-A攻击+1 DRM")
	expect(logs).not.toContain("  圣战进攻：本次战斗忽略战壕和河流惩罚。")
	expect(game.battle_result.att_drm).toBe(1)
})
