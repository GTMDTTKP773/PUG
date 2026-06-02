const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { setupGame, findSpace, findPieceByName, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function createMenjilPostRollLossGame() {
	const game = setupGame(260525, "Historical", { no_supply_warnings: true })
	const enzeli = findSpace("Enzeli")
	const menjil = findSpace("Menjil")
	const attackers = [
		findPieceByName("RU Baratov HQ"),
		findPieceByName("RU Cavalry #6"),
		findPieceByName("RU Cavalry #8"),
		findPieceByName("RU DIV #14")
	]
	const jangali = findPieceByName("Jangali")

	clearBoard(game)
	for (let p of attackers) game.pieces[p] = enzeli
	game.pieces[jangali] = menjil
	game.control[enzeli] = AP
	game.control[menjil] = CP

	game.active = CP
	game.state = "post_roll_cc_defender"
	game.events = {}
	game.reduced = [jangali]
	game.retreated = []
	game.attacked = []
	game.hand_cp = []
	game.discard_cp = []
	game.removed_cp = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [Engine.combat.CC_CP_JAFAR_PASHA] }
	game.combat_cards_effected = [Engine.combat.CC_CP_JAFAR_PASHA]
	game.attack = {
		space: menjil,
		pieces: attackers,
		attacker: AP,
		defender: CP,
		origin_by_piece: Object.fromEntries(attackers.map((p) => [p, enzeli])),
		initial_attackers: attackers.slice(),
		initial_defenders: [jangali],
		defender_losses: 3,
		defender_losses_absorbed: 3,
		attacker_losses: 1,
		attacker_losses_absorbed: 0
	}
	game.battle_result = {
		attacker_losses: 1,
		defender_losses: 3,
		retreat_needed: true,
		retreating_faction: CP,
		retreating_units: [jangali],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		catastrophic_attack: false,
		turkish_retreat: false,
		turkish_retreat_units: [],
		turkish_retreat_optional_units: [],
		turkish_retreat_defender_retreats: false,
		attackers: attackers.slice(),
		defenders: [jangali],
		advance_with_reduced: false
	}

	return { game, attackers }
}

test("Jafar Pasha post-roll reroll applies newly introduced attacker losses before retreat", () => {
	const { game, attackers } = createMenjilPostRollLossGame()

	const next = rules.action(game, CP_ROLE, "done")

	expect(next.state).toBe("apply_attacker_losses")
	expect(next.active).toBe(AP)
	expect(next.attack.attacker_losses).toBe(1)
	expect(next.attack.attacker_losses_absorbed).toBe(0)
	expect(rules.view(next, AP_ROLE).actions.piece || []).toContain(attackers[3])
})

