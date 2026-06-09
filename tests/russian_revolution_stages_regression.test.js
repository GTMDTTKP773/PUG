const data = require("../data.js")
const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const turnStates = require("../modules/states/states_turn.js")

const { setupGame, findSpace, findApPiece, findCpPiece, clearBoard } = require("./helpers.js")

const { AP, CP, REINFORCEMENTS } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function getTurnFuncs(game) {
	turnStates.set_globals(game)
	return turnStates.register({}, Engine, {
		log: () => {},
		find_space: Engine.game_utils.find_space,
		AP,
		CP
	})
}

function findCard(event) {
	let card = data.cards.findIndex((c) => c && c.event === event)
	if (card < 0) throw new Error(`Cannot find card: ${event}`)
	return card
}

test("俄国革命阶段 1：增加罗马尼亚 VP 并禁止 Gorlice-Tarnow 事件", () => {
	let game = setupGame(2026051201, "Historical", { no_supply_warnings: true })
	game.events = { parvus_to_berlin: 5 }
	game.russian_vp = 4
	game.turn = 9

	let vp = game.vp
	getTurnFuncs(game).check_russian_revolution_step()

	expect(game.events.russian_revolution).toBe(1)
	expect(game.events.romania_barred_by_russian_revolution).toBe(true)
	expect(game.vp).toBe(vp + 2)
	expect(Engine.events.can_play_event(game, findCard("GORLICE-TARNOW"))).toBe(false)
})

