/**
 * LAYER VIII: COGNITIVE RUNTIME (CR)
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: State execution and persistence
 * Input: ASE (Authorized State Event) from Layer VII
 * Output: State transitions, Actions, Feedback
 *
 * THE BRAIN - Executes cognitive state transitions
 *
 * LAW-005: Determinism - State transitions are deterministic
 * LAW-004: Provenance - Complete audit trail
 * LAW-007: Authority - Only executes authorized ASEs
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');
const { ASEStatus } = require('./layer7_ase');

/**
 * Cognitive State structure
 */
class CognitiveState {
  constructor(initialState = {}) {
    // LAW-005: Use deterministic state_id generation
    const timestamp = deterministicTime();
    this.state_id = canonicalHash({ init: 'COGNITIVE_STATE', timestamp: timestamp }).substring(0, 16);
    this.version = 0;
    this.created_at = timestamp;
    this.updated_at = this.created_at;

    // Core state components
    this.cognitive = {
      attention_focus: null,
      working_memory: [],
      processing_context: {}
    };

    this.knowledge = {
      facts: {},
      beliefs: {},
      rules: {}
    };

    this.goals = {
      active: [],
      completed: [],
      priorities: {}
    };

    this.memory = {
      episodic: [],
      semantic: {}
    };

    this.actions = {
      pending: [],
      completed: []
    };

    // Merge initial state
    Object.assign(this, initialState);

    // State hash
    this.state_hash = this.computeHash();
  }

  computeHash() {
    return canonicalHash({
      version: this.version,
      cognitive: this.cognitive,
      knowledge: this.knowledge,
      goals: this.goals
    });
  }

  clone() {
    const cloned = new CognitiveState();
    cloned.state_id = this.state_id;
    cloned.version = this.version;
    cloned.created_at = this.created_at;
    cloned.updated_at = this.updated_at;
    cloned.cognitive = JSON.parse(JSON.stringify(this.cognitive));
    cloned.knowledge = JSON.parse(JSON.stringify(this.knowledge));
    cloned.goals = JSON.parse(JSON.stringify(this.goals));
    cloned.memory = JSON.parse(JSON.stringify(this.memory));
    cloned.actions = JSON.parse(JSON.stringify(this.actions));
    cloned.state_hash = cloned.computeHash();
    return cloned;
  }
}

// Global cognitive state
let _cognitiveState = new CognitiveState();

// Execution history for replay
const _executionHistory = [];

// Snapshots for recovery
const _snapshots = new Map();

/**
 * Reset runtime state (for testing/replay)
 */
function resetRuntime() {
  _cognitiveState = new CognitiveState();
  _executionHistory.length = 0;
  _snapshots.clear();
}

/**
 * Get current cognitive state
 * @returns {CognitiveState} Current state
 */
function getState() {
  return _cognitiveState;
}

/**
 * Execute ASE against cognitive state
 * LAW-005: Deterministic state transition
 * LAW-007: Requires committed ASE
 *
 * @param {object} ase - ASE from Layer VII
 * @returns {object} Execution result
 */
function executeCognitiveState(ase) {
  // ═══════════════════════════════════════════════════════════
  // LAW-007: VERIFY AUTHORIZATION
  // ═══════════════════════════════════════════════════════════
  if (!ase || ase.type !== 'ASE') {
    throw new Error('LAYER_VIII_ERROR: Invalid ASE input');
  }

  if (ase.status !== ASEStatus.COMMITTED) {
    throw new Error('LAYER_VIII_ERROR: ASE must be COMMITTED before execution - LAW-007');
  }

  if (!ase.authorization || !ase.authorization.authorization_hash) {
    throw new Error('LAYER_VIII_ERROR: ASE missing authorization - LAW-007 violation');
  }

  const timestamp = deterministicTime();
  const previousStateHash = _cognitiveState.state_hash;

  // ═══════════════════════════════════════════════════════════
  // CHECK PRECONDITIONS
  // ═══════════════════════════════════════════════════════════
  const preconditionResult = checkPreconditions(ase.event_payload.preconditions, _cognitiveState);
  if (!preconditionResult.satisfied) {
    return {
      type: 'EXECUTION_RESULT',
      ase_id: ase.ase_id,
      success: false,
      error: 'PRECONDITION_FAILED',
      details: preconditionResult,
      timestamp: timestamp
    };
  }

  // ═══════════════════════════════════════════════════════════
  // EXECUTE STATE TRANSITION (DETERMINISTIC)
  // ═══════════════════════════════════════════════════════════
  const newState = deterministicTransition(_cognitiveState, ase);

  // ═══════════════════════════════════════════════════════════
  // CHECK POSTCONDITIONS
  // ═══════════════════════════════════════════════════════════
  const postconditionResult = checkPostconditions(ase.event_payload.postconditions, newState);
  if (!postconditionResult.satisfied) {
    // Rollback - don't apply state change
    return {
      type: 'EXECUTION_RESULT',
      ase_id: ase.ase_id,
      success: false,
      error: 'POSTCONDITION_FAILED',
      details: postconditionResult,
      timestamp: timestamp
    };
  }

  // ═══════════════════════════════════════════════════════════
  // COMMIT STATE CHANGE
  // ═══════════════════════════════════════════════════════════
  _cognitiveState = newState;

  // Record execution
  const executionRecord = {
    ase_id: ase.ase_id,
    ase_hash: ase.ase_hash,
    sequence: ase.sequence_number,
    operation: ase.event_payload.operation,
    previous_state_hash: previousStateHash,
    new_state_hash: newState.state_hash,
    executed_at: timestamp
  };
  _executionHistory.push(executionRecord);

  // Create audit hash
  const auditHash = canonicalHash({
    state: newState.state_hash,
    ase: ase.ase_hash,
    timestamp: timestamp
  });

  // Audit log entry
  auditLog({
    layer: 'LAYER_VIII_RUNTIME',
    operation: 'EXECUTE_STATE',
    input_hash: ase.ase_hash,
    output_hash: newState.state_hash,
    metadata: {
      ase_id: ase.ase_id,
      operation: ase.event_payload.operation,
      state_version: newState.version,
      previous_state_hash: previousStateHash
    }
  });

  return {
    type: 'EXECUTION_RESULT',
    ase_id: ase.ase_id,
    success: true,
    new_state: {
      state_hash: newState.state_hash,
      version: newState.version
    },
    previous_state_hash: previousStateHash,
    audit_hash: auditHash,
    persisted: true,
    timestamp: timestamp
  };
}

