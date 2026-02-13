/**
 * LAYER V: GENE ENCODING
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Semantic DNA encoding
 * Input: CB from Layer IV
 * Output: GENE (Genetic encoding of cognitive content)
 *
 * LAW-004: Provenance Chain - Maintains CB linkage
 * LAW-005: Determinism - Encoding is deterministic
 *
 * The GENE layer transforms cognitive blocks into a compact,
 * transmittable, and verifiable genetic encoding that preserves
 * semantic meaning while enabling efficient storage and comparison.
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Gene encoding types
 */
const GeneType = {
  SEMANTIC: 'SEMANTIC',     // Meaning-preserving encoding
  STRUCTURAL: 'STRUCTURAL', // Structure-preserving encoding
  RELATIONAL: 'RELATIONAL', // Relationship encoding
  COMPOSITE: 'COMPOSITE'    // Combined encoding
};

/**
 * Gene pool for tracking encoded genes
 */
const _genePool = new Map();

/**
 * Clear gene pool (for testing/replay)
 */
function clearGenePool() {
  _genePool.clear();
}

/**
 * Get gene pool size
 * @returns {number} Number of genes in pool
 */
function getGenePoolSize() {
  return _genePool.size;
}

/**
 * Encode CB into GENE
 * LAW-005: Deterministic encoding
 * LAW-004: Maintains provenance
 *
 * @param {object} cb - CB from Layer IV
 * @param {object} options - Encoding options
 * @returns {object} GENE object
 */
function encodeGene(cb, options = {}) {
  if (!cb || cb.type !== 'CB') {
    throw new Error('LAYER_V_ERROR: Invalid CB input');
  }

  const {
    geneType = GeneType.SEMANTIC,
    compress = true
  } = options;

  const timestamp = deterministicTime();

  // Generate semantic DNA sequence
  const dnaSequence = generateDNASequence(cb.semantic, cb.cb_type);

  // Create gene signature (compact representation)
  const geneSignature = createGeneSignature(cb, dnaSequence);

  // Compute gene hash
  const geneContent = {
    cb_id: cb.cb_id,
    cb_hash: cb.cb_hash,
    dna_sequence: dnaSequence,
    signature: geneSignature
  };
  const geneHash = canonicalHash(geneContent);

  const gene = {
    type: 'GENE',
    gene_id: `GENE_${geneHash.substring(0, 16)}`,
    timestamp: timestamp,
    gene_type: geneType,

    // Source linkage (LAW-004)
    cb_id: cb.cb_id,
    cb_hash: cb.cb_hash,
    evidence_hash: cb.evidence_hash,

    // DNA encoding
    dna_sequence: dnaSequence,
    dna_length: dnaSequence.length,
    signature: geneSignature,

    // Semantic preservation
    semantic_category: cb.semantic.category,
    meaning_strength: cb.meaning_strength,

    // Compression flag
    compressed: compress,

    // Gene hash
    gene_hash: geneHash,

    // Expression potential (for MODE-A evaluation)
    expression_ready: true,
    expression_requirements: extractExpressionRequirements(cb)
  };

  // Add to gene pool
  _genePool.set(gene.gene_id, gene);

  // Audit log entry
  auditLog({
    layer: 'LAYER_V_GENE',
    operation: 'ENCODE_GENE',
    input_hash: cb.cb_hash,
    output_hash: gene.gene_hash,
    metadata: {
      gene_id: gene.gene_id,
      cb_id: cb.cb_id,
      dna_length: dnaSequence.length,
      gene_type: geneType
    }
  });

  return gene;
}

/**
 * Generate DNA sequence from semantic content
 * LAW-005: Deterministic generation
 *
 * @param {object} semantic - Semantic content from CB
 * @param {string} cbType - CB type
 * @returns {string} DNA sequence string
 */
function generateDNASequence(semantic, cbType) {
  const segments = [];

  // Header segment (CB type marker)
  const typeMarker = {
    'FACT': 'F',
    'BELIEF': 'B',
    'GOAL': 'G',
    'ACTION': 'A',
    'META': 'M'
  }[cbType] || 'X';
  segments.push(`[${typeMarker}]`);

  // Category segment
  const categoryCode = encodeCategoryToDNA(semantic.category);
  segments.push(categoryCode);

  // Attributes segment
  const attributeCode = encodeAttributesToDNA(semantic.attributes);
  segments.push(attributeCode);

  // Relations segment (if present)
  if (semantic.relations && semantic.relations.length > 0) {
    const relationCode = encodeRelationsToDNA(semantic.relations);
    segments.push(relationCode);
  }

  return segments.join('-');
}

/**
 * Encode category to DNA-like string
 * @param {string} category - Semantic category
 * @returns {string} DNA segment
 */
function encodeCategoryToDNA(category) {
  const categoryMap = {
    'STRING': 'ATCG',
    'NUMBER': 'GCTA',
    'BOOLEAN': 'ATAT',
    'OBJECT': 'CGCG',
    'ARRAY': 'TATA',
    'NULL': 'AAAA',
    'UNKNOWN': 'TTTT'
  };
  return categoryMap[category] || 'XXXX';
}

