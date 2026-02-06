'use strict';

const { sha256 } = require('../crypto/hash_utils');
const { canonicalJson } = require('../crypto/canonical_json');

/**
 * Determinism Checker — Verifies deterministic behavior of pipeline components.
 */

function checkDeterminism(fn, input, iterations) {
  iterations = iterations || 10;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    const result = fn(input);
    const hash = sha256(canonicalJson(result));
    results.push(hash);
  }

  const allSame = results.every(h => h === results[0]);
  return {
    deterministic: allSame,
    hash: results[0],
    iterations,
    unique_hashes: [...new Set(results)].length
  };
}

module.exports = { checkDeterminism };
