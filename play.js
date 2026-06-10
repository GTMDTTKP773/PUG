/* global data layout */
"use strict"

const { cards, spaces, pieces } = data
const map_space_count = spaces.length
const space_by_name = Object.create(null)
for (let i = 0; i < spaces.length; ++i) {
	const s = spaces[i]
	if (s && s.name) {
		space_by_name[s.name] = i
	}
}
const AP_RESERVE_BOX = spaces.findIndex((s) => s.name === "AP Reserve")
const CP_RESERVE_BOX = spaces.findIndex((s) => s.name === "CP Reserve")
const AP_CORPS_ASSETS_BOX = spaces.findIndex((s) => s.name === "AP Corps Assets")
const CP_CORPS_ASSETS_BOX = spaces.findIndex((s) => s.name === "CP Corps Assets")
const AP_ELIMINATED_BOX = spaces.findIndex((s) => s.name === "AP Eliminated")
const CP_ELIMINATED_BOX = spaces.findIndex((s) => s.name === "CP Eliminated")
const AP_PERMANENTLY_ELIMINATED_BOX = spaces.findIndex((s) => s.name === "AP Permanently Eliminated Box")
const CP_PERMANENTLY_ELIMINATED_BOX = spaces.findIndex((s) => s.name === "CP Permanently Eliminated Box")

const DOIRAN = 73

const SUPPLY_OVERLAY_SPACE_IDS = []
const UPDATE_SPACE_IDS = []
const UPDATE_SPACE_ID_FLAGS = new Uint8Array(map_space_count)
const RESERVE_BOX_SPACE_IDS = []
const RESERVE_BOX_SPACE_ID_FLAGS = new Uint8Array(map_space_count)
const ELIMINATED_BOX_SPACE_IDS = []
const EMPTY_PIECE_IDS = []

for (let s = 1; s < map_space_count; ++s) {
	const space = spaces[s]
	if (!space) {
		continue
	}
	const is_eliminated =
		s === AP_ELIMINATED_BOX ||
		s === CP_ELIMINATED_BOX ||
		s === AP_PERMANENTLY_ELIMINATED_BOX ||
		s === CP_PERMANENTLY_ELIMINATED_BOX
	if (is_eliminated) {
		ELIMINATED_BOX_SPACE_IDS.push(s)
		continue
	}
	const is_reserve =
		s === AP_RESERVE_BOX ||
		s === CP_RESERVE_BOX ||
		s === AP_CORPS_ASSETS_BOX ||
		s === CP_CORPS_ASSETS_BOX ||
		space.type === "Reserve Box" ||
		space.map === "Reserve Box"
	if (is_reserve) {
		RESERVE_BOX_SPACE_IDS.push(s)
		RESERVE_BOX_SPACE_ID_FLAGS[s] = 1
		continue
	}
	if (space.type === "generated_gap") {
		continue
	}
	if (space.type === "reinforcement" || space.type === "ui") {
		continue
	}
	SUPPLY_OVERLAY_SPACE_IDS.push(s)
	UPDATE_SPACE_IDS.push(s)
	UPDATE_SPACE_ID_FLAGS[s] = 1
}

function init_layout() {
	if (typeof layout === "undefined") window.layout = {}
	if (typeof data === "undefined") {
		console.error("Data is not defined during layout initialization.")
		return
	}
	const SPACE_OFFSET_X = 0
	const SPACE_OFFSET_Y = 0
	for (let i = 1; i < data.spaces.length; ++i) {
		const s = data.spaces[i]
		if (s && s.name && s.x !== undefined && s.y !== undefined) {
			const w = s.w || 80
			const h = s.h || 80
			layout[s.name] = [s.x - w / 2 + SPACE_OFFSET_X, s.y - h / 2 + SPACE_OFFSET_Y, w, h]
		}
	}
	if (data.ui) {
		for (let i = 0; i < data.ui.length; ++i) {
			const u = data.ui[i]
			const key = u && (u.key || u.name)
			const x = Number(u?.x)
			const y = Number(u?.y)
			if (key && !Number.isNaN(x) && !Number.isNaN(y)) {
				const w = Number(u?.w)
				const h = Number(u?.h)
				const ww = Number.isNaN(w) || w <= 0 ? 75 : w
				const hh = Number.isNaN(h) || h <= 0 ? 75 : h
				// ui.csv 沿用本项目既有语义：x/y 直接作为 layout 记录值写入。
				// 普通 UI 标记的最终显示方式由各自渲染函数决定，不能在这里统一改成中心点语义。
				layout[key] = [x, y, ww, hh]
			}
		}
	}
}

init_layout()

const MAX_TURN_TRACK = 17

const DEBUG_SPACES = false
const DEBUG_CONNECTIONS = false
function read_debug_switch(name, fallback = false) {
	if (typeof window === "undefined" || typeof params === "undefined" || !params || !params.title_id) {
		return fallback
	}
	const value = window.localStorage[`${params.title_id}/${name}`]
	if (value === "1" || value === "true") {
		return true
	}
	if (value === "0" || value === "false") {
		return false
	}
	return fallback
}
let DEBUG_INTERACTION_PERF = read_debug_switch("debug_interaction_perf", false)
let DEBUG_TRIBE_RESERVE = read_debug_switch("debug_tribe_reserve", false)
let interaction_perf_seq = 0
let last_interaction_perf = null
const AP = "ap"
const CP = "cp"
const ELIMINATED = 0
const REMOVED = -2
const REINFORCEMENTS = -3

const SYSTEM_PIECE_NAMES = new Set([
	"Turn Marker",
	"AP MO Marker",
	"CP MO Marker",
	"VP Marker",
	"AP WS Marker",
	"CP WS Marker",
	"俄国VP点",
	"圣战标志",
	"联合战争状态",
	"CP Air Superiority token",
	"U_boats in the Med token"
])

const MINOR = "minor"
const OTHER = "other"
const ap_reserve_box_order = ["ru", "br", "in", "anz", "sb", "ro", "fr", OTHER]
const cp_reserve_box_order = ["tu", "tua", "bu", "ge", "ah", MINOR]
const ap_eliminated_box_order = ["ru", "br", "anz", "in", "sb", "fr", "ro", OTHER]
const cp_eliminated_box_order = ["tu", "tua", "bu", "ge", "ah", MINOR, "tr"]


const REINFORCEMENT_BOARD_WIDTH = 1080
const AP_REINFORCEMENT_BOARD_HEIGHT = 1200
const CP_REINFORCEMENT_BOARD_HEIGHT = 960
let reinforcement_slot_map = null
let tribe_reserve_space_map = null

let style = "bevel"
let mouse_focus = 0

/**
 * 设置当前 UI 渲染风格（如 'bevel' 或 'flat'）。
 * @param {string} x - 风格名称（"bevel" 或 "flat"）。
 */
function set_style(x) {
	style = x
	window.localStorage[`${params.title_id}/style`] = x
	check_menu("style_bevel", style === "bevel")
	check_menu("style_flat", style === "flat")
	const body = document.querySelector("body")
	body.classList.toggle("bevel", style === "bevel")
	body.classList.toggle("flat", style === "flat")
	if (typeof view !== "undefined" && view) {
		update_map()
	}
}

/**
 * 设置鼠标聚焦模式。
 * @param {number} [x] - 聚焦模式（0 或 1）。如果不提供，则切换当前模式。
 */
function set_mouse_focus(x) {
	if (x === undefined) {
		mouse_focus = 1 - mouse_focus
	} else {
		mouse_focus = x
	}
	window.localStorage[`${params.title_id}/mouse_focus`] = mouse_focus
	check_menu("mouse_focus", mouse_focus === 1)
}

/**
 * 更新菜单项的选择状态。
 * @param {string} id - 菜单项的 ID。
 * @param {boolean} x - 是否选中。
 */
function check_menu(id, x) {
	const elt = document.getElementById(id)
	if (elt) {
		elt.className = x ? "menu_item checked" : "menu_item unchecked"
	}
}

let showing_supply = false
let supply_dirty_spaces = null

/**
 * 显示协约国的补给线，并记录实际加过补给样式的格子，方便之后只清理这些格子。
 * @param {Object} supply - 包含 western/eastern 补给状态的对象。
 */
function show_ap_supply(supply) {
	if (showing_supply) hide_supply()
	showing_supply = true
	supply_dirty_spaces = []
	for (let s of SUPPLY_OVERLAY_SPACE_IDS) {
		const space = spaces[s]
		if (!space || !space.element) continue
		const western = !!(supply.western && supply.western[s] > 0)
		const eastern = !!(supply.eastern && supply.eastern[s] > 0)
		const el = space.element
		el.classList.toggle("western_supply", western)
		el.classList.toggle("eastern_supply", eastern)
		el.classList.toggle("no_supply", !western && !eastern)
		supply_dirty_spaces.push(s)
	}
}

/**
 * 显示同盟国的补给线，并记录实际加过补给样式的格子，方便之后只清理这些格子。
 * @param {Object} supply - 包含 cp 补给状态的对象。
 */
function show_cp_supply(supply) {
	if (showing_supply) hide_supply()
	showing_supply = true
	supply_dirty_spaces = []
	for (let s of SUPPLY_OVERLAY_SPACE_IDS) {
		const space = spaces[s]
		if (!space || !space.element) continue
		const cp = !!(supply.cp && supply.cp[s] > 0)
		const el = space.element
		el.classList.toggle("cp_supply", cp)
		el.classList.toggle("no_supply", !cp)
		supply_dirty_spaces.push(s)
	}
}

/**
 * 隐藏地图上的补给线。优先清理本次显示时记录的格子，缺少记录时回退到完整补给格列表。
 */
function hide_supply() {
	if (!showing_supply) return
	showing_supply = false
	const to_clear = supply_dirty_spaces || SUPPLY_OVERLAY_SPACE_IDS
	for (let s of to_clear) {
		const space = spaces[s]
		if (space && space.element) {
			space.element.classList.remove("western_supply", "eastern_supply", "cp_supply", "no_supply")
		}
	}
	supply_dirty_spaces = null
}

let focus_key = null
let focus_is_reinforcement_board = false
let focus_box = document.getElementById("focus")
let pending_focus_dirty_spaces = null

function hide_focus_box() {
	if (focus_box) {
		focus_box.style.display = "none"
	}
}

function focus_box_is_on_reinforcement_board() {
	const parent = focus_box && focus_box.parentNode
	return !!(parent && (parent.id === "ap_reinforcements" || parent.id === "cp_reinforcements"))
}

