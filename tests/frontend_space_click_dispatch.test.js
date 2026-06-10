"use strict"

const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

function loadSpaceClickHelpers(view, overrides = {}) {
	const source = fs.readFileSync(path.join(__dirname, "..", "play.js"), "utf8")
	const start = source.indexOf("const MAP_SPACE_CLICK_ACTIONS")
	const end = source.indexOf("function apply_space_click_intent", start)
	if (start < 0 || end < 0) {
		throw new Error("Could not find space click dispatch helpers in play.js")
	}

	const context = {
		view,
		activation_action_menu: ["activate_move", "activate_attack", "activate_attack_with_br", "deactivate"],
		is_reserve_box_space_id: () => false,
		has_clickable_piece_intent_in_space: () => false,
		...overrides
	}
	context.get_action_noun = (action, noun) => {
		if (!context.view.actions || !Array.isArray(context.view.actions[action])) {
			return undefined
		}
		const list = context.view.actions[action]
		if (list.includes(noun)) {
			return noun
		}
		const noun_key = String(noun)
		return list.find((item) => String(item) === noun_key)
	}
	context.is_action = (action, noun) => context.get_action_noun(action, noun) !== undefined

	vm.createContext(context)
	vm.runInContext(
		`${source.slice(start, end)}
		globalThis.get_space_click_intent = get_space_click_intent
		globalThis.is_map_space_click_action = is_map_space_click_action`,
		context
	)
	return context
}

function loadUiActionNames() {
	const source = fs.readFileSync(path.join(__dirname, "..", "play.js"), "utf8")
	const start = source.indexOf("const UI_ACTIONS = [")
	const end = source.indexOf("function update_actions", start)
	if (start < 0 || end < 0) {
		throw new Error("Could not find UI_ACTIONS in play.js")
	}

	const context = {}
	vm.createContext(context)
	vm.runInContext(
		`${source.slice(start, end)}
		globalThis.UI_ACTION_NAMES = UI_ACTIONS.map(([action]) => action)`,
		context
	)
	return context.UI_ACTION_NAMES
}

test("cancelled combat card disposition actions have frontend buttons", () => {
	const actions = loadUiActionNames()

	expect(actions).toContain("return_cc")
	expect(actions).toContain("discard_cc")
	expect(actions).toContain("remove_cc")
})

test("frontend keeps actionable permanently eliminated pieces clickable", () => {
	const source = fs.readFileSync(path.join(__dirname, "..", "play.js"), "utf8")

	expect(source).toContain(
		"const is_permanently_eliminated_box = is_permanently_eliminated_box_space_id(space_id)"
	)
	expect(source).toContain(
		"const is_clickable_pe_piece = is_permanently_eliminated_box && has_clickable_piece_action(state, piece_id)"
	)
	expect(source).toContain(
		"apply_box_piece_interaction_state(element, state, piece_id, !is_permanently_eliminated_box || is_clickable_pe_piece)"
	)
	expect(source).toContain("if (!is_permanently_eliminated_box || has_clickable_piece_action_in_stack(state, lcu_stack))")
	expect(source).toContain("if (!is_permanently_eliminated_box || has_clickable_piece_action_in_stack(state, scu_stack))")
	expect(source).toContain("if (is_permanently_eliminated_box_space_id(ui_loc) && !piece_click)")
})

test("map-space clicks ignore card and rollback actions with matching numeric ids", () => {
	const { get_space_click_intent } = loadSpaceClickHelpers({
		actions: {
			play_event: [5],
			play_ops: [5],
			play_sr: [5],
			play_rps: [5],
			propose_rollback: [5]
		},
		activated: {}
	})

	expect(get_space_click_intent(5)).toEqual({ type: "none" })
})

test("map-space clicks still prefer direct space and activation intents", () => {
	let helpers = loadSpaceClickHelpers({
		actions: {
			space: ["5"],
			play_event: [5]
		},
		activated: {}
	})
	expect(helpers.get_space_click_intent(5)).toEqual({ type: "send_space" })

	helpers = loadSpaceClickHelpers({
		actions: {
			activate_attack: [5],
			play_event: [5]
		},
		activated: {}
	})
	expect(helpers.get_space_click_intent(5)).toEqual({ type: "show_activation_popup" })
})

test("map-space clicks show activation menu instead of directly paying British No Attack penalty", () => {
	const helpers = loadSpaceClickHelpers({
		actions: {
			activate_move: [5],
			activate_attack_with_br: [5]
		},
		activated: {}
	})

	expect(helpers.get_space_click_intent(5)).toEqual({ type: "show_activation_popup" })
})

test("map-space clicks may dispatch explicit map-space actions", () => {
	const { get_space_click_intent, is_map_space_click_action } = loadSpaceClickHelpers({
		actions: {
			combine: [5],
			propose_rollback: [5]
		},
		activated: {}
	})

	expect(is_map_space_click_action("combine")).toBe(true)
	expect(is_map_space_click_action("propose_rollback")).toBe(false)
	expect(get_space_click_intent(5)).toEqual({ type: "send_action", action: "combine" })
})

test("map-space clicks dispatch Egypt-only attack and beachhead removal actions directly", () => {
	let helpers = loadSpaceClickHelpers({
		actions: {
			activate_attack_egypt: [5]
		},
		activated: {}
	})

	expect(helpers.get_space_click_intent(5)).toEqual({ type: "send_action", action: "activate_attack_egypt" })

	helpers = loadSpaceClickHelpers({
		actions: {
			remove_beachhead: [5]
		},
		activated: {}
	})

	expect(helpers.get_space_click_intent(5)).toEqual({ type: "send_action", action: "remove_beachhead" })
})
