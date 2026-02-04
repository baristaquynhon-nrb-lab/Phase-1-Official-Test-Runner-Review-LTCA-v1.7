/**
 * Unit tests for REASONING_EXECUTION_ENGINE_v1
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ReasoningExecutionEngine } from '../../src/engines/reasoning_execution_engine.js';

test('Reasoning Engine - refuses invalid ARC (null)', () => {
  const engine = new ReasoningExecutionEngine();
  const result = engine.execute(null);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_ARC/);
});

test('Reasoning Engine - refuses ARC without hashes', () => {
  const engine = new ReasoningExecutionEngine();
  const result = engine.execute({ arc_id: 'ARC_X' });
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_ARC/);
});

test('Reasoning Engine - refuses non-DETERMINISTIC budget', () => {
  const engine = new ReasoningExecutionEngine();
  const arc = {
    arc_id: 'ARC_001',
    arc_hash: 'hash1',
    cr_state_hash: 'hash2',
    execution_budget: { mode: 'FAST' }
  };
  const result = engine.execute(arc);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /BUDGET_MISSING_OR_NONDETERMINISTIC/);
});

test('Reasoning Engine - deterministic output hash', () => {
  const engine = new ReasoningExecutionEngine();

  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'dummy_arc_hash_for_test',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.73, meta_conflict_density: 0.18, agent_resource_level: 0.8 },
    trigger_facts: [{ fact_type: 'LAST_SCHEMA_ID', value: 'SOCIAL_SUPPORT_EVENT', source: 'event' }],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_CALIBRATE_SUPPORT', 'R_SUPPORT_DEPENDENCY_RISK']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const r1 = engine.execute(arc);
  const r2 = engine.execute(arc);

  assert.strictEqual(r1.verdict, 'SUPPORTED');
  assert.strictEqual(r2.verdict, 'SUPPORTED');
  assert.strictEqual(r1.reasoning.reasoning_hash, r2.reasoning.reasoning_hash);
});

test('Reasoning Engine - produces conclusions for SOCIAL_SUPPORT_EVENT', () => {
  const engine = new ReasoningExecutionEngine();
  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'dummy_arc_hash_for_test',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.60, meta_conflict_density: 0.20, agent_resource_level: 0.7 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const r = engine.execute(arc);

  assert.strictEqual(r.verdict, 'SUPPORTED');
  assert.ok(r.reasoning.conclusions.length >= 1);
  assert.ok(r.reasoning.fired_rule_ids.length >= 1);
  assert.ok(r.audit);
  assert.strictEqual(r.audit.stage, 'REASONING_EXECUTION');
});

test('Reasoning Engine - trace records rule execution', () => {
  const engine = new ReasoningExecutionEngine();
  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'dummy_arc_hash',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.73, meta_conflict_density: 0.18 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const r = engine.execute(arc);

  assert.strictEqual(r.verdict, 'SUPPORTED');
  assert.ok(Array.isArray(r.reasoning.trace));
  assert.ok(r.reasoning.trace.length > 0);

  // Check trace entries have expected fields
  for (const entry of r.reasoning.trace) {
    assert.ok(entry.rule_id);
    assert.ok(entry.status);
  }
});

test('Reasoning Engine - summary reflects conclusions', () => {
  const engine = new ReasoningExecutionEngine();
  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'dummy_arc_hash',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.60, meta_conflict_density: 0.20 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const r = engine.execute(arc);

  assert.strictEqual(r.verdict, 'SUPPORTED');
  assert.ok(r.reasoning.summary);
  assert.strictEqual(r.reasoning.summary.conclusion_count, r.reasoning.conclusions.length);
  assert.strictEqual(r.reasoning.summary.fired_rule_count, r.reasoning.fired_rule_ids.length);
});

test('Reasoning Engine - skips unknown rules', () => {
  const engine = new ReasoningExecutionEngine();
  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'dummy_arc_hash',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: {},
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_UNKNOWN_RULE', 'R_SUPPORT_DEPENDENCY_RISK']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const r = engine.execute(arc);

  assert.strictEqual(r.verdict, 'SUPPORTED');

  // Should have trace entry for unknown rule
  const unknownTrace = r.reasoning.trace.find(t => t.rule_id === 'R_UNKNOWN_RULE');
  assert.ok(unknownTrace);
  assert.strictEqual(unknownTrace.status, 'SKIPPED');
  assert.strictEqual(unknownTrace.reason, 'RULE_NOT_FOUND');
});