test("AP retained Jafar Pasha is removed after one use even if legacy after-use metadata is missing", () => {
	const game = setupGame(260525, "Historical", { no_supply_warnings: true })
	const beersheba = findSpace("Beersheba")
	const gaza = findSpace("Gaza")
	const attacker = findPieceByName("TU DIV #8")
	const defender = findPieceByName("BR DIV #1")
	const jafar = Engine.combat.CC_CP_JAFAR_PASHA

	clearBoard(game)
	game.pieces[attacker] = beersheba
	game.pieces[defender] = gaza
	game.control[beersheba] = CP
	game.control[gaza] = AP

	game.active = AP
	game.state = "play_cc_defender"
	game.events = {}
	game.reduced = []
	game.retreated = []
	game.attacked = []
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = []
	game.hand_cp = []
	game.discard_cp = []
	game.removed_cp = []
	game.cc_retained = { ap: [jafar], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.attack = {
		space: gaza,
		pieces: [attacker],
		attacker: CP,
		defender: AP,
		origin_by_piece: { [attacker]: beersheba },
		initial_attackers: [attacker],
		initial_defenders: [defender]
	}

	let next = rules.action(game, AP_ROLE, "play_cc", jafar)
	expect(next.state).toBe("confirm_cc")

	next = rules.action(next, AP_ROLE, "confirm")
	expect(next.state).toBe("choose_jafar_pasha")
	expect(next.cc_retained.ap).not.toContain(jafar)
	expect(next.removed_ap).toEqual([])

	next = rules.action(next, AP_ROLE, "retreat")
	expect(next.state).toBe("jafar_pasha_retreat")

	next = rules.action(next, AP_ROLE, "piece", defender)
	let retreatSpaces = rules.view(next, AP_ROLE).actions.space || []
	expect(retreatSpaces.length).toBeGreaterThan(0)

	next = rules.action(next, AP_ROLE, "space", retreatSpaces[0])
	expect(next.cc_retained.ap).not.toContain(jafar)
	expect(next.cc_retained_after_use.ap[jafar]).toBeUndefined()
	expect(next.removed_ap).toContain(jafar)
	expect(next.discard_cp).not.toContain(jafar)
	expect(next.cc_jafar_pasha_post_battle).toBeUndefined()
})

test("CP Jafar Pasha retreat is defender retreat and still fulfills attacker MO", () => {
	const game = setupGame(260525, "Historical", { no_supply_warnings: true })
	const gaza = findSpace("Gaza")
	const beersheba = findSpace("Beersheba")
	const attacker = findPieceByName("BR DIV #1")
	const defender = findPieceByName("TU DIV #8")
	const jafar = Engine.combat.CC_CP_JAFAR_PASHA

	clearBoard(game)
	game.pieces[attacker] = gaza
	game.pieces[defender] = beersheba
	game.control[gaza] = AP
	game.control[beersheba] = CP

	game.active = CP
	game.state = "play_cc_defender"
	game.events = {}
	game.reduced = []
	game.retreated = []
	game.attacked = []
	game.mo_ap = Engine.mo.MO_BRITISH
	game.mo_ap_fulfilled = false
	game.hand_cp = [jafar]
	game.discard_cp = []
	game.removed_cp = []
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.attack = {
		space: beersheba,
		pieces: [attacker],
		attacker: AP,
		defender: CP,
		origin_by_piece: { [attacker]: gaza },
		initial_attackers: [attacker],
		initial_defenders: [defender]
	}

	let next = rules.action(game, CP_ROLE, "play_cc", jafar)
	next = rules.action(next, CP_ROLE, "confirm")
	next = rules.action(next, CP_ROLE, "retreat")
	next = rules.action(next, CP_ROLE, "piece", defender)
	let retreatSpaces = rules.view(next, CP_ROLE).actions.space || []
	expect(retreatSpaces.length).toBeGreaterThan(0)

	next = rules.action(next, CP_ROLE, "space", retreatSpaces[0])

	expect(next.mo_ap_fulfilled).toBe(true)
	expect(next.battle_result.cancelled).toBeUndefined()
	expect(next.battle_result.jafar_pasha_retreat).toBe(true)
	expect(next.log.join("\n")).toContain("贾法尔帕夏：防守方撤退，战斗不进行。")
	expect(next.log.join("\n")).not.toContain("战斗取消。")
})

test("CP Jafar Pasha retreat from a fort makes the attacker attack the fort before normal advance", () => {
	const game = setupGame(260526, "Historical", { no_supply_warnings: true })
	const adrianople = findSpace("Adrianople")
	const philippopoli = findSpace("Philippopoli")
	const xanthi = findSpace("Xanthi")
	const attackers = [
		findPieceByName("BR IX Corps"),
		findPieceByName("BR VIII Corps"),
		findPieceByName("BR XII Corps")
	]
	const defender = findPieceByName("TU DIV #8")
	const jafar = Engine.combat.CC_CP_JAFAR_PASHA

	clearBoard(game)
	game.forts = { destroyed: [], besieged: [], owner: {} }
	game.trenches = []
	game.trenches_2 = []
	game.trench_owner = []
	game.pieces[attackers[0]] = philippopoli
	game.pieces[attackers[1]] = xanthi
	game.pieces[attackers[2]] = philippopoli
	game.pieces[defender] = adrianople
	game.control[philippopoli] = AP
	game.control[xanthi] = AP
	game.control[adrianople] = CP

	game.active = CP
	game.state = "play_cc_defender"
	game.events = {}
	game.reduced = []
	game.retreated = []
	game.attacked = []
	game.hand_cp = [jafar]
	game.discard_cp = []
	game.removed_cp = []
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.attack = {
		space: adrianople,
		pieces: attackers.slice(),
		attacker: AP,
		defender: CP,
		origin_by_piece: {
			[attackers[0]]: philippopoli,
			[attackers[1]]: xanthi,
			[attackers[2]]: philippopoli
		},
		initial_attackers: attackers.slice(),
		initial_defenders: [defender]
	}

	let next = rules.action(game, CP_ROLE, "play_cc", jafar)
	next = rules.action(next, CP_ROLE, "confirm")
	next = rules.action(next, CP_ROLE, "retreat")
	next = rules.action(next, CP_ROLE, "piece", defender)
	let retreatSpaces = rules.view(next, CP_ROLE).actions.space || []
	expect(retreatSpaces.length).toBeGreaterThan(0)

	next = rules.action(next, CP_ROLE, "space", retreatSpaces[0])
	if (next.state === "post_roll_cc_defender") next = rules.action(next, CP_ROLE, "done")

	expect(next.battle_result.cancelled).toBeUndefined()
	expect(next.battle_result.jafar_pasha_retreat).toBe(true)
	expect(next.battle_result.defenders).toEqual([])
	expect(next.attack.defender_losses).toBeGreaterThanOrEqual(3)
	expect(next.state).toBe("apply_defender_losses")
	expect(next.pieces[attackers[0]]).toBe(philippopoli)
	expect(next.pieces[attackers[1]]).toBe(xanthi)
	expect(next.pieces[attackers[2]]).toBe(philippopoli)
	expect(rules.view(next, CP_ROLE).actions.space || []).toContain(adrianople)
	expect(next.log.join("\n")).toContain("贾法尔帕夏：防守方撤退，进攻方继续攻击要塞。")
	expect(next.log.join("\n")).not.toContain("战斗不进行")

	for (let i = 0; i < 10 && (next.state === "apply_defender_losses" || next.state === "apply_attacker_losses"); i++) {
		let role = next.active === AP ? AP_ROLE : CP_ROLE
		let actions = rules.view(next, role).actions
		if (next.state === "apply_defender_losses" && (actions.space || []).includes(adrianople)) {
			next = rules.action(next, role, "space", adrianople)
		} else if ((actions.piece || []).length > 0) {
			next = rules.action(next, role, "piece", actions.piece[0])
		} else {
			next = rules.action(next, role, "done")
		}
	}

	expect(next.forts.destroyed).toContain(adrianople)
	expect(next.state).toBe("advance")
	expect(next.advance_space).toBe(adrianople)
	expect(next.advance_pieces.length).toBeGreaterThan(0)
	expect(next.jafar_pasha_advance_after_cancel).toBeUndefined()
})
