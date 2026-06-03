const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function resetForRuleProbe(game, active = CP) {
	clearBoard(game)
	game.active = active
	game.activated = { move: [], attack: [] }
	game.region_activations = { move: {}, attack: {} }
	game.moved = []
	game.attacked = []
	game.retreated = []
	game.combat_cards = { attacker: [], defender: [] }
}

function getAttackTargets(game, pieces, faction = game.active) {
	return Engine.combat.get_legal_attackable_spaces(
		game,
		pieces,
		faction,
		() => Engine.game_utils.get_season(game),
		(s, side) => Engine.map.is_rail_connected_to_supply(game, s, side)
	)
}

test("Bulgarian units may not voluntarily enter Turkey from Bulgaria", () => {
	let game = setupGame(2026051201)
	let buDiv = findPiece(CP, "BU DIV #1")
	let philippopoli = findSpace("Philippopoli")
	let adrianople = findSpace("Adrianople")

	resetForRuleProbe(game, CP)
	game.events.bulgaria = true
	game.pieces[buDiv] = philippopoli
	game.control[philippopoli] = CP
	game.control[adrianople] = CP
	game.move = {
		initial: philippopoli,
		current: philippopoli,
		spaces_moved: 0,
		pieces: [buDiv],
		touched_spaces: [philippopoli],
		faction: CP
	}

	expect(Engine.map.can_enter_area(game, buDiv, adrianople)).toBe(false)
	expect(Engine.map.can_piece_move_to(game, buDiv, adrianople, CP)).toBe(false)
	expect(Engine.map.can_enter_area(game, buDiv, adrianople, { retreat: true })).toBe(true)
})

test("LCUs attacking out of desert must use a supplied rail edge", () => {
	let game = setupGame(2026051202)
	let samarra = findSpace("Samarra")
	let tikrit = findSpace("Tikrit")
	let baghdad = findSpace("Baghdad")
	let tuCorps = findPiece(CP, "TU III Corps")
	let ruDiv = findPiece(AP, "RU DIV #1")

	resetForRuleProbe(game, CP)
	game.pieces[tuCorps] = samarra
	game.pieces[ruDiv] = tikrit
	game.control[samarra] = CP
	game.control[baghdad] = CP
	game.control[tikrit] = AP

	let targets = Engine.combat.get_attackable_spaces(
		game,
		[tuCorps],
		CP,
		() => Engine.game_utils.get_season(game),
		(s, faction) => Engine.map.is_rail_connected_to_supply(game, s, faction)
	)
	expect(targets).not.toContain(tikrit)
})

test("BR LCU in Gaza can attack Beersheba along the completed Sinai rail", () => {
	let game = setupGame(2026060301, "Historical", { no_supply_warnings: true })
	let gaza = findSpace("Gaza")
	let beersheba = findSpace("Beersheba")
	let elArish = findSpace("El Arish")
	let romani = findSpace("Romani")
	let ismailia = findSpace("Ismailia")
	let brCorps = findPiece(AP, "BR IX Corps")
	let brDiv1 = findPiece(AP, "BR DIV #1")
	let brDiv2 = findPiece(AP, "BR DIV #2")
	let tuCorps = findPiece(CP, "TU III Corps")

	resetForRuleProbe(game, AP)
	game.state = "attack"
	game.events.xinai = true
	Engine.map.destroy_fort(game, gaza)
	for (let s of [ismailia, romani, elArish, gaza]) Engine.set_control(game, s, AP)
	Engine.set_control(game, beersheba, CP)
	game.pieces[brCorps] = gaza
	game.pieces[brDiv1] = gaza
	game.pieces[brDiv2] = gaza
	game.pieces[tuCorps] = beersheba
	game.activated.attack = [gaza]
	game.attack = { pieces: [], space: -1 }

	let initialView = rules.view(game, AP_ROLE)
	expect(initialView.actions.piece).toContain(brCorps)

	game = rules.action(game, AP_ROLE, "piece", brDiv1)
	game = rules.action(game, AP_ROLE, "piece", brDiv2)
	let selectedScuView = rules.view(game, AP_ROLE)
	expect(selectedScuView.actions.piece).toContain(brCorps)

	game = rules.action(game, AP_ROLE, "piece", brCorps)
	let selectedStackView = rules.view(game, AP_ROLE)
	expect(selectedStackView.actions.space).toContain(beersheba)
})