function normalize_tribe_reserve_name(name) {
	return String(name || "")
		.replace(/#\d+/g, "")
		.replace(/\s+/g, " ")
		.trim()
}

function log_tribe_reserve(...args) {
	if (DEBUG_TRIBE_RESERVE) {
		console.log("[调试][tribe-reserve]", ...args)
	}
}

function ensure_tribe_reserve_space_map() {
	if (tribe_reserve_space_map) {
		return
	}
	tribe_reserve_space_map = new Map()
	for (let i = 1; i < spaces.length; ++i) {
		const s = spaces[i]
		if (!s) {
			continue
		}
		const is_reserve_box = s.type === "Reserve Box" || s.map === "Reserve Box"
		if (!is_reserve_box || !s.name) {
			continue
		}
		tribe_reserve_space_map.set(normalize_tribe_reserve_name(s.name), i)
	}
	log_tribe_reserve("reserve map ready", tribe_reserve_space_map.size)
}

function get_ui_piece_location(piece, raw_loc) {
	if (!piece) {
		return raw_loc
	}
	if (raw_loc === REINFORCEMENTS && piece.type === "tribe") {
		ensure_tribe_reserve_space_map()
		const key = normalize_tribe_reserve_name(piece.name)
		const mapped = tribe_reserve_space_map.get(key)
		if (mapped > 0) {
			log_tribe_reserve("remap", piece.name, "raw:", raw_loc, "->", mapped)
			return mapped
		}
		log_tribe_reserve("no reserve mapping", piece.name, "raw:", raw_loc)
	}
	return raw_loc
}

function is_reserve_box_space_id(s) {
	return s > 0 && s < map_space_count && RESERVE_BOX_SPACE_ID_FLAGS[s] === 1
}

function is_permanently_eliminated_box_space_id(s) {
	return s === AP_PERMANENTLY_ELIMINATED_BOX || s === CP_PERMANENTLY_ELIMINATED_BOX
}

function get_eliminated_box_order(space_id) {
	return space_id === AP_ELIMINATED_BOX || space_id === AP_PERMANENTLY_ELIMINATED_BOX
		? ap_eliminated_box_order
		: cp_eliminated_box_order
}

function get_box_fallback_group(order) {
	if (!Array.isArray(order) || order.length === 0) {
		return null
	}
	if (order.includes(MINOR)) {
		return MINOR
	}
	if (order.includes(OTHER)) {
		return OTHER
	}
	return order[order.length - 1]
}

function get_eliminated_box_side(space_id) {
	return space_id === AP_ELIMINATED_BOX || space_id === AP_PERMANENTLY_ELIMINATED_BOX ? "ap" : "cp"
}

/**
 * 获取堆栈的唯一标识键。
 * @param {HTMLElement[]} stack - 目标堆栈。
 * @returns {string|null} 唯一标识键。
 */
function get_stack_key(stack) {
	if (!stack) {
		return null
	}
	if (stack.is_reinforcement_board) {
		const x = Number(stack.x)
		const y = Number(stack.y)
		if (Number.isFinite(x) && Number.isFinite(y)) {
			return `reinforcement:${stack.side || ""}:${x}:${y}:${stack.name || ""}`
		}
	}
	// 优先使用显式名称，这是最稳定的 ID
	if (stack.name) {
		// 如果堆栈名称中没有包含位置信息，尝试添加地块 ID 提高唯一性
		const el = stack[0]
		if (el && el.dataset && el.dataset.space !== undefined) {
			return `stack:${el.dataset.space}:${stack.name}`
		}
		if (el && el.marker && el.marker.space !== undefined) {
			return `stack:${el.marker.space}:${stack.name}`
		}
		return `stack:${stack.name}`
	}

	// 回退逻辑：尝试从元素属性推断
	const el = stack[0]
	if (el && el.parentNode) {
		const parent_id = el.parentNode.id || "unnamed_parent"
		// 如果是标记，通常会有 marker 属性
		if (el.marker && el.marker.space !== undefined) {
			return `space_stack:${el.marker.space}`
		}
		// 如果在某个地块容器中
		if (el.dataset && el.dataset.space !== undefined) {
			return `space_stack:${el.dataset.space}`
		}
		// 最后的回退方案：使用父容器 ID + 坐标
		return `pos_stack:${parent_id}:${el.style.left}:${el.style.top}`
	}
	return null
}

/**
 * 判断堆栈是否处于聚焦状态。
 * @param {HTMLElement[]} stack - 目标堆栈。
 * @returns {boolean} 是否处于聚焦状态。
 */
function is_stack_focused(stack) {
	if (!stack || !focus_key) {
		return false
	}
	return get_stack_key(stack) === focus_key
}

function parse_space_id_from_focus_key(key) {
	if (!key || typeof key !== "string") {
		return -1
	}
	let match = key.match(/^stack:(\d+):/)
	if (match) {
		return Number(match[1])
	}
	match = key.match(/^space_stack:(\d+)/)
	if (match) {
		return Number(match[1])
	}
	if (key.startsWith("stack:")) {
		const name = key.slice("stack:".length)
		if (Object.prototype.hasOwnProperty.call(space_by_name, name)) {
			return space_by_name[name]
		}
	}
	return -1
}

function get_stack_space_id(stack) {
	if (!stack) {
		return -1
	}
	if (typeof stack.space_id === "number") {
		return stack.space_id
	}
	const el = stack[0]
	if (el && el.marker && typeof el.marker.space === "number") {
		return el.marker.space
	}
	if (el && el.dataset && el.dataset.space !== undefined) {
		const id = Number(el.dataset.space)
		return Number.isFinite(id) ? id : -1
	}
	if (el && el.piece !== undefined) {
		const p = el.piece
		const piece = pieces[p]
		const raw_loc = get_piece_location(p)
		const loc = get_ui_piece_location(piece, raw_loc)
		if (Number.isFinite(loc)) {
			return loc
		}
	}
	const key = get_stack_key(stack)
	return parse_space_id_from_focus_key(key)
}

function mark_focus_dirty_space_id(s) {
	if (!(s > 0 && s < map_space_count && UPDATE_SPACE_ID_FLAGS[s] === 1)) {
		return
	}
	if (!pending_focus_dirty_spaces) {
		pending_focus_dirty_spaces = new Set()
	}
	pending_focus_dirty_spaces.add(s)
}

function mark_focus_dirty_by_key(key) {
	mark_focus_dirty_space_id(parse_space_id_from_focus_key(key))
}

function mark_focus_dirty_by_stack(stack) {
	mark_focus_dirty_space_id(get_stack_space_id(stack))
}

function get_stack_debug_target(evt) {
	const t = evt && evt.target
	if (!t) {
		return null
	}
	if (t.piece !== undefined) {
		return `piece:${t.piece}`
	}
	if (t.marker) {
		const marker_type = t.marker.type || t.marker.name || "marker"
		if (t.marker.space !== undefined) {
			return `marker:${marker_type}@${t.marker.space}`
		}
		return `marker:${marker_type}`
	}
	if (t.space !== undefined) {
		return `space:${t.space}`
	}
	if (t.id) {
		return `#${t.id}`
	}
	const tag = t.tagName || "node"
	const cls = typeof t.className === "string" ? t.className.trim().replace(/\s+/g, ".") : ""
	return cls ? `${tag}.${cls}` : tag
}

function now_ms() {
	const perf =
		typeof window !== "undefined" && window && window.performance && typeof window.performance.now === "function"
			? window.performance
			: null
	if (perf) {
		return perf.now()
	}
	return Date.now()
}

function log_interaction_perf(phase, payload = {}) {
	if (!DEBUG_INTERACTION_PERF) {
		return
	}
	console.log("[调试][perf]", JSON.stringify({ phase, ...payload }))
}

function begin_interaction_perf(event_name, evt, extra = null) {
	if (!DEBUG_INTERACTION_PERF) {
		return 0
	}
	const id = ++interaction_perf_seq
	const started_at = now_ms()
	last_interaction_perf = { id, event_name, started_at, target: get_stack_debug_target(evt) }
	const payload = { id, event_name, target: last_interaction_perf.target, started_at }
	if (extra && typeof extra === "object") {
		Object.assign(payload, extra)
	}
	log_interaction_perf("interaction.start", payload)
	return id
}

function mark_interaction_perf(id, phase, extra = null) {
	if (!DEBUG_INTERACTION_PERF || !id || !last_interaction_perf || last_interaction_perf.id !== id) {
		return
	}
	const payload = {
		id,
		event_name: last_interaction_perf.event_name,
		target: last_interaction_perf.target,
		elapsed_ms: Math.round((now_ms() - last_interaction_perf.started_at) * 100) / 100
	}
	if (extra && typeof extra === "object") {
		Object.assign(payload, extra)
	}
	log_interaction_perf(phase, payload)
}

function end_interaction_perf(id, phase, extra = null) {
	if (!DEBUG_INTERACTION_PERF || !id || !last_interaction_perf || last_interaction_perf.id !== id) {
		return
	}
	mark_interaction_perf(id, phase, extra)
	last_interaction_perf = null
}

function set_perf_debug(enabled) {
	DEBUG_INTERACTION_PERF = !!enabled
	if (typeof window !== "undefined" && typeof params !== "undefined" && params && params.title_id) {
		window.localStorage[`${params.title_id}/debug_interaction_perf`] = DEBUG_INTERACTION_PERF ? "1" : "0"
	}
	return DEBUG_INTERACTION_PERF
}

// UI Elements
let ui = {
	map: document.getElementById("map"),
	cards: document.getElementById("cards"),
	combat_cards: document.getElementById("combat_cards"),
	unused_combat_cards: document.getElementById("unused_combat_cards"),
	active_cards: document.getElementById("active_cards"),
	cc_list: document.getElementById("cc-list"),
	active_card_zone: document.getElementById("active_card_zone"),
	spaces: document.getElementById("spaces"),
	pieces: document.getElementById("pieces"),
	markers: document.getElementById("markers"),
	status: document.getElementById("status"),
	card_list: [],
	piece_list: [],
	space_list: []
}

/**
 * 切换标记和单位的可见性。
 * 循环切换：显示全部 -> 隐藏标记 -> 隐藏单位 -> 显示全部。
 */
function toggle_counters() {
	const classList = ui.map.classList
	if (classList.contains("hide_markers")) {
		classList.remove("hide_markers")
		classList.remove("hide_pieces")
	} else if (classList.contains("hide_pieces")) {
		classList.add("hide_markers")
	} else {
		classList.add("hide_pieces")
	}
	clear_neutral_marker_peek()
}

/**
 * 使 DOM 元素可拖拽。
 * @param {HTMLElement|string} container - 要移动的容器元素或选择器。
 * @param {HTMLElement|string} [handle] - 用于拖拽的句柄元素或选择器（可选）。
 */
function drag_element(container, handle) {
	const elt = typeof container === "string" ? document.querySelector(container) : container
	if (!elt) {
		return
	}

	const dragHandle = handle
		? typeof handle === "string"
			? elt.querySelector(handle) || document.querySelector(handle)
			: handle
		: elt.querySelector(".dialog_header") || elt

	if (!dragHandle) {
		return
	}

	let pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0
	dragHandle.onmousedown = dragMouseDown

	/**
	 * 处理鼠标按下事件。
	 * @param {MouseEvent} e - 事件对象。
	 */
	function dragMouseDown(e) {
		const evt = e || window.event
		if (
			evt.target &&
			typeof evt.target.closest === "function" &&
			evt.target.closest(
				".dialog_x, .track_resize_handle, .track_turn_controls, .track_turn_menu, button, a, input, select, textarea, [role='button']"
			)
		) {
			return
		}
		evt.preventDefault()
		pos3 = evt.clientX
		pos4 = evt.clientY
		document.onmouseup = closeDragElement
		document.onmousemove = elementDrag
	}

	/**
	 * 处理元素拖拽事件。
	 * @param {MouseEvent} e - 事件对象。
	 */
	function elementDrag(e) {
		const evt = e || window.event
		evt.preventDefault()
		pos1 = pos3 - evt.clientX
		pos2 = pos4 - evt.clientY
		pos3 = evt.clientX
		pos4 = evt.clientY
		elt.style.top = `${elt.offsetTop - pos2}px`
		elt.style.left = `${elt.offsetLeft - pos1}px`
	}

	/**
	 * 处理拖拽停止事件。
	 */
	function closeDragElement() {
		document.onmouseup = null
		document.onmousemove = null
	}
}

const schedule_frame = globalThis.requestAnimationFrame
	? globalThis.requestAnimationFrame.bind(globalThis)
	: (cb) => setTimeout(cb, 0)

/**
 * 显示对话框并生成其内容。
 * @param {string} id - 对话框元素的 ID。
 * @param {function} [dialog_generator] - 用于生成对话框内容的函数。
 */
function show_dialog(id, dialog_generator) {
	const dialog = document.getElementById(id)
	if (!dialog) {
		return
	}
	dialog.hidden = false
	const compact_layout = window.matchMedia("(max-width: 800px)").matches

	if (compact_layout) {
		dialog.style.position = ""
		dialog.style.zIndex = ""
		dialog.style.left = ""
		dialog.style.top = ""
	}

	// Position sub-dialogs (like card lists) near mouse if they just appeared
	if (!compact_layout && id.includes("_dialog") && window.last_mouse_event) {
		const x = window.last_mouse_event.clientX
		const y = window.last_mouse_event.clientY

		// Set initial position based on mouse
		dialog.style.position = "fixed"
		dialog.style.zIndex = "1000"

		// Use requestAnimationFrame to ensure dialog is rendered and we can get its dimensions
		schedule_frame(() => {
			const rect = dialog.getBoundingClientRect()
			let left = x - rect.width / 2
			let top = y + 10

			// Viewport constraints
			if (left < 10) {
				left = 10
			}
			if (left + rect.width > window.innerWidth - 10) {
				left = Math.max(10, window.innerWidth - rect.width - 10)
			}
			if (top + rect.height > window.innerHeight - 10) {
				top = Math.max(10, window.innerHeight - rect.height - 10)
			}

			dialog.style.left = `${left}px`
			dialog.style.top = `${top}px`
		})
	}

	const body = dialog.querySelector(".dialog_body")
	if (!body) {
		return
	}
	body.replaceChildren()
	if (dialog_generator) {
		dialog_generator(body)
	}
}
window.show_dialog = show_dialog

// Global mouse tracker
window.last_mouse_event = null
document.addEventListener(
	"mousedown",
	(e) => {
		window.last_mouse_event = e
	},
	true
)

/**
 * 隐藏指定的对话框。
 * @param {string} id - 对话框元素的 ID。
 */
function hide_dialog(id) {
	const dialog = document.getElementById(id)
	if (!dialog) {
		return
	}
	dialog.hidden = true
}
window.hide_dialog = hide_dialog

/**
 * 显示卡牌列表对话框（弃牌堆、移出游戏、牌库与手牌）。
 * @param {string} id - 对话框 ID。
 * @param {object} card_lists - 包含 discard、removed、deck 卡牌 ID 数组的对象。
 */
function show_card_list(id, card_lists) {
	if (!card_lists) {
		return
	}
	const dialog_elt = document.getElementById(id)
	if (dialog_elt) {
		drag_element(dialog_elt)
	}
	show_dialog(id, (body) => {
		const discard = card_lists.discard || []
		const removed = card_lists.removed || []
		const deck = card_lists.deck || []
		if (discard.length === 0 && removed.length === 0 && deck.length === 0) {
			body.innerHTML = `<div style="padding:20px;text-align:center;color:#7f8c8d">无卡牌</div>`
			return
		}
		const dl = document.createElement("dl")
		const append_header = (text) => {
			const header = document.createElement("dt")
			header.textContent = text
			dl.appendChild(header)
		}
		const append_card = (c) => {
			const p = document.createElement("dd")
			p.className = `cardtip ${cards[c]?.faction === "ap" ? "ap-card" : "cp-card"}`
			p.onmouseenter = () => on_focus_card_tip(c)
			p.onmouseleave = on_blur_card_tip
			p.onclick = () => on_click_card_tip(c)
			p.textContent = cards[c]?.name || `未知卡牌 #${c}`
			dl.appendChild(p)
		}
		append_header(`弃牌堆 (${discard.length})`)
		discard.forEach(append_card)
		append_header(`移出游戏 (${removed.length})`)
		removed.forEach(append_card)
		append_header(`手牌或牌库 (${deck.length})`)
		deck.forEach(append_card)
		body.appendChild(dl)
	})
}

/**
 * 滚动到增援板视图。
 */
function to_reinforcements() {
	scroll_into_view(document.getElementById("reinforcements"))
}

/**
 * 格式化强制进攻 (MO) 的文本。
 * @param {string} mo - MO 的内部名称。
 * @param {string} faction - 势力 (AP 或 CP)。
 * @returns {string} 格式化后的中文名称。
 */
function format_mo_text(mo, faction) {
	if (!mo) {
		return "无"
	}
	if (faction === AP) {
		switch (mo) {
			case "russia":
				return "俄国"
			case "british":
				return "英帝国"
			case "mesopotamia":
				return "美索不达米亚"
			case "british_no_attack":
				return "英国禁攻"
			case "balkans":
				return "巴尔干"
			case "egypt":
				return "埃及"
			case "none":
				return "无"
			default:
				return mo
		}
	}
	switch (mo) {
		case "russia":
			return "俄国"
		case "british":
			return "英帝国"
		case "turkey":
			return "土耳其"
		case "enver":
			return "恩维尔"
		case "none":
			return "无"
		default:
			return mo
	}
}

/**
 * 去除日志文本中的前缀标记。
 * @param {string} text - 原始日志文本。
 * @returns {string} 处理后的文本。
 */
function strip_log_prefixes(text) {
	if (text.startsWith(">")) {
		text = text.substring(1)
	}
	if (text.startsWith("*")) {
		text = text.substring(1)
	}
	if (text.startsWith("!")) {
		return `\u2757 ${text.substring(1)}`
	}
	if (text.startsWith("#cp")) {
		return text.substring(4)
	}
	if (text.startsWith("#ap")) {
		return text.substring(4)
	}
	if (text.startsWith(".h1")) {
		return text.substring(4)
	}
	if (text.startsWith(".h2")) {
		return text.substring(4)
	}
	if (text.startsWith(".h3cp")) {
		return text.substring(6)
	}
	if (text.startsWith(".h3ap")) {
		return text.substring(6)
	}
	if (text.startsWith(".h3")) {
		return text.substring(4)
	}
	return text
}

/**
 * 构建历史记录摘要列表。
 * @param {number} [limit=5] - 显示的最近记录条数。
 * @returns {HTMLElement} 包含摘要的 dl 元素。
 */
function get_log_history() {
	if (typeof game_log !== "undefined" && Array.isArray(game_log)) {
		return game_log
	}
	if (Array.isArray(view?.log)) {
		return view.log
	}
	return []
}

function build_history_summary(limit = 5) {
	const dl = document.createElement("dl")
	const append_value = (label, value) => {
		const p = document.createElement("dd")
		p.className = "score_row"
		p.textContent = `${label}: ${value}`
		dl.appendChild(p)
	}

	const history = get_log_history()
	const total = history.length
	append_value("总记录数", total)
	if (total === 0) {
		append_value("最近记录", "无")
	} else {
		const recent = Math.min(limit, total)
		for (let i = total - recent; i < total; i++) {
			const line = history[i]
			let text = typeof line === "string" ? line : JSON.stringify(line)
			text = strip_log_prefixes(text)
			const p = document.createElement("dd")
			p.className = "score_row"
			p.innerHTML = `${i + 1}. ${escape_text(text)}`
			dl.appendChild(p)
		}
	}
	return dl
}

/**
 * 显示游戏得分和状态摘要对话框。
 */
function show_score_summary() {
	show_dialog("score", (body) => {
		const dl = document.createElement("dl")
		const append_value = (label, value) => {
			const p = document.createElement("dd")
			p.className = "score_row"
			p.textContent = `${label}: ${value}`
			dl.appendChild(p)
		}
		const append_flag = (label, value) => {
			const p = document.createElement("dd")
			p.className = "score_row"
			p.textContent = `${label}: ${value ? "是" : "否"}`
			dl.appendChild(p)
		}
		body.appendChild(dl)

		append_value("胜利点", view?.vp ?? 0)
		append_value("协约国战争状态", view?.ws_ap ?? "-")
		append_value("同盟国战争状态", view?.ws_cp ?? "-")
		append_value("协约国MO", format_mo_text(view?.mo_ap, AP))
		append_value("同盟国MO", format_mo_text(view?.mo_cp, CP))
		append_flag("协约国MO完成", !!view?.mo_ap_fulfilled)
		append_flag("同盟国MO完成", !!view?.mo_cp_fulfilled)
		append_value("协约国手牌", view?.ap_hand_count ?? "-")
		append_value("同盟国手牌", view?.cp_hand_count ?? "-")
		append_value("协约国牌库", view?.ap_deck_size ?? "-")
		append_value("同盟国牌库", view?.cp_deck_size ?? "-")

		const history_title = document.createElement("div")
		history_title.className = "score_row"
		history_title.textContent = "历史记录摘要"
		body.appendChild(history_title)
		body.appendChild(build_history_summary(5))
	})
}

/**
 * 显示游戏进程追踪对话框（回合、行动轮、卡牌信息等）。
 */
function get_track_turn() {
	return Math.max(1, Number(view?.turn) || 1)
}

function get_track_round() {
	return Math.max(0, Number(view?.action_round) || 0)
}

function get_track_faction(value) {
	if (value === "Allied Powers" || value === AP) return AP
	if (value === "Central Powers" || value === CP) return CP
	return null
}

function get_track_faction_label(value) {
	const faction = get_track_faction(value)
	if (faction === AP) return "AP"
	if (faction === CP) return "CP"
	return "-"
}

function get_track_action(faction, round) {
	const actions = view?.[faction]?.actions
	return Array.isArray(actions) ? actions[round] || null : null
}

function get_current_track_action() {
	const faction = get_track_faction(view?.active)
	const round = get_track_round()
	return faction && round > 0 ? get_track_action(faction, round) : null
}

function track_action_label(type) {
	switch (type) {
	case "ops":
		return "OPS"
	case "one_op":
		return "1 OP"
	case "sr":
		return "SR"
	case "rps":
		return "RP"
	case "event":
		return "EVENT"
	default:
		return type ? String(type).toUpperCase() : "-"
	}
}

function format_track_action(action) {
	if (!action) return "-"
	let label = track_action_label(action.type)
	if (action.card) label += ` c${action.card}`
	return label
}

function format_track_phase(state) {
	state = String(state || "")
	if (!state) return "-"
	if (state === "game_over") return "Game Over"
	if (state.includes("rollback")) return "Rollback"
	if (state.includes("mandated_offensive") || state.includes("mo_")) return "MO"
	if (state.includes("play_card") || state.includes("card_action")) return "Card"
	if (state.includes("sr")) return "SR"
	if (state.includes("replacement") || state.includes("rps")) return "RP"
	if (
		state.includes("combat") ||
		state.includes("attack") ||
		state.includes("retreat") ||
		state.includes("advance") ||
		state.includes("loss")
	)
		return "Combat"
	if (state.includes("activate") || state.includes("move")) return "OPS"
	if (state.includes("event")) return "Event"
	if (state.includes("turn") || state.includes("war_status") || state.includes("attrition")) return "Turn"
	return state.replace(/_/g, " ")
}

function get_track_log_cursor() {
	if (Number.isInteger(view?.log)) return view.log
	if (Array.isArray(view?.log)) return view.log.length
	if (typeof game_log !== "undefined" && Array.isArray(game_log)) return game_log.length
	return "-"
}

function create_track_summary() {
	const summary = document.createElement("div")
	summary.className = "track_summary"

	const addItem = (label, value) => {
		const item = document.createElement("div")
		item.className = "track_summary_item"
		const labelElt = document.createElement("span")
		labelElt.className = "track_summary_label"
		labelElt.textContent = label
		const valueElt = document.createElement("span")
		valueElt.className = "track_summary_value"
		valueElt.textContent = value
		item.appendChild(labelElt)
		item.appendChild(valueElt)
		summary.appendChild(item)
	}

	addItem("Active", get_track_faction_label(view?.active))
	addItem("AR", get_track_round() || "-")
	addItem("Phase", format_track_phase(view?.state))
	addItem("Action", format_track_action(get_current_track_action()))
	addItem("Log", get_track_log_cursor())

	return summary
}

function format_track_slot_title(faction, round, action) {
	const factionLabel = faction === AP ? "AP" : "CP"
	if (!action) return `${factionLabel} AR${round}`
	let text = `${factionLabel} AR${round}: ${track_action_label(action.type)}`
	if (action.card) {
		const card = cards[action.card]
		text += ` c${action.card}`
		if (card?.name) text += ` - ${card.name}`
	}
	return text
}

function get_track_player_name(faction) {
	const roleId = faction === AP ? "role_Allied_Powers" : "role_Central_Powers"
	const name = document.querySelector(`#${roleId} .role_user`)?.textContent || ""
	const text = String(name).replace(/\s+/g, " ").trim()
	return text && text !== "-" ? text : ""
}

const track_snap_by_turn = new Map()
let track_snap_pending = null
let track_snap_probe = null
let track_turn_loading = false
let track_turn_request_id = 0
let track_latest_turn = 0

function setup_track_dialog_resize(dialog) {
	if (!dialog || dialog.dataset.resizeReady === "1") return
	dialog.dataset.resizeReady = "1"
	for (const corner of ["nw", "ne", "sw", "se"]) {
		const handle = document.createElement("div")
		handle.className = `track_resize_handle ${corner}`
		handle.title = "缩放面板"
		handle.addEventListener("mousedown", (event) => start_track_dialog_resize(event, dialog, corner))
		dialog.appendChild(handle)
	}
}

function start_track_dialog_resize(event, dialog, corner) {
	if (window.matchMedia("(max-width: 800px)").matches) return
	event.preventDefault()
	event.stopPropagation()

	const rect = dialog.getBoundingClientRect()
	const startX = event.clientX
	const startY = event.clientY
	const minWidth = 720
	const minHeight = 360
	const margin = 8

	function resize(moveEvent) {
		moveEvent.preventDefault()
		let left = rect.left
		let top = rect.top
		let width = rect.width
		let height = rect.height
		const dx = moveEvent.clientX - startX
		const dy = moveEvent.clientY - startY

		if (corner.includes("e")) width = rect.width + dx
		if (corner.includes("s")) height = rect.height + dy
		if (corner.includes("w")) {
			width = rect.width - dx
			left = rect.left + dx
		}
		if (corner.includes("n")) {
			height = rect.height - dy
			top = rect.top + dy
		}

		width = Math.min(Math.max(width, minWidth), window.innerWidth - margin * 2)
		height = Math.min(Math.max(height, minHeight), window.innerHeight - margin * 2)
		if (corner.includes("w")) left = rect.right - width
		if (corner.includes("n")) top = rect.bottom - height

		left = Math.min(Math.max(left, margin), window.innerWidth - width - margin)
		top = Math.min(Math.max(top, margin), window.innerHeight - height - margin)

		dialog.classList.add("track_resized")
		dialog.style.position = "fixed"
		dialog.style.left = `${left}px`
		dialog.style.top = `${top}px`
		dialog.style.width = `${width}px`
		dialog.style.height = `${height}px`
	}

	function stop_resize() {
		document.removeEventListener("mousemove", resize)
		document.removeEventListener("mouseup", stop_resize)
	}

	document.addEventListener("mousemove", resize)
	document.addEventListener("mouseup", stop_resize)
}

function clamp_track_turn(turn) {
	turn = Number(turn)
	if (!Number.isFinite(turn)) return get_track_turn()
	return Math.max(1, Math.min(MAX_TURN_TRACK, Math.trunc(turn)))
}

function get_cached_track_max_turn() {
	let maxTurn = 0
	for (const turn of track_snap_by_turn.keys()) {
		if (Number.isInteger(turn)) maxTurn = Math.max(maxTurn, turn)
	}
	return maxTurn
}

function get_track_available_min_turn() {
	const minTurn = Number(view?.scenario_min_turn)
	return Number.isInteger(minTurn) && minTurn > 0 ? Math.min(MAX_TURN_TRACK, minTurn) : 1
}

function get_track_available_max_turn() {
	const turn = clamp_track_turn(get_track_turn())
	const replay = parse_replay_prompt()
	if (!replay || replay.snap === replay.count) {
		track_latest_turn = Math.max(track_latest_turn, turn)
	}
	return Math.max(
		get_track_available_min_turn(),
		Math.min(MAX_TURN_TRACK, Math.max(track_latest_turn, turn, get_cached_track_max_turn()))
	)
}

function is_track_turn_available(turn) {
	turn = Number(turn)
	return Number.isInteger(turn) && turn >= get_track_available_min_turn() && turn <= get_track_available_max_turn()
}

function get_track_display_turn() {
	const pending_turn = Number(window.track_view_turn)
	if (track_turn_loading && Number.isInteger(pending_turn)) return clamp_track_turn(pending_turn)
	return clamp_track_turn(get_track_turn())
}

function set_track_turn_loading(loading) {
	track_turn_loading = !!loading
	const dialog = document.getElementById("track_dialog")
	if (!dialog) return

	dialog.classList.toggle("track_loading", track_turn_loading)
	if (track_turn_loading) dialog.setAttribute("aria-busy", "true")
	else dialog.removeAttribute("aria-busy")

	const turnNum = dialog.querySelector(".track_turn_num")
	if (turnNum) turnNum.textContent = String(get_track_display_turn()).padStart(2, "0")
	if (turnNum) turnNum.disabled = track_turn_loading
	for (const button of dialog.querySelectorAll(".track_turn_arrow")) {
		const delta = Number(button.dataset.delta)
		const targetTurn = get_track_display_turn() + delta
		button.disabled = track_turn_loading || !is_track_turn_available(targetTurn)
	}
}

function close_track_turn_menu(menu, closeHandlers) {
	if (!menu) return
	menu.remove()
	document.removeEventListener("click", closeHandlers.click)
	document.removeEventListener("keydown", closeHandlers.keydown)
}

function open_track_turn_menu(picker) {
	const existingMenu = picker.querySelector(".track_turn_menu")
	if (existingMenu) {
		if (typeof existingMenu.closeTrackMenu === "function") existingMenu.closeTrackMenu()
		else existingMenu.remove()
		return
	}

	const menu = document.createElement("menu")
	menu.className = "track_turn_menu"
	menu.setAttribute("aria-label", "选择回合")

	const closeHandlers = {
		click: (event) => {
			if (!picker.contains(event.target)) close_track_turn_menu(menu, closeHandlers)
		},
		keydown: (event) => {
			if (event.key === "Escape") close_track_turn_menu(menu, closeHandlers)
		}
	}
	menu.closeTrackMenu = () => close_track_turn_menu(menu, closeHandlers)

	const selectedTurn = get_track_display_turn()
	const minTurn = get_track_available_min_turn()
	const maxTurn = get_track_available_max_turn()
	for (let i = minTurn; i <= maxTurn; i += 1) {
		const item = document.createElement("li")
		item.textContent = String(i).padStart(2, "0")
		item.tabIndex = 0
		item.classList.toggle("selected", i === selectedTurn)
		const selectTurn = (ev) => {
			ev.stopPropagation()
			close_track_turn_menu(menu, closeHandlers)
			goto_track_turn(i)
		}
		item.onclick = selectTurn
		item.onkeydown = (ev) => {
			if (ev.key === "Enter" || ev.key === " ") selectTurn(ev)
		}
		menu.appendChild(item)
	}

	picker.appendChild(menu)
	document.addEventListener("click", closeHandlers.click)
	document.addEventListener("keydown", closeHandlers.keydown)
}

function create_track_turn_arrow(delta, displayTurn) {
	const button = document.createElement("button")
	button.type = "button"
	button.className = "track_turn_arrow"
	button.dataset.delta = String(delta)
	button.textContent = delta < 0 ? "‹" : "›"
	button.title = delta < 0 ? "上一回合" : "下一回合"
	button.setAttribute("aria-label", button.title)

	const targetTurn = displayTurn + delta
	button.disabled = track_turn_loading || !is_track_turn_available(targetTurn)
	button.onclick = (event) => {
		event.stopPropagation()
		goto_track_turn(targetTurn)
	}
	return button
}

function parse_replay_prompt() {
	const text = typeof view?.prompt === "string" ? view.prompt : ""
	const match = text.match(/Replay\s+(\d+)\s*\/\s*(\d+)/)
	if (!match) return null
	return {
		snap: Number(match[1]),
		count: Number(match[2])
	}
}

function note_track_snapshot() {
	const replay = parse_replay_prompt()
	if (!replay) return null
	if (Number.isInteger(view?.turn) && view.turn > 0 && !track_snap_by_turn.has(view.turn)) {
		track_snap_by_turn.set(view.turn, replay.snap)
	}
	return replay
}

function resolve_track_snap_probe() {
	if (!track_snap_probe) return
	const replay = note_track_snapshot()
	if (!replay || replay.snap !== track_snap_probe.snap) return
	const probe = track_snap_probe
	track_snap_probe = null
	probe.resolve({
		snap: replay.snap,
		count: replay.count,
		turn: Number(view?.turn) || 0
	})
}

function request_track_snap(snap) {
	if (!Number.isInteger(snap) || snap < 1 || typeof window.request_snap !== "function") {
		return Promise.resolve(null)
	}
	return new Promise((resolve) => {
		track_snap_probe = { snap, resolve }
		window.request_snap(snap, () => {
			if (track_snap_probe?.snap === snap) track_snap_probe = null
			resolve(null)
		})
	})
}

async function ensure_track_snap_count() {
	const replay = note_track_snapshot()
	if (replay?.count) return replay.count
	if (typeof window.on_snap_prev !== "function") return 0
	return new Promise((resolve) => {
		track_snap_pending = {
			mode: "count",
			resolve
		}
		window.on_snap_prev()
	})
}

async function find_track_snap_for_turn(turn) {
	if (track_snap_by_turn.has(turn)) return track_snap_by_turn.get(turn)
	const count = await ensure_track_snap_count()
	if (!count) return 0

	let low = 1
	let high = count
	let found = 0
	while (low <= high) {
		const mid = Math.floor((low + high) / 2)
		const snap = await request_track_snap(mid)
		if (!snap) return 0
		if (snap.turn >= turn) {
			found = mid
			high = mid - 1
		} else {
			low = mid + 1
		}
	}

	if (found > 0) {
		const snap = await request_track_snap(found)
		if (snap && snap.turn === turn) {
			track_snap_by_turn.set(turn, found)
			return found
		}
	}
	return 0
}

function update_track_snap_pending() {
	resolve_track_snap_probe()
	if (!track_snap_pending) return
	const replay = note_track_snapshot()
	if (!replay?.count) return
	const pending = track_snap_pending
	track_snap_pending = null
	if (pending.mode === "count") pending.resolve(replay.count)
}

async function goto_track_turn(turn) {
	turn = Number(turn)
	if (!is_track_turn_available(turn)) {
		window.track_view_turn = get_track_display_turn()
		show_track_dialog({ preservePosition: true })
		return
	}
	if (turn === get_track_turn() && !track_turn_loading) {
		window.track_view_turn = turn
		show_track_dialog({ preservePosition: true })
		return
	}

	const requestId = ++track_turn_request_id
	window.track_view_turn = turn
	set_track_turn_loading(true)
	const snap = await find_track_snap_for_turn(turn)
	if (requestId !== track_turn_request_id) return
	if (snap > 0) await request_track_snap(snap)
	if (requestId !== track_turn_request_id) return
	set_track_turn_loading(false)
	show_track_dialog({ preservePosition: true })
}

function show_track_dialog(options = {}) {
	const dialog_elt = document.getElementById("track_dialog")
	if (!dialog_elt) {
		return
	}

	if (window.matchMedia("(max-width: 800px)").matches) {
		dialog_elt.classList.remove("track_resized")
		dialog_elt.style.width = ""
		dialog_elt.style.height = ""
	}

	const wasHidden = dialog_elt.hidden
	const displayTurn = get_track_display_turn()
	window.track_view_turn = displayTurn
	setup_track_dialog_resize(dialog_elt)

	const header = dialog_elt.querySelector(".dialog_header")
	if (header) {
		header.replaceChildren()
		const title = document.createElement("div")
		title.className = "track_title"
		title.textContent = "TURN"

		const controls = document.createElement("div")
		controls.className = "track_turn_controls"
		controls.setAttribute("aria-label", "回合导航")

		const picker = document.createElement("span")
		picker.className = "track_turn_picker"

		const turnNum = document.createElement("button")
		turnNum.type = "button"
		turnNum.className = "track_turn_num clickable"
		turnNum.textContent = String(displayTurn).padStart(2, "0")
		turnNum.title = "选择回合"
		turnNum.setAttribute("aria-label", "选择回合")
		turnNum.disabled = track_turn_loading
		turnNum.onclick = (e) => {
			e.stopPropagation()
			open_track_turn_menu(picker)
		}
		picker.appendChild(turnNum)
		controls.appendChild(create_track_turn_arrow(-1, displayTurn))
		controls.appendChild(picker)
		controls.appendChild(create_track_turn_arrow(1, displayTurn))

		header.appendChild(title)
		header.appendChild(controls)

		// 顶栏空白处可拖拽，回合按钮和菜单仍保持纯交互。
		drag_element("#track_dialog", ".dialog_header")
	}

	const allowMousePosition = wasHidden && !options.preservePosition
	const lastMouse = window.last_mouse_event
	if (!allowMousePosition) window.last_mouse_event = null
	show_dialog("track_dialog", (body) => {
		const container = document.createElement("div")
		container.className = "track_container"
		container.appendChild(create_track_summary())

		// Rounds
		const rounds = document.createElement("div")
		rounds.className = "track_rounds"

		/**
		 * 创建行动轮行。
		 * @param {string} faction - 派系标识符 ('ap' 或 'cp')。
		 * @param {string} label - 显示标签。
		 * @returns {HTMLElement} 行元素。
		 */
		const createRow = (faction, label) => {
			const row = document.createElement("div")
			row.className = "track_row"
			const rowLabel = document.createElement("div")
			rowLabel.className = `track_row_label ${faction}`
			rowLabel.textContent = label
			row.appendChild(rowLabel)

			const faction_actions = view[faction]?.actions || []

			// 1-6
			const roundSlots = ["1", "2", "3", "4", "5", "6"]
			roundSlots.forEach((r) => {
				const slot = document.createElement("div")
				slot.className = `track_slot ${faction}`

				const slotLabel = document.createElement("div")
				slotLabel.className = "track_slot_label"
				slotLabel.textContent = r
				slot.appendChild(slotLabel)

				// 高亮逻辑
				const is_active_faction =
					((view.active === "Allied Powers" || view.active === "ap") && faction === "ap") ||
					((view.active === "Central Powers" || view.active === "cp") && faction === "cp")

				const roundNum = parseInt(r, 10)
				const is_active =
					view.action_round === roundNum && !(view.state && view.state.includes("mandated_offensive"))
				const is_current = is_active && is_active_faction

				slot.classList.toggle("active", !!is_active)
				slot.classList.toggle("current", !!is_current)

				// 卡牌缩略图
				const action = faction_actions[roundNum]
				const card_id = action?.card
				slot.title = format_track_slot_title(faction, roundNum, action)

				if (card_id) {
					const card = cards[card_id]
					if (card) {
						const thumb = document.createElement("div")
						thumb.className = "track_card_thumb"
						thumb.style.backgroundImage = card_image_url(card)
						thumb.onmouseenter = () => {
							on_focus_card_tip(card_id)
						}
						thumb.onmouseleave = () => {
							on_blur_card_tip()
						}
						slot.appendChild(thumb)
						slot.classList.add("has_card")
					}
				}
				if (action) {
					const actionType = document.createElement("div")
					actionType.className = "track_slot_type"
					actionType.textContent = track_action_label(action.type)
					slot.appendChild(actionType)
				}

				row.appendChild(slot)
			})
			return row
		}

		//  在上, CP (同盟国) 在下
		rounds.appendChild(createRow("ap", "协约国"))
		rounds.appendChild(createRow("cp", "同盟国"))
		container.appendChild(rounds)

		// Stats
		const stats = document.createElement("div")
		stats.className = "track_stats"

		/**
		 * 为特定派系创建统计信息部分。
		 * @param {string} faction - 派系标识符 ('ap' 或 'cp')。
		 * @param {Object} data - 统计数据。
		 * @param {string} label - 显示标签。
		 * @returns {HTMLElement} 统计信息元素。
		 */
		const createFactionStats = (faction, data, label) => {
			const fStats = document.createElement("div")
			fStats.className = `track_faction_stats ${faction}`

			const fHeader = document.createElement("div")
			fHeader.className = "track_faction_header"
			const fLabel = document.createElement("span")
			fLabel.textContent = label
			fHeader.appendChild(fLabel)
			const playerName = get_track_player_name(faction)
			if (playerName) {
				const player = document.createElement("span")
				player.className = "track_faction_player"
				player.textContent = playerName
				fHeader.appendChild(player)
			}
			fStats.appendChild(fHeader)

			/**
			 * 添加一行统计数据。
			 * @param {string} sLabel - 统计项名称。
			 * @param {number|string} val - 统计项数值。
			 * @param {string} type - 统计类型（'discard' 或 'removed'）。
			 */
			const addStat = (sLabel, val, type) => {
				const line = document.createElement("div")
				line.className = "track_stat_line"
				if (type === "discard" || type === "removed") {
					line.classList.add("clickable")
					line.onclick = () => {
						const dialog_id = `${faction}_${type}_dialog`
						const card_lists = {
							discard:
								type === "discard"
									? faction === "ap"
										? view.ap.discard_list
										: view.cp.discard_list
									: [],
							removed:
								type === "removed"
									? faction === "ap"
										? view.removed_cards.ap
										: view.removed_cards.cp
									: [],
							deck: []
						}
						show_card_list(dialog_id, card_lists)
					}
				}
				line.innerHTML = `<span>${sLabel}</span><span class="track_stat_val">${val}</span>`
				fStats.appendChild(line)
			}

			addStat("弃牌堆", data.discard, "discard")
			addStat("移出游戏", data.removed, "removed")
			return fStats
		}

		// 左: AP, 右: CP
		stats.appendChild(
			createFactionStats(
				"ap",
				{
					discard: view.ap?.discard ?? 0,
					removed: view.removed_cards?.ap?.length ?? 0
				},
				"AP"
			)
		)
		stats.appendChild(
			createFactionStats(
				"cp",
				{
					discard: view.cp?.discard ?? 0,
					removed: view.removed_cards?.cp?.length ?? 0
				},
				"CP"
			)
		)
		container.appendChild(stats)

		body.appendChild(container)
	})
	if (!allowMousePosition) window.last_mouse_event = lastMouse
	set_track_turn_loading(track_turn_loading)
}

function update_track_dialog_if_open() {
	update_track_snap_pending()
	const dialog = document.getElementById("track_dialog")
	if (!dialog || dialog.hidden) return
	show_track_dialog({ preservePosition: true })
}

let card_dir = "cards.CN"
let card_ext = "jpg"

/**
 * 设置卡牌资产（语言、目录、扩展名）和地图语言。
 * @param {Object} options - 配置选项。
 * @param {boolean} [options.english_cards] - 是否使用英文卡牌。
 * @param {boolean} [options.chinese_map] - 是否使用中文地图。
 */
function set_card_assets(options) {
	const use_english_cards = !!options?.english_cards
	const use_chinese_map = !!options?.chinese_map
	const body = document.querySelector("body")

	if (!body) {
		return
	}

	if (use_english_cards) {
		card_dir = "cards.EN"
		card_ext = "jpg"
		body.classList.remove("lang-cn")
		body.classList.add("lang-en")
	} else {
		card_dir = "cards.CN"
		card_ext = "jpg"
		body.classList.remove("lang-en")
		body.classList.add("lang-cn")
	}

	body.classList.toggle("map-cn", use_chinese_map)
	body.classList.toggle("map-en", !use_chinese_map)
}

/**
 * 获取卡牌的显示编号（逻辑 ID 映射到资源索引）。
 * @param {Object} card - 卡牌对象。
 * @returns {number|string} 显示编号。
 */
function card_display_num(card) {
	const num = Number(card.num)
	if (Number.isNaN(num)) {
		return card.num
	}

	// AP cards are 1-55, CP cards are 56-110.
	// Map CP cards back to 1-55 for image/CSS resources.
	if (card.faction === "cp" && num > 55) {
		return num - 55
	}
	return num
}

/**
 * 获取卡牌图片的 URL。
 * @param {Object} card - 卡牌对象。
 * @returns {string} 图片 URL 字符串。
 */
function card_image_url(card) {
	const num = String(card_display_num(card)).padStart(2, "0")
	return `url("${card_dir}/card_${card.faction}_${num}.${card_ext}")`
}

/**
 * 解析 UI 布局的 CSV 文本。
 * @param {string} text - CSV 文本。
 * @returns {Object[]} 解析后的对象数组。
 */
function parse_ui_csv(text) {
	if (!text) {
		return []
	}
	if (text.charCodeAt(0) === 0xfeff) {
		text = text.slice(1)
	}
	const lines = text.split(/\r?\n/).filter((l) => {
		return l.trim().length > 0
	})
	if (lines.length === 0) {
		return []
	}
	const headers = lines[0].split(",").map((h) => {
		return h.trim()
	})
	return lines.slice(1).map((line) => {
		const values = line.split(",")
		const obj = {}
		headers.forEach((h, i) => {
			obj[h] = (values[i] ?? "").trim()
		})
		return obj
	})
}

/**
 * 加载 UI 布局数据。
 */
async function load_ui_layout() {
	try {
		const res = await fetch(`csv/ui.csv?t=${Date.now()}`)
		if (!res.ok) {
			return
		}
		const text = await res.text()
		const rows = parse_ui_csv(text)
		for (const r of rows) {
			const key = r.key || r.name
			if (!key) {
				continue
			}
			const x = Number(r.x)
			const y = Number(r.y)
			if (Number.isNaN(x) || Number.isNaN(y)) {
				continue
			}
			const w = Number(r.w)
			const h = Number(r.h)
			const ww = Number.isNaN(w) || w <= 0 ? 75 : w
			const hh = Number.isNaN(h) || h <= 0 ? 75 : h
			layout[key] = [x, y, ww, hh]
		}
	} catch (e) {
		console.warn("Failed to load layout:", e)
	}
}

/**
 * 初始化函数。
 * @param {string} scenario - 剧本名称。
 * @param {Object} options - 配置选项。
 */
function on_init(scenario, options) {
	init_layout()
	set_card_assets(options)
	load_ui_layout().then(() => {
		return init_system_markers()
	})
}

const NEUTRAL_UI_MARKERS = [
	{ id: "neutral_gr", key: "neutral_gr_UI", nation: "gr", entry: "entry_gr" },
	{ id: "neutral_bu", key: "neutral_bu_UI", nation: "bu", entry: "entry_bu" },
	{ id: "neutral_ro", key: "neutral_ro_UI", nation: "ro", entry: "entry_ro" },
	{ id: "neutral_sb", key: "neutral_SB_UI", nation: "sb", entry: "entry_sb" }
]

function is_neutral_marker_hidden(marker) {
	return typeof view !== "undefined" && !!view?.[marker.entry]
}

function get_neutral_marker_element(marker) {
	ui.neutral = ui.neutral || {}
	let elt = ui.neutral[marker.nation]
	if (!elt) {
		elt = document.getElementById(marker.id)
		if (elt) {
			ui.neutral[marker.nation] = elt
		}
	}
	return elt
}

let neutral_marker_peek_elt = null
let neutral_marker_peek_frame = 0
let neutral_marker_peek_point = null

function clear_neutral_marker_peek() {
	if (neutral_marker_peek_frame) {
		window.cancelAnimationFrame(neutral_marker_peek_frame)
		neutral_marker_peek_frame = 0
	}
	neutral_marker_peek_point = null
	if (!neutral_marker_peek_elt) {
		return
	}
	neutral_marker_peek_elt.classList.remove("neutral-peek")
	neutral_marker_peek_elt = null
}

function get_neutral_marker_peek_target(client_x, client_y) {
	if (ui.map.classList.contains("hide_markers")) {
		return null
	}
	for (const marker of NEUTRAL_UI_MARKERS) {
		const elt = get_neutral_marker_element(marker)
		if (!elt || elt.hidden || elt.classList.contains("hide")) {
			continue
		}
		const rect = elt.getBoundingClientRect()
		if (rect.width <= 0 || rect.height <= 0) {
			continue
		}
		if (client_x >= rect.left && client_x <= rect.right && client_y >= rect.top && client_y <= rect.bottom) {
			return elt
		}
	}
	return null
}

function apply_neutral_marker_peek(client_x, client_y) {
	const next = get_neutral_marker_peek_target(client_x, client_y)
	if (neutral_marker_peek_elt === next) {
		return
	}
	clear_neutral_marker_peek()
	if (next) {
		next.classList.add("neutral-peek")
		neutral_marker_peek_elt = next
	}
}

function flush_neutral_marker_peek() {
	neutral_marker_peek_frame = 0
	if (!neutral_marker_peek_point) {
		return
	}
	const point = neutral_marker_peek_point
	neutral_marker_peek_point = null
	apply_neutral_marker_peek(point.clientX, point.clientY)
}

function update_neutral_marker_peek(evt) {
	neutral_marker_peek_point = { clientX: evt.clientX, clientY: evt.clientY }
	if (neutral_marker_peek_frame) {
		return
	}
	neutral_marker_peek_frame = window.requestAnimationFrame(flush_neutral_marker_peek)
}

function apply_neutral_marker_visibility(marker, elt) {
	if (!elt) {
		return
	}
	const hidden = is_neutral_marker_hidden(marker)
	if (hidden && neutral_marker_peek_elt === elt) {
		clear_neutral_marker_peek()
	}
	if (elt.hidden !== hidden) {
		elt.hidden = hidden
	}
	if (elt.classList.contains("hide") !== hidden) {
		elt.classList.toggle("hide", hidden)
	}
}

/**
 * 初始化系统标记（如中立国标记）。
 */
function init_system_markers() {
	if (!layout) {
		return
	}

	ui.neutral = ui.neutral || {}
	for (const marker of NEUTRAL_UI_MARKERS) {
		const elt = document.getElementById(marker.id)
		if (!elt) {
			continue
		}
		const rec = layout[marker.key]
		const [x, y] = rec ? layout_center(rec) : [0, 0]
		elt.classList.add("anchored")
		if (rec) {
			elt.style.width = `${rec[2]}px`
			elt.style.height = `${rec[3]}px`
			// center the element on the center coordinate
			elt.style.left = `${x - rec[2] / 2}px`
			elt.style.top = `${y - rec[3] / 2}px`
		} else {
			elt.style.left = `${x}px`
			elt.style.top = `${y}px`
		}
		ui.neutral[marker.nation] = elt
		apply_neutral_marker_visibility(marker, elt)
	}
}

/**
 * 将标记元素定位到指定的布局矩形中心。
 * @param {HTMLElement} elt - 要定位的标记元素。
 * @param {number[]} rec - 布局矩形 [x, y, w, h]。
 */
function position_marker_at_layout(elt, rec) {
	if (!elt || !rec) {
		return
	}
	position_marker_at_layout_offset(elt, rec, 0, 0)
}

function position_marker_at_layout_offset(elt, rec, dx = 0, dy = 0) {
	if (!elt || !rec) {
		return
	}
	const [x, y] = layout_center(rec)
	const w = rec[2] || elt.my_size || 75
	const h = rec[3] || elt.my_size || 75
	const border = style_dims[style].border
	elt.style.left = `${x - w / 2 - border + dx}px`
	elt.style.top = `${y - h / 2 - border + dy}px`
}

/**
 * 创建一个唯一的标记元素。
 * @param {string} className - CSS 类名。
 * @param {number} size - 标记的大小。
 * @returns {HTMLElement} 创建的 DOM 元素。
 */
function build_unique_marker(className, size) {
	const elt = document.createElement("div")
	elt.className = `${className} anchored`
	elt.style.width = `${size}px`
	elt.style.height = `${size}px`
	elt.my_size = size

	elt.stack_bound = true
	elt.addEventListener("click", on_click_marker)
	elt.addEventListener("mouseenter", on_focus_marker)
	elt.addEventListener("mouseleave", on_blur_marker)

	ui.markers.appendChild(elt)
	return elt
}

function ensure_reserve_beachhead_marker(index) {
	if (!reserve_beachhead_markers[index]) {
		let marker = build_unique_marker("marker beachhead", 75 * SCALE)
		marker.marker = { name: `Beachhead Reserve #${index + 1}` }
		reserve_beachhead_markers[index] = marker
	}
	return reserve_beachhead_markers[index]
}

function update_reserve_beachhead_markers() {
	const count = Math.max(0, view?.unplaced_beachheads || 0)
	const rec = layout ? layout["box_ap_reserve_beachhead"] : null
	for (let marker of reserve_beachhead_markers) {
		if (marker) marker.style.display = "none"
	}
	if (!rec || count <= 0) return
	const [cx, cy] = layout_center(rec)
	for (let i = 0; i < count; i++) {
		let marker = ensure_reserve_beachhead_marker(i)
		let dx = Math.min(i, 4) * 8
		let dy = Math.min(i, 4) * 6
		marker.style.display = "block"
		marker.style.left = `${cx - marker.my_size / 2 + dx}px`
		marker.style.top = `${cy - marker.my_size / 2 + dy}px`
	}
}

const SCALE = 1

const style_dims = {
	flat: {
		border: 1,
		gap: 3,
		padding: 7,
		stack_dx: 9,
		stack_dy: 9,
		stack_dx_tight: 3,
		stack_dy_tight: 3
	},
	bevel: {
		border: 2,
		gap: 5,
		padding: 7,
		stack_dx: 9,
		stack_dy: 9,
		stack_dx_tight: 3,
		stack_dy_tight: 3
	}
}

const marker_info = {
	move: { name: "Move", counter: "marker small move", size: 60 * SCALE },
	attack: { name: "Attack", counter: "marker small attack", size: 60 * SCALE },
	control: {
		ap: {
			name: "AP Control",
			type: "ap_control",
			counter: "marker ap control",
			size: 75 * SCALE
		},
		cp: {
			name: "CP Control",
			type: "cp_control",
			counter: "marker cp control",
			size: 75 * SCALE
		},
		ru: {
			name: "RU Control",
			type: "ru_control",
			counter: "marker ru control",
			size: 75 * SCALE
		}
	},
	trench: {
		ap: {
			1: {
				name: "Trench 1",
				type: "trench",
				value: 1,
				counter: "marker trench trench_1 ap",
				size: 75 * SCALE
			},
			2: {
				name: "Trench 2",
				type: "trench",
				value: 2,
				counter: "marker trench trench_2 ap",
				size: 75 * SCALE
			}
		},
		cp: {
			1: {
				name: "Trench 1",
				type: "trench",
				value: 1,
				counter: "marker trench trench_1 cp",
				size: 75 * SCALE
			},
			2: {
				name: "Trench 2",
				type: "trench",
				value: 2,
				counter: "marker trench trench_2 cp",
				size: 75 * SCALE
			}
		}
	},

	// Game Status
	game_turn: { name: "Game Turn", counter: "marker game_turn", size: 75 * SCALE },
	vp: { name: "VP", counter: "marker vp", size: 75 * SCALE },
	cp_auto_victory: { name: "CP Auto Victory", counter: "marker cp_auto_victory", size: 75 * SCALE },

	// War Status
	ap_war_status: { name: "AP War Status", counter: "marker ap war_status", size: 75 * SCALE },
	cp_war_status: { name: "CP War Status", counter: "marker cp war_status", size: 75 * SCALE },

	// Replacement Points
	ap_rp: { name: "Allied RP", counter: "marker allied_rp", size: 75 * SCALE },
	br_rp: { name: "British RP", counter: "marker br_rp", size: 75 * SCALE },
	ru_rp: { name: "Russian RP", counter: "marker ru_rp", size: 75 * SCALE },
	in_rp: { name: "Indian RP", counter: "marker in_rp", size: 75 * SCALE },
	apa_rp: { name: "AP Allied RP", counter: "marker apa_rp", size: 75 * SCALE },
	ge_rp: { name: "German RP", counter: "marker ge_rp", size: 75 * SCALE },
	tu_rp: { name: "Turkish RP", counter: "marker tu_rp", size: 75 * SCALE },
	cpa_rp: { name: "CP Allied RP", counter: "marker cpa_rp", size: 75 * SCALE },
	ge_supply_tu: { name: "GE Supply TU", counter: "marker ge_supply_tu", size: 75 * SCALE },
	ru_revolution: {
		name: "Russian Revolution",
		counter: "marker ru_revolution",
		size: 75 * SCALE
	},
	russian_vp: { name: "Russian VP", counter: "marker russian_vp", size: 75 * SCALE },
	jihad: { name: "Jihad", counter: "marker jihad", size: 75 * SCALE },
	combined_war: { name: "Combined War", counter: "marker combined_war", size: 75 * SCALE },
	lcu_limit_ap: {
		name: "LCU Limit AP",
		counter: "marker ap lcu_limit",
		size: 75 * SCALE
	},
	lcu_limit_cp: {
		name: "LCU Limit CP",
		counter: "marker cp lcu_limit",
		size: 75 * SCALE
	},

	// System Tokens on Reinforcement Board
	cp_air_superiority: { name: "CP Air Superiority", counter: "marker cp_air_superiority", size: 75 * SCALE },
	u_boats_med: { name: "U-Boats in the Med", counter: "marker u_boats_med", size: 75 * SCALE },
	kitchener: { name: "Kitchener", counter: "marker kitchener", size: 75 * SCALE },
	ww_pt: { name: "W.W.Pt.", counter: "marker ww_pt", size: 75 * SCALE },
	sinai_railroad: { name: "Sinai Railroad", counter: "marker sinai_railroad", size: 75 * SCALE },
	max_tu_rp: { name: "Max TU RP", counter: "marker max_tu_rp", size: 75 * SCALE },
	j_by_c: { name: "Jerusalem by Christmas", counter: "marker j_by_c", size: 75 * SCALE },
	persian_uprising: { name: "Persian Uprising", counter: "marker persian_uprising", size: 75 * SCALE },
	parvus_to_berlin: { name: "Parvus to Berlin", counter: "marker parvus_to_berlin", size: 75 * SCALE },
	gorlice_tarnow_return: { name: "Gorl. LCU Back", counter: "marker gorlice_tarnow_return", size: 75 * SCALE },
	revolution_token: { name: "Revolution", counter: "marker revolution_token", size: 75 * SCALE },
	long_live_czar: { name: "Long Live the Czar!", counter: "marker long_live_czar", size: 75 * SCALE },
	bb_rr: { name: "BB.RR", counter: "marker bb_rr", size: 75 * SCALE },
	baku_uprising: { name: "Baku Uprising", counter: "marker baku_uprising", size: 75 * SCALE },
	c_asia_uprising: { name: "C.Asia Uprising", counter: "marker c_asia_uprising", size: 75 * SCALE },
	enzeli_uprising: { name: "Enzeli Uprising", counter: "marker enzeli_uprising", size: 75 * SCALE },
	armenian_uprising: { name: "Armenian Uprising", counter: "marker armenian_uprising", size: 75 * SCALE },

	// markers
	beachhead: { name: "Beachhead", counter: "marker beachhead", size: 75 * SCALE },
	besieged: { name: "Besieged", counter: "marker besieged", size: 75 * SCALE },
	catastrophic_attack_oos: {
		name: "Catastrophic Attack OOS",
		counter: "marker catastrophic_attack_oos",
		size: 75 * SCALE
	},
	out_of_supply: { name: "Out of Supply", counter: "marker out_of_supply", size: 75 * SCALE },
	limited_supply: { name: "Limited Supply", counter: "marker limited_supply", size: 75 * SCALE },
	mo_modifier: { name: "AP MO Modifier", counter: "marker mo_modifier", size: 75 * SCALE },
	fort_destroyed: {
		name: "Fort Destroyed",
		counter: "marker fort_destroyed",
		size: 75 * SCALE
	},
	ap_missed_mo: {
		name: "AP Missed Mandatory Offensive",
		counter: "marker ap_missed_mo",
		size: 75 * SCALE
	},
	cp_missed_mo: {
		name: "CP Missed Mandatory Offensive",
		counter: "marker cp_missed_mo",
		size: 75 * SCALE
	}
}

const ICONS_SVG = {
	B1: `<span class="die cp d1"></span>`,
	B2: `<span class="die cp d2"></span>`,
	B3: `<span class="die cp d3"></span>`,
	B4: `<span class="die cp d4"></span>`,
	B5: `<span class="die cp d5"></span>`,
	B6: `<span class="die cp d6"></span>`,
	W1: `<span class="die ap d1"></span>`,
	W2: `<span class="die ap d2"></span>`,
	W3: `<span class="die ap d3"></span>`,
	W4: `<span class="die ap d4"></span>`,
	W5: `<span class="die ap d5"></span>`,
	W6: `<span class="die ap d6"></span>`
}

/**
 * 替换文本中的图标占位符为 SVG。
 * @param {string} match - 匹配的占位符。
 * @returns {string} SVG HTML。
 */
function sub_icon(match) {
	return ICONS_SVG[match]
}

/**
 * 替换文本中的空间 ID 为带提示的空间名称。
 * @param {string} match - 完整匹配项。
 * @param {string} p1 - 捕获的空间 ID。
 * @returns {string} HTML 字符串。
 */
function sub_space_name(match, p1) {
	const s = p1 | 0
	if (!spaces[s]) return `[${s}]`
	const n = spaces[s].name
	if (!get_space_tip_element(s)) return n
	return `<span class="spacetip" onmouseenter="on_focus_space_tip(${s})" onmouseleave="on_blur_space_tip(${s})" onclick="on_click_space_tip(${s})">${n}</span>`
}

/**
 * 获取卡牌的 CSS 类名。
 * @param {number} c - 卡牌 ID。
 * @returns {string} CSS 类名。
 */
function card_class_name(c) {
	const card = cards[c]
	if (!card) {
		return "card_back"
	}
	return `card_${card.faction}_${card_display_num(card)}`
}

/**
 * 替换文本中的卡牌 ID 为带提示的卡牌名称。
 * @param {string} match - 完整匹配项。
 * @param {string} p1 - 捕获的卡牌 ID。
 * @returns {string} HTML 字符串。
 */
function sub_card_name(match, p1) {
	const c = p1 | 0
	const card = cards[c]
	if (card) {
		const faction_class = card.faction === "ap" ? "ap-card" : "cp-card"
		return `<span class="cardtip ${faction_class}" onmouseenter="on_focus_card_tip(${c})" onmouseleave="on_blur_card_tip()" onclick="on_click_card_tip(${c})">${card.name}</span>`
	}
	return `未知卡牌`
}

/**
 * 替换文本中的单位 ID 为带提示的单位名称。
 * @param {string} match - 完整匹配项。
 * @param {string} p1 - 捕获的单位 ID。
 * @returns {string} HTML 字符串。
 */
function sub_piece_name(match, p1) {
	const p = p1 | 0
	const piece = pieces[p]
	if (piece) {
		return `<span class="piecetip ${piece.faction}-piece" onmouseenter="on_focus_piece_tip(${p})" onmouseleave="on_blur_piece_tip(${p})" onclick="on_click_piece_tip(${p})">${piece.name}</span>`
	}
	return `未知单位`
}

/**
 * 替换文本中的单位 ID 为带提示的单位名称（降级状态）。
 * @param {string} match - 完整匹配项。
 * @param {string} p1 - 捕获的单位 ID。
 * @returns {string} HTML 字符串。
 */
function sub_piece_name_reduced(match, p1) {
	const p = p1 | 0
	const piece = pieces[p]
	if (piece) {
		return `<span class="piecetip ${piece.faction}-piece" onmouseenter="on_focus_piece_tip(${p})" onmouseleave="on_blur_piece_tip(${p})" onclick="on_click_piece_tip(${p})">(${piece.name})</span>`
	}
	return `未知单位`
}

/**
 * 从对象中安全获取键值，如果不存在则返回默认值。
 * @param {Object} map - 目标对象。
 * @param {string} key - 键名。
 * @param {*} missing - 默认值。
 * @returns {*} 获取的值或默认值。
 */
function view_map_get(map, key, missing) {
	if (map && Object.prototype.hasOwnProperty.call(map, key)) {
		return map[key]
	}
	return missing
}

/**
 * 构建或更新一个标记元素。
 * @param {Object[]} list - 标记列表。
 * @param {Function} find - 查找现有标记的函数。
 * @param {Object} new_marker - 如果找不到则使用的新标记对象。
 * @param {Object} info - 标记的配置信息（名称、CSS 类、大小、图片等）。
 * @param {boolean} [no_listeners=false] - 是否不添加事件监听器。
 * @returns {HTMLElement} 标记的 DOM 元素。
 */
function build_marker(list, find, new_marker, info, no_listeners = false) {
	let marker = list.find(find)
	if (marker) {
		// Update properties if found to support reuse (e.g. trench level/owner change)
		Object.assign(marker, new_marker)
		marker.name = info.name
		marker.element.className = `${info.counter} anchored`
		marker.element.my_size = info.size
		return marker.element
	}
	marker = new_marker
	marker.name = info.name
	marker.element = document.createElement("div")
	marker.element.marker = marker
	marker.element.className = `${info.counter} anchored`
	marker.element.my_size = info.size
	if (!no_listeners) {
		marker.element.addEventListener("click", on_click_marker)
		marker.element.addEventListener("mouseenter", on_focus_marker)
		marker.element.addEventListener("mouseleave", on_blur_marker)
	}
	list.push(marker)
	ui.markers.appendChild(marker.element)
	return marker.element
}

/**
 * 销毁指定的标记。
 * @param {Object[]} list - 标记列表。
 * @param {Function} find - 查找标记的函数。
 */
function destroy_marker(list, find) {
	const index = list.findIndex(find)
	if (index >= 0) {
		const marker = list[index]
		list.splice(index, 1)
		marker.element.remove()
	}
}

function destroy_markers(list, find) {
	let index = -1
	do {
		index = list.findIndex(find)
		if (index >= 0) {
			const marker = list[index]
			list.splice(index, 1)
			marker.element.remove()
		}
	} while (index >= 0)
}

// Missed MO marker tracking
const missed_mo_ap_markers = []
const missed_mo_cp_markers = []

function build_missed_mo_marker(faction, turn) {
	const list = faction === AP ? missed_mo_ap_markers : missed_mo_cp_markers
	const info = faction === AP ? marker_info.ap_missed_mo : marker_info.cp_missed_mo
	const type = faction === AP ? "ap_missed_mo" : "cp_missed_mo"
	return build_marker(list, (e) => e.turn === turn, { type, turn }, info)
}

function destroy_missed_mo_marker(faction, turn) {
	const list = faction === AP ? missed_mo_ap_markers : missed_mo_cp_markers
	destroy_marker(list, (e) => e.turn === turn)
}

const CONTROL_MARKER_TYPES = new Set(["ap_control", "cp_control", "ru_control"])
const CONTROL_MARKER_LAYOUT_KEYS = {
	"Central Asia": "CENTRAL_ASIA_control",
	INDIA: "INDIA_control"
}

function get_control_marker_info(type) {
	if (type === "ap_control") return marker_info.control.ap
	if (type === "cp_control") return marker_info.control.cp
	if (type === "ru_control") return marker_info.control.ru
	return null
}

function sync_control_marker(s, type, stack_parts) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	destroy_markers(list, (m) => CONTROL_MARKER_TYPES.has(m.type) && m.type !== type)
	const info = get_control_marker_info(type)
	if (!info) {
		return
	}
	const marker = build_marker(list, (m) => m.type === type, { type: type, space: s }, info)
	if (position_control_marker_at_custom_layout(s, marker)) {
		return
	}
	stack_parts.bottom_markers.push(marker)
}

