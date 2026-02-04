/**
 * Determinism validation tests for Reasoning Execution Engine
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ReasoningExecutionEngine } from '../../src/engines/reasoning_execution_engine.js';

test('Reasoning Determinism: Identical hashes across multiple runs', () => {
  const engine = new ReasoningExecutionEngine();

  const arc = {
    arc_id: 'ARC_mem_000123',
    arc_hash: 'dummy_arc_hash_for_test',
    cr_state_hash: 'dummy_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.73, meta_conflict_density: 0.18, agent_resource_level: 0.8 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_CALIBRATE_SUPPORT', 'R_SUPPORT_DEPENDENCY_RISK']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const hashes = [];
  for (let i = 0; i < 20; i++) {
    const result = engine.execute(arc);
    assert.strictEqual(result.verdict, 'SUPPORTED');
    hashes.push(result.reasoning.reasoning_hash);
  }

  assert.strictEqual(new Set(hashes).size, 1);
  console.log(`  ✓ 20 runs produced identical reasoning hash`);
});

test('Reasoning Determinism: Conclusions are identical across runs', () => {
  const engine = new ReasoningExecutionEngine();

  const arc = {
    arc_id: 'ARC_mem_000001',
    arc_hash: 'test_arc_hash',
    cr_state_hash: 'test_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.60, meta_conflict_density: 0.25, agent_resource_level: 0.7 },
    trigger_facts: [
      { fact_type: 'DEPENDENCY_RISK_PRESENT', value: true, source: 'world' }
    ],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const conclusions = [];
  for (let i = 0; i < 5; i++) {
    const result = engine.execute(arc);
    conclusions.push(JSON.stringify(result.reasoning.conclusions));
  }

  // All conclusions should be identical
  for (let i = 1; i < conclusions.length; i++) {
    assert.strictEqual(conclusions[i], conclusions[0]);
  }

  console.log(`  ✓ Conclusions are deterministically identical`);
});

test('Reasoning Determinism: Rule ordering does not affect output', () => {
  const engine = new ReasoningExecutionEngine();

  // Create two ARCs with different rule orderings
  const arc1 = {
    arc_id: 'ARC_001',
    arc_hash: 'arc_hash_001',
    cr_state_hash: 'cr_hash_001',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.65, meta_conflict_density: 0.20 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const arc2 = {
    ...arc1,
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_CALIBRATE_SUPPORT', 'R_SUPPORT_DEPENDENCY_RISK'] // reversed order
    }
  };

  const result1 = engine.execute(arc1);
  const result2 = engine.execute(arc2);

  // Engine should sort rules internally, producing same output
  assert.strictEqual(result1.reasoning.reasoning_hash, result2.reasoning.reasoning_hash);
  console.log(`  ✓ Rule ordering does not affect output hash`);
});

test('Reasoning Determinism: Trace entries are consistent', () => {
  const engine = new ReasoningExecutionEngine();

  const arc = {
    arc_id: 'ARC_TRACE_001',
    arc_hash: 'trace_arc_hash',
    cr_state_hash: 'trace_cr_hash',
    event_focus: { event_id: 'E1', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    state_features: { meta_ksi: 0.70, meta_conflict_density: 0.15 },
    trigger_facts: [],
    eligible_ruleset: {
      ruleset_id: 'RULESET_TEXT_v1',
      eligible_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT']
    },
    execution_budget: { max_rules: 32, max_steps: 128, max_time_ms: 10, mode: 'DETERMINISTIC' }
  };

  const traces = [];
  for (let i = 0; i < 5; i++) {
    const result = engine.execute(arc);
    traces.push(JSON.stringify(result.reasoning.trace));
  }

  for (let i = 1; i < traces.length; i++) {
    assert.strictEqual(traces[i], traces[0]);
  }

  console.log(`  ✓ Trace entries are deterministically consistent`);
});
