"use strict";

/**
 * M3: LOOPBACK REVISION ENGINE (LRE)
 * GSRA Brain Module - Deterministic Belief Revision
 *
 * Role: Law-tracked belief update under constitutional constraints
 * - Revision when invariants violated
 * - Stabilization loop
 * - Constitutional compliance checking
 *
 * Based on: LOOPBACK_FORMAL_SPEC_v1.0
 *
 * Formal:
 * Belief_t+1 = Stabilize(Belief_t, EpistemicStatus, EvidenceSet)
 */

const crypto = require("crypto");

/**
 * Canonicalize for deterministic hashing
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

// ═══════════════════════════════════════════════════════════════════════════
// REVISION ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

const RevisionAction = {
  NO_REVISION: "NO_REVISION",
  REJECT_MEANING: "REJECT_MEANING",
  REQUEST_MORE_EVIDENCE: "REQUEST_MORE_EVIDENCE",
  DRIFT_CORRECTION: "DRIFT_CORRECTION",
  STABILIZED: "STABILIZED",
  DOWNGRADE_CONFIDENCE: "DOWNGRADE_CONFIDENCE"
};

const BeliefState = {
  CONSISTENT: "CONSISTENT",
  UNDER_REVISION: "UNDER_REVISION",
  REJECTED: "REJECTED",
  PENDING_EVIDENCE: "PENDING_EVIDENCE"
};

/**
 * Determine revision action based on epistemic status
 *
 * @param {string} epistemicStatus - Status from M2
 * @returns {string} Revision action
 */
function determineRevisionAction(epistemicStatus) {
  const actionMap = {
    "STABLE": RevisionAction.STABILIZED,
    "UNSUPPORTED_INFERENCE": RevisionAction.REJECT_MEANING,
    "INSUFFICIENT_EVIDENCE": RevisionAction.REQUEST_MORE_EVIDENCE,
    "SYMBOLIC_DRIFT": RevisionAction.DRIFT_CORRECTION,
    "LOW_GROUNDING": RevisionAction.DOWNGRADE_CONFIDENCE,
    "AMBIGUOUS": RevisionAction.REQUEST_MORE_EVIDENCE
  };

  return actionMap[epistemicStatus] || RevisionAction.NO_REVISION;
}

/**
 * Apply rejection to meaning
 * Used when unsupported inference detected
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {object} Rejected meaning unit
 */
function applyRejection(gmu) {
  return {
    ...gmu,
    text: "[REJECTED_UNSUPPORTED_INFERENCE]",
    original_text: gmu.text,
    rejected: true,
    rejection_reason: "M3_UNSUPPORTED_INFERENCE"
  };
}

/**
 * Apply drift correction
 * Adjusts meaning to align with evidence
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {object} Corrected meaning unit
 */
function applyDriftCorrection(gmu) {
  return {
    ...gmu,
    drift_tensor: {
      ...gmu.drift_tensor,
      corrected: true,
      correction_applied_at: Date.now ? undefined : null, // No timestamp in semantic
      D_normalized: Math.max(0, gmu.drift_tensor.D_normalized - 0.2)
    },
    grounding_score: Math.min(1, gmu.grounding_score + 0.1)
  };
}

/**
 * Apply confidence downgrade
 * Reduces confidence when grounding is low
 *
 * @param {object} gmu - Grounded meaning unit
 * @returns {object} Downgraded meaning unit
 */
function applyConfidenceDowngrade(gmu) {
  return {
    ...gmu,
    grounding_score: gmu.grounding_score * 0.8,
    confidence_downgraded: true
  };
}

/**
 * Determine belief state from revision action
 *
 * @param {string} revisionAction - Revision action taken
 * @returns {string} Belief state
 */
function determineBeliefState(revisionAction) {
  const stateMap = {
    [RevisionAction.STABILIZED]: BeliefState.CONSISTENT,
    [RevisionAction.NO_REVISION]: BeliefState.CONSISTENT,
    [RevisionAction.REJECT_MEANING]: BeliefState.REJECTED,
    [RevisionAction.REQUEST_MORE_EVIDENCE]: BeliefState.PENDING_EVIDENCE,
    [RevisionAction.DRIFT_CORRECTION]: BeliefState.UNDER_REVISION,
    [RevisionAction.DOWNGRADE_CONFIDENCE]: BeliefState.UNDER_REVISION
  };

  return stateMap[revisionAction] || BeliefState.UNDER_REVISION;
}

/**
 * Revise belief based on epistemic evaluation
 * Main M3 function: (GMU, EpistemicEval) → Revision
 *
 * @param {object} gmu - Grounded meaning unit (from M1)
 * @param {object} epistemicEval - Epistemic evaluation (from M2)
 * @returns {object} Loopback revision result
 */
function reviseBelief(gmu, epistemicEval) {
  // Validate inputs
  if (!gmu || gmu.type !== "grounded_meaning_unit") {
    throw new Error("M3_ERROR: Invalid grounded_meaning_unit input");
  }

  if (!epistemicEval || epistemicEval.type !== "epistemic_evaluation") {
    throw new Error("M3_ERROR: Invalid epistemic_evaluation input");
  }

  // Determine revision action
  const revision_action = determineRevisionAction(epistemicEval.epistemic_status);

  // Apply revision
  let stabilized_meaning = gmu;

  switch (revision_action) {
    case RevisionAction.REJECT_MEANING:
      stabilized_meaning = applyRejection(gmu);
      break;

    case RevisionAction.DRIFT_CORRECTION:
      stabilized_meaning = applyDriftCorrection(gmu);
      break;

    case RevisionAction.DOWNGRADE_CONFIDENCE:
      stabilized_meaning = applyConfidenceDowngrade(gmu);
      break;

    case RevisionAction.STABILIZED:
    case RevisionAction.NO_REVISION:
    case RevisionAction.REQUEST_MORE_EVIDENCE:
    default:
      // No modification to meaning
      break;
  }

  // Determine final belief state
  const belief_state = determineBeliefState(revision_action);

  // Compute revision hash
  const revision_hash = sha256Canonical({
    original_hash: gmu.trace_hash,
    action: revision_action,
    belief_state: belief_state
  });

  // Build revision result
  return {
    type: "loopback_revision",

    // Action taken
    revision_action: revision_action,

    // Result
    stabilized_meaning: stabilized_meaning,
    belief_state: belief_state,

    // Loop control
    requires_additional_loop: belief_state === BeliefState.UNDER_REVISION,
    can_proceed: belief_state === BeliefState.CONSISTENT,

    // Evidence request (if applicable)
    evidence_request: revision_action === RevisionAction.REQUEST_MORE_EVIDENCE ? {
      type: "evidence_request",
      reason: "INSUFFICIENT_GROUNDING",
      minimum_grounding_required: 0.5
    } : null,

    // Audit trail
    source_gmu_hash: gmu.trace_hash,
    source_epistemic_status: epistemicEval.epistemic_status,
    revision_hash: revision_hash
  };
}

/**
 * Check if revision loop should continue
 *
 * @param {object} revision - Loopback revision result
 * @returns {boolean} True if more revision needed
 */
function shouldContinueLoop(revision) {
  return revision.requires_additional_loop &&
         revision.belief_state !== BeliefState.REJECTED;
}

/**
 * Get stabilization summary
 *
 * @param {object} revision - Loopback revision result
 * @returns {object} Summary for logging/audit
 */
function getStabilizationSummary(revision) {
  return {
    action: revision.revision_action,
    state: revision.belief_state,
    can_proceed: revision.can_proceed,
    needs_evidence: !!revision.evidence_request,
    hash: revision.revision_hash
  };
}

module.exports = {
  reviseBelief,
  determineRevisionAction,
  shouldContinueLoop,
  getStabilizationSummary,
  RevisionAction,
  BeliefState
};