function get_control_marker_layout_key(s) {
	const name = spaces[s] && spaces[s].name
	return CONTROL_MARKER_LAYOUT_KEYS[name] || null
}

function position_control_marker_at_custom_layout(s, marker) {
	const key = get_control_marker_layout_key(s)
	const rec = key && layout ? layout[key] : null
	if (!rec) {
		return false
	}
	marker.my_stack = null
	marker.dataset.space = String(s)
	position_marker_at_layout(marker, rec)
	return true
}

/**
 * 构建空间的激活标记（如移动或攻击）。
 * @param {number} s - 空间索引。
 * @param {string} type - 标记类型 (move, attack)。
 * @param {number} [ix=0] - 索引（用于区分多个标记）。
 * @returns {HTMLElement} 激活标记的 DOM 元素。
 */
function build_activation_marker(s, type, ix = 0) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	const info = marker_info[type]
	return build_marker(
		list,
		(m) => {
			return m.type === type && m.ix === ix
		},
		{ type: type, space: s, ix: ix },
		info
	)
}

/**
 * 销毁指定空间的所有激活标记。
 * @param {number} s - 空间索引。
 */
function destroy_activation_markers(s) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	const remove_type = (type) => {
		let index = -1
		do {
			index = list.findIndex((m) => {
				return m.type === type
			})
			if (index >= 0) {
				const marker = list[index]
				list.splice(index, 1)
				marker.element.remove()
			}
		} while (index >= 0)
	}
	remove_type("move")
	remove_type("attack")
}

/**
 * 构建空间的补给中断标记。
 * @param {number} s - 空间 ID。
 * @returns {HTMLElement} 标记元素。
 */
function build_oos_marker(s) {
	return build_space_marker(s, "oos", marker_info.out_of_supply)
}

/**
 * 销毁空间的补给中断标记。
 * @param {number} s - 空间 ID。
 */
function destroy_oos_marker(s) {
	destroy_space_marker(s, "oos")
}

function build_catastrophic_attack_oos_marker(s) {
	return build_space_marker(s, "catastrophic_attack_oos", marker_info.catastrophic_attack_oos)
}

function destroy_catastrophic_attack_oos_marker(s) {
	destroy_space_marker(s, "catastrophic_attack_oos")
}

function build_limited_supply_marker(s) {
	return build_space_marker(s, "limited_supply", marker_info.limited_supply)
}

function destroy_limited_supply_marker(s) {
	destroy_space_marker(s, "limited_supply")
}

/**
 * 构建空间的滩头阵地标记。
 * @param {number} s - 空间 ID。
 * @returns {HTMLElement} 标记元素。
 */
function build_beachhead_marker(s) {
	return build_space_marker(s, "beachhead", marker_info.beachhead)
}

/**
 * 销毁空间的滩头阵地标记。
 * @param {number} s - 空间 ID。
 */
function destroy_beachhead_marker(s) {
	destroy_space_marker(s, "beachhead")
}

/**
 * 构建空间的要塞摧毁标记。
 * @param {number} s - 空间 ID。
 * @returns {HTMLElement} 标记元素。
 */
function build_fort_destroyed_marker(s) {
	return build_space_marker(s, "fort_destroyed", marker_info.fort_destroyed)
}

/**
 * 销毁空间的要塞摧毁标记。
 * @param {number} s - 空间 ID。
 */
function destroy_fort_destroyed_marker(s) {
	destroy_space_marker(s, "fort_destroyed")
}

function build_space_marker(s, type, info) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	return build_marker(list, (m) => m.type === type, { type, space: s }, info)
}

function destroy_space_marker(s, type) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	destroy_marker(list, (m) => m.type === type)
}

function build_persian_uprising_marker(s) {
	return build_space_marker(s, "persian_uprising", marker_info.persian_uprising)
}

function destroy_persian_uprising_marker(s) {
	destroy_space_marker(s, "persian_uprising")
}

function build_armenian_uprising_marker(s) {
	return build_space_marker(s, "armenian_uprising", marker_info.armenian_uprising)
}

function destroy_armenian_uprising_marker(s) {
	destroy_space_marker(s, "armenian_uprising")
}

function get_soviet_uprising_marker_info(s) {
	let name = spaces[s] && spaces[s].name
	if (name === "Central Asia") return marker_info.c_asia_uprising
	if (name === "Enzeli") return marker_info.enzeli_uprising
	return marker_info.baku_uprising
}

function build_soviet_uprising_marker(s) {
	return build_space_marker(s, "soviet_uprising", get_soviet_uprising_marker_info(s))
}

function destroy_soviet_uprising_marker(s) {
	destroy_space_marker(s, "soviet_uprising")
}

function build_jerusalem_by_christmas_marker(s) {
	return build_space_marker(s, "jerusalem_by_christmas", marker_info.j_by_c)
}

function destroy_jerusalem_by_christmas_marker(s) {
	destroy_space_marker(s, "jerusalem_by_christmas")
}

/**
 * 构建空间的战壕标记。
 * @param {number} s - 空间 ID。
 * @param {number} level - 战壕等级。
 * @returns {HTMLElement} 标记元素。
 */
function build_trench_marker(s, level, owner) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	const faction = owner || CP
	const side = faction === AP ? "ap" : "cp"
	const info = marker_info.trench[side][level] || marker_info.trench[side][1]
	const is_doiran = s === DOIRAN && level === 2 // Doiran has unique level 2 trench
	const counter_class = is_doiran ? `${info.counter} DOIR` : info.counter

	return build_marker(
		list,
		(m) => m.type === "trench",
		{ type: "trench", space: s, value: level, owner: faction },
		{ ...info, counter: counter_class }
	)
}

/**
 * 销毁空间的战壕标记。
 * @param {number} s - 空间 ID。
 */
function destroy_trench_marker(s) {
	const list = ui.space_list[s].markers || (ui.space_list[s].markers = [])
	destroy_marker(list, (m) => {
		return m.type === "trench"
	})
}

const MO_AP_SPACE = {
	russia: "AP MO RU",
	british: "AP MO BR/IN/ANZ",
	british_mesopotamia: "AP MO Meso/Persia",
	mesopotamia: "AP MO Meso/Persia",
	balkans: "AP MO Balkans",
	egypt: "AP MO Egypt",
	british_egypt: "AP MO Egypt",
	british_no_attack: "AP MO No Attack",
	none: "AP MO None"
}
const MO_CP_SPACE = {
	russia: "CP MO RU",
	british: "CP MO BR/IN/ANZ",
	turkey: "CP MO TU",
	enver: "CP MO Enver",
	none: "CP MO None"
}

function is_live_mo_marker_target(mo, fulfilled) {
	return !!mo && mo !== "none" && !fulfilled
}

function get_cp_mo_marker_layout_keys(view) {
	if (view?.mo_cp === "enver") {
		let enver = "CP MO Enver"
		let regular = "CP MO None"

		if (is_live_mo_marker_target(view.mo_cp_1, view.mo_cp_1_fulfilled)) {
			enver = MO_CP_SPACE[view.mo_cp_1] || "CP MO Enver"
		}
		if (is_live_mo_marker_target(view.mo_cp_2, view.mo_cp_2_fulfilled)) {
			regular = MO_CP_SPACE[view.mo_cp_2] || "CP MO None"
		}

		return { regular, enver }
	}

	let regular = "CP MO None"
	if (is_live_mo_marker_target(view?.mo_cp, view?.mo_cp_fulfilled)) {
		regular = MO_CP_SPACE[view.mo_cp] || "CP MO None"
	}
	return { regular, enver: "CP MO Enver" }
}

let ap_mo_marker = null
let cp_mo_marker = null
let cp_enver_mo_marker = null
let ap_mo_modifier_marker = null
let reserve_beachhead_markers = []
let ui_frame_state = null
let prev_map_piece_locations = null
let prev_map_snapshot = null

function to_id_set(list) {
	return Array.isArray(list) ? new Set(list) : null
}

function to_loose_id_set(list) {
	if (!Array.isArray(list)) return null
	const set = new Set()
	for (const item of list) {
		set.add(item)
		set.add(String(item))
	}
	return set
}

function has_loose_id(set_or_null, id) {
	return !!(set_or_null && (set_or_null.has(id) || set_or_null.has(String(id))))
}

const UI_FRAME_STATE_FIELDS = [
	{
		key: "control",
		diff: "control_map",
		build: () => (view?.control && typeof view.control === "object" ? view.control : null),
		snapshot: (value) => (value ? { ...value } : null)
	},
	{
		key: "control_defaults",
		diff: "control_map",
		build: () => (view?.control_defaults && typeof view.control_defaults === "object" ? view.control_defaults : null),
		snapshot: (value) => (value ? { ...value } : null)
	},
	{ key: "reduced", diff: "piece_set", build: () => to_id_set(view?.reduced) },
	{ key: "oos", diff: "piece_set", build: () => to_id_set(view?.oos) },
	{ key: "limited_supply", diff: "piece_set", build: () => to_id_set(view?.limited_supply) },
	{ key: "disrupted_supply", diff: "piece_set", build: () => to_id_set(view?.disrupted_supply) },
	{ key: "beachheads", diff: "space_set", build: () => to_id_set(view?.beachheads) },
	{ key: "trenches", diff: "space_set", build: () => to_id_set(view?.trenches) },
	{ key: "trenches_2", diff: "space_set", build: () => to_id_set(view?.trenches_2) },
	{
		key: "trench_owner",
		diff: "control_map",
		build: () => (view?.trench_owner && typeof view.trench_owner === "object" ? view.trench_owner : null),
		snapshot: (value) => (value ? { ...value } : null)
	},
	{ key: "forts_destroyed", diff: "space_set", build: () => to_id_set(view?.forts?.destroyed) },
	{ key: "forts_besieged", diff: "space_set", build: () => to_id_set(view?.forts?.besieged) },
	{
		key: "activation_cost",
		diff: "control_map",
		build: () =>
			view?.activation_cost && typeof view.activation_cost === "object" ? view.activation_cost : null,
		snapshot: (value) => (value ? { ...value } : null)
	},
	{ key: "armenian_uprising_markers", diff: "space_set", build: () => to_id_set(view?.armenian_uprising_markers) },
	{ key: "persian_uprising_markers", diff: "space_set", build: () => to_id_set(view?.persian_uprising_markers) },
	{ key: "soviet_uprising_markers", diff: "space_set", build: () => to_id_set(view?.soviet_uprising_markers) },
	{ key: "jerusalem_by_christmas_markers", diff: "space_set", build: () => to_id_set(view?.jerusalem_by_christmas_markers) },
	{ key: "catastrophic_attack_oos_markers", diff: "space_set", build: () => to_id_set(view?.catastrophic_attack_oos_markers) },
	{ key: "partial_ap_control_markers", diff: "space_set", build: () => to_id_set(view?.partial_ap_control_markers) },
	{ key: "partial_cp_control_markers", diff: "space_set", build: () => to_id_set(view?.partial_cp_control_markers) },
	{ key: "oos_spaces", diff: "space_set", build: () => to_id_set(view?.oos_spaces) },
	{ key: "entrenching", diff: "piece_set", build: () => to_id_set(view?.entrenching) },
	{ key: "pending_combine", diff: "piece_set", build: () => to_id_set(view?.pending_combine) },
	{ key: "moved", diff: "piece_set", build: () => to_id_set(view?.moved) },
	{ key: "attacked", diff: "piece_set", build: () => to_id_set(view?.attacked) },
	{ key: "supply_warnings", diff: "space_set", build: () => to_id_set(view?.supply_warnings) },
	{ key: "activated_move_spaces", diff: "space_set", build: () => to_id_set(view?.activated?.move) },
	{ key: "activated_attack_spaces", diff: "space_set", build: () => to_id_set(view?.activated?.attack) },
	{ key: "ru_control_markers", diff: "space_set", build: () => to_id_set(view?.ru_control_markers) },
	{ key: "attack_pieces", diff: "piece_set", build: () => to_id_set(view?.attack?.pieces) },
	{ key: "move_pieces", diff: "piece_set", build: () => to_id_set(view?.move?.pieces) },
	{ key: "action_space", diff: "space_set", build: () => to_loose_id_set(view?.actions?.space) },
	{ key: "action_activate_move", diff: "space_set", build: () => to_loose_id_set(view?.actions?.activate_move) },
	{ key: "action_activate_attack", diff: "space_set", build: () => to_loose_id_set(view?.actions?.activate_attack) },
	{
		key: "action_activate_attack_egypt",
		diff: "space_set",
		build: () => to_loose_id_set(view?.actions?.activate_attack_egypt)
	},
	{
		key: "action_activate_attack_with_br",
		diff: "space_set",
		build: () => to_loose_id_set(view?.actions?.activate_attack_with_br)
	},
	{ key: "action_deactivate", diff: "space_set", build: () => to_loose_id_set(view?.actions?.deactivate) },
	{ key: "action_combine", diff: "space_set", build: () => to_loose_id_set(view?.actions?.combine) },
	{ key: "action_remove_beachhead", diff: "space_set", build: () => to_loose_id_set(view?.actions?.remove_beachhead) },
	{ key: "action_piece", diff: "piece_set", build: () => to_loose_id_set(view?.actions?.piece) },
	{ key: "action_attack_piece", diff: "piece_set", build: () => to_loose_id_set(view?.actions?.attack) },
	{ key: "action_move_piece", diff: "piece_set", build: () => to_loose_id_set(view?.actions?.move) },
	{ key: "action_advance_pieces", diff: "piece_set", build: () => to_loose_id_set(view?.actions?.advance_pieces) },
	{ key: "action_retreat_pieces", diff: "piece_set", build: () => to_loose_id_set(view?.actions?.retreat_pieces) },
	{
		key: "violations_spaces",
		diff: "space_set",
		build: () => (Array.isArray(view?.violations) ? new Set(view.violations.map((v) => v.space)) : null)
	},
	{
		key: "where_single",
		diff: "space_scalar",
		build: () => (Array.isArray(view?.where) ? null : view?.where)
	},
	{
		key: "where_set",
		diff: "space_set",
		build: () => (Array.isArray(view?.where) ? new Set(view.where) : null)
	},
	{ key: "who_single", diff: "piece_scalar", build: () => view?.who },
	{
		key: "who_set",
		diff: "piece_set",
		build: () => (Array.isArray(view?.who) ? new Set(view.who) : null)
	}
]

