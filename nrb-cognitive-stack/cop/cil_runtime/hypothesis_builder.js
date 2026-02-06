'use strict';

/**
 * HYPOTHESIS_BUILDER_v1.0 — Builds structured hypotheses from potential sets.
 */

function buildHypothesis(potentialSets) {
  const hypotheses = [];

  // Build primary hypothesis from highest-confidence potentials
  const primary = {
    id: 'H1',
    tokens: potentialSets.map(ps => ({
      token: ps.token.raw,
      selected: ps.potentials[0]
    })),
    confidence: 0,
    intent: null
  };

  // Calculate aggregate confidence
  const confidences = primary.tokens
    .map(t => t.selected.confidence || 0.1)
    .filter(c => typeof c === 'number');
  primary.confidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0.1;

  hypotheses.push(primary);
  return hypotheses;
}

function rankHypotheses(hypotheses) {
  return hypotheses.sort((a, b) => b.confidence - a.confidence);
}

module.exports = { buildHypothesis, rankHypotheses };
