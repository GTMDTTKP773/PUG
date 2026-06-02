const Engine = require("../modules/engine.js")
const { findSpace, findPiece } = require("./helpers.js")

const eventStates = Engine.event_states.states

const { AP, CP, RESERVE } = Engine.constants

function createGame() {
	const game = Engine.setup.create_game(1, "Historical", {})
	game.turn = 6
	game.log = []
	game.events = {}
	game.control = Array(Engine.data.spaces.length).fill(null)
	return game
}

function makeLogger(game) {
	return (msg) => game.log.push(msg)
}

function setControl(game, spaceName, faction) {
	game.control[findSpace(spaceName)] = faction
}

function placePiece(game, faction, name, spaceName) {
	const piece = findPiece(faction, name)
	game.pieces[piece] = findSpace(spaceName)
	return piece
}

function moveToReserve(game, faction, name) {
	const piece = findPiece(faction, name)
	game.pieces[piece] = RESERVE
	return piece
}

function createStateRules(game) {
	const phaseTransitions = []
	const stateLogs = []
	return {
		phaseTransitions,
		stateLogs,
		set_has: Engine.utils.set_has,
		set_add: Engine.utils.set_add,
		is_removed: (targetGame, piece) => Engine.game_utils.is_removed(targetGame, piece),
		push_undo() {},
		log(message) {
			stateLogs.push(message)
			game.log.push(message)
		},
		next_phase(phase) {
			phaseTransitions.push(phase)
		},
		remove_piece(piece) {
			return Engine.game_utils.remove_piece(game, piece, null)
		},
		eliminate_piece(piece, permanent) {
			return Engine.game_utils.eliminate_piece(game, piece, null, permanent)
		},
		move_piece(targetGame, piece, space) {
			targetGame.pieces[piece] = space
		}
	}
}

function getPiecesAction(res) {
	return res.get_action("piece") || []
}

function getSpacesAction(res) {
	return res.get_action("space") || []
}

function isRemoved(game, piece) {
	return Engine.game_utils.is_removed(game, piece)
}

