/**
 * LAYER IV: CB FORMATION (Cognitive Block)
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Cognitive block meaning assembly
 * Input: EVID from Layer III
 * Output: CB (Cognitive Block) with semantic meaning
 *
 * LAW-001: Evidence Required - CB must have evidence backing
 * LAW-003: Non-Contradiction - CB consistency enforced
 * LAW-004: Provenance Chain - Maintains evidence linkage
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * CB (Cognitive Block) types
 */
const CBType = {
  FACT: 'FACT',           // Observed fact from evidence
  BELIEF: 'BELIEF',       // Inferred belief
  GOAL: 'GOAL',           // Intended goal
  ACTION: 'ACTION',       // Action directive
  META: 'META'            // Meta-cognitive block
};

/**
 * Meaning strength levels
 */
const MeaningStrength = {
  CERTAIN: 'CERTAIN',     // >= 0.95
  STRONG: 'STRONG',       // >= 0.8
  MODERATE: 'MODERATE',   // >= 0.6
  WEAK: 'WEAK',           // >= 0.4
  SPECULATIVE: 'SPECULATIVE' // < 0.4
};

/**
 * Form Cognitive Block from evidence
 * LAW-001: Evidence backing required
 * LAW-004: Maintains provenance
 *
 * @param {object} evidence - EVID from Layer III
 * @param {object} options - Formation options
 * @returns {object} CB (Cognitive Block)
 */
function formCognitiveBlock(evidence, options = {}) {
  if (!evidence || evidence.type !== 'EVID') {
    throw new Error('LAYER_IV_ERROR: Invalid evidence input - LAW-001 violation');
  }

  if (!evidence.sealed) {
    throw new Error('LAYER_IV_ERROR: Evidence must be sealed before CB formation');
  }

  const {
    cbType = CBType.FACT,
    interpretation = null,
    context = {}
  } = options;

  const timestamp = deterministicTime();

  // Extract semantic meaning from evidence features
  const semanticContent = extractSemanticMeaning(evidence.features, cbType);

  // Compute meaning strength based on evidence confidence
  const meaningStrength = computeMeaningStrength(evidence.confidence, cbType);

  // Create CB content
  const cbContent = {
    evid_id: evidence.evid_id,
    evid_hash: evidence.seal_hash || evidence.evid_hash,
    semantic: semanticContent,
    strength: meaningStrength.score,
    interpretation: interpretation
  };

  const cbHash = canonicalHash(cbContent);

  const cognitiveBlock = {
    type: 'CB',
    cb_id: `CB_${cbHash.substring(0, 16)}`,
    timestamp: timestamp,
    cb_type: cbType,

    // Evidence linkage (LAW-001, LAW-004)
    evidence_id: evidence.evid_id,
    evidence_hash: evidence.seal_hash || evidence.evid_hash,
    source_trace_hash: evidence.source_trace_hash,
    source_signal_hash: evidence.source_signal_hash,

    // Semantic content
    semantic: semanticContent,
    interpretation: interpretation,
    context: context,

    // Meaning metrics
    meaning_strength: meaningStrength.score,
    strength_level: meaningStrength.level,
    evidence_confidence: evidence.confidence,

    // CB hash
    cb_hash: cbHash,

    // Relationships (for graph formation)
    supports: [],      // CBs this supports
    contradicts: [],   // CBs this contradicts (LAW-003)
    depends_on: []     // CBs this depends on
  };

  // Audit log entry
  auditLog({
    layer: 'LAYER_IV_CB',
    operation: 'FORM_COGNITIVE_BLOCK',
    input_hash: evidence.seal_hash || evidence.evid_hash,
    output_hash: cognitiveBlock.cb_hash,
    metadata: {
      cb_id: cognitiveBlock.cb_id,
      cb_type: cbType,
      evidence_id: evidence.evid_id,
      meaning_strength: meaningStrength.score
    }
  });

  return cognitiveBlock;
}

/**
 * Extract semantic meaning from features
 * LAW-005: Deterministic extraction
 *
 * @param {object} features - Evidence features
 * @param {string} cbType - CB type
 * @returns {object} Semantic content
 */
function extractSemanticMeaning(features, cbType) {
  const semantic = {
    category: features.type || 'UNKNOWN',
    attributes: {},
    relations: []
  };

  // Extract attributes based on feature type
  switch (features.type) {
    case 'STRING':
      semantic.attributes = {
        content_type: 'TEXT',
        length: features.length,
        complexity: features.entropy > 3 ? 'HIGH' : features.entropy > 1.5 ? 'MEDIUM' : 'LOW'
      };
      break;

    case 'NUMBER':
      semantic.attributes = {
        content_type: 'NUMERIC',
        value_class: features.is_integer ? 'INTEGER' : 'DECIMAL',
        polarity: features.sign > 0 ? 'POSITIVE' : features.sign < 0 ? 'NEGATIVE' : 'ZERO'
      };
      break;

    case 'OBJECT':
      semantic.attributes = {
        content_type: 'STRUCTURED',
        complexity: features.key_count > 10 ? 'HIGH' : features.key_count > 3 ? 'MEDIUM' : 'LOW',
        depth: features.depth
      };
      semantic.relations = features.keys ? features.keys.map(k => ({
        type: 'HAS_PROPERTY',
        target: k
      })) : [];
      break;

    case 'ARRAY':
      semantic.attributes = {
        content_type: 'COLLECTION',
        size: features.length,
        homogeneous: features.element_types.length === 1
      };
      break;

    case 'BOOLEAN':
      semantic.attributes = {
        content_type: 'LOGICAL',
        value: features.value
      };
      break;

    default:
      semantic.attributes = { content_type: 'UNDEFINED' };
  }

  // Add CB type context
  semantic.cb_context = cbType;

  return semantic;
}

/**
 * Compute meaning strength from evidence confidence
 * @param {number} evidenceConfidence - Evidence confidence score
 * @param {string} cbType - CB type affects strength calculation
 * @returns {object} Meaning strength result
 */
function computeMeaningStrength(evidenceConfidence, cbType) {
  let score = evidenceConfidence;

  // Adjust based on CB type
  switch (cbType) {
    case CBType.FACT:
      // Facts require high confidence
      score = score * 0.95;
      break;
    case CBType.BELIEF:
      // Beliefs can be lower confidence
      score = score * 0.85;
      break;
    case CBType.GOAL:
      // Goals inherit confidence
      score = score * 0.9;
      break;
    case CBType.ACTION:
      // Actions require higher confidence
      score = score * 0.98;
      break;
    case CBType.META:
      // Meta blocks are analytical
      score = score * 0.8;
      break;
  }

  // Determine level
  let level;
  if (score >= 0.95) level = MeaningStrength.CERTAIN;
  else if (score >= 0.8) level = MeaningStrength.STRONG;
  else if (score >= 0.6) level = MeaningStrength.MODERATE;
  else if (score >= 0.4) level = MeaningStrength.WEAK;
  else level = MeaningStrength.SPECULATIVE;

  return { score: Math.round(score * 1000) / 1000, level };
}

/**
 * Check for contradiction between CBs
 * LAW-003: Non-Contradiction enforcement
 *
 * @param {object} cb1 - First cognitive block
 * @param {object} cb2 - Second cognitive block
 * @returns {object} Contradiction check result
 */
function checkContradiction(cb1, cb2) {
  // Same CB cannot contradict itself
  if (cb1.cb_id === cb2.cb_id) {
    return { contradicts: false, reason: 'SAME_CB' };
  }

  // Check semantic contradiction
  const sem1 = cb1.semantic;
  const sem2 = cb2.semantic;

  // Same category with opposing values
  if (sem1.category === sem2.category) {
    // Boolean contradiction
    if (sem1.category === 'BOOLEAN' &&
        sem1.attributes.value !== sem2.attributes.value) {
      return {
        contradicts: true,
        reason: 'BOOLEAN_OPPOSITION',
        details: { cb1_value: sem1.attributes.value, cb2_value: sem2.attributes.value }
      };
    }

    // Numeric polarity contradiction
    if (sem1.category === 'NUMBER' &&
        sem1.attributes.polarity !== sem2.attributes.polarity &&
        sem1.attributes.polarity !== 'ZERO' &&
        sem2.attributes.polarity !== 'ZERO') {
      return {
        contradicts: true,
        reason: 'POLARITY_OPPOSITION',
        details: { cb1_polarity: sem1.attributes.polarity, cb2_polarity: sem2.attributes.polarity }
      };
    }
  }

  return { contradicts: false, reason: 'NO_CONTRADICTION' };
}

/**
 * Link CBs in relationship
 * @param {object} cb - Source CB
 * @param {string} relationshipType - 'supports' | 'contradicts' | 'depends_on'
 * @param {object} targetCB - Target CB
 * @returns {object} Updated CB
 */
function linkCB(cb, relationshipType, targetCB) {
  const validRelations = ['supports', 'contradicts', 'depends_on'];
  if (!validRelations.includes(relationshipType)) {
    throw new Error(`LAYER_IV_ERROR: Invalid relationship type: ${relationshipType}`);
  }

  // Check contradiction before linking (LAW-003)
  if (relationshipType === 'supports') {
    const contradiction = checkContradiction(cb, targetCB);
    if (contradiction.contradicts) {
      throw new Error(`LAYER_IV_ERROR: Cannot support contradicting CB - LAW-003 violation`);
    }
  }

  const updatedCB = { ...cb };
  updatedCB[relationshipType] = [
    ...updatedCB[relationshipType],
    {
      cb_id: targetCB.cb_id,
      cb_hash: targetCB.cb_hash,
      linked_at: deterministicTime()
    }
  ];

  // Recompute hash with relationships
  updatedCB.cb_hash = canonicalHash({
    original_hash: cb.cb_hash,
    relationships: {
      supports: updatedCB.supports,
      contradicts: updatedCB.contradicts,
      depends_on: updatedCB.depends_on
    }
  });

  return updatedCB;
}

/**
 * Validate CB structure
 * @param {object} cb - CB to validate
 * @returns {object} Validation result
 */
function validateCB(cb) {
  const errors = [];

  if (!cb || cb.type !== 'CB') {
    return { valid: false, errors: ['Invalid CB type marker'] };
  }

  if (!cb.evidence_id) errors.push('Missing evidence_id - LAW-001 violation');
  if (!cb.evidence_hash) errors.push('Missing evidence_hash - provenance broken');
  if (!cb.semantic) errors.push('Missing semantic content');
  if (!cb.cb_hash) errors.push('Missing cb_hash');

  // Verify hash integrity
  const cbContent = {
    evid_id: cb.evidence_id,
    evid_hash: cb.evidence_hash,
    semantic: cb.semantic,
    strength: cb.meaning_strength,
    interpretation: cb.interpretation
  };
  const computedHash = canonicalHash(cbContent);
  if (computedHash !== cb.cb_hash) {
    // Check if relationships modified the hash
    if (!cb.supports.length && !cb.contradicts.length && !cb.depends_on.length) {
      errors.push('CB hash mismatch - integrity violation');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    cb_id: cb.cb_id
  };
}

module.exports = {
  CBType,
  MeaningStrength,
  formCognitiveBlock,
  extractSemanticMeaning,
  computeMeaningStrength,
  checkContradiction,
  linkCB,
  validateCB
};