/**
 * Deterministic state transition
 * LAW-005: Same input state + ASE = same output state
 *
 * @param {CognitiveState} state - Current state
 * @param {object} ase - ASE to apply
 * @returns {CognitiveState} New state
 */
function deterministicTransition(state, ase) {
  const newState = state.clone();
  const payload = ase.event_payload;

  switch (payload.operation) {
    case 'CREATE':
      applyCreateOperation(newState, payload);
      break;

    case 'UPDATE':
      applyUpdateOperation(newState, payload);
      break;

    case 'DELETE':
      applyDeleteOperation(newState, payload);
      break;

    case 'COMPUTE':
      applyComputeOperation(newState, payload);
      break;

    case 'TRANSITION':
      applyTransitionOperation(newState, payload);
      break;

    default:
      throw new Error(`LAYER_VIII_ERROR: Unknown operation ${payload.operation}`);
  }

  // Update metadata
  newState.version++;
  newState.updated_at = deterministicTime();
  newState.state_hash = newState.computeHash();

  return newState;
}

/**
 * Apply CREATE operation
 */
function applyCreateOperation(state, payload) {
  const target = payload.target_state;
  const data = payload.data;

  if (target === 'knowledge.facts' && data.key && data.value) {
    state.knowledge.facts[data.key] = data.value;
  } else if (target === 'knowledge.beliefs' && data.key && data.value) {
    state.knowledge.beliefs[data.key] = data.value;
  } else if (target === 'goals.active' && data.goal) {
    state.goals.active.push(data.goal);
  } else if (target === 'memory.episodic' && data.episode) {
    state.memory.episodic.push(data.episode);
  } else if (target === 'cognitive.working_memory' && data.item) {
    state.cognitive.working_memory.push(data.item);
  }
}

/**
 * Apply UPDATE operation
 */
function applyUpdateOperation(state, payload) {
  const target = payload.target_state;
  const data = payload.data;

  if (target === 'cognitive.attention_focus') {
    state.cognitive.attention_focus = data.focus;
  } else if (target === 'cognitive.processing_context') {
    Object.assign(state.cognitive.processing_context, data);
  } else if (target === 'goals.priorities' && data.goal_id && data.priority) {
    state.goals.priorities[data.goal_id] = data.priority;
  }
}

/**
 * Apply DELETE operation
 */
function applyDeleteOperation(state, payload) {
  const target = payload.target_state;
  const data = payload.data;

  if (target === 'knowledge.facts' && data.key) {
    delete state.knowledge.facts[data.key];
  } else if (target === 'goals.active' && data.goal_id) {
    state.goals.active = state.goals.active.filter(g => g.id !== data.goal_id);
  } else if (target === 'cognitive.working_memory' && data.index !== undefined) {
    state.cognitive.working_memory.splice(data.index, 1);
  }
}

/**
 * Apply COMPUTE operation (derived state)
 */
function applyComputeOperation(state, payload) {
  const data = payload.data;

  if (data.computation === 'goal_priority_sort') {
    state.goals.active.sort((a, b) => {
      const pa = state.goals.priorities[a.id] || 0;
      const pb = state.goals.priorities[b.id] || 0;
      return pb - pa;
    });
  }
}

