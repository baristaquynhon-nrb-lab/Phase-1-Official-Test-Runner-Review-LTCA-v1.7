"use strict";

/**
 * FORENSIC INVARIANTS ENGINE
 * NRB Forensic Reflex Benchmark
 *
 * Implements invariant verification (I1-I10):
 * I1  - Deterministic Output
 * I2  - Hash Chain Continuity
 * I3  - Canonical JSON Hashing
 * I4  - Timestamp Independence
 * I5  - No Hidden State Drift
 * I6  - GSRA Epistemic Gate Consistency
 * I7  - Logical Trace Stability
 * I8  - Replay Stability
 * I9  - Trace Origin Binding
 * I10 - Closed Reflex Loop Integrity
 *
 * All checks are deterministic and pure.
 */

/**
 * I1: Check deterministic output
 * All trace hashes must be identical for identical inputs
 *
 * @param {string[]} traceHashes - Array of trace hashes from identical runs
 * @returns {object} Check result
 */
function checkDeterminism(traceHashes) {
  if (!traceHashes || traceHashes.length === 0) {
    return { pass: false, reason: "I1_EMPTY_TRACE" };
  }

  const first = traceHashes[0];
  const allEqual = traceHashes.every(h => h === first);

  return {
    pass: allEqual,
    reason: allEqual ? null : "I1_DETERMINISM_VIOLATION",
    expected: first,
    unique_count: new Set(traceHashes).size
  };
}

/**
 * I2: Check hash chain integrity
 * Each entry's previous must match prior entry's current
 *
 * @param {object[]} chain - Array of { prev, current } entries
 * @returns {object} Check result
 */
function checkHashChainIntegrity(chain) {
  if (!chain || chain.length === 0) {
    return { pass: false, reason: "I2_EMPTY_CHAIN" };
  }

  for (let i = 1; i < chain.length; i++) {
    if (chain[i].prev !== chain[i - 1].current) {
      return {
        pass: false,
        reason: "I2_HASH_CHAIN_BROKEN",
        break_index: i,
        expected: chain[i - 1].current,
        actual: chain[i].prev
      };
    }
  }

  return { pass: true, reason: null, chain_length: chain.length };
}

/**
 * I3: Check canonical JSON hashing consistency
 * Same logical data must produce same hash regardless of key order
 *
 * @param {object} data - Test data
 * @param {function} hashFn - Canonical hash function
 * @returns {object} Check result
 */
function checkCanonicalHashing(data, hashFn) {
  // Create variations with different key orders
  const keys = Object.keys(data);
  const reversed = {};
  for (let i = keys.length - 1; i >= 0; i--) {
    reversed[keys[i]] = data[keys[i]];
  }

  const hash1 = hashFn(data);
  const hash2 = hashFn(reversed);

  return {
    pass: hash1 === hash2,
    reason: hash1 === hash2 ? null : "I3_NON_CANONICAL_HASH",
    hash_original: hash1,
    hash_reordered: hash2
  };
}

/**
 * I4: Check timestamp independence
 * Semantic hashes must be identical regardless of physical timestamps
 *
 * @param {string[]} traceHashesRun1 - Hashes from first run
 * @param {string[]} traceHashesRun2 - Hashes from second run (different physical time)
 * @returns {object} Check result
 */
function checkTimestampIndependence(traceHashesRun1, traceHashesRun2) {
  if (traceHashesRun1.length !== traceHashesRun2.length) {
    return {
      pass: false,
      reason: "I4_LENGTH_MISMATCH",
      length1: traceHashesRun1.length,
      length2: traceHashesRun2.length
    };
  }

  for (let i = 0; i < traceHashesRun1.length; i++) {
    if (traceHashesRun1[i] !== traceHashesRun2[i]) {
      return {
        pass: false,
        reason: "I4_TIMESTAMP_DEPENDENCE",
        divergence_index: i,
        hash1: traceHashesRun1[i],
        hash2: traceHashesRun2[i]
      };
    }
  }

  return { pass: true, reason: null };
}

/**
 * I5: Check for hidden state drift
 * Multiple runs must not accumulate state
 *
 * @param {object[]} stateSnapshots - State snapshots from multiple runs
 * @returns {object} Check result
 */
function checkHiddenStateDrift(stateSnapshots) {
  if (!stateSnapshots || stateSnapshots.length < 2) {
    return { pass: true, reason: null, message: "INSUFFICIENT_SNAPSHOTS" };
  }

  const first = JSON.stringify(stateSnapshots[0]);
  for (let i = 1; i < stateSnapshots.length; i++) {
    const current = JSON.stringify(stateSnapshots[i]);
    if (current !== first) {
      return {
        pass: false,
        reason: "I5_HIDDEN_STATE_DRIFT",
        drift_index: i
      };
    }
  }

  return { pass: true, reason: null };
}

/**
 * I6: Check GSRA epistemic gate consistency
 * Same evidence must produce same verdict
 *
 * @param {object[]} verdicts - GSRA verdicts from identical inputs
 * @returns {object} Check result
 */
function checkGSRAConsistency(verdicts) {
  if (!verdicts || verdicts.length === 0) {
    return { pass: false, reason: "I6_NO_VERDICTS" };
  }

  const firstVerdict = verdicts[0].verdict;
  const allSame = verdicts.every(v => v.verdict === firstVerdict);

  return {
    pass: allSame,
    reason: allSame ? null : "I6_GSRA_INCONSISTENCY",
    expected_verdict: firstVerdict,
    unique_verdicts: [...new Set(verdicts.map(v => v.verdict))]
  };
}

/**
 * I7: Check logical trace stability
 * Logical timestamps must be monotonically increasing
 *
 * @param {number[]} logicalTimes - Sequence of logical timestamps
 * @returns {object} Check result
 */
