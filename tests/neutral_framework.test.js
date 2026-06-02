const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP, ELIMINATED } = Engine.constants

describe("中立国统一框架", () => {
	test("历史剧本开局会把 Balkan 中立国统一识别为未参战", () => {
		let game = setupGame(2026041801, "Historical")
		let buArmy = findPiece(CP, "BU 1 Army")
		let sbArmy = findPiece(AP, "SB 1 Army")
		let roArmy = findPiece(AP, "RO 1 Army")

		expect(Engine.neutral.get_nation_faction(game, "gr")).toBe(null)
		expect(Engine.neutral.get_nation_faction(game, "bu")).toBe(null)
		expect(Engine.neutral.get_nation_faction(game, "sb")).toBe(null)
		expect(Engine.neutral.get_nation_faction(game, "ro")).toBe(null)

		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe("neutral")
		expect(Engine.game_utils.get_piece_effective_faction(game, sbArmy)).toBe("neutral")
		expect(Engine.game_utils.get_piece_effective_faction(game, roArmy)).toBe("neutral")
		expect(Engine.neutral.can_piece_participate_for_faction(game, buArmy, CP, "move")).toBe(false)
		expect(Engine.neutral.can_piece_participate_for_faction(game, sbArmy, AP, "attack")).toBe(false)
	})

	test("保加利亚预摆中立单位不会被判定为有限补给", () => {
		let game = setupGame(2026041812, "Historical")
		let buArmy = findPiece(CP, "BU 1 Army")
		let buSpace = game.pieces[buArmy]

		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe("neutral")
		expect(Engine.map.get_supply_status(game, buSpace, CP, buArmy)).toBe("FULL")
		expect(Engine.map.is_in_limited_supply(game, buArmy)).toBe(false)
	})

	test("希腊在统一框架下保留 CND 特例，其他希军在中立时保持锁定", () => {
		let game = setupGame(2026041802, "Historical")
		let greekDiv = findPiece(AP, "GR DIV #1")
		let greekCnd = findPiece(AP, "GR National Defense")

		expect(Engine.game_utils.get_piece_effective_faction(game, greekDiv)).toBe("neutral")
		expect(Engine.game_utils.get_piece_effective_faction(game, greekCnd)).toBe(AP)
		expect(Engine.neutral.can_piece_participate_for_faction(game, greekDiv, AP, "move")).toBe(false)
		expect(Engine.neutral.can_piece_participate_for_faction(game, greekCnd, AP, "move")).toBe(true)
		expect(Engine.neutral.can_piece_participate_for_faction(game, greekCnd, AP, "attack")).toBe(true)

		Engine.neutral.set_greece_faction(game, AP)

		expect(Engine.neutral.get_nation_faction(game, "gr")).toBe(AP)
		expect(Engine.game_utils.get_piece_effective_faction(game, greekDiv)).toBe(AP)
		expect(Engine.neutral.can_piece_participate_for_faction(game, greekDiv, AP, "move")).toBe(true)
	})

	test("战斗结算深层过滤不会把 Bulgaria 展示位中立单位当成防守方", () => {
		let game = setupGame(2026041810, "Historical")
		let sbArmy = findPiece(AP, "SB 1 Army")
		let buArmy = findPiece(CP, "BU 1 Army")
		let vidin = findSpace("Vidin")
		let belgrade = findSpace("BELGRADE")

		game.pieces[sbArmy] = belgrade
		game.pieces[buArmy] = vidin
		game.active = AP
		game.attacked = []
		game.retreated = []
		game.attack = {
			attacker: AP,
			defender: CP,
			pieces: [sbArmy],
			space: vidin
		}

		let result = Engine.combat.resolve_battle(game)

		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe("neutral")
		expect(result.defenders).toEqual([])
	})

	test("Constantine 入场判定不会把 Larissa 中的中立预摆单位误算为 CP", () => {
		let game = setupGame(2026041811, "Historical")
		let buArmy = findPiece(CP, "BU 1 Army")
		let geArmy = findPiece(CP, "German 11th Army")
		let larissa = findSpace("Larissa")

		game.pieces[buArmy] = larissa
		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe("neutral")
		expect(Engine.neutral.check_constantine_entry_conditions(game)).toBe(false)

		game.pieces[geArmy] = larissa
		expect(Engine.game_utils.get_piece_effective_faction(game, geArmy)).toBe(CP)
		expect(Engine.neutral.check_constantine_entry_conditions(game)).toBe(true)
	})

	test("中立希腊的本土满补给仅适用于希腊单位，普通 AP 单位仍需正常溯源", () => {
		let game = setupGame(2026041804, "Historical")
		let larissa = findSpace("Larissa")
		let greekDiv = findPiece(AP, "GR DIV #1")
		let britishCorps = findPiece(AP, "BR IX Corps")

		game.pieces[greekDiv] = larissa
		game.pieces[britishCorps] = larissa

		expect(Engine.map.get_supply_status(game, larissa, AP, greekDiv)).toBe("FULL")
		expect(Engine.map.get_supply_status(game, larissa, AP, britishCorps)).not.toBe("FULL")
	})

	test("Salonika 只有在中立期被和平进驻后才会成为 AP 港口补给源", () => {
		let game = setupGame(2026041806, "Historical")
		let salonika = findSpace("Salonika")

		expect(Engine.map.is_base_supply_source(game, salonika, AP)).toBe(false)

		Engine.neutral.on_beachhead_placed(game, salonika, AP)

		expect(game.control[salonika]).toBe(AP)
		expect(game.events.salonika_is_port).toBe(true)
		expect(Engine.map.is_base_supply_source(game, salonika, AP)).toBe(true)
	})

	test("塞军仅在塞尔维亚崩溃前享有特殊本土满补给", () => {
		let game = setupGame(2026041805, "Historical")
		let nis = findSpace("Nis")
		let sbArmy = findPiece(AP, "SB 1 Army")

		// Belgrade may still trace normal AP supply after collapse, so use Nis to
		// verify the loss of Serbia's special home-supply privilege directly.
		game.pieces[sbArmy] = nis

		expect(Engine.neutral.has_home_supply_privilege(game, sbArmy, nis, AP)).toBe(true)
		expect(Engine.map.get_supply_status(game, nis, AP, sbArmy)).toBe("FULL")

		game.events.serbian_collapse = true

		expect(Engine.neutral.has_home_supply_privilege(game, sbArmy, nis, AP)).toBe(false)
		expect(Engine.map.get_supply_status(game, nis, AP, sbArmy)).not.toBe("FULL")
	})

	test("RU/SB Yugoslav Division uses Serbian home supply before Serbian collapse", () => {
		let game = setupGame(2026051701, "Historical")
		let nis = findSpace("Nis")
		let yugo = findPiece(AP, "RU/SB Yugo Infantry")

		Engine.events.get_event_by_id(88).handler(game)
		clearBoard(game)
		game.pieces[yugo] = nis

		expect(Engine.map.get_supply_status(game, nis, AP, yugo)).toBe("FULL")

		Engine.map.check_supply(game)

		expect(game.oos || []).not.toContain(yugo)
		expect(game.oos_spaces || []).not.toContain(nis)
	})

	test("Persian units use the shared neutral home-supply privilege in Greater Persia", () => {
		for (let [faction, unitName, spaceName] of [
			[AP, "BR/PE SPers Rifles", "Hamadan"],
			[AP, "RU/PE Police North", "TEHERAN"],
			[AP, "PE/RU Persian Cossacks", "TEHERAN"],
			[CP, "PE Uprising", "Qum"]
		]) {
			let game = setupGame(2026052103, "Historical", { no_supply_warnings: true })
			clearBoard(game)
			let space = findSpace(spaceName)
			let unit = findPiece(faction, unitName)

			game.events.secret_treaty = true
			game.pieces[unit] = space
			Engine.set_control(game, space, faction)
			game.persian_uprising_markers = [space]

			expect(Engine.neutral.is_persian_supply_unit(unit)).toBe(true)
			expect(Engine.neutral.has_home_supply_privilege(game, unit, space, faction)).toBe(true)
			expect(Engine.map.get_supply_status(game, space, faction, unit)).toBe("FULL")
		}
	})

	test("塞军在塞尔维亚崩溃且未触发塞族归来前不能重建", () => {
		let game = setupGame(2026041807, "Historical")
		let sbArmy = findPiece(AP, "SB 1 Army")

		game.events.bulgaria = true
		game.events.serbian_collapse = true
		game.pieces[sbArmy] = ELIMINATED

		expect(Engine.map.get_valid_rebuild_spaces(game, sbArmy, AP)).toEqual([])
	})

	test("罗军在罗马尼亚崩溃后失去敖德萨重建资格", () => {
		let game = setupGame(2026041808, "Historical")
		let roDiv = findPiece(AP, "RO DIV #1")
		let odessa = findSpace("Odessa")

		game.events.romania = true
		game.events.romania_collapse = game.turn
		game.pieces[roDiv] = ELIMINATED
		game.control[odessa] = AP

		expect(Engine.map.get_valid_rebuild_spaces(game, roDiv, AP)).not.toContain(odessa)
	})

	test("Romanian units can spend AP replacement points before collapse", () => {
		let game = setupGame(2026060204)
		let army = findPiece(AP, "RO 1 Army")
		let bucharest = findSpace("BUCHAREST")
		let odessa = findSpace("Odessa")

		Engine.neutral.trigger_romania_entry(game)
		game.pieces[army] = ELIMINATED
		game.rp_ap.a = 1

		let cost = Engine.map.get_replacement_cost(game, army)

		expect(cost).toBe(1)
		expect(Engine.map.can_afford_replacement(game, army, cost)).toBe(true)
		expect(Engine.map.get_valid_rebuild_spaces(game, army, AP)).toEqual(expect.arrayContaining([bucharest, odessa]))
	})

	test("保加利亚与罗马尼亚事件会通过统一接口切换国家归属与默认控制", () => {
		let game = setupGame(2026041803, "Historical")
		let bulgariaEvent = Engine.events.get_event_by_id(88)
		let romaniaEvent = Engine.events.get_event_by_id(29)
		let sofia = findSpace("SOFIA")
		let belgrade = findSpace("BELGRADE")
		let bucharest = findSpace("BUCHAREST")
		let buArmy = findPiece(CP, "BU 1 Army")
		let sbArmy = findPiece(AP, "SB 1 Army")
		let roArmy = findPiece(AP, "RO 1 Army")

		bulgariaEvent.handler(game)

		expect(Engine.neutral.get_nation_faction(game, "bu")).toBe(CP)
		expect(Engine.neutral.get_nation_faction(game, "sb")).toBe(AP)
		expect(Engine.neutral.get_space_default_controller(game, sofia)).toBe(CP)
		expect(Engine.neutral.get_space_default_controller(game, belgrade)).toBe(AP)
		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe(CP)
		expect(Engine.game_utils.get_piece_effective_faction(game, sbArmy)).toBe(AP)

		romaniaEvent.handler(game)

		expect(Engine.neutral.get_nation_faction(game, "ro")).toBe(AP)
		expect(Engine.neutral.get_space_default_controller(game, bucharest)).toBe(AP)
		expect(Engine.game_utils.get_piece_effective_faction(game, roArmy)).toBe(AP)
	})

	test("entered neutral nations expose occupation markers only when control overrides their new default", () => {
		let game = setupGame(2026052101, "Historical")
		let bulgariaEvent = Engine.events.get_event_by_id(88)
		let romaniaEvent = Engine.events.get_event_by_id(29)
		let sofia = findSpace("SOFIA")
		let belgrade = findSpace("BELGRADE")
		let bucharest = findSpace("BUCHAREST")

		bulgariaEvent.handler(game)
		romaniaEvent.handler(game)

		let view = rules.view(game, rules.roles[0])
		expect(view.control_defaults[sofia]).toBe(CP)
		expect(view.control_defaults[belgrade]).toBe(AP)
		expect(view.control_defaults[bucharest]).toBe(AP)
		expect(view.control[sofia]).toBeUndefined()
		expect(view.control[belgrade]).toBeUndefined()
		expect(view.control[bucharest]).toBeUndefined()

		Engine.set_control(game, sofia, AP)
		Engine.set_control(game, belgrade, CP)
		Engine.set_control(game, bucharest, CP)

		view = rules.view(game, rules.roles[0])
		expect(view.control[sofia]).toBe(AP)
		expect(view.control[belgrade]).toBe(CP)
		expect(view.control[bucharest]).toBe(CP)
	})

	test("empty uncollapsed Serbian home spaces do not become CP-controlled through attrition", () => {
		let game = setupGame(2026052102, "Historical", { no_supply_warnings: true })
		let bulgariaEvent = Engine.events.get_event_by_id(88)
		let skopje = findSpace("Skopje")
		let monastir = findSpace("Monastir")

		bulgariaEvent.handler(game)
		Engine.map.check_supply(game)

		expect(game.oos_spaces || []).not.toEqual(expect.arrayContaining([skopje, monastir]))
		expect(Engine.map.get_space_controller(game, skopje)).toBe(AP)
		expect(Engine.map.get_space_controller(game, monastir)).toBe(AP)
	})

	test("视图中的中立国参照标志会根据持久化参战状态自动隐藏", () => {
		let game = setupGame(2026041813, "Historical")

		game.events.bulgaria = true
		game.events.romania = true
		game.events.greece = AP
		delete game.entry_bu
		delete game.entry_sb
		delete game.entry_ro
		delete game.entry_gr

		let view = rules.view(game, rules.roles[0])

		expect(view.entry_bu).toBe(true)
		expect(view.entry_sb).toBe(true)
		expect(view.entry_ro).toBe(true)
		expect(view.entry_gr).toBe(true)
	})

	test("MO 攻击上下文不会把目标格中的保加利亚/罗马尼亚中立单位算作防守方", () => {
		let game = setupGame(2026041703, "Historical")
		let vidin = findSpace("Vidin")
		let geArmy = findPiece(CP, "German 11th Army")
		let buArmy = findPiece(CP, "BU 1 Army")
		let roArmy = findPiece(AP, "RO 1 Army")

		game.pieces[buArmy] = vidin
		game.pieces[roArmy] = vidin
		game.attack = {
			attacker: CP,
			defender: AP,
			pieces: [geArmy],
			space: vidin
		}

		expect(Engine.game_utils.get_piece_effective_faction(game, buArmy)).toBe("neutral")
		expect(Engine.game_utils.get_piece_effective_faction(game, roArmy)).toBe("neutral")

		let ctx = Engine.mo.create_attack_context(game)

		expect(ctx.attacker).toBe(CP)
		expect(ctx.space).toBe(vidin)
		expect(ctx.defender_pieces).toEqual([])

		game.mo_cp = Engine.mo.MO_RUSSIA
		Engine.mo.check_mo_on_attack_declared(game)
		expect(game.mo_cp_fulfilled).toBe(false)
	})

	test("协约国首次进入中立波斯只扣 1 VP 且只触发一次", () => {
		let game = setupGame(2026042803)
		let astara = findSpace("Astara")
		let kazvin = findSpace("Kazvin")
		let ruPiece = findPiece(AP, "PE/RU Persian Cossacks")
		let initialVp = game.vp

		Engine.check_persia_entry_vp_penalty(game, astara, [ruPiece])
		Engine.check_persia_entry_vp_penalty(game, kazvin, [ruPiece])

		expect(game.events.neutral_persia_first_entry_penalty).toBe(AP)
		expect(game.vp).toBe(initialVp + 1)
	})

	test("同盟国首次进入中立波斯只扣 1 VP 且只触发一次", () => {
		let game = setupGame(2026042804)
		let astara = findSpace("Astara")
		let kazvin = findSpace("Kazvin")
		let tuPiece = findPiece(CP, "TU-A DIV #10")
		let initialVp = game.vp

		Engine.check_persia_entry_vp_penalty(game, astara, [tuPiece])
		Engine.check_persia_entry_vp_penalty(game, kazvin, [tuPiece])

		expect(game.events.neutral_persia_first_entry_penalty).toBe(CP)
		expect(game.vp).toBe(initialVp - 1)
	})

	test("进入非中立波斯不会触发中立波斯首次进入 VP 惩罚", () => {
		let game = setupGame(2026042805)
		let meshed = findSpace("Meshed")
		let ruPiece = findPiece(AP, "PE/RU Persian Cossacks")
		let initialVp = game.vp

		Engine.check_persia_entry_vp_penalty(game, meshed, [ruPiece])

		expect(game.events.neutral_persia_first_entry_penalty).toBeUndefined()
		expect(game.vp).toBe(initialVp)
	})

	test("RU/PE Police North has Persian full supply across all Greater Persia areas", () => {
		for (let spaceName of ["Meshed", "Tabriz", "Ahwaz"]) {
			let game = setupGame(2026052104, "Historical", { no_supply_warnings: true })
			clearBoard(game)
			let space = findSpace(spaceName)
			let unit = findPiece(AP, "RU/PE Police North")

			game.pieces[unit] = space
			Engine.set_control(game, space, AP)

			expect(Engine.neutral.is_persian_supply_unit(unit)).toBe(true)
			expect(Engine.map.get_supply_status(game, space, AP, unit)).toBe("FULL")
			Engine.map.check_supply(game)
			expect(game.oos || []).not.toContain(unit)
		}
	})
})