function build_ui_frame_state() {
	const state = {}
	for (const field of UI_FRAME_STATE_FIELDS) {
		state[field.key] = field.build()
	}
	return state
}

function get_active_ui_frame_state(state = null) {
	return state || ui_frame_state || build_ui_frame_state()
}

function has_id(set_or_null, id) {
	return !!(set_or_null && set_or_null.has(id))
}

function normalize_numeric_id(id) {
	if (typeof id === "number") return Number.isFinite(id) ? id : null
	if (typeof id === "string" && id.length > 0) {
		const n = Number(id)
		return Number.isFinite(n) ? n : null
	}
	return null
}

function add_dirty_update_space(dirty_spaces, s) {
	if (s > 0 && s < map_space_count && UPDATE_SPACE_ID_FLAGS[s] === 1) {
		dirty_spaces.add(s)
	}
}

function add_dirty_space_set_diff(dirty_spaces, prev_set, next_set) {
	if (prev_set) {
		for (const id of prev_set) {
			if (next_set && next_set.has(id)) continue
			const s = normalize_numeric_id(id)
			if (s !== null) add_dirty_update_space(dirty_spaces, s)
		}
	}
	if (next_set) {
		for (const id of next_set) {
			if (prev_set && prev_set.has(id)) continue
			const s = normalize_numeric_id(id)
			if (s !== null) add_dirty_update_space(dirty_spaces, s)
		}
	}
}

function add_dirty_piece_set_diff(dirty_spaces, prev_set, next_set, prev_locations, next_locations) {
	if (prev_set) {
		for (const id of prev_set) {
			if (next_set && next_set.has(id)) continue
			const p = normalize_numeric_id(id)
			if (p === null) continue
			add_dirty_update_space(dirty_spaces, prev_locations ? prev_locations[p] : -1)
			add_dirty_update_space(dirty_spaces, next_locations ? next_locations[p] : -1)
		}
	}
	if (next_set) {
		for (const id of next_set) {
			if (prev_set && prev_set.has(id)) continue
			const p = normalize_numeric_id(id)
			if (p === null) continue
			add_dirty_update_space(dirty_spaces, prev_locations ? prev_locations[p] : -1)
			add_dirty_update_space(dirty_spaces, next_locations ? next_locations[p] : -1)
		}
	}
}

function clone_id_set(set_or_null) {
	return set_or_null ? new Set(set_or_null) : null
}

function clone_ui_frame_state_value(field, value) {
	if (field.snapshot) {
		return field.snapshot(value)
	}
	if (field.diff === "space_set" || field.diff === "piece_set") {
		return clone_id_set(value)
	}
	return value
}

function create_ui_frame_snapshot(state) {
	const snapshot = {}
	for (const field of UI_FRAME_STATE_FIELDS) {
		snapshot[field.key] = clone_ui_frame_state_value(field, state[field.key])
	}
	return snapshot
}

function add_dirty_ui_frame_state_changes(dirty_spaces, prev_state, next_state, prev_locations, next_locations) {
	for (const field of UI_FRAME_STATE_FIELDS) {
		const prev_value = prev_state[field.key]
		const next_value = next_state[field.key]
		switch (field.diff) {
			case "space_set":
				add_dirty_space_set_diff(dirty_spaces, prev_value, next_value)
				break
			case "piece_set":
				add_dirty_piece_set_diff(dirty_spaces, prev_value, next_value, prev_locations, next_locations)
				break
			case "space_scalar":
				if (prev_value !== next_value) {
					add_dirty_update_space(dirty_spaces, prev_value)
					add_dirty_update_space(dirty_spaces, next_value)
				}
				break
			case "piece_scalar":
				if (prev_value !== next_value) {
					const prev_piece = normalize_numeric_id(prev_value)
					const next_piece = normalize_numeric_id(next_value)
					if (prev_piece !== null) {
						add_dirty_update_space(dirty_spaces, prev_locations[prev_piece])
						add_dirty_update_space(dirty_spaces, next_locations[prev_piece])
					}
					if (next_piece !== null) {
						add_dirty_update_space(dirty_spaces, prev_locations[next_piece])
						add_dirty_update_space(dirty_spaces, next_locations[next_piece])
					}
				}
				break
			case "control_map": {
				const ids = new Set()
				if (prev_value) {
					for (const id of Object.keys(prev_value)) ids.add(id)
				}
				if (next_value) {
					for (const id of Object.keys(next_value)) ids.add(id)
				}
				for (const id of ids) {
					const prev_control = prev_value ? prev_value[id] : undefined
					const next_control = next_value ? next_value[id] : undefined
					if (prev_control !== next_control) {
						const s = normalize_numeric_id(id)
						if (s !== null) add_dirty_update_space(dirty_spaces, s)
					}
				}
				break
			}
		}
	}
}

/**
 * 更新整个地图的状态，包括单位位置和各个盒子的内容。
 */
function update_map() {
	ui_frame_state = build_ui_frame_state()
	const pieces_in_space = new Map()
	const piece_locations = new Int16Array(pieces.length)
	piece_locations.fill(-1)
	for (let p = 0; p < pieces.length; p++) {
		if (!pieces[p]) {
			continue
		}
		const raw_loc = view.pieces ? view.pieces[p] : view.location ? view.location[p] : -1
		const loc = get_ui_piece_location(pieces[p], raw_loc)
		piece_locations[p] = loc
		if (loc >= 0 && loc < spaces.length) {
			let bucket = pieces_in_space.get(loc)
			if (!bucket) {
				bucket = []
				pieces_in_space.set(loc, bucket)
			}
			bucket.push(p)
		}
	}

	for (let s of ELIMINATED_BOX_SPACE_IDS) {
		update_eliminated_box(s, pieces_in_space.get(s) || EMPTY_PIECE_IDS)
	}
	for (let s of RESERVE_BOX_SPACE_IDS) {
		update_reserve_box(s, pieces_in_space.get(s) || EMPTY_PIECE_IDS)
	}
	let dirty_update_spaces = null
	if (!prev_map_snapshot || !prev_map_piece_locations) {
		dirty_update_spaces = UPDATE_SPACE_IDS
	} else {
		const dirty = new Set()
		for (let p = 0; p < pieces.length; p++) {
			const prev_loc = prev_map_piece_locations[p]
			const loc = piece_locations[p]
			if (prev_loc !== loc) {
				add_dirty_update_space(dirty, prev_loc)
				add_dirty_update_space(dirty, loc)
			}
		}

		add_dirty_ui_frame_state_changes(dirty, prev_map_snapshot, ui_frame_state, prev_map_piece_locations, piece_locations)
		if (pending_focus_dirty_spaces) {
			for (const s of pending_focus_dirty_spaces) {
				add_dirty_update_space(dirty, s)
			}
		}
		dirty_update_spaces = dirty.size > 0 ? Array.from(dirty) : EMPTY_PIECE_IDS
	}
	for (let s of dirty_update_spaces) {
		update_space(s, pieces_in_space.get(s))
	}
	pending_focus_dirty_spaces = null

	if (focus_key === null && focus_box) {
		focus_box.style.display = "none"
	}

	update_system_markers()
	prev_map_piece_locations = piece_locations
	prev_map_snapshot = create_ui_frame_snapshot(ui_frame_state)
	ui_frame_state = null
}

/**
 * 获取单位的当前位置。
 * @param {number} p - 单位 ID。
 * @returns {number|null} 空间 ID 或 null。
 */
function get_piece_location(p) {
	if (view && view.pieces) {
		return view.pieces[p]
	}
	if (view && view.location) {
		return view.location[p]
	}
	return null
}

/**
 * 展开增援名称（处理包含 | 或 # 的名称）。
 * @param {string} name - 原始名称。
 * @returns {string[]} 展开后的名称数组。
 */
function expand_reinforcement_names(name) {
	if (name.includes("|")) {
		return name.split("|").map((s) => s.trim())
	}
	const parts = name.split("#").map((s) => s.trim())
	if (parts.length <= 1) {
		return [name]
	}
	const base = parts[0]
	const tokens = parts.slice(1).flatMap((p) => p.split(/\s+/))
	return tokens.filter((t) => !!t).map((t) => `${base} #${t}`)
}

/**
 * 确保增援插槽映射表已建立。
 */
function ensure_reinforcement_slots() {
	if (reinforcement_slot_map) {
		return
	}
	reinforcement_slot_map = new Map()
	for (let i = 0; i < spaces.length; ++i) {
		const slot = spaces[i]
		if (!slot || slot.type !== "reinforcement") {
			continue
		}
		const names = expand_reinforcement_names(slot.name)
		for (const name of names) {
			reinforcement_slot_map.set(`${slot.side}:${name}`, slot)
		}
	}
}

const REINFORCEMENT_MARKER_BY_NAME = {
	"CP Air Superiority token": "cp_air_superiority",
	"U_boats in the Med token": "u_boats_med",
	"Kitch.token": "kitchener",
	"W.W.Pt. token": "ww_pt",
	"J By C token": "j_by_c",
	"SINAI RAILROAD": "sinai_railroad",
	"Max TU RP": "max_tu_rp",
	"Persian Uprising token": "persian_uprising",
	"Parvus to Berlin token": "parvus_to_berlin",
	"Revolution token": "revolution_token",
	"Long Live the Czar! token": "long_live_czar",
	"BB.RR token": "bb_rr",
	"Baku Uprising token": "baku_uprising",
	"C.Asia Uprising token": "c_asia_uprising",
	"Enzeli Uprising token": "enzeli_uprising",
	"Armenian Uprising token": "armenian_uprising"
}

const REINFORCEMENT_MARKER_COUNTS = {
	"Persian Uprising token": 3
}

let reinforcement_operator_slots = null
const INITIAL_BEACHHEAD_ON_MAP = 2

/**
 * 确保增援操作插槽（滩头阵地、战壕）已建立。
 */
