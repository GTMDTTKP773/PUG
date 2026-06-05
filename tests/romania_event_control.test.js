const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece } = require("./helpers.js")

const eventStates = Engine.event_states.states

const { AP, CP, REINFORCEMENTS } = Engine.constants

function createEventStateRules(game) {
	return {
		...rules,
		can_activate_piece_in_space_to_attack(p, s) {
			return Engine.combat.can_activate_piece_in_space_to_attack(
				game,
				p,
				s,
				game.active,
				() => Engine.game_utils.get_season(game),
				rules.is_rail_connected_to_supply
			)
		},
		get_season(targetGame) {
			return Engine.game_utils.get_season(targetGame)
		}
	}
}

test("Romania 入场前处于中立展示位的 Alpenkorps 不能执行 SR", () => {
	let game = setupGame(2026041814, "Historical")
	let geAlpen = findPiece(CP, "GE Alpenkorps")

	expect(game.pieces[geAlpen]).toBe(findSpace("Vidin"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geAlpen)).toBe("neutral")
	expect(Engine.map.can_sr_piece(game, geAlpen, CP)).toBe(false)
	expect(Engine.map.get_sr_destinations(game, geAlpen, CP)).toEqual([])
})

test("Bulgaria 已参战后打出 Romania 不会把已经在地图上的 Alpenkorps 拉回 Galicia，并把 Combined BU/AH Div 放入保加利亚", () => {
	let game = setupGame(2026041702, "Historical")
	let bulgariaEvent = Engine.events.get_event_by_id(88)
	let romaniaEvent = Engine.events.get_event_by_id(29)
	let geAlpen = findPiece(CP, "GE Alpenkorps")
	let geDiv1 = findPiece(CP, "GE DIV #1")
	let geDiv2 = findPiece(CP, "GE DIV #2")
	let geDiv3 = findPiece(CP, "GE DIV #3")
	let geDiv4 = findPiece(CP, "GE DIV #4")
	let ahDiv1 = findPiece(CP, "AH DIV #1")
	let ahDiv2 = findPiece(CP, "AH DIV #2")
	let ahDiv3 = findPiece(CP, "AH DIV #3")
	let ahDiv4 = findPiece(CP, "AH DIV #4")
	let ahDiv5 = findPiece(CP, "AH DIV #5")
	let ahDiv6 = findPiece(CP, "AH DIV #6")

	bulgariaEvent.handler(game)
	expect(game.pieces[geAlpen]).toBe(findSpace("Vidin"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geAlpen)).toBe(CP)
	expect(game.pieces[geDiv1]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv2]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geDiv1)).toBe(CP)
	expect(Engine.game_utils.get_piece_effective_faction(game, geDiv2)).toBe(CP)
	expect(game.pieces[ahDiv1]).toBe(findSpace("Galicia"))
	expect(game.pieces[ahDiv2]).toBe(findSpace("CP Reserve"))

	romaniaEvent.handler(game)

	expect(game.pieces[geAlpen]).toBe(findSpace("Vidin"))
	expect(game.pieces[geDiv1]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv2]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv3]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv4]).toBe(REINFORCEMENTS)
	expect(game.pieces[ahDiv1]).toBe(findSpace("Galicia"))
	expect(game.pieces[ahDiv2]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[ahDiv3]).toBe(findSpace("Hermannstadt"))
	expect(game.pieces[ahDiv4]).toBe(findSpace("Hermannstadt"))
	expect(game.pieces[ahDiv5]).toBe(REINFORCEMENTS)
	expect(game.pieces[ahDiv6]).toBe(REINFORCEMENTS)
	expect(game.pieces[findPiece(CP, "Combined BU/AH Div")]).toBe(findSpace("CP Reserve"))
	expect(game.state).toBe("event_romania_place_combined_bu_ah")
	expect(game.active).toBe(CP)
})

test("Romania 入场前的 Bull's Eye 清理不会提前挪走 Alpenkorps，且事件后仍会正常解锁到 Galicia", () => {
	let game = setupGame(2026041712, "Historical")
	let romaniaEvent = Engine.events.get_event_by_id(29)
	let geAlpen = findPiece(CP, "GE Alpenkorps")
	let geDiv2 = findPiece(CP, "GE DIV #2")
	let geDiv3 = findPiece(CP, "GE DIV #3")
	let geDiv4 = findPiece(CP, "GE DIV #4")
	let ahDiv2 = findPiece(CP, "AH DIV #2")
	let ahDiv3 = findPiece(CP, "AH DIV #3")
	let ahDiv4 = findPiece(CP, "AH DIV #4")

	expect(game.pieces[geAlpen]).toBe(findSpace("Vidin"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geAlpen)).toBe("neutral")

	Engine.events.bulls_eye_cleanup_scus(game)

	expect(game.pieces[geAlpen]).toBe(findSpace("Vidin"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geAlpen)).toBe("neutral")

	romaniaEvent.handler(game)

	expect(game.pieces[geAlpen]).toBe(findSpace("Galicia"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geAlpen)).toBe(CP)
	expect(game.pieces[geDiv2]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geDiv2)).toBe(CP)
	expect(game.pieces[geDiv3]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv4]).toBe(REINFORCEMENTS)
	expect(game.pieces[ahDiv2]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, ahDiv2)).toBe(CP)
	expect(game.pieces[ahDiv3]).toBe(findSpace("Hermannstadt"))
	expect(game.pieces[ahDiv4]).toBe(findSpace("Hermannstadt"))
})

