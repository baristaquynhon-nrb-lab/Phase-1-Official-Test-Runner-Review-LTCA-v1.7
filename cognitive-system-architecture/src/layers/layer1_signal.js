/**
 * LAYER I: SIGNAL REALITY (ΔC)
 * LTCA-NRBPL Cognitive Operating System
 *
 * Primary Function: Physical measurement capture
 * Input: Raw sensory/data input from physical reality
 * Output: ΔC Signal with deterministic hash
 *
 * LAW-005: Deterministic - No randomness in signal capture
 * LAW-001: Evidence - Creates traceable signal record
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime } = require('../core/deterministic_clock');
const { auditLog } = require('../core/audit_logger');

/**
 * Signal types enumeration
 */
const SignalType = {
  SENSOR: 'SENSOR',
  API: 'API',
  USER_INPUT: 'USER_INPUT',
  SYSTEM: 'SYSTEM',
  FEEDBACK: 'FEEDBACK'
};

/**
 * Capture signal from physical reality
 * LAW-005: Deterministic capture - no Math.random(), no uncontrolled timestamps
 *
 * @param {any} input - Raw input data
 * @param {object} options - Capture options
 * @param {string} options.source - Signal source identifier
 * @param {string} options.type - Signal type (from SignalType)
 * @param {object} options.calibration - Calibration data if applicable
 * @returns {object} ΔC Signal object
 */
function captureSignal(input, options = {}) {
  const {
    source = 'UNKNOWN',
    type = SignalType.SYSTEM,
    calibration = null
  } = options;

  // Compute deterministic hash of input
  const inputHash = canonicalHash(input);

  // Create ΔC signal structure
  const signal = {
    type: 'ΔC_SIGNAL',
    signal_id: `SIG_${inputHash.substring(0, 16)}`,
    timestamp: deterministicTime(),
    source: source,
    signal_type: type,
    payload: input,
    calibration: calibration,
    hash: inputHash
  };

  // Compute signal envelope hash
  signal.envelope_hash = canonicalHash({
    signal_id: signal.signal_id,
    timestamp: signal.timestamp,
    source: signal.source,
    signal_type: signal.signal_type,
    payload_hash: signal.hash
  });

  // Audit log entry
  auditLog({
    layer: 'LAYER_I_SIGNAL',
    operation: 'CAPTURE_SIGNAL',
    input_hash: inputHash,
    output_hash: signal.envelope_hash,
    metadata: {
      signal_id: signal.signal_id,
      source: source,
      type: type
    }
  });

  return signal;
}

/**
 * Validate signal structure
 * @param {object} signal - Signal to validate
 * @returns {object} Validation result
 */
function validateSignal(signal) {
  const errors = [];

  if (!signal) {
    return { valid: false, errors: ['Signal is null or undefined'] };
  }

  if (signal.type !== 'ΔC_SIGNAL') {
    errors.push('Invalid signal type marker');
  }

  if (!signal.signal_id) {
    errors.push('Missing signal_id');
  }

  if (!signal.timestamp) {
    errors.push('Missing timestamp');
  }

  if (!signal.hash) {
    errors.push('Missing payload hash');
  }

  // Verify hash integrity
  if (signal.payload !== undefined) {
    const computedHash = canonicalHash(signal.payload);
    if (computedHash !== signal.hash) {
      errors.push('Payload hash mismatch - integrity violation');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create feedback signal (for closed-loop)
 * Used by Layer VIII to inject feedback into signal stream
 *
 * @param {object} feedbackData - Feedback payload
 * @param {string} actionId - Source action ID
 * @returns {object} ΔC Feedback signal
 */
function createFeedbackSignal(feedbackData, actionId) {
  return captureSignal(feedbackData, {
    source: `ACTION_${actionId}`,
    type: SignalType.FEEDBACK,
    calibration: { feedback_loop: true, source_action: actionId }
  });
}

/**
 * Batch capture multiple signals
 * LAW-005: Maintains deterministic ordering
 *
 * @param {any[]} inputs - Array of inputs
 * @param {object} options - Shared options
 * @returns {object[]} Array of ΔC signals
 */
function captureSignalBatch(inputs, options = {}) {
  return inputs.map((input, index) => {
    return captureSignal(input, {
      ...options,
      source: options.source ? `${options.source}_${index}` : `BATCH_${index}`
    });
  });
}

module.exports = {
  SignalType,
  captureSignal,
  validateSignal,
  createFeedbackSignal,
  captureSignalBatch
};
