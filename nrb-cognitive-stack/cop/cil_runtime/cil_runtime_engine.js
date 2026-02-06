'use strict';

/**
 * CIL Runtime Engine — Main runtime coordinator for the COP L1 pipeline.
 *
 * Pipeline: Tokenizer → Potential Generator → Hypothesis Builder
 *           → Constraint Evaluator → Meaning Frame Builder
 */

const { tokenize } = require('./tokenizer');
const { generateAllPotentials } = require('./potential_generator');
const { buildHypothesis, rankHypotheses } = require('./hypothesis_builder');
const { evaluateConstraints, filterIncompatible } = require('./constraint_evaluator');
const { buildMeaningFrame } = require('./meaning_frame_builder');

function runPipeline(input, options = {}) {
  const { lexicon, mweDict, urgencyCues } = options;

  // Stage 1: Tokenize
  const tokenized = tokenize(input);

  // Stage 2: Generate potentials
  const potentials = generateAllPotentials(tokenized.tokens, lexicon, mweDict);

  // Stage 3: Build hypotheses
  const hypotheses = buildHypothesis(potentials);
  const ranked = rankHypotheses(hypotheses);

  // Stage 4: Evaluate constraints
  const evaluated = evaluateConstraints(ranked, urgencyCues);
  const filtered = filterIncompatible(evaluated);

  // Stage 5: Build meaning frame
  if (filtered.length === 0) {
    return buildMeaningFrame(
      { id: 'H0', tokens: [], confidence: 0, intent: 'UNKNOWN_INTENT', urgency: 0 },
      { language: tokenized.language, original: input }
    );
  }

  return buildMeaningFrame(filtered[0], {
    language: tokenized.language,
    original: input
  });
}

module.exports = { runPipeline };
