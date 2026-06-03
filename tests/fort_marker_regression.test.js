const rules = require("../rules.js")
const Engine = require("../modules/engine.js")
const { setupGame, findSpace, findPiece, clearBoard } = require("./helpers.js")

const { AP, CP } = Engine.constants
const AP_ROLE = "Allied Powers"

test("destroying a fort clears its besieged marker state", () => {
	let game = setupGame(2026060301, "Historical", { no_supply_warnings: true })
	let erzurum = findSpace("Erzurum")
	let brCorps = findPiece(AP, "BR IX Corps")

	clearBoard(game)
	game.pieces[brCorps] = erzurum
	game.control[erzurum] = CP
	game.forts = { destroyed: [], besieged: [erzurum], owner: { [erzurum]: CP } }

	expect(Engine.map.is_besieged(game, erzurum)).toBe(true)

	Engine.map.destroy_fort(game, erzurum)

	expect(game.forts.destroyed).toContain(erzurum)
	expect(game.forts.besieged).not.toContain(erzurum)
	expect(Engine.map.is_besieged(game, erzurum)).toBe(false)
})

test("fort view hides stale besieged marker for a destroyed fort", () => {
	let game = setupGame(2026060302, "Historical", { no_supply_warnings: true })
	let erzurum = findSpace("Erzurum")

	game.forts = { destroyed: [erzurum], besieged: [erzurum], owner: { [erzurum]: CP } }

	let view = rules.view(game, AP_ROLE)

	expect(view.forts.destroyed).toContain(erzurum)
	expect(view.forts.besieged).not.toContain(erzurum)
})
