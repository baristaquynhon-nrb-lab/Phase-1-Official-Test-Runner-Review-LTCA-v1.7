/**
 * REASONING_EXECUTION_ENGINE_v1
 * Input: ARC (Activated Rule Context)
 * Output: Reasoning_Result (deterministic, hash-stable, audit-logged)
 *
 * Engine đọc ARC, lọc luật hợp lệ, chạy theo thứ tự deterministic, tạo Reasoning_Result.
 */

import { hashObject } from '../canon/hash.js';
import { TEXT_RULES_V1 } from '../rules/text_rules_v1.js';

export class ReasoningExecutionEngine {
  constructor(config = {}) {
    this.config = {
      branch: 'TEXT',
      ruleset_id: 'RULESET_TEXT_v1',
      max_rules: 32,
      max_steps: 128,
      ...config
    };
    this.version = 'reasoning_execution_v1.0';
  }

  /**
   * Execute reasoning over ARC
   * @param {Object} arc - Activated Rule Context
   * @returns {Object} - { verdict, reasoning, audit } or { verdict: 'REFUSE', reason }
   */
  execute(arc) {
    // -----------------------------
    // 1) Validate ARC (fail-fast)
    // -----------------------------
    if (!arc || typeof arc !== 'object') {
      return { verdict: 'REFUSE', reason: 'INVALID_ARC', details: { error: 'arc is null or not an object' } };
    }

    if (!arc.arc_hash || !arc.cr_state_hash) {
      return { verdict: 'REFUSE', reason: 'INVALID_ARC', details: { error: 'arc_hash or cr_state_hash missing' } };
    }

    if (this.config.branch !== 'TEXT') {
      return { verdict: 'REFUSE', reason: 'SCOPE_VIOLATION', details: { expected: 'TEXT', got: this.config.branch } };
    }

    if (!arc.execution_budget || arc.execution_budget.mode !== 'DETERMINISTIC') {
      return { verdict: 'REFUSE', reason: 'BUDGET_MISSING_OR_NONDETERMINISTIC', details: { budget: arc.execution_budget } };
    }

    // -----------------------------
    // 2) Resolve eligible rule IDs (deterministic order)
    // -----------------------------
    const eligible = arc.eligible_ruleset?.eligible_rule_ids || [];
    const eligibleSorted = [...eligible].sort(); // hard deterministic ordering

    // Apply cap from budget
    const maxRules = Math.min(
      arc.execution_budget.max_rules ?? this.config.max_rules,
      this.config.max_rules
    );
    const selectedRuleIds = eligibleSorted.slice(0, maxRules);

    // -----------------------------
    // 3) Execute rules
    // -----------------------------
    const fired = [];
    const conclusions = [];
    const trace = [];
    let stepCount = 0;
    const maxSteps = arc.execution_budget.max_steps ?? this.config.max_steps;

    for (const ruleId of selectedRuleIds) {
      // Step budget check
      if (stepCount >= maxSteps) {
        trace.push({
          rule_id: ruleId,
          status: 'SKIPPED',
          reason: 'STEP_BUDGET_EXCEEDED'
        });
        continue;
      }

      const rule = TEXT_RULES_V1[ruleId];
      if (!rule) {
        trace.push({
          rule_id: ruleId,
          status: 'SKIPPED',
          reason: 'RULE_NOT_FOUND'
        });
        continue;
      }

      stepCount++;

      // Check precondition
      let preconditionResult;
      try {
        preconditionResult = rule.precondition(arc) === true;
      } catch (err) {
        trace.push({
          rule_id: ruleId,
          status: 'ERROR',
          reason: 'PRECONDITION_ERROR',
          error: err.message
        });
        continue;
      }

      if (!preconditionResult) {
        trace.push({
          rule_id: ruleId,
          status: 'SKIPPED',
          reason: 'PRECONDITION_FALSE'
        });
        continue;
      }

      stepCount++;

      // Apply rule
      let ruleOutput;
      try {
        ruleOutput = rule.apply(arc);
      } catch (err) {
        trace.push({
          rule_id: ruleId,
          status: 'ERROR',
          reason: 'APPLY_ERROR',
          error: err.message
        });
        continue;
      }

      trace.push({
        rule_id: ruleId,
        status: ruleOutput?.verdict === 'FIRED' ? 'FIRED' : 'NO_FIRE',
        output_count: Array.isArray(ruleOutput?.outputs) ? ruleOutput.outputs.length : 0
      });

      if (ruleOutput?.verdict === 'FIRED') {
        fired.push(ruleId);
        for (const c of (ruleOutput.outputs || [])) {
          conclusions.push(c);
        }
      }
    }

    // -----------------------------
    // 4) Build Reasoning_Result
    // -----------------------------
    const reasoningResult = {
      reasoning_id: `R_${arc.arc_id}`,
      arc_hash: arc.arc_hash,
      cr_state_hash: arc.cr_state_hash,
      ruleset_id: arc.eligible_ruleset?.ruleset_id || this.config.ruleset_id,
      fired_rule_ids: fired,
      conclusions,
      // Minimal derived summary (deterministic)
      summary: {
        selected_rule_count: selectedRuleIds.length,
        fired_rule_count: fired.length,
        conclusion_count: conclusions.length,
        has_strategy: conclusions.some(x => x.type === 'STRATEGY'),
        has_risk: conclusions.some(x => x.type === 'RISK_ASSESSMENT'),
        has_resource_alert: conclusions.some(x => x.type === 'RESOURCE_RECOMMENDATION'),
        step_count: stepCount
      },
      trace
    };

    // Hash reasoning result (deterministic)
    reasoningResult.reasoning_hash = hashObject(reasoningResult);

    // -----------------------------
    // 5) Audit record
    // -----------------------------
    const audit = {
      stage: 'REASONING_EXECUTION',
      input_arc_hash: arc.arc_hash,
      output_reasoning_hash: reasoningResult.reasoning_hash,
      payload_hash: hashObject({
        ruleset_id: reasoningResult.ruleset_id,
        selected_rule_ids: selectedRuleIds,
        fired_rule_ids: fired,
        conclusion_count: conclusions.length
      }),
      payload: {
        ruleset_id: reasoningResult.ruleset_id,
        selected_rule_ids: selectedRuleIds,
        fired_rule_ids: fired,
        conclusion_count: conclusions.length
      },
      runtime: {
        engine_version: this.version,
        branch: 'TEXT'
      },
      timestamp: new Date().toISOString()
    };

    return { verdict: 'SUPPORTED', reasoning: reasoningResult, audit };
  }
}