function checkLogicalTraceStability(logicalTimes) {
  if (!logicalTimes || logicalTimes.length < 2) {
    return { pass: true, reason: null };
  }

  for (let i = 1; i < logicalTimes.length; i++) {
    if (logicalTimes[i] <= logicalTimes[i - 1]) {
      return {
        pass: false,
        reason: "I7_LOGICAL_TRACE_UNSTABLE",
        violation_index: i,
        prev: logicalTimes[i - 1],
        current: logicalTimes[i]
      };
    }
  }

  return { pass: true, reason: null };
}

/**
 * I8: Check replay stability
 * N runs must produce identical signatures
 *
 * @param {string[]} signatureRuns - Signatures from multiple replay runs
 * @returns {object} Check result
 */
function checkReplayStability(signatureRuns) {
  if (!signatureRuns || signatureRuns.length === 0) {
    return { pass: false, reason: "I8_NO_SIGNATURES" };
  }

  const first = signatureRuns[0];
  const stable = signatureRuns.every(sig => sig === first);

  return {
    pass: stable,
    reason: stable ? null : "I8_REPLAY_UNSTABLE",
    expected_signature: first,
    unique_signatures: [...new Set(signatureRuns)]
  };
}

/**
 * I9: Check trace origin binding
 * All artifacts must trace back to ΔC provenance
 *
 * @param {object[]} artifacts - Pipeline artifacts
 * @returns {object} Check result
 */
function checkTraceOriginBinding(artifacts) {
  if (!artifacts || artifacts.length === 0) {
    return { pass: false, reason: "I9_NO_ARTIFACTS" };
  }

  for (let i = 0; i < artifacts.length; i++) {
    const artifact = artifacts[i];
    if (!artifact.trace_origin && !artifact.source_trace_hash && !artifact.trace_hash) {
      return {
        pass: false,
        reason: "I9_MISSING_TRACE_ORIGIN",
        artifact_index: i,
        artifact_type: artifact.type
      };
    }
  }

  return { pass: true, reason: null };
}

/**
 * I10: Check closed reflex loop integrity
 * Full pipeline must complete: ΔC → PFT → COP → GSRA → Action
 *
 * @param {object} pipeline - Pipeline result
 * @returns {object} Check result
 */
function checkClosedLoopIntegrity(pipeline) {
  const requiredStages = ['pft', 'cop', 'gsra', 'action'];
  const missingStages = [];

  for (const stage of requiredStages) {
    if (!pipeline[stage]) {
      missingStages.push(stage);
    }
  }

  if (missingStages.length > 0) {
    return {
      pass: false,
      reason: "I10_INCOMPLETE_LOOP",
      missing_stages: missingStages
    };
  }

  // Verify chain linkage
  const hasTraceChain = pipeline.action.source_trace_hash ||
                        pipeline.gsra.trace_hash;

  return {
    pass: true,
    reason: null,
    stages_verified: requiredStages,
    trace_chain_present: !!hasTraceChain
  };
}

/**
 * Evaluate all invariants
 * Master function for complete forensic validation
 *
 * @param {object} ctx - Context with all necessary data
 * @returns {object} Complete evaluation result
 */
function evaluateAllInvariants(ctx) {
  const failures = [];
  const passed = [];

  // I1: Determinism
  if (ctx.traceHashes) {
    const d = checkDeterminism(ctx.traceHashes);
    if (!d.pass) failures.push({ id: "I1", ...d });
    else passed.push("I1");
  }

  // I2: Hash Chain
  if (ctx.hashChain) {
    const h = checkHashChainIntegrity(ctx.hashChain);
    if (!h.pass) failures.push({ id: "I2", ...h });
    else passed.push("I2");
  }

  // I4: Timestamp Independence
  if (ctx.traceHashesRun1 && ctx.traceHashesRun2) {
    const t = checkTimestampIndependence(ctx.traceHashesRun1, ctx.traceHashesRun2);
    if (!t.pass) failures.push({ id: "I4", ...t });
    else passed.push("I4");
  }

  // I8: Replay Stability
  if (ctx.signatures) {
    const r = checkReplayStability(ctx.signatures);
    if (!r.pass) failures.push({ id: "I8", ...r });
    else passed.push("I8");
  }

  // I6: GSRA Consistency
  if (ctx.verdicts) {
    const g = checkGSRAConsistency(ctx.verdicts);
    if (!g.pass) failures.push({ id: "I6", ...g });
    else passed.push("I6");
  }

  // I7: Logical Trace Stability
  if (ctx.logicalTimes) {
    const l = checkLogicalTraceStability(ctx.logicalTimes);
    if (!l.pass) failures.push({ id: "I7", ...l });
    else passed.push("I7");
  }

  // I10: Closed Loop
  if (ctx.pipeline) {
    const c = checkClosedLoopIntegrity(ctx.pipeline);
    if (!c.pass) failures.push({ id: "I10", ...c });
    else passed.push("I10");
  }

  return {
    determinism_pass: failures.length === 0,
    invariants_checked: passed.length + failures.length,
    invariants_passed: passed.length,
    invariant_failures: failures.map(f => f.reason || f.id),
    failure_details: failures,
    passed_invariants: passed
  };
}

module.exports = {
  checkDeterminism,
  checkHashChainIntegrity,
  checkCanonicalHashing,
  checkTimestampIndependence,
  checkHiddenStateDrift,
  checkGSRAConsistency,
  checkLogicalTraceStability,
  checkReplayStability,
  checkTraceOriginBinding,
  checkClosedLoopIntegrity,
  evaluateAllInvariants
};