/**
 * Apply TRANSITION operation (goal completion, etc.)
 */
function applyTransitionOperation(state, payload) {
  const data = payload.data;

  if (data.transition === 'complete_goal' && data.goal_id) {
    const goalIdx = state.goals.active.findIndex(g => g.id === data.goal_id);
    if (goalIdx >= 0) {
      const [goal] = state.goals.active.splice(goalIdx, 1);
      goal.completed_at = deterministicTime();
      state.goals.completed.push(goal);
    }
  }
}

/**
 * Check preconditions against state
 */
function checkPreconditions(preconditions, state) {
  if (!preconditions || preconditions.length === 0) {
    return { satisfied: true, checks: [] };
  }

  const checks = preconditions.map(cond => {
    // Simple condition checking
    let result = { condition: cond, satisfied: true };

    if (cond.type === 'state_exists' && cond.path) {
      const value = getNestedValue(state, cond.path);
      result.satisfied = value !== undefined;
    } else if (cond.type === 'state_equals' && cond.path && cond.value !== undefined) {
      const value = getNestedValue(state, cond.path);
      result.satisfied = value === cond.value;
    }

    return result;
  });

  return {
    satisfied: checks.every(c => c.satisfied),
    checks
  };
}

/**
 * Check postconditions against state
 */
function checkPostconditions(postconditions, state) {
  if (!postconditions || postconditions.length === 0) {
    return { satisfied: true, checks: [] };
  }

  return checkPreconditions(postconditions, state);
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr && curr[key], obj);
}

/**
 * Create state snapshot
 * @param {string} label - Snapshot label
 * @returns {string} Snapshot ID
 */
function createSnapshot(label = '') {
  const snapshotId = `SNAP_${_cognitiveState.state_hash.substring(0, 16)}`;
  const snapshot = {
    snapshot_id: snapshotId,
    label: label,
    state: _cognitiveState.clone(),
    execution_index: _executionHistory.length,
    created_at: deterministicTime()
  };

  _snapshots.set(snapshotId, snapshot);

  auditLog({
    layer: 'LAYER_VIII_RUNTIME',
    operation: 'CREATE_SNAPSHOT',
    input_hash: _cognitiveState.state_hash,
    output_hash: snapshotId,
    metadata: { label, execution_index: snapshot.execution_index }
  });

  return snapshotId;
}

/**
 * Restore state from snapshot
 * @param {string} snapshotId - Snapshot ID
 * @returns {object} Restore result
 */
function restoreSnapshot(snapshotId) {
  const snapshot = _snapshots.get(snapshotId);
  if (!snapshot) {
    throw new Error(`LAYER_VIII_ERROR: Snapshot ${snapshotId} not found`);
  }

  const previousHash = _cognitiveState.state_hash;
  _cognitiveState = snapshot.state.clone();

  auditLog({
    layer: 'LAYER_VIII_RUNTIME',
    operation: 'RESTORE_SNAPSHOT',
    input_hash: snapshotId,
    output_hash: _cognitiveState.state_hash,
    metadata: { previous_hash: previousHash }
  });

  return {
    restored: true,
    snapshot_id: snapshotId,
    state_hash: _cognitiveState.state_hash
  };
}

/**
 * Replay ASE sequence from state
 * LAW-005: Deterministic replay
 *
 * @param {CognitiveState} initialState - Starting state
 * @param {object[]} ases - ASE sequence to replay
 * @returns {object} Replay result
 */
function replayASESequence(initialState, ases) {
  // Reset to initial state
  _cognitiveState = initialState.clone();

  const results = [];
  for (const ase of ases) {
    try {
      const result = executeCognitiveState(ase);
      results.push(result);
    } catch (error) {
      results.push({
        ase_id: ase.ase_id,
        success: false,
        error: error.message
      });
      break;
    }
  }

  return {
    type: 'REPLAY_RESULT',
    ases_replayed: results.length,
    final_state_hash: _cognitiveState.state_hash,
    results
  };
}

/**
 * Generate feedback signal for closed-loop
 * @param {object} executionResult - Execution result
 * @returns {object} Feedback payload
 */
function generateFeedback(executionResult) {
  return {
    type: 'FEEDBACK',
    source: 'COGNITIVE_RUNTIME',
    execution_id: executionResult.ase_id,
    success: executionResult.success,
    state_hash: executionResult.success ? executionResult.new_state.state_hash : null,
    timestamp: deterministicTime()
  };
}

/**
 * Get execution history
 * @returns {object[]} Execution history
 */
function getExecutionHistory() {
  return [..._executionHistory];
}

module.exports = {
  CognitiveState,
  executeCognitiveState,
  deterministicTransition,
  createSnapshot,
  restoreSnapshot,
  replayASESequence,
  generateFeedback,
  getState,
  getExecutionHistory,
  resetRuntime
};
