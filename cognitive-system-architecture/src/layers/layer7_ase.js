/**
 * LAYER VII: ASE EVENT (Authorized State Event)
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Authorized state event generation
 * Input: MODE-A verification result + GENE
 * Output: ASE (Authorized State Event)
 *
 * CRITICAL: NO ASE without MODE-A PASS
 *
 * LAW-007: Authority Chain - ASE requires MODE-A authorization
 * LAW-004: Provenance Chain - ASE links to complete evidence chain
 * LAW-005: Determinism - ASE generation is deterministic
 */

const { canonicalHash, chainHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');
const { VerificationStatus } = require('./layer6_mode_a');

/**
 * ASE operation types
 */
const ASEOperation = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  COMPUTE: 'COMPUTE',
  TRANSITION: 'TRANSITION'
};

/**
 * ASE status
 */
const ASEStatus = {
  PENDING: 'PENDING',
  COMMITTED: 'COMMITTED',
  EXECUTED: 'EXECUTED',
  FAILED: 'FAILED'
};

// ASE sequence counter for ordering
let _aseSequence = 0;

// ASE ledger for tracking
const _aseLedger = [];

/**
 * Reset ASE state (for testing/replay)
 */
function resetASEState() {
  _aseSequence = 0;
  _aseLedger.length = 0;
}

/**
 * Get current ASE sequence
 * @returns {number} Current sequence number
 */
function getASESequence() {
  return _aseSequence;
}

/**
 * Get ASE ledger
 * @returns {object[]} ASE ledger entries
 */
function getASELedger() {
  return [..._aseLedger];
}

/**
 * Generate ASE from MODE-A verified GENE
 * LAW-007: REQUIRES MODE-A PASS
 *
 * @param {object} verification - MODE-A verification result
 * @param {object} gene - GENE from Layer V
 * @param {object} options - ASE options
 * @returns {object} ASE object
 */
function generateASE(verification, gene, options = {}) {
  // ═══════════════════════════════════════════════════════════
  // LAW-007: AUTHORITY CHECK - NO ASE WITHOUT MODE-A PASS
  // ═══════════════════════════════════════════════════════════
  if (!verification || verification.status !== VerificationStatus.PASS) {
    throw new Error('LAYER_VII_ERROR: ASE generation requires MODE-A PASS - LAW-007 violation');
  }

  if (!verification.ase_authorized) {
    throw new Error('LAYER_VII_ERROR: ASE not authorized by MODE-A');
  }

  const {
    operation = ASEOperation.CREATE,
    targetState = 'cognitive_state',
    payload = {},
    preconditions = [],
    postconditions = []
  } = options;

  const timestamp = deterministicTime();
  const sequenceNumber = ++_aseSequence;

  // Compute previous ASE hash for chain linking
  const previousHash = _aseLedger.length > 0
    ? _aseLedger[_aseLedger.length - 1].ase_hash
    : canonicalHash('GENESIS_ASE_BLOCK');

  // Create ASE payload
  const asePayload = {
    operation: operation,
    target_state: targetState,
    data: payload,
    preconditions: preconditions,
    postconditions: postconditions
  };

  // Create ASE content for hashing
  const aseContent = {
    sequence: sequenceNumber,
    gene_id: gene.gene_id,
    gene_hash: gene.gene_hash,
    authorization_hash: verification.authorization_hash,
    payload: asePayload,
    previous_hash: previousHash
  };

  const aseHash = chainHash(previousHash, aseContent);

  const ase = {
    type: 'ASE',
    ase_id: `ASE_${aseHash.substring(0, 16)}`,
    timestamp: timestamp,
    status: ASEStatus.PENDING,

    // Sequence for ordering (LAW-002: Causality)
    sequence_number: sequenceNumber,

    // Authorization (LAW-007)
    authorization: {
      verification_id: verification.verification_id,
      authorization_hash: verification.authorization_hash,
      authorized_at: verification.timestamp
    },

    // Source linkage (LAW-004: Provenance)
    gene_id: gene.gene_id,
    gene_hash: gene.gene_hash,
    cb_id: gene.cb_id,
    evidence_hash: gene.evidence_hash,

    // Event payload
    event_payload: asePayload,

    // Chain linking (LAW-004)
    previous_hash: previousHash,
    ase_hash: aseHash,

    // Execution tracking
    executed: false,
    execution_result: null
  };

  // Add to ledger
  _aseLedger.push({
    ase_id: ase.ase_id,
    sequence: sequenceNumber,
    ase_hash: aseHash,
    timestamp: timestamp
  });

  // Audit log entry
  auditLog({
    layer: 'LAYER_VII_ASE',
    operation: 'GENERATE_ASE',
    input_hash: gene.gene_hash,
    output_hash: ase.ase_hash,
    metadata: {
      ase_id: ase.ase_id,
      sequence: sequenceNumber,
      operation: operation,
      gene_id: gene.gene_id,
      verification_id: verification.verification_id
    }
  });

  return ase;
}

