/**
 * LAYER III: EVIDENCE BINDING
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Forensic chain formation
 * Input: TRACE from Layer II
 * Output: EVID (Evidence) with chain of custody
 *
 * LAW-001: Evidence Required - Creates binding evidence record
 * LAW-004: Provenance Chain - Forensic linking
 * LAW-007: Authority Chain - Evidence authorization
 */

const { canonicalHash, chainHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Evidence status enumeration
 */
const EvidenceStatus = {
  PENDING: 'PENDING',
  SEALED: 'SEALED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

/**
 * Chain of custody entry
 */
class CustodyEntry {
  constructor(actor, action, timestamp, notes = '') {
    this.actor = actor;
    this.action = action;
    this.timestamp = timestamp;
    this.notes = notes;
    this.entry_hash = canonicalHash({ actor, action, timestamp, notes });
  }
}

// Evidence chain head for linking
let _evidenceChainHead = canonicalHash('GENESIS_EVIDENCE_BLOCK');

/**
 * Reset evidence chain (for testing/replay)
 */
function resetEvidenceChain() {
  _evidenceChainHead = canonicalHash('GENESIS_EVIDENCE_BLOCK');
}

/**
 * Get current evidence chain head
 * @returns {string} Chain head hash
 */
function getEvidenceChainHead() {
  return _evidenceChainHead;
}

/**
 * Bind evidence from trace
 * LAW-001: Creates evidence record
 * LAW-004: Links to provenance chain
 *
 * @param {object} trace - TRACE from Layer II
 * @param {object} options - Binding options
 * @returns {object} EVID object
 */
function bindEvidence(trace, options = {}) {
  if (!trace || trace.type !== 'TRACE') {
    throw new Error('LAYER_III_ERROR: Invalid trace input - LAW-001 violation');
  }

  const {
    authority = 'SYSTEM',
    classification = 'STANDARD'
  } = options;

  const timestamp = deterministicTime();

  // Create initial chain of custody
  const chainOfCustody = [
    new CustodyEntry(
      'LAYER_II_TRACE',
      'CREATED',
      { logical: trace.timestamp.logical - 1, node: trace.timestamp.node },
      'Trace extraction complete'
    ),
    new CustodyEntry(
      'LAYER_III_EVIDENCE',
      'RECEIVED',
      timestamp,
      'Evidence binding initiated'
    )
  ];

  // Compute custody chain hash
  const custodyHash = canonicalHash(chainOfCustody.map(e => e.entry_hash));

  // Create evidence content
  const evidContent = {
    source_trace_id: trace.trace_id,
    source_trace_hash: trace.trace_hash,
    features: trace.features,
    confidence: trace.confidence,
    custody_hash: custodyHash
  };

  // Link to previous evidence (provenance chain)
  const previousHash = _evidenceChainHead;
  const evidHash = chainHash(previousHash, evidContent);

  const evidence = {
    type: 'EVID',
    evid_id: `EVID_${evidHash.substring(0, 16)}`,
    timestamp: timestamp,
    status: EvidenceStatus.PENDING,

    // Source linkage (LAW-004)
    source_trace_id: trace.trace_id,
    source_trace_hash: trace.trace_hash,
    source_signal_hash: trace.source_hash,

    // Evidence content
    features: trace.features,
    confidence: trace.confidence,
    classification: classification,

    // Chain of custody (forensic)
    chain_of_custody: chainOfCustody,
    custody_hash: custodyHash,

    // Provenance linking (LAW-004)
    previous_hash: previousHash,
    evid_hash: evidHash,

    // Authority (LAW-007)
    authority: authority,
    sealed: false
  };

  // Audit log entry
  auditLog({
    layer: 'LAYER_III_EVIDENCE',
    operation: 'BIND_EVIDENCE',
    input_hash: trace.trace_hash,
    output_hash: evidence.evid_hash,
    metadata: {
      evid_id: evidence.evid_id,
      source_trace_id: trace.trace_id,
      previous_hash: previousHash,
      authority: authority
    }
  });

  return evidence;
}

/**
 * Seal evidence (make immutable)
 * LAW-001: Finalizes evidence record
 *
 * @param {object} evidence - Evidence to seal
 * @param {string} sealer - Sealing authority
 * @returns {object} Sealed evidence
 */
function sealEvidence(evidence, sealer = 'LAYER_III_EVIDENCE') {
  if (evidence.sealed) {
    throw new Error('LAYER_III_ERROR: Evidence already sealed');
  }

  const timestamp = deterministicTime();

  // Add custody entry for sealing
  const sealEntry = new CustodyEntry(
    sealer,
    'SEALED',
    timestamp,
    'Evidence sealed and immutable'
  );

  const newCustody = [...evidence.chain_of_custody, sealEntry];
  const newCustodyHash = canonicalHash(newCustody.map(e => e.entry_hash));

  // Create sealed evidence
  const sealedEvidence = {
    ...evidence,
    status: EvidenceStatus.SEALED,
    chain_of_custody: newCustody,
    custody_hash: newCustodyHash,
    sealed: true,
    sealed_at: timestamp,
    sealed_by: sealer
  };

  // Recompute final hash
  const sealContent = {
    evid_id: sealedEvidence.evid_id,
    source_trace_hash: sealedEvidence.source_trace_hash,
    custody_hash: newCustodyHash,
    sealed_at: timestamp
  };
  sealedEvidence.seal_hash = canonicalHash(sealContent);

  // Update chain head
  _evidenceChainHead = sealedEvidence.seal_hash;

  // Audit log entry
  auditLog({
    layer: 'LAYER_III_EVIDENCE',
    operation: 'SEAL_EVIDENCE',
    input_hash: evidence.evid_hash,
    output_hash: sealedEvidence.seal_hash,
    metadata: {
      evid_id: evidence.evid_id,
      sealer: sealer,
      custody_entries: newCustody.length
    }
  });

  return sealedEvidence;
}

/**
 * Verify evidence integrity
 * LAW-001: Validates evidence record
 * LAW-004: Verifies provenance chain
 *
 * @param {object} evidence - Evidence to verify
 * @returns {object} Verification result
 */
function verifyEvidence(evidence) {
  const errors = [];
  const warnings = [];

  if (!evidence || evidence.type !== 'EVID') {
    return {
      valid: false,
      errors: ['Invalid evidence type marker'],
      warnings: []
    };
  }

  // Check required fields
  if (!evidence.evid_id) errors.push('Missing evid_id');
  if (!evidence.source_trace_hash) errors.push('Missing source_trace_hash - LAW-004 violation');
  if (!evidence.evid_hash) errors.push('Missing evid_hash');
  if (!evidence.previous_hash) errors.push('Missing previous_hash - provenance broken');

  // Verify chain of custody
  if (!evidence.chain_of_custody || evidence.chain_of_custody.length === 0) {
    errors.push('Empty chain of custody - forensic violation');
  }

  // Verify custody hash
  if (evidence.chain_of_custody) {
    const computedCustodyHash = canonicalHash(
      evidence.chain_of_custody.map(e => e.entry_hash || canonicalHash(e))
    );
    if (computedCustodyHash !== evidence.custody_hash) {
      errors.push('Custody hash mismatch - chain tampering detected');
    }
  }

  // For sealed evidence, verify seal_hash instead of evid_hash
  // because custody chain changes after sealing
  if (evidence.sealed) {
    // Verify seal_hash for sealed evidence
    if (!evidence.seal_hash) {
      errors.push('Sealed evidence missing seal_hash');
    } else {
      const sealContent = {
        evid_id: evidence.evid_id,
        source_trace_hash: evidence.source_trace_hash,
        custody_hash: evidence.custody_hash,
        sealed_at: evidence.sealed_at
      };
      const computedSealHash = canonicalHash(sealContent);
      if (computedSealHash !== evidence.seal_hash) {
        errors.push('Seal hash mismatch - integrity violation');
      }
    }
  } else {
    // Verify evidence hash for unsealed evidence (provenance linking)
    const evidContent = {
      source_trace_id: evidence.source_trace_id,
      source_trace_hash: evidence.source_trace_hash,
      features: evidence.features,
      confidence: evidence.confidence,
      custody_hash: evidence.custody_hash
    };
    const computedHash = chainHash(evidence.previous_hash, evidContent);
    if (computedHash !== evidence.evid_hash) {
      errors.push('Evidence hash mismatch - integrity violation');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    evid_id: evidence.evid_id,
    status: evidence.status
  };
}

/**
 * Add custody entry (for transfers)
 * @param {object} evidence - Evidence to update
 * @param {string} actor - Acting party
 * @param {string} action - Action taken
 * @param {string} notes - Additional notes
 * @returns {object} Updated evidence
 */
function addCustodyEntry(evidence, actor, action, notes = '') {
  if (evidence.sealed) {
    throw new Error('LAYER_III_ERROR: Cannot modify sealed evidence');
  }

  const entry = new CustodyEntry(actor, action, deterministicTime(), notes);
  const newCustody = [...evidence.chain_of_custody, entry];

  return {
    ...evidence,
    chain_of_custody: newCustody,
    custody_hash: canonicalHash(newCustody.map(e => e.entry_hash))
  };
}

module.exports = {
  EvidenceStatus,
  CustodyEntry,
  bindEvidence,
  sealEvidence,
  verifyEvidence,
  addCustodyEntry,
  resetEvidenceChain,
  getEvidenceChainHead
};
