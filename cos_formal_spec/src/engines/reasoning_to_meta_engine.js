/**
 * REASONING_TO_META_ENGINE_v1
 * Input : { cr_state, reasoning_result }
 * Output: Meta_Input (deterministic projection)
 *
 * Role: chuyển Reasoning_Result + CR_state → Meta_Input
 * Không tự đánh giá; chỉ "projection/binding" dữ liệu vào dạng meta.
 */

import { hashObject } from '../canon/hash.js';

/**
 * Helper: clamp value to [0, 1]
 */
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export class ReasoningToMetaEngine {
  constructor(config = {}) {
    this.config = {
      branch: 'TEXT',
      // deterministic weights (tunable, but fixed in v1)
      w_conflict: 0.55,
      w_drift: 0.30,
      w_load: 0.15,
      ...config
    };
    this.version = 'reasoning_to_meta_v1.0';
  }

  /**
   * Transform reasoning result + CR state to Meta Input
   * @param {Object} cr_state - CR state object
   * @param {Object} reasoning_result - Reasoning result from ReasoningExecutionEngine
   * @returns {Object} - { verdict, meta_input, audit } or { verdict: 'REFUSE', reason }
   */
  transform(cr_state, reasoning_result) {
    // -----------------------------
    // 1) Fail-fast validation
    // -----------------------------
    if (!cr_state || typeof cr_state !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'cr_state is null or not an object' } };
    }

    if (!cr_state.state_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'state_hash missing' } };
    }

    if (!reasoning_result || typeof reasoning_result !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_REASONING_RESULT', details: { error: 'reasoning_result is null or not an object' } };
    }

    if (!reasoning_result.reasoning_hash || !reasoning_result.arc_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_REASONING_RESULT', details: { error: 'reasoning_hash or arc_hash missing' } };
    }

    if (this.config.branch !== 'TEXT') {
      return { verdict: 'REFUSE', reason: 'SCOPE_VIOLATION', details: { expected: 'TEXT', got: this.config.branch } };
    }

    // -----------------------------
    // 2) Deterministic feature extraction
    // -----------------------------
    const prevMeta = cr_state.meta_state || {};
    const prevKSI = typeof prevMeta.ksi === 'number' ? clamp01(prevMeta.ksi) : 1.0;
    const prevConflict = typeof prevMeta.conflict_density === 'number' ? clamp01(prevMeta.conflict_density) : 0.0;

    const firedCount = Array.isArray(reasoning_result.fired_rule_ids)
      ? reasoning_result.fired_rule_ids.length
      : 0;
    const conclCount = Array.isArray(reasoning_result.conclusions)
      ? reasoning_result.conclusions.length
      : 0;

    // -----------------------------
    // 3) Conflict signals analysis (TEXT branch v1)
    // -----------------------------
    let explicitConflict = 0;
    let riskCount = 0;
    let strategyCount = 0;

    for (const c of (reasoning_result.conclusions || [])) {
      if (!c || typeof c !== 'object') continue;
      if (c.type === 'CONFLICT') explicitConflict += 1;
      if (c.type === 'RISK_ASSESSMENT') riskCount += 1;
      if (c.type === 'STRATEGY') strategyCount += 1;
    }

    // -----------------------------
    // 4) Deterministic metric computation
    // -----------------------------

    // Conflict estimator in [0,1]
    // conflict_est = clamp(prevConflict + 0.25*explicit + 0.10*riskCount)
    const conflict_est = clamp01(
      prevConflict + 0.25 * explicitConflict + 0.10 * riskCount
    );

    // Confidence drift proxy:
    // more rules fired + higher conflict => more drift pressure
    // drift_est = clamp(0.15*firedCount + 0.35*conflict_est)
    const drift_est = clamp01(
      0.15 * firedCount + 0.35 * conflict_est
    );

    // Resource load proxy (no stochastic timing):
    // load_est = clamp(conclCount / 10)
    const load_est = clamp01(conclCount / 10);

    // KSI projection:
    // ksi_est = clamp(prevKSI - (w_conflict*conflict + w_drift*drift + w_load*load))
    const ksi_est = clamp01(
      prevKSI - (
        this.config.w_conflict * conflict_est +
        this.config.w_drift * drift_est +
        this.config.w_load * load_est
      )
    );

    // -----------------------------
    // 5) Build Meta_Input
    // -----------------------------
    const meta_input = {
      meta_input_id: `MI_${reasoning_result.reasoning_id || reasoning_result.reasoning_hash.slice(0, 12)}`,
      // carry-through hashes for forensic binding
      cr_state_hash: cr_state.state_hash,
      reasoning_hash: reasoning_result.reasoning_hash,
      arc_hash: reasoning_result.arc_hash,

      // core metrics (bounded [0,1])
      ksi: ksi_est,
      conflict_density: conflict_est,
      confidence_drift: drift_est,
      resource_load: load_est,

      // deterministic context
      derived: {
        fired_rule_count: firedCount,
        conclusion_count: conclCount,
        risk_count: riskCount,
        strategy_count: strategyCount,
        explicit_conflict_count: explicitConflict
      }
    };

    meta_input.meta_input_hash = hashObject(meta_input);

    // -----------------------------
    // 6) Audit record
    // -----------------------------
    const audit = {
      stage: 'REASONING_TO_META',
      input_hash: hashObject({
        cr_state_hash: cr_state.state_hash,
        reasoning_hash: reasoning_result.reasoning_hash
      }),
      output_hash: meta_input.meta_input_hash,
      payload_hash: hashObject({
        meta_input_id: meta_input.meta_input_id,
        ksi: meta_input.ksi,
        conflict_density: meta_input.conflict_density,
        confidence_drift: meta_input.confidence_drift,
        resource_load: meta_input.resource_load
      }),
      payload: {
        meta_input_id: meta_input.meta_input_id,
        ksi: meta_input.ksi,
        conflict_density: meta_input.conflict_density,
        confidence_drift: meta_input.confidence_drift,
        resource_load: meta_input.resource_load
      },
      runtime: {
        engine_version: this.version,
        branch: 'TEXT'
      },
      timestamp: new Date().toISOString()
    };

    return { verdict: 'SUPPORTED', meta_input, audit };
  }
}
