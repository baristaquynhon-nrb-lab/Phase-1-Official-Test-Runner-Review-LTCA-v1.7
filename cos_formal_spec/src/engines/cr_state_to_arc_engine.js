/**
 * CR_STATE_TO_ARC_ENGINE_v1
 * Deterministic transformation: CR_state → Activated Rule Context (ARC)
 *
 * ARC là "bề mặt kích hoạt" (activation surface) cho Reasoning Engine.
 * Φ_ARC: không suy luận, chỉ chuẩn hóa CR thành dạng "đủ điều kiện chạy luật"
 */

import { hashObject } from '../canon/hash.js';

export class CRStateToARCEngine {
  constructor(config = {}) {
    this.config = {
      branch: 'TEXT',
      max_rules: 32,
      max_steps: 128,
      max_time_ms: 10,
      ruleset_id: 'RULESET_TEXT_v1',
      ...config
    };
    this.version = 'cr_to_arc_v1.0';
  }

  /**
   * Transform CR state to Activated Rule Context
   * @param {Object} crState - CR state object
   * @returns {Object} - { verdict, arc, audit } or { verdict: 'REFUSE', reason }
   */
  transform(crState) {
    // -----------------------------
    // 1. Basic validation (fail-fast)
    // -----------------------------
    if (!crState || typeof crState !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'crState is null or not an object' } };
    }

    if (!crState.state_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_CR_STATE', details: { error: 'state_hash missing' } };
    }

    // Text branch enforcement
    if (this.config.branch !== 'TEXT') {
      return { verdict: 'REFUSE', reason: 'SCOPE_VIOLATION', details: { expected: 'TEXT', got: this.config.branch } };
    }

    // Memory integrity check
    const memoryState = crState.memory_state || { events: [], index: 0 };
    if (memoryState.events.length !== memoryState.index) {
      return { verdict: 'REFUSE', reason: 'MEMORY_CORRUPTED', details: { events_length: memoryState.events.length, index: memoryState.index } };
    }

    // -----------------------------
    // 2. Focus event selection (Invariant A1)
    // -----------------------------
    const events = memoryState.events || [];
    const focusEvent = events.length > 0 ? events[events.length - 1] : null;

    // -----------------------------
    // 3. State features extraction (Invariant A2: read-only)
    // -----------------------------
    const worldKeysTouched = [];
    if (focusEvent && focusEvent.dynamics && focusEvent.dynamics.world_delta) {
      worldKeysTouched.push(...Object.keys(focusEvent.dynamics.world_delta));
    }

    const stateFeatures = {
      branch: 'TEXT',
      world_keys_touched: worldKeysTouched,
      agent_resource_level: crState.agent_state?.resource_level ?? 1.0,
      meta_ksi: crState.meta_state?.ksi ?? 1.0,
      meta_conflict_density: crState.meta_state?.conflict_density ?? 0.0,
      memory_index: memoryState.index
    };

    // -----------------------------
    // 4. Trigger fact derivation (Invariant A3: deterministic)
    // -----------------------------
    const triggerFacts = [];

    if (focusEvent) {
      triggerFacts.push({
        fact_type: 'LAST_SCHEMA_ID',
        value: focusEvent.schema_id,
        source: 'event'
      });

      triggerFacts.push({
        fact_type: 'LAST_EVENT_ID',
        value: focusEvent.event_id,
        source: 'event'
      });
    }

    // Meta-state derived facts
    if (stateFeatures.meta_ksi < 0.7) {
      triggerFacts.push({
        fact_type: 'META_KSI_LT',
        value: stateFeatures.meta_ksi,
        source: 'meta'
      });
    }

    if (stateFeatures.meta_conflict_density > 0.2) {
      triggerFacts.push({
        fact_type: 'META_CONFLICT_GT',
        value: stateFeatures.meta_conflict_density,
        source: 'meta'
      });
    }

    // Agent resource facts
    if (stateFeatures.agent_resource_level < 0.5) {
      triggerFacts.push({
        fact_type: 'AGENT_RESOURCE_LT',
        value: stateFeatures.agent_resource_level,
        source: 'agent'
      });
    }

    // World state derived facts
    if (crState.world_state) {
      for (const [key, val] of Object.entries(crState.world_state)) {
        if (val && typeof val === 'object') {
          if (val.dependency_level !== undefined) {
            triggerFacts.push({
              fact_type: 'DEPENDENCY_RISK_PRESENT',
              value: val.dependency_level > 0.3,
              source: 'world'
            });
          }
          if (val.harm_risk !== undefined) {
            triggerFacts.push({
              fact_type: 'AGENT_HARM_RISK_PRESENT',
              value: val.harm_risk > 0.2,
              source: 'world'
            });
          }
        }
      }
    }

    // -----------------------------
    // 5. Rule eligibility filter (Invariant A4: pure function)
    // -----------------------------
    let eligibleRuleIds = [];
    const refusedRuleIds = [];

    if (focusEvent) {
      // TEXT branch eligible rules based on schema_id
      if (focusEvent.schema_id === 'SOCIAL_SUPPORT_EVENT') {
        eligibleRuleIds = ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT'];
      } else if (focusEvent.schema_id === 'HELP_REQUEST' || focusEvent.schema_id === 'HELP_PROVIDED') {
        eligibleRuleIds = ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT'];
      } else if (focusEvent.schema_id === 'FEEDBACK_EVENT') {
        eligibleRuleIds = ['R_CALIBRATE_SUPPORT'];
      } else {
        // Generic event - minimal ruleset
        eligibleRuleIds = [];
      }
    } else {
      // No focus event - only housekeeping rules allowed
      eligibleRuleIds = [];
    }

    // Sort for determinism
    eligibleRuleIds.sort();

    const filterBasis = {
      branch: 'TEXT',
      focus_schema_id: focusEvent?.schema_id || null,
      trigger_fact_types: triggerFacts.map(f => f.fact_type).sort()
    };

    const eligibleRuleset = {
      ruleset_id: this.config.ruleset_id,
      eligible_rule_ids: eligibleRuleIds,
      refused_rule_ids: refusedRuleIds,
      filter_basis_hash: hashObject(filterBasis)
    };

    // -----------------------------
    // 6. Execution budget (Invariant A5: config-based, not time-based)
    // -----------------------------
    const executionBudget = {
      max_rules: this.config.max_rules,
      max_steps: this.config.max_steps,
      max_time_ms: this.config.max_time_ms,
      mode: 'DETERMINISTIC'
    };

    // -----------------------------
    // 7. ARC assembly
    // -----------------------------
    const arc = {
      arc_id: `ARC_mem_${stateFeatures.memory_index.toString().padStart(6, '0')}`,
      cr_state_hash: crState.state_hash,
      event_focus: focusEvent
        ? { event_id: focusEvent.event_id, schema_id: focusEvent.schema_id }
        : null,
      state_features: stateFeatures,
      trigger_facts: triggerFacts,
      eligible_ruleset: eligibleRuleset,
      execution_budget: executionBudget
    };

    // -----------------------------
    // 8. ARC hashing (Invariant A6: canonical)
    // -----------------------------
    arc.arc_hash = hashObject(arc);

    // -----------------------------
    // 9. Audit record (Invariant A7: replay-stable)
    // -----------------------------
    const audit = {
      stage: 'CR_TO_ARC',
      input_cr_hash: crState.state_hash,
      output_arc_hash: arc.arc_hash,
      payload_hash: hashObject({
        focus_event_id: arc.event_focus?.event_id || null,
        ruleset_id: eligibleRuleset.ruleset_id,
        eligible_rule_ids: eligibleRuleIds
      }),
      payload: {
        focus_event_id: arc.event_focus?.event_id || null,
        ruleset_id: eligibleRuleset.ruleset_id,
        eligible_rule_ids: eligibleRuleIds
      },
      runtime: {
        engine_version: this.version,
        branch: 'TEXT'
      },
      timestamp: new Date().toISOString()
    };

    return { verdict: 'SUPPORTED', arc, audit };
  }
}