describe("崩溃规则", () => {
	test("保加利亚崩溃时会用预备盒 GE 步兵 SCU 替换 German 11th Army", () => {
		const game = createGame()
		const log = makeLogger(game)
		const sofia = findSpace("SOFIA")
		const german11th = placePiece(game, CP, "German 11th Army", "SOFIA")
		const replacement = moveToReserve(game, CP, "GE DIV #1")

		game.events.bulgaria = true
		setControl(game, "SOFIA", AP)

		const handled = Engine.collapse.handle_national_collapse(game, log)

		expect(handled).toBe(false)
		expect(game.events.bulgarian_collapse).toBe(6)
		expect(isRemoved(game, german11th)).toBe(true)
		expect(game.pieces[replacement]).toBe(sofia)
	})

	test("塞尔维亚自愿崩溃在罗马尼亚未崩溃时进入 AH 选择步骤，并保留 2 个免费 SR 上限", () => {
		const game = createGame()
		const log = makeLogger(game)

		game.events.bulgaria = true
		game.events.romania = true
		for (let index = 1; index <= 6; index++) {
			moveToReserve(game, CP, `AH DIV #${index}`)
		}

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(game.events.serbian_collapse).toBe(6)
		expect(game.state).toBe("event_serbian_collapse_choice")
		expect(game.event_ctx).toMatchObject({
			collapse_nation: "serbia",
			choice_limit: 2,
			move_limit: 2
		})
	})

	test("塞尔维亚崩溃的 AH 选择提示只展示 Bulgaria 入场 AH 师，且不展示 AH 军级单位", () => {
		const game = createGame()
		const log = makeLogger(game)

		game.events.bulgaria = true
		game.events.romania = true
		moveToReserve(game, CP, "AH DIV #1")
		moveToReserve(game, CP, "AH DIV #4")
		moveToReserve(game, CP, "AH DIV #5")
		moveToReserve(game, CP, "AH VIII Corps")

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		const res = Engine.create_result(game)
		eventStates.event_serbian_collapse_choice.prompt({
			game,
			res,
			rules: createStateRules(game)
		})

		expect(getPiecesAction(res)).not.toContain(findPiece(CP, "AH DIV #1"))
		expect(getPiecesAction(res)).toContain(findPiece(CP, "AH DIV #4"))
		expect(getPiecesAction(res)).toContain(findPiece(CP, "AH DIV #5"))
		expect(getPiecesAction(res)).not.toContain(findPiece(CP, "AH DIV #6"))
		expect(getPiecesAction(res)).not.toContain(findPiece(CP, "AH VIII Corps"))
	})

	test("塞尔维亚崩溃不会把 Romania 事件带入的 AH 单位列入移除选择", () => {
		const game = createGame()
		const rules = createStateRules(game)

		Engine.neutral.trigger_bulgaria_entry(game)
		Engine.neutral.trigger_romania_entry(game)
		Engine.collapse.accept_voluntary_collapse(game, "serbia", rules.log)

		const romaniaAhUnits = ["AH VI R Corps", "AH DIV #1", "AH DIV #2", "AH DIV #3", "Combined BU/AH Div"].map((name) =>
			findPiece(CP, name)
		)
		const ahDiv4 = findPiece(CP, "AH DIV #4")
		const ahDiv5 = findPiece(CP, "AH DIV #5")
		const res = Engine.create_result(game)

		eventStates.event_serbian_collapse_choice.prompt({
			game,
			res,
			rules
		})

		for (const p of romaniaAhUnits) {
			expect(getPiecesAction(res)).not.toContain(p)
			expect(isRemoved(game, p)).toBe(false)
		}
		expect(getPiecesAction(res)).toEqual(expect.arrayContaining([ahDiv4, ahDiv5]))

		eventStates.event_serbian_collapse_choice.piece({ game, rules, arg: ahDiv4 })
		eventStates.event_serbian_collapse_choice.piece({ game, rules, arg: ahDiv5 })
		eventStates.event_serbian_collapse_choice.confirm({ game, rules })

		for (const p of romaniaAhUnits) {
			expect(isRemoved(game, p)).toBe(false)
		}
		expect(isRemoved(game, ahDiv4)).toBe(true)
		expect(isRemoved(game, ahDiv5)).toBe(true)
	})

	test("塞尔维亚崩溃不会把保加利亚单位永久消灭，但仍会移除保加利亚入场的 GE/AH 单位", () => {
		const game = createGame()
		const log = makeLogger(game)
		const buArmy = placePiece(game, CP, "BU 1 Army", "Vidin")
		const geCorps = placePiece(game, CP, "GE IV R Corps", "Vidin")

		game.events.bulgaria = true

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(game.pieces[buArmy]).toBe(findSpace("Vidin"))
		expect(Engine.game_utils.is_permanently_eliminated(game, buArmy)).toBe(false)
		expect(isRemoved(game, geCorps)).toBe(true)
		expect(Engine.game_utils.is_permanently_eliminated(game, geCorps)).toBe(false)
	})

	test("塞尔维亚崩溃在罗马尼亚未参战时保留两个 GE 步兵师并移除 Alpenkorps", () => {
		const game = createGame()
		const log = makeLogger(game)
		const geAlpenkorps = placePiece(game, CP, "GE Alpenkorps", "Vidin")
		const geDiv1 = moveToReserve(game, CP, "GE DIV #1")
		const geDiv2 = moveToReserve(game, CP, "GE DIV #2")

		game.events.bulgaria = true

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(isRemoved(game, geAlpenkorps)).toBe(true)
		expect(isRemoved(game, geDiv1)).toBe(false)
		expect(isRemoved(game, geDiv2)).toBe(false)
	})

	test("塞尔维亚崩溃在罗马尼亚未崩溃时仍会自动移除保加利亚入场 AH 军级单位", () => {
		const game = createGame()
		const log = makeLogger(game)
		const ah8 = placePiece(game, CP, "AH VIII Corps", "Galicia")
		const ah22 = placePiece(game, CP, "AH XXII R Corps", "Galicia")
		const ahDiv4 = moveToReserve(game, CP, "AH DIV #4")
		const ahDiv5 = moveToReserve(game, CP, "AH DIV #5")

		game.events.bulgaria = true
		game.events.romania = true

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(isRemoved(game, ah8)).toBe(true)
		expect(isRemoved(game, ah22)).toBe(true)
		expect(isRemoved(game, ahDiv4)).toBe(false)
		expect(isRemoved(game, ahDiv5)).toBe(false)
		expect(game.state).toBe("event_serbian_collapse_choice")
	})

	test("塞尔维亚崩溃会把 SB 单位放进 Removed Box，The Serbs Return 可从 Removed Box 放回", () => {
		const game = createGame()
		const log = makeLogger(game)
		const sbArmy = placePiece(game, AP, "SB 1 Army", "BELGRADE")
		const sbDiv = placePiece(game, AP, "SB DIV #1", "Nis")

		game.events.bulgaria = true

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(Engine.game_utils.is_removed_only(game, sbArmy)).toBe(true)
		expect(Engine.game_utils.is_permanently_eliminated(game, sbArmy)).toBe(false)
		expect(Engine.game_utils.is_removed_only(game, sbDiv)).toBe(true)
		expect(Engine.game_utils.is_permanently_eliminated(game, sbDiv)).toBe(false)

		let serbsReturn = Engine.events.get_event_by_id(24)
		serbsReturn.handler(game, {})

		expect(game.state).toBe("event_place_reinforcements")
		expect(game.events["the_serbs_return"]).toBe(game.turn)

		const apReserve = Engine.game_utils.get_lcu_reserve_box(AP)
		Engine.events.reinforce(game, "SB 1 Army", AP, apReserve)
		expect(game.pieces[sbArmy]).toBe(apReserve)
	})

	test("Serbian collapse preserves already permanently eliminated SB units", () => {
		const game = createGame()
		const log = makeLogger(game)
		const sbArmy = placePiece(game, AP, "SB 1 Army", "BELGRADE")
		const sbDiv = placePiece(game, AP, "SB DIV #1", "Nis")

		game.events.bulgaria = true
		Engine.game_utils.eliminate_piece(game, sbArmy, log, true)
		Engine.game_utils.eliminate_piece(game, sbDiv, log, true)

		Engine.collapse.accept_voluntary_collapse(game, "serbia", log)

		expect(Engine.game_utils.is_permanently_eliminated(game, sbArmy)).toBe(true)
		expect(Engine.game_utils.is_removed_only(game, sbArmy)).toBe(false)
		expect(Engine.game_utils.is_permanently_eliminated(game, sbDiv)).toBe(true)
		expect(Engine.game_utils.is_removed_only(game, sbDiv)).toBe(false)
	})

	test("罗马尼亚崩溃的选择提示展示可移除 AH 师，且自动移除 AH VI R Corps", () => {
		const game = createGame()
		const log = makeLogger(game)

		game.events.romania = true
		game.events.bulgaria = true
		const ahCorps = placePiece(game, CP, "AH VI R Corps", "Galicia")
		moveToReserve(game, CP, "Combined BU/AH Div")
		moveToReserve(game, CP, "AH DIV #1")
		moveToReserve(game, CP, "AH DIV #2")
		moveToReserve(game, CP, "AH DIV #3")
		moveToReserve(game, CP, "AH DIV #4")
		moveToReserve(game, CP, "AH DIV #5")

		Engine.collapse.accept_voluntary_collapse(game, "romania", log)

		const res = Engine.create_result(game)
		eventStates.event_romanian_collapse_choice.prompt({
			game,
			res,
			rules: createStateRules(game)
		})

		expect(game.state).toBe("event_romanian_collapse_choice")
		expect(isRemoved(game, ahCorps)).toBe(true)
		expect(getPiecesAction(res)).toContain(findPiece(CP, "Combined BU/AH Div"))
		expect(getPiecesAction(res)).toContain(findPiece(CP, "AH DIV #3"))
		expect(getPiecesAction(res)).toContain(findPiece(CP, "AH DIV #4"))
		expect(getPiecesAction(res)).toContain(findPiece(CP, "AH DIV #5"))
		expect(getPiecesAction(res)).not.toContain(findPiece(CP, "AH DIV #6"))
		expect(getPiecesAction(res)).not.toContain(findPiece(CP, "AH VI R Corps"))
	})

	test("崩溃后的免费 SR 达到 2 个单位后不再提供新的单位或目标地块", () => {
		const game = createGame()
		const movedA = placePiece(game, CP, "German 11th Army", "SOFIA")
		const movedB = placePiece(game, CP, "GE Mackenson HQ", "BELGRADE")
		placePiece(game, CP, "BU 1 Army", "Skopje")
		setControl(game, "SOFIA", CP)
		setControl(game, "BELGRADE", CP)
		setControl(game, "Skopje", CP)

		game.state = "event_serbian_collapse_sr"
		game.event_ctx = {
			move_limit: 2,
			data: { moved: [movedA, movedB] }
		}

		const res = Engine.create_result(game)
		eventStates.event_serbian_collapse_sr.prompt({
			game,
			res,
			rules: createStateRules(game)
		})

		expect(getPiecesAction(res)).toEqual([])
		expect(getSpacesAction(res)).toEqual([])
		expect(res.has_action("done")).toBe(true)
	})

	test("罗马尼亚满足三座关键城市失守时会自动崩溃", () => {
		const game = createGame()
		const log = makeLogger(game)
		const geCav = placePiece(game, CP, "GE Schmettow", "Ploesti")
		placePiece(game, AP, "RO 1 Army", "BUCHAREST")

		game.events.romania = true
		setControl(game, "BUCHAREST", CP)
		setControl(game, "Ploesti", CP)
		setControl(game, "Constanta", CP)

		const handled = Engine.collapse.handle_national_collapse(game, log)

		expect(handled).toBe(false)
		expect(game.events.romania_collapse).toBe(6)
		expect(game.state).not.toBe("event_romanian_collapse_sr")
		expect(isRemoved(game, geCav)).toBe(true)
		expect(Engine.game_utils.is_permanently_eliminated(game, geCav)).toBe(false)
	})

	test("Romanian collapse clears delayed Schmettow entry", () => {
		const game = createGame()
		const log = makeLogger(game)
		const geCav = findPiece(CP, "GE Schmettow")
		const frDiv = findPiece(AP, "FR DIV #7")

		game.events.romania = true
		game.delayed_reinforcements = [
			{ turn: game.turn + 1, piece: geCav, space: findSpace("Galicia") },
			{ turn: game.turn + 1, piece: frDiv, space: findSpace("Lemnos") }
		]
		setControl(game, "BUCHAREST", CP)
		setControl(game, "Ploesti", CP)
		setControl(game, "Constanta", CP)

		const handled = Engine.collapse.handle_national_collapse(game, log)

		expect(handled).toBe(false)
		expect(isRemoved(game, geCav)).toBe(true)
		expect(game.delayed_reinforcements).toEqual([{ turn: game.turn + 1, piece: frDiv, space: findSpace("Lemnos") }])
	})

	test("罗马尼亚三座关键城市失守时即使有 RU LCU 在罗马尼亚也会自动崩溃", () => {
		const game = createGame()
		const log = makeLogger(game)
		placePiece(game, AP, "RU Dobruja", "Constanta")

		game.events.romania = true
		setControl(game, "BUCHAREST", CP)
		setControl(game, "Ploesti", CP)
		setControl(game, "Constanta", CP)

		const handled = Engine.collapse.handle_national_collapse(game, log)

		expect(handled).toBe(false)
		expect(game.events.romania_collapse).toBe(6)
		expect(game.state).not.toBe("event_romanian_collapse_sr")
	})

	test("塞尔维亚崩溃后塞军攻击范围会随贝尔格莱德控制权变化", () => {
		const game = createGame()
		const sbArmy = findPiece(undefined, "SB 1 Army")

		game.events.serbian_collapse = game.turn

		expect(Engine.collapse.can_piece_attack_after_serbian_collapse(game, sbArmy, findSpace("ATHENS"))).toBe(true)
		expect(Engine.collapse.can_piece_attack_after_serbian_collapse(game, sbArmy, findSpace("SOFIA"))).toBe(false)

		setControl(game, "BELGRADE", AP)

		expect(Engine.collapse.can_piece_attack_after_serbian_collapse(game, sbArmy, findSpace("SOFIA"))).toBe(true)
		expect(Engine.collapse.can_piece_attack_after_serbian_collapse(game, sbArmy, findSpace("Damascus"))).toBe(false)
	})

	test("塞尔维亚自愿崩溃可完成 offer->accept->移除->免费SR->done 全链路", () => {
		const game = createGame()
		const rules = createStateRules(game)
		const ahDiv1 = moveToReserve(game, CP, "AH DIV #4")
		const ahDiv2 = moveToReserve(game, CP, "AH DIV #5")
		const srPiece = placePiece(game, CP, "German 11th Army", "SOFIA")
		const destination = findSpace("BELGRADE")

		game.events.bulgaria = true
		game.events.romania = true
		placePiece(game, AP, "RO 1 Army", "BUCHAREST")
		game.collapse_status = {
			turn: game.turn,
			serbia_considered: false,
			romania_considered: true
		}
		setControl(game, "BELGRADE", CP)
		setControl(game, "SOFIA", CP)
		setControl(game, "Nis", CP)
		setControl(game, "Skopje", AP)

		expect(Engine.collapse.handle_national_collapse(game, rules.log)).toBe(true)
		expect(game.state).toBe("war_status_serbian_collapse_offer")

		eventStates.war_status_serbian_collapse_offer.accept({ game, rules })
		expect(game.state).toBe("event_serbian_collapse_choice")

		eventStates.event_serbian_collapse_choice.piece({ game, rules, arg: ahDiv1 })
		eventStates.event_serbian_collapse_choice.piece({ game, rules, arg: ahDiv2 })
		eventStates.event_serbian_collapse_choice.confirm({ game, rules })

		expect(game.state).toBe("event_serbian_collapse_sr")
		expect(isRemoved(game, ahDiv1)).toBe(true)
		expect(isRemoved(game, ahDiv2)).toBe(true)

		eventStates.event_serbian_collapse_sr.piece({ game, rules, arg: srPiece })
		eventStates.event_serbian_collapse_sr.space({ game, rules, arg: destination, log: rules.log })
		eventStates.event_serbian_collapse_sr.done({ game, rules })

		expect(game.pieces[srPiece]).toBe(destination)
		expect(rules.phaseTransitions).toEqual(["war_status_phase"])
		expect(game.event_ctx).toBeUndefined()
		expect(game.sr_piece).toBeUndefined()
	})

	test("罗马尼亚自愿崩溃可完成 offer->accept->移除->免费SR->done 全链路", () => {
		const game = createGame()
		const rules = createStateRules(game)
		const combined = moveToReserve(game, CP, "Combined BU/AH Div")
		const ahDiv1 = moveToReserve(game, CP, "AH DIV #1")
		const ahDiv2 = moveToReserve(game, CP, "AH DIV #2")
		const srPiece = placePiece(game, CP, "German 11th Army", "SOFIA")
		const destination = findSpace("BELGRADE")

		game.events.romania = true
		game.events.bulgaria = true
		game.collapse_status = {
			turn: game.turn,
			serbia_considered: true,
			romania_considered: false
		}
		placePiece(game, AP, "RO 1 Army", "BUCHAREST")
		setControl(game, "SOFIA", CP)
		setControl(game, "BELGRADE", CP)
		setControl(game, "Nis", CP)

		expect(Engine.collapse.handle_national_collapse(game, rules.log)).toBe(true)
		expect(game.state).toBe("war_status_romanian_collapse_offer")

		eventStates.war_status_romanian_collapse_offer.accept({ game, rules })
		expect(game.state).toBe("event_romanian_collapse_choice")

		eventStates.event_romanian_collapse_choice.piece({ game, rules, arg: combined })
		eventStates.event_romanian_collapse_choice.piece({ game, rules, arg: ahDiv1 })
		eventStates.event_romanian_collapse_choice.piece({ game, rules, arg: ahDiv2 })
		eventStates.event_romanian_collapse_choice.confirm({ game, rules })

		expect(game.state).toBe("event_romanian_collapse_sr")
		expect(isRemoved(game, combined)).toBe(true)
		expect(isRemoved(game, ahDiv1)).toBe(true)
		expect(isRemoved(game, ahDiv2)).toBe(true)
		expect(Engine.game_utils.is_permanently_eliminated(game, combined)).toBe(false)
		expect(Engine.game_utils.is_permanently_eliminated(game, ahDiv1)).toBe(false)
		expect(Engine.game_utils.is_permanently_eliminated(game, ahDiv2)).toBe(false)

		eventStates.event_romanian_collapse_sr.piece({ game, rules, arg: srPiece })
		eventStates.event_romanian_collapse_sr.space({ game, rules, arg: destination, log: rules.log })
		eventStates.event_romanian_collapse_sr.done({ game, rules })

		expect(game.pieces[srPiece]).toBe(destination)
		expect(rules.phaseTransitions).toEqual(["war_status_phase"])
		expect(game.event_ctx).toBeUndefined()
		expect(game.sr_piece).toBeUndefined()
	})
})
