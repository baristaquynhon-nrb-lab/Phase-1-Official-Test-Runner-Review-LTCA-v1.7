"use strict";

/**
 * COP → GSRA INTERFACE
 * NRB Cognitive Stack Integration
 *
 * Role: Build canonical envelope for GSRA epistemic gate
 * LAW-005 Compliant: NO physical timestamp in semantic hash
 *
 * CRITICAL: Canonical envelope + epistemic trace binding
 */

const crypto = require("crypto");

/**
 * Canonicalize object for deterministic hashing
 *
 * @param {any} obj - Object to canonicalize
 * @returns {any} Canonicalized object
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) return null;

  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }

  if (typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        if (obj[key] !== undefined) {
          acc[key] = canonicalize(obj[key]);
        }
        return acc;
      }, {});
  }

  return obj;
}

/**
 * Generate SHA-256 hash of canonicalized object
 *
 * @param {object} obj - Object to hash
 * @returns {string} Hex hash
 */
function sha256Canonical(obj) {
  const canon = JSON.stringify(canonicalize(obj));
  return crypto.createHash("sha256").update(canon).digest("hex");
}

/**
 * Build COP → GSRA envelope
 * LAW-005: NO physical timestamp inside hash
 *
 * @param {object} meaningFrame - COP output (meaning_frame)
 * @param {object} logicalTime - Deterministic logical timestamp
 * @returns {object} GSRA-compatible envelope
 */
function buildCopToGsraEnvelope(meaningFrame, logicalTime) {
  // Validate input
  if (!meaningFrame || meaningFrame.type !== "meaning_frame") {
    throw new Error("COP_GSRA_INTERFACE: Invalid meaning_frame input");
  }

  // Build envelope core (deterministic content only)
  const envelopeCore = {
    type: "cop_gsra_envelope",
    version: "v1.0",

    // Meaning frame content
    meaning_frame: {
      text: meaningFrame.text,
      type: meaningFrame.type,
      inputs: meaningFrame.inputs || {}
    },

    // Epistemic trace (for provenance)
    epistemic_trace: {
      source: "COP",
      trace_origin: meaningFrame.inputs?.pft_trace_origin || null,
      confidence: meaningFrame.confidence || null
    },

    // Logical timestamp only (deterministic)
    logical_timestamp: logicalTime?.logical || null
  };

  // Generate trace hash (deterministic, timestamp-independent)
  const trace_hash = sha256Canonical(envelopeCore);

  return {
    ...envelopeCore,
    trace_hash
  };
}

/**
 * Validate COP output before GSRA envelope creation
 *
 * @param {object} meaningFrame - COP output
 * @returns {object} Validation result
 */
function validateCOPOutput(meaningFrame) {
  const errors = [];

  if (!meaningFrame) {
    errors.push("NULL_MEANING_FRAME");
    return { valid: false, errors };
  }

  if (meaningFrame.type !== "meaning_frame") {
    errors.push("INVALID_TYPE");
  }

  if (!meaningFrame.text) {
    errors.push("MISSING_TEXT");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract epistemic metadata from envelope
 *
 * @param {object} envelope - GSRA envelope
 * @returns {object} Epistemic metadata
 */
function extractEpistemicMetadata(envelope) {
  return {
    source: envelope.epistemic_trace?.source,
    trace_origin: envelope.epistemic_trace?.trace_origin,
    confidence: envelope.epistemic_trace?.confidence,
    trace_hash: envelope.trace_hash
  };
}

module.exports = {
  buildCopToGsraEnvelope,
  validateCOPOutput,
  extractEpistemicMetadata,
  canonicalize,
  sha256Canonical
};
