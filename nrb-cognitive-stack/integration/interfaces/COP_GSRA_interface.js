'use strict';

/**
 * COP → GSRA Interface — Wraps COP Meaning Frames for GSRA processing.
 */

function copToGsra(meaningFrame) {
  if (!meaningFrame || meaningFrame.type !== 'meaning_frame') {
    throw new Error('Invalid meaning frame');
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

module.exports = { copToGsra };
