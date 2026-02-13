/**
 * LAW-005 DETERMINISM ENFORCEMENT
 * LTCA-NRBPL Cognitive Operating System
 *
 * Specific enforcement module for LAW-005: Determinism
 *
 * "Same inputs must produce same outputs. No randomness in core operations."
 *
 * This module provides:
 * - Determinism verification utilities
 * - Hash stability checks
 * - Replay verification
 * - Randomness detection
 */

const { canonicalHash, canonicalSerialize } = require('../core/canonical_hash');
const { recordViolation, assertCompliance } = require('./law_engine');

/**
 * Forbidden non-deterministic operations
 */
const FORBIDDEN_OPERATIONS = [
  'Math.random',
  'Date.now',
  'new Date()',
  'crypto.randomBytes',
  'uuid.v4',
  'performance.now'
];

/**
 * Verify determinism of a function
 * Runs the function multiple times with same input and checks for identical output
 *
 * @param {Function} fn - Function to test
 * @param {any} input - Input to test with
 * @param {number} iterations - Number of iterations (default 3)
 * @returns {object} Verification result
 */
function verifyDeterminism(fn, input, iterations = 3) {
  const results = [];
  const hashes = [];

  for (let i = 0; i < iterations; i++) {
    const result = fn(input);
    const hash = canonicalHash(result);

    results.push(result);
    hashes.push(hash);
  }

  // Check all hashes are identical
  const uniqueHashes = [...new Set(hashes)];
  const isDeterministic = uniqueHashes.length === 1;

  return {
    deterministic: isDeterministic,
    iterations: iterations,
    unique_outputs: uniqueHashes.length,
    hashes: hashes,
    canonical_hash: isDeterministic ? hashes[0] : null,
    violation: isDeterministic ? null : {
      law: 'LAW-005',
      message: `Function produced ${uniqueHashes.length} different outputs for same input`
    }
  };
}

/**
 * Verify hash stability
 * Checks that hashing the same data always produces the same hash
 *
 * @param {any} data - Data to hash
 * @param {number} iterations - Number of iterations
 * @returns {object} Verification result
 */
function verifyHashStability(data, iterations = 5) {
  const hashes = [];

  for (let i = 0; i < iterations; i++) {
    hashes.push(canonicalHash(data));
  }

  const uniqueHashes = [...new Set(hashes)];
  const isStable = uniqueHashes.length === 1;

  return {
    stable: isStable,
    iterations: iterations,
    hash: isStable ? hashes[0] : null,
    all_hashes: hashes,
    violation: isStable ? null : {
      law: 'LAW-005',
      message: 'Hash is not stable across iterations'
    }
  };
}

/**
 * Verify replay produces identical state
 * Critical for LAW-005 compliance
 *
 * @param {Function} pipeline - Pipeline function to test
 * @param {any} initialState - Starting state
 * @param {any[]} events - Events to replay
 * @returns {object} Replay verification result
 */
function verifyReplayDeterminism(pipeline, initialState, events) {
  // First run
  const result1 = runPipeline(pipeline, initialState, events);

  // Second run (replay)
  const result2 = runPipeline(pipeline, initialState, events);

  const statesMatch = result1.finalStateHash === result2.finalStateHash;
  const intermediateMatch = result1.intermediateHashes.every(
    (hash, idx) => hash === result2.intermediateHashes[idx]
  );

  return {
    deterministic: statesMatch && intermediateMatch,
    final_state_match: statesMatch,
    intermediate_match: intermediateMatch,
    run1_hash: result1.finalStateHash,
    run2_hash: result2.finalStateHash,
    events_processed: events.length,
    violation: (statesMatch && intermediateMatch) ? null : {
      law: 'LAW-005',
      message: 'Replay produced different state',
      details: {
        final_match: statesMatch,
        intermediate_match: intermediateMatch
      }
    }
  };
}

/**
 * Run pipeline and collect hashes
 */
function runPipeline(pipeline, initialState, events) {
  let state = JSON.parse(JSON.stringify(initialState));
  const intermediateHashes = [];

  for (const event of events) {
    state = pipeline(state, event);
    intermediateHashes.push(canonicalHash(state));
  }

  return {
    finalState: state,
    finalStateHash: canonicalHash(state),
    intermediateHashes
  };
}

