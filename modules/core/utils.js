"use strict"

// General purpose utility functions

/**
 * Checks if a set (array) contains an item.
 * Uses binary search for efficiency.
 * @param {Array} set
 * @param {*} item
 * @returns {boolean}
 */
function set_has(set, item) {
	if (!Array.isArray(set)) return false
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x) b = m - 1
		else if (item > x) a = m + 1
		else return true
	}
	return false
}

/**
 * Adds an item to a set (array) if it's not already p resent.
 * Maintains sorted order using binary search.
 * @param {Array} set
 * @param {*} item
 */
function set_add(set, item) {
	if (!Array.isArray(set)) return
	let a = 0
	let b = set.length - 1
	// optimize fast case of appending items in order
	if (item > set[b]) {
		set[b + 1] = item
		return
	}
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x) b = m - 1
		else if (item > x) a = m + 1
		else return
	}
	array_insert(set, a, item)
}

/**
 * Deletes an item from a set (array).
 * Uses binary search to find the item.
 * @param {Array} set
 * @param {*} item
 */
function set_delete(set, item) {
	if (!Array.isArray(set)) return
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x) b = m - 1
		else if (item > x) a = m + 1
		else {
			array_remove(set, m)
			return
		}
	}
}

/**
 * Toggles an item in a set (adds if missing, removes if present).
 * @param {Array} set
 * @param {*} item
 */
function set_toggle(set, item) {
	if (!Array.isArray(set)) return
	let a = 0
	let b = set.length - 1
	while (a <= b) {
		const m = (a + b) >> 1
		const x = set[m]
		if (item < x) b = m - 1
		else if (item > x) a = m + 1
		else {
			array_remove(set, m)
			return
		}
	}
	array_insert(set, a, item)
}

function map_set(map, key, value) {
	if (typeof map !== "object" || map === null) return
	map[key] = value
}

function map_get(map, key, defaultValue) {
	if (typeof map !== "object" || map === null) return defaultValue
	return map[key] !== undefined ? map[key] : defaultValue
}

function map_delete(map, key) {
	if (typeof map !== "object" || map === null) return
	delete map[key]
}

/**
 * Removes an item at a specific index from an array.
 * @param {Array} array
 * @param {number} index
 * @returns {Array}
 */
function array_remove(array, index) {
	const n = array.length
	for (let i = index + 1; i < n; ++i) array[i - 1] = array[i]
	array.length = n - 1
	return array
}

/**
 * Inserts an item at a specific index in an array.
 * @param {Array} array
 * @param {number} index
 * @param {*} item
 * @returns {Array}
 */
function array_insert(array, index, item) {
	for (let i = array.length; i > index; --i) array[i] = array[i - 1]
	array[index] = item
	return array
}

/**
 * Deep copies an object or array.
 * Handles null, undefined, primitives, arrays, and plain objects.
 * @param {*} v
 * @returns {*}
 */
function object_copy(v) {
	if (v === null || v === undefined) return v
	if (Array.isArray(v)) {
		return v.map(object_copy)
	}
	if (typeof v === "object") {
		const o = {}
		for (const k in v) {
			if (Object.prototype.hasOwnProperty.call(v, k)) {
				o[k] = object_copy(v[k])
			}
		}
		return o
	}
	return v
}

/**
 * Fisher-Yates shuffle.
 * @param {Array} array
 * @param {Object} [game] - Optional game object for deterministic RNG
 */
function shuffle(array, game) {
	if (!Array.isArray(array)) return
	for (let i = array.length - 1; i > 0; i--) {
		const j = random(i + 1, game)
		;[array[i], array[j]] = [array[j], array[i]]
	}
}

/**
 * Rolls a die.
 * @param {number} sides - Number of sides on the die (default 6)
 * @param {Object} [game] - Optional game object for deterministic RNG
 * @returns {number} - Result of the die roll [1, sides]
 */
function roll_die(sides = 6, game) {
	const n = Number(sides)
	if (isNaN(n) || n <= 0) return 1
	return random(n, game) + 1
}

/**
 * Generates a random integer in [0, range-1].
 * Uses deterministic MLCG if game.seed is present.
 * @param {number} range - Upper bound (exclusive)
 * @param {Object} [game] - Optional game object containing seed
 * @returns {number} - Random integer in [0, range-1]
 */
function random(range, game) {
	if (range <= 0) return 0
	if (game && game.seed !== undefined) {
		// MLCG using integer arithmetic
		// m = 2**35 − 31 = 34359738337
		game.seed = (game.seed * 200105) % 34359738337
		return game.seed % range
	}
	return Math.floor(Math.random() * range)
}

function normalize_faction_token(f) {
	if (typeof f !== "string") return f
	let token = f.trim().toLowerCase()
	if (token === "ap" || token === "allied powers") return "ap"
	if (token === "cp" || token === "central powers") return "cp"
	return f
}

function other_faction(f) {
	let faction = normalize_faction_token(f)
	if (faction === "ap") return "cp"
	if (faction === "cp") return "ap"
	return f
}

module.exports = {
	set_has,
	set_add,
	set_delete,
	set_toggle,
	map_set,
	map_get,
	map_delete,
	object_copy,
	shuffle,
	roll_die,
	random,
	normalize_faction_token,
	other_faction
}
