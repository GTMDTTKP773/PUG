"use strict"

/**
 * Read-only combat context for external AI clients.
 *
 * This module does not resolve combat and does not choose actions. It applies
 * optional candidate actions on cloned states, then exposes the tactical facts
 * already computed by the authoritative combat/map helpers.
 */
module.exports = function create_combat_preview_analysis(Engine) {
	const { data } = Engine
	const { AP, CP } = Engine.constants

	function clone_game(game) {
		return JSON.parse(JSON.stringify(game))
	}

	function normalize_action(action) {
		if (!Array.isArray(action) || action.length === 0) throw new Error("Action must be a [name, arg] pair")
		return [action[0], action.length > 1 && action[1] !== undefined ? action[1] : null]
	}

	function flatten_legal_actions(view) {
		let result = []
		for (let [name, value] of Object.entries(view.actions || {})) {
			if (Array.isArray(value)) {
				for (let arg of value) result.push([name, arg])
			} else if (value === 1) {
				result.push([name, null])
			}
		}
		return result
	}

	function set_from(value) {
		return new Set(Array.isArray(value) ? value : [])
	}

	function short_faction(faction) {
		if (faction === AP || faction === "Allied Powers" || faction === "AP") return AP
		if (faction === CP || faction === "Central Powers" || faction === "CP") return CP
		return "neutral"
	}

	function other_faction(faction) {
		if (Engine.map && typeof Engine.map.other_faction === "function") {
			return short_faction(Engine.map.other_faction(faction))
		}
		return faction === AP ? CP : AP
	}

	function is_real_space(s) {
		let info = data.spaces[s]
		return !!(s > 0 && info && info.name !== undefined && !info.type)
	}

	function get_pieces_in_space(game, s) {
		if (Engine.map && typeof Engine.map.get_pieces_in_space === "function") return Engine.map.get_pieces_in_space(game, s)
		let result = []
		for (let p = 0; p < (game.pieces || []).length; p++) {
			if (game.pieces[p] === s) result.push(p)
		}
		return result
	}

	function get_controller(game, s) {
		if (Engine.map && typeof Engine.map.get_space_controller === "function") return Engine.map.get_space_controller(game, s)
		return (game.control && game.control[s]) || data.spaces[s]?.faction || "neutral"
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

	function piece_context(game, p) {
		let info = data.pieces[p] || {}
		let s = game.pieces[p]
		return {
			id: p,
			raw_id: is_real_space(s) ? s : null,
			name: info.name || "",
			faction: short_faction(info.faction),
			effective_faction: short_faction(Engine.game_utils.get_piece_effective_faction(game, p)),
			nation: info.nation || "",
			type: info.type || "",
			piece_class: info.piece_class || "",
			cf: piece_cf(game, p),
			lf: piece_lf(game, p),
			mf: piece_mf(p),
			regular: Engine.game_utils.is_regular(p),
			irregular: Engine.game_utils.is_irregular(p),
			tribe: Engine.game_utils.is_tribe(p),
			lcu: Engine.game_utils.is_lcu(p),
			scu: Engine.game_utils.is_scu(p),
			hq: Engine.game_utils.is_hq(p),
			heavy_arty: Engine.game_utils.is_heavy_arty(p),
			combat_unit: Engine.game_utils.is_combat_unit(p),
			reduced: Engine.game_utils.is_piece_reduced(game, p),
			moved: set_from(game.moved).has(p),
			attacked: set_from(game.attacked).has(p),
			retreated: set_from(game.retreated).has(p)
		}
	}

	function summarize_pieces(game, pieces) {
		let contexts = (pieces || []).filter((p) => data.pieces[p]).map((p) => piece_context(game, p))
		return {
			pieces: contexts.map((piece) => piece.id),
			contexts,
			count: contexts.length,
			cf: contexts.reduce((sum, piece) => sum + (piece.cf || 0), 0),
			lf: contexts.reduce((sum, piece) => sum + (piece.lf || 0), 0),
			lcu: contexts.filter((piece) => piece.lcu).length,
			scu: contexts.filter((piece) => piece.scu).length,
			hq: contexts.filter((piece) => piece.hq).length,
			heavy_arty: contexts.filter((piece) => piece.heavy_arty).length,
			combat_units: contexts.filter((piece) => piece.combat_unit).length,
			reduced: contexts.filter((piece) => piece.reduced).length
		}
	}

	function space_context(game, s) {
		if (!is_real_space(s)) return null
		let info = data.spaces[s]
		return {
			raw_id: s,
			name: info.name || "",
			map: info.map || "",
			area: info.area || "",
			region: info.region || "",
			terrain: info.terrain || "",
			nation: info.nation || "",
			faction: short_faction(info.faction),
			control: short_faction(get_controller(game, s)),
			vp: info.vp || 0,
			fort: info.fort || 0,
			port: !!info.port,
			jihad_city: !!info.jihad_city,
			beachhead: Engine.map?.is_beachhead_space ? Engine.map.is_beachhead_space(game, s) : false,
			fort_destroyed: set_from(game.forts && game.forts.destroyed).has(s),
			fort_besieged: Engine.map?.is_besieged ? Engine.map.is_besieged(game, s) : set_from(game.forts && game.forts.besieged).has(s),
			fort_owner: Engine.map?.get_fort_owner ? short_faction(Engine.map.get_fort_owner(game, s)) : "neutral",
			trench_level: Engine.game_utils.has_trench ? Engine.game_utils.has_trench(game, s) : 0,
			trench_owner: Engine.game_utils.get_trench_owner ? short_faction(Engine.game_utils.get_trench_owner(game, s)) : "neutral"
		}
	}

	function attack_source_spaces(game, attackers) {
		return Array.from(
			new Set(
				(attackers || [])
					.map((p) => game.pieces[p])
					.filter((s) => is_real_space(s))
			)
		)
	}

	function attack_probe(game, attackers, target, attacker, defender) {
		let probe = clone_game(game)
		probe.active = attacker
		probe.attack = {
			...(probe.attack || {}),
			pieces: attackers.slice(),
			space: target,
			attacker,
			defender
		}
		return probe
	}

	function legal_attackable_spaces(game, attackers, attacker) {
		if (!Engine.combat || typeof Engine.combat.get_legal_attackable_spaces !== "function") return []
		return Engine.combat.get_legal_attackable_spaces(
			game,
			attackers,
			attacker,
			() => Engine.game_utils.get_season(game),
			(space, side) => Engine.map.is_rail_connected_to_supply(game, space, side)
		)
	}

	function combat_defenders(game, target, defender) {
		if (Engine.combat && typeof Engine.combat.get_combat_defenders === "function") {
			return Engine.combat.get_combat_defenders(game, target, defender)
		}
		return get_pieces_in_space(game, target).filter(
			(p) => data.pieces[p] && short_faction(Engine.game_utils.get_piece_effective_faction(game, p)) === defender
		)
	}

	function region_defense_context(game, target, defender) {
		if (!Engine.map?.is_region || !Engine.map.is_region(game, target)) return null
		let candidates =
			Engine.combat && typeof Engine.combat.get_region_defender_candidates === "function"
				? Engine.combat.get_region_defender_candidates(game, target, defender)
				: combat_defenders(game, target, defender)
		let selected = Array.isArray(game.attack?.region_defenders) ? game.attack.region_defenders.slice() : []
		let candidate_block_reason =
			Engine.combat && typeof Engine.combat.get_region_defense_stack_block_reason === "function"
				? Engine.combat.get_region_defense_stack_block_reason(game, target, candidates, defender)
				: null
		let selected_block_reason =
			selected.length > 0 && Engine.combat && typeof Engine.combat.get_region_defense_stack_block_reason === "function"
				? Engine.combat.get_region_defense_stack_block_reason(game, target, selected, defender)
				: null
		return {
			candidates,
			selected,
			candidate_block_reason,
			selected_block_reason,
			requires_choice: !!candidate_block_reason && selected.length === 0
		}
	}

	function defender_retreat_options(game, defenders) {
		if (!Engine.combat || typeof Engine.combat.get_valid_retreat_spaces !== "function") return []
		return (defenders || []).map((p) => {
			let spaces = Engine.combat.get_valid_retreat_spaces(game, p, [], 1, false)
			if (typeof Engine.combat.apply_retreat_priorities === "function") {
				spaces = Engine.combat.apply_retreat_priorities(game, p, spaces)
			}
			return { piece: p, spaces }
		})
	}

	function water_crossings(game, attackers, target) {
		if (!Engine.combat || typeof Engine.combat.is_water_crossing_attack_edge !== "function") return []
		return (attackers || []).map((p) => ({
			piece: p,
			from: is_real_space(game.pieces[p]) ? game.pieces[p] : null,
			to: target,
			crossing: Engine.combat.is_water_crossing_attack_edge(game, game.pieces[p], target, attackers)
		}))
	}

	function target_preview(game, attackers, target, attacker, defender) {
		let probe = attack_probe(game, attackers, target, attacker, defender)
		let defenders = combat_defenders(probe, target, defender)
		let has_fort =
			Engine.map && typeof Engine.map.has_undestroyed_fort === "function"
				? Engine.map.has_undestroyed_fort(probe, target, defender)
				: false
		return {
			space: target,
			space_context: space_context(probe, target),
			attackers: summarize_pieces(probe, attackers),
			defenders: summarize_pieces(probe, defenders),
			has_undestroyed_fort: has_fort,
			fort_strength: has_fort ? data.spaces[target]?.fort || 0 : 0,
			odds: Engine.combat?.fmt_attack_odds ? Engine.combat.fmt_attack_odds(probe) : "",
			max_odds: Engine.combat?.fmt_attack_odds_with_max ? Engine.combat.fmt_attack_odds_with_max(probe) : "",
			can_flank: Engine.combat?.check_can_flank ? Engine.combat.check_can_flank(probe) : false,
			river_defense: Engine.combat?.is_river_defense ? Engine.combat.is_river_defense(probe) : false,
			water_crossings: water_crossings(probe, attackers, target),
			region_defense: region_defense_context(probe, target, defender),
			defender_retreat_options: defender_retreat_options(probe, defenders)
		}
	}

	function attack_context(game, role) {
		let attack = game.attack || {}
		let attackers = Array.isArray(attack.pieces) ? attack.pieces.filter((p) => data.pieces[p]) : []
		let attacker = short_faction(attack.attacker || role || game.active)
		let defender = short_faction(attack.defender || other_faction(attacker))
		let target = is_real_space(attack.space) ? attack.space : null
		let targets = []
		if (attackers.length > 0 && target === null) {
			targets = legal_attackable_spaces(game, attackers, attacker).map((s) =>
				target_preview(game, attackers, s, attacker, defender)
			)
		}
		return {
			attacker,
			defender,
			selected_pieces: attackers,
			selected: summarize_pieces(game, attackers),
			origin_spaces: attack_source_spaces(game, attackers).map((s) => space_context(game, s)),
			target_space: target,
			target: target !== null ? target_preview(game, attackers, target, attacker, defender) : null,
			target_options: targets,
			eligible_attackers: Array.isArray(game.eligible_attackers) ? game.eligible_attackers.slice() : []
		}
	}

	function current_loss_context(game) {
		if (!game.attack) return null
		let side = null
		if (game.state === "apply_defender_losses" || game.state === "eliminate_retreated_units") side = "defender"
		if (game.state === "apply_attacker_losses") side = "attacker"
		if (!side) return null

		let attacker = short_faction(game.attack.attacker || game.active)
		let defender = short_faction(game.attack.defender || other_faction(attacker))
		let total = Number(game.attack[`${side}_losses`] || 0)
		let absorbed = Number(game.attack[`${side}_losses_absorbed`] || 0)
		let needed = Math.max(0, total - absorbed)
		let pieces = side === "attacker" ? game.attack.pieces || [] : combat_defenders(game, game.attack.space, defender)
		let fort_strength = 0
		if (side === "defender" && pieces.length === 0 && Engine.map?.has_undestroyed_fort) {
			if (Engine.map.has_undestroyed_fort(game, game.attack.space, defender)) {
				fort_strength = data.spaces[game.attack.space]?.fort || 0
			}
		}
		let options =
			needed > 0 && Engine.combat?.get_loss_options
				? Engine.combat.get_loss_options(game, pieces, needed, fort_strength, side)
				: []
		return {
			side,
			total,
			absorbed,
			needed,
			pieces,
			options,
			fort_strength
		}
	}

	function current_retreat_context(game) {
		if (game.state !== "retreat" && game.state !== "turkish_retreat" && game.state !== "jafar_pasha_retreat") return null
		let pieces = []
		let avoided = []
		let distance = Number(game.retreat_distance || 1)
		if (game.state === "retreat") {
			pieces = Array.isArray(game.retreat_pieces) ? game.retreat_pieces.slice() : []
			avoided = Array.isArray(game.retreat_first_spaces) ? game.retreat_first_spaces.slice() : []
		} else if (game.state === "turkish_retreat") {
			pieces = [...(game.turkish_retreat_mandatory || []), ...(game.turkish_retreat_optional || [])]
			if (game.retreat_space > 0) avoided = [game.retreat_space]
		} else if (game.state === "jafar_pasha_retreat") {
			pieces = Array.isArray(game.jafar_pasha_retreat?.pieces) ? game.jafar_pasha_retreat.pieces.slice() : []
			avoided = Array.isArray(game.jafar_pasha_retreat?.avoided_spaces) ? game.jafar_pasha_retreat.avoided_spaces.slice() : []
		}
		let selected = data.pieces[game.selected_piece] ? game.selected_piece : pieces[0]
		let remaining = game.retreat_steps_left && selected !== undefined ? game.retreat_steps_left[selected] || 1 : distance
		let spaces = []
		if (data.pieces[selected] && Engine.combat?.get_valid_retreat_spaces) {
			spaces = Engine.combat.get_valid_retreat_spaces(game, selected, avoided, remaining, false)
			if (Engine.combat.apply_retreat_priorities) spaces = Engine.combat.apply_retreat_priorities(game, selected, spaces)
		}
		return {
			space: game.retreat_space ?? game.attack?.space ?? null,
			from: game.retreat_from ?? game.attack?.space ?? null,
			distance,
			remaining_steps: remaining,
			pieces,
			selected_piece: data.pieces[selected] ? selected : null,
			options: spaces
		}
	}

	function current_advance_context(game) {
		if (game.state !== "advance") return null
		let pieces = Array.isArray(game.advance_pieces) ? game.advance_pieces.slice() : []
		let selected = data.pieces[game.selected_piece] ? game.selected_piece : pieces[0]
		let target = game.advance_space > 0 ? game.advance_space : game.attack?.space
		let spaces = []
		if (data.pieces[selected] && target > 0 && Engine.combat?.get_valid_advance_spaces) {
			spaces = Engine.combat.get_valid_advance_spaces(game, selected, target)
		}
		return {
			space: target || null,
			count: Number(game.advance_count || 0),
			limit: Number(game.advance_limit || 0),
			pieces,
			selected_piece: data.pieces[selected] ? selected : null,
			options: spaces
		}
	}

	function preview_for_game(game, role) {
		let attack = game.attack || {}
		let attack_info =
			(Array.isArray(attack.pieces) && attack.pieces.length > 0) ||
			Array.isArray(game.eligible_attackers) ||
			game.state === "attack"
				? attack_context(game, role)
				: null
		let loss = current_loss_context(game)
		let retreat = current_retreat_context(game)
		let advance = current_advance_context(game)
		return {
			state: game.state || "",
			active: short_faction(game.active),
			has_combat_context: !!(attack_info || loss || retreat || advance),
			attack: attack_info,
			loss,
			retreat,
			advance
		}
	}

	function combat_preview(game, role, actions = null, apply_action = null, get_view = null) {
		let normalized_actions
		if (actions) {
			normalized_actions = actions.map(normalize_action)
		} else if (typeof get_view === "function") {
			normalized_actions = flatten_legal_actions(get_view(game, role || game.active))
		} else {
			normalized_actions = [[null, null]]
		}
		let acting_role = short_faction(role || game.active)
		let previews = normalized_actions.map((action) => {
			let candidate = clone_game(game)
			if (action[0] !== null) {
				if (typeof apply_action !== "function") throw new Error("apply_action callback is required")
				candidate = apply_action(candidate, acting_role, action[0], action[1])
			}
			return {
				action,
				...preview_for_game(candidate, acting_role)
			}
		})
		return {
			schema: "pug-ai.combat_preview.v1",
			state: game.state || "",
			active: short_faction(game.active),
			role: acting_role,
			action_count: previews.length,
			previews
		}
	}

	return {
		combat_preview
	}
}
