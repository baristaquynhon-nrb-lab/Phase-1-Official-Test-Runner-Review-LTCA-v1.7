"use strict";

/**
 * M2: EPISTEMIC UNCERTAINTY EVALUATOR (EUE)
 * GSRA Brain Module - Official Epistemic Gate
 *
 * Role: Evaluate epistemic status of grounded meaning
 * - Detect unsupported inference
 * - Check evidence sufficiency
 * - Gate based on epistemic thresholds
 *
 * AUDIT-GRADE | DETERMINISTIC | ANTI-UNSUPPORTED-INFERENCE
 *
 * Formal:
 * Allow(Meaning) ⇔ grounding_score ≥ θ_g ∧ drift_tensor ≤ θ_d ∧ evidence_sufficiency ≥ θ_e
 */

// ═══════════════════════════════════════════════════════════════════════════
// EPISTEMIC THRESHOLDS (CONFIGURABLE)
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  GROUNDING_MIN: 0.5,          // Minimum grounding score for STABLE
  DRIFT_MAX: 0.6,              // Maximum drift for STABLE
  EVIDENCE_SUFFICIENCY_MIN: 0.4, // Minimum evidence sufficiency
  UNSUPPORTED_GROUNDING: 0.3,  // Below this = unsupported inference
  AMBIGUITY_THRESHOLD: 0.5     // Confidence below this = AMBIGUOUS
};

/**
 * Compute evidence sufficiency
 * Measures if evidence is adequate for epistemic claims
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {number} Evidence sufficiency score (0-1)
 */
function computeEvidenceSufficiency(gmu) {
  const hasTrace = gmu.inputs?.pft_trace_origin ? 1 : 0;
  const grounding = gmu.grounding_score || 0;
  const consistency = gmu.evidence_consistency?.score || 0;

  // Weighted combination
  const sufficiency = (0.4 * hasTrace) +
                      (0.3 * grounding) +
                      (0.3 * consistency);

  return sufficiency;
}

/**
 * Detect unsupported inference
 * Core epistemic violation check
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {boolean} True if unsupported inference detected
 */
function detectUnsupportedInference(gmu) {
  const noTrace = !gmu.inputs?.pft_trace_origin;
  const lowGrounding = gmu.grounding_score < THRESHOLDS.UNSUPPORTED_GROUNDING;
  const highDrift = (gmu.drift_tensor?.D_normalized || 0) > THRESHOLDS.DRIFT_MAX;

  // Unsupported inference = no evidence AND low grounding
  return (noTrace && lowGrounding) || (noTrace && highDrift);
}

/**
 * Detect ambiguity
 * Check if meaning is too ambiguous for certain verdict
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {boolean} True if ambiguous
 */
function detectAmbiguity(gmu) {
  const lowConfidence = gmu.evidence_consistency?.score < THRESHOLDS.AMBIGUITY_THRESHOLD;
  const midDrift = (gmu.drift_tensor?.D_normalized || 0) > 0.4 &&
                   (gmu.drift_tensor?.D_normalized || 0) < 0.7;

  return lowConfidence || midDrift;
}

/**
 * Determine epistemic status
 * Core classification logic
 *
 * @param {object} gmu - Grounded meaning unit
 * @param {number} evidenceSufficiency - Evidence sufficiency score
 * @param {boolean} unsupportedInference - Unsupported inference flag
 * @returns {string} Epistemic status
 */
function determineEpistemicStatus(gmu, evidenceSufficiency, unsupportedInference) {
  const drift = gmu.drift_tensor?.D_normalized || 1;
  const grounding = gmu.grounding_score || 0;

  // Priority 1: Unsupported inference (most severe)
  if (unsupportedInference) {
    return "UNSUPPORTED_INFERENCE";
  }

  // Priority 2: Insufficient evidence
  if (evidenceSufficiency < THRESHOLDS.EVIDENCE_SUFFICIENCY_MIN) {
    return "INSUFFICIENT_EVIDENCE";
  }

  // Priority 3: Symbolic drift too high
  if (drift > THRESHOLDS.DRIFT_MAX) {
    return "SYMBOLIC_DRIFT";
  }

  // Priority 4: Low grounding
  if (grounding < THRESHOLDS.GROUNDING_MIN) {
    return "LOW_GROUNDING";
  }

  // Priority 5: Check ambiguity
  if (detectAmbiguity(gmu)) {
    return "AMBIGUOUS";
  }

  // All checks passed
  return "STABLE";
}

/**
 * Evaluate epistemic state of grounded meaning
 * Main M2 function: GMU → Epistemic Evaluation
 *
 * @param {object} gmu - Grounded meaning unit (from M1)
 * @returns {object} Epistemic evaluation result
 */
function evaluateEpistemicState(gmu) {
  // Validate input
  if (!gmu || gmu.type !== "grounded_meaning_unit") {
    throw new Error("M2_ERROR: Invalid grounded_meaning_unit input");
  }

  // Compute metrics
  const evidence_sufficiency = computeEvidenceSufficiency(gmu);
  const unsupported_inference = detectUnsupportedInference(gmu);
  const ambiguous = detectAmbiguity(gmu);
  const drift = gmu.drift_tensor?.D_normalized || 1;

  // Determine status
  const epistemic_status = determineEpistemicStatus(
    gmu,
    evidence_sufficiency,
    unsupported_inference
  );

  // Build evaluation result
  return {
    type: "epistemic_evaluation",

    // Primary status
    epistemic_status: epistemic_status,

    // Detailed metrics
    evidence_sufficiency: evidence_sufficiency,
    unsupported_inference: unsupported_inference,
    ambiguous: ambiguous,
    drift: drift,
    grounding_score: gmu.grounding_score,

    // Gate decision
    gate_pass: epistemic_status === "STABLE",
    gate_verdict: epistemic_status === "STABLE" ? "ALLOW" : "REJECT",

    // Thresholds used (for audit)
    thresholds_applied: { ...THRESHOLDS },

    // Source reference
    source_gmu_hash: gmu.trace_hash
  };
}

/**
 * Quick epistemic check (simplified gate)
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {boolean} True if epistemically valid
 */
function quickEpistemicCheck(gmu) {
  if (!gmu) return false;

  const hasEvidence = !!gmu.inputs?.pft_trace_origin;
  const sufficientGrounding = gmu.grounding_score >= THRESHOLDS.GROUNDING_MIN;
  const lowDrift = (gmu.drift_tensor?.D_normalized || 1) <= THRESHOLDS.DRIFT_MAX;

  return hasEvidence && sufficientGrounding && lowDrift;
}

/**
 * Get rejection reason for failed evaluation
 *
 * @param {object} evaluation - Epistemic evaluation result
 * @returns {string} Human-readable rejection reason
 */
function getRejectionReason(evaluation) {
  const statusReasons = {
    "UNSUPPORTED_INFERENCE": "Inference lacks sufficient evidence (epistemic violation)",
    "INSUFFICIENT_EVIDENCE": "Evidence below minimum threshold",
    "SYMBOLIC_DRIFT": "Symbolic representation drifted from physical evidence",
    "LOW_GROUNDING": "Grounding score below minimum threshold",
    "AMBIGUOUS": "Meaning too ambiguous for certain verdict"
  };

  return statusReasons[evaluation.epistemic_status] || "Unknown epistemic issue";
}

module.exports = {
  evaluateEpistemicState,
  computeEvidenceSufficiency,
  detectUnsupportedInference,
  detectAmbiguity,
  quickEpistemicCheck,
  getRejectionReason,
  THRESHOLDS
};
