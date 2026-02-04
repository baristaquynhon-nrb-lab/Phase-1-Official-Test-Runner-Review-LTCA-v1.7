/**
 * META_EVALUATION_ENGINE_v1
 * Input : { cr_state, meta_input }
 * Output: { meta_state_update } + deterministic meta_hash + audit
 *
 * Role: nhận Meta_Input → cập nhật CR.meta_state theo luật meta (self-monitoring),
 * sinh Meta_State_Update + meta_hash + audit.
 */

import { hashObject } from '../canon/hash.js';

/**
 * Helper: clamp value to [0, 1]
 */
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export class MetaEvaluationEngine {
  constructor(config = {}) {
    this.config = {
      branch: 'TEXT',

      // thresholds (normative defaults)
      tau_low_ksi: 0.55,
      tau_conflict: 0.25,
      tau_drift: 0.35,
      tau_load: 0.60,

      // deterministic smoothing factors
      alpha_ksi: 0.70,        // keep 70% of projected ksi, 30% of previous
      alpha_conflict: 0.80,
      alpha_drift: 0.60,
      alpha_load: 0.70,

      ...config
    };
    this.version = 'meta_evaluation_v1.0';
  }

  /**
   * Evaluate meta input and produce meta state update
   * @param {Object} cr_state - CR state object
   * @param {Object} meta_input - Meta input from ReasoningToMetaEngine
   * @returns {Object} - { verdict, meta_state_update, audit } or { verdict: 'REFUSE', reason }
   */
  evaluate(cr_state, meta_input) {
    // -----------------------------
    // 1) Fail-fast validation
    // -----------------------------
    if (!cr_state || typeof cr_state !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'cr_state is null or not an object' } };
    }

    if (!cr_state.state_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'state_hash missing' } };
    }

    if (!meta_input || typeof meta_input !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_META_INPUT', details: { error: 'meta_input is null or not an object' } };
    }

    if (!meta_input.meta_input_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_META_INPUT', details: { error: 'meta_input_hash missing' } };
    }

    if (this.config.branch !== 'TEXT') {
      return { verdict: 'REFUSE', reason: 'SCOPE_VIOLATION', details: { expected: 'TEXT', got: this.config.branch } };
    }

    // -----------------------------
    // 2) Previous meta state
    // -----------------------------
    const prev = cr_state.meta_state || {};
    const prevKSI = typeof prev.ksi === 'number' ? clamp01(prev.ksi) : 1.0;
    const prevConflict = typeof prev.conflict_density === 'number' ? clamp01(prev.conflict_density) : 0.0;
    const prevDrift = typeof prev.drift_level === 'number' ? clamp01(prev.drift_level) : 0.0;
    const prevStress = typeof prev.cognitive_stress === 'number' ? clamp01(prev.cognitive_stress) : 0.0;

    // -----------------------------
    // 3) Deterministic update rules
    // -----------------------------
    // Smoothed update to avoid abrupt oscillation (still deterministic)
    const ksi_next = clamp01(
      this.config.alpha_ksi * clamp01(meta_input.ksi) +
      (1 - this.config.alpha_ksi) * prevKSI
    );

    const conflict_next = clamp01(
      this.config.alpha_conflict * clamp01(meta_input.conflict_density) +
      (1 - this.config.alpha_conflict) * prevConflict
    );

    const drift_next = clamp01(
      this.config.alpha_drift * clamp01(meta_input.confidence_drift) +
      (1 - this.config.alpha_drift) * prevDrift
    );

    const stress_next = clamp01(
      this.config.alpha_load * clamp01(meta_input.resource_load) +
      (1 - this.config.alpha_load) * prevStress
    );

    // -----------------------------
    // 4) Alert generation (deterministic, stable ordering)
    // -----------------------------
    const alerts = [];

    if (ksi_next < this.config.tau_low_ksi) {
      alerts.push('KNOWLEDGE_INSTABILITY');
    }
    if (conflict_next > this.config.tau_conflict) {
      alerts.push('INTERNAL_CONFLICT');
    }
    if (drift_next > this.config.tau_drift) {
      alerts.push('MEANING_DRIFT');
    }
    if (stress_next > this.config.tau_load) {
      alerts.push('RESOURCE_STRAIN');
    }

    // Sort for deterministic canonical ordering
    alerts.sort();

    // -----------------------------
    // 5) Determine regulation level
    // -----------------------------
    let regulation = 'NONE';

    if (alerts.length === 0) {
      regulation = 'NONE';
    } else if (alerts.length === 1) {
      regulation = 'REQUEST_EVIDENCE';
    } else if (alerts.length === 2) {
      regulation = 'THROTTLE';
    } else {
      regulation = 'HALT';
    }

    // Override to HALT if KSI is critically low
    if (ksi_next < 0.3) {
      regulation = 'HALT';
    }

    // -----------------------------
    // 6) Build Meta_State_Update
    // -----------------------------
    const meta_state_update = {
      meta_state_id: `MS_${meta_input.meta_input_id}`,
      source_meta_input_hash: meta_input.meta_input_hash,
      cr_state_hash: cr_state.state_hash,

      // Updated meta values (ready to merge into CR.meta_state)
      knowledge_stability_index: ksi_next,
      conflict_density: conflict_next,
      drift_level: drift_next,
      cognitive_stress: stress_next,

      alert_flags: alerts,
      regulation,

      // Delta from previous (for audit/debugging)
      delta: {
        ksi_change: ksi_next - prevKSI,
        conflict_change: conflict_next - prevConflict,
        drift_change: drift_next - prevDrift,
        stress_change: stress_next - prevStress
      }
    };

    meta_state_update.meta_hash = hashObject(meta_state_update);

    // -----------------------------
    // 7) Audit record
    // -----------------------------
    const audit = {
      stage: 'META_EVALUATION',
      input_hash: hashObject({
        cr_state_hash: cr_state.state_hash,
        meta_input_hash: meta_input.meta_input_hash
      }),
      output_hash: meta_state_update.meta_hash,
      payload_hash: hashObject({
        meta_state_id: meta_state_update.meta_state_id,
        ksi: meta_state_update.knowledge_stability_index,
        conflict_density: meta_state_update.conflict_density,
        drift_level: meta_state_update.drift_level,
        cognitive_stress: meta_state_update.cognitive_stress,
        alerts: meta_state_update.alert_flags,
        regulation: meta_state_update.regulation
      }),
      payload: {
        meta_state_id: meta_state_update.meta_state_id,
        ksi: meta_state_update.knowledge_stability_index,
        conflict_density: meta_state_update.conflict_density,
        drift_level: meta_state_update.drift_level,
        cognitive_stress: meta_state_update.cognitive_stress,
        alerts: meta_state_update.alert_flags,
        regulation: meta_state_update.regulation
      },
      runtime: {
        engine_version: this.version,
        branch: 'TEXT'
      },
      timestamp: new Date().toISOString()
    };

    return { verdict: 'SUPPORTED', meta_state_update, audit };
  }
}
