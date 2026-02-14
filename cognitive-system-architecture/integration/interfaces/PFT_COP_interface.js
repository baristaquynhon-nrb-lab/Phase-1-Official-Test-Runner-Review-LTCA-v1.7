"use strict";

/**
 * PFT → COP INTERFACE
 * NRB Cognitive Stack Integration
 *
 * Role: Convert pseudo_symbol → COP canonical input
 * EPSP Compliant: No inference, only structuring
 *
 * Flow: Phenomenon (PFT) → Pre-semantic Input (COP)
 */

/**
 * Convert PFT pseudo_symbol to COP input format
 * DETERMINISTIC: Pure transformation, no side effects
 *
 * @param {object} pseudoSymbol - PFT output
 * @returns {object} COP-compatible input
 */
function pftToCop(pseudoSymbol) {
  // Validate input
  if (!pseudoSymbol || pseudoSymbol.type !== "pseudo_symbol") {
    throw new Error("PFT_COP_INTERFACE: Invalid pseudo_symbol input");
  }

  // Deterministic transformation (no inference)
  return {
    type: "cop_input",

    // Signal classification as text seed
    text: pseudoSymbol.signal_class || "UNKNOWN_SIGNAL",

    // Trace provenance (LAW-004)
    trace_origin: pseudoSymbol.trace_origin || null,

    // Confidence passthrough
    confidence: pseudoSymbol.confidence || 0,

    // Urgency level
    urgency: pseudoSymbol.urgency || 0,

    // Temporal markers (logical only)
    timestamp_pft_emit: pseudoSymbol.timestamp_pft_emit || null,

    // Source metadata
    source: {
      layer: "PFT",
      version: "v1.0"
    }
  };
}

/**
 * Validate PFT output before COP conversion
 *
 * @param {object} pseudoSymbol - PFT output to validate
 * @returns {object} Validation result
 */
function validatePFTOutput(pseudoSymbol) {
  const errors = [];

  if (!pseudoSymbol) {
    errors.push("NULL_PSEUDO_SYMBOL");
    return { valid: false, errors };
  }

  if (pseudoSymbol.type !== "pseudo_symbol") {
    errors.push("INVALID_TYPE");
  }

  if (!pseudoSymbol.signal_class) {
    errors.push("MISSING_SIGNAL_CLASS");
  }

  if (!pseudoSymbol.trace_origin) {
    errors.push("MISSING_TRACE_ORIGIN");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  pftToCop,
  validatePFTOutput
};