function ensure_reinforcement_operator_slots() {
	if (reinforcement_operator_slots) {
		return
	}
	const beachhead = []
	const trench = []
	for (let i = 0; i < spaces.length; ++i) {
		const slot = spaces[i]
		if (!slot || slot.type !== "reinforcement" || !slot.name) {
			continue
		}
		if (slot.name.includes("Beachhead")) {
			const names = expand_reinforcement_names(slot.name)
			for (const name of names) {
				beachhead.push({ name, side: slot.side, slot })
			}
		} else if (slot.name === "Trench") {
			const names = expand_reinforcement_names(slot.name)
			for (const name of names) {
				trench.push({ name, side: slot.side, slot })
			}
		}
	}
	beachhead.sort((a, b) => {
		const na = Number((a.name.match(/#(\d+)/) || [])[1] || 0)
		const nb = Number((b.name.match(/#(\d+)/) || [])[1] || 0)
		if (na !== nb) {
			return na - nb
		}
		return a.name.localeCompare(b.name)
	})
	reinforcement_operator_slots = { beachhead, trench }
}

/**
 * 规范化增援名称（移除编号和多余空格）。
 * @param {string} name - 原始名称。
 * @returns {string} 规范化后的名称。
 */
function normalize_reinforcement_name(name) {
	return name.replace(/#\d+/g, "").replace(/\s+/g, " ").trim()
}

/**
 * 应用增援标记的样式。
 * @param {HTMLElement} el - 标记元素。
 * @param {Object} info - 标记信息对象。
 */
function apply_reinforcement_marker_style(el, info) {
	el.className = `${info.counter} anchored reinforcement_marker`
	el.style.width = `${info.size}px`
	el.style.height = `${info.size}px`
	el.my_size = info.size
}

/**
 * 创建一个新的增援标记元素。
 * @param {Object} info - 标记信息对象。
 * @returns {HTMLElement} 标记元素。
 */
function create_reinforcement_marker(info) {
	const el = document.createElement("div")
	apply_reinforcement_marker_style(el, info)
	return el
}

/**
 * 获取或创建增援标记元素。
 * @param {Object} slot - 插槽对象。
 * @param {string} type - 标记类型（如 "beachhead"）。
 * @param {string} name - 标记名称（如 "Beachhead #4"）。
 * @param {number} index - 标记索引（处理同名多个标记）。
 * @param {Object} info - 标记信息对象。
 * @param {HTMLElement} board - 容器板元素。
 * @returns {HTMLElement} 标记元素。
 */
function get_reinforcement_marker(slot, type, name, index, info, board) {
	if (!slot.marker_elements) {
		slot.marker_elements = new Map()
	}
	const marker_key = `${type}:${name}:${index}`
	let el = slot.marker_elements.get(marker_key)
	if (!el) {
		el = create_reinforcement_marker(info)
		slot.marker_elements.set(marker_key, el)
	}
	apply_reinforcement_marker_style(el, info)
	el.marker_used = true
	if (el.parentNode !== board) {
		board.appendChild(el)
	}
	return el
}

/**
 * 确保插槽的堆栈已建立。
 * @param {Object} slot - 插槽对象。
 * @param {Array} slot_stacks - 插槽堆栈数组。
 * @param {Map} stack_by_coord - 坐标映射表。
 * @returns {Array|null} 堆栈数组。
 */
function ensure_slot_stack(slot, slot_stacks, stack_by_coord) {
	if (!slot) {
		return null
	}
	if (stack_by_coord && slot.x !== undefined && slot.y !== undefined) {
		const key = `${slot.side}:${slot.x}:${slot.y}`
		let stack = stack_by_coord.get(key)
		if (!stack) {
			stack = Array.isArray(slot.stack) ? slot.stack : []
			stack.name = stack.name || slot.name
			stack.is_reinforcement = true
			stack.is_reinforcement_board = true
			stack.x = slot.x
			stack.y = slot.y
			stack.side = slot.side
			stack_by_coord.set(key, stack)
			if (Array.isArray(slot_stacks)) {
				slot_stacks.push({ stack, x: slot.x, y: slot.y })
			}
		}
		slot.stack = stack
		stack.is_reinforcement = true
		stack.is_reinforcement_board = true
		return stack
	}
	if (!slot.stack) {
		slot.stack = []
		slot.stack.name = slot.name
		slot.stack.is_reinforcement = true
		slot.stack.x = slot.x
		slot.stack.y = slot.y
		slot.stack.side = slot.side
	}
	slot.stack.is_reinforcement = true
	slot.stack.is_reinforcement_board = true
	if (slot.stack.length === 0 && Array.isArray(slot_stacks)) {
		slot_stacks.push({ stack: slot.stack, x: slot.x, y: slot.y })
	}
	return slot.stack
}

function collect_reinforcement_operator_tokens() {
	const beachhead_on_map = Array.isArray(view?.beachheads) ? view.beachheads.length : 0
	const used_extra_beachheads = Math.max(0, beachhead_on_map - INITIAL_BEACHHEAD_ON_MAP)
	const beachhead_tokens = reinforcement_operator_slots.beachhead.slice(used_extra_beachheads).map((slot) => {
		return { ...slot, type: "beachhead" }
	})
	const trench_slots = reinforcement_operator_slots.trench
	const trenches_on_map = (view.trenches && view.trenches.length) || (view.trenches_2 && view.trenches_2.length)
	const trench_available = trench_slots.length > 0 && (!view.trench_reinforcement_used || !trenches_on_map)
	if (!trench_available) {
		return beachhead_tokens
	}
	const sorted_trench_slots = trench_slots
		.map((entry) => {
			const slot = entry.slot
			return { entry, x: slot ? slot.x : 0, y: slot ? slot.y : 0 }
		})
		.sort((a, b) => {
			return Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x)
		})
	const trench_tokens = sorted_trench_slots.map((trench_choice) => {
		return { ...trench_choice.entry, type: "trench" }
	})
	return beachhead_tokens.concat(trench_tokens)
}

function get_reinforcement_operator_info(token) {
	if (token.type === "beachhead") {
		return marker_info.beachhead
	}
	if (token.type === "trench") {
		const faction = token.side === AP ? "ap" : "cp"
		const base = marker_info.trench[faction][1]
		const size = marker_info.beachhead.size
		return base.size === size ? base : { ...base, size }
	}
	return null
}

/**
 * 渲染增援板上的操作标记（滩头阵地、战壕）。
 * @param {HTMLElement} ap_board - 协约国增援板。
 * @param {HTMLElement} cp_board - 同盟国增援板。
 * @param {Array} [slot_stacks=[]] - 插槽堆栈数组。
 * @param {Map} stack_by_coord - 坐标映射表。
 */
function render_reinforcement_operator_markers(ap_board, cp_board, slot_stacks = [], stack_by_coord) {
	if (!view) {
		return
	}
	ensure_reinforcement_operator_slots()
	if (!reinforcement_operator_slots) {
		return
	}
	const desired = collect_reinforcement_operator_tokens()
	for (const token of desired) {
		const slot = token.slot
		if (!slot) {
			continue
		}
		const info = get_reinforcement_operator_info(token)
		if (!info) {
			continue
		}
		const board = slot.side === AP ? ap_board : cp_board
		const el = get_reinforcement_marker(slot, token.type, token.name, 0, info, board)
		const stack = ensure_slot_stack(slot, slot_stacks, stack_by_coord)
		if (stack) stack.push(el)
	}
}

/**
 * 渲染增援区代币标记。
 * @param {HTMLElement} ap_board - 协约国增援板。
 * @param {HTMLElement} cp_board - 同盟国增援板。
 * @param {Object[]} [slot_stacks=[]] - 插槽堆栈列表。
 * @param {Map} stack_by_coord - 按坐标存储的堆栈映射。
 */
function render_reinforcement_token_markers(ap_board, cp_board, slot_stacks = [], stack_by_coord) {
	const hidden_markers = new Set(view?.hidden_reinforcement_markers || [])
	for (let i = 0; i < spaces.length; ++i) {
		const slot = spaces[i]
		if (!slot || slot.type !== "reinforcement" || !slot.name) {
			continue
		}
		const names = expand_reinforcement_names(slot.name)
		for (const expanded of names) {
			const base = normalize_reinforcement_name(expanded)
			if (hidden_markers.has(base)) {
				continue
			}
			const key = REINFORCEMENT_MARKER_BY_NAME[base]
			if (!key) {
				continue
			}
			const info = marker_info[key]
			if (!info) {
				continue
			}
			const board = slot.side === AP ? ap_board : cp_board
			const count = REINFORCEMENT_MARKER_COUNTS[base] || 1
			for (let j = 0; j < count; j += 1) {
				const el = get_reinforcement_marker(slot, key, expanded, j, info, board)
				const stack = ensure_slot_stack(slot, slot_stacks, stack_by_coord)
				if (stack) stack.push(el)
			}
		}
	}
}

/**
 * 更新增援区显示。
 */
function update_reinforcements() {
	const container = document.getElementById("reinforcements")
	if (!container) {
		return
	}
	let cp_board = document.getElementById("cp_reinforcements")
	let ap_board = document.getElementById("ap_reinforcements")

	if (!cp_board || !ap_board) {
		container.replaceChildren()
		const cp_div = document.createElement("div")
		cp_div.className = "reinforcement_block cp_block"
		cp_board = document.createElement("div")
		cp_board.id = "cp_reinforcements"
		cp_board.className = "reinforcement_board"
		cp_div.appendChild(cp_board)
		container.appendChild(cp_div)

		const ap_div = document.createElement("div")
		ap_div.className = "reinforcement_block ap_block"
		ap_board = document.createElement("div")
		ap_board.id = "ap_reinforcements"
		ap_board.className = "reinforcement_board"
		ap_div.appendChild(ap_board)
		container.appendChild(ap_div)
	}

	cp_board.style.backgroundImage = `url("pieces/CPReinforcements.png")`
	cp_board.style.width = `${REINFORCEMENT_BOARD_WIDTH}px`
	cp_board.style.height = `${CP_REINFORCEMENT_BOARD_HEIGHT}px`
	ap_board.style.backgroundImage = `url("pieces/APReinforcements.png")`
	ap_board.style.width = `${REINFORCEMENT_BOARD_WIDTH}px`
	ap_board.style.height = `${AP_REINFORCEMENT_BOARD_HEIGHT}px`

	ensure_reinforcement_slots()

	// Clear reinforcement stacks before refilling
	for (let i = 0; i < spaces.length; ++i) {
		const slot = spaces[i]
		if (slot && slot.type === "reinforcement" && slot.stack) {
			slot.stack.length = 0
		}
		if (slot && slot.marker_elements) {
			for (const el of slot.marker_elements.values()) {
				el.marker_used = false
			}
		}
	}
	if (typeof reinforcement_slot_map !== "undefined") {
		for (const slot of reinforcement_slot_map.values()) {
			if (slot.stack) {
				slot.stack.length = 0
			}
		}
	}

	const slot_stacks = []
	const stack_by_coord = new Map()

	// 恢复聚焦状态所需的临时映射
	let current_focus_stack = null

	for (let p = 0; p < pieces.length; ++p) {
		if (!pieces[p]) {
			continue
		}
		// Allow specific system tokens on reinforcement board
		const is_system = SYSTEM_PIECE_NAMES.has(pieces[p].name)
		if (is_system) {
			continue
		}

		const el = pieces[p].element
		if (!el) {
			continue
		}
		const raw_loc = get_piece_location(p)
		const loc = get_ui_piece_location(pieces[p], raw_loc)

		let slot = null
		if (loc === REINFORCEMENTS) {
			slot = reinforcement_slot_map.get(`${pieces[p].faction}:${pieces[p].name}`)
		} else if (loc === REMOVED) {
			slot = reinforcement_slot_map.get(`${pieces[p].faction}:${pieces[p].faction.toUpperCase()} Removed Box`)
		} else if (loc > 0 && loc < spaces.length) {
			const s = spaces[loc]
			if (s && s.type === "reinforcement") {
				slot = s
			}
		}

		if (slot && slot.x !== undefined && slot.y !== undefined) {
			const board = slot.side === AP ? ap_board : cp_board
			if (el.parentNode !== board) {
				board.appendChild(el)
			}
			el.classList.remove("offmap")

			el.classList.remove("activated")
			el.classList.remove("spent")
			if (pieces[p].type !== "tribe") {
				el.classList.remove("selected")
			}
			el.classList.remove("limited_supply")
			el.classList.remove("disrupted_supply")
			el.classList.remove("entrenching")
			el.classList.remove("pending_combine")

			const stk = ensure_slot_stack(slot, slot_stacks, stack_by_coord)
			stk.push(el)
			el.my_stack = stk
		} else {
			if (loc === REINFORCEMENTS || loc === REMOVED || loc === ELIMINATED) {
				el.classList.add("offmap")

				// Ensure all state classes are cleared when off-map
				el.classList.remove("activated")
				el.classList.remove("spent")
				if (pieces[p].type !== "tribe") {
					el.classList.remove("selected")
				}
				el.classList.remove("limited_supply")
				el.classList.remove("disrupted_supply")
				el.classList.remove("entrenching")
				el.classList.remove("pending_combine")
			} else {
				// Tribal units in reserve boxes might be here if they are remapped to a non-reinforcement slot
				// They are handled by update_reserve_box, so we don't want to clear their classes here.
			}
			if (el.parentNode !== ui.pieces) {
				ui.pieces.appendChild(el)
			}
			if (raw_loc === REINFORCEMENTS && pieces[p].type === "tribe") {
				log_tribe_reserve(
					"render on map reserve",
					pieces[p].name,
					"ui_loc:",
					loc,
					"parent:",
					el.parentNode?.id || "pieces"
				)
			}
		}
	}

	render_reinforcement_operator_markers(ap_board, cp_board, slot_stacks, stack_by_coord)
	render_reinforcement_token_markers(ap_board, cp_board, slot_stacks, stack_by_coord)

	for (const entry of slot_stacks) {
		const stack = entry.stack
		if (stack.length === 0) {
			continue
		}
		const x = Number(entry.x)
		const y = Number(entry.y)
		stack.x = x
		stack.y = y
		stack.side = entry.side
		stack.is_reinforcement = true
		stack.is_reinforcement_board = true

		bind_stack_interaction(stack)

		// 记录当前聚焦的堆栈对象
		if (is_stack_focused(stack)) {
			current_focus_stack = stack
		}

		layout_stack(stack, x, y)
	}

	// 确保聚焦标记（focus_box）在 UI 更新后仍然存在并绑定
	if (current_focus_stack) {
		layout_stack(current_focus_stack, current_focus_stack.x, current_focus_stack.y)
	} else if (focus_is_reinforcement_board) {
		focus_key = null
		focus_is_reinforcement_board = false
		hide_focus_box()
	} else if (focus_box_is_on_reinforcement_board()) {
		hide_focus_box()
	}

	for (let i = 0; i < spaces.length; ++i) {
		const slot = spaces[i]
		if (!slot || !slot.marker_elements) {
			continue
		}
		const to_remove = []
		for (const [key, el] of slot.marker_elements.entries()) {
			if (!el.marker_used) {
				if (el.parentNode) {
					el.parentNode.removeChild(el)
				}
				to_remove.push(key)
			}
		}
		for (const key of to_remove) {
			slot.marker_elements.delete(key)
		}
	}
}

/**
 * 将元素推入堆栈顶部。
 * @param {HTMLElement[]} stk - 目标堆栈。
 * @param {HTMLElement} elt - 要推入的元素。
 */
function push_stack(stk, elt) {
	if (!elt) return
	stk.unshift(elt)
	elt.my_stack = stk
}

/**
 * 将元素插入堆栈底部。
 * @param {HTMLElement[]} stk - 目标堆栈数组。
 * @param {HTMLElement} elt - 要插入的元素。
 */
function unshift_stack(stk, elt) {
	stk.push(elt)
	elt.my_stack = stk
}

const MINY = 50

/**
 * 取消当前堆栈的聚焦状态。
 */
function blur_stack() {
	const had_focus = focus_key !== null
	if (focus_key !== null) {
		mark_focus_dirty_by_key(focus_key)
		focus_key = null
		focus_is_reinforcement_board = false
	}
	hide_focus_box()
	if (had_focus) {
		on_update()
	}
}

/**
 * 判断堆栈是否为小堆栈（只有 0 或 1 个元素）。
 * @param {HTMLElement[]} stk - 目标堆栈。
 * @returns {boolean} 是否为小堆栈。
 */
function is_small_stack(stk) {
	return stk.length <= 1
}

/**
 * 聚焦指定的堆栈。
 * @param {HTMLElement[]} stack - 目标堆栈。
 * @returns {boolean} 如果堆栈已经处于聚焦状态则返回 true。
 */
function focus_stack(stack) {
	if (!stack) {
		return false
	}
	const key = get_stack_key(stack)

	if (focus_key !== key) {
		mark_focus_dirty_by_key(focus_key)
		mark_focus_dirty_by_stack(stack)
		focus_key = key
		focus_is_reinforcement_board = !!stack.is_reinforcement_board
		on_update()
		return is_small_stack(stack)
	}
	focus_is_reinforcement_board = !!stack.is_reinforcement_board
	return true
}

/**
 * 布局堆栈中的元素。
 * @param {HTMLElement[]} stack - 堆栈元素数组。
 * @param {number} start_x - 布局的起始 X 坐标。
 * @param {number} start_y - 布局的起始 Y 坐标。
 */
function layout_stack(stack, start_x, start_y) {
	if (stack.length === 0) {
		return
	}

	const dim = style_dims[style]
	let focused = is_stack_focused(stack)
	let z = focused ? 101 : 1

	const dx = stack.length > 5 ? dim.stack_dx_tight : dim.stack_dx
	const dy = stack.length > 5 ? dim.stack_dx_tight : dim.stack_dy
	const dz = stack.length > 5 ? 1 : 3

	// Lose focus if stack is small.
	if (focused && is_small_stack(stack) && !stack.is_reinforcement) {
		focus_key = null
		focus_is_reinforcement_board = false
		focused = false
		hide_focus_box()
	}

	if (focused) {
		const x = start_x
		let y = start_y + (stack[0].my_size + dim.border * 2) / 2
		z += dz
		let minx = x
		let maxx = x
		let miny = y
		let maxy = y

		// compute focus box height and move down if it would go past the top
		let h = 0
		for (let i = 1; i < stack.length; ++i) {
			h += stack[i].my_size + dim.border * 2 + dim.gap
		}
		const board = stack[0].parentNode
		const is_reinforcement_board = board && (board.id === "ap_reinforcements" || board.id === "cp_reinforcements")
		if (is_reinforcement_board) {
			const maxHeight =
				board.id === "ap_reinforcements" ? AP_REINFORCEMENT_BOARD_HEIGHT : CP_REINFORCEMENT_BOARD_HEIGHT
			if (y > maxHeight - dim.padding) {
				y = maxHeight - dim.padding
			}
		}
		if (y - h < MINY) {
			y = MINY + h
		}

		for (const elt of stack) {
			const ex = Math.floor(x - elt.my_size / 2 - dim.border)
			const ey = Math.floor(y - elt.my_size - dim.border * 2)
			minx = Math.min(minx, ex)
			miny = Math.min(miny, ey)
			maxx = Math.max(maxx, ex + elt.my_size + dim.border * 2)
			maxy = Math.max(maxy, ey + elt.my_size + dim.border * 2)
			elt.style.left = `${ex}px`
			elt.style.top = `${ey}px`
			elt.style.zIndex = z
			y -= elt.my_size + dim.border * 2 + dim.gap
		}
		if (focus_box) {
			if (focus_box.parentNode !== stack[0].parentNode) {
				stack[0].parentNode.appendChild(focus_box)
			}
			focus_box.style.display = "block"
			focus_box.style.left = `${minx - dim.padding}px`
			focus_box.style.top = `${miny - dim.padding}px`
			focus_box.style.width = `${maxx - minx + dim.padding * 2}px`
			focus_box.style.height = `${maxy - miny + dim.padding * 2}px`
		}
	} else {
		let x = start_x - (stack[0].my_size + dim.border * 2) / 2
		let y = start_y + (stack[0].my_size + dim.border * 2) / 2
		for (const elt of stack) {
			const ex = Math.floor(x)
			const ey = Math.floor(y - elt.my_size - dim.border * 2)
			elt.style.left = `${ex}px`
			elt.style.top = `${ey}px`
			elt.style.zIndex = z
			x += dx
			y -= dy
			z += dz
			if (y < MINY) {
				y = MINY
			}
		}
		if (focus_key === null && focus_box) {
			focus_box.style.display = "none"
		}
	}
}

/**
 * 为堆栈元素绑定交互事件。
 * @param {HTMLElement[]} elements - 元素数组。
 */
function bind_stack_interaction(elements) {
	for (const elt of elements) {
		elt.my_stack = elements
		if (!elt.stack_bound) {
			elt.stack_bound = true
			elt.addEventListener("click", (e) => {
				if (e.button === 0) {
					// 如果是算子，交给 on_click_piece 处理
					if (elt.piece !== undefined) {
						return
					}

					const is_focused = is_stack_focused(elt.my_stack)
					const is_small = is_small_stack(elt.my_stack)

					if (!is_focused && !is_small) {
						e.stopPropagation()
						focus_stack(elt.my_stack)
					}
				}
			})
		}
	}
}

/**
 * 更新页眉的激活阵营颜色。
 */
function update_header_active_color() {
	const header = document.querySelector("header")
	if (header) {
		const is_ap = view.active === "Allied Powers" || view.active === "ap"
		const is_cp = view.active === "Central Powers" || view.active === "cp"
		const prompt = typeof view.prompt === "string" ? view.prompt.toLowerCase() : ""
		const is_waiting_prompt = prompt.startsWith("waiting") || prompt.startsWith("等待")
		const is_waiting = !!view.waiting || is_waiting_prompt || !view.actions
		header.classList.toggle("Allied_Powers", is_ap)
		header.classList.toggle("Central_Powers", is_cp)
		if (is_waiting) {
			header.style.backgroundColor = "white"
		} else if (is_ap) {
			header.style.backgroundColor = "lightcoral"
		} else if (is_cp) {
			header.style.backgroundColor = "lightsteelblue"
		} else {
			header.style.backgroundColor = ""
		}
	}
}

/**
 * 更新整个 UI 状态的主函数。
 */
function on_update() {
	if (!DEBUG_INTERACTION_PERF) {
		update_header_active_color()
		update_reinforcements()
		update_map()
		update_card_zones()
		update_actions()
		update_ui_tokens()
		update_operators()
		update_neutral_markers()
		update_supply_warning_indicator()
		update_toolbar_state()
		update_side_panel()
		update_track_dialog_if_open()
		return
	}
	const started_at = now_ms()
	const spans = {}
	const step = (name, fn) => {
		const t0 = now_ms()
		fn()
		spans[name] = Math.round((now_ms() - t0) * 100) / 100
	}
	step("update_header_active_color", update_header_active_color)
	step("update_reinforcements", update_reinforcements)
	step("update_map", update_map)
	step("update_card_zones", update_card_zones)
	step("update_actions", update_actions)
	step("update_ui_tokens", update_ui_tokens)
	step("update_operators", update_operators)
	step("update_neutral_markers", update_neutral_markers)
	step("update_supply_warning_indicator", update_supply_warning_indicator)
	step("update_toolbar_state", update_toolbar_state)
	step("update_side_panel", update_side_panel)
	step("update_track_dialog_if_open", update_track_dialog_if_open)
	log_interaction_perf("on_update.done", {
		total_ms: Math.round((now_ms() - started_at) * 100) / 100,
		spans
	})
	if (last_interaction_perf) {
		end_interaction_perf(last_interaction_perf.id, "interaction.after_on_update")
	}
}

/**
 * 更新补给警告指示器状态。
 */
function update_supply_warning_indicator() {
	const elt = document.getElementById("flag_supply_warning_menu")
	if (elt) {
		if (view.supply_warnings && view.supply_warnings.length > 0) {
			elt.textContent = `标记补给警告 (${view.supply_warnings.length})`
			elt.classList.add("warning_active")
		} else {
			elt.textContent = "标记补给警告"
			elt.classList.remove("warning_active")
		}
	}
}

/**
 * 更新侧边栏面板（手牌数量、牌库数量）。
 */
function update_side_panel() {
	const ap_hand = document.getElementById("ap_hand")
	const cp_hand = document.getElementById("cp_hand")
	if (ap_hand) {
		ap_hand.textContent = view?.ap_hand_count !== undefined ? `手牌 ${view.ap_hand_count}` : ""
	}
	if (cp_hand) {
		cp_hand.textContent = view?.cp_hand_count !== undefined ? `手牌 ${view.cp_hand_count}` : ""
	}

	const ap_deck = document.getElementById("ap_deck_size")
	const cp_deck = document.getElementById("cp_deck_size")
	if (ap_deck) {
		ap_deck.textContent = view?.ap_deck_size !== undefined ? `协约国牌库：${view.ap_deck_size} 张` : ""
	}
	if (cp_deck) {
		cp_deck.textContent = view?.cp_deck_size !== undefined ? `同盟国牌库：${view.cp_deck_size} 张` : ""
	}
}

/**
 * 检查是否可以执行“标记补给警告”操作。
 * @returns {boolean}
 */
function can_flag_supply_warnings() {
	return !!(view?.actions && "flag_supply_warnings" in view.actions)
}

/**
 * 执行“标记补给警告”操作。
 */
function flag_supply_warnings() {
	if (!can_flag_supply_warnings()) {
		return
	}
	send_action("flag_supply_warnings")
}

/**
 * 检查是否可以执行“回滚”操作。
 * @returns {boolean}
 */
function can_propose_rollback() {
	return !!(
		view?.actions &&
		"propose_rollback" in view.actions &&
		Array.isArray(view.rollback) &&
		view.rollback.length > 0
	)
}

/**
 * 显示并初始化回滚提议对话框。
 */
function propose_rollback() {
	if (!can_propose_rollback()) {
		return
	}
	const form = document.getElementById("propose_rollback_form")
	if (!Array.isArray(view?.rollback) || view.rollback.length === 0) {
		return
	}
	form.checkpoint.innerHTML = ""
	for (const i of get_primary_rollback_indices()) {
		const rollback = view.rollback[i]
		const option = document.createElement("option")
		option.value = i
		option.textContent = format_rollback_option_label(rollback, is_latest_rollback_family(i))
		form.checkpoint.add(option, 0)
	}
	const default_index = get_default_rollback_index()
	form.checkpoint.value = String(get_rollback_primary_index(default_index))
	update_rollback_dialog(default_index)
	document.getElementById("propose_rollback_dialog").showModal()
}

function get_rollback_point(index) {
	if (!Array.isArray(view?.rollback) || index < 0 || index >= view.rollback.length) {
		return null
	}
	return view.rollback[index]
}

function is_combat_rollback_point(rollback) {
	return rollback?.kind === "combat"
}

function is_action_round_rollback_point(rollback) {
	return !!(rollback && (rollback.kind === "action_round" || (!rollback.kind && !rollback.turn_start)))
}

function get_rollback_action_key(rollback) {
	if (!rollback) {
		return ""
	}
	return `${rollback.turn}|${rollback.active}|${rollback.action || 1}`
}

function get_primary_rollback_indices() {
	if (!Array.isArray(view?.rollback)) {
		return []
	}
	const indices = []
	for (let i = 0; i < view.rollback.length; i++) {
		if (!is_combat_rollback_point(view.rollback[i])) {
			indices.push(i)
		}
	}
	return indices
}

function get_rollback_primary_index(index) {
	const rollback = get_rollback_point(index)
	if (!is_combat_rollback_point(rollback)) {
		return index
	}
	const action_key = get_rollback_action_key(rollback)
	for (let i = index - 1; i >= 0; i--) {
		const candidate = view.rollback[i]
		if (is_action_round_rollback_point(candidate) && get_rollback_action_key(candidate) === action_key) {
			return i
		}
	}
	return index
}

function get_combat_rollback_indices_for_action(action_index) {
	const action = get_rollback_point(action_index)
	if (!is_action_round_rollback_point(action)) {
		return []
	}
	const action_key = get_rollback_action_key(action)
	const indices = []
	for (let i = action_index + 1; i < view.rollback.length; i++) {
		const rollback = view.rollback[i]
		if (is_combat_rollback_point(rollback) && get_rollback_action_key(rollback) === action_key) {
			indices.push(i)
		}
	}
	return indices.slice(0, 5)
}

function get_latest_rollback_index() {
	return Array.isArray(view?.rollback) && view.rollback.length > 0 ? view.rollback.length - 1 : -1
}

function is_latest_rollback_family(index) {
	const latest = get_latest_rollback_index()
	if (index === latest) {
		return true
	}
	return get_combat_rollback_indices_for_action(index).includes(latest)
}

function format_rollback_option_label(rollback, is_latest = false) {
	let text = rollback.name
	if (is_latest) {
		text += " · 当前"
	}
	return text
}

function get_rollback_space_name(rollback) {
	if (rollback?.space_name) {
		return rollback.space_name
	}
	const space = Number(rollback?.space)
	if (Number.isInteger(space) && spaces[space]?.name) {
		return spaces[space].name
	}
	return rollback?.name || "战斗"
}

function format_rollback_timepoint_label(rollback, is_latest = false) {
	let text
	if (is_combat_rollback_point(rollback)) {
		text = `${get_rollback_space_name(rollback)} 战斗前`
	} else {
		text = "行动轮开始"
	}
	if (is_latest) {
		text += " · 当前"
	}
	return text
}

function update_rollback_timepoint_select(form, preferred_index = null) {
	const group = document.getElementById("rollback_timepoint_group")
	if (!form.timepoint || !group) {
		return Number(form.checkpoint.value)
	}
	const action_index = Number(form.checkpoint.value)
	const combat_indices = get_combat_rollback_indices_for_action(action_index)
	const current_timepoint = Number(form.timepoint.value)
	form.timepoint.innerHTML = ""
	if (combat_indices.length < 2) {
		group.hidden = true
		return action_index
	}

	group.hidden = false
	const choices = [action_index, ...combat_indices]
	const latest = get_latest_rollback_index()
	for (const index of choices) {
		const rollback = get_rollback_point(index)
		const option = document.createElement("option")
		option.value = index
		option.textContent = format_rollback_timepoint_label(rollback, index === latest)
		form.timepoint.add(option)
	}

	let selected = Number.isInteger(preferred_index) && choices.includes(preferred_index)
		? preferred_index
		: current_timepoint
	if (!choices.includes(selected)) {
		selected = action_index
	}
	form.timepoint.value = String(selected)
	return selected
}

function get_selected_rollback_index() {
	const form = document.getElementById("propose_rollback_form")
	const group = document.getElementById("rollback_timepoint_group")
	if (form?.timepoint && group && !group.hidden) {
		return Number(form.timepoint.value)
	}
	return Number(form.checkpoint.value)
}

function is_rollback_dice_record(text) {
	return /[\u2680-\u2685]|\b[WB][1-6]\b|掷骰/.test(String(text || ""))
}

function collect_rollback_events(from_index) {
	const rollback = get_rollback_point(from_index)
	if (!rollback) {
		return []
	}
	const history = get_log_history()
	if (Number.isInteger(rollback.log_index) && Array.isArray(history)) {
		return history
			.slice(rollback.log_index)
			.map((text, offset) => ({
				type: "log",
				text: String(text ?? ""),
				index: rollback.log_index + offset
			}))
			.filter((entry) => is_rollback_dice_record(entry.text))
	}
	const events = []
	for (let i = from_index; i < view.rollback.length; i++) {
		const item_events = view.rollback[i].events || []
		for (const event of item_events) {
			events.push({ type: "text", text: event })
		}
	}
	return events
}

function count_rollback_events(from_index) {
	return collect_rollback_events(from_index).length
}

function get_default_rollback_index() {
	if (!Array.isArray(view?.rollback) || view.rollback.length === 0) {
		return -1
	}
	for (let i = view.rollback.length - 1; i >= 0; i--) {
		if (count_rollback_events(i) > 0) {
			return i
		}
	}
	return view.rollback.length - 1
}

function append_rollback_summary(details, rollback, from_index, event_count) {
	const summary = document.createElement("div")
	summary.className = "rollback_summary"
	summary.textContent =
		event_count > 0
			? `回滚到 ${rollback.name} 将撤销 ${view.rollback.length - from_index} 个检查点中的 ${event_count} 条掷骰记录。`
			: `回滚到 ${rollback.name} 不会撤销任何掷骰记录。`
	details.appendChild(summary)
}

/**
 * 渲染回滚详情内容。
 * @param {HTMLElement} details - 详情容器元素。
 * @param {number} from_index - 起始索引。
 * @param {string} header_text - 头部文本。
 */
function render_rollback_details(details, from_index, header_text) {
	details.innerHTML = ""
	const rollback = get_rollback_point(from_index)
	if (!rollback) {
		return
	}
	const rollback_header = document.createElement("div")
	rollback_header.className = "rollback_header"
	rollback_header.textContent = header_text
	details.appendChild(rollback_header)
	const event_count = count_rollback_events(from_index)
	const events = collect_rollback_events(from_index)
	append_rollback_summary(details, rollback, from_index, event_count)
	if (events.length === 0) {
		const detail = document.createElement("div")
		detail.className = "rollback_empty"
		detail.textContent = "不会撤销任何掷骰"
		details.appendChild(detail)
		return
	}
	const event_list = document.createElement("div")
	event_list.className = "rollback_event_list"
	const saved_box_ap = log_box_ap
	const saved_box_cp = log_box_cp
	log_box_ap = 0
	log_box_cp = 0
	for (const event of events) {
		const detail =
			event.type === "log" ? on_log(event.text, event.index) : document.createElement("div")
		detail.classList.add("rollback_event")
		if (event.type !== "log") {
			detail.innerHTML = on_prompt(event.text)
		}
		event_list.appendChild(detail)
	}
	log_box_ap = saved_box_ap
	log_box_cp = saved_box_cp
	details.appendChild(event_list)
}

/**
 * 更新回滚对话框内容。
 */
function update_rollback_dialog(preferred_index = null) {
	const form = document.getElementById("propose_rollback_form")
	const details = document.getElementById("propose_rollback_details")
	const selected_index = update_rollback_timepoint_select(form, preferred_index)
	render_rollback_details(details, selected_index, "将撤销以下记录：")
}

/**
 * 取消回滚提议。
 * @param {Event} evt - 事件对象。
 */
function propose_rollback_cancel(evt) {
	evt.preventDefault()
	document.getElementById("propose_rollback_dialog").close()
}

/**
 * 提交回滚提议。
 * @param {Event} evt - 事件对象。
 */
function propose_rollback_submit(evt) {
	evt.preventDefault()
	send_action("propose_rollback", get_selected_rollback_index())
	document.getElementById("propose_rollback_dialog").close()
}

/**
 * 显示审查回滚提议对话框。
 */
function review_rollback() {
	if (!view?.rollback_proposal || !Array.isArray(view.rollback)) {
		return
	}
	const details = document.getElementById("review_rollback_details")
	const index = view.rollback_proposal.index
	const rollback = get_rollback_point(index)
	if (!rollback) {
		return
	}
	render_rollback_details(details, index, `回滚到 ${rollback.name} 将撤销：`)
	document.getElementById("review_rollback_dialog").showModal()
}

/**
 * 取消审查回滚提议。
 */
function review_rollback_cancel() {
	document.getElementById("review_rollback_dialog").close()
}

/**
 * 拒绝回滚提议。
 */
function review_rollback_reject() {
	send_action("reject")
	document.getElementById("review_rollback_dialog").close()
}

/**
 * 接受回滚提议。
 */
function review_rollback_accept() {
	send_action("accept")
	document.getElementById("review_rollback_dialog").close()
}

/**
 * 处理服务器回复的消息。
 * @param {string} q - 回复的类型。
 * @param {*} params - 回复的参数。
 */
function on_reply(q, params) {
	if (q === "ap_supply") {
		show_ap_supply(params)
	}
	if (q === "cp_supply") {
		show_cp_supply(params)
	}
	if (q === "ap_cards") {
		show_card_list("ap_card_dialog", params)
	}
	if (q === "cp_cards") {
		show_card_list("cp_card_dialog", params)
	}
}

const bug_report_client_errors = []

window.addEventListener("error", (event) => {
	const item = {
		type: "error",
		time: new Date().toISOString(),
		message: String(event?.message || ""),
		source: String(event?.filename || ""),
		line: Number(event?.lineno || 0),
		column: Number(event?.colno || 0)
	}
	bug_report_client_errors.push(item)
	if (bug_report_client_errors.length > 30) {
		bug_report_client_errors.shift()
	}
})

window.addEventListener("unhandledrejection", (event) => {
	const reason = event?.reason
	const item = {
		type: "unhandledrejection",
		time: new Date().toISOString(),
		message: typeof reason === "string" ? reason : String(reason?.message || reason || "")
	}
	bug_report_client_errors.push(item)
	if (bug_report_client_errors.length > 30) {
		bug_report_client_errors.shift()
	}
})

function get_current_role_for_bug_report() {
	if (document.body.classList.contains("Observer")) {
		return "Observer"
	}
	if (typeof params?.role === "string" && params.role.length > 0) {
		return params.role
	}
	return "unknown"
}

function can_report_bug() {
	return get_current_role_for_bug_report() !== "Observer"
}

function get_bug_report_recent_log_lines() {
	const logNode = document.getElementById("log")
	if (!logNode) {
		return []
	}
	const rows = Array.from(logNode.children)
	return rows
		.slice(Math.max(0, rows.length - 30))
		.map((node) => String(node.textContent || "").replace(/\s+/g, " ").trim())
		.filter(Boolean)
}

function get_bug_report_connection_state() {
	return {
		disconnected: document.querySelector("header")?.classList?.contains("disconnected") ? "yes" : "no",
		prompt_text: String(document.getElementById("prompt")?.textContent || "").replace(/\s+/g, " ").trim(),
		status_text: String(document.getElementById("status")?.textContent || "").replace(/\s+/g, " ").trim(),
		online: navigator.onLine ? "online" : "offline",
		visibility: document.visibilityState || "-"
	}
}

function get_bug_report_view_excerpt() {
	if (typeof view === "undefined" || !view) {
		return {}
	}
	const excerpt = {}
	const keys = ["turn", "action_round", "active", "prompt", "state", "phase", "vp"]
	for (const key of keys) {
		if (key in view) {
			excerpt[key] = view[key]
		}
	}
	if (view.actions && typeof view.actions === "object") {
		excerpt.action_keys = Object.keys(view.actions).slice(0, 120)
	}
	const history = get_log_history()
	if (history.length > 0) {
		excerpt.recent_view_log = history.slice(-8)
	}
	return excerpt
}

function get_bug_report_ui_snapshot() {
	const ids = ["ap_hand", "cp_hand", "ap_deck_size", "cp_deck_size", "violations", "prompt", "status"]
	const snapshot = {}
	for (const id of ids) {
		snapshot[id] = String(document.getElementById(id)?.textContent || "").replace(/\s+/g, " ").trim()
	}
	return snapshot
}

function get_bug_report_actions_snapshot() {
	const actionRoot = document.getElementById("actions")
	if (!actionRoot) {
		return []
	}
	return Array.from(actionRoot.querySelectorAll("button, li, a"))
		.map((node) => {
			if (node.hidden) {
				return null
			}
			if (node.closest("[hidden]")) {
				return null
			}
			if (node.offsetParent === null) {
				return null
			}
			const text = String(node.textContent || "").replace(/\s+/g, " ").trim()
			if (!text) {
				return null
			}
			const disabled = node.classList?.contains("disabled") || node.disabled ? "1" : "0"
			return `${text}[d=${disabled}]`
		})
		.filter(Boolean)
		.slice(0, 120)
}

function map_action_item_for_report(action, item) {
	const id = Number(item)
	if (!Number.isFinite(id)) {
		return String(item)
	}
	if (
		action.includes("space") ||
		action.includes("activate") ||
		action.includes("deactivate")
	) {
		if (spaces[id]) {
			return `${id}:${spaces[id].name}`
		}
	}
	if (
		action.includes("piece") ||
		action === "move" ||
		action === "attack" ||
		action.includes("retreat") ||
		action.includes("advance")
	) {
		if (pieces[id]) {
			return `${id}:${pieces[id].name}`
		}
	}
	if (action === "card") {
		if (cards[id]) {
			return `${id}:${cards[id].name}`
		}
	}
	return String(item)
}

function get_bug_report_action_summary() {
	if (!view?.actions || typeof view.actions !== "object") {
		return {}
	}
	const summary = {}
	for (const action of Object.keys(view.actions)) {
		const value = view.actions[action]
		if (Array.isArray(value)) {
			summary[action] = {
				count: value.length,
				sample: value.slice(0, 10).map((item) => map_action_item_for_report(action, item))
			}
		} else if (value && typeof value === "object") {
			summary[action] = { keys: Object.keys(value).slice(0, 20) }
		} else {
			summary[action] = value
		}
	}
	return summary
}

function set_count(setOrNull) {
	return setOrNull ? setOrNull.size : 0
}

function sample_spaces_from_set(setOrNull, limit = 6) {
	if (!setOrNull) {
		return []
	}
	const out = []
	for (const id of setOrNull) {
		const n = Number(id)
		if (!Number.isFinite(n) || !spaces[n]) continue
		out.push(`${n}:${spaces[n].name}`)
		if (out.length >= limit) break
	}
	return out
}

function sample_pieces_from_set(setOrNull, limit = 6) {
	if (!setOrNull) {
		return []
	}
	const out = []
	for (const id of setOrNull) {
		const n = Number(id)
		if (!Number.isFinite(n) || !pieces[n]) continue
		out.push(`${n}:${pieces[n].name}`)
		if (out.length >= limit) break
	}
	return out
}

function get_bug_report_map_status() {
	const state = ui_frame_state || build_ui_frame_state()
	if (!state) {
		return {}
	}
	return {
		reduced_count: set_count(state.reduced),
		oos_count: set_count(state.oos),
		oos_space_count: set_count(state.oos_spaces),
		supply_warning_count: set_count(state.supply_warnings),
		moved_count: set_count(state.moved),
		attacked_count: set_count(state.attacked),
		activated_move_space_count: set_count(state.activated_move_spaces),
		activated_attack_space_count: set_count(state.activated_attack_spaces),
		action_space_count: set_count(state.action_space),
		action_piece_count: set_count(state.action_piece),
		action_move_piece_count: set_count(state.action_move_piece),
		action_attack_piece_count: set_count(state.action_attack_piece),
		sample_oos_spaces: sample_spaces_from_set(state.oos_spaces),
		sample_supply_warning_spaces: sample_spaces_from_set(state.supply_warnings),
		sample_action_spaces: sample_spaces_from_set(state.action_space),
		sample_action_pieces: sample_pieces_from_set(state.action_piece),
		focus_key: focus_key || "",
		who_single: state.who_single ?? null
	}
}

function get_bug_report_view_metrics() {
	if (typeof view === "undefined" || !view) {
		return {}
	}
	const metrics = {}
	const countKeys = ["log", "actions", "pieces", "spaces", "cards", "activated", "moved", "reduced", "removed", "selected"]
	for (const key of countKeys) {
		const value = view[key]
		if (Array.isArray(value)) {
			metrics[`${key}_count`] = value.length
		} else if (value && typeof value === "object") {
			metrics[`${key}_count`] = Object.keys(value).length
		}
	}
	metrics.view_key_count = Object.keys(view).length
	return metrics
}

function build_bug_report_message(note, includeViewSummary) {
	const lines = []
	lines.push("[BUG_REPORT]")
	lines.push(`time=${new Date().toISOString()}`)
	lines.push(`title=${params.title_id}`)
	lines.push(`game=${params.game_id}`)
	lines.push(`role=${get_current_role_for_bug_report()}`)
	lines.push(`turn=${view?.turn ?? "-"}`)
	lines.push(`round=${view?.action_round ?? "-"}`)
	lines.push(`active=${view?.active ?? "-"}`)
	lines.push(`prompt=${String(view?.prompt || "").replace(/\s+/g, " ").trim() || "-"}`)
	lines.push(`url_full=${window.location.href}`)
	lines.push(`url_path=${window.location.pathname}${window.location.search}`)
	lines.push(`ua=${navigator.userAgent}`)
	lines.push(`screen=${window.innerWidth}x${window.innerHeight}`)
	const connection = get_bug_report_connection_state()
	lines.push(`ws_disconnected=${connection.disconnected}`)
	lines.push(`prompt_text=${connection.prompt_text || "-"}`)
	lines.push(`status_text=${connection.status_text || "-"}`)
	lines.push(`network=${connection.online}`)
	lines.push(`visibility=${connection.visibility}`)
	lines.push("ui_snapshot=" + JSON.stringify(get_bug_report_ui_snapshot()))
	lines.push("map_status=" + JSON.stringify(get_bug_report_map_status()))
	const actionSnapshot = get_bug_report_actions_snapshot()
	if (actionSnapshot.length > 0) {
		lines.push("actions_snapshot=" + actionSnapshot.join(" || "))
	}
	lines.push("action_summary=" + JSON.stringify(get_bug_report_action_summary()))
	const recent = get_bug_report_recent_log_lines()
	if (recent.length > 0) {
		lines.push("recent_log=" + recent.join(" || "))
	}
	if (Array.isArray(view?.violations) && view.violations.length > 0) {
		lines.push("violations=" + view.violations.map((x) => String(x).replace(/\s+/g, " ").trim()).join(" || "))
	}
	if (bug_report_client_errors.length > 0) {
		const errors = bug_report_client_errors.slice(-8).map((x) => JSON.stringify(x))
		lines.push("client_errors=" + errors.join(" || "))
	}
	if (includeViewSummary) {
		lines.push("view_excerpt=" + JSON.stringify(get_bug_report_view_excerpt()))
		lines.push("view_metrics=" + JSON.stringify(get_bug_report_view_metrics()))
	}
	if (note) {
		lines.push("note=" + note.replace(/\s+/g, " ").trim())
	}
	let message = lines.join("\n")
	if (message.length > 12000) {
		message = message.slice(0, 12000)
	}
	return message
}

function build_bug_report_chat_message(fullMessage) {
	if (fullMessage.length <= 3500) {
		return fullMessage
	}
	return fullMessage.slice(0, 3500) + "\n[TRUNCATED_FOR_CHAT]"
}

function sanitize_bug_report_file_part(text) {
	return String(text || "")
		.replace(/[\\/:*?"<>|]/g, "_")
		.replace(/[^\w\u4e00-\u9fa5-]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "")
}

function download_bug_report_file(content) {
	const now = new Date()
	const yyyy = now.getFullYear()
	const mm = String(now.getMonth() + 1).padStart(2, "0")
	const dd = String(now.getDate()).padStart(2, "0")
	const hh = String(now.getHours()).padStart(2, "0")
	const mi = String(now.getMinutes()).padStart(2, "0")
	const ss = String(now.getSeconds()).padStart(2, "0")
	const title_part = sanitize_bug_report_file_part(document.title || params.title_id || "BUG_REPORT")
	const filename = `${title_part}-G${params.game_id}-${yyyy}${mm}${dd}-${hh}${mi}${ss}.txt`
	const blob = new window.Blob([content], { type: "text/plain;charset=utf-8" })
	const href = window.URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = href
	a.download = filename
	document.body.appendChild(a)
	a.click()
	a.remove()
	window.URL.revokeObjectURL(href)
}

function open_bug_report_dialog() {
	if (!can_report_bug()) {
		document.getElementById("prompt").textContent = "观察者模式不支持直接发送问题反馈。"
		return
	}
	const dialog = document.getElementById("bug_report_dialog")
	if (!dialog) {
		return
	}
	const textarea = document.getElementById("bug_report_note")
	if (textarea && !textarea.value) {
		textarea.value = ""
	}
	dialog.showModal()
}

function close_bug_report_dialog(evt) {
	if (evt) evt.preventDefault()
	const dialog = document.getElementById("bug_report_dialog")
	if (dialog) dialog.close()
}

function submit_bug_report(evt) {
	if (evt) evt.preventDefault()
	if (!can_report_bug()) {
		document.getElementById("prompt").textContent = "观察者模式不支持直接发送问题反馈。"
		close_bug_report_dialog()
		return
	}
	const textarea = document.getElementById("bug_report_note")
	const includeViewSummary = !!document.getElementById("bug_report_include_view")?.checked
	const note = textarea ? textarea.value.slice(0, 2000) : ""
	const message = build_bug_report_message(note, includeViewSummary)
	try {
		download_bug_report_file(message)
		const sendToChat = !!document.getElementById("bug_report_send_chat")?.checked
		if (sendToChat && typeof window.send_message === "function") {
			window.send_message("chat", build_bug_report_chat_message(message))
			document.getElementById("prompt").textContent = "问题反馈已下载，并发送到本局聊天。"
		} else {
			document.getElementById("prompt").textContent = "问题反馈文件已下载。"
		}
		if (textarea) textarea.value = ""
	} catch {
		document.getElementById("prompt").textContent = "下载失败，请稍后重试。"
	}
	close_bug_report_dialog()
}

/**
 * 添加审查回滚按钮。
 * @returns {HTMLElement} 回滚按钮元素。
 */
function add_review_rollback_button() {
	let button = document.getElementById("review_rollback_button")
	if (!button) {
		button = document.createElement("button")
		button.id = "review_rollback_button"
		button.textContent = "审查回滚提议"
		button.addEventListener("click", () => {
			review_rollback()
		})
		document.getElementById("actions").append(button)
	}
	return button
}

/**
 * 设置菜单的禁用状态。
 * @param {string} id - 菜单元素的 ID。
 * @param {boolean} disabled - 是否禁用。
 */
function set_menu_disabled(id, disabled) {
	const menu = document.getElementById(id)
	if (!menu) {
		return
	}
	menu.classList.toggle("disabled", disabled)
}

/**
 * 更新工具栏状态。
 */
function update_toolbar_state() {
	set_menu_disabled("propose_rollback_menu", !can_propose_rollback())
	set_menu_disabled("flag_supply_warning_menu", !can_flag_supply_warnings())
	set_menu_disabled("report_bug_menu", !can_report_bug())

	if (view?.rollback_proposal && view.actions && "accept" in view.actions && "reject" in view.actions) {
		add_review_rollback_button()
	} else {
		const button = document.getElementById("review_rollback_button")
		if (button) {
			button.remove()
		}
	}
}

const general_records_stacks = new Array(41).fill(0).map((_, i) => {
	const a = []
	a.name = `GR ${i}`
	return a
})
const turn_track_stacks = new Array(21).fill(0).map((_, i) => {
	const a = []
	a.name = `Turn ${i}`
	return a
})
const ru_revolution_stacks = new Array(5).fill(0).map((_, i) => {
	const a = []
	a.name = i === 0 ? "RU Rev" : `RU Rev${i}`
	return a
})
const lcu_limit_ap_stacks = new Array(4).fill(0).map((_, i) => {
	const a = []
	a.name = i === 0 ? "LCU_limit_AP0" : `LCU_limit_AP${i}`
	return a
})
const lcu_limit_cp_stacks = new Array(4).fill(0).map((_, i) => {
	const a = []
	a.name = i === 0 ? "LCU_limit_CP0" : `LCU_limit_CP${i}`
	return a
})

/**
 * 更新记录标记（如回合轨道上的标记）。
 * @param {Array<Array<Object>>} stacks - 堆栈数组。
 * @param {string} type - 标记类型。
 * @param {number} value - 标记值。
 * @param {number} min - 最小值。
 * @param {number} max - 最大值。
 * @param {boolean} [remove=false] - 是否移除标记。
 */
function update_record_marker(stacks, type, value, min, max, remove = false) {
	let existing_marker = null
	let existing_stack_index = -1
	let existing_item_index = -1

	// 查找现有标记
	for (let i = 0; i < stacks.length; i++) {
		const stack = stacks[i]
		const index = stack.findIndex((m) => m.type === type)
		if (index >= 0) {
			existing_marker = stack[index]
			existing_stack_index = i
			existing_item_index = index
			break
		}
	}

	// 确定是否需要移除
	if (remove || value < min || value > max) {
		if (existing_marker) {
			// 从堆栈中移除
			stacks[existing_stack_index].splice(existing_item_index, 1)
			// 从 DOM 中移除
			if (existing_marker.element) {
				existing_marker.element.remove()
			}
		}
		return
	}

	// 如果标记存在且已在正确的堆栈中，则不执行任何操作
	if (existing_marker && existing_stack_index === value) {
		return
	}

	// 如果标记存在但在错误的堆栈中，则从旧堆栈中移除
	if (existing_marker) {
		stacks[existing_stack_index].splice(existing_item_index, 1)
	} else {
		// 创建新标记
		const info = marker_info[type]
		if (info) {
			existing_marker = { type: type, name: info.name }
			existing_marker.element = document.createElement("div")
			existing_marker.element.marker = existing_marker
			existing_marker.element.className = info.counter
			existing_marker.element.style.width = `${info.size}px`
			existing_marker.element.style.height = `${info.size}px`
			existing_marker.element.my_size = info.size

			ui.markers.appendChild(existing_marker.element)

			// 延迟一小段时间启用过渡，使初始放置是即时的
			setTimeout(() => {
				if (existing_marker && existing_marker.element) {
					existing_marker.element.classList.add("anchored")
				}
			}, 100)
		} else {
			return
		}
	}

	// 添加到新堆栈
	if (stacks[value]) {
		stacks[value].push(existing_marker)
	} else {
		console.warn(`Stack for value ${value} is not defined for type ${type}.`)
	}
}

/**
 * 更新常规记录标记。
 * @param {string} type - 标记类型。
 * @param {number} value - 标记值。
 * @param {boolean} [remove=false] - 是否移除标记。
 */
function update_general_record(type, value, remove = false) {
	update_record_marker(general_records_stacks, type, value, 0, 40, remove)
}

/**
 * 更新回合记录标记。
 * @param {string} type - 标记类型。
 * @param {number} value - 标记值。
 * @param {boolean} [remove=false] - 是否移除标记。
 */
function update_turn_record(type, value, remove = false) {
	update_record_marker(turn_track_stacks, type, value, 1, 20, remove)
}

/**
 * 布局标记堆栈。
 * @param {Array<Array<Object>>} stacks - 堆栈数组。
 * @param {Function} key_fn - 获取布局键的函数。
 */
function layout_marker_stack(stacks, key_fn) {
	stacks.forEach((stack, i) => {
		if (stack.length > 0) {
			const key = key_fn(i)
			if (layout[key]) {
				const [x, y] = layout_center(layout[key])
				if (!stack.elements) {
					stack.elements = []
				}
				stack.elements.length = 0
				for (const marker of stack) {
					stack.elements.push(marker.element)
				}
				stack.elements.name = stack.name
				bind_stack_interaction(stack.elements)
				layout_stack(stack.elements, x, y)
			}
		}
	})
}

/**
 * 更新未完成强制进攻(MO)标记在回合轨上的显示。
 * 在缺失MO的回合格子上渲染 ap_missed_mo/cp_missed_mo 图片。
 */
function update_missed_mo_markers() {
	if (!view) return

	for (const stack of turn_track_stacks) {
		let i = stack.length
		while (i--) {
			if (stack[i].type === "ap_missed_mo" || stack[i].type === "cp_missed_mo") {
				stack.splice(i, 1)
			}
		}
	}

	for (let i = 1; i <= MAX_TURN_TRACK; i++) {
		if (view.missed_mo_ap && view.missed_mo_ap.includes(i)) {
			build_missed_mo_marker(AP, i)
			const marker = missed_mo_ap_markers.find((m) => m.turn === i)
			if (marker) turn_track_stacks[i].push(marker)
		} else {
			destroy_missed_mo_marker(AP, i)
		}
		if (view.missed_mo_cp && view.missed_mo_cp.includes(i)) {
			build_missed_mo_marker(CP, i)
			const marker = missed_mo_cp_markers.find((m) => m.turn === i)
			if (marker) turn_track_stacks[i].push(marker)
		} else {
			destroy_missed_mo_marker(CP, i)
		}
	}
}

/**
 * 更新系统标记（如回合轨道、胜利点、战争状态等）。
 */
function update_system_markers() {
	if (!layout) {
		return
	}

	// 常规记录轨道（VP、战争状态、RPs）
	const vp_info = marker_info["vp"]
	if (vp_info) {
		for (const stack of general_records_stacks) {
			const marker = stack.find((m) => m.type === "vp")
			if (marker && marker.element) {
				marker.element.classList.toggle("blockade", !!view.blockade)
			}
		}
	}
	update_general_record("vp", view.vp)
	update_general_record(
		"cp_auto_victory",
		view.cp_auto_victory_marker,
		view.cp_auto_victory_marker === undefined || view.cp_auto_victory_marker === null
	)
	update_general_record("ap_war_status", view.ws_ap, view.ws_ap === 0)
	update_general_record("cp_war_status", view.ws_cp, view.ws_cp === 0)
	update_general_record("russian_vp", view.russian_vp, view.russian_vp === undefined)
	update_general_record("jihad", view.jihad, view.jihad === undefined)
	update_general_record("combined_war", view.combined_war, view.combined_war === undefined)

	// 确保启用过渡样式
	if (!document.getElementById("marker-transitions")) {
		const style_el = document.createElement("style")
		style_el.id = "marker-transitions"
		style_el.textContent = `
			.anchored { transition: top 0.2s, left 0.2s; }
			.die { font-size: 1.2em; vertical-align: middle; }
			.log .i { white-space: nowrap; }
		`
		document.head.appendChild(style_el)
	}

	if (view.rp) {
		const update_rp = (type, value) => {
			const rp_value = Number(value)
			const show = Number.isFinite(rp_value) && rp_value > 0
			const rp_track_value = Math.floor(rp_value)
			update_general_record(type, rp_track_value, !show)
		}
		update_rp("br_rp", view.rp.br)
		update_rp("in_rp", view.rp.in)
		update_rp("ru_rp", view.rp.ru)
		update_rp("apa_rp", view.rp.apa)
		update_rp("ge_rp", view.rp.ge)
		update_rp("tu_rp", view.rp.tu)
		update_rp("cpa_rp", view.rp.cpa)
	}

	const show_max_tu_rp = typeof view.max_tu_rp === "number" && view.max_tu_rp >= 0 && view.max_tu_rp <= 40
	const max_tu_rp_value = show_max_tu_rp ? Math.floor(view.max_tu_rp) : 0
	update_general_record("max_tu_rp", max_tu_rp_value, !show_max_tu_rp)

	// 回合轨道
	update_turn_record("game_turn", view.turn)
	update_turn_record("sinai_railroad", view.sinai_railroad_turn, view.sinai_railroad_turn === undefined)
	const jerusalem_by_christmas =
		view.events && typeof view.events.jerusalem_by_christmas === "object" ? view.events.jerusalem_by_christmas : null
	const jerusalem_by_christmas_turn = Number(jerusalem_by_christmas?.turn)
	update_turn_record("j_by_c", jerusalem_by_christmas_turn, !Number.isFinite(jerusalem_by_christmas_turn))
	update_turn_record("parvus_to_berlin", view.parvus_to_berlin, view.parvus_to_berlin === undefined)
	update_turn_record(
		"gorlice_tarnow_return",
		view.events.gorlice_tarnow_return,
		view.events.gorlice_tarnow_return === undefined
	)
	update_turn_record(
		"long_live_czar",
		view.long_live_czar,
		view.long_live_czar === undefined || view.long_live_czar === 0
	)
	update_turn_record("revolution_token", view.russian_revolution_timer, view.russian_revolution_timer === undefined)

	// 俄国革命标记轨道
	update_record_marker(
		ru_revolution_stacks,
		"ru_revolution",
		view.ru_revolution,
		0,
		4,
		view.ru_revolution === undefined
	)
	update_record_marker(lcu_limit_ap_stacks, "lcu_limit_ap", view.lcu_limit_ap, 1, 3, view.lcu_limit_ap === undefined)
	update_record_marker(lcu_limit_cp_stacks, "lcu_limit_cp", view.lcu_limit_cp, 1, 3, view.lcu_limit_cp === undefined)

	let ap_key = MO_AP_SPACE[view.mo_ap] || "AP MO None"
	const cp_marker_keys = get_cp_mo_marker_layout_keys(view)
	let cp_key = cp_marker_keys.regular
	let cp_enver_key = cp_marker_keys.enver

	if (view.mo_ap_fulfilled && view.mo_ap !== "none" && view.mo_ap !== "british_no_attack") {
		ap_key = "AP MO Made"
	}

	if (!ap_mo_marker) {
		ap_mo_marker = build_unique_marker("marker ap mandatory_offensive", 75 * SCALE)
		ap_mo_marker.marker = { name: "Mandatory Offensive" }
	}
	if (!cp_mo_marker) {
		cp_mo_marker = build_unique_marker("marker cp mandatory_offensive", 75 * SCALE)
		cp_mo_marker.marker = { name: "Mandatory Offensive" }
	}
	if (!cp_enver_mo_marker) {
		cp_enver_mo_marker = build_unique_marker("marker cp enver_mandatory_offensive", 75 * SCALE)
		cp_enver_mo_marker.marker = { name: "Enver Mandatory Offensive" }
	}
	const ap_rec = layout[ap_key]
	const cp_rec = cp_key ? layout[cp_key] : null
	const cp_enver_rec = layout[cp_enver_key]
	const cp_enver_overlap = !!(cp_rec && cp_enver_rec && cp_key === cp_enver_key && view.mo_cp === "enver")
	if (ap_rec) {
		ap_mo_marker.style.display = "block"
		position_marker_at_layout(ap_mo_marker, ap_rec)
	} else {
		ap_mo_marker.style.display = "none"
	}
	if (cp_rec) {
		cp_mo_marker.style.display = "block"
		position_marker_at_layout_offset(cp_mo_marker, cp_rec, cp_enver_overlap ? -9 * SCALE : 0, cp_enver_overlap ? 7 * SCALE : 0)
		cp_mo_marker.style.zIndex = cp_enver_overlap ? "111" : ""
	} else {
		cp_mo_marker.style.display = "none"
		cp_mo_marker.style.zIndex = ""
	}
	if (cp_enver_rec) {
		cp_enver_mo_marker.style.display = "block"
		position_marker_at_layout_offset(
			cp_enver_mo_marker,
			cp_enver_rec,
			cp_enver_overlap ? 9 * SCALE : 0,
			cp_enver_overlap ? -7 * SCALE : 0
		)
		cp_enver_mo_marker.style.zIndex = cp_enver_overlap ? "110" : ""
	} else {
		cp_enver_mo_marker.style.display = "none"
		cp_enver_mo_marker.style.zIndex = ""
	}

	// AP MO 修正
	if (!ap_mo_modifier_marker) {
		ap_mo_modifier_marker = build_unique_marker("marker mo_modifier", 75 * SCALE)
		ap_mo_modifier_marker.marker = { name: "MO Modifier" }
	}

	const ap_mo_val = Math.max(0, Math.min(4, view.mo_ap_modifier || 0))
	const ap_mo_mod_key = `APMO+${ap_mo_val}`
	const ap_mo_mod_rec = layout[ap_mo_mod_key]
	if (ap_mo_mod_rec) {
		ap_mo_modifier_marker.style.display = "block"
		position_marker_at_layout(ap_mo_modifier_marker, ap_mo_mod_rec)
	} else {
		ap_mo_modifier_marker.style.display = "none"
	}

	// 未完成强制进攻标记
	update_missed_mo_markers()

	// 布局标记堆栈
	layout_marker_stack(general_records_stacks, (i) => `GR ${i}`)
	layout_marker_stack(turn_track_stacks, (i) => `Turn ${i}`)
	layout_marker_stack(ru_revolution_stacks, (i) => (i === 0 ? "RU Rev" : `RU Rev${i}`))
	layout_marker_stack(lcu_limit_ap_stacks, (i) => `LCU_limit_AP${i}`)
	layout_marker_stack(lcu_limit_cp_stacks, (i) => `LCU_limit_CP${i}`)
	update_reserve_beachhead_markers()
}

/**
 * 更新中立国标记显示状态。
 */
function update_neutral_markers() {
	for (const marker of NEUTRAL_UI_MARKERS) {
		apply_neutral_marker_visibility(marker, get_neutral_marker_element(marker))
	}
}

function toggle_operator_details(id) {
	const operator = view?.operators?.[id]
	if (!operator) {
		return
	}
	const label = operator.name || operator.title || operator.label || id
	const detail = operator.description || operator.details || operator.text || ""
	ui.status.textContent = detail ? `${label}: ${detail}` : label
}

function update_operators() {
	if (!view.operators || !layout) {
		return
	}

	ui.operators = ui.operators || {}
	for (const id in view.operators) {
		const operator = view.operators[id]
		let elt = ui.operators[id]
		if (!elt) {
			elt = document.createElement("div")
			elt.className = "operator clickable"
			elt.onclick = () => toggle_operator_details(id)
			ui.markers.appendChild(elt)
			ui.operators[id] = elt
		}

		const rec = layout[operator.space_id]
		if (rec) {
			elt.style.display = "block"
			elt.style.width = `${rec[2]}px`
			elt.style.height = `${rec[3]}px`
			elt.style.backgroundImage = `url("pieces/${operator.sprite}")`
			elt.style.backgroundSize = "contain"
			position_marker_at_layout(elt, rec)
		} else {
			elt.style.display = "none"
		}
	}
}

/**
 * 更新 UI Token 显示（例如塞浦路斯限制标记）。
 */
function update_ui_tokens() {
	if (!view.ui_tokens || !layout) {
		return
	}

	ui.tokens = ui.tokens || {}
	for (const key in view.ui_tokens) {
		const image = view.ui_tokens[key]
		let elt = ui.tokens[key]
		if (!elt) {
			elt = document.createElement("div")
			elt.className = "marker anchored"
			ui.markers.appendChild(elt)
			ui.tokens[key] = elt
		}

		const rec = layout[key]
		if (rec) {
			elt.style.display = "block"
			elt.style.width = `${rec[2]}px`
			elt.style.height = `${rec[3]}px`
			elt.style.backgroundImage = `url("pieces/${image}")`
			elt.style.backgroundSize = "contain"
			position_marker_at_layout(elt, rec)
		} else {
			elt.style.display = "none"
		}
	}
}

/**
 * 操作类型与对应的按钮文本映射。
 * @type {Array<[string, string]>}
 */
const UI_ACTIONS = [
	["assign_t1_mo", "继续"],
	["roll_mo", "掷骰"],
	["confirm", "确认"],
	["acknowledge", "确认"],
	["end_attack", "结束进攻"],
	["end_action", "结束行动轮"],
	["single_op", "自动行动"],
	["roll", "掷骰"],
	["done", "完成"],
	["finish", "结束"],
	["pass", "跳过"],
	["skip", "跳过"],
	["next", "继续"],
	["stop", "停止"],
	["cancel", "取消"],
	["return_cc", "回手"],
	["discard_cc", "弃置"],
	["remove_cc", "移除"],
	["check_supply", "检查补给"],
	["apply_attrition", "执行损耗"],
	["end_war_status", "结束战争状态"],
	["end_replacement", "结束补员"],
	["declare_turkish_retreat", "宣言撤退"],
	["skip_turkish_retreat", "不宣言撤退"],
	["retreat", "撤退"],
	["finish_piece", "完成撤退"],
	["reroll", "重掷"],
	["destroy_fort", "摧毁要塞"],
	["proceed_retreat", "继续撤退"],
	["eliminate_retreating", "消灭撤退部队"],
	["end_advance", "结束挺近"],
	["flank", "尝试侧翼进攻"],
	["no_flank", "不尝试侧翼进攻"],
	["yes", "是"],
	["no", "否"],
	["bombard", "炮击"],
	["activate", "激活"],
	["rebel_egypt", "埃及起义"],
	["rebel_india", "印度兵变"],
	["rebel_afghanistan", "阿富汗起义"],
	["rebel_central_asia", "中亚起义"],
	["convert_ge_to_tu", "德军补员->土军"],
	["convert_br_to_ru", "英军补员->俄军"],
	["choose_enver_russia", "恩维尔：俄国"],
	["choose_enver_british", "恩维尔：英国"],
	["choose_enver_turkey", "恩维尔：土耳其"],
	["fulfill_enver_russia", "俄国"],
	["fulfill_enver_british", "英国"],
	["fulfill_enver_turkey", "土耳其"],
	["choose_mesopotamia", "选择美索不达米亚"],
	["choose_egypt", "选择埃及"],
	["choose_russia", "选择俄国"],
	["lose_vp", "失去 VP"],
	["negate", "取消惩罚"],
	["negate_one", "部分移除 (2 师)"],
	["negate_all", "全部移除 (4 师)"],
	["remove_ru_lcu", "移除俄国 LCU"],
	["invasion", "两栖登陆"],
	["reinforcement", "增援"],
	["accept", "接受"],
	["decline", "拒绝"],
	["remove", "移除单位"],
	["move", "移动"],
	["move_unit", "移动单位"],
	["cannot_retreat", "无法撤退"],
	["decline_retreat", "豁免撤退"],
	["re-activate", "重新激活"],
	["combine", "组合"],
	["entrench", "掘壕"],
	["remove_uprising_marker", "移除起义标志"],
	["select_lcu", "选择 LCU"],
	["select_all", "全选"],
	["clear", "清除"],
	["back", "返回"],
	["cancel_selection", "取消选择"],
	["undo", "撤销"]
]

/**
 * 更新所有操作按钮的状态。
 */
function update_actions() {
	for (const [action, label] of UI_ACTIONS) {
		action_button(action, label)
	}

	action_button("confirm_done_sr", "完成")
}

/**
 * 判断指定空间是否应高亮。
 * @param {number} s - 空间 ID。
 * @returns {boolean} 是否高亮。
 */
function should_highlight_space(s, state = null) {
	if (!view.actions && !state) {
		return false
	}
	if (is_permanently_eliminated_box_space_id(s)) {
		return false
	}
	if (is_reserve_box_space_id(s) && has_clickable_piece_intent_in_space(s, state)) {
		return false
	}
	if (state) {
		return (
			has_loose_id(state.action_space, s) ||
			has_loose_id(state.action_activate_move, s) ||
			has_loose_id(state.action_activate_attack, s) ||
			has_loose_id(state.action_activate_attack_egypt, s) ||
			has_loose_id(state.action_activate_attack_with_br, s) ||
			has_loose_id(state.action_deactivate, s) ||
			has_loose_id(state.action_combine, s) ||
			has_loose_id(state.action_remove_beachhead, s)
		)
	}
	return (
		is_action("space", s) ||
		is_action("activate_move", s) ||
		is_action("activate_attack", s) ||
		is_action("activate_attack_egypt", s) ||
		is_action("activate_attack_with_br", s) ||
		is_action("deactivate", s) ||
		is_action("combine", s) ||
		is_action("remove_beachhead", s)
	)
}

function has_clickable_piece_intent_in_space(space_id, state = null) {
	const source = state || ui_frame_state || build_ui_frame_state()
	const action_sets = [
		source?.action_piece,
		source?.action_move_piece,
		source?.action_attack_piece,
		source?.action_advance_pieces,
		source?.action_retreat_pieces
	]
	for (const ids of action_sets) {
		if (!ids) {
			continue
		}
		for (const id of ids) {
			const p = Number(id)
			const piece = pieces[p]
			if (!piece) {
				continue
			}
			const raw_loc = get_piece_location(p)
			const ui_loc = get_ui_piece_location(piece, raw_loc)
			if (ui_loc === space_id) {
				return true
			}
		}
	}
	return false
}

/**
 * 更新指定空间的高亮、选中和警告状态。
 * @param {number} s - 空间 ID。
 */
function update_space_highlight(s) {
	const space = spaces[s]
	const state = get_active_ui_frame_state()
	if (space && space.element) {
		space.element.classList.toggle("highlight", should_highlight_space(s, state))
		space.element.classList.toggle("selected", state.where_single === s || has_id(state.where_set, s))
		space.element.classList.toggle(
			"warning",
			has_id(state.violations_spaces, s) || has_id(state.supply_warnings, s)
		)
	}
}

function set_piece_image(el, image) {
	if (image && el.current_image !== image) {
		el.style.backgroundImage = `url("pieces/${image}")`
		el.current_image = image
	}
}

function is_action_piece_highlighted(state, piece_id) {
	return (
		has_loose_id(state.action_piece, piece_id) ||
		has_loose_id(state.action_advance_pieces, piece_id) ||
		has_loose_id(state.action_retreat_pieces, piece_id)
	)
}

function create_space_stack_parts() {
	return {
		top_markers: [],
		full_scu: [],
		reduced_scu: [],
		full_lcu: [],
		reduced_lcu: [],
		bottom_markers: [],
		has_oos_unit: false,
		has_limited_supply_unit: false
	}
}

function get_space_marker_list(s) {
	return ui.space_list[s].markers || (ui.space_list[s].markers = [])
}

function get_space_default_control(state, s) {
	return (state.control_defaults && state.control_defaults[s]) || spaces[s].faction || null
}

function get_space_control(state, s) {
	return (state.control && state.control[s]) || get_space_default_control(state, s)
}

function get_control_marker_type(space, state, s) {
	const control = get_space_control(state, s)
	const defaultControl = get_space_default_control(state, s)
	const markerControl = control
	if (!markerControl || markerControl === "neutral") {
		return null
	}
	if (markerControl === AP && has_id(state.ru_control_markers, s)) {
		return "ru_control"
	}
	if (markerControl === defaultControl) {
		return null
	}
	if (markerControl === AP) {
		return "ap_control"
	}
	if (markerControl === CP) {
		return "cp_control"
	}
	return null
}

function has_space_special_marker(space, state, s) {
	const control = get_space_control(state, s)
	const defaultControl = get_space_default_control(state, s)
	return (
		!!(control && control !== defaultControl) ||
		has_id(state.partial_ap_control_markers, s) ||
		has_id(state.partial_cp_control_markers, s) ||
		has_id(state.ru_control_markers, s) ||
		has_id(state.trenches_2, s) ||
		has_id(state.trenches, s) ||
		has_id(state.beachheads, s) ||
		has_id(state.forts_destroyed, s) ||
		has_id(state.forts_besieged, s) ||
		has_id(state.armenian_uprising_markers, s) ||
		has_id(state.persian_uprising_markers, s) ||
		has_id(state.soviet_uprising_markers, s) ||
		has_id(state.jerusalem_by_christmas_markers, s) ||
		has_id(state.catastrophic_attack_oos_markers, s) ||
		has_id(state.activated_move_spaces, s) ||
		has_id(state.activated_attack_spaces, s)
	)
}

function render_space_piece(piece_id, state, stack_parts) {
	const piece = pieces[piece_id]
	if (!piece || !piece.element) {
		return
	}
	const el = piece.element
	const is_reduced = has_id(state.reduced, piece_id)
	const is_selected =
		has_loose_id(state.action_advance_pieces, piece_id) ||
		has_loose_id(state.action_retreat_pieces, piece_id) ||
		has_loose_id(state.action_move_piece, piece_id) ||
		state.who_single === piece_id ||
		has_id(state.who_set, piece_id)
	const is_activated =
		has_loose_id(state.action_attack_piece, piece_id) ||
		has_loose_id(state.action_move_piece, piece_id) ||
		has_id(state.attack_pieces, piece_id) ||
		has_id(state.move_pieces, piece_id)
	const is_oos = has_id(state.oos, piece_id)
	const is_limited_supply = !is_oos && has_id(state.limited_supply, piece_id)
	const is_disrupted_supply = !is_oos && has_id(state.disrupted_supply, piece_id)

	el.classList.remove("offmap")
	el.classList.toggle("reduced", is_reduced)
	el.classList.toggle("highlight", is_action_piece_highlighted(state, piece_id))
	el.classList.toggle("activated", is_activated)
	el.classList.toggle("selected", is_selected)
	el.classList.toggle("limited_supply", is_limited_supply)
	el.classList.toggle("disrupted_supply", is_disrupted_supply)
	el.classList.toggle("entrenching", has_id(state.entrenching, piece_id))
	el.classList.toggle("pending_combine", has_id(state.pending_combine, piece_id))
	el.classList.toggle("spent", has_id(state.moved, piece_id) || has_id(state.attacked, piece_id))
	set_piece_image(el, is_reduced ? piece.image_reduced : piece.image_full)

	if (is_oos) {
		stack_parts.has_oos_unit = true
	}
	if (is_limited_supply) {
		stack_parts.has_limited_supply_unit = true
	}
	if (piece.piece_class === "LCU") {
		;(is_reduced ? stack_parts.reduced_lcu : stack_parts.full_lcu).push(el)
		return
	}
	if (piece.piece_class === "SCU") {
		;(is_reduced ? stack_parts.reduced_scu : stack_parts.full_scu).push(el)
		return
	}
	stack_parts.bottom_markers.push(el)
}

function render_space_pieces(pieces_in_this_space, state, stack_parts) {
	if (!pieces_in_this_space || pieces_in_this_space.length === 0) {
		return
	}
	for (const piece_id of pieces_in_this_space) {
		render_space_piece(piece_id, state, stack_parts)
	}
}

function get_space_activation_marker_count(s) {
	if (!view.activation_cost) {
		return 1
	}
	return Math.max(1, view_map_get(view.activation_cost, s, 1))
}

function sync_activation_markers(s, type, count, stack_parts) {
	const marker_list = get_space_marker_list(s)
	destroy_markers(marker_list, (marker) => {
		return (marker.type === "move" || marker.type === "attack") && (marker.type !== type || marker.ix >= count)
	})
	for (let i = 0; i < count; i++) {
		stack_parts.top_markers.push(build_activation_marker(s, type, i))
	}
}

function render_space_markers(space, state, s, stack_parts) {
	sync_control_marker(s, get_control_marker_type(space, state, s), stack_parts)

	const trench_level = has_id(state.trenches_2, s) ? 2 : has_id(state.trenches, s) ? 1 : 0
	if (trench_level > 0) {
		const trench_owner = view_map_get(state.trench_owner, s, get_space_control(state, s) || CP)
		stack_parts.bottom_markers.push(build_trench_marker(s, trench_level, trench_owner))
	} else {
		destroy_trench_marker(s)
	}

	if (has_id(state.beachheads, s)) {
		stack_parts.bottom_markers.push(build_beachhead_marker(s))
	} else {
		destroy_beachhead_marker(s)
	}

	if (has_id(state.forts_destroyed, s)) {
		stack_parts.bottom_markers.push(build_fort_destroyed_marker(s))
	} else {
		destroy_fort_destroyed_marker(s)
	}

	if (has_id(state.forts_besieged, s)) {
		stack_parts.bottom_markers.push(build_space_marker(s, "besieged", marker_info.besieged))
	} else {
		destroy_space_marker(s, "besieged")
	}

	if (has_id(state.persian_uprising_markers, s)) {
		stack_parts.bottom_markers.push(build_persian_uprising_marker(s))
	} else {
		destroy_persian_uprising_marker(s)
	}

	if (has_id(state.armenian_uprising_markers, s)) {
		stack_parts.bottom_markers.push(build_armenian_uprising_marker(s))
	} else {
		destroy_armenian_uprising_marker(s)
	}

	if (has_id(state.soviet_uprising_markers, s)) {
		stack_parts.bottom_markers.push(build_soviet_uprising_marker(s))
	} else {
		destroy_soviet_uprising_marker(s)
	}

	if (has_id(state.jerusalem_by_christmas_markers, s)) {
		stack_parts.bottom_markers.push(build_jerusalem_by_christmas_marker(s))
	} else {
		destroy_jerusalem_by_christmas_marker(s)
	}

	if (view.activated) {
		if (has_id(state.activated_move_spaces, s)) {
			const count = get_space_activation_marker_count(s)
			sync_activation_markers(s, "move", count, stack_parts)
		} else if (has_id(state.activated_attack_spaces, s)) {
			const count = get_space_activation_marker_count(s)
			sync_activation_markers(s, "attack", count, stack_parts)
		} else {
			destroy_activation_markers(s)
		}
	} else {
		destroy_activation_markers(s)
	}

	if (stack_parts.has_oos_unit) {
		stack_parts.top_markers.push(build_oos_marker(s))
	} else {
		destroy_oos_marker(s)
	}

	if (has_id(state.catastrophic_attack_oos_markers, s)) {
		stack_parts.top_markers.push(build_catastrophic_attack_oos_marker(s))
	} else {
		destroy_catastrophic_attack_oos_marker(s)
	}

	if (stack_parts.has_limited_supply_unit) {
		stack_parts.top_markers.push(build_limited_supply_marker(s))
	} else {
		destroy_limited_supply_marker(s)
	}
}

function populate_space_stack(stack, s, stack_parts) {
	stack.length = 0
	const stack_groups = [
		stack_parts.top_markers,
		stack_parts.full_scu,
		stack_parts.reduced_scu,
		stack_parts.full_lcu,
		stack_parts.reduced_lcu,
		stack_parts.bottom_markers
	]
	for (const group of stack_groups) {
		for (const el of group) {
			push_stack(stack, el)
		}
	}
	for (const el of stack) {
		el.dataset.space = String(s)
	}
}

function get_space_stack_center(space) {
	const rect = layout[space.name]
	if (rect) {
		return [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2]
	}
	return [
		parseFloat(space.element.style.left) + parseFloat(space.element.style.width) / 2,
		parseFloat(space.element.style.top) + parseFloat(space.element.style.height) / 2
	]
}

function layout_space_stack(space, stack) {
	const [x, y] = get_space_stack_center(space)
	layout_stack(stack, x, y)
}

function update_space(s, pieces_in_this_space) {
	const space = spaces[s]
	const state = get_active_ui_frame_state()
	if (!space || !space.element) {
		return
	}
	if (!space.stack) {
		space.stack = []
		space.stack.name = space.name
	}

	const stack = space.stack
	stack.space_id = s
	const has_pieces = !!(pieces_in_this_space && pieces_in_this_space.length > 0)
	const has_special_marker = has_space_special_marker(space, state, s)
	const marker_list = ui.space_list[s] && ui.space_list[s].markers
	const has_existing_markers = !!(marker_list && marker_list.length > 0)

	if (stack.length === 0 && is_stack_focused(stack)) {
		focus_key = null
		focus_is_reinforcement_board = false
		hide_focus_box()
	}

	if (!has_pieces && !has_special_marker && !has_existing_markers && stack.length === 0) {
		update_space_highlight(s)
		return
	}

	const stack_parts = create_space_stack_parts()
	render_space_pieces(pieces_in_this_space, state, stack_parts)
	render_space_markers(space, state, s, stack_parts)
	populate_space_stack(stack, s, stack_parts)
	layout_space_stack(space, stack)
	update_space_highlight(s)
}

/**
 * 获取预备盒中单位所属的国家/堆栈。
 * @param {Object} piece - 单位对象。
 * @returns {string} 国家代码或 MINOR。
 */
function get_reserve_box_stack(piece, order) {
	const nation = piece.nation
	if (order.includes(nation)) {
		return nation
	}
	return get_box_fallback_group(order)
}

function compute_group_centers(rec, count, opts = {}) {
	if (!rec || count <= 0) {
		return []
	}
	const cx = rec[0] + rec[2] / 2
	const cy = rec[1] + rec[3] / 2
	const w = Math.max(1, rec[2])
	const h = Math.max(1, rec[3])
	const min_stride_x = opts.min_stride_x ?? 56
	const min_stride_y = opts.min_stride_y ?? 72
	const max_stride_x = opts.max_stride_x ?? 90
	const max_stride_y = opts.max_stride_y ?? 96
	const margin_x = opts.margin_x ?? 20
	const margin_y = opts.margin_y ?? 20
	const usable_w = Math.max(1, w - margin_x * 2)
	const usable_h = Math.max(1, h - margin_y * 2)

	const max_cols_by_width = Math.max(1, Math.floor(usable_w / min_stride_x) + 1)
	let cols = Math.min(count, max_cols_by_width)
	let rows = Math.ceil(count / cols)
	const max_rows_by_height = Math.max(1, Math.floor(usable_h / min_stride_y) + 1)

	while (rows > max_rows_by_height && cols < count) {
		cols += 1
		rows = Math.ceil(count / cols)
	}

	let stride_x = cols > 1 ? usable_w / (cols - 1) : 0
	let stride_y = rows > 1 ? usable_h / (rows - 1) : 0
	stride_x = Math.min(max_stride_x, Math.max(min_stride_x, stride_x))
	stride_y = Math.min(max_stride_y, Math.max(min_stride_y, stride_y))

	const x0 = cx - ((cols - 1) * stride_x) / 2
	const y0 = cy - ((rows - 1) * stride_y) / 2
	const result = []
	for (let i = 0; i < count; ++i) {
		const col = i % cols
		const row = Math.floor(i / cols)
		result.push([x0 + col * stride_x, y0 + row * stride_y])
	}
	return result
}

function normalize_box_anchor_token(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
}

function find_box_anchor_point(space, group, piece_class = null) {
	if (!space || !space.name || !group) {
		return null
	}
	// BOX 专用锚点使用 ui.csv 中的 box_* 项。
	// 这些锚点的 x/y 由制图时按“算子中心点”录入，所以这里必须转成 layout_center(rec)。
	// 注意：这只是 BOX 内堆叠的局部规则，不代表整个 ui.csv 都是中心点语义。
	const base = ["box", normalize_box_anchor_token(space.name), normalize_box_anchor_token(group)].join("_")
	const keys = []
	if (piece_class) {
		keys.push(`${base}_${normalize_box_anchor_token(piece_class)}`)
	}
	keys.push(base)
	for (const key of keys) {
		const rec = layout[key]
		if (rec) {
			return layout_center(rec)
		}
	}
	return null
}

function apply_box_anchor_overrides(default_centers, order, space) {
	const centers = default_centers.slice()
	for (let i = 0; i < order.length; ++i) {
		const anchor = find_box_anchor_point(space, order[i])
		if (anchor) {
			centers[i] = anchor
		}
	}
	return centers
}

function get_stack_piece_class(stack) {
	if (!Array.isArray(stack)) {
		return null
	}
	for (const el of stack) {
		if (el && typeof el.piece === "number") {
			return pieces[el.piece]?.piece_class || null
		}
	}
	return null
}

/**
 * 获取消灭盒中单位所属的分组。
 * @param {Object} piece - 单位对象。
 * @returns {string} 国家代码或 OTHER。
 */
function get_eliminated_box_group(piece, order) {
	const nation = piece.nation
	if (order.includes(nation)) {
		return nation
	}
	return get_box_fallback_group(order)
}

function apply_box_piece_interaction_state(el, state, piece_id, interactive = true) {
	el.classList.toggle("highlight", interactive && is_action_piece_highlighted(state, piece_id))
	el.classList.toggle("selected", interactive && (state.who_single === piece_id || has_id(state.who_set, piece_id)))
	el.classList.remove("activated")
	el.classList.remove("spent")
	el.classList.remove("limited_supply")
	el.classList.remove("disrupted_supply")
	el.classList.remove("entrenching")
	el.classList.remove("pending_combine")
	el.style.pointerEvents = interactive ? "" : "none"
}

function has_clickable_piece_action(state, piece_id) {
	return is_action_piece_highlighted(state, piece_id)
}

function has_clickable_piece_action_in_stack(state, stack) {
	return stack.some((el) => typeof el.piece === "number" && has_clickable_piece_action(state, el.piece))
}

function render_grouped_box_space(space_id, piece_ids, options) {
	if (!(space_id > 0) || !spaces[space_id] || !spaces[space_id].element) {
		return
	}
	const state = get_active_ui_frame_state()
	const space = spaces[space_id]
	const order = options.get_order(space_id, space)
	if (!space.stacks) {
		space.stacks = {}
	}
	options.reset_groups(space, order)
	for (const piece_id of piece_ids) {
		const piece = pieces[piece_id]
		if (!piece || !piece.element) {
			continue
		}
		options.place_piece({
			space_id,
			space,
			state,
			order,
			piece_id,
			piece,
			element: piece.element
		})
	}
	const rec = get_layout_rect(space)
	const fallback_center = rec ? layout_center(rec) : [0, 0]
	const centers = options.get_centers(rec, order, space, space_id)
	for (let i = 0; i < order.length; ++i) {
		options.layout_group({
			space_id,
			space,
			state,
			order,
			group: order[i],
			index: i,
			center: centers[i] || fallback_center
		})
	}
	update_space_highlight(space_id)
}

function get_reserve_box_order(space_id, space) {
	const is_ap_box = space_id === AP_RESERVE_BOX || space_id === AP_CORPS_ASSETS_BOX
	const is_cp_box = space_id === CP_RESERVE_BOX || space_id === CP_CORPS_ASSETS_BOX
	if (!is_ap_box && !is_cp_box && (space.type === "Reserve Box" || space.map === "Reserve Box") && space.nation) {
		return [space.nation]
	}
	return is_ap_box ? ap_reserve_box_order : cp_reserve_box_order
}

function reset_reserve_box_groups(space, order) {
	for (const nation of order) {
		if (!Array.isArray(space.stacks[nation])) {
			space.stacks[nation] = []
		} else {
			space.stacks[nation].length = 0
		}
	}
}

function place_reserve_box_piece({ space, state, order, piece_id, piece, element }) {
	const is_reduced = has_id(state.reduced, piece_id)
	let nation = get_reserve_box_stack(piece, order)
	if (order.length === 1) {
		nation = order[0]
	}
	element.classList.remove("offmap")
	element.classList.toggle("reduced", is_reduced)
	apply_box_piece_interaction_state(element, state, piece_id)
	set_piece_image(element, is_reduced ? piece.image_reduced : piece.image_full)
	const bucket = space.stacks[nation]
	if (!bucket) {
		return
	}
	if (piece.piece_class === "SCU") {
		unshift_stack(bucket, element)
	} else {
		push_stack(bucket, element)
	}
}

function get_reserve_box_centers(rec, order, space, space_id) {
	const is_ap_box = space_id === AP_RESERVE_BOX || space_id === AP_CORPS_ASSETS_BOX
	const is_cp_box = space_id === CP_RESERVE_BOX || space_id === CP_CORPS_ASSETS_BOX
	const is_custom_reserve = !is_ap_box && !is_cp_box && (space.type === "Reserve Box" || space.map === "Reserve Box")
	if (is_custom_reserve) {
		return [find_box_anchor_point(space, order[0]) || [...(rec ? layout_center(rec) : [0, 0])]]
	}
	// 常规 Reserve/Corps Assets 先按原算法自动分组，再按 box_* 锚点做局部覆盖。
	return apply_box_anchor_overrides(
		compute_group_centers(rec, order.length, {
			min_stride_x: 56,
			min_stride_y: 72,
			max_stride_x: 78,
			max_stride_y: 92,
			margin_x: 18,
			margin_y: 24
		}),
		order,
		space
	)
}

function layout_reserve_box_group({ space_id, space, group, center }) {
	const stack = space.stacks[group]
	if (!stack || stack.length === 0) {
		return
	}
	const piece_class = get_stack_piece_class(stack)
	const [x, y] = find_box_anchor_point(space, group, piece_class) || center
	stack.x = x
	stack.y = y
	stack.side = space_id === AP_RESERVE_BOX || space_id === AP_CORPS_ASSETS_BOX ? AP : CP
	stack.is_reinforcement = true
	stack.name = `reserve:${space.name}:${group}`
	bind_stack_interaction(stack)
	layout_stack(stack, x, y)
}

function update_reserve_box(space_id, piece_ids) {
	render_grouped_box_space(space_id, piece_ids, {
		get_order: get_reserve_box_order,
		reset_groups: reset_reserve_box_groups,
		place_piece: place_reserve_box_piece,
		get_centers: get_reserve_box_centers,
		layout_group: layout_reserve_box_group
	})
}

/**
 * 更新被消灭单位盒的状态。
 * @param {number} space_id - 空间的索引。
 * @param {number[]} piece_ids - 盒中的单位 ID 数组。
 */
function update_eliminated_box(space_id, piece_ids) {
	render_grouped_box_space(space_id, piece_ids, {
		get_order: (id) => get_eliminated_box_order(id),
		reset_groups: (space, order) => {
			for (const group of order) {
				if (!space.stacks[group] || Array.isArray(space.stacks[group])) {
					space.stacks[group] = { lcus: [], scus: [] }
				}
				space.stacks[group].lcus.length = 0
				space.stacks[group].scus.length = 0
			}
		},
		place_piece: ({ space_id, space, state, order, piece_id, piece, element }) => {
			const is_permanently_eliminated_box = is_permanently_eliminated_box_space_id(space_id)
			const is_clickable_pe_piece = is_permanently_eliminated_box && has_clickable_piece_action(state, piece_id)
			element.my_stack = null
			element.classList.remove("offmap")
			element.classList.remove("reduced")
			apply_box_piece_interaction_state(element, state, piece_id, !is_permanently_eliminated_box || is_clickable_pe_piece)
			set_piece_image(element, piece.image_full)
			const group = get_eliminated_box_group(piece, order)
			if (!space.stacks[group]) {
				space.stacks[group] = { lcus: [], scus: [] }
			}
			const bucket = piece.piece_class === "LCU" ? space.stacks[group].lcus : space.stacks[group].scus
			unshift_stack(bucket, element)
		},
		get_centers: (rec, order, space) =>
			apply_box_anchor_overrides(
				compute_group_centers(rec, order.length, {
					min_stride_x: 52,
					min_stride_y: 90,
					max_stride_x: 76,
					max_stride_y: 120,
					margin_x: 18,
					margin_y: 20
				}),
				order,
				space
			),
		layout_group: ({ space_id, space, state, group, center }) => {
			const is_permanently_eliminated_box = is_permanently_eliminated_box_space_id(space_id)
			const side = get_eliminated_box_side(space_id)
			// Eliminated 允许更细的 box_*_lcu / box_*_scu 锚点。
			// 若未提供分类锚点，则回退到该国家组中心点上下分行的旧布局逻辑。
			const [gx, gy] = find_box_anchor_point(space, group) || center
			const class_row_offset = 22
			const lcu_stack = space.stacks[group].lcus
			const scu_stack = space.stacks[group].scus
			if (lcu_stack.length > 0) {
				const [x, y] = find_box_anchor_point(space, group, "lcu") || [gx, gy - class_row_offset]
				lcu_stack.x = x
				lcu_stack.y = y
				lcu_stack.side = side
				lcu_stack.is_reinforcement = true
				lcu_stack.name = `eliminated:${space.name}:${group}:lcu`
				if (!is_permanently_eliminated_box || has_clickable_piece_action_in_stack(state, lcu_stack)) {
					bind_stack_interaction(lcu_stack)
				}
				layout_stack(lcu_stack, x, y)
			}
			if (scu_stack.length > 0) {
				const [x, y] = find_box_anchor_point(space, group, "scu") || [gx, gy + class_row_offset]
				scu_stack.x = x
				scu_stack.y = y
				scu_stack.side = side
				scu_stack.is_reinforcement = true
				scu_stack.name = `eliminated:${space.name}:${group}:scu`
				if (!is_permanently_eliminated_box || has_clickable_piece_action_in_stack(state, scu_stack)) {
					bind_stack_interaction(scu_stack)
				}
				layout_stack(scu_stack, x, y)
			}
		}
	})
}

/**
 * 构建卡牌元素并初始化。
 * @param {number} id - 卡牌 ID。
 */
function build_card(id) {
	const card = cards[id]
	if (!card) {
		return
	}
	const el = (card.element = document.createElement("div"))
	el.card = id
	el.dataset.cardId = String(id)
	el.className = `card ${card.faction} ${card_class_name(id)}`
	el.style.backgroundImage = card_image_url(card)
	el.addEventListener("click", on_click_card)
}

/**
 * 更新卡牌状态（是否启用、高亮）。
 * @param {number} id - 卡牌 ID。
 */
function update_card(id) {
	const card = cards[id]
	if (!card || !card.element) {
		return
	}
	const el = card.element
	el.classList.toggle("enabled", is_card_enabled(id))
	el.classList.toggle("highlight", is_action("card", id) || is_action("play_event", id) || is_action("play_cc", id))
}

/**
 * 获取手牌中的战斗卡。
 * @returns {number[]} 战斗卡 ID 数组。
 */
/**
 * 展平战斗卡分组。
 * @param {Object} groups - 包含 attacker 和 defender 数组的对象。
 * @returns {number[]} 合并后的卡牌 ID 数组。
 */
function flatten_combat_card_groups(groups) {
	if (!groups) {
		return []
	}
	const merged = []
	if (Array.isArray(groups.attacker)) {
		merged.push(...groups.attacker)
	}
	if (Array.isArray(groups.defender)) {
		merged.push(...groups.defender)
	}
	if (Array.isArray(groups.ap)) {
		merged.push(...groups.ap)
	}
	if (Array.isArray(groups.cp)) {
		merged.push(...groups.cp)
	}
	return merged
}

/**
 * 去除重复卡牌。
 * @param {number[]} list - 卡牌 ID 数组。
 * @returns {number[]} 去重后的卡牌 ID 数组。
 */
function unique_cards(list) {
	const seen = new Set()
	const unique = []
	for (const c of list || []) {
		if (seen.has(c)) {
			continue
		}
		seen.add(c)
		unique.push(c)
	}
	return unique
}

/**
 * 更新卡牌区域（手牌、战斗卡、已保留卡）。
 */
/**
 * 更新卡牌区域（手牌、战斗区、保留区）。
 */
function update_card_zones() {
	if (!ui.cards) {
		return
	}

	ui.cards.replaceChildren()
	if (view.hand) {
		for (const id of view.hand) {
			update_card(id)
			if (!cards[id] || !cards[id].element) {
				continue
			}
			ui.cards.appendChild(cards[id].element)
		}
	}

	if (!ui.combat_cards || !ui.unused_combat_cards || !ui.active_cards || !ui.cc_list || !ui.active_card_zone) {
		return
	}

	ui.combat_cards.replaceChildren()
	ui.unused_combat_cards.replaceChildren()
	ui.active_cards.replaceChildren()

	let show_ccs = false
	let show_active_cards = false
	const retained_cards = unique_cards(flatten_combat_card_groups(view.cc_retained))

	if (view.attack) {
		show_ccs = true
		const played_cards = unique_cards(flatten_combat_card_groups(view.combat_cards))
		const used = new Set(played_cards)

		for (const id of played_cards) {
			update_card(id)
			if (cards[id]?.element) {
				ui.combat_cards.appendChild(cards[id].element)
			}
		}
		for (const id of retained_cards) {
			if (!used.has(id)) {
				update_card(id)
				if (cards[id]?.element) {
					ui.unused_combat_cards.appendChild(cards[id].element)
				}
			}
		}
	} else if (retained_cards.length > 0) {
		show_active_cards = true
		for (const id of retained_cards) {
			update_card(id)
			if (cards[id]?.element) {
				ui.active_cards.appendChild(cards[id].element)
			}
		}
	}

	ui.cc_list.classList.toggle("hide", !show_ccs)
	ui.active_card_zone.classList.toggle("hide", !show_active_cards)
}

/**
 * 点击空间的交互逻辑。
 * @param {MouseEvent} evt - 点击事件对象。
 * @param {number} s - 空间 ID。
 */
function on_click_space(evt, s) {
	if (evt.button === 0) {
		const perf_id = begin_interaction_perf("click_space", evt, { space: s })
		if (apply_space_click_intent(evt, s, perf_id, "click_space")) {
			end_interaction_perf(perf_id, "click_space.done")
			return
		}
		if (spaces[s].stack) {
			focus_stack(spaces[s].stack)
			mark_interaction_perf(perf_id, "click_space.focus_only")
			evt.stopPropagation()
		}
		end_interaction_perf(perf_id, "click_space.done")
	} else if (evt.button === 2) {
		if (is_action("deactivate", s)) {
			send_action("deactivate", s)
		}
	}
}

/**
 * 点击单位的交互逻辑。
 * @param {Event} e - 点击事件对象。
 * @param {number} p - 单位的索引。
 */
function on_click_piece(e, p) {
	if (e.button === 0) {
		const perf_id = begin_interaction_perf("click_piece", e, { piece: p })
		const piece = pieces[p]
		const el = piece && piece.element
		let stack = el ? el.my_stack : null

		if (!stack) {
			const raw_loc = get_piece_location(p)
			const ui_loc = get_ui_piece_location(piece, raw_loc)
			const s = spaces[ui_loc]
			if (s) {
				if (s.stack) {
					stack = s.stack
				} else if (s.stacks) {
					for (const nation in s.stacks) {
						const nation_stack = s.stacks[nation]
						if (nation_stack.some((elt) => elt.piece === p)) {
							stack = nation_stack
							break
						}
					}
				}
			}
		}

		const is_focused = stack ? is_stack_focused(stack) : false

		hide_supply()
		e.stopPropagation()
		const raw_loc = get_piece_location(p)
		const ui_loc = get_ui_piece_location(piece, raw_loc)
		const piece_click = get_piece_click_dispatch(p)
		if (is_permanently_eliminated_box_space_id(ui_loc) && !piece_click) {
			end_interaction_perf(perf_id, "click_piece.removed_box")
			return
		}
		const is_reserve_box_loc = is_reserve_box_space_id(ui_loc)
		const has_space_intent = has_direct_space_intent(ui_loc)

		if (stack && !is_focused && !is_small_stack(stack)) {
			if (is_reserve_box_loc) {
				focus_stack(stack)
				end_interaction_perf(perf_id, "click_piece.focus_only")
				return
			}
			if (has_space_intent) {
				const handled = apply_space_click_intent(e, ui_loc, perf_id, "click_piece.space")
				if (handled) {
					end_interaction_perf(perf_id, "click_piece.done")
					return
				}
			}
			focus_stack(stack)
			end_interaction_perf(perf_id, "click_piece.focus_only")
			return
		}

		if (piece_click) {
			end_interaction_perf(perf_id, "click_piece.sent_action", {
				action: piece_click.action,
				source: piece_click.source
			})
			return send_action(piece_click.action, piece_click.noun)
		}
		if (has_space_intent && !is_reserve_box_loc) {
			const handled = apply_space_click_intent(e, ui_loc, perf_id, "click_piece.space")
			if (handled) {
				end_interaction_perf(perf_id, "click_piece.done")
				return
			}
		}
		end_interaction_perf(perf_id, "click_piece.done")
	}
}

function on_reinforcements_background_mouse_down(evt) {
	if (evt.button !== 0) {
		return
	}
	const target = evt.target
	if (target && target.closest && target.closest(".piece, .marker, .space")) {
		return
	}
	hide_supply()
	blur_stack()
}

const map = document.getElementById("map")
if (map) {
	map.addEventListener("contextmenu", (e) => e.preventDefault())
	map.addEventListener("pointerover", update_neutral_marker_peek)
	map.addEventListener("pointermove", update_neutral_marker_peek)
	map.addEventListener("pointerleave", clear_neutral_marker_peek)
	map.addEventListener("click", (evt) => {
		if (evt.button === 0 && evt.target === map) {
			blur_stack()
			hide_supply()
		}
	})
}

const reinforcements_container = document.getElementById("reinforcements")
if (reinforcements_container) {
	reinforcements_container.addEventListener("mousedown", on_reinforcements_background_mouse_down)
}

// CARD MENU

/**
 * 确保弹出菜单元素存在并具有指定内容。
 * @param {string} id - 菜单元素的 ID。
 * @param {string} html - 菜单内容的 HTML 字符串。
 * @returns {HTMLElement} 菜单元素。
 */
function ensure_popup(id, html) {
	let el = document.getElementById(id)
	if (!el) {
		el = document.createElement("menu")
		el.id = id
		el.hidden = true
		el.innerHTML = html
		document.body.appendChild(el)
	} else if (!el.querySelector("li[data-action]")) {
		// If exists but empty (or no actions), update it
		el.innerHTML = html
	}
	return el
}

ensure_popup(
	"card_popup",
	`
	<li class="title">CARD
	<li class="separator">
	<li data-action="play_event"> Play Event
	<li data-action="play_ops"> Play for Operations
	<li data-action="play_sr"> Strategic Redeployment
	<li data-action="play_rps"> Replacement Points
`
)

ensure_popup(
	"activation_popup",
	`
	<li class="title">ACTIVATE
	<li class="separator">
	<li data-action="activate_move"> Activate to Move
	<li data-action="activate_attack"> Activate to Attack
	<li data-action="activate_attack_with_br"> Attack with BR (+1 VP)
	<li data-action="deactivate"> Deactivate
`
)

const card_action_menu = Array.from(document.getElementById("card_popup").querySelectorAll("li[data-action]")).map(
	(e) => e.dataset.action
)
const activation_action_menu = Array.from(
	document.getElementById("activation_popup").querySelectorAll("li[data-action]")
).map((e) => e.dataset.action)

const MAP_SPACE_CLICK_ACTIONS = new Set([
	"activate_move",
	"activate_attack",
	"activate_attack_egypt",
	"activate_attack_with_br",
	"deactivate",
	"combine",
	"remove_beachhead"
])

function is_map_space_click_action(action) {
	return MAP_SPACE_CLICK_ACTIONS.has(action)
}

/**
 * 统一空间点击意图判定，确保“可执行动作”优先于“展开堆叠”。
 * 这用于处理激活阶段、移动落点阶段等需要直接执行空间语义的场景。
 * @param {number} s - 空间 ID。
 * @returns {{type:string, action?:string, hide?:string}}
 */
function get_space_click_intent(s) {
	if (!view.actions) {
		return { type: "none" }
	}
	if (is_reserve_box_space_id(s) && has_clickable_piece_intent_in_space(s)) {
		return { type: "none" }
	}
	if (get_action_noun("space", s) !== undefined) {
		return { type: "send_space" }
	}
	const can_continue_region_attack =
		Array.isArray(view.activated?.attack) &&
		view.activated.attack.includes(s) &&
		is_action("activate_attack", s)
	if (can_continue_region_attack) {
		return { type: "send_action", action: "activate_attack" }
	}
	const can_continue_region_move =
		Array.isArray(view.activated?.move) &&
		view.activated.move.includes(s) &&
		is_action("activate_move", s)
	if (can_continue_region_move) {
		return { type: "send_action", action: "activate_move" }
	}
	for (let action in view.actions) {
		if (!is_map_space_click_action(action)) {
			continue
		}
		if (activation_action_menu.includes(action)) {
			continue
		}
		if (get_action_noun(action, s) === undefined) {
			continue
		}
		return { type: "send_action", action }
	}
	const has_activation_options = activation_action_menu.some((action) => is_action(action, s))
	if (has_activation_options) {
		return { type: "show_activation_popup" }
	}
	return { type: "none" }
}

/**
 * 判断当前空间是否存在可直接执行的点击意图。
 * @param {number} s - 空间 ID。
 * @returns {boolean}
 */
function has_direct_space_intent(s) {
	return get_space_click_intent(s).type !== "none"
}

/**
 * 应用空间点击意图（发动作 / 弹激活菜单）。
 * 返回 true 表示已经处理点击事件，调用方可直接结束流程。
 * @param {MouseEvent|Event} evt - 触发事件。
 * @param {number} s - 空间 ID。
 * @param {number} perf_id - 性能追踪 ID。
 * @param {string} perf_prefix - 性能日志前缀。
 * @returns {boolean}
 */
function apply_space_click_intent(evt, s, perf_id, perf_prefix = "click_space") {
	const intent = get_space_click_intent(s)
	if (intent.type === "send_space") {
		if (send_action("space", s)) {
			mark_interaction_perf(perf_id, `${perf_prefix}.sent_space`)
			evt.stopPropagation()
			return true
		}
		return false
	}
	if (intent.type === "send_action") {
		send_action(intent.action, s)
		mark_interaction_perf(perf_id, `${perf_prefix}.sent_action`, { action: intent.action })
		evt.stopPropagation()
		return true
	}
	if (intent.type === "show_activation_popup") {
		show_popup_menu(evt, "activation_popup", s, spaces[s].name, intent.hide)
		mark_interaction_perf(perf_id, `${perf_prefix}.show_popup`)
		evt.stopPropagation()
		return true
	}
	return false
}

/**
 * 显示弹出菜单。
 * @param {Event} evt - 触发事件的对象。
 * @param {string} menu_id - 菜单元素的 ID。
 * @param {number|string} target_id - 动作的目标 ID。
 * @param {string} title - 菜单标题。
 * @param {string} hide - 需要隐藏的动作名。
 * @param {boolean} force_show - 是否强制显示。
 */
function show_popup_menu(evt, menu_id, target_id, title, hide = "", force_show = false) {
	const menu = document.getElementById(menu_id)

	let show = false
	for (const item of menu.querySelectorAll("li")) {
		const action = item.dataset.action
		if (action) {
			if (action === hide) {
				item.classList.remove("action")
				item.classList.add("hide")
				item.onclick = null
			} else {
				if (is_action(action, target_id)) {
					show = true
					item.classList.add("action")
					item.classList.remove("disabled", "hide")
					item.onclick = function () {
						send_action(action, target_id)
						hide_popup_menu()
						evt.stopPropagation()
					}
				} else {
					item.classList.remove("action", "hide")
					item.classList.add("disabled")
					item.onclick = null
				}
			}
		}
	}

	if (show || force_show) {
		menu.onmouseleave = hide_popup_menu
		menu.hidden = false
		if (title) {
			const item = menu.querySelector("li.title")
			if (item) {
				item.onclick = hide_popup_menu
				item.textContent = title
			}
		}

		const w = menu.clientWidth
		const h = menu.clientHeight
		const x = Math.max(5, Math.min(evt.clientX - w / 2, window.innerWidth - w - 5))
		const y = Math.max(5, Math.min(evt.clientY - 12, window.innerHeight - h - 40))
		menu.style.left = `${x}px`
		menu.style.top = `${y}px`

		evt.stopPropagation()
	} else {
		menu.hidden = true
	}
}

/**
 * 隐藏所有弹出菜单。
 */
function hide_popup_menu() {
	const activation_popup = document.getElementById("activation_popup")
	const card_popup = document.getElementById("card_popup")
	if (activation_popup) {
		activation_popup.hidden = true
	}
	if (card_popup) {
		card_popup.hidden = true
	}
}

/**
 * 检查卡牌是否启用。
 * @param {number} card - 卡牌 ID。
 * @returns {boolean} 是否启用。
 */
function is_card_enabled(card) {
	if (view.actions) {
		if (card_action_menu.some((a) => Array.isArray(view.actions[a]) && view.actions[a].includes(card))) {
			return true
		}
		if (Array.isArray(view.actions.card) && view.actions.card.includes(card)) {
			return true
		}
	}
	return false
}

/**
 * 检查指定动作是否对指定对象可用。
 * @param {string} action - 动作名称。
 * @param {number|string} card - 对象 ID。
 * @returns {boolean} 是否可用。
 */
function is_action(action, card) {
	return get_action_noun(action, card) !== undefined
}

function get_action_noun(action, noun) {
	if (!view.actions || !Array.isArray(view.actions[action])) {
		return undefined
	}
	const list = view.actions[action]
	if (list.includes(noun)) {
		return noun
	}
	const noun_key = String(noun)
	for (const item of list) {
		if (String(item) === noun_key) {
			return item
		}
	}
	return undefined
}

function get_piece_click_dispatch(p) {
	const direct_piece_noun = get_action_noun("piece", p)
	if (direct_piece_noun !== undefined) {
		return { action: "piece", noun: direct_piece_noun, source: "piece" }
	}
	const advance_piece_noun = get_action_noun("advance_pieces", p)
	if (advance_piece_noun !== undefined) {
		return { action: "piece", noun: advance_piece_noun, source: "advance_pieces" }
	}
	const retreat_piece_noun = get_action_noun("retreat_pieces", p)
	if (retreat_piece_noun !== undefined) {
		return { action: "piece", noun: retreat_piece_noun, source: "retreat_pieces" }
	}
	return null
}

function get_marker_click_dispatch(marker) {
	if (!marker) {
		return null
	}
	return null
}

/**
 * 点击卡牌的交互逻辑。
 * @param {Event} evt - 点击事件对象。
 * @param {number} [c] - 可选的卡牌 ID。
 */
function on_click_card(evt, c) {
	let cardId = c
	if (cardId === undefined || cardId === null) {
		cardId = evt && evt.currentTarget ? evt.currentTarget.card : undefined
	}
	if (cardId === undefined || cardId === null) {
		return
	}
	if (is_action("play_cc", cardId)) {
		send_action("play_cc", cardId)
	} else if (is_action("card", cardId)) {
		send_action("card", cardId)
	} else {
		show_popup_menu(evt, "card_popup", cardId, cards[cardId].name, "", true)
	}
}

let log_box_ap = 0
let log_box_cp = 0

/**
 * 处理日志输出。
 * @param {string} text - 日志文本。
 * @param {number} ix - 日志条目的索引。
 */
function on_log(text, ix) {
	const p = document.createElement("div")

	if (ix < log_box_ap) {
		log_box_ap = 0
	}
	if (ix < log_box_cp) {
		log_box_cp = 0
	}

	if (text.startsWith(">>")) {
		text = text.substring(2)
		if (text.startsWith(" ")) {
			text = text.substring(1)
		}
		p.classList.add("i")
		p.classList.add("detail")
		p.classList.add("align")
	} else if (text.startsWith(">")) {
		text = text.substring(1)
		if (text.startsWith(" ")) {
			text = text.substring(1)
		}
		p.classList.add("i")
		p.classList.add("detail")
	}

	if (text.startsWith("*") && !text.startsWith("**")) {
		text = text.substring(1)
		p.classList.add("bold")
	}

	if (text.startsWith("!")) {
		text = `\u2757 ${text.substring(1)}`
	} else if (text.startsWith("#cp")) {
		text = text.substring(4)
		p.className = "h4"
		log_box_cp = ix
	} else if (text.startsWith("#ap")) {
		text = text.substring(4)
		p.className = "h4"
		log_box_ap = ix
	} else if (text.startsWith(".h1")) {
		text = text.substring(4)
		p.className = "h1"
	} else if (text.startsWith(".h2")) {
		text = text.substring(4)
		if (text === "AP") {
			p.className = "h2 ap"
		} else if (text === "CP") {
			p.className = "h2 cp"
		} else {
			p.className = "h2"
			if (text === "强制进攻阶段" || text === "行动阶段") {
				p.classList.add("phase-strong")
			}
		}
	} else if (text.startsWith(".h3cp")) {
		text = text.substring(6)
		p.className = "h3 cp"
	} else if (text.startsWith(".h3ap")) {
		text = text.substring(6)
		p.className = "h3 ap"
	} else if (text.startsWith(".h3")) {
		text = text.substring(4)
		p.className = "h3"
	}

	if (text === "") {
		log_box_ap = 0
		log_box_cp = 0
	}

	if (log_box_ap) {
		p.classList.add("group", "ap")
	}
	if (log_box_cp) {
		p.classList.add("group", "cp")
	}

	p.innerHTML = on_prompt(text)
	return p
}

/**
 * 转义文本并替换特定占位符为 HTML。
 * @param {string} text - 原始文本。
 * @returns {string} 处理后的 HTML 字符串。
 */
function escape_text(text) {
	text = text.replace(/---/g, "\u2014")
	text = text.replace(/--/g, "\u2013")
	text = text.replace(/->/g, "\u2192")
	text = text.replace(/-( ?[\d])/g, "\u2212$1")
	text = text.replace(/&/g, "&amp;")
	text = text.replace(/</g, "&lt;")
	text = text.replace(/>/g, "&gt;")
	text = text.replace(/\u2680/g, `<span class="die d1">&#9856;</span>`)
	text = text.replace(/\u2681/g, `<span class="die d2">&#9857;</span>`)
	text = text.replace(/\u2682/g, `<span class="die d3">&#9858;</span>`)
	text = text.replace(/\u2683/g, `<span class="die d4">&#9859;</span>`)
	text = text.replace(/\u2684/g, `<span class="die d5">&#9860;</span>`)
	text = text.replace(/\u2685/g, `<span class="die d6">&#9861;</span>`)
	text = text.replace(/s(\d+)/g, sub_space_name)
	text = text.replace(/p(\d+)/g, sub_piece_name_reduced)
	text = text.replace(/P(\d+)/g, sub_piece_name)
	text = text.replace(/c(\d+)/g, sub_card_name)
	text = text.replace(/\b[BW]\d\b/g, sub_icon)
	text = text.replace(" 1 spaces", " 1 space")
	text = text.replace(/\+\d VP/g, (match) => `<span class="cpvp">${match}</span>`)
	text = text.replace(/[-−]\d VP/g, (match) => `<span class="apvp">${match}</span>`)
	text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
	return text
}

function get_czars_armories_prompt_status(text) {
	if (typeof view === "undefined" || !view || text !== view.prompt) {
		return ""
	}
	const remaining = Number(view.czars_armories_rp?.remaining || 0)
	if (!Number.isFinite(remaining) || remaining <= 0) {
		return ""
	}
	return ` <span class="czars_armories_prompt">Czar's Armories 即时 TU RP：${Math.floor(remaining)}</span>`
}

/**
 * 处理提示文本，将换行符替换为 HTML 换行符。
 * @param {string} text - 原始文本。
 * @returns {string} 处理后的 HTML 字符串。
 */
function on_prompt(text) {
	if (text === null || text === undefined) {
		return ""
	}
	const raw_text = String(text)
	return escape_text(raw_text).replace(/\n/g, "<br>") + get_czars_armories_prompt_status(raw_text)
}

function get_space_tip_element(s) {
	return (ui.space_list && ui.space_list[s]) || (spaces[s] && spaces[s].element) || null
}

/**
 * 显示空间提示。
 * @param {number} s - 空间 ID。
 */
function on_focus_space_tip(s) {
	const el = get_space_tip_element(s)
	if (el) {
		el.classList.add("tip")
	}
}

/**
 * 隐藏空间提示。
 * @param {number} s - 空间 ID。
 */
function on_blur_space_tip(s) {
	const el = get_space_tip_element(s)
	if (el) {
		el.classList.remove("tip")
	}
}

/**
 * 点击空间提示时滚动到该空间。
 * @param {number} s - 空间 ID。
 */
function on_click_space_tip(s) {
	const el = get_space_tip_element(s)
	if (el) {
		scroll_into_view(el)
		attract(el)
	}
}

/**
 * 点击卡牌提示时滚动到该卡牌。
 * @param {number} c - 卡牌 ID。
 */
function on_click_card_tip(c) {
	const visible = document.querySelector(`[data-card-id="${c}"]`)
	if (visible) {
		scroll_into_view(visible)
		return
	}
	if (cards[c].element) {
		scroll_into_view(cards[c].element)
	}
}

/**
 * 显示卡牌提示。
 * @param {number} c - 卡牌 ID。
 */
function on_focus_card_tip(c) {
	const card = cards[c]
	const tooltip = document.getElementById("tooltip")
	tooltip.className = `card ${card.faction} ${card_class_name(c)}`
	tooltip.style.backgroundImage = card_image_url(card)
	tooltip.hidden = false
}

/**
 * 隐藏卡牌提示。
 */
function on_blur_card_tip() {
	document.getElementById("tooltip").hidden = true
}

/**
 * 显示单位提示。
 * @param {number} p - 单位 ID。
 */
function on_focus_piece_tip(p) {
	if (pieces[p].element) {
		pieces[p].element.classList.add("tip")
	}
}

/**
 * 隐藏单位提示。
 * @param {number} p - 单位 ID。
 */
function on_blur_piece_tip(p) {
	if (pieces[p].element) {
		pieces[p].element.classList.remove("tip")
	}
}

/**
 * 点击单位提示时滚动到该单位。
 * @param {number} p - 单位 ID。
 */
function on_click_piece_tip(p) {
	if (pieces[p].element) {
		pieces[p].element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })
		attract(pieces[p].element)
	}
}

/**
 * 添加吸引效果。
 * @param {HTMLElement} elt - 目标元素。
 */
function attract(elt) {
	elt.classList.add("attract")
	window.setTimeout(() => elt.classList.remove("attract"), 1000)
}

/**
 * 处理空间焦点进入事件，显示空间信息。
 * @param {Event|number} _e - 事件对象或空间 ID。
 * @param {number} [s] - 空间 ID（如果第一个参数是事件）。
 */
function on_focus_space(_e, s) {
	const id = s !== undefined ? s : _e
	const space = spaces[id]
	if (!space) {
		return
	}
	let text = space.name

	if (DEBUG_SPACES) {
		text = `[${id}] ${space.name}`
		if (space.capital !== undefined) {
			text += ` (${space.nation.toUpperCase()} Capital)`
		} else if (space.nation) {
			text += ` (${space.nation.toUpperCase()})`
		}
		if (space.vp > 0) {
			text += ` *VP*`
		}
		if (DEBUG_SPACES) {
			const name = space.name
			const region = space.region
			const is_cp_source = ["Galicia", "SOFIA", "CONSTANTINOPLE", "Kayseri", "Erzincan", "Damascus", "Baghdad", "Medina", "Mecca", "Maan", "Central Asia", "Afghanistan"].includes(name)
			const is_ru_source = ["Odessa", "TIFLIS", "Central Asia", "Petrovsk"].includes(name)
			const is_br_source = ["Sudan and Darfur", "India"].includes(region) || name === "Bahrain"
			if (is_cp_source || is_ru_source || is_br_source || space.port || space.island_base) {
				text += `, Supply Source`
			}
		}
		if (space.terrain !== undefined) {
			text += `, ${space.terrain}`
		}
		if (space.fort !== undefined) {
			text += `, Fort Lvl ${space.fort}`
		}
		if (space.apport !== undefined) {
			text += `, Allied Port`
		}
		if (space.cpport !== undefined) {
			text += `, Central Powers Port`
		}
		if (space.element) {
			space.element.classList.add("highlight")
		}
	}
	if (DEBUG_CONNECTIONS) {
		if (space.connections !== undefined) {
			space.connections.forEach((n) => {
				if (spaces[n] && spaces[n].element) {
					spaces[n].element.classList.add("highlight")
				}
			})
		}
	}

	ui.status.textContent = text
}

/**
 * 处理空间焦点离开事件，清除状态文本。
 */
function on_blur_space() {
	ui.status.textContent = ""
	if (DEBUG_CONNECTIONS || DEBUG_SPACES) {
		for (let i = 0; i < spaces.length; ++i) {
			if (spaces[i] && spaces[i].element) {
				spaces[i].element.classList.remove("highlight")
			}
		}
	}
}

/**
 * 处理标记点击事件。
 * @param {MouseEvent} evt - 事件对象。
 */
function on_click_marker(evt) {
	if (evt.button !== 0) {
		return
	}
	const perf_id = begin_interaction_perf("click_marker", evt)
	const marker = evt.target.marker
	const stack = evt.target.my_stack
	const is_focused = stack ? is_stack_focused(stack) : false
	const marker_click = get_marker_click_dispatch(marker)

	evt.stopPropagation()
	if (marker && marker.space !== undefined) {
		const s = marker.space
		const space_stack = spaces[s] ? spaces[s].stack : null
		if (apply_space_click_intent(evt, s, perf_id, "click_marker")) {
			end_interaction_perf(perf_id, "click_marker.done")
			return
		}
		if (space_stack && !is_stack_focused(space_stack) && !is_small_stack(space_stack)) {
			focus_stack(space_stack)
			end_interaction_perf(perf_id, "click_marker.focus_space_stack", { space: s })
			return
		}
	}
	if (marker_click) {
		if (stack && !is_focused && !is_small_stack(stack)) {
			focus_stack(stack)
			end_interaction_perf(perf_id, "click_marker.focus_token_stack", { action: marker_click.action })
			return
		}
		send_action(marker_click.action, marker_click.noun)
		end_interaction_perf(perf_id, "click_marker.sent_action", { action: marker_click.action })
		return
	}
	if (stack && !is_focused && !is_small_stack(stack)) {
		focus_stack(stack)
		end_interaction_perf(perf_id, "click_marker.focus_only")
		return
	}

	end_interaction_perf(perf_id, "click_marker.done")
}

/**
 * 处理标记焦点进入事件。
 * @param {MouseEvent} evt - 事件对象。
 */
function on_focus_marker(evt) {
	const marker = evt.target.marker
	if (marker && marker.name) {
		ui.status.textContent = marker.name
	}
	if (mouse_focus) {
		focus_stack(evt.target.my_stack)
	}
}

/**
 * 处理标记焦点离开事件。
 */
function on_blur_marker() {
	ui.status.textContent = ""
	if (mouse_focus) {
		blur_stack()
	}
}

/**
 * 处理单位焦点进入事件，显示单位信息。
 * @param {Event|number} _e - 事件对象或单位 ID。
 * @param {number} p - 单位 ID。
 */
function on_focus_piece(_e, p) {
	const piece = pieces[p]
	if (piece) {
		let name = piece.name
		if (view.reduced && view.reduced.includes(p)) {
			name += " (Reduced)"
		}
		document.getElementById("status").textContent = name
		if (mouse_focus && piece.element && piece.element.my_stack) {
			focus_stack(piece.element.my_stack)
		}
	}
}

/**
 * 处理单位焦点离开事件。
 */
function on_blur_piece() {
	document.getElementById("status").textContent = ""
	if (mouse_focus) {
		blur_stack()
	}
}

Object.assign(window, {
	on_init,
	on_update,
	on_log,
	on_prompt,
	on_reply,
	hide_popup_menu,
	set_style,
	set_mouse_focus,
	on_focus_space_tip,
	on_blur_space_tip,
	on_click_space_tip,
	on_click_card_tip,
	on_focus_card_tip,
	on_blur_card_tip,
	on_focus_piece_tip,
	on_blur_piece_tip,
	on_click_piece_tip,
	show_score_summary,
	show_track_dialog,
	toggle_counters,
	to_reinforcements,
	flag_supply_warnings,
	open_bug_report_dialog,
	close_bug_report_dialog,
	submit_bug_report,
	set_perf_debug,
	get_bug_report_map_status,
	get_bug_report_action_summary,
	build_bug_report_message,
	propose_rollback,
	propose_rollback_cancel,
	propose_rollback_submit,
	review_rollback_cancel,
	review_rollback_accept,
	review_rollback_reject,
	update_rollback_dialog,
	show_dialog,
	hide_dialog,
	is_card_enabled,
	view_map_get,
	destroy_marker,
	unshift_stack,
	blur_stack,
	pugDebug: {
		setPerfDebug: set_perf_debug,
		getMapStatus: get_bug_report_map_status,
		getActionSummary: get_bug_report_action_summary,
		buildBugReport: build_bug_report_message,
		getSpaceIntent: get_space_click_intent,
		getPieceDispatch: get_piece_click_dispatch,
		getStackKey: get_stack_key,
		isStackFocused: is_stack_focused
	}
})

// Initialization
set_style(window.localStorage[params.title_id + "/style"] || "bevel")
set_mouse_focus(window.localStorage[params.title_id + "/mouse_focus"] | 0)

// Make all dialogs draggable
document.querySelectorAll(".dialog").forEach((dialog) => {
	if (dialog.id === "track_dialog") {
		// Track dialog keeps the header draggable while controls remain interactive.
		drag_element("#track_dialog", ".dialog_header")
	} else {
		const header = dialog.querySelector(".dialog_header")
		if (header) {
			drag_element("#" + dialog.id, ".dialog_header")
		}
	}
})

// Start desktop sessions with the large map fitted to the viewport width.
let mapwrap = document.getElementById("mapwrap")
if (mapwrap && window.innerWidth > 800) {
	mapwrap.dataset.fitCycle = "width-both"
	mapwrap.dataset.fit = "width"
	window.addEventListener("load", () => {
		if (typeof window.update_zoom === "function") window.update_zoom()
	})
	if (typeof window.update_zoom === "function") window.update_zoom()
}

function keep_inner_scroll_from_panning_map(selector) {
	for (const el of document.querySelectorAll(selector)) {
		for (const event_name of ["touchstart", "touchmove", "touchend", "touchcancel"]) {
			el.addEventListener(event_name, (evt) => evt.stopPropagation(), { passive: true })
		}
	}
}

keep_inner_scroll_from_panning_map(".dialog_body")

/**
 * 扩大矩形区域。
 * @param {number[]} rect - [x, y, w, h] 格式的矩形。
 * @param {number} n - 扩大的像素值。
 * @returns {number[]} 扩大后的矩形。
 */
function grow_layout(rect, n) {
	const [x, y, w, h] = rect
	return [x - n, y - n, w + n * 2, h + n * 2]
}

function expand_box_rect_by_name(name, rec) {
	if (!rec) return null
	const cx = rec[0] + rec[2] / 2
	const cy = rec[1] + rec[3] / 2
	let w = rec[2]
	let h = rec[3]

	if (name === "AP Reserve" || name === "CP Reserve") {
		w = Math.max(w, 400)
		h = Math.max(h, 266)
	} else if (name === "AP Corps Assets" || name === "CP Corps Assets") {
		w = Math.max(w, 231)
		h = Math.max(h, 266)
	} else if (name === "AP Eliminated") {
		w = Math.max(w, 371)
		h = Math.max(h, 192)
	} else if (name === "CP Eliminated") {
		w = Math.max(w, 270)
		h = Math.max(h, 343)
	}

	return [cx - w / 2, cy - h / 2, w, h]
}

/**
 * 获取空间的布局矩形。
 * @param {object} space - 空间对象。
 * @returns {number[]|null} [x, y, w, h] 格式的矩形或 null。
 */
function get_layout_rect(space) {
	const rec = layout[space.name]
	if (!rec) {
		return null
	}
	let rect = rec
	if (rec.center) {
		rect = [rec[0] - rec[2] / 2, rec[1] - rec[3] / 2, rec[2], rec[3]]
	}
	if (space.type === "box" || space.type === "Reserve Box" || space.map === "Reserve Box") {
		return expand_box_rect_by_name(space.name, rect)
	}
	return rect
}

/**
 * 构建空间元素并添加到地图中。
 * @param {number} id - 空间 ID。
 * @returns {HTMLElement|null} 创建的元素或 null。
 */
function build_space(id) {
	const space = spaces[id]
	const rect = get_layout_rect(space)
	if (!rect) {
		console.warn("Missing layout for space: " + space.name)
		return null
	}
	const [x, y, w, h] = grow_layout(rect, 0)

	space.stack = []
	space.stack.name = spaces[id].name
	space.stack.space_id = id

	const elt = (space.element = document.createElement("div"))
	elt.space = id
	elt.className = "space"
	if (space.type === "fort") {
		elt.classList.add("fort")
	}
	if (space.vp) {
		elt.classList.add("vp")
	}
	if (space.name.startsWith("MEF")) {
		elt.classList.add("mef")
	}

	elt.style.left = x + "px"
	elt.style.top = y + "px"
	elt.style.width = w + "px"
	elt.style.height = h + "px"

	elt.addEventListener("click", (e) => on_click_space(e, id))
	elt.addEventListener("mouseenter", () => on_focus_space(id))
	elt.addEventListener("mouseleave", on_blur_space)

	ui.spaces.appendChild(elt)
	ui.space_list[id] = elt
	return elt
}

/**
 * 构建单位元素。
 * @param {number} id - 单位 ID。
 * @param {HTMLElement} place - 放置元素的容器。
 * @returns {HTMLElement} 创建的元素。
 */
function build_piece(id, place) {
	const piece = pieces[id]
	const elt = document.createElement("div")
	elt.piece = id
	const piece_class_name = piece.piece_class === "LCU" ? "lcu" : "scu"
	const type_class = piece.type === "tribe" ? "tribe" : ""
	elt.className = "offmap piece anchored " + piece_class_name + " " + type_class + " " + (piece.counter || "")

	elt.addEventListener("click", (e) => on_click_piece(e, id))
	elt.addEventListener("mouseenter", (e) => on_focus_piece(e, id))
	elt.addEventListener("mouseleave", (e) => on_blur_piece(e, id))

	if (piece.piece_class === "LCU") {
		elt.my_size = 75 * SCALE
	} else {
		elt.my_size = 60 * SCALE
	}

	// Default image to full strength if available, to avoid blank pieces before first update
	if (piece.image_full) {
		elt.style.backgroundImage = `url("pieces/${piece.image_full}")`
	}

	place.insertBefore(elt, place.firstChild)
	piece.element = elt
	return elt
}

/**
 * 构建预备盒。
 * @param {number} id - 空间 ID。
 */
function build_reserve_box(id) {
	const space = spaces[id]
	const rect = get_layout_rect(space)
	if (!rect) {
		return
	}
	const [x, y, w, h] = grow_layout(rect, 0)

	space.stack = []
	space.stack.name = spaces[id].name
	space.stack.space_id = id
	space.stacks = {}
	const is_ap_box = id === AP_RESERVE_BOX || id === AP_CORPS_ASSETS_BOX
	const order = is_ap_box ? ap_reserve_box_order : cp_reserve_box_order
	for (const nation of order) {
		space.stacks[nation] = []
	}

	const elt = (space.element = document.createElement("div"))
	elt.className = "space box"
	elt.space = id
	elt.style.left = x + "px"
	elt.style.top = y + "px"
	elt.style.width = w + "px"
	elt.style.height = h + "px"

	elt.addEventListener("click", (e) => on_click_space(e, id))
	elt.addEventListener("mouseenter", (e) => on_focus_space(e, id))
	elt.addEventListener("mouseleave", (e) => on_blur_space(e, id))

	ui.spaces.appendChild(elt)
	ui.space_list[id] = elt
}

/**
 * 构建被消灭盒。
 * @param {number} id - 空间 ID。
 */
function build_eliminated_box(id) {
	const space = spaces[id]
	const rect = get_layout_rect(space)
	if (!rect) {
		return
	}
	const [x, y, w, h] = grow_layout(rect, 0)

	space.stack = []
	space.stack.name = spaces[id].name
	space.stack.space_id = id
	space.stacks = {}
	const order = get_eliminated_box_order(id)
	for (const group of order) {
		space.stacks[group] = { lcus: [], scus: [] }
	}

	const elt = (space.element = document.createElement("div"))
	elt.className = "space box"
	elt.space = id
	elt.style.left = x + "px"
	elt.style.top = y + "px"
	elt.style.width = w + "px"
	elt.style.height = h + "px"

	elt.addEventListener("click", (e) => on_click_space(e, id))
	elt.addEventListener("mouseenter", (e) => on_focus_space(e, id))
	elt.addEventListener("mouseleave", (e) => on_blur_space(e, id))

	ui.spaces.appendChild(elt)
	ui.space_list[id] = elt
}

// Initialization Loop
for (let c = 1; c < cards.length; ++c) {
	if (cards[c]) {
		build_card(c)
	}
}

for (let s = 1; s < spaces.length; ++s) {
	if (spaces[s]) {
		if (spaces[s].type === "generated_gap") {
			continue
		}
		if (spaces[s].type === "reinforcement") {
			continue
		}
		// Try to identify boxes by name if IDs are not constant
		if (
			spaces[s].name === "AP Reserve" ||
			spaces[s].name === "CP Reserve" ||
			spaces[s].name === "AP Corps Assets" ||
			spaces[s].name === "CP Corps Assets" ||
			spaces[s].type === "Reserve Box" ||
			spaces[s].map === "Reserve Box"
		) {
			build_reserve_box(s)
		} else if (
			spaces[s].name === "AP Eliminated" ||
			spaces[s].name === "CP Eliminated" ||
			spaces[s].name === "AP Permanently Eliminated Box" ||
			spaces[s].name === "CP Permanently Eliminated Box"
		) {
			build_eliminated_box(s)
		} else {
			build_space(s)
		}
	}
}

for (let p = 0; p < pieces.length; ++p) {
	if (pieces[p]) {
		if (SYSTEM_PIECE_NAMES.has(pieces[p].name)) {
			continue
		}
		// Check for missing images
		if (!pieces[p].image_full) {
			// console.warn("Piece missing image: " + pieces[p].name)
			// Skip or use placeholder?
			// PUG 404 error fix: ensure we don't try to load undefined
		}
		build_piece(p, ui.pieces)
	}
}

/**
 * 获取矩形中心点坐标。
 * @param {number[]} rec - [x, y, w, h] 格式的矩形。
 * @returns {number[]} [x, y] 中心点坐标。
 */
function layout_center(rec) {
	if (!rec) {
		return [0, 0]
	}
	return [rec[0] + rec[2] / 2, rec[1] + rec[3] / 2]
}

function init_replay() {
	let script = document.createElement("script")
	script.src = "replay.js"
	document.body.appendChild(script)
}
