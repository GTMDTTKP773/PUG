const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, findCpPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const CP_ROLE = rules.roles[1]

function setupEgyptRevoltGame(spaceName) {
	const game = setupGame(26053011, "Historical", { no_supply_warnings: true })
	const unit = findCpPiece("TU-A DIV #10")

	clearBoard(game)
	game.seed = 6
	game.active = CP
	game.state = "jihad_rebellion_check"
	game.jihad = 11
	game.events = {
		pan_turkism: true,
		liberate_suez_active: true
	}
	game.pieces[unit] = findSpace(spaceName)

	return { game, unit }
}

test("CP regular units on the Suez Canal count as in Egypt for Jihad revolt ratings", () => {
	for (let spaceName of ["Port Said", "Ismailia", "Suez"]) {
		const { game } = setupEgyptRevoltGame(spaceName)
		expect(Engine.jihad.has_cp_regular_in_country(game, "Egypt")).toBe(true)
	}
})

test("CP regular units in Sinai do not count as in Egypt for Jihad revolt ratings", () => {
	const { game } = setupEgyptRevoltGame("Romani")
	expect(Engine.jihad.has_cp_regular_in_country(game, "Egypt")).toBe(false)
})

test("Egypt revolt uses the 12 target when a CP regular is on the Suez Canal", () => {
	let { game } = setupEgyptRevoltGame("Port Said")

	game = rules.action(game, CP_ROLE, "rebel_egypt")

	expect(game.jihad_revolt_egypt).toBe(true)
	expect(game.events.egyptian_rebellion).toBe(true)
	expect(game.jihad).toBe(13)
	expect(game.state).toBe("place_egyptian_rebellion")
})

test("India revolt logs each Indian unit kill roll and direct eliminated-box PE", () => {
	let game = setupGame(26053012, "Historical", { no_supply_warnings: true })
	clearBoard(game)
	game.seed = 1
	game.active = CP
	game.state = "jihad_rebellion_check"
	game.jihad = 20
	game.events = {
		pan_turkism: true,
		indian_mutiny: true
	}

	for (let p = 1; p < Engine.data.pieces.length; p++) {
		if (Engine.data.pieces[p]?.nation === "in") game.pieces[p] = Engine.game_utils.get_removed_box(AP)
	}
	let inDiv1 = findPiece(AP, "IN DIV #1")
	let inDiv2 = findPiece(AP, "IN DIV #2")
	let inDiv3 = findPiece(AP, "IN DIV #3")
	let inTigris = findPiece(AP, "IN Tigris Corps")
	let mutiny1 = findPiece(CP, "Indian Mutiny #1")
	let mutiny2 = findPiece(CP, "Indian Mutiny #2")
	let mutiny3 = findPiece(CP, "Indian Mutiny #3")
	let india = findSpace("INDIA")
	game.pieces[inDiv1] = india
	game.pieces[inDiv2] = findSpace("Baluchistan")
	game.pieces[inDiv3] = Engine.game_utils.get_eliminated_box(AP)
	game.pieces[inTigris] = Engine.game_utils.get_lcu_reserve_box(AP)

	game = rules.action(game, CP_ROLE, "rebel_india")

	expect(game.log).toContain(`印度哗变：p${inDiv1} 掷骰 1 -> 永久消灭`)
	expect(game.log).toContain(`印度哗变：P${inDiv2} 掷骰 5 -> 无效果`)
	expect(game.log).toContain(`印度哗变：P${inDiv3} 已在消灭格 -> 永久消灭`)
	expect(game.log.some((entry) => entry.includes(`P${inTigris}`) || entry.includes(`p${inTigris}`))).toBe(false)
	expect(Engine.game_utils.is_permanently_eliminated(game, inTigris)).toBe(false)
	expect(game.pieces[inTigris]).toBe(Engine.game_utils.get_lcu_reserve_box(AP))
	expect(game.pieces[mutiny1]).toBe(india)
	expect(game.pieces[mutiny2]).toBe(india)
	expect(game.pieces[mutiny3]).toBe(india)
})
