/**
 * DETERMINISTIC CLOCK MODULE
 * LTCA-NRBPL Cognitive Operating System
 *
 * LAW-005 Compliance: Deterministic temporal ordering
 *
 * Implements Lamport logical clock for replay-stable timestamps
 * NO system time dependency for deterministic replay
 */

/**
 * Lamport Clock implementation
 * Guarantees causal ordering without wall-clock dependency
 */
class LamportClock {
  constructor(initialValue = 0) {
    this._counter = initialValue;
    this._nodeId = 'COGNITIVE_RUNTIME';
  }

  /**
   * Get current logical time
   * @returns {number} Current counter value
   */
  now() {
    return this._counter;
  }

  /**
   * Increment and return new timestamp
   * Used for local events
   * @returns {object} Timestamp object
   */
  tick() {
    this._counter++;
    return this.timestamp();
  }

  /**
   * Update clock based on received message timestamp
   * Maintains causal ordering across distributed events
   * @param {number} receivedTime - Timestamp from received message
   * @returns {object} Updated timestamp
   */
  receive(receivedTime) {
    this._counter = Math.max(this._counter, receivedTime) + 1;
    return this.timestamp();
  }

  /**
   * Generate full timestamp object
   * @returns {object} Timestamp with logical time and node ID
   */
  timestamp() {
    return {
      logical: this._counter,
      node: this._nodeId,
      sequence: this._counter
    };
  }

  /**
   * Reset clock (for testing/replay)
   * @param {number} value - Reset value
   */
  reset(value = 0) {
    this._counter = value;
  }

  /**
   * Set node identifier
   * @param {string} nodeId - Node identifier
   */
  setNodeId(nodeId) {
    this._nodeId = nodeId;
  }
}

// Singleton instance for global use
const globalClock = new LamportClock();

/**
 * Get deterministic timestamp (global clock)
 * LAW-005: No system time randomness
 * @returns {object} Deterministic timestamp
 */
function deterministicTime() {
  return globalClock.tick();
}

/**
 * Get current logical time without incrementing
 * @returns {number} Current logical time
 */
function currentTime() {
  return globalClock.now();
}

/**
 * Reset global clock for replay
 * @param {number} value - Reset value
 */
function resetClock(value = 0) {
  globalClock.reset(value);
}

/**
 * Compare two timestamps for ordering
 * @param {object} t1 - First timestamp
 * @param {object} t2 - Second timestamp
 * @returns {number} -1 if t1 < t2, 0 if equal, 1 if t1 > t2
 */
function compareTimestamps(t1, t2) {
  if (t1.logical < t2.logical) return -1;
  if (t1.logical > t2.logical) return 1;
  // Tie-breaker: node ID lexicographic order
  if (t1.node < t2.node) return -1;
  if (t1.node > t2.node) return 1;
  return 0;
}

/**
 * Create isolated clock instance for testing
 * @param {number} initialValue - Starting value
 * @returns {LamportClock} New clock instance
 */
function createClock(initialValue = 0) {
  return new LamportClock(initialValue);
}

module.exports = {
  LamportClock,
  deterministicTime,
  currentTime,
  resetClock,
  compareTimestamps,
  createClock,
  globalClock
};
