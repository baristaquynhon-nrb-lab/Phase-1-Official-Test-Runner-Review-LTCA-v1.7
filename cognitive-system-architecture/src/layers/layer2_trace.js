/**
 * LAYER II: TRACE STRUCTURING
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Pattern extraction & normalization
 * Input: ΔC Signal from Layer I
 * Output: TRACE with deterministic feature mapping
 *
 * LAW-005: Deterministic feature extraction
 * LAW-004: Maintains provenance to source signal
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Trace confidence levels
 */
const ConfidenceLevel = {
  HIGH: 'HIGH',       // >= 0.9
  MEDIUM: 'MEDIUM',   // >= 0.7
  LOW: 'LOW',         // >= 0.5
  UNCERTAIN: 'UNCERTAIN' // < 0.5
};

/**
 * Deterministic feature extraction
 * LAW-005: Same input always produces same features
 *
 * @param {any} payload - Signal payload
 * @returns {object} Feature map
 */
function deterministicFeatureMap(payload) {
  const features = {};

  if (payload === null || payload === undefined) {
    return { type: 'NULL', features: {} };
  }

  const payloadType = typeof payload;

  switch (payloadType) {
    case 'string':
      features.type = 'STRING';
      features.length = payload.length;
      features.char_distribution = computeCharDistribution(payload);
      features.entropy = computeEntropy(payload);
      break;

    case 'number':
      features.type = 'NUMBER';
      features.value = payload;
      features.is_integer = Number.isInteger(payload);
      features.sign = Math.sign(payload);
      features.magnitude = Math.floor(Math.log10(Math.abs(payload) || 1));
      break;

    case 'boolean':
      features.type = 'BOOLEAN';
      features.value = payload;
      break;

    case 'object':
      if (Array.isArray(payload)) {
        features.type = 'ARRAY';
        features.length = payload.length;
        features.element_types = [...new Set(payload.map(e => typeof e))].sort();
      } else {
        features.type = 'OBJECT';
        features.keys = Object.keys(payload).sort();
        features.key_count = features.keys.length;
        features.depth = computeObjectDepth(payload);
      }
      break;

    default:
      features.type = 'UNKNOWN';
  }

  return features;
}

/**
 * Compute character distribution (deterministic)
 * @param {string} str - Input string
 * @returns {object} Character frequency map
 */
function computeCharDistribution(str) {
  const dist = {};
  for (const char of str) {
    const code = char.charCodeAt(0);
    const category = code < 128 ? 'ascii' : 'unicode';
    dist[category] = (dist[category] || 0) + 1;
  }
  return dist;
}

/**
 * Compute Shannon entropy (deterministic)
 * @param {string} str - Input string
 * @returns {number} Entropy value
 */
function computeEntropy(str) {
  if (str.length === 0) return 0;

  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }

  // Round to fixed precision for determinism
  return Math.round(entropy * 1000) / 1000;
}

/**
 * Compute object depth (deterministic)
 * @param {object} obj - Input object
 * @param {number} currentDepth - Current recursion depth
 * @returns {number} Maximum depth
 */
function computeObjectDepth(obj, currentDepth = 1) {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const depth = computeObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Extract trace from signal
 * LAW-005: Deterministic transformation
 * LAW-004: Maintains provenance chain
 *
 * @param {object} signal - ΔC Signal from Layer I
 * @returns {object} TRACE object
 */
function extractTrace(signal) {
  if (!signal || signal.type !== 'ΔC_SIGNAL') {
    throw new Error('LAYER_II_ERROR: Invalid signal input');
  }

  const features = deterministicFeatureMap(signal.payload);

  // Compute trace hash
  const traceContent = {
    source_hash: signal.hash,
    features: features
  };
  const traceHash = canonicalHash(traceContent);

  // Compute confidence based on feature completeness
  const confidence = computeConfidence(features);

  const trace = {
    type: 'TRACE',
    trace_id: `TRC_${traceHash.substring(0, 16)}`,
    timestamp: deterministicTime(),
    source_signal_id: signal.signal_id,
    source_hash: signal.hash,
    features: features,
    confidence: confidence,
    confidence_level: getConfidenceLevel(confidence),
    trace_hash: traceHash
  };

  // Audit log entry
  auditLog({
    layer: 'LAYER_II_TRACE',
    operation: 'EXTRACT_TRACE',
    input_hash: signal.hash,
    output_hash: trace.trace_hash,
    metadata: {
      trace_id: trace.trace_id,
      source_signal_id: signal.signal_id,
      confidence: confidence
    }
  });

  return trace;
}

/**
 * Compute trace confidence score
 * @param {object} features - Extracted features
 * @returns {number} Confidence score 0-1
 */
function computeConfidence(features) {
  let score = 0.5; // Base confidence

  if (features.type && features.type !== 'UNKNOWN') {
    score += 0.2;
  }

  if (features.type === 'OBJECT' && features.key_count > 0) {
    score += 0.2;
  }

  if (features.type === 'STRING' && features.entropy > 0) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Get confidence level from score
 * @param {number} score - Confidence score
 * @returns {string} Confidence level
 */
function getConfidenceLevel(score) {
  if (score >= 0.9) return ConfidenceLevel.HIGH;
  if (score >= 0.7) return ConfidenceLevel.MEDIUM;
  if (score >= 0.5) return ConfidenceLevel.LOW;
  return ConfidenceLevel.UNCERTAIN;
}

/**
 * Validate trace structure
 * @param {object} trace - Trace to validate
 * @returns {object} Validation result
 */
function validateTrace(trace) {
  const errors = [];

  if (!trace || trace.type !== 'TRACE') {
    errors.push('Invalid trace type marker');
  }

  if (!trace.source_hash) {
    errors.push('Missing source_hash - provenance broken');
  }

  if (!trace.trace_hash) {
    errors.push('Missing trace_hash');
  }

  // Verify trace hash integrity
  if (trace.source_hash && trace.features) {
    const computedHash = canonicalHash({
      source_hash: trace.source_hash,
      features: trace.features
    });
    if (computedHash !== trace.trace_hash) {
      errors.push('Trace hash mismatch - integrity violation');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  ConfidenceLevel,
  deterministicFeatureMap,
  extractTrace,
  validateTrace,
  computeEntropy,
  computeConfidence
};