test("Romania 事件会在 BU 未参战时自动放置 Combined BU/AH Div 至预备格，然后复用标准激活界面并强制完成攻击", () => {
	let game = setupGame(2026041713, "Historical")
	let romaniaEvent = Engine.events.get_event_by_id(29)
	let stateRules = createEventStateRules(game)
	let geDiv1 = findPiece(CP, "GE DIV #1")
	let geDiv2 = findPiece(CP, "GE DIV #2")
	let geDiv3 = findPiece(CP, "GE DIV #3")
	let geDiv4 = findPiece(CP, "GE DIV #4")
	let ahDiv1 = findPiece(CP, "AH DIV #1")
	let ahDiv2 = findPiece(CP, "AH DIV #2")
	let ahDiv3 = findPiece(CP, "AH DIV #3")
	let ahDiv4 = findPiece(CP, "AH DIV #4")
	let ahDiv5 = findPiece(CP, "AH DIV #5")
	let ahDiv6 = findPiece(CP, "AH DIV #6")

	romaniaEvent.handler(game)
	expect(game.pieces[geDiv1]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geDiv1)).toBe("neutral")
	expect(game.pieces[geDiv2]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, geDiv2)).toBe(CP)
	expect(game.pieces[geDiv3]).toBe(findSpace("CP Reserve"))
	expect(game.pieces[geDiv4]).toBe(REINFORCEMENTS)
	expect(game.pieces[ahDiv1]).toBe(findSpace("Galicia"))
	expect(Engine.game_utils.get_piece_effective_faction(game, ahDiv1)).toBe("neutral")
	expect(game.pieces[ahDiv2]).toBe(findSpace("CP Reserve"))
	expect(Engine.game_utils.get_piece_effective_faction(game, ahDiv2)).toBe(CP)
	expect(game.pieces[ahDiv3]).toBe(findSpace("Hermannstadt"))
	expect(game.pieces[ahDiv4]).toBe(findSpace("Hermannstadt"))
	expect(game.pieces[ahDiv5]).toBe(REINFORCEMENTS)
	expect(game.pieces[ahDiv6]).toBe(REINFORCEMENTS)
	expect(game.pieces[findPiece(CP, "Combined BU/AH Div")]).toBe(findSpace("CP Reserve"))
	expect(game.state).toBe("activate_spaces")
	expect(game.active).toBe(AP)

	let view = rules.view(game, "ap")
	expect(view.prompt).toContain("罗马尼亚")
	let sourceSpaces = view.actions.activate_attack || []
	expect(sourceSpaces.length).toBeGreaterThan(0)
	expect(view.actions.activate_move).toBeUndefined()

	game = rules.action(game, "ap", "activate_attack", sourceSpaces[0])
	expect(game.state).toBe("attack")
	expect(game.activated.attack).toEqual([sourceSpaces[0]])
	expect(game.event_romania_attack_required).toBe(true)
	expect(game.event_next_state).toBe("event_romania_attack_cleanup")
	expect(game.attack).toBeUndefined()

	game = rules.action(game, "ap", "end_attack")
	expect(game.state).toBe("attack")

	game.state = "event_romania_attack_cleanup"
	eventStates.event_romania_attack_cleanup.done({ game, rules: stateRules })
	expect(game.state).toBe("confirm_event")
	expect(game.attack).toBeUndefined()
	expect(game.activated).toBeUndefined()
	expect(game.event_romania_attack_required).toBeUndefined()
	expect(game.event_next_state).toBeUndefined()
})

test("Romania 事件在 BU 已参战时让 CP 选择 Combined BU/AH 师放置至保加利亚地块", () => {
	let game = setupGame(2026041715, "Historical")
	game.events["bulgaria"] = true
	let romaniaEvent = Engine.events.get_event_by_id(29)
	let combinedBuAh = findPiece(CP, "Combined BU/AH Div")

	romaniaEvent.handler(game)
	expect(game.pieces[combinedBuAh]).toBe(findSpace("CP Reserve"))
	expect(game.state).toBe("event_romania_place_combined_bu_ah")
	expect(game.active).toBe(CP)

	let cpView = rules.view(game, "cp")
	let buSpaces = cpView.actions.space || []
	expect(buSpaces.length).toBeGreaterThan(0)
	let sofia = findSpace("SOFIA")
	let vidin = findSpace("Vidin")
	expect(buSpaces).toContain(sofia)
	expect(buSpaces).not.toContain(vidin)

	game = rules.action(game, "cp", "space", vidin)
	expect(game.pieces[combinedBuAh]).toBe(findSpace("CP Reserve"))
	expect(game.state).toBe("event_romania_place_combined_bu_ah")

	game = rules.action(game, "cp", "space", sofia)
	expect(game.pieces[combinedBuAh]).toBe(sofia)
	expect(game.state).toBe("activate_spaces")
	expect(game.active).toBe(AP)
})
