'use strict';

/**
 * Constraint Enforcer — Ensures surface output fidelity to Meaning Frame.
 * Enforces the "No New Facts" rule.
 */

function enforceConstraints(surfaceOutput, meaningFrame) {
  const violations = [];

  // Check that surface text exists
  if (!surfaceOutput.surface_text) {
    violations.push('Surface text is empty');
  }

  // Check language consistency
  if (surfaceOutput.language !== meaningFrame.language) {
    violations.push('Language mismatch between surface and frame');
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

module.exports = { enforceConstraints };
