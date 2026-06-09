const Engine = require("../modules/engine.js")
const rules = require("../rules.js")
const { setupGame, findSpace, findCpPiece: findPiece, clearBoard } = require("./helpers.js")
const { CP } = Engine.constants

test("2 TU SCU + 1 TUA SCU can combine into TU LCU", () => {
	let game = setupGame(2026050901)
	let constantinople = findSpace("Constantinople")

	clearBoard(game)
	game.pieces[findPiece("TU DIV #1")] = constantinople
	game.pieces[findPiece("TU DIV #2")] = constantinople
	game.pieces[findPiece("TU-A DIV #1")] = constantinople
	game.moved = []

	let tuCorps = findPiece("TU I Corps")
	game.pieces[tuCorps] = 0

	let scu_ids = [findPiece("TU DIV #1"), findPiece("TU DIV #2"), findPiece("TU-A DIV #1")]
	let result = Engine.game_utils.get_combination_options_for_lcu(game, tuCorps, scu_ids, constantinople)

	expect(result).not.toBeNull()
	expect(result.type).toBe("full")
	expect(result.pieces).toHaveLength(3)
})

test("2 TU SCU + 1 TUA SCU can combine into TUA LCU", () => {
	let game = setupGame(2026050903)
	let constantinople = findSpace("Constantinople")

	clearBoard(game)
	game.pieces[findPiece("TU DIV #1")] = constantinople
	game.pieces[findPiece("TU DIV #2")] = constantinople
	game.pieces[findPiece("TU-A DIV #1")] = constantinople
	game.moved = []

	let tuaCorps = findPiece("TU-A VI Corps")
	game.pieces[tuaCorps] = 0

	let scu_ids = [findPiece("TU DIV #1"), findPiece("TU DIV #2"), findPiece("TU-A DIV #1")]
	let result = Engine.game_utils.get_combination_options_for_lcu(game, tuaCorps, scu_ids, constantinople)

	expect(result).not.toBeNull()
	expect(result.type).toBe("full")
	expect(result.pieces).toHaveLength(3)
})

test("Arab Desertion blocks TUA LCU as a combination target but still allows TUA SCUs", () => {
	let game = setupGame(2026060901)
	let constantinople = findSpace("Constantinople")

	clearBoard(game)
	game.events.arab_desertion = true
	game.pieces[findPiece("TU DIV #1")] = constantinople
	game.pieces[findPiece("TU DIV #2")] = constantinople
	game.pieces[findPiece("TU-A DIV #1")] = constantinople
	game.moved = []

	let tuCorps = findPiece("TU I Corps")
	let tuaCorps = findPiece("TU-A VI Corps")
	game.pieces[tuCorps] = 0
	game.pieces[tuaCorps] = 0

	let scu_ids = [findPiece("TU DIV #1"), findPiece("TU DIV #2"), findPiece("TU-A DIV #1")]
	let tuResult = Engine.game_utils.get_combination_options_for_lcu(game, tuCorps, scu_ids, constantinople)
	let tuaResult = Engine.game_utils.get_combination_options_for_lcu(game, tuaCorps, scu_ids, constantinople)

	expect(tuResult).not.toBeNull()
	expect(tuResult.type).toBe("full")
	expect(tuResult.pieces).toContain(findPiece("TU-A DIV #1"))
	expect(tuaResult).toBeNull()
})

test("2 TUA SCU + 1 TU SCU cannot combine into TU LCU", () => {
	let game = setupGame(2026050902)
	let constantinople = findSpace("Constantinople")

	clearBoard(game)
	game.pieces[findPiece("TU-A DIV #1")] = constantinople
	game.pieces[findPiece("TU-A DIV #2")] = constantinople
	game.pieces[findPiece("TU DIV #1")] = constantinople
	game.moved = []

	let tuCorps = findPiece("TU I Corps")
	game.pieces[tuCorps] = 0

	let scu_ids = [findPiece("TU-A DIV #1"), findPiece("TU-A DIV #2"), findPiece("TU DIV #1")]
	let result = Engine.game_utils.get_combination_options_for_lcu(game, tuCorps, scu_ids, constantinople)

	expect(result).toBeNull()
})

test("Turkish Reinforcements 81 combination stays limited to event LCUs after clearing selection", () => {
	let game = setupGame(2026051101)
	let constantinople = findSpace("Constantinople")
	let corpsReserve = findSpace("CP Corps Assets")
	let eventLcu = findPiece("TU XIV Corps")
	let otherLcu = findPiece("TU I Corps")
	let scus = [findPiece("TU DIV #1"), findPiece("TU DIV #2"), findPiece("TU DIV #3")]

	clearBoard(game)
	for (let p of scus) game.pieces[p] = constantinople
	game.pieces[eventLcu] = corpsReserve
	game.pieces[otherLcu] = corpsReserve
	game.moved = []
	game.active = CP
	game.state = "combine_lcu"
	game.where = constantinople
	game.event_ctx = { key: "turkish_reinf_81", data: {} }
	game.combine_ctx = {
		selected_scus: [],
		allowed_lcus: [eventLcu],
		event_flag_on_success: { key: "turkish_reinf_81", field: "combine_used" }
	}

	let role = rules.roles[1]
	game = rules.action(game, role, "piece", scus[0])
	game = rules.action(game, role, "clear")

	expect(game.combine_ctx.selected_scus).toEqual([])
	expect(game.combine_ctx.allowed_lcus).toEqual([eventLcu])
	expect(game.combine_ctx.event_flag_on_success).toEqual({ key: "turkish_reinf_81", field: "combine_used" })

	for (let p of scus) game = rules.action(game, role, "piece", p)
	game = rules.action(game, role, "select_lcu")
	expect(game.state).toBe("combine_lcu_select_lcu")

	game = rules.action(game, role, "piece", otherLcu)
	expect(game.state).toBe("combine_lcu_select_lcu")
	expect(game.combine_ctx.lcu_id).toBeUndefined()

	game = rules.action(game, role, "piece", eventLcu)
	expect(game.state).toBe("combine_lcu_dispose_reserve")
	expect(game.combine_ctx.lcu_id).toBe(eventLcu)
})

test("Turkish Reinforcements 81 places the two event SCUs after the reserve corps", () => {
	let game = setupGame(2026052404, "Historical", { no_supply_warnings: true })
	let role = rules.roles[1]
	let corpsReserve = findSpace("CP Corps Assets")
	let scuReserve = findSpace("CP Reserve")
	let units = [
		"TU XIV Corps",
		"TU XV Corps",
		"TU XVI Corps",
		"TU XVII Corps",
		"TU-A XVIII Corps",
		"TU DIV #18",
		"TU-A DIV #15"
	]

	game.active = CP
	game.state = "play_card"
	game.hand_cp = [81]

	expect(rules.view(game, role).actions.play_event).toContain(81)
	game = rules.action(game, role, "play_event", 81)

	expect(game.state).toBe("event_place_reinforcements")
	expect(game.event_ctx.data.reinf_to_place).toEqual(units)
	expect(Engine.data.pieces[findPiece("TU DIV #18")].piece_class).toBe("SCU")
	expect(Engine.data.pieces[findPiece("TU-A DIV #15")].piece_class).toBe("SCU")

	for (let unit of units) {
		let target = unit.includes("Corps") ? corpsReserve : scuReserve
		expect(game.event_ctx.data.reinf_to_place[0]).toBe(unit)
		expect(rules.view(game, role).actions.space).toContain(target)
		game = rules.action(game, role, "space", target)
	}

	expect(game.state).toBe("event_turkish_reinf_81_combine")
	for (let unit of units) {
		let p = findPiece(unit)
		expect(Engine.game_utils.is_reinforcement(game, p)).toBe(false)
		expect(game.pieces[p]).toBe(unit.includes("Corps") ? corpsReserve : scuReserve)
	}
})
