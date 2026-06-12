"use strict"

/**
 * Optional read-only analysis API for external tools such as PUG-AI.
 *
 * Keep this module out of normal game flow. Capabilities are explicit so an
 * independently deployed client can feature-detect additions across updates.
 */
module.exports = function create_analysis(Engine) {
	return Object.freeze({
		version: 10,
		capabilities: Object.freeze([
			"action_sequence.simulate",
			"activation_analysis.v1",
			"candidate_context.v1",
			"combat_preview.v1",
			"combat_package_analysis.v1",
			"decision.snapshot",
			"decision.step",
			"jihad_analysis.v1",
			"movement_analysis.v1",
			"position.public",
			"position.public.v2",
			"sr_analysis.v1",
			"supply_cut.standard_one_step_regular"
		]),
		...require("./action_sequence.js")(),
		...require("./candidate_context.js")(Engine),
		...require("./combat_preview.js")(Engine),
		...require("./combat_package.js")(Engine),
		...require("./decision.js")(),
		...require("./jihad.js")(Engine),
		...require("./movement.js")(Engine),
		...require("./position.js")(Engine),
		...require("./supply_probe.js")(Engine)
	})
}
