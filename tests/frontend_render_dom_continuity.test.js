"use strict"

const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

function getPlaySource() {
	return fs.readFileSync(path.join(__dirname, "..", "play.js"), "utf8")
}

function extractFunction(source, name) {
	const start = source.indexOf(`function ${name}`)
	if (start < 0) {
		throw new Error(`Could not find ${name} in play.js`)
	}
	const brace = source.indexOf("{", start)
	let depth = 0
	for (let i = brace; i < source.length; i++) {
		if (source[i] === "{") depth += 1
		if (source[i] === "}") {
			depth -= 1
			if (depth === 0) {
				return source.slice(start, i + 1)
			}
		}
	}
	throw new Error(`Could not extract ${name} from play.js`)
}

test("empty besieged fort spaces are treated as marker-bearing spaces", () => {
	const source = getPlaySource()
	const context = {
		get_space_control: () => null,
		get_space_default_control: () => null,
		has_id: (set, id) => !!(set && set.has(id))
	}
	vm.createContext(context)
	vm.runInContext(
		`${extractFunction(source, "has_space_special_marker")}
		globalThis.has_space_special_marker = has_space_special_marker`,
		context
	)

	const state = {
		partial_ap_control_markers: null,
		partial_cp_control_markers: null,
		ru_control_markers: null,
		trenches_2: null,
		trenches: null,
		beachheads: null,
		forts_destroyed: null,
		forts_besieged: new Set([42]),
		armenian_uprising_markers: null,
		persian_uprising_markers: null,
		soviet_uprising_markers: null,
		jerusalem_by_christmas_markers: null,
		catastrophic_attack_oos_markers: null,
		activated_move_spaces: null,
		activated_attack_spaces: null
	}

	expect(context.has_space_special_marker({}, state, 42)).toBe(true)
})

test("activation marker sync removes stale DOM markers when count or type changes", () => {
	const source = getPlaySource()
	const removed = []
	const markerList = [
		{ type: "move", ix: 0, element: { remove: () => removed.push("move:0") } },
		{ type: "move", ix: 1, element: { remove: () => removed.push("move:1") } },
		{ type: "attack", ix: 0, element: { remove: () => removed.push("attack:0") } },
		{ type: "besieged", ix: 0, element: { remove: () => removed.push("besieged:0") } }
	]
	const context = {
		get_space_marker_list: () => markerList,
		build_activation_marker: (_space, type, ix) => ({ type, ix })
	}
	vm.createContext(context)
	vm.runInContext(
		`${extractFunction(source, "destroy_markers")}
		${extractFunction(source, "sync_activation_markers")}
		globalThis.sync_activation_markers = sync_activation_markers`,
		context
	)

	const stackParts = { top_markers: [] }
	context.sync_activation_markers(7, "move", 1, stackParts)

	expect(removed).toEqual(["move:1", "attack:0"])
	expect(markerList.map((marker) => `${marker.type}:${marker.ix}`)).toEqual(["move:0", "besieged:0"])
	expect(stackParts.top_markers).toEqual([{ type: "move", ix: 0 }])
})

test("activation cost changes participate in map dirty-space diffing", () => {
	const source = getPlaySource()

	expect(source).toContain('key: "activation_cost"')
	expect(source).toContain("view?.activation_cost")
	expect(source).toContain("snapshot: (value) => (value ? { ...value } : null)")
})

test("map-space action highlights track all direct map click actions", () => {
	const source = getPlaySource()
	const context = {
		view: { actions: {} },
		is_permanently_eliminated_box_space_id: () => false,
		is_reserve_box_space_id: () => false,
		has_clickable_piece_intent_in_space: () => false,
		has_loose_id: (set, id) => !!(set && (set.has(id) || set.has(String(id))))
	}
	vm.createContext(context)
	vm.runInContext(
		`${extractFunction(source, "should_highlight_space")}
		globalThis.should_highlight_space = should_highlight_space`,
		context
	)

	const mapSpaceActions = [
		"action_activate_attack_egypt",
		"action_activate_attack_with_br",
		"action_combine",
		"action_remove_beachhead"
	]

	for (const key of mapSpaceActions) {
		expect(source).toContain(`key: "${key}"`)
		expect(context.should_highlight_space(42, { [key]: new Set([42]) })).toBe(true)
	}
})
