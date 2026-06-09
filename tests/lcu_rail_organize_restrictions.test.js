const Engine = require("../modules/engine.js")
const rules = require("../rules.js")

const { setupGame, findSpace, findApPiece, findPieceByPredicate, findCpPiece: findPiece, clearBoard } = require("./helpers.js")

const { AP, CP, COMMITMENT_MOBILIZATION, RESERVE } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function placeTurkishDivisionPair(game, space) {
	game.pieces[findPiece("TU DIV #1")] = space
	game.pieces[findPiece("TU DIV #2")] = space
	game.moved = []
}

function placeBritishDivisionPairForReducedCorps(game, space) {
	game.pieces[findApPiece("BR DIV #1")] = space
	game.pieces[findApPiece("BR DIV #2")] = space
	game.pieces[findApPiece("BR IX Corps")] = RESERVE
	game.moved = []
}

test("LCUs cannot organize in restricted spaces without an actual rail line", () => {
	let game = setupGame(2026042101)
	let aqaba = findSpace("Aqaba")

	placeTurkishDivisionPair(game, aqaba)

	expect(Engine.map.get_supply_status(game, aqaba, CP, findPiece("TU DIV #1"))).toBe("FULL")
	expect(Engine.map.is_rail_connected_to_supply(game, aqaba, CP)).toBe(false)
	expect(Engine.game_utils.can_combine_in_space(game, aqaba, CP)).toBe(false)
})

test("selected SCU combine action cannot bypass restricted rail requirement", () => {
	let game = setupGame(2026052102)
	let kut = findSpace("Kut")
	let div1 = findPiece("TU DIV #1")
	let div2 = findPiece("TU DIV #2")

	game.active = CP
	game.state = "choose_pieces_to_move"
	game.activated = { move: [kut], attack: [] }
	game.region_activations = { move: {}, attack: {} }
	game.where = kut
	game.pieces[div1] = kut
	game.pieces[div2] = kut
	game.control[kut] = CP
	game.moved = []
	game.move = {
		initial: kut,
		current: kut,
		spaces_moved: 0,
		pieces: [div1, div2],
		touched_spaces: [kut],
		faction: CP
	}

	expect(Engine.map.is_rail_connected_to_supply(game, kut, CP)).toBe(false)
	expect(Engine.game_utils.can_combine_in_space(game, kut, CP)).toBe(false)
	expect(rules.view(game, CP_ROLE).actions.combine).toBeUndefined()
})

test("LCUs cannot enter or organize in desert spaces without an actual rail line", () => {
	let game = setupGame(2026042102)
	let kuwait = findSpace("Kuwait")
	let tuCorps = findPiece("TU III Corps")

	placeTurkishDivisionPair(game, kuwait)

	expect(Engine.map.get_supply_status(game, kuwait, CP, findPiece("TU DIV #1"))).toBe("FULL")
	expect(Engine.map.is_rail_connected_to_supply(game, kuwait, CP)).toBe(false)
	expect(Engine.game_utils.can_combine_in_space(game, kuwait, CP)).toBe(false)
	expect(Engine.map.can_enter_area(game, tuCorps, kuwait)).toBe(false)
})

test("ANZ Desert Corps can move across unfinished Sinai railroad as a normal connection", () => {
	let game = setupGame(2026042105)
	let ismailia = findSpace("Ismailia")
	let romani = findSpace("Romani")
	let anzDesertCorps = findApPiece("ANZ Desert Corps")
	let britishCorps = findApPiece("BR IX Corps")

	clearBoard(game)
	game.events = game.events || {}
	delete game.events.xinai
	game.control[ismailia] = AP
	game.control[romani] = AP
	game.pieces[anzDesertCorps] = ismailia
	game.pieces[britishCorps] = ismailia
	game.move = {
		initial: ismailia,
		current: ismailia,
		spaces_moved: 0,
		pieces: [anzDesertCorps],
		touched_spaces: [ismailia]
	}

	expect(Engine.map.can_piece_move_to(game, anzDesertCorps, romani, AP)).toBe(true)
	expect(Engine.map.can_sr_to_space(game, anzDesertCorps, romani, AP)).toBe(true)

	game.move.pieces = [britishCorps]
	expect(Engine.map.can_piece_move_to(game, britishCorps, romani, AP)).toBe(false)
	expect(Engine.map.can_sr_to_space(game, britishCorps, romani, AP)).toBe(false)
})

