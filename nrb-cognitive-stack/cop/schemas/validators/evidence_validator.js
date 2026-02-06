'use strict';

/**
 * Evidence Validator — Validates evidence chain completeness in Meaning Frames.
 */

function validateEvidence(frame) {
  const errors = [];

  if (!frame.evidence) {
    errors.push('evidence object is required');
    return { valid: false, errors };
  }

  if (!frame.evidence.source_text && frame.evidence.source_text !== '') {
    errors.push('evidence.source_text is required');
  }

  if (!frame.evidence.hypothesis_id) {
    errors.push('evidence.hypothesis_id is required');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateEvidence };
