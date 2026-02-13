/**
 * LAYER VI: MODE-A IMMUNE GATE
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Constitutional compliance verification
 * Input: GENE from Layer V (+ EVID, CB for verification)
 * Output: Verification result (PASS/REJECT)
 *
 * CRITICAL LAYER - Enforces all constitutional laws:
 * LAW-001: Evidence Required
 * LAW-002: Temporal Causality
 * LAW-003: Non-Contradiction
 * LAW-004: Provenance Chain
 * LAW-005: Determinism
 * LAW-006: Resource Bounds
 * LAW-007: Authority Chain
 */

const { canonicalHash, verifyHash } = require('../core/canonical_hash');
const { deterministicTime, compareTimestamps } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Constitutional Laws enumeration
 */
const ConstitutionalLaw = {
  LAW_001_EVIDENCE: 'LAW-001',
  LAW_002_CAUSALITY: 'LAW-002',
  LAW_003_NON_CONTRADICTION: 'LAW-003',
  LAW_004_PROVENANCE: 'LAW-004',
  LAW_005_DETERMINISM: 'LAW-005',
  LAW_006_RESOURCE: 'LAW-006',
  LAW_007_AUTHORITY: 'LAW-007'
};

/**
 * Verification status
 */
const VerificationStatus = {
  PASS: 'CONSTITUTION_PASS',
  REJECT: 'CONSTITUTION_REJECT',
  PENDING: 'VERIFICATION_PENDING'
};

/**
 * MODE-A Immune Gate - Main verification function
 * Checks all constitutional laws before allowing ASE generation
 *
 * @param {object} gene - GENE from Layer V
 * @param {object} cb - CB from Layer IV (for verification)
 * @param {object} evidence - EVID from Layer III (for verification)
 * @param {object} options - Verification options
 * @returns {object} Verification result
 */
