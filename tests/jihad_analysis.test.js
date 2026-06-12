"use strict"

const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findCpPiece, clearBoard } = require("./helpers.js")

const { CP } = Engine.constants

test("Jihad analysis exposes exact revolt odds without consuming randomness", () => {
	let game = setupGame(2026061201, "Historical", { no_supply_warnings: true })
	let unit = findCpPiece("TU-A DIV #10")
	clearBoard(game)
	game.seed = 6
	game.active = CP
	game.state = "jihad_rebellion_check"
	game.jihad = 11
	game.events = {
		pan_turkism: true,
		liberate_suez_active: true
	}
	game.pieces[unit] = findSpace("Port Said")

	let before = JSON.stringify(game)
	let analysis = rules.analysis.jihad_analysis(game, CP)
	let egypt = analysis.revolts.find((row) => row.country === "Egypt")
	let india = analysis.revolts.find((row) => row.country === "India")

	expect(analysis).toMatchObject({
		schema: "pug-ai.jihad_analysis.v1",
		state: "jihad_rebellion_check",
		active: CP,
		role: CP,
		level: 11
	})
	expect(analysis.cities).toHaveLength(6)
	expect(egypt).toMatchObject({
		action: "rebel_egypt",
		prerequisite: true,
		completed: false,
		selectable: true,
		cp_regular_present: true,
		target: 12,
		die_needed: 1,
		success_faces: 6,
		success_probability: 1,
		reward: {
			jihad_delta: 2,
			uprising_units: 3
		}
	})
	expect(egypt.success_rolls).toEqual([1, 2, 3, 4, 5, 6])
	expect(india.prerequisite).toBe(false)
	expect(india.selectable).toBe(false)
	expect(JSON.stringify(game)).toBe(before)
})

test("Jihad analysis enumerates and validates tribe placement packages", () => {
	let game = setupGame(2026061202, "Historical", { no_supply_warnings: true })
	game.active = CP
	game.state = "jihad_placement"
	game.tribes_to_place = 1
	game.selected_piece = null

	let before = JSON.stringify(game)
	let analysis = rules.analysis.jihad_analysis(game, CP)
	let package_row = analysis.placement_packages.find(
		(row) => row.destination_before.control === Engine.constants.AP && row.destination_before.vp > 0
	)

	expect(analysis.pending).toMatchObject({ placements: 1, selected_piece: null })
	expect(analysis.tribes.total).toBe(14)
	expect(analysis.tribes.available).toBeGreaterThan(0)
	expect(analysis.tribes.on_map).toBe(0)
	expect(analysis.tribes.difference_to_level).toBe(0)
	expect(analysis.placement_packages.length).toBeGreaterThan(20)
	expect(package_row).toBeTruthy()
	expect(package_row.valid).toBe(true)
	expect(package_row.sequence).toEqual([
		["piece", package_row.piece],
		["space", package_row.destination]
	])
	expect(package_row.piece_context).toMatchObject({
		id: package_row.piece,
		type: "tribe",
		on_map: false,
		in_reserve: true
	})
	expect(package_row.destination_after.pieces).toContain(package_row.piece)
	expect(package_row.tribes_to_place_delta).toBe(-1)
	expect(JSON.stringify(game)).toBe(before)
})

test("Jihad analysis reports selected-tribe continuations as one-step packages", () => {
	let game = setupGame(2026061203, "Historical", { no_supply_warnings: true })
	game.active = CP
	game.state = "jihad_placement"
	game.tribes_to_place = 2
	let piece = rules.view(game, CP).actions.piece[0]
	game.selected_piece = piece

	let analysis = rules.analysis.jihad_analysis(game, CP)

	expect(analysis.pending.selected_piece).toBe(piece)
	expect(analysis.placement_packages.length).toBeGreaterThan(0)
	expect(analysis.placement_packages.every((row) => row.piece === piece)).toBe(true)
	expect(analysis.placement_packages.every((row) => row.sequence.length === 1)).toBe(true)
	expect(analysis.placement_packages.every((row) => row.sequence[0][0] === "space")).toBe(true)
})
