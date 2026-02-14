"use strict";

/**
 * GSRA → ACTION INTERFACE
 * NRB Cognitive Stack Integration
 *
 * Role: Convert GSRA verdict → Action command
 * EPSP Compliant: Only execution mapping, no epistemic transformation
 *
 * NO INFERENCE ALLOWED - Pure representation layer
 */

/**
 * Convert GSRA verdict to action command
 * DETERMINISTIC: Pure transformation
 *
 * @param {object} verdict - GSRA output
 * @returns {object} Action command
 */
function gsraToAction(verdict) {
  // Validate input
  if (!verdict || verdict.response_type !== "gsra_verdict") {
    throw new Error("GSRA_ACTION_INTERFACE: Invalid GSRA verdict input");
  }

  // Extract action policy
  const actionPolicy = verdict.action_policy || {};

  return {
    type: "action_command",

    // Action specification
    action_type: actionPolicy.action || "NO_ACTION",
    priority: actionPolicy.priority || 0,
    requires_human: actionPolicy.requires_human || false,

    // Trace provenance (LAW-004)
    source_trace_hash: verdict.trace_hash || null,

    // Temporal markers (logical only)
    timestamp_action_emit: verdict.timestamp_gsra_emit || null,

    // GSRA verdict reference
    gsra_verdict: verdict.verdict || "UNKNOWN",

    // Source metadata
    source: {
      layer: "GSRA",
      version: "v1.0"
    }
  };
}

/**
 * Validate GSRA verdict before action conversion
 *
 * @param {object} verdict - GSRA verdict
 * @returns {object} Validation result
 */
function validateGSRAVerdict(verdict) {
  const errors = [];

  if (!verdict) {
    errors.push("NULL_VERDICT");
    return { valid: false, errors };
  }

  if (verdict.response_type !== "gsra_verdict") {
    errors.push("INVALID_RESPONSE_TYPE");
  }

  if (!verdict.verdict) {
    errors.push("MISSING_VERDICT");
  }

  if (!verdict.trace_hash) {
    errors.push("MISSING_TRACE_HASH");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Determine if action requires immediate execution
 *
 * @param {object} action - Action command
 * @returns {boolean} True if immediate execution required
 */
function requiresImmediateExecution(action) {
  // High priority actions require immediate execution
  if (action.priority >= 8) return true;

  // Emergency action types
  const emergencyActions = ["CALL_HELP", "EMERGENCY_STOP", "ALERT_HUMAN"];
  if (emergencyActions.includes(action.action_type)) return true;

  return false;
}

/**
 * Build action execution plan
 *
 * @param {object} action - Action command
 * @returns {object} Execution plan
 */
function buildExecutionPlan(action) {
  return {
    type: "execution_plan",
    action: action,
    immediate: requiresImmediateExecution(action),
    requires_confirmation: action.requires_human,
    execution_order: action.priority,
    trace_hash: action.source_trace_hash
  };
}

module.exports = {
  gsraToAction,
  validateGSRAVerdict,
  requiresImmediateExecution,
  buildExecutionPlan
};
