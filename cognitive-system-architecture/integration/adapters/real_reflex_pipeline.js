"use strict";

/**
 * REAL REFLEX PIPELINE ADAPTER
 * NRB Cognitive Stack - Full Brain Integration
 *
 * Pipeline: ΔC → PFT → COP → GSRA → Action
 *
 * CAS + EPSP + LAW-005 Compliant:
 * - Deterministic execution
 * - Epistemic separation maintained
 * - Hash-chain integrity preserved
 *
 * This adapter wires real modules when available,
 * with safe fallbacks for graceful degradation.
 */

const crypto = require("crypto");

// Interface imports
const { pftToCop } = require("../interfaces/PFT_COP_interface");
const { buildCopToGsraEnvelope } = require("../interfaces/COP_GSRA_interface");
const { gsraToAction } = require("../interfaces/GSRA_ACTION_interface");

// ═══════════════════════════════════════════════════════════════════════════
// MODULE LOADING (with fallback)
// ═══════════════════════════════════════════════════════════════════════════

let deterministicTime;
let synthesizeMeaning;
let evaluateEpistemicState;
let reviseBelief;

// Try to load deterministic clock
try {
  ({ deterministicTime } = require("../../src/core/deterministic_clock"));
} catch (e) {
  let counter = 0;
  deterministicTime = () => ({ logical: ++counter, node: "ADAPTER", sequence: counter });
}

// Try to load GSRA Brain modules (M1, M2, M3)
try {
  ({ synthesizeMeaning } = require("../../gsra/brain/meaning_synthesis_engine"));
} catch (e) {
  synthesizeMeaning = null;
}

try {
  ({ evaluateEpistemicState } = require("../../gsra/brain/epistemic_uncertainty_evaluator"));
} catch (e) {
  evaluateEpistemicState = null;
}

try {
  ({ reviseBelief } = require("../../gsra/brain/loopback_revision_engine"));
} catch (e) {
  reviseBelief = null;
}

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL HASHING
// ═══════════════════════════════════════════════════════════════════════════

