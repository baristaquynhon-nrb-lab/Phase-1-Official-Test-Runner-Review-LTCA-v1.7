/**
 * AUDIT LOGGER MODULE
 * LTCA-NRBPL Cognitive Operating System
 *
 * LAW-004 Compliance: Provenance Chain - Complete audit trail
 * LAW-001 Compliance: Evidence Required - All operations logged
 *
 * Forensic-grade logging with hash chain integrity
 */

const { canonicalHash, chainHash } = require('./canonical_hash');
const { deterministicTime } = require('./deterministic_clock');

/**
 * Audit Log Entry structure
 * Immutable record of layer operation
 */
class AuditEntry {
  constructor(layer, operation, inputHash, outputHash, previousHash, metadata = {}) {
    this.entry_id = null; // Set by logger
    this.layer = layer;
    this.operation = operation;
    this.input_hash = inputHash;
    this.output_hash = outputHash;
    this.previous_hash = previousHash;
    this.timestamp = deterministicTime();
    this.metadata = metadata;
    this.entry_hash = null; // Computed after creation
  }

  /**
   * Compute and set entry hash
   */
  seal() {
    const content = {
      entry_id: this.entry_id,
      layer: this.layer,
      operation: this.operation,
      input_hash: this.input_hash,
      output_hash: this.output_hash,
      previous_hash: this.previous_hash,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
    this.entry_hash = canonicalHash(content);
    return this;
  }

  /**
   * Verify entry integrity
   * @returns {boolean} True if entry hash is valid
   */
  verify() {
    const savedHash = this.entry_hash;
    this.entry_hash = null;
    const content = {
      entry_id: this.entry_id,
      layer: this.layer,
      operation: this.operation,
      input_hash: this.input_hash,
      output_hash: this.output_hash,
      previous_hash: this.previous_hash,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
    const computedHash = canonicalHash(content);
    this.entry_hash = savedHash;
    return computedHash === savedHash;
  }
}

/**
 * Forensic Audit Logger
 * Maintains chain of custody for all cognitive operations
 */
class AuditLogger {
  constructor() {
    this._entries = [];
    this._lastHash = canonicalHash('GENESIS_AUDIT_BLOCK');
    this._entryCounter = 0;
  }

  /**
   * Log a layer operation
   * LAW-004: Creates provenance chain entry
   *
   * @param {object} params - Log parameters
   * @param {string} params.layer - Layer identifier (e.g., "LAYER_I_SIGNAL")
   * @param {string} params.operation - Operation name
   * @param {string} params.input_hash - Hash of input data
   * @param {string} params.output_hash - Hash of output data
   * @param {object} params.metadata - Additional metadata
   * @returns {AuditEntry} Sealed audit entry
   */
  log({ layer, operation, input_hash, output_hash, metadata = {} }) {
    const entry = new AuditEntry(
      layer,
      operation,
      input_hash,
      output_hash,
      this._lastHash,
      metadata
    );

    entry.entry_id = ++this._entryCounter;
    entry.seal();

    this._entries.push(entry);
    this._lastHash = entry.entry_hash;

    return entry;
  }

  /**
   * Get full audit trail
   * @returns {AuditEntry[]} All audit entries
   */
  getTrail() {
    return [...this._entries];
  }

  /**
   * Get entries for specific layer
   * @param {string} layer - Layer identifier
   * @returns {AuditEntry[]} Filtered entries
   */
  getLayerTrail(layer) {
    return this._entries.filter(e => e.layer === layer);
  }

  /**
   * Verify entire audit chain integrity
   * LAW-004: Provenance chain verification
   * @returns {object} Verification result
   */
  verifyChain() {
    if (this._entries.length === 0) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    let expectedPrevious = canonicalHash('GENESIS_AUDIT_BLOCK');

    for (let i = 0; i < this._entries.length; i++) {
      const entry = this._entries[i];

      // Verify entry integrity
      if (!entry.verify()) {
        errors.push({
          entry_id: entry.entry_id,
          error: 'ENTRY_HASH_INVALID',
          message: `Entry ${entry.entry_id} hash verification failed`
        });
      }

      // Verify chain linkage
      if (entry.previous_hash !== expectedPrevious) {
        errors.push({
          entry_id: entry.entry_id,
          error: 'CHAIN_BROKEN',
          message: `Entry ${entry.entry_id} previous_hash mismatch`
        });
      }

      expectedPrevious = entry.entry_hash;
    }

    return {
      valid: errors.length === 0,
      errors,
      chain_length: this._entries.length,
      head_hash: this._lastHash
    };
  }

  /**
   * Get chain head hash
   * @returns {string} Latest entry hash
   */
  getHeadHash() {
    return this._lastHash;
  }

  /**
   * Export audit log for persistence
   * @returns {object} Serializable audit log
   */
  export() {
    return {
      genesis_hash: canonicalHash('GENESIS_AUDIT_BLOCK'),
      head_hash: this._lastHash,
      entry_count: this._entries.length,
      entries: this._entries.map(e => ({
        entry_id: e.entry_id,
        layer: e.layer,
        operation: e.operation,
        input_hash: e.input_hash,
        output_hash: e.output_hash,
        previous_hash: e.previous_hash,
        timestamp: e.timestamp,
        metadata: e.metadata,
        entry_hash: e.entry_hash
      }))
    };
  }

  /**
   * Reset logger (for testing/replay)
   */
  reset() {
    this._entries = [];
    this._lastHash = canonicalHash('GENESIS_AUDIT_BLOCK');
    this._entryCounter = 0;
  }
}

// Singleton instance for global audit trail
const globalAuditLogger = new AuditLogger();

/**
 * Log to global audit trail
 * @param {object} params - Log parameters
 * @returns {AuditEntry} Sealed audit entry
 */
function auditLog(params) {
  return globalAuditLogger.log(params);
}

/**
 * Get global audit trail
 * @returns {AuditEntry[]} All entries
 */
function getAuditTrail() {
  return globalAuditLogger.getTrail();
}

/**
 * Verify global audit chain
 * @returns {object} Verification result
 */
function verifyAuditChain() {
  return globalAuditLogger.verifyChain();
}

/**
 * Reset global audit logger
 */
function resetAuditLogger() {
  globalAuditLogger.reset();
}

/**
 * Create isolated logger instance
 * @returns {AuditLogger} New logger instance
 */
function createAuditLogger() {
  return new AuditLogger();
}

module.exports = {
  AuditEntry,
  AuditLogger,
  auditLog,
  getAuditTrail,
  verifyAuditChain,
  resetAuditLogger,
  createAuditLogger,
  globalAuditLogger
};