test("Kut to The Hai does not apply the reverse-direction river crossing penalty", () => {
	let game = setupGame(2026052802, "Historical", { no_supply_warnings: true })
	let kut = findSpace("Kut")
	let theHai = findSpace("The Hai")
	let tuCorps = findPiece(CP, "TU I Corps")
	let inDiv = findPiece(AP, "IN DIV #1")

	resetForRuleProbe(game, CP)
	game.pieces[tuCorps] = kut
	game.pieces[inDiv] = theHai
	Engine.set_control(game, kut, CP)
	Engine.set_control(game, theHai, AP)
	game.attack = {
		pieces: [tuCorps],
		space: theHai,
		attacker: CP,
		defender: AP
	}

	expect(Engine.map.get_crossing_type(kut, theHai)).toBe(null)
	expect(Engine.map.get_crossing_type(theHai, kut)).toBe("b_to_a")
	expect(Engine.combat.is_river_defense(game)).toBe(false)
	expect(Engine.combat.fmt_attack_odds(game)).toBe("2 (LCU) vs 0 (SCU)")
})

test("advance after combat must stop after crossing a water edge", () => {
	let game = setupGame(2026052803, "Historical", { no_supply_warnings: true })
	let kut = findSpace("Kut")
	let sannaiyat = findSpace("Sannaiyat")
	let amara = findSpace("Amara")
	let tuDiv = findPiece(CP, "TU DIV #1")

	resetForRuleProbe(game, CP)
	game.pieces[tuDiv] = kut
	Engine.set_control(game, kut, CP)
	Engine.set_control(game, sannaiyat, AP)
	Engine.set_control(game, amara, AP)
	game.state = "advance"
	game.attack = {
		pieces: [tuDiv],
		space: sannaiyat,
		attacker: CP,
		defender: AP
	}
	game.battle_result = { retreat_distance: 2 }
	game.retreat_distance = 2
	game.retreat_first_spaces = [amara]
	game.advance_space = sannaiyat
	game.advance_pieces = [tuDiv]
	game.advance_count = 0
	game.advance_limit = 3
	game.retreated = []
	game.undo = []

	expect(Engine.combat.is_water_crossing_attack_edge(game, kut, sannaiyat, [tuDiv])).toBe(true)
	game = rules.action(game, CP_ROLE, "piece", tuDiv)

	expect(game.pieces[tuDiv]).toBe(sannaiyat)
	expect(game.advance_follow_mode).toBeUndefined()
	expect(game.advance_follow_pieces || []).not.toContain(tuDiv)
	expect(game.advanced_stopped).toContain(tuDiv)
})

test("incomplete Berlin-Baghdad railroad is a normal attack connection before the event", () => {
	let game = setupGame(2026052101)
	let eregli = findSpace("Eregli")
	let adana = findSpace("Adana")
	let tuDiv = findPiece(CP, "TU DIV #1")
	let brDiv = findPiece(AP, "BR DIV #1")

	resetForRuleProbe(game, CP)
	delete game.events.berlin_baghdad
	game.pieces[tuDiv] = eregli
	game.pieces[brDiv] = adana
	Engine.set_control(game, eregli, CP)
	Engine.set_control(game, adana, AP)

	expect(Engine.map.get_rail_connections(game, eregli, CP)).not.toContain(adana)
	expect(Engine.map.get_piece_connected_spaces_for_rule(game, eregli, tuDiv, "attack")).toContain(adana)
	expect(getAttackTargets(game, [tuDiv], CP)).toContain(adana)
})

test("colored railroads allow attacks but not movement or advance for restricted units", () => {
	let game = setupGame(2026051206, "Historical", { no_supply_warnings: true })
	let belgrade = findSpace("BELGRADE")
	let galicia = findSpace("Galicia")
	let sbArmy = findPiece(AP, "SB 1 Army")
	let geDiv = findPiece(CP, "GE DIV #1")

	resetForRuleProbe(game, AP)
	game.pieces[sbArmy] = belgrade
	game.pieces[geDiv] = galicia
	Engine.set_control(game, belgrade, AP)
	Engine.set_control(game, galicia, CP)
	game.activated.attack = [belgrade]

	expect(Engine.map.get_piece_connected_spaces_for_rule(game, belgrade, sbArmy, "move")).not.toContain(galicia)
	expect(Engine.map.get_piece_connected_spaces_for_rule(game, belgrade, sbArmy, "attack")).toContain(galicia)
	expect(getAttackTargets(game, [sbArmy], AP)).toContain(galicia)

	game.pieces[geDiv] = 0
	game.attack = {
		pieces: [sbArmy],
		space: galicia,
		attacker: AP,
		defender: CP
	}

	expect(Engine.combat.get_valid_advance_spaces(game, sbArmy, galicia)).toEqual([])
})

test("authorized units can advance across their colored railroads", () => {
	let game = setupGame(2026051207, "Historical", { no_supply_warnings: true })
	let belgrade = findSpace("BELGRADE")
	let galicia = findSpace("Galicia")
	let geDiv = findPiece(CP, "GE DIV #1")
	let brDiv = findPiece(AP, "BR DIV #1")

	resetForRuleProbe(game, CP)
	game.pieces[geDiv] = belgrade
	game.pieces[brDiv] = galicia
	Engine.set_control(game, belgrade, CP)
	Engine.set_control(game, galicia, AP)
	game.activated.attack = [belgrade]

	expect(Engine.map.get_piece_connected_spaces_for_rule(game, belgrade, geDiv, "move")).toContain(galicia)
	expect(getAttackTargets(game, [geDiv], CP)).toContain(galicia)

	game.pieces[brDiv] = 0
	game.attack = {
		pieces: [geDiv],
		space: galicia,
		attacker: CP,
		defender: AP
	}

	expect(Engine.combat.get_valid_advance_spaces(game, geDiv, galicia)).toEqual([galicia])
})

test("Flank attack is allowed against a defended fort without trench or prohibited terrain", () => {
	let game = setupGame(2026051203)
	let adrianople = findSpace("Adrianople")
	let philippopoli = findSpace("Philippopoli")
	let xanthi = findSpace("Xanthi")
	let brCorps = findPiece(AP, "BR IX Corps")
	let brCorps2 = findPiece(AP, "BR VIII Corps")
	let tuDiv = findPiece(CP, "TU DIV #8")

	resetForRuleProbe(game, AP)
	game.pieces[brCorps] = philippopoli
	game.pieces[brCorps2] = xanthi
	game.pieces[tuDiv] = adrianople
	game.control[philippopoli] = AP
	game.control[xanthi] = AP
	game.control[adrianople] = CP
	game.trenches = []
	game.attack = {
		pieces: [brCorps, brCorps2],
		space: adrianople,
		attacker: AP,
		defender: CP
	}

	expect(Engine.combat.has_undestroyed_fort(game, adrianople, CP)).toBe(true)
	expect(Engine.combat.check_can_flank(game)).toBe(true)
})

test("Retreat may enter an enemy-occupied Region", () => {
	let game = setupGame(2026051204)
	let shiraz = findSpace("Shiraz")
	let meshed = findSpace("Meshed")
	let brCordon = findPiece(AP, "BR Persian Cordon #1")
	let kurds = findPiece(CP, "Kurds #1")

	resetForRuleProbe(game, AP)
	game.events.secret_treaty = true
	game.pieces[brCordon] = shiraz
	game.pieces[kurds] = meshed
	game.control[shiraz] = AP
	game.control[meshed] = CP

	expect(Engine.map.is_region(game, meshed)).toBe(true)
	expect(Engine.map.contains_enemy_pieces(game, meshed, AP)).toBe(true)
	expect(Engine.combat.get_valid_retreat_spaces(game, brCordon, [], 1)).toContain(meshed)
})

test("Afghan Uprising units may attack adjacent India after Afghan Alliance", () => {
	let game = setupGame(2026052301, "Historical", { no_supply_warnings: true })
	let afghanistan = findSpace("Afghanistan")
	let india = findSpace("INDIA")
	let afghan = findPiece(CP, "Afghan Uprising #1")
	let defender = findPiece(AP, "BR DIV #1")

	resetForRuleProbe(game, CP)
	game.events.afghan_alliance = true
	game.pieces[afghan] = afghanistan
	game.pieces[defender] = india
	game.control[afghanistan] = CP
	game.control[india] = AP

	expect(Engine.map.get_piece_connected_spaces_for_rule(game, afghanistan, afghan, "attack")).toContain(india)
	expect(
		Engine.combat.can_activate_piece_in_space_to_attack(
			game,
			afghan,
			afghanistan,
			CP,
			() => Engine.game_utils.get_season(game),
			(s, faction) => Engine.map.is_rail_connected_to_supply(game, s, faction)
		)
	).toBe(true)
	expect(getAttackTargets(game, [afghan], CP)).toContain(india)
})