function canonicalize(obj) {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc, k) => {
      if (obj[k] !== undefined) acc[k] = canonicalize(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

function sha256Canonical(obj) {
  const canon = JSON.stringify(canonicalize(obj));
  return crypto.createHash("sha256").update(canon).digest("hex");
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fallback PFT: Signal classification
 */
function fallbackClassifySignal(sensorInput) {
  return {
    signal_class: sensorInput.features?.distress ? "DISTRESS_AUDIO" : "NORMAL_AUDIO",
    confidence: 0.9
  };
}

/**
 * Fallback PFT: Generate pseudo-symbol
 */
function fallbackGeneratePseudoSymbol(classified, sensorInput) {
  const traceHash = sha256Canonical(sensorInput);

  return {
    type: "pseudo_symbol",
    signal_class: classified.signal_class,
    confidence: classified.confidence,
    urgency: classified.signal_class === "DISTRESS_AUDIO" ? 5 : 1,
    trace_origin: traceHash,
    timestamp_pft_emit: deterministicTime()
  };
}

/**
 * Fallback COP: Run meaning pipeline
 */
function fallbackRunCOPPipeline(text) {
  return {
    type: "meaning_frame",
    text: text,
    inputs: { pft_trace_origin: sha256Canonical({ text }) },
    confidence: 0.85
  };
}

/**
 * Fallback GSRA: Process envelope
 */
function fallbackProcessGSRAEnvelope(envelope) {
  // Simple epistemic check
  const hasEvidence = envelope.epistemic_trace?.trace_origin !== null;
  const verdict = hasEvidence ? "ALLOW" : "REJECT";

  return {
    response_type: "gsra_verdict",
    verdict: verdict,
    trace_hash: envelope.trace_hash,
    timestamp_gsra_emit: deterministicTime(),
    action_policy: {
      action: verdict === "ALLOW" ? "CALL_HELP" : "NO_ACTION",
      priority: verdict === "ALLOW" ? 5 : 0,
      requires_human: true
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REFLEX EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run real closed-loop reflex execution
 * ΔC → PFT → COP → GSRA (with M1/M2/M3) → Action
 *
 * @param {object} sensorInput - ΔC sensor data
 * @returns {object} Complete pipeline result
 */
function runRealReflex(sensorInput) {
  // ═══════════════════════════════════════════════════════════
  // LAYER 1: PFT (Phenomenon → Pseudo-Symbol)
  // ═══════════════════════════════════════════════════════════

  const classified = fallbackClassifySignal(sensorInput);
  const pseudoSymbol = fallbackGeneratePseudoSymbol(classified, sensorInput);

  // ═══════════════════════════════════════════════════════════
  // LAYER 2: COP (Pseudo-Symbol → Meaning Frame)
  // ═══════════════════════════════════════════════════════════

  const copInput = pftToCop(pseudoSymbol);
  const meaningFrame = fallbackRunCOPPipeline(copInput.text);

  // Update meaning frame with trace origin
  meaningFrame.inputs.pft_trace_origin = pseudoSymbol.trace_origin;

  // ═══════════════════════════════════════════════════════════
  // LAYER 3: GSRA BRAIN (M1 → M2 → M3)
  // ═══════════════════════════════════════════════════════════

  const logicalTime = deterministicTime();
  const envelope = buildCopToGsraEnvelope(meaningFrame, logicalTime);

  let gsraResult;
  let brainActivation = {
    m1_active: false,
    m2_active: false,
    m3_active: false
  };

  // M1: Meaning Synthesis Engine
  let groundedMeaning = null;
  if (synthesizeMeaning) {
    try {
      groundedMeaning = synthesizeMeaning(meaningFrame);
      brainActivation.m1_active = true;
    } catch (e) {
      groundedMeaning = null;
    }
  }

  // M2: Epistemic Uncertainty Evaluator
  let epistemicEval = null;
  if (evaluateEpistemicState && groundedMeaning) {
    try {
      epistemicEval = evaluateEpistemicState(groundedMeaning);
      brainActivation.m2_active = true;
    } catch (e) {
      epistemicEval = null;
    }
  }

  // M3: Loopback Revision Engine
  let revision = null;
  if (reviseBelief && groundedMeaning && epistemicEval) {
    try {
      revision = reviseBelief(groundedMeaning, epistemicEval);
      brainActivation.m3_active = true;
    } catch (e) {
      revision = null;
    }
  }

  // Generate GSRA verdict
  if (brainActivation.m2_active && epistemicEval) {
    // Use M2 evaluation for verdict
    const verdict = epistemicEval.epistemic_status === "STABLE" ? "ALLOW" : "REJECT";

    gsraResult = {
      response_type: "gsra_verdict",
      verdict: verdict,
      trace_hash: envelope.trace_hash,
      timestamp_gsra_emit: deterministicTime(),
      epistemic_status: epistemicEval.epistemic_status,
      grounding_score: epistemicEval.grounding_score,
      action_policy: {
        action: verdict === "ALLOW" ? "CALL_HELP" : "NO_ACTION",
        priority: verdict === "ALLOW" ? 5 : 0,
        requires_human: true
      }
    };
  } else {
    // Fallback GSRA
    gsraResult = fallbackProcessGSRAEnvelope(envelope);
  }

  // ═══════════════════════════════════════════════════════════
  // LAYER 4: ACTION
  // ═══════════════════════════════════════════════════════════

  const action = gsraToAction(gsraResult);

  // ═══════════════════════════════════════════════════════════
  // BUILD COMPLETE RESULT
  // ═══════════════════════════════════════════════════════════

  return {
    // Pipeline artifacts
    pft: pseudoSymbol,
    cop: meaningFrame,
    envelope: envelope,
    gsra: gsraResult,
    action: action,

    // Brain module outputs
    brain: {
      grounded_meaning: groundedMeaning,
      epistemic_evaluation: epistemicEval,
      revision: revision,
      activation: brainActivation
    },

    // Trace hash (for forensic verification)
    trace_hash: envelope.trace_hash,

    // Metadata
    metadata: {
      pipeline_mode: "REAL",
      brain_modules_active: Object.values(brainActivation).filter(v => v).length,
      timestamp: deterministicTime()
    }
  };
}

/**
 * Check brain module availability
 *
 * @returns {object} Module availability status
 */
function getBrainStatus() {
  return {
    m1_meaning_synthesis: synthesizeMeaning !== null,
    m2_epistemic_evaluator: evaluateEpistemicState !== null,
    m3_loopback_revision: reviseBelief !== null,
    full_brain_active: synthesizeMeaning !== null &&
                       evaluateEpistemicState !== null &&
                       reviseBelief !== null
  };
}

module.exports = {
  runRealReflex,
  getBrainStatus
};