/**
 * Commit ASE to ledger (prepare for execution)
 * @param {object} ase - ASE to commit
 * @returns {object} Committed ASE
 */
function commitASE(ase) {
  if (ase.status !== ASEStatus.PENDING) {
    throw new Error(`LAYER_VII_ERROR: Cannot commit ASE in status ${ase.status}`);
  }

  const timestamp = deterministicTime();

  const committedASE = {
    ...ase,
    status: ASEStatus.COMMITTED,
    committed_at: timestamp,
    commit_hash: canonicalHash({
      ase_hash: ase.ase_hash,
      committed_at: timestamp
    })
  };

  // Update ledger entry
  const ledgerIdx = _aseLedger.findIndex(e => e.ase_id === ase.ase_id);
  if (ledgerIdx >= 0) {
    _aseLedger[ledgerIdx].committed = true;
    _aseLedger[ledgerIdx].commit_hash = committedASE.commit_hash;
  }

  // Audit log entry
  auditLog({
    layer: 'LAYER_VII_ASE',
    operation: 'COMMIT_ASE',
    input_hash: ase.ase_hash,
    output_hash: committedASE.commit_hash,
    metadata: {
      ase_id: ase.ase_id,
      sequence: ase.sequence_number
    }
  });

  return committedASE;
}

/**
 * Validate ASE structure
 * @param {object} ase - ASE to validate
 * @returns {object} Validation result
 */
function validateASE(ase) {
  const errors = [];

  if (!ase || ase.type !== 'ASE') {
    return { valid: false, errors: ['Invalid ASE type marker'] };
  }

  // Check required authorization
  if (!ase.authorization || !ase.authorization.authorization_hash) {
    errors.push('Missing authorization - LAW-007 violation');
  }

  // Check provenance linkage
  if (!ase.gene_hash) errors.push('Missing gene_hash');
  if (!ase.previous_hash) errors.push('Missing previous_hash - chain broken');
  if (!ase.ase_hash) errors.push('Missing ase_hash');

  // Check sequence
  if (typeof ase.sequence_number !== 'number') {
    errors.push('Missing sequence_number');
  }

  // Verify ASE hash
  const aseContent = {
    sequence: ase.sequence_number,
    gene_id: ase.gene_id,
    gene_hash: ase.gene_hash,
    authorization_hash: ase.authorization.authorization_hash,
    payload: ase.event_payload,
    previous_hash: ase.previous_hash
  };
  const computedHash = chainHash(ase.previous_hash, aseContent);

  if (computedHash !== ase.ase_hash) {
    errors.push('ASE hash mismatch - integrity violation');
  }

  return {
    valid: errors.length === 0,
    errors,
    ase_id: ase.ase_id,
    sequence: ase.sequence_number
  };
}

/**
 * Verify ASE chain integrity
 * @returns {object} Chain verification result
 */
function verifyASEChain() {
  if (_aseLedger.length === 0) {
    return { valid: true, length: 0, errors: [] };
  }

  const errors = [];
  let expectedPrevious = canonicalHash('GENESIS_ASE_BLOCK');

  for (let i = 0; i < _aseLedger.length; i++) {
    const entry = _aseLedger[i];

    // Check sequence ordering
    if (entry.sequence !== i + 1) {
      errors.push({
        index: i,
        error: 'SEQUENCE_MISMATCH',
        expected: i + 1,
        actual: entry.sequence
      });
    }

    // Note: Full hash verification would require storing full ASE
    // This is a simplified check for the ledger entries
  }

  return {
    valid: errors.length === 0,
    length: _aseLedger.length,
    errors,
    head_hash: _aseLedger[_aseLedger.length - 1].ase_hash
  };
}

/**
 * Get ASE by ID from ledger
 * @param {string} aseId - ASE ID
 * @returns {object|null} Ledger entry or null
 */
function getASEFromLedger(aseId) {
  return _aseLedger.find(e => e.ase_id === aseId) || null;
}

/**
 * Get ASE range from ledger
 * @param {number} startSeq - Start sequence (inclusive)
 * @param {number} endSeq - End sequence (inclusive)
 * @returns {object[]} ASE entries in range
 */
function getASERange(startSeq, endSeq) {
  return _aseLedger.filter(e =>
    e.sequence >= startSeq && e.sequence <= endSeq
  );
}

/**
 * Create batch of ASEs
 * @param {object[]} items - Array of { verification, gene, options }
 * @returns {object[]} Array of ASEs
 */
function generateASEBatch(items) {
  return items.map(item => generateASE(
    item.verification,
    item.gene,
    item.options
  ));
}

module.exports = {
  ASEOperation,
  ASEStatus,
  generateASE,
  commitASE,
  validateASE,
  verifyASEChain,
  getASEFromLedger,
  getASERange,
  generateASEBatch,
  resetASEState,
  getASESequence,
  getASELedger
};