test("俄国革命阶段 2：翻面 RU 单位并从军团资产中移除 RU LCU", () => {
	let game = setupGame(2026051202, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events = { russian_revolution: 1, romania: true }
	game.reduced = []

	let tiflis = findSpace("TIFLIS")
	let cavalry = findApPiece("RU Cavalry #1")
	let army = findApPiece("RU 6 Army")
	game.pieces[cavalry] = tiflis
	game.pieces[army] = Engine.game_utils.get_lcu_reserve_box(AP)

	Engine.events.apply_russian_revolution_stage_effects(game, 2, { log: () => {} })

	expect(Engine.game_utils.is_piece_reduced(game, cavalry)).toBe(true)
	expect(Engine.game_utils.is_eliminated(game, army)).toBe(true)
})

test("新的 RU 单位在阶段 2 和 3 进入时处于翻面状态", () => {
	let game = setupGame(2026051203, "Historical", { no_supply_warnings: true })
	game.events = { russian_revolution: 2 }
	game.reduced = []

	let ruDiv = findApPiece("RU DIV #15")
	let odessa = findSpace("Odessa")
	game.pieces[ruDiv] = REINFORCEMENTS

	expect(Engine.events.reinforce(game, "RU DIV #15", AP, odessa)).toBe(true)
	expect(game.pieces[ruDiv]).toBe(odessa)
	expect(Engine.game_utils.is_piece_reduced(game, ruDiv)).toBe(true)
})

test("俄国革命阶段 3：在下一回合仅允许一次 RU 进攻", () => {
	let game = setupGame(2026051204, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let oltu = findSpace("Oltu")
	let bayburt = findSpace("Bayburt")
	let ruDiv = findApPiece("RU DIV #1")
	let tuDiv = findCpPiece("TU DIV #8")
	game.pieces[ruDiv] = oltu
	game.pieces[tuDiv] = bayburt
	Engine.set_control(game, oltu, AP)
	Engine.set_control(game, bayburt, CP)
	game.active = AP
	game.turn = 10
	game.events = { russian_revolution: 3 }
	game.russian_revolution_limited_attack_turn = 10
	game.russian_revolution_ru_attack_used = false
	game.attacked_spaces = []
	game.retreated = []

	expect(Engine.combat.get_legal_attackable_spaces(game, [ruDiv], AP, () => "Summer", () => true)).toContain(
		bayburt
	)

	game.attack = { pieces: [ruDiv], space: bayburt, attacker: AP, defender: CP }
	Engine.combat.start_attack_sequence(game, () => {})
	expect(game.russian_revolution_ru_attack_used).toBe(true)
	expect(Engine.combat.get_legal_attackable_spaces(game, [ruDiv], AP, () => "Summer", () => true)).toEqual([])
})

test("俄国革命阶段 4：移除 RU 单位，保留特例，并放置新标记", () => {
	let game = setupGame(2026051205, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events = { russian_revolution: 4, romania: true }
	game.reduced = []
	game.soviet_uprising_markers = []

	let tiflis = findSpace("TIFLIS")
	let sarikamis = findSpace("Sarikamis")
	let galicia = findSpace("Galicia")
	let cavalry = findApPiece("RU Cavalry #1")
	let yugo = findApPiece("RU/SB Yugo Infantry")
	let caucasian = findApPiece("RU I Caucasian")
	let geoProtect = findCpPiece("GE GeoProtect")
	let geIX = findCpPiece("GE IX Army")
	let geDiv = findCpPiece("GE DIV #1")
	let transcas = findCpPiece("Arm Transcas #1")

	game.pieces[cavalry] = tiflis
	game.pieces[yugo] = Engine.game_utils.get_scu_reserve_box(AP)
	game.pieces[caucasian] = sarikamis
	game.pieces[geoProtect] = REINFORCEMENTS
	game.pieces[geIX] = galicia
	game.pieces[geDiv] = Engine.game_utils.get_scu_reserve_box(CP)
	for (let name of [
		"Arm Transcas #1",
		"Arm Transcas #2",
		"Arm Transcas #3",
		"Geo Transcaucasian #1",
		"Geo Transcaucasian #2"
	]) {
		game.pieces[findCpPiece(name)] = REINFORCEMENTS
	}

	Engine.events.apply_russian_revolution_stage_effects(game, 4, { log: () => {} })

	expect(game.russian_revolution_survivor_cavalry).toBe(cavalry)
	expect(Engine.game_utils.is_permanently_eliminated(game, caucasian)).toBe(true)
	expect(Engine.game_utils.is_permanently_eliminated(game, cavalry)).toBe(false)
	expect(Engine.game_utils.is_permanently_eliminated(game, yugo)).toBe(false)
	expect(Engine.game_utils.get_piece_nations_for_rule(game, cavalry)).toEqual(["br"])
	expect(Engine.game_utils.get_piece_nations_for_rule(game, cavalry, "mo")).toContain("ru")
	expect(Engine.game_utils.get_piece_nations_for_rule(game, yugo)).toEqual(["br"])

	expect([findSpace("Batum"), tiflis]).toContain(game.pieces[geoProtect])
	expect(Engine.game_utils.get_piece_effective_faction(game, transcas)).toBe(AP)
	expect(game.pieces[transcas]).toBeGreaterThan(0)
	expect(Engine.map.get_supply_status(game, game.pieces[transcas], AP, transcas)).toBe("FULL")
	expect(Engine.game_utils.is_permanently_eliminated(game, geIX)).toBe(true)
	expect(game.pieces[geDiv]).toBe(galicia)

	let sovietSpaces = ["Baku", "Central Asia", "Enzeli"].map(findSpace)
	expect(game.soviet_uprising_markers.sort((a, b) => a - b)).toEqual(sovietSpaces.sort((a, b) => a - b))
	expect(Engine.map.is_disrupted_by_enemy(game, findSpace("Baku"), AP)).toBe(true)
	expect(Engine.map.is_disrupted_by_enemy(game, findSpace("Baku"), CP)).toBe(true)
})

test("俄国革命阶段 4：玩家选择骑兵、格鲁吉亚、外高加索和 GE IX 替换", () => {
	let game = setupGame(2026052401, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events = {
		parvus_to_berlin: 5,
		russian_revolution: 3,
		romania: true,
		russian_revolution_stage_1_applied: true,
		russian_revolution_stage_2_applied: true,
		russian_revolution_stage_3_applied: true
	}
	game.reduced = []
	game.soviet_uprising_markers = []
	game.turn = 12
	game.state = "revolution_phase"
	game.active = CP
	game.revolution_step = 3

	let tiflis = findSpace("TIFLIS")
	let batum = findSpace("Batum")
	let erevan = findSpace("Erevan")
	let kars = findSpace("Kars")
	let oltu = findSpace("Oltu")
	let sarikamis = findSpace("Sarikamis")
	let galicia = findSpace("Galicia")
	let cavalry1 = findApPiece("RU Cavalry #1")
	let cavalry2 = findApPiece("RU Cavalry #2")
	let caucasian = findApPiece("RU I Caucasian")
	let yugo = findApPiece("RU/SB Yugo Infantry")
	let geoProtect = findCpPiece("GE GeoProtect")
	let geIX = findCpPiece("GE IX Army")
	let geDiv2 = findCpPiece("GE DIV #2")
	let geDiv3 = findCpPiece("GE DIV #3")
	let arm1 = findCpPiece("Arm Transcas #1")
	let arm2 = findCpPiece("Arm Transcas #2")
	let arm3 = findCpPiece("Arm Transcas #3")
	let geo1 = findCpPiece("Geo Transcaucasian #1")
	let geo2 = findCpPiece("Geo Transcaucasian #2")

	game.pieces[cavalry1] = tiflis
	game.pieces[cavalry2] = erevan
	game.pieces[caucasian] = sarikamis
	game.pieces[yugo] = Engine.game_utils.get_scu_reserve_box(AP)
	game.pieces[geoProtect] = REINFORCEMENTS
	game.pieces[geIX] = galicia
	game.pieces[geDiv2] = Engine.game_utils.get_scu_reserve_box(CP)
	game.pieces[geDiv3] = Engine.game_utils.get_scu_reserve_box(CP)
	for (let p of [arm1, arm2, arm3, geo1, geo2]) game.pieces[p] = REINFORCEMENTS
	Engine.set_control(game, tiflis, CP)
	for (let s of [batum, erevan, kars, oltu, sarikamis]) Engine.set_control(game, s, AP)

	let vp = game.vp
	rules.view(game, "Central Powers")

	expect(game.events.russian_revolution).toBe(4)
	expect(game.state).toBe("russian_revolution_stage_4_choose_cavalry")
	expect(game.active).toBe(AP_ROLE)
	expect(Engine.game_utils.is_permanently_eliminated(game, caucasian)).toBe(false)

	game = rules.action(game, "Allied Powers", "piece", cavalry2)
	expect(game.russian_revolution_survivor_cavalry).toBe(cavalry2)
	expect(Engine.game_utils.is_permanently_eliminated(game, cavalry1)).toBe(true)
	expect(Engine.game_utils.is_permanently_eliminated(game, cavalry2)).toBe(false)
	expect(game.state).toBe("russian_revolution_stage_4_georgian_protectorate")

	game = rules.action(game, "Allied Powers", "space", tiflis)
	expect(game.pieces[geoProtect]).toBe(tiflis)
	expect(game.vp).toBe(vp - 1)
	expect(game.state).toBe("russian_revolution_stage_4_place_transcaucasian")

	for (let [piece, space] of [
		[arm1, kars],
		[arm2, erevan],
		[arm3, oltu],
		[geo1, sarikamis],
		[geo2, batum]
	]) {
		let view = rules.view(game, "Allied Powers")
		expect(view.who).toBe(piece)
		expect(view.actions.piece || []).toEqual([])
		expect(view.actions.space || []).toContain(space)
		game = rules.action(game, "Allied Powers", "space", space)
		expect(game.pieces[piece]).toBe(space)
	}

	expect(game.state).toBe("russian_revolution_stage_4_ge_ix_replacement")
	expect(game.active).toBe(CP_ROLE)

	game = rules.action(game, "Central Powers", "piece", geDiv3)
	expect(game.events.russian_revolution_stage_4_applied).toBe(true)
	expect(game.pieces[geDiv3]).toBe(galicia)
	expect(game.pieces[geDiv2]).toBe(Engine.game_utils.get_scu_reserve_box(CP))
	expect(Engine.game_utils.is_permanently_eliminated(game, geIX)).toBe(true)
	expect(Engine.game_utils.is_permanently_eliminated(game, yugo)).toBe(false)
})

test("阶段 4 阻止新的 RU 增援和 RU 增援事件", () => {
	let game = setupGame(2026051206, "Historical", { no_supply_warnings: true })
	game.events = { russian_revolution: 4 }

	let ruDiv = findApPiece("RU DIV #15")
	game.pieces[ruDiv] = REINFORCEMENTS

	expect(Engine.events.reinforce(game, "RU DIV #15", AP, findSpace("Odessa"))).toBe(false)
	expect(Engine.events.can_play_event(game, findCard("RUSSIAN REINFORCEMENTS"))).toBe(false)
	expect(Engine.events.can_play_event(game, findCard("SPHERE OF INFLUENCE"))).toBe(false)
})
