'use strict';

/**
 * Urgency Validator — Validates urgency level assignments in Meaning Frames.
 */

function validateUrgency(frame) {
  const errors = [];

  if (typeof frame.urgency !== 'number') {
    errors.push('urgency must be a number');
    return { valid: false, errors };
  }

  if (frame.urgency < 0 || frame.urgency > 5) {
    errors.push('urgency must be between 0 and 5');
  }

  if (!Number.isInteger(frame.urgency)) {
    errors.push('urgency must be an integer');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateUrgency };
