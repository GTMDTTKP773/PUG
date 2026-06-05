const rules = require("../rules.js")
const Engine = require("../modules/engine.js")

const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const CP_ROLE = rules.roles[1]

function prepareGaliciaAttack(game) {
	const galicia = findSpace("Galicia")
	const hermannstadt = findSpace("Hermannstadt")
	const heavy = findPiece(CP, "GE Hvy Arty")
	const army = findPiece(CP, "German 11th Army")
	const corps = findPiece(CP, "GE IV R Corps")
	const defender = findPiece(AP, "RO 1 Army")

	clearBoard(game)
	game.events.bulgaria = 1
	game.events.romania = 1
	game.pieces[heavy] = galicia
	game.pieces[army] = galicia
	game.pieces[corps] = galicia
	game.pieces[defender] = hermannstadt
	game.control[galicia] = CP
	game.control[hermannstadt] = AP
	game.active = CP
	game.moved = []
	game.attacked = []
	game.attacked_spaces = []
	game.retreated = []

	return { galicia, hermannstadt, heavy, army, corps }
}

test("Heavy Artillery cannot be the sole selected attacker", () => {
	let game = setupGame(2026052204, "Historical")
	let { galicia, hermannstadt, heavy, army } = prepareGaliciaAttack(game)

	game.state = "attack"
	game.activated = { move: [], attack: [galicia] }

	let view = rules.view(game, CP_ROLE)
	expect(view.actions.piece || []).toEqual(expect.arrayContaining([heavy, army]))

	game = rules.action(game, CP_ROLE, "piece", heavy)
	view = rules.view(game, CP_ROLE)

	expect(game.attack.pieces).toEqual([heavy])
	expect(view.actions.space || []).not.toContain(hermannstadt)

	game = rules.action(game, CP_ROLE, "piece", army)
	view = rules.view(game, CP_ROLE)

	expect(game.attack.pieces.sort((a, b) => a - b)).toEqual([heavy, army].sort((a, b) => a - b))
	expect(view.actions.space || []).toContain(hermannstadt)
})

test("Stack-based attack activation can include Heavy Artillery only with combat units", () => {
	let game = setupGame(2026052205, "Historical")
	let { galicia, heavy, army, corps } = prepareGaliciaAttack(game)

	game.state = "activate_spaces"
	game.ops = 2
	game.card_ops = 2
	game.activated = { move: [], attack: [] }
	game.activation_cost = {}
	game.region_activations = { move: {}, attack: {} }

	let view = rules.view(game, CP_ROLE)
	expect(view.actions.activate_attack || []).toContain(galicia)

	game = rules.action(game, CP_ROLE, "activate_attack", galicia)
	view = rules.view(game, CP_ROLE)

	expect(game.state).toBe("activate_region_stack")
	expect(view.actions.piece || []).toEqual(expect.arrayContaining([heavy, army, corps]))

	for (let p of [heavy, army, corps]) game = rules.action(game, CP_ROLE, "piece", p)
	view = rules.view(game, CP_ROLE)
	expect(view.actions.confirm).toBe(1)

	game = rules.action(game, CP_ROLE, "confirm")
	expect(game.region_activations.attack[galicia][0].pieces.sort((a, b) => a - b)).toEqual(
		[heavy, army, corps].sort((a, b) => a - b)
	)
})

test("Reduced Heavy Artillery contributes only +1 attack DRM", () => {
	let game = setupGame(2026060601, "Historical", { no_supply_warnings: true })
	let { hermannstadt, heavy, army } = prepareGaliciaAttack(game)
	let logs = []

	game.reduced = [heavy]
	game.combat_cards = { attacker: [], defender: [] }
	game.attack = {
		space: hermannstadt,
		pieces: [heavy, army],
		attacker: CP,
		defender: AP
	}

	Engine.combat.resolve_battle_sequence(game, { log: (msg) => logs.push(msg) })

	expect(Engine.data.pieces[heavy].lf).toBe(2)
	expect(Engine.data.pieces[heavy].rlf).toBe(1)
	expect(game.battle_result.att_drm).toBe(1)
	expect(logs).toContain("  进攻方重炮部队提供 +1 DRM")
})
