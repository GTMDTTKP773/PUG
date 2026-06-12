"use strict"

const Engine = require("../modules/engine.js")
const rules = require("../rules.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function control(game, name, faction) {
	Engine.set_control(game, findSpace(name), faction)
}

function place(game, faction, pieceName, spaceName) {
	let p = findPiece(faction, pieceName)
	game.pieces[p] = findSpace(spaceName)
	return p
}

function reserve(game, faction, pieceName) {
	let p = findPiece(faction, pieceName)
	game.pieces[p] = Engine.game_utils.get_scu_reserve_box(faction)
	return p
}

test("Suez Canal control blocks direct AP sea SR between East Med and Persian Gulf", () => {
	let game = setupGame(2026050902, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let brDiv = place(game, AP, "BR DIV #1", "Haifa")
	for (let name of ["Haifa", "Abadan"]) control(game, name, AP)

	expect(Engine.map.can_sr_to_space(game, brDiv, findSpace("Abadan"), AP)).toBe(true)

	control(game, "Port Said", CP)
	expect(Engine.map.can_sr_to_space(game, brDiv, findSpace("Abadan"), AP)).toBe(false)
	expect(Engine.map.can_suez_delayed_sr_to_space(game, brDiv, findSpace("Haifa"), findSpace("Abadan"), AP)).toBe(true)

	game.active = AP
	game.state = "sr_phase"
	game.sr_moved = []
	game.sr = 3
	let analysis = rules.analysis.sr_analysis(game, AP, [[brDiv, findSpace("Abadan")]])
	expect(analysis.packages[0]).toMatchObject({
		piece_legal: true,
		destination_legal: true,
		route: {
			kind: "suez_delayed",
			sea_sr: true,
			delayed_suez: true,
			arrival_zone: "persian_gulf",
			arrival_turn: game.turn + 1,
		},
	})

	game.state = "sr_move"
	game.sr_piece = brDiv
	game = rules.action(game, AP_ROLE, "space", findSpace("Abadan"))

	expect(game.pieces[brDiv]).toBe(Engine.constants.REINFORCEMENTS)
	expect(game.suez_delayed_sr).toEqual([
		expect.objectContaining({
			piece: brDiv,
			turn: game.turn + 1,
			arrival_zone: "persian_gulf"
		})
	])
})

test("CP sea SR respects Suez access before blockade and Black/Caspian-only access after blockade", () => {
	let game = setupGame(2026050903, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let tuDiv = place(game, CP, "TU DIV #1", "Haifa")
	for (let name of ["Haifa", "Kuwait", "Suez"]) control(game, name, CP)

	delete game.events.royal_navy_blockade
	control(game, "Suez", AP)
	expect(Engine.map.can_sr_to_space(game, tuDiv, findSpace("Kuwait"), CP)).toBe(false)

	control(game, "Suez", CP)
	expect(Engine.map.can_sr_to_space(game, tuDiv, findSpace("Kuwait"), CP)).toBe(true)

	game.events.royal_navy_blockade = game.turn
	expect(Engine.map.can_sr_to_space(game, tuDiv, findSpace("Kuwait"), CP)).toBe(false)
})

test("CP sea SR from an Ottoman port does not add Jihad", () => {
	let game = setupGame(2026051901, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let tuDiv = place(game, CP, "TU DIV #1", "Haifa")
	let haifa = findSpace("Haifa")
	let kuwait = findSpace("Kuwait")
	for (let name of ["Haifa", "Kuwait", "Suez"]) control(game, name, CP)
	delete game.events.royal_navy_blockade
	game.jihad = 0

	expect(Engine.map.can_sr_to_space(game, tuDiv, kuwait, CP)).toBe(true)

	game.active = CP
	game.state = "sr_move"
	game.sr_piece = tuDiv
	game.sr = 3
	game = rules.action(game, CP_ROLE, "space", kuwait)

	expect(game.pieces[tuDiv]).toBe(kuwait)
	expect(game.jihad).toBe(0)
	expect(game.log).toContain(`P${tuDiv} 战略调整：s${haifa} → s${kuwait}`)
})

test("AP sea SR away from the last Ottoman port supply unit still adds Jihad", () => {
	let game = setupGame(2026051902, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let brDiv = place(game, AP, "BR DIV #1", "Haifa")
	for (let name of ["Haifa", "Port Said"]) control(game, name, AP)
	game.jihad = 0

	expect(Engine.map.can_sr_to_space(game, brDiv, findSpace("Port Said"), AP)).toBe(true)

	game.active = AP
	game.state = "sr_phase"
	game.sr_moved = []
	game.sr = 3
	let analysis = rules.analysis.sr_analysis(game, AP, [[brDiv, findSpace("Port Said")]])
	expect(analysis.packages[0]).toMatchObject({
		route: {
			kind: "sea",
			sea_sr: true,
			delayed_suez: false,
		},
		departure: {
			ottoman_port: true,
			sole_supply_piece_ids: [brDiv],
			sole_supply_piece_count: 1,
			jihad_increase: 1,
		},
	})

	game.state = "sr_move"
	game.sr_piece = brDiv
	game = rules.action(game, AP_ROLE, "space", findSpace("Port Said"))

	expect(game.pieces[brDiv]).toBe(findSpace("Port Said"))
	expect(game.jihad).toBe(1)
})

test("SR route analysis uses the same port-to-port departure classification as execution", () => {
	let game = setupGame(2026061101, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let brDiv = place(game, AP, "BR DIV #1", "Haifa")
	let source = findSpace("Haifa")
	let destination = findSpace("Port Said")
	for (let name of ["Haifa", "Port Said"]) control(game, name, AP)

	let route = Engine.map.get_sr_route_context(game, brDiv, source, destination, AP)
	expect(route.sea_sr).toBe(Engine.map.is_sr_sea_departure_move(game, source, destination))
	expect(route.sea_sr).toBe(true)
	expect(Engine.map.is_sr_sea_departure_move(game, source, source)).toBe(false)
	expect(
		Engine.map.is_sr_sea_departure_move(
			game,
			Engine.game_utils.get_scu_reserve_box(AP),
			destination
		)
	).toBe(false)
})

test("AP Black Sea sea SR to outside ports requires the opened straits, while special RU units can reserve SR to Aegean", () => {
	let game = setupGame(2026050904, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let ruDiv = place(game, AP, "RU DIV #1", "Odessa")
	for (let name of ["Odessa", "Smyrna"]) control(game, name, AP)

	expect(Engine.map.can_sr_to_space(game, ruDiv, findSpace("Smyrna"), AP)).toBe(false)

	for (let name of [
		"The Bosphorus Forts",
		"CONSTANTINOPLE",
		"Bandirma",
		"Rodosto",
		"Gallipoli",
		"Chardak",
		"Maidos",
		"Canakkale",
		"Seddul Bahr",
		"Kum Kale"
	]) {
		control(game, name, AP)
	}
	expect(Engine.map.can_sr_to_space(game, ruDiv, findSpace("Smyrna"), AP)).toBe(true)

	let special = reserve(game, AP, "RU 2/4 Special")
	let ordinary = reserve(game, AP, "RU DIV #2")
	control(game, "Lemnos", AP)

	expect(Engine.map.can_sr_to_space(game, special, findSpace("Lemnos"), AP)).toBe(true)
	expect(Engine.map.can_sr_to_space(game, ordinary, findSpace("Lemnos"), AP)).toBe(false)
})

test("Reserve Box SR uses the rule 11.2.2 AP port lists instead of every AP supply port", () => {
	let game = setupGame(2026050905, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	for (let name of ["Smyrna", "Kuwait", "Baku"]) control(game, name, AP)

	let frDiv = reserve(game, AP, "FR DIV #1")
	let brDiv = reserve(game, AP, "BR DIV #1")

	expect(Engine.map.can_sr_to_space(game, frDiv, findSpace("Smyrna"), AP)).toBe(true)
	expect(Engine.map.can_sr_to_space(game, frDiv, findSpace("Kuwait"), AP)).toBe(false)
	expect(Engine.map.can_sr_to_space(game, frDiv, findSpace("Baku"), AP)).toBe(false)

	expect(Engine.map.can_sr_to_space(game, brDiv, findSpace("Kuwait"), AP)).toBe(true)
	expect(Engine.map.can_sr_to_space(game, brDiv, findSpace("Baku"), AP)).toBe(false)
})

test("SR may enter or leave an enemy-controlled contested Region but may not pass through it", () => {
	let game = setupGame(2026050906, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events.secret_treaty = true

	let ruDiv = place(game, AP, "RU DIV #1", "TEHERAN")
	place(game, AP, "RU/PE Police North", "Meshed")
	place(game, CP, "Kurds #1", "Meshed")
	for (let name of ["TEHERAN", "Central Asia"]) control(game, name, AP)
	control(game, "Meshed", CP)

	let teheran = findSpace("TEHERAN")
	let meshed = findSpace("Meshed")
	let centralAsia = findSpace("Central Asia")

	expect(Engine.map.can_sr_to_space(game, ruDiv, meshed, AP)).toBe(true)
	expect(Engine.map.has_sr_path(game, ruDiv, teheran, centralAsia, AP, false)).toBe(false)

	game.pieces[ruDiv] = meshed
	expect(Engine.map.can_sr_to_space(game, ruDiv, teheran, AP)).toBe(true)
})

test("SR through friendly Partial Control converts the space to Full Control", () => {
	let game = setupGame(2026050907, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events.secret_treaty = true

	let ruDiv = place(game, AP, "RU DIV #1", "Meshed")
	place(game, AP, "RU/PE Police North", "TEHERAN")
	control(game, "Meshed", AP)
	control(game, "TEHERAN", CP)

	let teheran = findSpace("TEHERAN")
	expect(Engine.map.can_sr_to_space(game, ruDiv, teheran, AP)).toBe(true)
	Engine.map.apply_sr_control_effects(game, ruDiv, findSpace("Meshed"), teheran, AP)

	expect(Engine.map.is_controlled_by(game, teheran, AP)).toBe(true)
})

test("AP SR cannot enter or pass through a friendly-controlled space occupied by a CP Tribe", () => {
	let game = setupGame(2026051511, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let brDiv = place(game, AP, "BR DIV #1", "Abadan")
	place(game, CP, "Marsh #1", "Basra")
	for (let name of ["Abadan", "Basra", "Qurna"]) control(game, name, AP)

	let abadan = findSpace("Abadan")
	let basra = findSpace("Basra")
	let qurna = findSpace("Qurna")

	expect(Engine.map.can_sr_to_space(game, brDiv, basra, AP)).toBe(false)
	expect(Engine.map.has_sr_path(game, brDiv, abadan, qurna, AP, false)).toBe(false)
	expect(Engine.map.can_sr_to_space(game, brDiv, qurna, AP)).toBe(false)
	expect(Engine.map.get_sr_destinations(game, brDiv, AP)).not.toContain(basra)
	expect(Engine.map.get_sr_destinations(game, brDiv, AP)).not.toContain(qurna)
})

test("Reserve SR capital restriction uses enemy control only and respects dual nationality", () => {
	let game = setupGame(2026050908, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events.bulgaria = true

	let buDiv = reserve(game, CP, "BU DIV #1")
	let combined = reserve(game, CP, "Combined BU/AH Div")

	control(game, "SOFIA", AP)

	expect(Engine.map.can_sr_piece(game, buDiv, CP)).toBe(false)
	expect(Engine.map.can_sr_piece(game, combined, CP)).toBe(true)
})

test("Balkan-only RU/SB Yugo Infantry cannot SR to The Bosphorus Forts", () => {
	let game = setupGame(2026052801, "Historical", { no_supply_warnings: true })
	clearBoard(game)

	let yugo = place(game, AP, "RU/SB Yugo Infantry", "CONSTANTINOPLE")
	for (let name of ["CONSTANTINOPLE", "The Bosphorus Forts", "Odessa"]) control(game, name, AP)

	let bosphorus = findSpace("The Bosphorus Forts")
	expect(Engine.data.pieces[yugo].region_limit).toBe("B")
	expect(Engine.map.is_anatolia(bosphorus)).toBe(true)
	expect(Engine.map.can_enter_area(game, yugo, bosphorus)).toBe(false)
	expect(Engine.map.can_sr_to_space(game, yugo, bosphorus, AP)).toBe(false)
	expect(Engine.map.get_sr_destinations(game, yugo, AP)).not.toContain(bosphorus)
})

test("Balkan collapse SR destinations are filtered through normal SR path legality", () => {
	let game = setupGame(2026050909, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.events.bulgaria = true

	let german11 = place(game, CP, "German 11th Army", "SOFIA")
	for (let name of ["SOFIA", "BELGRADE"]) control(game, name, CP)
	control(game, "Nis", AP)
	control(game, "Skopje", AP)

	expect(Engine.collapse.get_collapse_sr_destination_spaces(game, german11)).not.toContain(findSpace("BELGRADE"))

	control(game, "Nis", CP)
	expect(Engine.collapse.get_collapse_sr_destination_spaces(game, german11)).toContain(findSpace("BELGRADE"))
})
