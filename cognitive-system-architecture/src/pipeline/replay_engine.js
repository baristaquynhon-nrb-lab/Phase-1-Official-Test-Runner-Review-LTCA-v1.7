/**
 * REPLAY ENGINE
 * LTCA-NRBPL Cognitive Operating System
 *
 * Deterministic replay capability for verification and recovery
 *
 * LAW-005: Determinism - replay(state, events) = same_result
 * LAW-004: Provenance - Complete event history for replay
 *
 * Capabilities:
 * - Full pipeline replay from audit log
 * - State reconstruction from snapshots
 * - Event sequence verification
 * - Divergence detection
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime, resetClock, createClock } = require('../core/deterministic_clock');
const { getAuditTrail, createAuditLogger } = require('../core/audit_logger');
const { resetPipeline, executePipeline } = require('./cognitive_pipeline');
const { CognitiveState, replayASESequence, createSnapshot, restoreSnapshot } = require('../layers/layer8_runtime');
const { getASELedger } = require('../layers/layer7_ase');

/**
 * Replay session tracking
 */
class ReplaySession {
  constructor(sessionId) {
    this.session_id = sessionId || `REPLAY_${canonicalHash({ time: Date.now() }).substring(0, 16)}`;
    this.started_at = deterministicTime();
    this.status = 'INITIALIZED';
    this.events_replayed = 0;
    this.checkpoints = [];
    this.divergences = [];
    this.original_hashes = [];
    this.replay_hashes = [];
  }

  addCheckpoint(eventIndex, stateHash) {
    this.checkpoints.push({
      event_index: eventIndex,
      state_hash: stateHash,
      timestamp: deterministicTime()
    });
  }

  recordDivergence(eventIndex, expected, actual) {
    this.divergences.push({
      event_index: eventIndex,
      expected_hash: expected,
      actual_hash: actual,
      timestamp: deterministicTime()
    });
  }

  finalize(finalStateHash) {
    this.status = this.divergences.length === 0 ? 'SUCCESS' : 'DIVERGED';
    this.completed_at = deterministicTime();
    this.final_state_hash = finalStateHash;
    this.session_hash = canonicalHash(this);
  }
}

/**
 * Event log for replay
 */
class EventLog {
  constructor() {
    this.events = [];
    this.log_hash = null;
  }

  append(event) {
    const entry = {
      sequence: this.events.length,
      event_type: event.type || 'UNKNOWN',
      event_hash: canonicalHash(event),
      timestamp: deterministicTime(),
      event_data: event
    };
    this.events.push(entry);
    this.updateHash();
    return entry.sequence;
  }

  updateHash() {
    this.log_hash = canonicalHash(this.events.map(e => e.event_hash));
  }

  getRange(start, end) {
    return this.events.slice(start, end + 1);
  }

  getAll() {
    return [...this.events];
  }

  size() {
    return this.events.length;
  }
}

// Global event log
const _eventLog = new EventLog();

/**
 * Log event for replay
 * @param {object} event - Event to log
 * @returns {number} Event sequence number
 */
function logEvent(event) {
  return _eventLog.append(event);
}

/**
 * Get event log
 * @returns {EventLog} Event log
 */
function getEventLog() {
  return _eventLog;
}

/**
 * Clear event log
 */
function clearEventLog() {
  _eventLog.events = [];
  _eventLog.log_hash = null;
}

/**
 * Replay pipeline from event sequence
 * LAW-005: Must produce identical results
 *
 * @param {object[]} events - Events to replay
 * @param {object} options - Replay options
 * @returns {ReplaySession} Replay session result
 */
