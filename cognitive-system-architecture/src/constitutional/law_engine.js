/**
 * CONSTITUTIONAL LAW ENGINE
 * LTCA-NRBPL Cognitive Operating System
 *
 * Central enforcement of all 7 constitutional laws
 * This module provides system-wide constitutional compliance checking
 *
 * THE 7 CONSTITUTIONAL LAWS:
 * LAW-001: Evidence Required
 * LAW-002: Temporal Causality
 * LAW-003: Non-Contradiction
 * LAW-004: Provenance Chain
 * LAW-005: Determinism
 * LAW-006: Resource Bounds
 * LAW-007: Authority Chain
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Constitutional Law definitions
 */
const CONSTITUTIONAL_LAWS = {
  'LAW-001': {
    id: 'LAW-001',
    name: 'Evidence Required',
    description: 'No inference without evidence. Every cognitive operation must have traceable evidence.',
    severity: 'CRITICAL',
    enforced: true
  },
  'LAW-002': {
    id: 'LAW-002',
    name: 'Temporal Causality',
    description: 'Effects cannot precede causes. Causal ordering must be maintained.',
    severity: 'CRITICAL',
    enforced: true
  },
  'LAW-003': {
    id: 'LAW-003',
    name: 'Non-Contradiction',
    description: 'System state must be logically consistent. No contradictory beliefs.',
    severity: 'HIGH',
    enforced: true
  },
  'LAW-004': {
    id: 'LAW-004',
    name: 'Provenance Chain',
    description: 'Complete audit trail required. Every decision has traceable origin.',
    severity: 'CRITICAL',
    enforced: true
  },
  'LAW-005': {
    id: 'LAW-005',
    name: 'Determinism',
    description: 'Same inputs must produce same outputs. No randomness in core operations.',
    severity: 'CRITICAL',
    enforced: true
  },
  'LAW-006': {
    id: 'LAW-006',
    name: 'Resource Bounds',
    description: 'Operations must respect resource limits. No unbounded computation.',
    severity: 'HIGH',
    enforced: true
  },
  'LAW-007': {
    id: 'LAW-007',
    name: 'Authority Chain',
    description: 'Proper authorization at each layer. Only authorized state changes.',
    severity: 'CRITICAL',
    enforced: true
  }
};

/**
 * Violation record
 */
class ConstitutionalViolation {
  constructor(law, layer, message, context = {}) {
    this.violation_id = canonicalHash({ law, layer, message, time: deterministicTime() }).substring(0, 16);
    this.law = law;
    this.law_name = CONSTITUTIONAL_LAWS[law]?.name || 'Unknown';
    this.layer = layer;
    this.message = message;
    this.context = context;
    this.severity = CONSTITUTIONAL_LAWS[law]?.severity || 'UNKNOWN';
    this.timestamp = deterministicTime();
    this.violation_hash = canonicalHash(this);
  }
}

/**
 * Violation registry
 */
const _violations = [];

/**
 * Get all violations
 * @returns {ConstitutionalViolation[]} All recorded violations
 */
function getViolations() {
  return [..._violations];
}

/**
 * Clear violations (for testing)
 */
function clearViolations() {
  _violations.length = 0;
}

/**
 * Record a constitutional violation
 * @param {string} law - Law identifier (e.g., 'LAW-001')
 * @param {string} layer - Layer where violation occurred
 * @param {string} message - Violation message
 * @param {object} context - Additional context
 * @returns {ConstitutionalViolation} Recorded violation
 */
function recordViolation(law, layer, message, context = {}) {
  const violation = new ConstitutionalViolation(law, layer, message, context);
  _violations.push(violation);

  // Audit the violation
  auditLog({
    layer: 'CONSTITUTIONAL_ENGINE',
    operation: 'RECORD_VIOLATION',
    input_hash: canonicalHash({ law, layer, message }),
    output_hash: violation.violation_hash,
    metadata: {
      violation_id: violation.violation_id,
      law: law,
      severity: violation.severity
    }
  });

  return violation;
}