/**
 * Check serialization determinism
 * Verifies that object serialization is consistent
 *
 * @param {object} obj - Object to check
 * @returns {object} Check result
 */
function checkSerializationDeterminism(obj) {
  const serializations = [];

  for (let i = 0; i < 3; i++) {
    serializations.push(canonicalSerialize(obj));
  }

  const unique = [...new Set(serializations)];
  const isDeterministic = unique.length === 1;

  return {
    deterministic: isDeterministic,
    serialization: isDeterministic ? serializations[0] : null,
    unique_count: unique.length
  };
}

/**
 * Assert deterministic hash
 * Throws if hash doesn't match expected
 *
 * @param {any} data - Data to hash
 * @param {string} expectedHash - Expected hash value
 * @param {string} context - Context for error message
 */
function assertDeterministicHash(data, expectedHash, context = 'data') {
  const actualHash = canonicalHash(data);

  assertCompliance(
    'LAW-005',
    actualHash === expectedHash,
    'DETERMINISM_CHECK',
    `Hash mismatch for ${context}: expected ${expectedHash}, got ${actualHash}`,
    { expected: expectedHash, actual: actualHash }
  );
}

/**
 * Create deterministic ID from content
 * No randomness, purely content-based
 *
 * @param {string} prefix - ID prefix
 * @param {any} content - Content to hash
 * @returns {string} Deterministic ID
 */
function deterministicId(prefix, content) {
  const hash = canonicalHash(content);
  return `${prefix}_${hash.substring(0, 16)}`;
}

/**
 * Wrap function to enforce determinism
 * Records violation if function is non-deterministic
 *
 * @param {Function} fn - Function to wrap
 * @param {string} fnName - Function name for logging
 * @returns {Function} Wrapped function
 */
function enforceDeterminism(fn, fnName) {
  let lastInput = null;
  let lastInputHash = null;
  let lastOutput = null;
  let lastOutputHash = null;

  return function(...args) {
    const inputHash = canonicalHash(args);

    // Check if same input
    if (inputHash === lastInputHash) {
      const result = fn.apply(this, args);
      const outputHash = canonicalHash(result);

      // Verify same output
      if (outputHash !== lastOutputHash) {
        recordViolation(
          'LAW-005',
          fnName,
          'Function produced different output for identical input',
          {
            input_hash: inputHash,
            previous_output_hash: lastOutputHash,
            current_output_hash: outputHash
          }
        );
      }

      return result;
    }

    // New input, execute and cache
    const result = fn.apply(this, args);

    lastInputHash = inputHash;
    lastOutput = result;
    lastOutputHash = canonicalHash(result);

    return result;
  };
}

/**
 * Determinism test suite for a module
 * @param {object} module - Module to test
 * @param {object} testCases - Test cases { fnName: [input, expectedOutputHash] }
 * @returns {object} Test results
 */
function runDeterminismTests(module, testCases) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  for (const [fnName, cases] of Object.entries(testCases)) {
    const fn = module[fnName];
    if (typeof fn !== 'function') {
      results.tests.push({
        function: fnName,
        status: 'SKIP',
        reason: 'Not a function'
      });
      continue;
    }

    for (const [input, expectedHash] of cases) {
      const verification = verifyDeterminism(fn, input);

      if (verification.deterministic) {
        if (expectedHash && verification.canonical_hash !== expectedHash) {
          results.failed++;
          results.tests.push({
            function: fnName,
            status: 'FAIL',
            reason: 'Hash mismatch',
            expected: expectedHash,
            actual: verification.canonical_hash
          });
        } else {
          results.passed++;
          results.tests.push({
            function: fnName,
            status: 'PASS',
            hash: verification.canonical_hash
          });
        }
      } else {
        results.failed++;
        results.tests.push({
          function: fnName,
          status: 'FAIL',
          reason: 'Non-deterministic',
          details: verification
        });
      }
    }
  }

  return results;
}

module.exports = {
  FORBIDDEN_OPERATIONS,
  verifyDeterminism,
  verifyHashStability,
  verifyReplayDeterminism,
  checkSerializationDeterminism,
  assertDeterministicHash,
  deterministicId,
  enforceDeterminism,
  runDeterminismTests
};
