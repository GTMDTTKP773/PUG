const rules = require("../rules.js")
const data = require("../data.js")
const Engine = require("../modules/engine.js")

const AP_ROLE = rules.roles[0]
const CP_ROLE = rules.roles[1]

function findCardByEvent(eventName) {
	let card = data.cards.findIndex((info, idx) => idx > 0 && info && info.event === eventName)
	if (card < 0) throw new Error(`Missing card: ${eventName}`)
	return card
}

function findPieceByName(name) {
	let piece = data.pieces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (piece < 0) throw new Error(`Missing piece: ${name}`)
	return piece
}

function findSpaceByName(name) {
	let space = data.spaces.findIndex((info, idx) => idx > 0 && info && info.name === name)
	if (space < 0) throw new Error(`Missing space: ${name}`)
	return space
}

function findSpaceByTerrain(terrain) {
	let space = data.spaces.findIndex((info, idx) => idx > 0 && info && info.terrain === terrain)
	if (space < 0) throw new Error(`Missing ${terrain} space`)
	return space
}

function createBattleGame() {
	let game = rules.setup(101, "Historical", { seed: 42 })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")
	let ruDiv3 = findPieceByName("RU DIV #3")
	let tuDiv8 = findPieceByName("TU DIV #8")

	game.pieces[ruDiv3] = oltu
	game.pieces[tuDiv8] = bayburt
	game.reduced = []
	game.retreated = []
	game.events = game.events || {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.attack = {
		space: bayburt,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}

	return { game, ruDiv3, tuDiv8, bayburt }
}

test("Save Tiflis returns Enver Goes East to its queued second attack", () => {
	let game = rules.setup(2026052401, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")
	let ruDiv3 = findPieceByName("RU DIV #3")
	let tuDiv8 = findPieceByName("TU DIV #8")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[ruDiv3] = oltu
	game.pieces[tuDiv8] = bayburt
	game.control[oltu] = rules.AP
	game.control[bayburt] = rules.CP
	game.active = rules.AP
	game.state = "save_tiflis_retreat"
	game.events = { save_tiflis: game.turn }
	game.hand_cp = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.combat_cards = { attacker: [], defender: [Engine.combat.CC_CP_SAVE_TIFLIS] }
	game.combat_cards_effected = [Engine.combat.CC_CP_SAVE_TIFLIS]
	game.event_next_state = "event_enver_goes_east_resolve_next_attack"
	game.save_tiflis_resolved = true
	game.save_tiflis_pieces = []
	game.save_tiflis_exempt_spaces = []
	game.selected_piece = null
	game.attack = {
		space: oltu,
		pieces: [tuDiv8],
		attacker: rules.CP,
		defender: rules.AP,
		keep_context: true,
		origin_by_piece: { [tuDiv8]: bayburt },
		initial_attackers: [tuDiv8],
		initial_defenders: [ruDiv3]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 0,
		retreat_needed: false,
		retreating_faction: null,
		retreating_units: [],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: true,
		attackers: [tuDiv8],
		defenders: [ruDiv3],
		advance_with_reduced: false
	}

	game = rules.action(game, AP_ROLE, "done")

	expect(game.state).toBe("event_enver_goes_east_resolve_next_attack")
	expect(game.active).toBe(rules.AP)
	expect(game.event_next_state).toBeUndefined()
	expect(game.attack).toBeNull()
	expect(game.events.save_tiflis).toBeUndefined()
})

function createRetreatCancelGame({
	targetName,
	originName = "Baghdad",
	attackerName = "BR IX Corps",
	attackerCard = Engine.combat.CC_AP_MAUDE,
	withTrench = true
}) {
	let game = rules.setup(104, "Historical", { seed: 42, no_supply_warnings: true })
	let origin = findSpaceByName(originName)
	let target = findSpaceByName(targetName)
	let attacker = findPieceByName(attackerName)
	let defender1 = findPieceByName("TU DIV #8")
	let defender2 = findPieceByName("TU DIV #9")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[attacker] = origin
	game.pieces[defender1] = target
	game.pieces[defender2] = target
	game.control[origin] = rules.AP
	game.control[target] = rules.CP
	game.active = rules.AP
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.trenches = []
	game.trenches_2 = []
	game.trench_owner = []
	if (withTrench) Engine.game_utils.place_trench(game, target, rules.CP)
	game.combat_cards = { attacker: [attackerCard], defender: [] }
	game.combat_cards_effected = []
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.battle_resolution_side_effects_applied = true
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: rules.AP,
		defender: rules.CP,
		origin_by_piece: { [attacker]: origin },
		initial_attackers: [attacker],
		initial_defenders: [defender1, defender2]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: rules.CP,
		retreating_units: [defender1, defender2],
		retreat_can_cancel: true,
		retreat_distance: 1,
		no_advance: false,
		attackers: [attacker],
		defenders: [defender1, defender2],
		advance_with_reduced: false
	}

	return { game, target, defender1, defender2 }
}

function createMaudeRetreatCancelGame(targetName, originName = "Baghdad") {
	return createRetreatCancelGame({ targetName, originName })
}

function createLcuRetreatCancelGame() {
	let game = rules.setup(105, "Historical", { seed: 42, no_supply_warnings: true })
	let origin = findSpaceByName("Oltu")
	let target = findSpaceByName("Bayburt")
	let attacker = findPieceByName("BR IX Corps")
	let defenderLcu = findPieceByName("TU I Corps")
	let defenderScu = findPieceByName("TU DIV #8")
	let replacements = ["TU DIV #10", "TU DIV #11", "TU DIV #12"].map(findPieceByName)
	let reserve = Engine.game_utils.get_scu_reserve_box(rules.CP)

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of replacements) game.pieces[p] = reserve
	game.pieces[attacker] = origin
	game.pieces[defenderLcu] = target
	game.pieces[defenderScu] = target
	game.control[origin] = rules.AP
	game.control[target] = rules.CP
	game.active = rules.AP
	game.reduced = [defenderLcu]
	game.retreated = []
	game.events = {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.battle_resolution_side_effects_applied = true
	game.attack = {
		space: target,
		pieces: [attacker],
		attacker: rules.AP,
		defender: rules.CP,
		origin_by_piece: { [attacker]: origin },
		initial_attackers: [attacker],
		initial_defenders: [defenderLcu, defenderScu]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: rules.CP,
		retreating_units: [defenderLcu, defenderScu],
		retreat_can_cancel: true,
		retreat_distance: 1,
		no_advance: false,
		attackers: [attacker],
		defenders: [defenderLcu, defenderScu],
		advance_with_reduced: false
	}

	return { game, target, defenderLcu, defenderScu, replacements, reserve }
}

function createSpecialUnitDrmGame(active, attackers, defenders) {
	let game = rules.setup(103, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = oltu
	for (let p of defenders) game.pieces[p] = bayburt

	game.control[oltu] = active
	game.control[bayburt] = active === rules.AP ? rules.CP : rules.AP
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.active = active
	game.attack = {
		space: bayburt,
		pieces: attackers,
		attacker: active,
		defender: active === rules.AP ? rules.CP : rules.AP
	}
	game.combat_cards = { attacker: [], defender: [] }

	return game
}

function createBesiegedFortAttackGame() {
	let game = rules.setup(102, "Historical", { seed: 42 })
	let kars = findSpaceByName("Kars")
	let sarikamis = findSpaceByName("Sarikamis")
	let oltu = findSpaceByName("Oltu")
	let koprukoy = findSpaceByName("Koprukoy")
	let tuICorps = findPieceByName("TU I Corps")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0

	game.pieces[tuICorps] = kars
	game.control = game.control || []
	game.control[kars] = rules.AP
	game.control[sarikamis] = rules.CP
	game.control[oltu] = rules.CP
	game.control[koprukoy] = rules.CP
	game.forts = { destroyed: [] }
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.activated = { attack: [kars] }
	game.region_activations = { attack: {} }
	game.active = rules.CP
	game.state = "attack"
	game.attack = { pieces: [], space: -1 }

	return { game, kars, tuICorps }
}

function createBesiegedFortMaintenanceGame(attackerNames) {
	let game = rules.setup(105, "Historical", { seed: 42 })
	let kars = findSpaceByName("Kars")
	let sarikamis = findSpaceByName("Sarikamis")
	let attackers = attackerNames.map(findPieceByName)
	let ruDiv3 = findPieceByName("RU DIV #3")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = kars
	game.pieces[ruDiv3] = sarikamis

	game.control = game.control || []
	game.control[kars] = rules.CP
	game.control[sarikamis] = rules.AP
	game.forts = { destroyed: [] }
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.active = rules.CP

	return { game, kars, sarikamis, attackers }
}

function createMassedCavalryPreFlankGame() {
	let game = rules.setup(106, "Historical", { seed: 42, no_supply_warnings: true })
	let baghdad = findSpaceByName("Baghdad")
	let aziziya = findSpaceByName("Aziziya")
	let ctesiphon = findSpaceByName("Ctesiphon")
	let anzDesertCorps = findPieceByName("ANZ Desert Corps")
	let british = findPieceByName("BR IX Corps")
	let turkish = findPieceByName("TU DIV #8")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[anzDesertCorps] = baghdad
	game.pieces[british] = aziziya
	game.pieces[turkish] = ctesiphon
	game.control[baghdad] = rules.AP
	game.control[aziziya] = rules.AP
	game.control[ctesiphon] = rules.CP
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.trenches = [ctesiphon]
	game.trenches_2 = []
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.hand_ap = [Engine.combat.CC_AP_MASSED_CAVALRY_CHARGE]
	game.discard_ap = []
	game.removed_ap = []
	game.active = rules.AP
	game.state = "pre_flank_cc_attacker"
	game.attack = {
		space: ctesiphon,
		pieces: [anzDesertCorps, british],
		attacker: rules.AP,
		defender: rules.CP
	}

	return { game, ctesiphon }
}

test("cavalry camel armored DRM log names the first matching unit badge", () => {
	let anzCamel = findPieceByName("ANZ Imp Camel")
	let anzCavalry = findPieceByName("ANZ Cavalry #1")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let logs = []
	let game = createSpecialUnitDrmGame(rules.AP, [anzCamel, anzCavalry], [tuDiv8])

	Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(logs).toContain("  骆驼兵: 进攻方 +1 DRM")
	expect(logs.join("\n")).not.toContain("骑兵/骆驼兵/装甲旅")
})

test("Massed Cavalry Charge is playable before flank declaration and can unlock flank past trenches", () => {
	let { game, ctesiphon } = createMassedCavalryPreFlankGame()
	let mcc = Engine.combat.CC_AP_MASSED_CAVALRY_CHARGE

	expect(Engine.game_utils.has_trench(game, ctesiphon)).toBe(1)
	expect(Engine.combat.check_can_flank(game)).toBe(false)

	let view = rules.view(game, AP_ROLE)
	expect(view.actions.play_cc || []).toContain(mcc)

	rules.action(game, AP_ROLE, "play_cc", mcc)
	rules.action(game, AP_ROLE, "confirm")

	expect(game.combat_cards.attacker).toContain(mcc)
	expect(Engine.combat.check_can_flank(game)).toBe(true)
	expect(game.state).toBe("choose_flank_attack")
})

test("cavalry camel armored DRM log names armored defenders", () => {
	let tuDiv8 = findPieceByName("TU DIV #8")
	let brDunsterforce = findPieceByName("BR Dunsterforce")
	let logs = []
	let game = createSpecialUnitDrmGame(rules.CP, [tuDiv8], [brDunsterforce])

	Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(logs).toContain("  装甲旅: 防守方 +1 DRM")
	expect(logs.join("\n")).not.toContain("骑兵/骆驼兵/装甲旅")
})

test("Tanks adds DRM but no longer adds an attacker column shift", () => {
	let game = rules.setup(110, "Historical", { seed: 42, no_supply_warnings: true })
	let gaza = findSpaceByName("Gaza")
	let beersheba = findSpaceByName("Beersheba")
	let brIXCorps = findPieceByName("BR IX Corps")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let logs = []

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[brIXCorps] = gaza
	game.pieces[tuDiv8] = beersheba
	game.control[gaza] = rules.AP
	game.control[beersheba] = rules.CP
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.active = rules.AP
	game.attack = {
		space: beersheba,
		pieces: [brIXCorps],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.combat_cards = { attacker: [Engine.combat.CC_AP_TANKS], defender: [] }
	game.combat_cards_effected = []

	Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(game.battle_result.att_drm).toBe(1)
	expect(game.battle_result.att_shifts).toBe(-1)
	expect(logs.join("\n")).not.toContain("+1 坦克")
})

test("Tanks treats spaces without a terrain field as clear spaces", () => {
	let game = rules.setup(111, "Historical", { seed: 42, no_supply_warnings: true })
	let jaffa = findSpaceByName("Jaffa")
	let gaza = findSpaceByName("Gaza")
	let brIXCorps = findPieceByName("BR IX Corps")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let tanks = Engine.combat.CC_AP_TANKS

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[brIXCorps] = gaza
	game.pieces[tuDiv8] = jaffa
	game.control[gaza] = rules.AP
	game.control[jaffa] = rules.CP
	game.reduced = []
	game.retreated = []
	game.events = {}
	game.attacked = []
	game.active = rules.AP
	game.state = "play_cc_attacker"
	game.attack = {
		space: jaffa,
		pieces: [brIXCorps],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.combat_cards = { attacker: [], defender: [] }
	game.hand_ap = [tanks]
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}

	expect(data.spaces[jaffa].terrain).toBeUndefined()
	expect(rules.view(game, AP_ROLE).actions.play_cc).toContain(tanks)

	game.attack.space = gaza

	expect(data.spaces[gaza].terrain).toBe("mountain")
	expect(rules.view(game, AP_ROLE).actions.play_cc || []).not.toContain(tanks)
})

test("German High Command cannot be reused in same action", () => {
	let { game } = createBattleGame()
	let germanHighCommand = findCardByEvent("GERMAN HIGH COMMAND CC")

	game.active = rules.CP
	game.state = "play_cc_defender"
	game.cc_retained.cp = [germanHighCommand]
	game.cc_retained_after_use.cp[germanHighCommand] = "discard"

	let firstView = rules.view(game, CP_ROLE)
	expect((firstView.actions.play_cc || []).includes(germanHighCommand)).toBe(true)

	rules.action(game, CP_ROLE, "play_cc", germanHighCommand)
	rules.action(game, CP_ROLE, "confirm")
	expect((game.action_state.used_ccs || []).includes(germanHighCommand)).toBe(true)

	// Simulate the card being retained after the first battle, then open a second battle in the same action.
	game.cc_retained.cp = [germanHighCommand]
	game.cc_retained_after_use.cp[germanHighCommand] = "discard"
	game.active = rules.CP
	game.state = "play_cc_defender"
	game.combat_cards = { attacker: [], defender: [] }

	let secondView = rules.view(game, CP_ROLE)
	expect((secondView.actions.play_cc || []).includes(germanHighCommand)).toBe(false)

	rules.action(game, CP_ROLE, "play_cc", germanHighCommand)
	expect(game.combat_cards.defender).toEqual([])
})

test("Combat card undo returns to the combat card window before older combat undo points", () => {
	let { game } = createBattleGame()
	let germanHighCommand = findCardByEvent("GERMAN HIGH COMMAND CC")
	let staleUndo = JSON.parse(JSON.stringify(game))

	staleUndo.state = "attack"
	staleUndo.log = game.log.length
	delete staleUndo.undo

	game.active = rules.CP
	game.state = "play_cc_defender"
	game.hand_cp = [germanHighCommand]
	game.discard_cp = []
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.action_state = {}
	game.undo = [staleUndo]

	rules.action(game, CP_ROLE, "play_cc", germanHighCommand)
	rules.action(game, CP_ROLE, "confirm")
	expect(game.combat_cards.defender).toContain(germanHighCommand)

	rules.action(game, CP_ROLE, "undo")
	expect(game.state).toBe("play_cc_defender")
	expect(game.combat_cards.defender).toEqual([])
	expect(game.hand_cp).toContain(germanHighCommand)
})

test("Turkish retreat does not log standard no retreat message", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let logs = []

	game.active = rules.AP
	game.post_roll_cc_done = true
	game.reduced = [ruDiv3]
	game.battle_result = {
		attacker_losses: 1,
		defender_losses: 0,
		retreat_needed: false,
		retreating_faction: null,
		retreating_units: [],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		turkish_retreat: true,
		turkish_retreat_units: [tuDiv8],
		turkish_retreat_optional_units: [],
		advance_with_reduced: true
	}

	Engine.combat.end_battle_sequence(game, (msg) => logs.push(msg))

	expect(logs.includes("Attacker has no full-strength units, defenders do not retreat.")).toBe(false)
	expect(game.state).toBe("turkish_retreat")
})

test("full-strength attacking HQ does not let reduced combat units force a defender retreat", () => {
	let { game, ruDiv3, tuDiv8, bayburt } = createBattleGame()
	let oltu = findSpaceByName("Oltu")
	let yudenitch = findPieceByName("RU Yudenitch HQ")

	game.active = rules.AP
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.pieces[yudenitch] = oltu
	game.reduced = [ruDiv3]
	game.attack.pieces = [ruDiv3, yudenitch]
	game.attack.origin_by_piece = { [ruDiv3]: oltu, [yudenitch]: oltu }
	game.battle_result = {
		attacker_losses: 1,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: rules.CP,
		retreating_units: [tuDiv8],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		attackers: [ruDiv3, yudenitch],
		advance_with_reduced: false
	}

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("attack")
	expect(game.pieces[tuDiv8]).toBe(bayburt)
	expect(game.retreat_pieces).toBeUndefined()
	expect(game.advance_pieces).toBeUndefined()
})

test("post-battle retreat refresh ignores full-strength HQ when attacking combat units are reduced", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let oltu = findSpaceByName("Oltu")
	let yudenitch = findPieceByName("RU Yudenitch HQ")

	game.active = rules.AP
	game.pieces[yudenitch] = oltu
	game.reduced = [ruDiv3]
	game.attack.pieces = [ruDiv3, yudenitch]
	game.attack.origin_by_piece = { [ruDiv3]: oltu, [yudenitch]: oltu }
	game.battle_result = {
		attacker_losses: 1,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: rules.CP,
		retreating_units: [tuDiv8],
		retreat_can_cancel: true,
		retreat_distance: 1,
		no_advance: false,
		attackers: [ruDiv3, yudenitch],
		advance_with_reduced: false
	}

	Engine.combat.refresh_post_battle_defender_retreat(game)

	expect(game.battle_result.retreat_needed).toBe(false)
	expect(game.battle_result.retreating_units).toEqual([])
	expect(game.battle_result.retreat_can_cancel).toBe(false)
})

test("full-strength Yudenitch is reduced but not permanently eliminated when its stack retreats", () => {
	let game = rules.setup(107, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let ruDiv3 = findPieceByName("RU DIV #3")
	let yudenitch = findPieceByName("RU Yudenitch HQ")
	let logs = []

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[tuDiv8] = bayburt
	game.pieces[ruDiv3] = oltu
	game.pieces[yudenitch] = oltu
	game.control[bayburt] = rules.CP
	game.control[oltu] = rules.AP
	game.active = rules.CP
	game.reduced = [ruDiv3]
	game.retreated = []
	game.events = {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.action_state = {}
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.attack = {
		space: oltu,
		pieces: [tuDiv8],
		attacker: rules.CP,
		defender: rules.AP,
		origin_by_piece: { [tuDiv8]: bayburt },
		initial_attackers: [tuDiv8],
		initial_defenders: [ruDiv3, yudenitch]
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 2,
		retreat_needed: true,
		retreating_faction: rules.AP,
		retreating_units: [ruDiv3, yudenitch],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		attackers: [tuDiv8],
		defenders: [ruDiv3, yudenitch],
		advance_with_reduced: false,
		used_hqs: { attacker: [], defender: [yudenitch] },
		used_arty: { attacker: [], defender: [] }
	}

	Engine.combat.end_battle_sequence(game, (msg) => logs.push(msg))

	expect(logs.some((msg) => typeof msg === "string" && msg.includes("Losing HQ") && msg.includes("loses 1 step"))).toBe(
		true
	)
	expect(logs.some((msg) => typeof msg === "string" && msg.includes("eliminated instead of retreating"))).toBe(false)
	expect(Engine.game_utils.is_piece_reduced(game, yudenitch)).toBe(true)
	expect(Engine.game_utils.is_permanently_eliminated(game, yudenitch)).toBe(false)
	expect(game.retreat_pieces).toEqual(expect.arrayContaining([ruDiv3, yudenitch]))
})

test("retreat movement exposes an undo action to the retreating player", () => {
	let game = rules.setup(108, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let sarikamis = findSpaceByName("Sarikamis")
	let ruDiv3 = findPieceByName("RU DIV #3")
	let ruDiv4 = findPieceByName("RU DIV #4")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[ruDiv3] = oltu
	game.pieces[ruDiv4] = oltu
	game.control[oltu] = rules.AP
	game.control[sarikamis] = rules.AP
	game.active = rules.AP
	game.state = "retreat"
	game.attack = { space: oltu, attacker: rules.CP, defender: rules.AP }
	game.retreat_pieces = [ruDiv3, ruDiv4]
	game.selected_piece = ruDiv3
	game.retreat_distance = 1
	game.retreat_steps_left = { [ruDiv3]: 1, [ruDiv4]: 1 }
	game.retreated = []
	game.undo = []

	expect(rules.view(game, AP_ROLE).actions.undo).toBe(0)

	game = rules.action(game, AP_ROLE, "space", sarikamis)

	expect(game.state).toBe("retreat")
	expect(game.pieces[ruDiv3]).toBe(sarikamis)
	expect(rules.view(game, AP_ROLE).actions.undo).toBe(1)

	game = rules.action(game, AP_ROLE, "undo")

	expect(game.state).toBe("retreat")
	expect(game.pieces[ruDiv3]).toBe(oltu)
	expect(game.selected_piece).toBe(ruDiv3)
})

test("advance movement exposes an undo action to the advancing player", () => {
	let game = rules.setup(109, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let tuDiv9 = findPieceByName("TU DIV #9")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[tuDiv8] = bayburt
	game.pieces[tuDiv9] = bayburt
	game.control[bayburt] = rules.CP
	game.control[oltu] = rules.AP
	game.active = rules.CP
	game.state = "advance"
	game.attack = { space: oltu, attacker: rules.CP, defender: rules.AP }
	game.battle_result = { retreat_distance: 1 }
	game.advance_space = oltu
	game.advance_pieces = [tuDiv8, tuDiv9]
	game.advance_count = 0
	game.advance_limit = 3
	game.retreated = []
	game.undo = []

	expect(rules.view(game, CP_ROLE).actions.undo).toBe(0)

	game = rules.action(game, CP_ROLE, "piece", tuDiv8)

	expect(game.state).toBe("advance")
	expect(game.pieces[tuDiv8]).toBe(oltu)
	expect(rules.view(game, CP_ROLE).actions.undo).toBe(1)

	game = rules.action(game, CP_ROLE, "undo")

	expect(game.state).toBe("advance")
	expect(game.pieces[tuDiv8]).toBe(bayburt)
	expect(game.advance_pieces).toEqual([tuDiv8, tuDiv9])
})

test("ending advance tolerates a null action argument", () => {
	let game = rules.setup(109, "Historical", { seed: 42, no_supply_warnings: true })
	let oltu = findSpaceByName("Oltu")
	let bayburt = findSpaceByName("Bayburt")
	let tuDiv8 = findPieceByName("TU DIV #8")

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	game.pieces[tuDiv8] = bayburt
	game.control[bayburt] = rules.CP
	game.control[oltu] = rules.AP
	game.active = rules.CP
	game.state = "advance"
	game.attack = { space: oltu, attacker: rules.CP, defender: rules.AP }
	game.battle_result = { retreat_distance: 1 }
	game.advance_space = oltu
	game.advance_pieces = [tuDiv8]
	game.advance_count = 0
	game.advance_limit = 3
	game.retreated = []
	game.undo = []

	expect(() => rules.action(game, CP_ROLE, "end_advance", null)).not.toThrow()
	expect(game.undo).toHaveLength(1)
})

test("Maude prevents a defender-owned trench from cancelling retreat in a non-VP clear space", () => {
	let { game, defender1, defender2 } = createMaudeRetreatCancelGame("Ctesiphon")

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("retreat")
	expect(game.battle_result.retreat_can_cancel).toBe(false)
	expect(game.retreat_pieces.sort((a, b) => a - b)).toEqual([defender1, defender2].sort((a, b) => a - b))
})

test("Maude does not stop non-trench defensive terrain from cancelling retreat", () => {
	let { game } = createMaudeRetreatCancelGame("Bayburt", "Oltu")

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("retreat_cancel")
	expect(game.battle_result.retreat_can_cancel).toBe(true)
})

test.each([
	["defender trench", "Ctesiphon", "Baghdad", true],
	["desert terrain", "Beersheba", "Gaza", false]
])("Massed Cavalry Charge removes %s retreat cancellation", (_label, targetName, originName, withTrench) => {
	let { game } = createRetreatCancelGame({
		targetName,
		originName,
		attackerName: "ANZ Desert Corps",
		attackerCard: Engine.combat.CC_AP_MASSED_CAVALRY_CHARGE,
		withTrench
	})

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("retreat")
	expect(game.battle_result.retreat_can_cancel).toBe(false)
})

test("Massed Cavalry Charge does not remove non-desert terrain retreat cancellation", () => {
	let { game } = createRetreatCancelGame({
		targetName: "Bayburt",
		originName: "Oltu",
		attackerName: "ANZ Desert Corps",
		attackerCard: Engine.combat.CC_AP_MASSED_CAVALRY_CHARGE,
		withTrench: false
	})

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("retreat_cancel")
	expect(game.battle_result.retreat_can_cancel).toBe(true)
})

test("retreat cancellation waits for defender confirmation and can be cancelled", () => {
	let { game, defender1, defender2 } = createMaudeRetreatCancelGame("Bayburt", "Oltu")

	Engine.combat.end_battle_sequence(game, () => {})
	game = rules.action(game, CP_ROLE, "piece", defender1)

	expect(game.state).toBe("post_retreat_cancel")
	expect(game.active).toBe(rules.CP)
	expect(rules.view(game, CP_ROLE).actions.cancel).toBe(1)
	expect(game.reduced).toContain(defender1)

	game = rules.action(game, CP_ROLE, "cancel")

	expect(game.state).toBe("retreat_cancel")
	expect(game.active).toBe(rules.CP)
	expect(game.reduced).not.toContain(defender1)
	expect(game.retreat_pieces.sort((a, b) => a - b)).toEqual([defender1, defender2].sort((a, b) => a - b))
	expect(game.undo).toHaveLength(0)
})

test("confirming retreat cancellation clears undo before passing control", () => {
	let { game, defender1 } = createMaudeRetreatCancelGame("Bayburt", "Oltu")

	Engine.combat.end_battle_sequence(game, () => {})
	game = rules.action(game, CP_ROLE, "piece", defender1)
	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).not.toBe("post_retreat_cancel")
	expect(game.undo).toHaveLength(0)
})

test("cancelling retreat cancellation restores a manually replaced LCU", () => {
	let { game, target, defenderLcu, defenderScu, replacements, reserve } = createLcuRetreatCancelGame()

	Engine.combat.end_battle_sequence(game, () => {})
	game = rules.action(game, CP_ROLE, "piece", defenderLcu)

	expect(game.state).toBe("choose_lcu_replacement")
	expect(game.attack.replacement.options).toEqual(replacements)

	game = rules.action(game, CP_ROLE, "piece", replacements[0])

	expect(game.state).toBe("post_retreat_cancel")
	expect(game.pieces[replacements[0]]).toBe(target)

	game = rules.action(game, CP_ROLE, "cancel")

	expect(game.state).toBe("retreat_cancel")
	expect(game.active).toBe(rules.CP)
	expect(game.pieces[defenderLcu]).toBe(target)
	expect(game.reduced).toContain(defenderLcu)
	expect(game.pieces[replacements[0]]).toBe(reserve)
	expect(game.retreat_pieces.sort((a, b) => a - b)).toEqual([defenderLcu, defenderScu].sort((a, b) => a - b))
	expect(game.undo).toHaveLength(0)
})

test("Push to the Breaking Point can be played after the defender cancels retreat", () => {
	let { game, defender1 } = createMaudeRetreatCancelGame("Bayburt", "Oltu")
	let ptbp = findCardByEvent("PUSH TO THE BREAKING POINT CC")
	let attacker = findPieceByName("BR IX Corps")

	game.events.allenby = game.turn
	game.hand_ap = [ptbp]

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("retreat_cancel")

	game = rules.action(game, CP_ROLE, "piece", defender1)
	game = rules.action(game, CP_ROLE, "done")

	expect(game.state).toBe("post_retreat_cc_ap")
	expect(rules.view(game, AP_ROLE).actions.play_cc).toContain(ptbp)

	game = rules.action(game, AP_ROLE, "play_cc", ptbp)
	game = rules.action(game, AP_ROLE, "confirm")

	expect(game.state).toBe("ptbp_extra_attack_prompt")
	expect(game.ptbp_units).toContain(attacker)
})

test("HQ can accompany an eligible advancing combat unit but cannot anchor advance alone", () => {
	let { game, ruDiv3 } = createBattleGame()
	let oltu = findSpaceByName("Oltu")
	let yudenitch = findPieceByName("RU Yudenitch HQ")

	game.active = rules.AP
	game.pieces[yudenitch] = oltu
	game.attack.pieces = [ruDiv3]
	game.attack.origin_by_piece = { [ruDiv3]: oltu }
	game.reduced = [yudenitch]

	let advance = Engine.combat.get_advance_pieces(game, {
		attackers: [ruDiv3],
		advance_with_reduced: false
	})
	expect(advance).toEqual(expect.arrayContaining([ruDiv3, yudenitch]))

	game.reduced = [ruDiv3]
	game.attack.pieces = [ruDiv3, yudenitch]
	game.attack.origin_by_piece = { [ruDiv3]: oltu, [yudenitch]: oltu }
	advance = Engine.combat.get_advance_pieces(game, {
		attackers: [ruDiv3, yudenitch],
		advance_with_reduced: false
	})
	expect(advance).toEqual([])
})

test("advance limit still offers HQ before follow-up advance", () => {
	let game = rules.setup(2026060801, "Historical", { seed: 42, no_supply_warnings: true })
	let bayburt = findSpaceByName("Bayburt")
	let gumushane = findSpaceByName("Gumushane")
	let trabzon = findSpaceByName("Trabzon")
	let tuDiv10 = findPieceByName("TU DIV #10")
	let tuDiv8 = findPieceByName("TU DIV #8")
	let tuDiv9 = findPieceByName("TU DIV #9")
	let enver = findPieceByName("TU Enver HQ")
	let attackers = [tuDiv10, tuDiv8, tuDiv9, enver].sort((a, b) => a - b)

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = bayburt
	game.pieces[tuDiv8] = gumushane
	game.pieces[tuDiv9] = gumushane
	game.control[bayburt] = rules.CP
	game.control[gumushane] = rules.AP
	game.control[trabzon] = rules.AP
	game.active = rules.CP
	game.state = "advance"
	game.attack = {
		space: gumushane,
		pieces: attackers.slice(),
		attacker: rules.CP,
		defender: rules.AP,
		origin_by_piece: Object.fromEntries(attackers.map((p) => [p, bayburt]))
	}
	game.battle_result = { retreat_distance: 2 }
	game.retreat_distance = 2
	game.retreat_first_spaces = [trabzon]
	game.advance_space = gumushane
	game.advance_pieces = [tuDiv10, enver].sort((a, b) => a - b)
	game.advance_count = 2
	game.advance_limit = 3
	game.retreated = []
	game.undo = []

	game = rules.action(game, CP_ROLE, "piece", tuDiv10)

	expect(game.advance_count).toBe(3)
	expect(game.advance_follow_pieces).toContain(tuDiv10)
	expect(game.advance_follow_mode).toBeUndefined()
	expect(game.advance_pieces).toEqual([enver])
	expect(rules.view(game, CP_ROLE).actions.piece).toContain(enver)

	game = rules.action(game, CP_ROLE, "piece", enver)

	expect(game.pieces[enver]).toBe(gumushane)
})

test("Baratov stack can advance full-strength units when another attacker is reduced", () => {
	let game = rules.setup(112, "Historical", { seed: 42, no_supply_warnings: true })
	let baku = findSpaceByName("Baku")
	let enzeli = findSpaceByName("Enzeli")
	let baratov = findPieceByName("RU Baratov HQ")
	let ruDiv14 = findPieceByName("RU DIV #14")
	let ruCav8 = findPieceByName("RU Cavalry #8")
	let attackers = [baratov, ruDiv14, ruCav8]

	for (let p = 0; p < game.pieces.length; p++) game.pieces[p] = 0
	for (let p of attackers) game.pieces[p] = baku
	game.control[baku] = rules.AP
	game.control[enzeli] = rules.CP
	game.active = rules.AP
	game.reduced = [ruCav8]
	game.retreated = []
	game.events = { persian_push: true }
	game.attacked = []
	game.action_state = {}
	game.cc_retained = { ap: [], cp: [] }
	game.cc_retained_after_use = { ap: {}, cp: {} }
	game.combat_cards = { attacker: [], defender: [] }
	game.combat_cards_effected = []
	game.post_roll_cc_done = true
	game.post_battle_cc_done = true
	game.attack = {
		space: enzeli,
		pieces: attackers,
		attacker: rules.AP,
		defender: rules.CP,
		origin_by_piece: Object.fromEntries(attackers.map((p) => [p, baku])),
		initial_attackers: attackers.slice(),
		initial_defenders: []
	}
	game.battle_result = {
		attacker_losses: 0,
		defender_losses: 1,
		retreat_needed: false,
		retreating_faction: null,
		retreating_units: [],
		retreat_can_cancel: false,
		retreat_distance: 1,
		no_advance: false,
		attackers: attackers.slice(),
		defenders: [],
		advance_with_reduced: false
	}

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).toBe("advance")
	expect(game.advance_pieces).toEqual(expect.arrayContaining([ruDiv14, baratov]))
	expect(game.advance_pieces).not.toContain(ruCav8)
	expect(rules.view(game, AP_ROLE).actions.piece).toContain(ruDiv14)

	game = rules.action(game, AP_ROLE, "piece", ruDiv14)

	expect(game.pieces[ruDiv14]).toBe(enzeli)
	expect(rules.view(game, AP_ROLE).actions.piece).toContain(baratov)

	game = rules.action(game, AP_ROLE, "piece", baratov)

	expect(game.pieces[baratov]).toBe(enzeli)
	expect(game.pieces[ruCav8]).toBe(baku)
})

test("Turkish Withdrawal lets different TU units retreat to different legal spaces", () => {
	let game = rules.setup(104, "Historical", { seed: 42 })
	let trabzon = findSpaceByName("Trabzon")
	let rize = findSpaceByName("Rize")
	let giresun = findSpaceByName("Giresun")
	let tuDiv1 = findPieceByName("TU DIV #1")
	let tuDiv2 = findPieceByName("TU DIV #2")

	game.state = "turkish_retreat"
	game.active = rules.CP
	game.attack = {
		space: trabzon,
		pieces: [],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.battle_result = {
		turkish_retreat: true,
		no_advance: false
	}
	game.turkish_retreat_pending = true
	game.turkish_retreat_space = trabzon
	game.turkish_retreat_mandatory = [tuDiv1, tuDiv2]
	game.turkish_retreat_optional = []
	game.retreat_steps_left = {
		[tuDiv1]: 1,
		[tuDiv2]: 1
	}
	game.selected_piece = tuDiv1
	game.retreated = []
	game.pieces[tuDiv1] = trabzon
	game.pieces[tuDiv2] = trabzon

	let firstView = rules.view(game, CP_ROLE)
	expect(firstView.actions.space || []).toContain(rize)
	expect(firstView.actions.space || []).toContain(giresun)

	game = rules.action(game, CP_ROLE, "space", rize)
	game = rules.action(game, CP_ROLE, "piece", tuDiv2)

	let secondView = rules.view(game, CP_ROLE)
	expect(secondView.actions.space || []).toContain(giresun)

	game = rules.action(game, CP_ROLE, "space", giresun)

	expect(game.pieces[tuDiv1]).toBe(rize)
	expect(game.pieces[tuDiv2]).toBe(giresun)
})

test("Cancelled battle lets an untriggered discard cc return to action availability", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let germanHighCommand = findCardByEvent("GERMAN HIGH COMMAND CC")
	let sandstorms = Engine.combat.CC_CP_SANDSTORMS
	let desertSpace = findSpaceByTerrain("desert")

	game.active = rules.AP
	game.attack = {
		space: desertSpace,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.pieces[tuDiv8] = desertSpace
	game.combat_cards = { attacker: [], defender: [germanHighCommand, sandstorms] }
	game.combat_cards_effected = [sandstorms]
	game.hand_cp = []
	game.discard_cp = [germanHighCommand, sandstorms]
	game.removed_cp = []
	game.action_state = { used_ccs: [germanHighCommand, sandstorms] }

	let outcome = Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.cancelled_cc_dispositions).toEqual([
		expect.objectContaining({
			card: germanHighCommand,
			faction: rules.CP,
			after_use: "discard"
		})
	])
	expect(game.hand_cp.includes(germanHighCommand)).toBe(false)
	expect(game.discard_cp.includes(germanHighCommand)).toBe(true)
	expect(game.discard_cp.includes(sandstorms)).toBe(true)

	Engine.combat.apply_cancelled_combat_card_disposition(game, germanHighCommand, "return")

	expect(game.hand_cp.includes(germanHighCommand)).toBe(true)
	expect(game.discard_cp.includes(germanHighCommand)).toBe(false)
	expect(game.discard_cp.includes(sandstorms)).toBe(true)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect((game.action_state.used_ccs || []).includes(germanHighCommand)).toBe(false)
	expect((game.action_state.used_ccs || []).includes(sandstorms)).toBe(true)
})

test("Cancelled battle lets an untriggered discard cc be consumed", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let germanHighCommand = findCardByEvent("GERMAN HIGH COMMAND CC")
	let sandstorms = Engine.combat.CC_CP_SANDSTORMS
	let desertSpace = findSpaceByTerrain("desert")

	game.active = rules.AP
	game.attack = {
		space: desertSpace,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.pieces[tuDiv8] = desertSpace
	game.combat_cards = { attacker: [], defender: [germanHighCommand, sandstorms] }
	game.combat_cards_effected = [sandstorms]
	game.hand_cp = []
	game.discard_cp = [germanHighCommand, sandstorms]
	game.removed_cp = []
	game.action_state = { used_ccs: [germanHighCommand, sandstorms] }

	let outcome = Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.cancelled_cc_dispositions).toEqual([
		expect.objectContaining({
			card: germanHighCommand,
			faction: rules.CP,
			after_use: "discard"
		})
	])

	Engine.combat.apply_cancelled_combat_card_disposition(game, germanHighCommand, "consume")

	expect(game.hand_cp.includes(germanHighCommand)).toBe(false)
	expect(game.discard_cp.includes(germanHighCommand)).toBe(true)
	expect(game.discard_cp.includes(sandstorms)).toBe(true)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect((game.action_state.used_ccs || []).includes(germanHighCommand)).toBe(true)
	expect((game.action_state.used_ccs || []).includes(sandstorms)).toBe(true)
})

test("Cancelled combat card disposition state offers return or consume", () => {
	let { game } = createBattleGame()
	let germanHighCommand = findCardByEvent("GERMAN HIGH COMMAND CC")

	game.state = "cancelled_combat_card_disposition"
	game.active = rules.CP
	game.cancelled_cc_dispositions = [
		{
			card: germanHighCommand,
			faction: rules.CP,
			side: "defender",
			from_retained: false,
			after_use: "discard"
		}
	]
	game.hand_cp = []
	game.discard_cp = [germanHighCommand]
	game.removed_cp = []
	game.combat_cards = { attacker: [], defender: [germanHighCommand] }
	game.combat_cards_effected = []
	game.action_state = { used_ccs: [germanHighCommand] }
	game.battle_result = { cancelled: true }

	let view = rules.view(game, CP_ROLE)

	expect(view.actions.return_cc).toBe(1)
	expect(view.actions.discard_cc).toBe(1)

	rules.action(game, CP_ROLE, "return_cc")

	expect(game.hand_cp.includes(germanHighCommand)).toBe(true)
	expect(game.discard_cp.includes(germanHighCommand)).toBe(false)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect((game.action_state.used_ccs || []).includes(germanHighCommand)).toBe(false)
})

test("Cancelled battle lets an untriggered remove cc return", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let pugnacity = Engine.combat.CC_AP_PUGNACITY
	let sandstorms = Engine.combat.CC_CP_SANDSTORMS
	let desertSpace = findSpaceByTerrain("desert")

	game.active = rules.AP
	game.attack = {
		space: desertSpace,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.pieces[tuDiv8] = desertSpace
	game.combat_cards = { attacker: [pugnacity], defender: [sandstorms] }
	game.combat_cards_effected = [sandstorms]
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = [pugnacity]
	game.hand_cp = []
	game.discard_cp = [sandstorms]
	game.removed_cp = []
	game.action_state = { used_ccs: [pugnacity, sandstorms] }

	let outcome = Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.cancelled_cc_dispositions).toEqual([
		expect.objectContaining({
			card: pugnacity,
			faction: rules.AP,
			after_use: "remove"
		})
	])

	Engine.combat.apply_cancelled_combat_card_disposition(game, pugnacity, "return")

	expect(game.hand_ap.includes(pugnacity)).toBe(true)
	expect(game.removed_ap.includes(pugnacity)).toBe(false)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect((game.action_state.used_ccs || []).includes(pugnacity)).toBe(false)
})

test("Cancelled battle does not return an effected remove cc", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let pugnacity = Engine.combat.CC_AP_PUGNACITY
	let sandstorms = Engine.combat.CC_CP_SANDSTORMS
	let desertSpace = findSpaceByTerrain("desert")

	game.active = rules.AP
	game.attack = {
		space: desertSpace,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.pieces[tuDiv8] = desertSpace
	game.combat_cards = { attacker: [pugnacity], defender: [sandstorms] }
	game.combat_cards_effected = [pugnacity, sandstorms]
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = [pugnacity]
	game.hand_cp = []
	game.discard_cp = [sandstorms]
	game.removed_cp = []
	game.action_state = { used_ccs: [pugnacity, sandstorms] }

	let outcome = Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect(game.hand_ap.includes(pugnacity)).toBe(false)
	expect(game.removed_ap.includes(pugnacity)).toBe(true)
	expect((game.action_state.used_ccs || []).includes(pugnacity)).toBe(true)
})

test("Cancelled battle lets an untriggered remove cc be consumed", () => {
	let { game, ruDiv3, tuDiv8 } = createBattleGame()
	let pugnacity = Engine.combat.CC_AP_PUGNACITY
	let sandstorms = Engine.combat.CC_CP_SANDSTORMS
	let desertSpace = findSpaceByTerrain("desert")

	game.active = rules.AP
	game.attack = {
		space: desertSpace,
		pieces: [ruDiv3],
		attacker: rules.AP,
		defender: rules.CP
	}
	game.pieces[tuDiv8] = desertSpace
	game.combat_cards = { attacker: [pugnacity], defender: [sandstorms] }
	game.combat_cards_effected = [sandstorms]
	game.hand_ap = []
	game.discard_ap = []
	game.removed_ap = [pugnacity]
	game.hand_cp = []
	game.discard_cp = [sandstorms]
	game.removed_cp = []
	game.action_state = { used_ccs: [pugnacity, sandstorms] }

	let outcome = Engine.combat.resolve_battle_sequence(game, { log: () => {} })

	expect(outcome).toBe("end")
	expect(game.battle_result.cancelled).toBe(true)
	expect(game.cancelled_cc_dispositions).toEqual([
		expect.objectContaining({
			card: pugnacity,
			faction: rules.AP,
			after_use: "remove"
		})
	])

	Engine.combat.apply_cancelled_combat_card_disposition(game, pugnacity, "consume")

	expect(game.hand_ap.includes(pugnacity)).toBe(false)
	expect(game.removed_ap.includes(pugnacity)).toBe(true)
	expect(game.cancelled_cc_dispositions).toBeUndefined()
	expect((game.action_state.used_ccs || []).includes(pugnacity)).toBe(true)
})

test("unit inside besieged enemy fort can target the fort in its own space", () => {
	let { game, kars, tuICorps } = createBesiegedFortAttackGame()

	let initialView = rules.view(game, CP_ROLE)
	expect(initialView.actions.piece || []).toContain(tuICorps)

	rules.action(game, CP_ROLE, "piece", tuICorps)

	let targetView = rules.view(game, CP_ROLE)
	expect(targetView.actions.space || []).toContain(kars)
})

test("besieged fort attack uses fort owner instead of current control marker", () => {
	let { game, kars, tuICorps } = createBesiegedFortAttackGame()
	game.control[kars] = rules.CP

	expect(Engine.map.is_controlled_by(game, kars, rules.CP)).toBe(true)
	expect(Engine.map.has_undestroyed_fort(game, kars, rules.AP)).toBe(true)
	expect(Engine.map.is_besieged(game, kars)).toBe(true)
	expect(Engine.combat.can_piece_attack_current_fort(game, tuICorps, rules.CP)).toBe(true)

	let initialView = rules.view(game, CP_ROLE)
	expect(initialView.actions.piece || []).toContain(tuICorps)

	rules.action(game, CP_ROLE, "piece", tuICorps)

	let targetView = rules.view(game, CP_ROLE)
	expect(targetView.actions.space || []).toContain(kars)
})

test("besieging SCU cannot attack out if remaining units cannot maintain the siege", () => {
	let { game, kars, sarikamis, attackers } = createBesiegedFortMaintenanceGame([
		"TU DIV #1",
		"TU DIV #2",
		"TU DIV #3"
	])
	let selected = [attackers[0]]
	let remaining = attackers.slice(1)

	expect(Engine.map.is_besieged(game, kars)).toBe(true)
	expect(Engine.map.can_besiege(game, kars, remaining)).toBe(false)

	let targets = Engine.combat.get_legal_attackable_spaces(game, selected, rules.CP, () => "winter", () => true)
	expect(targets).toContain(kars)
	expect(targets).not.toContain(sarikamis)
})

test("besieging unit may attack out if remaining units still maintain the siege", () => {
	let { game, kars, sarikamis, attackers } = createBesiegedFortMaintenanceGame(["TU DIV #1", "TU I Corps"])
	let selected = [attackers[0]]
	let remaining = [attackers[1]]

	expect(Engine.map.is_besieged(game, kars)).toBe(true)
	expect(Engine.map.can_besiege(game, kars, remaining)).toBe(true)

	let targets = Engine.combat.get_legal_attackable_spaces(game, selected, rules.CP, () => "winter", () => true)
	expect(targets).toContain(kars)
	expect(targets).toContain(sarikamis)
})

test("besieging units cannot move out if remaining units cannot maintain the siege", () => {
	let { game, kars, sarikamis, attackers } = createBesiegedFortMaintenanceGame([
		"TU DIV #1",
		"TU DIV #2",
		"TU DIV #3"
	])
	let ruDiv3 = findPieceByName("RU DIV #3")
	game.pieces[ruDiv3] = 0
	game.control[sarikamis] = rules.CP
	game.moved = []
	game.move = {
		initial: kars,
		current: kars,
		pieces: [attackers[0]],
		spaces_moved: 0,
		touched_spaces: []
	}

	expect(Engine.map.is_besieged(game, kars)).toBe(true)
	expect(Engine.map.can_stack_move_to(game, sarikamis, rules.CP)).toBe(false)
	expect(Engine.map.get_piece_move_block_reason(game, attackers[0], sarikamis, rules.CP)).toContain("围攻兵力不足")

	game.move.pieces = attackers.slice()
	expect(Engine.map.can_stack_move_to(game, sarikamis, rules.CP)).toBe(true)
})

test("besieging unit cannot SR out if remaining units cannot maintain the siege", () => {
	let { game, kars, attackers } = createBesiegedFortMaintenanceGame(["TU DIV #1", "TU DIV #2", "TU DIV #3"])
	let ruDiv3 = findPieceByName("RU DIV #3")
	let route = ["Sarikamis", "Oltu", "Koprukoy", "Erzurum"].map(findSpaceByName)
	for (let s of route) game.control[s] = rules.CP
	game.pieces[ruDiv3] = 0
	game.sr_moved = []

	expect(Engine.map.is_besieged(game, kars)).toBe(true)
	expect(Engine.map.get_supply_status(game, kars, rules.CP, attackers[0], true)).toBe("FULL")
	expect(Engine.map.can_sr_piece(game, attackers[0], rules.CP)).toBe(false)
})

test("below-minimum units and tribes do not keep an enemy fort besieged", () => {
	let { game, kars } = createBesiegedFortMaintenanceGame(["TU DIV #1", "TU DIV #2"])
	let bakhtiari = findPieceByName("Bakhtiari")
	let logs = []
	game.seed = 1
	game.pieces[bakhtiari] = kars

	expect(Engine.map.can_besiege(game, kars, Engine.map.get_pieces_in_space(game, kars))).toBe(false)
	expect(Engine.map.is_besieged(game, kars)).toBe(false)

	Engine.combat.resolve_siege(game, kars, (msg) => logs.push(msg))

	expect(logs).toEqual([])
	expect(game.forts.destroyed || []).not.toContain(kars)
})

test("HQ and Heavy Artillery do not count toward besieging an enemy fort", () => {
	let { game, kars } = createBesiegedFortMaintenanceGame(["TU DIV #1", "TU DIV #2"])
	let mackensen = findPieceByName("GE Mackenson HQ")
	let heavyArtillery = findPieceByName("GE Hvy Arty")

	game.pieces[mackensen] = kars
	game.pieces[heavyArtillery] = kars

	expect(Engine.map.can_besiege(game, kars, Engine.map.get_pieces_in_space(game, kars))).toBe(false)
	expect(Engine.map.is_besieged(game, kars)).toBe(false)
})

test("same-space fort attack does not open an advance step", () => {
	let { game, kars, tuICorps } = createBesiegedFortAttackGame()

	game.attack = {
		space: kars,
		pieces: [tuICorps],
		attacker: rules.CP,
		defender: rules.AP
	}
	game.post_battle_cc_done = true
	game.battle_resolution_applied = true
	game.battle_result = {
		attackers: [tuICorps],
		attacker_losses: 0,
		defender_losses: 0,
		retreat_needed: false,
		no_advance: false,
		advance_with_reduced: false
	}

	Engine.combat.end_battle_sequence(game, () => {})

	expect(game.state).not.toBe("advance")
	expect(game.advance_pieces).toBeUndefined()
})