/**
 * Check if law is enforced
 * @param {string} law - Law identifier
 * @returns {boolean} True if enforced
 */
function isLawEnforced(law) {
  return CONSTITUTIONAL_LAWS[law]?.enforced ?? false;
}

/**
 * Get law definition
 * @param {string} law - Law identifier
 * @returns {object|null} Law definition or null
 */
function getLaw(law) {
  return CONSTITUTIONAL_LAWS[law] || null;
}

/**
 * Assert law compliance - throws if violated
 * @param {string} law - Law identifier
 * @param {boolean} condition - Compliance condition
 * @param {string} layer - Layer context
 * @param {string} message - Error message if violated
 * @param {object} context - Additional context
 */
function assertCompliance(law, condition, layer, message, context = {}) {
  if (!condition && isLawEnforced(law)) {
    const violation = recordViolation(law, layer, message, context);
    throw new ConstitutionalViolationError(violation);
  }
}

/**
 * Constitutional Violation Error
 */
class ConstitutionalViolationError extends Error {
  constructor(violation) {
    super(`CONSTITUTIONAL VIOLATION [${violation.law}]: ${violation.message}`);
    this.name = 'ConstitutionalViolationError';
    this.violation = violation;
  }
}

/**
 * Compliance check result
 */
class ComplianceResult {
  constructor() {
    this.compliant = true;
    this.laws_checked = [];
    this.violations = [];
    this.timestamp = deterministicTime();
  }

  addCheck(law, passed, details = {}) {
    this.laws_checked.push({
      law,
      passed,
      details
    });
    if (!passed) {
      this.compliant = false;
      this.violations.push({ law, ...details });
    }
  }

  getHash() {
    return canonicalHash({
      compliant: this.compliant,
      checks: this.laws_checked,
      timestamp: this.timestamp
    });
  }
}

/**
 * Full constitutional compliance check for a pipeline artifact
 * @param {object} artifact - Artifact to check
 * @param {string} artifactType - Type of artifact
 * @returns {ComplianceResult} Compliance result
 */
function checkCompliance(artifact, artifactType) {
  const result = new ComplianceResult();

  // Type-specific checks
  switch (artifactType) {
    case 'SIGNAL':
      checkSignalCompliance(artifact, result);
      break;
    case 'TRACE':
      checkTraceCompliance(artifact, result);
      break;
    case 'EVIDENCE':
      checkEvidenceCompliance(artifact, result);
      break;
    case 'CB':
      checkCBCompliance(artifact, result);
      break;
    case 'GENE':
      checkGeneCompliance(artifact, result);
      break;
    case 'ASE':
      checkASECompliance(artifact, result);
      break;
    default:
      result.addCheck('UNKNOWN', false, { error: `Unknown artifact type: ${artifactType}` });
  }

  return result;
}

/**
 * Check signal compliance
 */
function checkSignalCompliance(signal, result) {
  // LAW-005: Determinism - hash must be verifiable
  const hashValid = signal.hash === canonicalHash(signal.payload);
  result.addCheck('LAW-005', hashValid, {
    check: 'signal_hash_deterministic',
    valid: hashValid
  });
}

/**
 * Check trace compliance
 */
function checkTraceCompliance(trace, result) {
  // LAW-004: Provenance - must link to source
  const hasSource = !!trace.source_hash;
  result.addCheck('LAW-004', hasSource, {
    check: 'trace_has_source',
    valid: hasSource
  });

  // LAW-005: Determinism
  const hashValid = trace.trace_hash === canonicalHash({
    source_hash: trace.source_hash,
    features: trace.features
  });
  result.addCheck('LAW-005', hashValid, {
    check: 'trace_hash_deterministic',
    valid: hashValid
  });
}

/**
 * Check evidence compliance
 */