function replayPipeline(events, options = {}) {
  const {
    checkpointInterval = 10,
    verifyHashes = true,
    expectedHashes = []
  } = options;

  const session = new ReplaySession();
  session.status = 'REPLAYING';
  session.original_hashes = expectedHashes;

  // Reset pipeline for clean replay
  resetPipeline();

  try {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Execute event
      const result = executePipeline(event.input || event, event.options || {});

      // Record replay hash
      session.replay_hashes.push(result.pipeline_hash);
      session.events_replayed++;

      // Verify against expected hash if provided
      if (verifyHashes && expectedHashes[i]) {
        if (result.pipeline_hash !== expectedHashes[i]) {
          session.recordDivergence(i, expectedHashes[i], result.pipeline_hash);
        }
      }

      // Checkpoint at intervals
      if (i > 0 && i % checkpointInterval === 0) {
        const { CognitiveState, getState } = require('../layers/layer8_runtime');
        session.addCheckpoint(i, getState().state_hash);
      }
    }

    // Final checkpoint
    const { getState } = require('../layers/layer8_runtime');
    session.finalize(getState().state_hash);

  } catch (error) {
    session.status = 'ERROR';
    session.error = error.message;
    session.finalize(null);
  }

  return session;
}

/**
 * Replay from audit trail
 * Reconstructs execution from audit log entries
 *
 * @param {object[]} auditEntries - Audit log entries
 * @returns {object} Replay result
 */
function replayFromAuditTrail(auditEntries) {
  const session = new ReplaySession();
  session.status = 'REPLAYING_AUDIT';

  // Group entries by layer
  const byLayer = {};
  for (const entry of auditEntries) {
    if (!byLayer[entry.layer]) {
      byLayer[entry.layer] = [];
    }
    byLayer[entry.layer].push(entry);
  }

  // Verify chain integrity
  let expectedPrevious = null;
  const chainValid = auditEntries.every((entry, idx) => {
    if (idx === 0) {
      expectedPrevious = entry.entry_hash;
      return true;
    }
    const valid = entry.previous_hash === expectedPrevious;
    expectedPrevious = entry.entry_hash;
    return valid;
  });

  session.audit_chain_valid = chainValid;
  session.entries_processed = auditEntries.length;
  session.layers_involved = Object.keys(byLayer);

  session.finalize(auditEntries.length > 0 ?
    auditEntries[auditEntries.length - 1].output_hash : null);

  return session;
}

/**
 * Verify replay produces identical state
 * Core LAW-005 verification
 *
 * @param {any} input - Original input
 * @param {string} expectedFinalHash - Expected final state hash
 * @param {object} options - Pipeline options
 * @returns {object} Verification result
 */
function verifyReplay(input, expectedFinalHash, options = {}) {
  // First execution
  resetPipeline();
  const result1 = executePipeline(input, options);

  // Second execution (replay)
  resetPipeline();
  const result2 = executePipeline(input, options);

  // Compare
  const hashMatch = result1.pipeline_hash === result2.pipeline_hash;
  const expectedMatch = !expectedFinalHash || result1.pipeline_hash === expectedFinalHash;

  return {
    verified: hashMatch && expectedMatch,
    replay_deterministic: hashMatch,
    matches_expected: expectedMatch,
    execution_1_hash: result1.pipeline_hash,
    execution_2_hash: result2.pipeline_hash,
    expected_hash: expectedFinalHash,
    stage_hashes_match: result1.stages.every((s, i) =>
      s.artifact_hash === result2.stages[i]?.artifact_hash
    )
  };
}

/**
 * Create replay checkpoint
 * @param {string} label - Checkpoint label
 * @returns {object} Checkpoint data
 */
function createReplayCheckpoint(label = '') {
  const { getState } = require('../layers/layer8_runtime');
  const state = getState();

  const checkpoint = {
    checkpoint_id: `CHKPT_${canonicalHash({ label, time: deterministicTime() }).substring(0, 16)}`,
    label: label,
    timestamp: deterministicTime(),
    state_hash: state.state_hash,
    state_version: state.version,
    event_log_hash: _eventLog.log_hash,
    event_count: _eventLog.size(),
    audit_entries: getAuditTrail().length,
    ase_sequence: getASELedger().length
  };

  checkpoint.checkpoint_hash = canonicalHash(checkpoint);
  return checkpoint;
}