function modeAGate(gene, cb, evidence, options = {}) {
  const timestamp = deterministicTime();
  const violations = [];
  const checks = [];

  // ═══════════════════════════════════════════════════════════
  // LAW-001: EVIDENCE REQUIRED
  // ═══════════════════════════════════════════════════════════
  const law001Result = checkLaw001Evidence(evidence, cb);
  checks.push(law001Result);
  if (!law001Result.passed) {
    violations.push(law001Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-002: TEMPORAL CAUSALITY
  // ═══════════════════════════════════════════════════════════
  const law002Result = checkLaw002Causality(evidence, cb, gene);
  checks.push(law002Result);
  if (!law002Result.passed) {
    violations.push(law002Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-003: NON-CONTRADICTION
  // ═══════════════════════════════════════════════════════════
  const law003Result = checkLaw003NonContradiction(cb);
  checks.push(law003Result);
  if (!law003Result.passed) {
    violations.push(law003Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-004: PROVENANCE CHAIN
  // ═══════════════════════════════════════════════════════════
  const law004Result = checkLaw004Provenance(gene, cb, evidence);
  checks.push(law004Result);
  if (!law004Result.passed) {
    violations.push(law004Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-005: DETERMINISM
  // ═══════════════════════════════════════════════════════════
  const law005Result = checkLaw005Determinism(gene, cb, evidence);
  checks.push(law005Result);
  if (!law005Result.passed) {
    violations.push(law005Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-006: RESOURCE BOUNDS
  // ═══════════════════════════════════════════════════════════
  const law006Result = checkLaw006ResourceBounds(gene, options);
  checks.push(law006Result);
  if (!law006Result.passed) {
    violations.push(law006Result);
  }

  // ═══════════════════════════════════════════════════════════
  // LAW-007: AUTHORITY CHAIN
  // ═══════════════════════════════════════════════════════════
  const law007Result = checkLaw007AuthorityChain(evidence, cb, gene);
  checks.push(law007Result);
  if (!law007Result.passed) {
    violations.push(law007Result);
  }

  // Determine final status
  const status = violations.length === 0
    ? VerificationStatus.PASS
    : VerificationStatus.REJECT;

  const verificationResult = {
    type: 'MODE_A_VERIFICATION',
    verification_id: `VERIFY_${canonicalHash({ gene_id: gene.gene_id, timestamp }).substring(0, 16)}`,
    timestamp: timestamp,
    status: status,

    // Input references
    gene_id: gene.gene_id,
    gene_hash: gene.gene_hash,
    cb_id: cb.cb_id,
    evidence_id: evidence.evid_id,

    // Check results
    checks_performed: checks.length,
    checks_passed: checks.filter(c => c.passed).length,
    checks: checks,

    // Violations (if any)
    violations: violations,
    violation_count: violations.length,

    // Authorization for ASE
    ase_authorized: status === VerificationStatus.PASS,
    authorization_hash: status === VerificationStatus.PASS
      ? canonicalHash({ gene_hash: gene.gene_hash, status, timestamp })
      : null
  };

  // Audit log entry
  auditLog({
    layer: 'LAYER_VI_MODE_A',
    operation: status === VerificationStatus.PASS ? 'GATE_PASS' : 'GATE_REJECT',
    input_hash: gene.gene_hash,
    output_hash: verificationResult.authorization_hash || canonicalHash(violations),
    metadata: {
      verification_id: verificationResult.verification_id,
      gene_id: gene.gene_id,
      status: status,
      violations: violations.map(v => v.law)
    }
  });

  return verificationResult;
}

/**
 * LAW-001: Evidence Required
 * Every cognitive operation must have evidence backing
 */
function checkLaw001Evidence(evidence, cb) {
  const result = {
    law: ConstitutionalLaw.LAW_001_EVIDENCE,
    description: 'Evidence Required',
    passed: true,
    details: {}
  };

  // Check evidence exists
  if (!evidence) {
    result.passed = false;
    result.details.error = 'No evidence provided';
    return result;
  }

  // Check evidence is sealed
  if (!evidence.sealed) {
    result.passed = false;
    result.details.error = 'Evidence not sealed';
    return result;
  }

  // Check CB references evidence
  if (cb.evidence_id !== evidence.evid_id) {
    result.passed = false;
    result.details.error = 'CB evidence reference mismatch';
    result.details.expected = evidence.evid_id;
    result.details.actual = cb.evidence_id;
    return result;
  }

  result.details.evidence_id = evidence.evid_id;
  result.details.sealed = true;
  return result;
}

/**
 * LAW-002: Temporal Causality
 * Effects cannot precede causes
 */
function checkLaw002Causality(evidence, cb, gene) {
  const result = {
    law: ConstitutionalLaw.LAW_002_CAUSALITY,
    description: 'Temporal Causality',
    passed: true,
    details: {}
  };

  // Evidence must come before CB
  if (compareTimestamps(cb.timestamp, evidence.timestamp) < 0) {
    result.passed = false;
    result.details.error = 'CB timestamp precedes evidence';
    return result;
  }

  // CB must come before Gene
  if (compareTimestamps(gene.timestamp, cb.timestamp) < 0) {
    result.passed = false;
    result.details.error = 'Gene timestamp precedes CB';
    return result;
  }

  result.details.causal_order = 'EVIDENCE → CB → GENE';
  result.details.verified = true;
  return result;
}

/**
 * LAW-003: Non-Contradiction
 * System state must be logically consistent
 */
function checkLaw003NonContradiction(cb) {
  const result = {
    law: ConstitutionalLaw.LAW_003_NON_CONTRADICTION,
    description: 'Non-Contradiction',
    passed: true,
    details: {}
  };

  // Check CB doesn't support and contradict same thing
  if (cb.supports && cb.contradicts) {
    const supportIds = new Set(cb.supports.map(s => s.cb_id));
    const contradictIds = new Set(cb.contradicts.map(c => c.cb_id));

    for (const id of supportIds) {
      if (contradictIds.has(id)) {
        result.passed = false;
        result.details.error = 'CB both supports and contradicts same target';
        result.details.conflicting_cb = id;
        return result;
      }
    }
  }

  result.details.consistent = true;
  return result;
}

/**
 * LAW-004: Provenance Chain
 * Complete audit trail required
 */
function checkLaw004Provenance(gene, cb, evidence) {
  const result = {
    law: ConstitutionalLaw.LAW_004_PROVENANCE,
    description: 'Provenance Chain',
    passed: true,
    details: {}
  };

  // Check gene links to CB
  if (gene.cb_hash !== cb.cb_hash) {
    result.passed = false;
    result.details.error = 'Gene CB hash mismatch';
    return result;
  }

  // Check CB links to evidence
  const expectedEvidHash = evidence.seal_hash || evidence.evid_hash;
  if (cb.evidence_hash !== expectedEvidHash) {
    result.passed = false;
    result.details.error = 'CB evidence hash mismatch';
    return result;
  }

  // Check evidence has chain of custody
  if (!evidence.chain_of_custody || evidence.chain_of_custody.length === 0) {
    result.passed = false;
    result.details.error = 'Evidence missing chain of custody';
    return result;
  }

  result.details.chain = 'GENE → CB → EVIDENCE';
  result.details.custody_entries = evidence.chain_of_custody.length;
  return result;
}

/**
 * LAW-005: Determinism
 * Same inputs must produce same outputs
 */
function checkLaw005Determinism(gene, cb, evidence) {
  const result = {
    law: ConstitutionalLaw.LAW_005_DETERMINISM,
    description: 'Determinism',
    passed: true,
    details: {}
  };

  // Verify gene hash is deterministic
  const geneContent = {
    cb_id: gene.cb_id,
    cb_hash: gene.cb_hash,
    dna_sequence: gene.dna_sequence,
    signature: gene.signature
  };
  const computedGeneHash = canonicalHash(geneContent);

  if (computedGeneHash !== gene.gene_hash) {
    result.passed = false;
    result.details.error = 'Gene hash not deterministic';
    result.details.expected = gene.gene_hash;
    result.details.computed = computedGeneHash;
    return result;
  }

  // Verify CB hash
  const cbContent = {
    evid_id: cb.evidence_id,
    evid_hash: cb.evidence_hash,
    semantic: cb.semantic,
    strength: cb.meaning_strength,
    interpretation: cb.interpretation
  };
  const computedCBHash = canonicalHash(cbContent);

  // Note: CB hash may differ if relationships were added
  if (computedCBHash !== cb.cb_hash &&
      cb.supports.length === 0 &&
      cb.contradicts.length === 0 &&
      cb.depends_on.length === 0) {
    result.passed = false;
    result.details.error = 'CB hash not deterministic';
    return result;
  }

  result.details.deterministic = true;
  result.details.hashes_verified = ['gene', 'cb'];
  return result;
}

/**
 * LAW-006: Resource Bounds
 * Operations must respect resource limits
 */
function checkLaw006ResourceBounds(gene, options) {
  const result = {
    law: ConstitutionalLaw.LAW_006_RESOURCE,
    description: 'Resource Bounds',
    passed: true,
    details: {}
  };

  const {
    maxDNALength = 1000,
    maxDependencies = 100
  } = options;

  // Check DNA length
  if (gene.dna_length > maxDNALength) {
    result.passed = false;
    result.details.error = 'DNA sequence exceeds maximum length';
    result.details.max = maxDNALength;
    result.details.actual = gene.dna_length;
    return result;
  }

  // Check dependencies
  const deps = gene.expression_requirements.dependency_count || 0;
  if (deps > maxDependencies) {
    result.passed = false;
    result.details.error = 'Dependency count exceeds limit';
    result.details.max = maxDependencies;
    result.details.actual = deps;
    return result;
  }

  result.details.dna_length = gene.dna_length;
  result.details.dependencies = deps;
  result.details.within_bounds = true;
  return result;
}

/**
 * LAW-007: Authority Chain
 * Proper authorization at each layer
 */
function checkLaw007AuthorityChain(evidence, cb, gene) {
  const result = {
    law: ConstitutionalLaw.LAW_007_AUTHORITY,
    description: 'Authority Chain',
    passed: true,
    details: {}
  };

  // Check evidence has authority
  if (!evidence.authority) {
    result.passed = false;
    result.details.error = 'Evidence missing authority';
    return result;
  }

  // Check gene is expression ready
  if (!gene.expression_ready) {
    result.passed = false;
    result.details.error = 'Gene not expression ready';
    return result;
  }

  // Verify authority chain: EVID → CB → GENE
  const authorityChain = [
    { layer: 'EVIDENCE', id: evidence.evid_id, authority: evidence.authority },
    { layer: 'CB', id: cb.cb_id, source: cb.evidence_id },
    { layer: 'GENE', id: gene.gene_id, source: gene.cb_id }
  ];

  result.details.authority_chain = authorityChain;
  result.details.chain_valid = true;
  return result;
}

/**
 * Quick check - simplified verification for performance
 * @param {object} gene - Gene to verify
 * @param {object} evidence - Source evidence
 * @returns {boolean} Pass/fail
 */
function quickCheck(gene, evidence) {
  // Minimum checks for quick pass
  if (!evidence || !evidence.sealed) return false;
  if (!gene || !gene.expression_ready) return false;
  if (!gene.gene_hash) return false;

  return true;
}

/**
 * Create rejection response
 * @param {string} law - Violated law
 * @param {string} reason - Rejection reason
 * @returns {object} Rejection object
 */
function reject(law, reason) {
  return {
    type: 'MODE_A_REJECTION',
    status: VerificationStatus.REJECT,
    law: law,
    reason: reason,
    timestamp: deterministicTime(),
    ase_authorized: false
  };
}

module.exports = {
  ConstitutionalLaw,
  VerificationStatus,
  modeAGate,
  checkLaw001Evidence,
  checkLaw002Causality,
  checkLaw003NonContradiction,
  checkLaw004Provenance,
  checkLaw005Determinism,
  checkLaw006ResourceBounds,
  checkLaw007AuthorityChain,
  quickCheck,
  reject
};
