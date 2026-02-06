'use strict';

/**
 * CONSTRAINT_EVALUATOR_v1.0 — Applies linguistic and semantic constraints.
 */

function evaluateConstraints(hypotheses, urgencyCues) {
  return hypotheses.map(hypothesis => {
    const evaluated = { ...hypothesis };

    // Check for urgency signals
    const tokens = hypothesis.tokens.map(t => t.token.toLowerCase());
    let urgencyLevel = 0;

    if (urgencyCues) {
      for (const cue of urgencyCues) {
        if (tokens.some(t => t.includes(cue.pattern))) {
          urgencyLevel = Math.max(urgencyLevel, cue.level);
        }
      }
    }

    evaluated.urgency = urgencyLevel;
    evaluated.constraints_applied = true;
    return evaluated;
  });
}

function filterIncompatible(hypotheses) {
  return hypotheses.filter(h => h.confidence > 0.05);
}

module.exports = { evaluateConstraints, filterIncompatible };