test("ANZ Desert Corps still counts toward restricted-area LCU limits", () => {
	let game = setupGame(2026042106)
	let romani = findSpace("Romani")
	let elArish = findSpace("El Arish")
	let gaza = findSpace("Gaza")
	let anzDesertCorps = findApPiece("ANZ Desert Corps")
	let britishCorps = findApPiece("BR IX Corps")

	clearBoard(game)
	game.events = game.events || {}
	game.events.xinai = true
	game.war_commitment_ap = COMMITMENT_MOBILIZATION
	game.control[romani] = AP
	game.control[elArish] = AP
	game.control[gaza] = AP
	game.pieces[anzDesertCorps] = romani
	game.pieces[britishCorps] = gaza

	let area = Engine.map.get_restricted_area(romani)
	expect(area).toBe("syria_palestine")
	expect(Engine.map.count_lcu_in_area(game, area, AP)).toBe(2)
	expect(Engine.map.get_lcu_limit_for(game, AP)).toBe(1)
	expect(Engine.map.check_rule_violations(game).some((v) => v.rule.includes("LCU Limit Exceeded"))).toBe(true)
})

test("Greater Persia shares one restricted-area LCU limit", () => {
	let game = setupGame(2026052305)
	let tabriz = findSpace("Tabriz")
	let ahwaz = findSpace("Ahwaz")
	let meshed = findSpace("Meshed")
	let shuster = findSpace("Shuster")
	let russianCorps = findApPiece("RU I Caucasian")
	let secondRussianCorps = findApPiece("RU IV Caucasian")

	clearBoard(game)
	game.war_commitment_ap = COMMITMENT_MOBILIZATION
	game.pieces[russianCorps] = tabriz

	expect(Engine.map.get_restricted_area(tabriz)).toBe("persia")
	expect(Engine.map.get_restricted_area(ahwaz)).toBe("persia")
	expect(Engine.map.get_restricted_area(meshed)).toBe("persia")
	expect(Engine.map.count_lcu_in_area(game, "persia", AP)).toBe(1)
	expect(Engine.map.can_enter_area(game, secondRussianCorps, shuster)).toBe(false)

	game.pieces[secondRussianCorps] = shuster
	expect(Engine.map.count_lcu_in_area(game, "persia", AP)).toBe(2)
	expect(Engine.map.check_rule_violations(game).some((v) => v.rule.includes("LCU Limit Exceeded in persia"))).toBe(
		true
	)
})

test("ANZ Desert Corps does not create a desert rail violation by itself", () => {
	let game = setupGame(2026042107)
	let kuwait = findSpace("Kuwait")
	let anzDesertCorps = findApPiece("ANZ Desert Corps")

	clearBoard(game)
	game.control[kuwait] = AP
	game.pieces[anzDesertCorps] = kuwait

	expect(Engine.map.is_rail_connected_to_supply(game, kuwait, AP)).toBe(false)
	expect(
		Engine.map
			.check_rule_violations(game)
			.some((v) => v.space === kuwait && v.rule.includes("Desert LCU must have rail connection"))
	).toBe(false)
})

test("Sinai Railroad remains usable after completion turn and stays AP-only", () => {
	let game = setupGame(2026051201)
	let ismailia = findSpace("Ismailia")
	let romani = findSpace("Romani")
	let elArish = findSpace("El Arish")
	let gaza = findSpace("Gaza")
	let britishCorps = findApPiece("BR IX Corps")

	clearBoard(game)
	game.events = game.events || {}
	game.events.xinai = 5
	game.turn = 6
	game.control[romani] = AP
	game.control[elArish] = AP
	game.control[gaza] = AP
	game.pieces[britishCorps] = ismailia
	game.move = {
		initial: ismailia,
		current: ismailia,
		spaces_moved: 0,
		pieces: [britishCorps],
		touched_spaces: [ismailia]
	}

	expect(Engine.events.is_sinai_railroad_complete(game)).toBe(true)
	expect(Engine.map.can_piece_move_to(game, britishCorps, romani, AP)).toBe(true)
	expect(Engine.map.is_rail_connected_to_supply(game, romani, AP)).toBe(true)

	game.events.xinai = true
	expect(Engine.events.can_use_sinai_railroad(game, AP)).toBe(true)
	expect(Engine.events.can_use_sinai_railroad(game, CP)).toBe(false)
	expect(Engine.map.can_piece_move_to(game, britishCorps, romani, AP)).toBe(true)

	game.control[ismailia] = CP
	game.control[romani] = CP
	game.control[elArish] = CP
	game.control[gaza] = CP
	expect(Engine.map.is_rail_connected_to_supply(game, elArish, CP)).toBe(false)
})

test("Sinai Railroad marker leaves the turn track after completion", () => {
	let game = setupGame(2026051202)
	game.events = game.events || {}
	game.events.xinai = game.turn + 1

	let buildingView = rules.view(game, AP_ROLE)
	expect(buildingView.sinai_railroad_turn).toBe(game.turn + 1)
	expect(buildingView.ui_tokens["Sinai Railroad"]).toBeUndefined()

	game.turn = game.events.xinai
	let completedView = rules.view(game, AP_ROLE)
	expect(completedView.sinai_railroad_turn).toBeUndefined()
	expect(completedView.ui_tokens["Sinai Railroad"]).toBe("MSinaiRR.png")

	game.events.xinai = true
	let permanentView = rules.view(game, AP_ROLE)
	expect(permanentView.sinai_railroad_turn).toBeUndefined()
	expect(permanentView.ui_tokens["Sinai Railroad"]).toBe("MSinaiRR.png")
})

test("Rail-connected desert restricted spaces still allow legal LCU organization", () => {
	let game = setupGame(2026042103)
	let tabuk = findSpace("Tabuk")
	let tuCorps = findPiece("TU III Corps")

	placeTurkishDivisionPair(game, tabuk)

	expect(Engine.map.is_rail_connected_to_supply(game, tabuk, CP)).toBe(true)
	expect(Engine.game_utils.can_combine_in_space(game, tabuk, CP)).toBe(true)
	expect(Engine.map.can_enter_area(game, tuCorps, tabuk)).toBe(true)
})

test("Turkish LCUs still cannot organize in swamp spaces", () => {
	let game = setupGame(2026042104)
	let basra = findSpace("Basra")

	placeTurkishDivisionPair(game, basra)

	expect(Engine.map.get_supply_status(game, basra, CP, findPiece("TU DIV #1"))).toBe("FULL")
	expect(Engine.game_utils.can_combine_in_space(game, basra, CP)).toBe(false)
})

test("AP can organize an LCU in AP-controlled Basra as a supplied restricted-area port", () => {
	let game = setupGame(2026052303, "Historical", { no_supply_warnings: true })
	let basra = findSpace("Basra")
	let fao = findSpace("Fao")

	clearBoard(game)
	game.control[basra] = AP
	game.control[fao] = AP
	placeBritishDivisionPairForReducedCorps(game, basra)

	expect(Engine.map.is_rail_connected_to_supply(game, basra, AP)).toBe(false)
	expect(Engine.map.is_ap_controlled_port_or_beachhead(game, basra)).toBe(true)
	expect(Engine.map.count_lcu_in_area(game, "mesopotamia", AP)).toBe(0)
	expect(Engine.game_utils.can_combine_in_space(game, basra, AP)).toBe(true)
})

test("moving an existing LCU out of a restricted area restores combine eligibility there", () => {
	let game = setupGame(2026052305, "Historical", { no_supply_warnings: true })
	let basra = findSpace("Basra")
	let cairo = findSpace("CAIRO")
	let qurna = findSpace("Qurna")
	let fao = findSpace("Fao")
	let existingLcu = findPieceByPredicate(
		(info) => info.name === "BR VIII Corps" && info.piece_class === "LCU" && info.faction === AP,
		"BR VIII Corps LCU"
	)

	clearBoard(game)
	game.control[basra] = AP
	game.control[fao] = AP
	game.pieces[existingLcu] = qurna
	placeBritishDivisionPairForReducedCorps(game, basra)

	expect(Engine.map.count_lcu_in_area(game, "mesopotamia", AP)).toBe(1)
	expect(Engine.game_utils.can_combine_in_space(game, basra, AP)).toBe(false)

	game.pieces[existingLcu] = cairo

	expect(Engine.map.count_lcu_in_area(game, "mesopotamia", AP)).toBe(0)
	expect(Engine.game_utils.can_combine_in_space(game, basra, AP)).toBe(true)
})

test("AP cannot use the Basra port exception before controlling Fao", () => {
	let game = setupGame(2026052304, "Historical", { no_supply_warnings: true })
	let basra = findSpace("Basra")
	let fao = findSpace("Fao")

	clearBoard(game)
	game.control[basra] = AP
	game.control[fao] = CP
	placeBritishDivisionPairForReducedCorps(game, basra)

	expect(Engine.map.is_rail_connected_to_supply(game, basra, AP)).toBe(false)
	expect(Engine.map.is_ap_controlled_port_or_beachhead(game, basra)).toBe(false)
	expect(Engine.game_utils.can_combine_in_space(game, basra, AP)).toBe(false)
})
