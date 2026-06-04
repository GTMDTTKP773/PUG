"use strict"

/**
 * Read-only public position summaries for external AI encoders.
 *
 * This module aggregates authoritative game facts. It does not decide
 * legality, mutate normal flow, or expose hidden hands.
 */
module.exports = function create_position_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants

	function is_real_space(s) {
		let info = data.spaces[s]
		return !!(s > 0 && info && info.name !== undefined && !info.type)
	}

	function bucket() {
		return {
			pieces: 0,
			regular: 0,
			irregular: 0,
			tribe: 0,
			lcu: 0,
			scu: 0,
			hq: 0,
			reduced: 0,
			cf: 0,
			lf: 0,
			mf: 0,
			hq_drm: 0,
			oos: 0,
			limited_supply: 0,
			disrupted_supply: 0
		}
	}

	function empty_counts() {
		return {
			ap: bucket(),
			cp: bucket(),
			neutral: bucket()
		}
	}

	function short_faction(faction) {
		if (faction === AP) return "ap"
		if (faction === CP) return "cp"
		return "neutral"
	}

	function set_from(value) {
		return new Set(Array.isArray(value) ? value : [])
	}

	function piece_cf(game, p) {
		return typeof Engine.game_utils.get_piece_cf === "function" ? Engine.game_utils.get_piece_cf(game, p) : 0
	}

	function piece_lf(game, p) {
		return typeof Engine.game_utils.get_piece_lf === "function" ? Engine.game_utils.get_piece_lf(game, p) : 0
	}

	function piece_mf(p) {
		if (typeof Engine.game_utils.get_piece_mf === "function") return Engine.game_utils.get_piece_mf(p)
		if (Engine.map && typeof Engine.map.get_piece_mf === "function") return Engine.map.get_piece_mf(p)
		return data.pieces[p]?.mf || 0
	}

	function piece_hq_drm(game, p) {
		return typeof Engine.game_utils.get_hq_drm === "function" ? Engine.game_utils.get_hq_drm(game, p) : 0
	}

	function piece_flags(game, p, flags) {
		let info = data.pieces[p] || {}
		return {
			regular: Engine.game_utils.is_regular(p),
			irregular: info.type === "irregular",
			tribe: Engine.game_utils.is_tribe(p),
			lcu: Engine.game_utils.is_lcu(p),
			scu: Engine.game_utils.is_scu(p),
			hq: Engine.game_utils.is_hq(p),
			reduced: Engine.game_utils.is_piece_reduced(game, p),
			oos: flags.oos.has(p),
			limited_supply: flags.limited.has(p),
			disrupted_supply: flags.disrupted.has(p)
		}
	}

	function piece_summary(game, p, flags, moved, sr_moved) {
		let info = data.pieces[p]
		let flags_for_piece = piece_flags(game, p, flags)
		return {
			id: p,
			raw_id: game.pieces[p],
			name: info.name || "",
			faction: short_faction(info.faction),
			effective_faction: short_faction(Engine.game_utils.get_piece_effective_faction(game, p)),
			nation: info.nation || "",
			type: info.type || "",
			piece_class: info.piece_class || "",
			cf: piece_cf(game, p),
			lf: piece_lf(game, p),
			mf: piece_mf(p),
			hq_drm: piece_hq_drm(game, p),
			moved: moved.has(p),
			sr_moved: sr_moved.has(p),
			...flags_for_piece
		}
	}

	function count_piece(game, counts, p, flags) {
		let info = data.pieces[p]
		if (!info) return
		let faction = short_faction(Engine.game_utils.get_piece_effective_faction(game, p))
		let target = counts[faction] || counts.neutral
		let flags_for_piece = piece_flags(game, p, flags)
		target.pieces += 1
		if (flags_for_piece.regular) target.regular += 1
		if (flags_for_piece.irregular) target.irregular += 1
		if (flags_for_piece.tribe) target.tribe += 1
		if (flags_for_piece.lcu) target.lcu += 1
		if (flags_for_piece.scu) target.scu += 1
		if (flags_for_piece.hq) target.hq += 1
		if (flags_for_piece.reduced) target.reduced += 1
		target.cf += piece_cf(game, p)
		target.lf += piece_lf(game, p)
		target.mf += piece_mf(p)
		target.hq_drm += piece_hq_drm(game, p)
		if (flags_for_piece.oos) target.oos += 1
		if (flags_for_piece.limited_supply) target.limited_supply += 1
		if (flags_for_piece.disrupted_supply) target.disrupted_supply += 1
	}

	function get_controller(game, s) {
		if (Engine.map && typeof Engine.map.get_space_controller === "function") {
			return Engine.map.get_space_controller(game, s)
		}
		return (game.control && game.control[s]) || data.spaces[s].faction || null
	}

	function public_position(game) {
		let flags = {
			oos: set_from(game.oos),
			limited: set_from(game.limited_supply),
			disrupted: set_from(game.disrupted_supply)
		}
		let moved = set_from(game.moved)
		let sr_moved = set_from(game.sr_moved)
		let pieces_by_space = new Map()
		let piece_summaries = []
		for (let p = 0; p < (game.pieces || []).length; p++) {
			let s = game.pieces[p]
			if (!is_real_space(s)) continue
			if (!pieces_by_space.has(s)) pieces_by_space.set(s, [])
			pieces_by_space.get(s).push(p)
			if (data.pieces[p]) piece_summaries.push(piece_summary(game, p, flags, moved, sr_moved))
		}

		let destroyed_forts = set_from(game.forts && game.forts.destroyed)
		let besieged_forts = set_from(game.forts && game.forts.besieged)
		let beachheads = set_from(game.beachheads)
		let spaces = []
		for (let s = 1; s < data.spaces.length; s++) {
			if (!is_real_space(s)) continue
			let pieces = pieces_by_space.get(s) || []
			let counts = empty_counts()
			for (let p of pieces) count_piece(game, counts, p, flags)
			spaces.push({
				raw_id: s,
				control: short_faction(get_controller(game, s)),
				pieces,
				counts,
				fort_destroyed: destroyed_forts.has(s),
				fort_besieged: besieged_forts.has(s),
				beachhead: beachheads.has(s)
			})
		}

		return {
			schema: "pug-ai.public_position.v2",
			state: game.state || "",
			active: short_faction(game.active),
			turn: game.turn || 0,
			action_round: game.action_round || 0,
			vp: game.vp || 0,
			pieces: piece_summaries,
			spaces
		}
	}

	return {
		public_position
	}
}