function checkEvidenceCompliance(evidence, result) {
  // LAW-001: Evidence must exist
  result.addCheck('LAW-001', !!evidence, {
    check: 'evidence_exists',
    valid: !!evidence
  });

  if (!evidence) return;

  // LAW-004: Chain of custody
  const hasCustody = evidence.chain_of_custody && evidence.chain_of_custody.length > 0;
  result.addCheck('LAW-004', hasCustody, {
    check: 'evidence_has_custody_chain',
    valid: hasCustody,
    entries: evidence.chain_of_custody?.length || 0
  });

  // LAW-007: Authority
  const hasAuthority = !!evidence.authority;
  result.addCheck('LAW-007', hasAuthority, {
    check: 'evidence_has_authority',
    valid: hasAuthority
  });
}

/**
 * Check CB compliance
 */
function checkCBCompliance(cb, result) {
  // LAW-001: Evidence backing
  const hasEvidence = !!cb.evidence_id && !!cb.evidence_hash;
  result.addCheck('LAW-001', hasEvidence, {
    check: 'cb_has_evidence_backing',
    valid: hasEvidence
  });

  // LAW-003: Non-contradiction
  const noSelfContradiction = !cb.contradicts?.some(c => c.cb_id === cb.cb_id);
  result.addCheck('LAW-003', noSelfContradiction, {
    check: 'cb_no_self_contradiction',
    valid: noSelfContradiction
  });
}

/**
 * Check gene compliance
 */
function checkGeneCompliance(gene, result) {
  // LAW-004: Provenance
  const hasProvenance = !!gene.cb_hash && !!gene.evidence_hash;
  result.addCheck('LAW-004', hasProvenance, {
    check: 'gene_has_provenance',
    valid: hasProvenance
  });

  // LAW-006: Resource bounds
  const withinBounds = gene.dna_length <= 10000; // Example limit
  result.addCheck('LAW-006', withinBounds, {
    check: 'gene_within_bounds',
    valid: withinBounds,
    dna_length: gene.dna_length
  });
}

/**
 * Check ASE compliance
 */
function checkASECompliance(ase, result) {
  // LAW-007: Authorization
  const hasAuth = !!ase.authorization?.authorization_hash;
  result.addCheck('LAW-007', hasAuth, {
    check: 'ase_has_authorization',
    valid: hasAuth
  });

  // LAW-004: Chain linkage
  const hasChain = !!ase.previous_hash && !!ase.ase_hash;
  result.addCheck('LAW-004', hasChain, {
    check: 'ase_has_chain_linkage',
    valid: hasChain
  });
}

/**
 * Generate compliance report
 * @returns {object} Full compliance report
 */
function generateComplianceReport() {
  const violations = getViolations();

  const bySeverity = {
    CRITICAL: violations.filter(v => v.severity === 'CRITICAL'),
    HIGH: violations.filter(v => v.severity === 'HIGH'),
    MEDIUM: violations.filter(v => v.severity === 'MEDIUM'),
    LOW: violations.filter(v => v.severity === 'LOW')
  };

  const byLaw = {};
  for (const law in CONSTITUTIONAL_LAWS) {
    byLaw[law] = violations.filter(v => v.law === law);
  }

  return {
    type: 'COMPLIANCE_REPORT',
    generated_at: deterministicTime(),
    total_violations: violations.length,
    by_severity: {
      critical: bySeverity.CRITICAL.length,
      high: bySeverity.HIGH.length,
      medium: bySeverity.MEDIUM.length,
      low: bySeverity.LOW.length
    },
    by_law: Object.fromEntries(
      Object.entries(byLaw).map(([law, v]) => [law, v.length])
    ),
    system_compliant: violations.length === 0,
    violations: violations
  };
}

module.exports = {
  CONSTITUTIONAL_LAWS,
  ConstitutionalViolation,
  ConstitutionalViolationError,
  ComplianceResult,
  recordViolation,
  getViolations,
  clearViolations,
  isLawEnforced,
  getLaw,
  assertCompliance,
  checkCompliance,
  generateComplianceReport
};
