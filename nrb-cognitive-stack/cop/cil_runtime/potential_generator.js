'use strict';

/**
 * POTENTIAL_GENERATOR_v1.0 — Generates candidate interpretations for tokens.
 */

function generatePotentials(token, lexicon, mweDict) {
  const potentials = [];

  // Look up in lexicon
  if (lexicon && lexicon[token.raw]) {
    const entries = lexicon[token.raw];
    entries.forEach(entry => {
      potentials.push({
        token: token.raw,
        sense: entry.sense,
        pos: entry.pos,
        confidence: entry.confidence || 0.5,
        source: 'lexicon'
      });
    });
  }

  // Check for MWE matches (will be resolved at hypothesis level)
  if (mweDict && mweDict[token.raw]) {
    potentials.push({
      token: token.raw,
      mwe_candidate: true,
      mwe_patterns: mweDict[token.raw],
      source: 'mwe'
    });
  }

  // Default potential if nothing found
  if (potentials.length === 0) {
    potentials.push({
      token: token.raw,
      sense: 'UNKNOWN',
      pos: 'UNKNOWN',
      confidence: 0.1,
      source: 'default'
    });
  }

  return potentials;
}

function generateAllPotentials(tokens, lexicon, mweDict) {
  return tokens.map(token => ({
    token,
    potentials: generatePotentials(token, lexicon, mweDict)
  }));
}

module.exports = { generatePotentials, generateAllPotentials };
