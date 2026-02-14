"use strict";

/**
 * M1: MEANING SYNTHESIS ENGINE (MSE)
 * GSRA Brain Module - Grounded Semantic Consolidation
 *
 * Role: Bind Meaning ↔ Evidence (ΔC trace)
 * - Compute grounding_score
 * - Compute drift_tensor (symbolic drift vs physical trace)
 *
 * DETERMINISTIC | AUDIT-GRADE | LAW-005 COMPLIANT
 * NO INFERENCE GENERATION (EPSP compliant)
 *
 * Formal:
 * GroundingScore = f(trace_coverage, sensor_link, evidence_consistency)
 * DriftTensor D = || SymbolicPattern − EvidencePattern ||
 */

const crypto = require("crypto");

/**
 * Canonicalize object for deterministic hashing
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc, k) => {
      if (obj[k] !== undefined) acc[k] = canonicalize(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

function sha256Canonical(obj) {
  const canon = JSON.stringify(canonicalize(obj));
  return crypto.createHash("sha256").update(canon).digest("hex");
}

/**
 * Compute grounding score
 * Measures how well meaning is bound to physical evidence
 *
 * @param {object} meaningFrame - COP meaning frame
 * @returns {number} Grounding score (0-1)
 */
function computeGroundingScore(meaningFrame) {
  let score = 0;
  let weights = 0;

  // Weight: Trace origin present (0.5)
  if (meaningFrame?.inputs?.pft_trace_origin) {
    score += 0.5;
  }
  weights += 0.5;

  // Weight: Text content present (0.3)
  if (meaningFrame?.text && meaningFrame.text.length > 0) {
    score += 0.3;
  }
  weights += 0.3;

  // Weight: Context/inputs present (0.2)
  if (meaningFrame?.inputs && Object.keys(meaningFrame.inputs).length > 0) {
    score += 0.2;
  }
  weights += 0.2;

  return score / weights;
}

/**
 * Compute drift tensor
 * Measures symbolic drift from physical evidence
 *
 * @param {object} meaningFrame - COP meaning frame
 * @returns {object} Drift tensor
 */
function computeDriftTensor(meaningFrame) {
  // Symbolic length (representation complexity)
  const symbolicLength = (meaningFrame?.text || "").length;

  // Trace presence (physical grounding)
  const tracePresence = meaningFrame?.inputs?.pft_trace_origin ? 1 : 0;

  // Compute drift scalar
  // Higher drift = more symbolic content without physical grounding
  const drift_scalar = tracePresence === 0
    ? symbolicLength  // No trace = full symbolic drift
    : Math.abs(symbolicLength - 10) / 10; // Normalized drift

  // Normalized drift (0-1 scale)
  const D_normalized = Math.min(1, drift_scalar / (symbolicLength + 1));

  return {
    type: "drift_tensor",
    D_symbolic_vs_trace: drift_scalar,
    D_normalized: D_normalized,
    symbolic_length: symbolicLength,
    trace_bound: tracePresence === 1
  };
}

/**
 * Compute evidence consistency
 * Checks if evidence chain is intact
 *
 * @param {object} meaningFrame - COP meaning frame
 * @returns {object} Consistency result
 */
function computeEvidenceConsistency(meaningFrame) {
  const hasTraceOrigin = !!meaningFrame?.inputs?.pft_trace_origin;
  const hasText = !!meaningFrame?.text;
  const hasType = meaningFrame?.type === "meaning_frame";

  const consistency_score = (hasTraceOrigin ? 0.5 : 0) +
                           (hasText ? 0.3 : 0) +
                           (hasType ? 0.2 : 0);

  return {
    consistent: consistency_score >= 0.8,
    score: consistency_score,
    checks: {
      trace_origin: hasTraceOrigin,
      text_present: hasText,
      type_valid: hasType
    }
  };
}

/**
 * Synthesize grounded meaning unit (GMU)
 * Main M1 function: meaning_frame → grounded_meaning_unit
 *
 * @param {object} meaningFrame - COP meaning frame
 * @returns {object} Grounded meaning unit
 */
function synthesizeMeaning(meaningFrame) {
  // Validate input
  if (!meaningFrame || meaningFrame.type !== "meaning_frame") {
    throw new Error("M1_ERROR: Invalid meaning_frame input");
  }

  // Compute metrics
  const grounding_score = computeGroundingScore(meaningFrame);
  const drift_tensor = computeDriftTensor(meaningFrame);
  const evidence_consistency = computeEvidenceConsistency(meaningFrame);

  // Build GMU core (deterministic)
  const gmu_core = {
    type: "grounded_meaning_unit",
    source: "COP",
    text: meaningFrame.text,
    inputs: meaningFrame.inputs || {},
    grounding_score: grounding_score,
    drift_tensor: drift_tensor,
    evidence_consistency: evidence_consistency
  };

  // Generate trace hash (deterministic)
  const trace_hash = sha256Canonical(gmu_core);

  return {
    ...gmu_core,
    trace_hash
  };
}

/**
 * Validate GMU structure
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {object} Validation result
 */
function validateGMU(gmu) {
  const errors = [];

  if (!gmu || gmu.type !== "grounded_meaning_unit") {
    errors.push("INVALID_GMU_TYPE");
  }

  if (gmu && !gmu.grounding_score && gmu.grounding_score !== 0) {
    errors.push("MISSING_GROUNDING_SCORE");
  }

  if (gmu && !gmu.drift_tensor) {
    errors.push("MISSING_DRIFT_TENSOR");
  }

  if (gmu && !gmu.trace_hash) {
    errors.push("MISSING_TRACE_HASH");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  synthesizeMeaning,
  computeGroundingScore,
  computeDriftTensor,
  computeEvidenceConsistency,
  validateGMU
};