/**
 * Encode attributes to DNA-like string
 * @param {object} attributes - Semantic attributes
 * @returns {string} DNA segment
 */
function encodeAttributesToDNA(attributes) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return 'NNNN';
  }

  // Create deterministic attribute encoding
  const attrKeys = Object.keys(attributes).sort();
  const attrHash = canonicalHash(attributes);

  // Use hash prefix as DNA
  return attrHash.substring(0, 8).toUpperCase();
}

/**
 * Encode relations to DNA-like string
 * @param {object[]} relations - Semantic relations
 * @returns {string} DNA segment
 */
function encodeRelationsToDNA(relations) {
  if (!relations || relations.length === 0) {
    return 'R0';
  }

  const relHash = canonicalHash(relations);
  return `R${relations.length}_${relHash.substring(0, 4).toUpperCase()}`;
}

/**
 * Create compact gene signature
 * @param {object} cb - Source CB
 * @param {string} dnaSequence - Generated DNA
 * @returns {string} Gene signature
 */
function createGeneSignature(cb, dnaSequence) {
  const signatureInput = {
    cb_hash: cb.cb_hash,
    dna: dnaSequence,
    strength: cb.meaning_strength
  };
  return canonicalHash(signatureInput).substring(0, 32);
}

/**
 * Extract expression requirements for MODE-A
 * @param {object} cb - Source CB
 * @returns {object} Expression requirements
 */
function extractExpressionRequirements(cb) {
  return {
    requires_evidence: true,
    minimum_strength: 0.5,
    cb_type: cb.cb_type,
    has_dependencies: cb.depends_on && cb.depends_on.length > 0,
    dependency_count: cb.depends_on ? cb.depends_on.length : 0
  };
}

/**
 * Decode gene back to semantic representation
 * LAW-005: Deterministic decoding
 *
 * @param {object} gene - GENE object
 * @returns {object} Decoded semantic info
 */
function decodeGene(gene) {
  if (!gene || gene.type !== 'GENE') {
    throw new Error('LAYER_V_ERROR: Invalid gene input');
  }

  const segments = gene.dna_sequence.split('-');

  // Parse type marker
  const typeMarker = segments[0] ? segments[0].replace(/[\[\]]/g, '') : 'X';
  const cbType = {
    'F': 'FACT',
    'B': 'BELIEF',
    'G': 'GOAL',
    'A': 'ACTION',
    'M': 'META'
  }[typeMarker] || 'UNKNOWN';

  return {
    gene_id: gene.gene_id,
    cb_type: cbType,
    category: gene.semantic_category,
    dna_segments: segments,
    meaning_strength: gene.meaning_strength,
    expression_requirements: gene.expression_requirements
  };
}

/**
 * Compare two genes for similarity
 * @param {object} gene1 - First gene
 * @param {object} gene2 - Second gene
 * @returns {object} Comparison result
 */
function compareGenes(gene1, gene2) {
  if (gene1.gene_hash === gene2.gene_hash) {
    return { identical: true, similarity: 1.0 };
  }

  // Compare DNA sequences
  const dna1 = gene1.dna_sequence;
  const dna2 = gene2.dna_sequence;

  // Simple similarity based on common segments
  const segments1 = dna1.split('-');
  const segments2 = dna2.split('-');

  let matches = 0;
  const maxLen = Math.max(segments1.length, segments2.length);

  for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
    if (segments1[i] === segments2[i]) matches++;
  }

  const similarity = maxLen > 0 ? matches / maxLen : 0;

  return {
    identical: false,
    similarity: Math.round(similarity * 1000) / 1000,
    common_segments: matches,
    total_segments: maxLen
  };
}

/**
 * Validate gene structure
 * @param {object} gene - Gene to validate
 * @returns {object} Validation result
 */
function validateGene(gene) {
  const errors = [];

  if (!gene || gene.type !== 'GENE') {
    return { valid: false, errors: ['Invalid gene type marker'] };
  }

  if (!gene.cb_id) errors.push('Missing cb_id - provenance broken');
  if (!gene.cb_hash) errors.push('Missing cb_hash');
  if (!gene.dna_sequence) errors.push('Missing dna_sequence');
  if (!gene.gene_hash) errors.push('Missing gene_hash');

  // Verify hash integrity
  const geneContent = {
    cb_id: gene.cb_id,
    cb_hash: gene.cb_hash,
    dna_sequence: gene.dna_sequence,
    signature: gene.signature
  };
  const computedHash = canonicalHash(geneContent);
  if (computedHash !== gene.gene_hash) {
    errors.push('Gene hash mismatch - integrity violation');
  }

  return {
    valid: errors.length === 0,
    errors,
    gene_id: gene.gene_id
  };
}

/**
 * Get gene from pool
 * @param {string} geneId - Gene ID
 * @returns {object|null} Gene or null
 */
function getGene(geneId) {
  return _genePool.get(geneId) || null;
}

module.exports = {
  GeneType,
  encodeGene,
  decodeGene,
  compareGenes,
  validateGene,
  generateDNASequence,
  createGeneSignature,
  getGene,
  clearGenePool,
  getGenePoolSize
};