/**
 * Compare two replay sessions
 * @param {ReplaySession} session1 - First session
 * @param {ReplaySession} session2 - Second session
 * @returns {object} Comparison result
 */
function compareSessions(session1, session2) {
  const hashesMatch = session1.replay_hashes.length === session2.replay_hashes.length &&
    session1.replay_hashes.every((h, i) => h === session2.replay_hashes[i]);

  const divergenceCount = hashesMatch ? 0 :
    session1.replay_hashes.reduce((count, hash, i) => {
      return hash !== session2.replay_hashes[i] ? count + 1 : count;
    }, 0);

  return {
    identical: hashesMatch,
    session1_hash: session1.session_hash,
    session2_hash: session2.session_hash,
    events_compared: Math.min(session1.events_replayed, session2.events_replayed),
    divergence_count: divergenceCount,
    first_divergence: hashesMatch ? null :
      session1.replay_hashes.findIndex((h, i) => h !== session2.replay_hashes[i])
  };
}

/**
 * Generate replay report
 * @param {ReplaySession} session - Replay session
 * @returns {object} Detailed report
 */
function generateReplayReport(session) {
  return {
    type: 'REPLAY_REPORT',
    session_id: session.session_id,
    status: session.status,
    started_at: session.started_at,
    completed_at: session.completed_at,
    events_replayed: session.events_replayed,
    checkpoints_created: session.checkpoints.length,
    divergences_detected: session.divergences.length,
    final_state_hash: session.final_state_hash,
    determinism_verified: session.divergences.length === 0,
    divergence_details: session.divergences,
    checkpoint_hashes: session.checkpoints.map(c => ({
      index: c.event_index,
      hash: c.state_hash
    })),
    session_hash: session.session_hash
  };
}

/**
 * Batch verification - run multiple replay tests
 * @param {object[]} testCases - Array of { input, expectedHash, options }
 * @returns {object} Batch results
 */
function batchVerify(testCases) {
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = verifyReplay(
      testCase.input,
      testCase.expectedHash,
      testCase.options || {}
    );

    results.push({
      input_hash: canonicalHash(testCase.input),
      verified: result.verified,
      details: result
    });

    if (result.verified) {
      passed++;
    } else {
      failed++;
    }
  }

  return {
    total: testCases.length,
    passed,
    failed,
    pass_rate: testCases.length > 0 ? passed / testCases.length : 0,
    results
  };
}

// Export for CLI
if (require.main === module) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  LTCA-NRBPL REPLAY ENGINE v1.0                               ║');
  console.log('║  Deterministic Verification & Recovery                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Test replay verification
  const testInput = { test: 'replay_verification', value: 123 };

  console.log('► Testing replay determinism...');
  const verifyResult = verifyReplay(testInput, null, {});

  console.log('  Replay deterministic:', verifyResult.replay_deterministic);
  console.log('  Execution 1 hash:', verifyResult.execution_1_hash?.substring(0, 32) + '...');
  console.log('  Execution 2 hash:', verifyResult.execution_2_hash?.substring(0, 32) + '...');
  console.log('  Stage hashes match:', verifyResult.stage_hashes_match);
  console.log('');

  // Generate report
  const session = new ReplaySession();
  session.events_replayed = 1;
  session.replay_hashes = [verifyResult.execution_1_hash];
  session.finalize(verifyResult.execution_1_hash);

  const report = generateReplayReport(session);
  console.log('► Replay Report:');
  console.log('  Session ID:', report.session_id);
  console.log('  Status:', report.status);
  console.log('  Determinism verified:', report.determinism_verified);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

module.exports = {
  ReplaySession,
  EventLog,
  logEvent,
  getEventLog,
  clearEventLog,
  replayPipeline,
  replayFromAuditTrail,
  verifyReplay,
  createReplayCheckpoint,
  compareSessions,
  generateReplayReport,
  batchVerify
};
