'use strict';

/**
 * Coherence Gate — Ensures coherence of law evaluation results.
 */

function checkCoherence(evaluationResults) {
  const issues = [];

  // Check for contradictory verdicts
  const verdicts = evaluationResults.triggered.map(r => r.verdict);
  const hasAllow = verdicts.includes('ALLOW');
  const hasBlock = verdicts.includes('BLOCK');

  if (hasAllow && hasBlock) {
    issues.push({
      type: 'CONTRADICTION',
      message: 'Both ALLOW and BLOCK verdicts triggered',
      resolution: 'BLOCK takes priority'
    });
  }

  return {
    coherent: issues.length === 0,
    issues,
    final_verdict: evaluationResults.final_verdict
  };
}

module.exports = { checkCoherence };
