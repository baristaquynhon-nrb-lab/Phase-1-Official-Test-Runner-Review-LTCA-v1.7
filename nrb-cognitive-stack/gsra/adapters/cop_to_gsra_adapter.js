'use strict';

/**
 * COP → GSRA Adapter — Transforms COP Meaning Frames into GSRA envelopes.
 */

function createEnvelope(meaningFrame) {
  if (!meaningFrame || !meaningFrame.trace_hash) {
    throw new Error('Invalid meaning frame: missing trace_hash');
  }

  return {
    envelope_type: 'cop_to_gsra',
    version: '1.0',
    meaning_frame: meaningFrame,
    metadata: {
      source: 'cop_cil_runtime',
      timestamp: new Date().toISOString(),
      trace_hash: meaningFrame.trace_hash
    }
  };
}

function validateEnvelope(envelope) {
  const errors = [];
  if (envelope.envelope_type !== 'cop_to_gsra') {
    errors.push('Invalid envelope_type');
  }
  if (!envelope.meaning_frame) {
    errors.push('Missing meaning_frame');
  }
  if (!envelope.metadata || !envelope.metadata.trace_hash) {
    errors.push('Missing metadata.trace_hash');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { createEnvelope, validateEnvelope };
