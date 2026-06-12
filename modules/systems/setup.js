"use strict"

module.exports = function (Engine) {
	const { data } = Engine
	const exports = {}

	const { set_add, set_has } = Engine.utils
	const { find_space, find_piece, normalize_trench_owner, infer_trench_owner, ensure_trench_owner } = Engine.game_utils
	const { COMMITMENT_MOBILIZATION, COMMITMENT_LIMITED, COMMITMENT_TOTAL, REMOVED, AP, CP } = Engine.constants
	const CYPRUS_BEACHHEAD_NAMES = ["To Adana", "To Beirut", "To Haifa", "To Jaffa"]
	const piece_lookup = new Map()
	const space_lookup = new Map()

	for (let p = 0; p < data.pieces.length; p++) {
		const piece = data.pieces[p]
		if (!piece) continue
		piece_lookup.set(`${piece.faction}:${piece.name}`, p)
	}

	for (let s = 1; s < data.spaces.length; s++) {
		const space = data.spaces[s]
		if (!space || space.name === undefined || space_lookup.has(space.name)) continue
		space_lookup.set(space.name, s)
	}

	function get_space_id(name) {
		if (space_lookup.has(name)) return space_lookup.get(name)
		return find_space(name)
	}

	function get_piece_id(faction, name) {
		const key = `${faction}:${name}`
		if (piece_lookup.has(key)) return piece_lookup.get(key)
		return find_piece(faction, name)
	}

	const CYPRUS = get_space_id("Cyprus")
	const CYPRUS_BEACHHEADS = CYPRUS_BEACHHEAD_NAMES.map(get_space_id)
	const AFGHANISTAN = get_space_id("Afghanistan")

	function place_piece(game, faction, name, space_name, reduced = false) {
		let p = get_piece_id(faction, name)
		let s = get_space_id(space_name)

		if (p < 0 && s >= 0) {
			const slot = data.spaces[s]
			if (slot && slot.type === "reinforcement" && slot.name === name) return
		}

		if (p >= 0 && s >= 0) {
			game.pieces[p] = s
			// Use CSV coordinates if this is a reinforcement slot
			const slot = data.spaces[s]
			if (slot && slot.type === "reinforcement") {
				if (slot.x !== undefined && slot.y !== undefined) {
					game.piece_x[p] = slot.x
					game.piece_y[p] = slot.y
				}
			}
			if (reduced) {
				set_add(game.reduced, p)
			}
		} else {
			if (p < 0) console.log("Could not find piece:", faction, name)
			if (s < 0) console.log("Could not find space:", space_name)
		}
	}

	function preplace_balkan_entry_displays(game) {
		if (!Engine.collapse || typeof Engine.collapse.get_bulgaria_entry_plan !== "function") return

		let bulgaria = Engine.collapse.get_bulgaria_entry_plan()
		for (let entry of bulgaria.cp.placements) {
			place_piece(game, "cp", entry.name, entry.space, false)
		}
		for (let entry of bulgaria.ap.placements) {
			place_piece(game, "ap", entry.name, entry.space, false)
		}
	}

	function normalize_trench_owners(game) {
		if (!Array.isArray(game.trench_owner)) game.trench_owner = []
		for (let s = 1; s < data.spaces.length; s++) {
			let has_trench = set_has(game.trenches, s) || set_has(game.trenches_2, s)
			if (!has_trench) {
				if (game.trench_owner[s] !== undefined) delete game.trench_owner[s]
				continue
			}
			ensure_trench_owner(game, s)
		}
	}

	function place_trench(game, level, space_name, owner = CP) {
		let s = get_space_id(space_name)
		if (s >= 0) {
			if (level === 2) {
				set_add(game.trenches_2, s)
			} else {
				set_add(game.trenches, s)
			}
			if (!Array.isArray(game.trench_owner)) game.trench_owner = []
			let resolved_owner = normalize_trench_owner(owner)
			if (!resolved_owner) resolved_owner = infer_trench_owner(game, s)
			game.trench_owner[s] = resolved_owner
		} else {
			console.log("Could not find space for trench:", space_name)
		}
	}

	function place_beachhead(game, space_name) {
		let s = get_space_id(space_name)
		if (s >= 0) {
			set_add(game.beachheads, s)
		} else {
			console.log("Could not find space for beachhead:", space_name)
		}
	}

	function setup_historical_scenario(game) {
		game.scenario_min_turn = 1
		game.scenario_max_turn = 17

		game.ui_tokens = {}
		game.ui_tokens["Cyprus Allowed"] = "MCYPNT.png"
		Engine.set_control(game, CYPRUS, "neutral")
		for (let s of CYPRUS_BEACHHEADS) Engine.set_control(game, s, "neutral")
		Engine.set_control(game, AFGHANISTAN, "neutral")
		game.ui_tokens["Persian_Neutrality"] = "MPERNEUT.PNG"
		game.ui_tokens["C.Asia_Revolt"] = "MNCASRV.png"
		game.ui_tokens["Afghan_Alliance"] = "MNAFGAL.PNG"
		game.ui_tokens["Indian_Mutiny"] = "MNINMUT.png"
		game.ui_tokens["GE RPs TO TU"] = "MGESPTU.png"
		game.ui_tokens["Egypt Uprising"] = "MNEGYREB.png"
		game.ui_tokens["RU Amphib Assault Allowed"] = "MRUAMPH.PNG"

		// Central Powers
		place_piece(game, "cp", "TU I Corps", "CONSTANTINOPLE", false)
		place_piece(game, "cp", "TU II Corps", "Adrianople", true)
		place_piece(game, "cp", "TU III Corps", "CP Corps Assets", false)
		place_piece(game, "cp", "TU IV Corps", "CP Corps Assets", false)
		place_piece(game, "cp", "TU V Corps", "CP Corps Assets", false)
		place_piece(game, "cp", "TU IX Corps", "Koprukoy", false)
		place_piece(game, "cp", "TU X Corps", "Sivas", true)
		place_piece(game, "cp", "TU XI Corps", "Erzurum", true)
		place_piece(game, "cp", "TU-A VI Corps", "Rodosto", true)
		place_piece(game, "cp", "TU-A VIII Corps", "CP Corps Assets", false)
		place_piece(game, "cp", "TU-A XII Corps", "CP Corps Assets", false)
		place_piece(game, "cp", "TU-A XIII Corps", "CP Corps Assets", false)

		place_piece(game, "cp", "TU DIV #1", "CONSTANTINOPLE", false)
		place_piece(game, "cp", "TU DIV #2", "CONSTANTINOPLE", false)
		place_piece(game, "cp", "TU DIV #3", "Bandirma", false)
		place_piece(game, "cp", "TU DIV #4", "Smyrna", false)
		place_piece(game, "cp", "TU DIV #5", "Ankara", false)
		place_piece(game, "cp", "TU DIV #6", "Kastamonu", false)
		place_piece(game, "cp", "TU DIV #7", "Yozgat", false)
		place_piece(game, "cp", "TU DIV #8", "Bayburt", false)
		place_piece(game, "cp", "TU DIV #9", "Ruwandiz", true)
		place_piece(game, "cp", "TU DIV #10", "CP Reserve", false)
		place_piece(game, "cp", "TU DIV #11", "CP Reserve", false)
		place_piece(game, "cp", "TU DIV #12", "CP Reserve", false)

		place_piece(game, "cp", "TU-A DIV #1", "Cizre", false)
		place_piece(game, "cp", "TU-A DIV #2", "Aleppo", false)
		place_piece(game, "cp", "TU-A DIV #3", "Aleppo", false)
		place_piece(game, "cp", "TU-A DIV #4", "Suleymaniye", true)
		place_piece(game, "cp", "TU-A DIV #5", "Nasiriya", true)
		place_piece(game, "cp", "TU-A DIV #6", "Basra", true)
		place_piece(game, "cp", "TU-A DIV #7", "Gaza", false)
		place_piece(game, "cp", "TU-A DIV #8", "Gaza", false)
		place_piece(game, "cp", "TU-A DIV #9", "Mecca", false)

		place_piece(game, "cp", "TU Elite DIV #1", "Bulair", false)
		place_piece(game, "cp", "TU Elite DIV #2", "Gallipoli", false)
		place_piece(game, "cp", "TU Elite DIV #3", "Seddul Bahr", false)
		place_piece(game, "cp", "TU Elite DIV #4", "Van", false)
		place_piece(game, "cp", "TU Elite DIV #5", "Damascus", false)
		place_piece(game, "cp", "TU Elite DIV #6", "Damascus", false)
		place_piece(game, "cp", "TU Elite DIV #7", "CP Reserve", false)
		place_piece(game, "cp", "TU Elite DIV #8", "CP Reserve", false)
		place_piece(game, "cp", "TU-A Elite DIV #1", "Adana", true)
		place_piece(game, "cp", "TU-A Elite DIV #2", "Homs", false)

		place_piece(game, "cp", "TU Cavalry #1", "Rodosto", true)
		place_piece(game, "cp", "TU Cavalry #2", "Erzurum", false)
		place_piece(game, "cp", "TU Cavalry #3", "Eleskirt", true)
		place_piece(game, "cp", "TU Cavalry #4", "Bayazit", true)
		place_piece(game, "cp", "TU-A Cavalry", "Ruwandiz", true)
		place_piece(game, "cp", "TU-A Camel Corps", "Beersheba", false)
		place_piece(game, "cp", "TU Stanke Bey", "Rize", false)

		// Tribal units
		place_piece(game, "cp", "Bakhtiari", "Bakhtiari", false)
		place_piece(game, "cp", "Bawi", "Bawi", false)
		place_piece(game, "cp", "Jangali", "Jangali", false)
		place_piece(game, "cp", "Kurds #1", "Kurds", false)
		place_piece(game, "cp", "Kurds #2", "Kurds", false)
		place_piece(game, "cp", "Laz", "Laz", false)
		place_piece(game, "cp", "Marsh #1", "Marsh", false)
		place_piece(game, "cp", "Marsh #2", "Marsh", false)
		place_piece(game, "cp", "NW Frontier", "NW Frontier", false)
		place_piece(game, "cp", "Qashqai", "Qashqai", false)
		place_piece(game, "cp", "Senussi #1", "Senussi", false)
		place_piece(game, "cp", "Senussi #2", "Senussi", false)
		place_piece(game, "cp", "Sinjabi", "Sinjabi", false)
		place_piece(game, "cp", "Tangistani", "Tangistani", false)

		// Allied Powers
		place_piece(game, "ap", "GR DIV #1", "ATHENS", false)
		place_piece(game, "ap", "GR DIV #2", "Doiran", false)
		place_piece(game, "ap", "GR DIV #3", "Ft. Rupel", false)

		place_piece(game, "ap", "BR Royal Navy", "Mersa Matruh", true)
		place_piece(game, "ap", "BR DIV #1", "CAIRO", true)
		place_piece(game, "ap", "BR IN Garrison #1", "INDIA", true)
		place_piece(game, "ap", "BR IN Garrison #2", "INDIA", true)
		place_piece(game, "ap", "BR IN Garrison #3", "INDIA", true)

		place_piece(game, "ap", "IN DIV #1", "Ismailia", true)
		place_piece(game, "ap", "IN DIV #2", "Suez", false)
		place_piece(game, "ap", "IN DIV #3", "Bahrain", false)
		place_piece(game, "ap", "IN DIV #4", "to Fao", false)
		place_piece(game, "ap", "IN DIV #5", "to Fao", false)
		place_piece(game, "ap", "IN DIV #6", "Baluchistan", false)
		place_piece(game, "ap", "IN Elite DIV #1", "INDIA", false)
		place_piece(game, "ap", "IN Elite DIV #2", "INDIA", false)
		place_piece(game, "ap", "IN Cavalry #1", "Port Said", false)
		place_piece(game, "ap", "IN Cavalry #2", "to Fao", false)
		place_piece(game, "ap", "IN Cavalry #3", "Baluchistan", false)
		place_piece(game, "ap", "IN Bikanir Camel", "Ismailia", false)

		place_piece(game, "ap", "RU I Caucasian", "Sarikamis", false)
		place_piece(game, "ap", "RU II Turkistani", "AP Corps Assets", false)
		place_piece(game, "ap", "RU DIV #1", "Batum", true)
		place_piece(game, "ap", "RU DIV #2", "Batum", true)
		place_piece(game, "ap", "RU DIV #3", "Oltu", false)
		place_piece(game, "ap", "RU DIV #4", "Kars", false)
		place_piece(game, "ap", "RU DIV #5", "Kagizman", false)
		place_piece(game, "ap", "RU DIV #6", "Kagizman", false)
		place_piece(game, "ap", "RU DIV #7", "TIFLIS", false)
		place_piece(game, "ap", "RU DIV #8", "TIFLIS", false)
		place_piece(game, "ap", "RU DIV #9", "AP Reserve", false)
		place_piece(game, "ap", "RU DIV #10", "AP Reserve", false)
		place_piece(game, "ap", "RU Elite DIV #1", "Erevan", false)
		place_piece(game, "ap", "RU Elite DIV #2", "Tabriz", false)
		place_piece(game, "ap", "RU Cavalry #1", "Sarikamis", false)
		place_piece(game, "ap", "RU Cavalry #2", "Julfa", false)
		place_piece(game, "ap", "RU Cavalry #3", "Julfa", false)
		place_piece(game, "ap", "RU Cavalry #4", "Tabriz", false)
		place_piece(game, "ap", "RU Cavalry #5", "TIFLIS", false)
		place_piece(game, "ap", "RU Cavalry #6", "Central Asia", true)
		place_piece(game, "ap", "PE/RU Persian Cossacks", "Tabriz", false)
		place_piece(game, "ap", "RU Yudenitch HQ", "TIFLIS", false)

		// Beachhead
		place_beachhead(game, "to Fao")

		// Trenches
		place_trench(game, 1, "Adrianople")
		place_trench(game, 1, "Bulair")
		place_trench(game, 1, "Catalca")
		place_trench(game, 1, "CONSTANTINOPLE")
		place_trench(game, 1, "Ctesiphon")
		place_trench(game, 2, "Doiran", AP)

		// 保加利亚展示板单位在历史开局时预摆到固定展示位，待事件打出后再“解锁”归属。
		// BU 3 Army 仍由事件流程决定具体落位，因此不在此处预摆。
		preplace_balkan_entry_displays(game)
	}

	function mark_removed_cards(game, card_ids) {
		for (let card_id of card_ids) {
			let info = data.cards[card_id]
			if (!info) continue
			let removed = info.faction === "ap" ? game.removed_ap : game.removed_cp
			set_add(removed, card_id)
		}
	}

	function mark_removed_cards_by_commitment(game, commitments) {
		let wanted = new Set(Array.isArray(commitments) ? commitments : [commitments])
		let card_ids = []
		for (let card_id = 1; card_id < data.cards.length; card_id++) {
			let info = data.cards[card_id]
			if (!info || !wanted.has(info.commitment)) continue
			card_ids.push(card_id)
		}
		mark_removed_cards(game, card_ids)
	}

	function apply_limited_war_started_events(game) {
		const prior_event_flags = {
			russo_british_assault: true,
			secret_treaty: true,
			churchill_prevails: true,
			lawrence: true,
			goeben: true,
			german_military_advisers: true,
			persian_push: true
		}

		game.jihad = 2

		game.events["egyptian_coup"] = true
		game.jihad -= 1
		if (game.ui_tokens) game.ui_tokens["Cyprus Allowed"] = "MCYPBR.png"
		Engine.set_control(game, CYPRUS, "ap")
		for (let s of CYPRUS_BEACHHEADS) Engine.set_control(game, s, "ap")

		game.events["royal_navy_blockade"] = true
		game.tu_rp_limit = 25
		game.blockade_vp_penalty_active = true
		game.events["royal_navy_blockade_transport_lock_placeholder"] = true
		game.events["royal_navy_blockade_restricted_seas"] = [
			"aegean",
			"east_mediterranean",
			"persian_gulf",
			"red_sea"
		]

		game.events["kitchener"] = 1
		game.events["kitchener_conversion"] = true
		game.rp_ap.br += 1
		game.rp_ap.in += 1
		game.rp_ap.a += 1
		game.rp_ap.ru += 1
		if (game.ui_tokens) game.ui_tokens["BR RPs TO RU"] = "MKitch.png"
		let kitchener_token = get_piece_id("system", "Kitch.token")
		if (kitchener_token >= 0) game.pieces[kitchener_token] = REMOVED

		game.events["liberate_suez"] = 2
		game.events["liberate_suez_active"] = true
		game.rp_cp.tu += 1
		game.jihad += 1

		game.events["pan_turkism"] = true
		game.rp_cp.tu += 1
		game.jihad += 1

		game.events["indian_mutiny"] = 2
		game.jihad += 1
		if (game.ui_tokens) {
			game.ui_tokens["Persian_Neutrality"] = "MPENV.png"
			game.ui_tokens["Egypt Uprising"] = "MEGRBA.PNG"
			game.ui_tokens["Indian_Mutiny"] = "MINMUTA.png"
		}

		for (let event_key in prior_event_flags) {
			game.events[event_key] = prior_event_flags[event_key]
		}

		delete game.liberate_suez_op_required
		delete game.liberate_suez_battle_required
		delete game.liberate_suez_min_egypt_attack_ops
		delete game.liberate_suez_required_attack_spaces
		delete game.liberate_suez_egypt_attacked_spaces
		delete game.liberate_suez_egypt_battle_done
		delete game.liberate_suez_drm
		delete game.indian_mutiny_drm
	}

	function setup_limited_war_scenario(game) {
		setup_historical_scenario(game)

		game.turn = 2
		game.scenario_min_turn = 2
		game.scenario_max_turn = 17
		game.initial_deck_commitment = COMMITMENT_LIMITED
		game.vp = 10
		game.war_status_ap = 4
		game.war_status_cp = 4
		game.war_commitment_ap = COMMITMENT_LIMITED
		game.war_commitment_cp = COMMITMENT_LIMITED
		game.pending_commitment_shuffle = { ap: false, cp: false }
		game.cp_opening_mobilization_pick_done = true

		mark_removed_cards_by_commitment(game, COMMITMENT_MOBILIZATION)
		apply_limited_war_started_events(game)
		game.combined_war = game.war_status_ap + game.war_status_cp
	}

	function apply_total_war_started_events(game) {
		// These limited-war events gate Total War card play, so only their durable flags are carried forward.
		if (Engine.neutral && typeof Engine.neutral.trigger_bulgaria_entry === "function") {
			Engine.neutral.trigger_bulgaria_entry(game)
			let bulgaria = Engine.collapse?.get_bulgaria_entry_plan?.()
			let third_army_name = bulgaria?.cp?.third_army_name || "BU 3 Army"
			let third_army_space = bulgaria?.cp?.third_army_default_space || "Rustchuk"
			if (typeof Engine.neutral.place_entry_units === "function") {
				Engine.neutral.place_entry_units(game, "cp", [{ space: third_army_space, units: [third_army_name] }])
			}
		}
		if (Engine.neutral && typeof Engine.neutral.trigger_romania_entry === "function") {
			Engine.neutral.trigger_romania_entry(game)
			if (typeof Engine.neutral.place_romania_combined_bu_ah === "function") {
				Engine.neutral.place_romania_combined_bu_ah(game)
			}
		}
		game.events["arab_revolt"] = true
		game.events["german_subs"] = true
		game.events["german_subs_turn"] = game.turn
		game.events["parvus_to_berlin"] = 5
		if (Engine.events && typeof Engine.events.sync_russian_revolution_markers === "function") {
			Engine.events.sync_russian_revolution_markers(game)
		}
	}

	function setup_total_war_scenario(game) {
		setup_limited_war_scenario(game)

		game.turn = 5
		game.scenario_min_turn = 5
		game.scenario_max_turn = 17
		game.initial_deck_commitment = COMMITMENT_TOTAL
		game.vp = 9
		game.war_status_ap = 14
		game.war_status_cp = 14
		game.war_commitment_ap = COMMITMENT_TOTAL
		game.war_commitment_cp = COMMITMENT_TOTAL
		game.pending_commitment_shuffle = { ap: false, cp: false }
		game.cp_opening_mobilization_pick_done = true
		game.jihad = 8

		mark_removed_cards_by_commitment(game, COMMITMENT_LIMITED)

		apply_total_war_started_events(game)
		game.combined_war = game.war_status_ap + game.war_status_cp
	}

	function get_reinforcement_box() {
		return Engine.constants.REINFORCEMENTS
	}

	function normalize_faction_token(value) {
		if (typeof value !== "string") return value
		let token = value.trim().toLowerCase()
		if (token === "ap" || token === "allied powers") return Engine.constants.AP
		if (token === "cp" || token === "central powers") return Engine.constants.CP
		return value
	}

	function normalize_game(state) {
		const { COMMITMENT_MOBILIZATION } = Engine.constants
		const { MO_NONE } = Engine.mo
		if (!state) state = {}
		if (!state.options) state.options = {}
		state.active = normalize_faction_token(state.active)
		if (!Array.isArray(state.log)) state.log = []
		if (!Array.isArray(state.undo)) state.undo = []
		if (!Array.isArray(state.pieces)) state.pieces = Array(data.pieces.length).fill(0)
		if (!Array.isArray(state.piece_x)) state.piece_x = Array(data.pieces.length).fill(undefined)
		if (!Array.isArray(state.piece_y)) state.piece_y = Array(data.pieces.length).fill(undefined)
		if (!Array.isArray(state.control)) state.control = Array(data.spaces.length).fill(null)
		if (!Array.isArray(state.reduced)) state.reduced = []
		if (!state.forts) state.forts = { destroyed: [], besieged: [] }
		if (!Array.isArray(state.forts.destroyed)) state.forts.destroyed = []
		if (!Array.isArray(state.forts.besieged)) state.forts.besieged = []
		if (!state.forts.owner || typeof state.forts.owner !== "object" || Array.isArray(state.forts.owner)) state.forts.owner = {}
		if (!Array.isArray(state.broken_sieges)) state.broken_sieges = []
		if (!Array.isArray(state.trenches)) state.trenches = []
		if (!Array.isArray(state.trenches_2)) state.trenches_2 = []
		if (!Array.isArray(state.trench_owner)) state.trench_owner = []
		normalize_trench_owners(state)
		if (!Array.isArray(state.deck_ap)) state.deck_ap = []
		if (!Array.isArray(state.hand_ap)) state.hand_ap = []
		if (!Array.isArray(state.discard_ap)) state.discard_ap = []
		if (!Array.isArray(state.removed_ap)) state.removed_ap = []
		if (!Array.isArray(state.deck_cp)) state.deck_cp = []
		if (!Array.isArray(state.hand_cp)) state.hand_cp = []
		if (!Array.isArray(state.discard_cp)) state.discard_cp = []
		if (!Array.isArray(state.removed_cp)) state.removed_cp = []
		if (!Array.isArray(state.discarded_ccs)) state.discarded_ccs = []
		if (!state.cc_retained) state.cc_retained = { ap: [], cp: [] }
		if (!Array.isArray(state.cc_retained.ap)) state.cc_retained.ap = []
		if (!Array.isArray(state.cc_retained.cp)) state.cc_retained.cp = []
		if (!state.cc_retained_after_use) state.cc_retained_after_use = { ap: {}, cp: {} }
		if (!state.cc_retained_after_use.ap) state.cc_retained_after_use.ap = {}
		if (!state.cc_retained_after_use.cp) state.cc_retained_after_use.cp = {}
		if (!state.rp_ap) state.rp_ap = { br: 0, ru: 0, in: 0, a: 0, fr: 0 }
		if (!state.rp_cp) state.rp_cp = { ge: 0, ah: 0, tu: 0, a: 0, bu: 0 }
		if (!state.rp_rebel) state.rp_rebel = { ca: 0, af: 0, eg: 0, in: 0 }
		if (state.tu_rp_limit === undefined) state.tu_rp_limit = 25
		if (state.tu_rp_recovery_pool === undefined) state.tu_rp_recovery_pool = 0
		if (state.tu_rp_ge_converted === undefined) state.tu_rp_ge_converted = 0
		if (!state.events) state.events = {}
		Engine.normalize_control(state)
		if (state.cp_auto_victory_marker === undefined) {
			state.cp_auto_victory_marker = null
		} else if (state.cp_auto_victory_marker !== null) {
			state.cp_auto_victory_marker = Math.max(0, Math.floor(Number(state.cp_auto_victory_marker) || 0))
		}
		if (!state.pending_commitment_shuffle) state.pending_commitment_shuffle = { ap: false, cp: false }
		if (state.pending_commitment_shuffle.ap === undefined) state.pending_commitment_shuffle.ap = false
		if (state.pending_commitment_shuffle.cp === undefined) state.pending_commitment_shuffle.cp = false
		if (state.war_status_ap === undefined) state.war_status_ap = 0
		if (state.war_status_cp === undefined) state.war_status_cp = 0
		if (!state.war_commitment_ap) state.war_commitment_ap = COMMITMENT_MOBILIZATION
		if (!state.war_commitment_cp) state.war_commitment_cp = COMMITMENT_MOBILIZATION
		if (state.mo_ap === undefined) state.mo_ap = MO_NONE
		if (state.mo_cp === undefined) state.mo_cp = MO_NONE
		if (state.mo_ap_modifier === undefined) state.mo_ap_modifier = 0
		if (state.mo_ap_fulfilled === undefined) state.mo_ap_fulfilled = false
		if (state.mo_cp_fulfilled === undefined) state.mo_cp_fulfilled = false
		if (state.mo_cp_cancelled === undefined) state.mo_cp_cancelled = false
		if (!Array.isArray(state.missed_mo_ap)) state.missed_mo_ap = []
		if (!Array.isArray(state.missed_mo_cp)) state.missed_mo_cp = []
		if (state.ru_revolution === undefined) state.ru_revolution = 0
		if (state.jihad === undefined) state.jihad = 0
		if (state.vp === undefined) state.vp = 10
		if (state.russian_vp === undefined) state.russian_vp = 0
		state.combined_war = Math.min(40, Math.max(0, (state.war_status_ap || 0) + (state.war_status_cp || 0)))
		if (!Array.isArray(state.tribal_reserve)) state.tribal_reserve = []
		if (!Array.isArray(state.soviet_uprising_markers)) state.soviet_uprising_markers = []
		if (state.russian_revolution === undefined) state.russian_revolution = 0
		if (state.god_save_the_tsar === undefined) state.god_save_the_tsar = 0
		if (state.ge_to_tu_rp_used === undefined) state.ge_to_tu_rp_used = 0
		if (state.br_to_ru_rp_used === undefined) state.br_to_ru_rp_used = false
		if (state.br_to_ru_rp_spent === undefined) state.br_to_ru_rp_spent = 0
		if (!Array.isArray(state.beachheads)) state.beachheads = []
		if (state.unplaced_beachheads === undefined) state.unplaced_beachheads = 0
		if (Engine.map && typeof Engine.map.is_potential_beachhead_space === "function") {
			for (let s = 1; s < data.spaces.length; s++) {
				if (!Engine.map.is_potential_beachhead_space(s)) continue
				let legal =
					typeof Engine.map.get_legal_beachhead_controller === "function"
						? Engine.map.get_legal_beachhead_controller(state, s)
						: null
				if (legal && state.control[s] === Engine.constants.CP) {
					state.control[s] = legal
				}
			}
		}
		if (Engine.map && Engine.game_utils) {
			for (let s = 1; s < data.spaces.length; s++) {
				let info = data.spaces[s]
				if (!info || !info.region) continue
				let has_ap_regular = false
				let has_cp_regular = false
				for (let p of Engine.map.get_pieces_in_space(state, s)) {
					if (Engine.game_utils.is_tribe(p)) continue
					let faction = Engine.game_utils.get_piece_effective_faction(state, p)
					let can_gain_control =
						!Engine.game_utils.is_irregular(p) &&
						!Engine.game_utils.is_hq(p) &&
						!Engine.game_utils.is_heavy_arty(p)
					if (!can_gain_control) continue
					if (faction === Engine.constants.AP) has_ap_regular = true
					else if (faction === Engine.constants.CP) has_cp_regular = true
					if (has_ap_regular && has_cp_regular) break
				}
				if ((has_ap_regular && has_cp_regular) || (!has_ap_regular && !has_cp_regular)) continue

				let desired = has_ap_regular ? Engine.constants.AP : Engine.constants.CP
				let current = Engine.map.get_space_controller(state, s)
				if (current === desired) continue

				let previous_vp_owner =
					Engine.get_effective_vp_value(state, s) > 0 &&
					(current === Engine.constants.AP || current === Engine.constants.CP)
						? current
						: 0
				let previous_jihad_owner = info.jihad_city ? Engine.get_jihad_city_scoring_owner(state, s) || 0 : 0
				let default_controller = Engine.map.get_default_controller(state, s)
				state.control[s] = desired === default_controller ? null : desired
				Engine.sync_vp_state(state, s, previous_vp_owner)
				if (info.jihad_city) Engine.sync_jihad_city_state(state, s, previous_jihad_owner)
			}
		}
		if (!Array.isArray(state.ap_actions)) state.ap_actions = Array(7).fill(null)
		if (!Array.isArray(state.cp_actions)) state.cp_actions = Array(7).fill(null)
		if (state.where === undefined) state.where = -1
		if (!Array.isArray(state.supply_warnings)) state.supply_warnings = []
		if (!Array.isArray(state.oos)) state.oos = []
		if (!Array.isArray(state.entrenching)) state.entrenching = []
		if (!Array.isArray(state.entrench_attempts)) state.entrench_attempts = []
		if (!Array.isArray(state.entered_regions_this_turn)) state.entered_regions_this_turn = []
		if (state.last_card === undefined) state.last_card = 0
		if (!Array.isArray(state.rollback)) state.rollback = []
		if (!(Array.isArray(state.rollback_state) || typeof state.rollback_state === "string"))
			state.rollback_state = []
		if (!state.activated) state.activated = { move: [], attack: [] }
		if (!Array.isArray(state.moved)) state.moved = []
		if (!Array.isArray(state.attacked)) state.attacked = []
		if (!Array.isArray(state.attacked_spaces)) state.attacked_spaces = []
		if (!Array.isArray(state.retreated)) state.retreated = []
		if (!state.balkan_attack_targets) state.balkan_attack_targets = { ap: -1, ap_mo: -1, cp: -1 }
		if (state.balkan_attack_targets.ap === undefined) state.balkan_attack_targets.ap = -1
		if (state.balkan_attack_targets.ap_mo === undefined) state.balkan_attack_targets.ap_mo = -1
		if (state.balkan_attack_targets.cp === undefined) state.balkan_attack_targets.cp = -1
		if (!Array.isArray(state.eligible_attackers)) state.eligible_attackers = []
		if (!Array.isArray(state.player_order)) state.player_order = [Engine.constants.AP, Engine.constants.CP]
		else state.player_order = state.player_order.map(normalize_faction_token)
		if (!Array.isArray(state.jihad_cities_flipped)) state.jihad_cities_flipped = []
		if (!Array.isArray(state.jihad_city_effective_owner)) state.jihad_city_effective_owner = []
		if (!Array.isArray(state.jihad_city_scoring_owner)) state.jihad_city_scoring_owner = []
		if (!Array.isArray(state.vp_partial_disruption)) state.vp_partial_disruption = []
		if (!Array.isArray(state.armenian_uprising_ru_vp_markers)) state.armenian_uprising_ru_vp_markers = []
		if (!Array.isArray(state.region_disruption)) state.region_disruption = []
		if (state.tribes_to_place === undefined) state.tribes_to_place = 0
		if (state.cp_opening_mobilization_pick_done === undefined) state.cp_opening_mobilization_pick_done = state.turn > 1
		return state
	}

	function create_game(seed, scenario, options) {
		const { COMMITMENT_MOBILIZATION } = Engine.constants
		const { MO_NONE } = Engine.mo
		let pieces = Array(data.pieces.length).fill(0)

		for (let p = 0; p < data.pieces.length; p++) {
			if (data.pieces[p]) {
				pieces[p] = get_reinforcement_box()
			}
		}

		let state = {
			seed: seed,
			scenario: scenario,
			options: Object.assign({}, options || {}),
			log: [],
			undo: [],
			active: null,
			state: "setup",
			turn: 0,
			vp: 10,
			pieces: pieces,
			piece_x: Array(data.pieces.length).fill(undefined),
			piece_y: Array(data.pieces.length).fill(undefined),
			control: Array(data.spaces.length).fill(null),
			reduced: [],
			forts: { destroyed: [], besieged: [], owner: {} },
			broken_sieges: [],
			trenches: [],
			trenches_2: [],
			trench_owner: [],
			deck_ap: [],
			hand_ap: [],
			discard_ap: [],
			removed_ap: [],
			deck_cp: [],
			hand_cp: [],
			discard_cp: [],
			removed_cp: [],
			rp_ap: { br: 0, ru: 0, in: 0, a: 0, fr: 0 },
			rp_cp: { ge: 0, ah: 0, tu: 0, a: 0, bu: 0 },
			rp_rebel: { ca: 0, af: 0, eg: 0, in: 0 },
			tu_rp_limit: 25,
			tu_rp_recovery_pool: 0,
			tu_rp_ge_converted: 0,
			events: {},
			cp_auto_victory_marker: null,
			pending_commitment_shuffle: { ap: false, cp: false },
			war_status_ap: 0,
			war_status_cp: 0,
			war_commitment_ap: COMMITMENT_MOBILIZATION,
			war_commitment_cp: COMMITMENT_MOBILIZATION,
			mo_ap: MO_NONE,
			mo_cp: MO_NONE,
			mo_ap_modifier: 0,
			mo_ap_fulfilled: false,
			mo_cp_fulfilled: false,
			mo_cp_cancelled: false,
			missed_mo_ap: [],
			missed_mo_cp: [],
			ru_revolution: 0,
			jihad: 0,
			jihad_cities_flipped: [],
			jihad_city_effective_owner: [],
			jihad_city_scoring_owner: [],
			vp_partial_disruption: [],
			armenian_uprising_ru_vp_markers: [],
			soviet_uprising_markers: [],
			region_disruption: [],
			russian_vp: 0,
			combined_war: 0,
			tribal_reserve: [],
			russian_revolution: 0,
			god_save_the_tsar: 0,
			ge_to_tu_rp_used: 0,
			br_to_ru_rp_used: false,
			br_to_ru_rp_spent: 0,
			ap_actions: Array(7).fill(null),
			cp_actions: Array(7).fill(null),
			where: -1,
			supply_warnings: [],
			oos: [],
			entrenching: [],
			entrench_attempts: [],
			entered_regions_this_turn: [],
			last_card: 0,
			rollback: [],
			rollback_state: [],
			balkan_attack_targets: { ap: -1, ap_mo: -1, cp: -1 },
			cp_opening_mobilization_pick_done: false
		}
		return normalize_game(state)
	}

	Object.assign(exports, {
		create_game,
		normalize_game,
		setup_historical_scenario,
		setup_limited_war_scenario,
		setup_total_war_scenario
	})

	return exports
}