test("Central Asian Uprising does not trigger tribe range end-move blocking", () => {
	let game = setupGame(2026052306, "Historical", { no_supply_warnings: true })
	let centralAsia = findSpace("Central Asia")
	let casiaUprising = findPiece(CP, "CAsia Uprising")
	let camelCorps = findPiece(CP, "TU-A Camel Corps")

	resetForRuleProbe(game, CP)
	game.pieces[casiaUprising] = centralAsia
	game.pieces[camelCorps] = centralAsia
	game.control[centralAsia] = CP

	expect(Engine.game_utils.is_irregular(casiaUprising)).toBe(true)
	expect(Engine.game_utils.is_tribe(casiaUprising)).toBe(false)
	expect(Engine.map.is_space_in_tribal_range(casiaUprising, centralAsia)).toBe(true)
	expect(Engine.map.get_move_end_space_block_reason(game, centralAsia, CP)).toBe(null)
})

test("Tribes and Central Asian Uprising may not attack across the Caspian Sea", () => {
	let game = setupGame(2026060101, "Historical", { no_supply_warnings: true })
	let centralAsia = findSpace("Central Asia")
	let baku = findSpace("Baku")
	let enzeli = findSpace("Enzeli")
	let casiaUprising = findPiece(CP, "CAsia Uprising")
	let jangali = findPiece(CP, "Jangali")
	let ruDiv1 = findPiece(AP, "RU DIV #1")

	resetForRuleProbe(game, CP)
	game.pieces[casiaUprising] = centralAsia
	game.pieces[jangali] = enzeli
	game.pieces[ruDiv1] = baku
	game.control[centralAsia] = CP
	game.control[enzeli] = CP
	game.control[baku] = AP

	expect(Engine.map.get_piece_connected_spaces_for_rule(game, centralAsia, casiaUprising, "attack")).not.toContain(baku)
	expect(Engine.map.get_piece_connected_spaces_for_rule(game, enzeli, jangali, "attack")).not.toContain(baku)
	expect(getAttackTargets(game, [casiaUprising], CP)).not.toContain(baku)
	expect(getAttackTargets(game, [jangali], CP)).not.toContain(baku)
})

test("Region combat asks defender to choose one legal defense stack", () => {
	let game = setupGame(2026051205)
	let shiraz = findSpace("Shiraz")
	let isfahan = findSpace("Isfahan")
	let attacker = findPiece(CP, "TU DIV #8")
	let defenders = [
		findPiece(AP, "BR DIV #1"),
		findPiece(AP, "BR DIV #2"),
		findPiece(AP, "BR DIV #3"),
		findPiece(AP, "BR DIV #4")
	]

	resetForRuleProbe(game, CP)
	game.events.secret_treaty = true
	game.state = "confirm_attack"
	game.pieces[attacker] = isfahan
	for (let p of defenders) game.pieces[p] = shiraz
	game.control[isfahan] = CP
	game.control[shiraz] = AP
	game.attack = {
		pieces: [attacker],
		space: shiraz,
		attacker: CP,
		defender: AP
	}

	rules.action(game, CP_ROLE, "confirm")

	expect(game.state).toBe("choose_region_defender_stack")
	expect(game.active).toBe(AP)
	let view = rules.view(game, AP_ROLE)
	for (let p of defenders) expect(view.actions.piece || []).toContain(p)
	expect(view.actions.confirm).toBeUndefined()

	for (let p of defenders.slice(0, 3)) rules.action(game, AP_ROLE, "piece", p)
	view = rules.view(game, AP_ROLE)
	expect(view.actions.confirm).toBeTruthy()

	rules.action(game, AP_ROLE, "confirm")
	expect(game.attack.region_defenders.sort((a, b) => a - b)).toEqual(defenders.slice(0, 3).sort((a, b) => a - b))
	expect(game.attack.initial_defenders.sort((a, b) => a - b)).toEqual(defenders.slice(0, 3).sort((a, b) => a - b))
})
