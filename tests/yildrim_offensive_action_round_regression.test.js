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

function createYildrimBattleGame() {
	let game = rules.setup(2026060302, "Historical", { seed: 17, no_supply_warnings: true })
	let origin = findSpaceByName("Nekhi")
	let target = findSpaceByName("Suez")
	let yildrim = findPieceByName("GE Yildrim #1")
	let turkish = findPieceByName("TU DIV #8")
	let defender = findPieceByName("IN DIV #2")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[yildrim] = origin
	game.pieces[turkish] = origin
	game.pieces[defender] = target
	game.control[origin] = rules.CP
	game.control[target] = rules.AP
	game.active = rules.CP
	game.state = "resolve_battle"
	game.seed = 9
	game.action_round = 3
	game.reduced = []
	game.retreated = []
	game.events = {}
	Engine.combat.set_yildrim_offensive_active(game)
	Engine.game_utils.set_trench_level(game, target, 1, rules.AP)
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.attack = {
		space: target,
		pieces: [yildrim, turkish],
		attacker: rules.CP,
		defender: rules.AP,
		origin_by_piece: { [yildrim]: origin, [turkish]: origin },
		initial_attackers: [yildrim, turkish],
		initial_defenders: [defender]
	}

	return { game, target, attackers: [yildrim, turkish] }
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

test("Yildrim Offensive event records the current action round", () => {
	let game = rules.setup(2026060301, "Historical", { seed: 17, no_supply_warnings: true })
	game.events = {}
	game.action_round = 4

	Engine.events.get_event_by_id(109).handler(game)

	expect(game.events.yildrim_offensive).toEqual({ turn: game.turn, action_round: 4 })
})

test("Yildrim Offensive trench negate is optional and consumed once per action round", () => {
	let { game, target, attackers } = createYildrimBattleGame()
	game.state = "yildrim_offensive_negate"

	expect(Engine.combat.can_offer_yildrim_offensive_trench_negate(game, attackers, target)).toBe(true)
	let view = rules.view(game, CP_ROLE)
	expect(view.actions.negate).toBe(1)
	expect(view.actions.decline).toBe(1)

	game = rules.action(game, CP_ROLE, "decline")
	expect(game.attack.yildrim_offensive_trench_negate).toBe(false)
	expect(game.events.yildrim_trench_used).toBeUndefined()

	game.attack.yildrim_offensive_trench_negate = undefined
	game.state = "yildrim_offensive_negate"
	expect(Engine.combat.can_offer_yildrim_offensive_trench_negate(game, attackers, target)).toBe(true)
	game = rules.action(game, CP_ROLE, "negate")
	expect(game.attack.yildrim_offensive_trench_negate).toBe(true)
	expect(game.events.yildrim_trench_used).toEqual({ turn: game.turn, action_round: game.action_round })

	game.attack = { ...game.attack, yildrim_offensive_trench_negate: undefined }
	game.state = "yildrim_offensive_negate"
	expect(Engine.combat.can_offer_yildrim_offensive_trench_negate(game, attackers, target)).toBe(false)
})

test("Yildrim Offensive DRM remains available after trench negate is used in the same action round", () => {
	let { game } = createYildrimBattleGame()
	game.events.yildrim_trench_used = { turn: game.turn, action_round: game.action_round }

	let logs = resolveBattle(game)

	expect(logs).toContain("  耶尔德里姆攻势：TU/TU-A攻击+1 DRM")
	expect(logs).not.toContain("  耶尔德里姆攻势：取消战壕")
	expect(game.battle_result.att_drm).toBe(1)
})

test("Yildrim Offensive expires outside the action round it was played", () => {
	let { game, target, attackers } = createYildrimBattleGame()
	game.action_round += 1

	expect(Engine.combat.is_yildrim_offensive_active(game)).toBe(false)
	expect(Engine.combat.can_offer_yildrim_offensive_trench_negate(game, attackers, target)).toBe(false)
})

test("Yildrim Offensive chosen negate cancels trench during combat resolution", () => {
	let { game } = createYildrimBattleGame()
	game.attack.yildrim_offensive_trench_negate = true

	let logs = resolveBattle(game)

	expect(logs).toContain("  耶尔德里姆攻势：取消战壕")
	expect(logs).toContain("  耶尔德里姆攻势：TU/TU-A攻击+1 DRM")
	expect(game.battle_result.att_drm).toBe(1)
	expect(logs.find((line) => line.startsWith(">> 进攻方："))).not.toContain("战壕")
})
