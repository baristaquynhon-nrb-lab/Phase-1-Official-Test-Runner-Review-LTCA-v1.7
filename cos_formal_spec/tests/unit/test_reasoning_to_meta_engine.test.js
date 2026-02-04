/**
 * Unit tests for REASONING_TO_META_ENGINE_v1
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ReasoningToMetaEngine } from '../../src/engines/reasoning_to_meta_engine.js';

test('Reasoning→Meta - refuses invalid CR state (null)', () => {
  const engine = new ReasoningToMetaEngine();
  const result = engine.transform(null, {});
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_CR_STATE/);
});

test('Reasoning→Meta - refuses invalid reasoning result (null)', () => {
  const engine = new ReasoningToMetaEngine();
  const result = engine.transform({ state_hash: 'x' }, null);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_REASONING_RESULT/);
});

test('Reasoning→Meta - refuses reasoning without hashes', () => {
  const engine = new ReasoningToMetaEngine();
  const result = engine.transform(
    { state_hash: 'x' },
    { reasoning_id: 'R_001' }
  );
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_REASONING_RESULT/);
});

test('Reasoning→Meta - deterministic meta_input_hash', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.90, conflict_density: 0.05, drift_level: 0.01, cognitive_stress: 0.10 }
  };

  const reasoning = {
    reasoning_id: 'R_ARC_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    fired_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT'],
    conclusions: [
      { type: 'RISK_ASSESSMENT', confidence: 0.8 },
      { type: 'STRATEGY', confidence: 0.7 }
    ]
  };

  const a = engine.transform(cr, reasoning);
  const b = engine.transform(cr, reasoning);

  assert.strictEqual(a.verdict, 'SUPPORTED');
  assert.strictEqual(b.verdict, 'SUPPORTED');
  assert.strictEqual(a.meta_input.meta_input_hash, b.meta_input.meta_input_hash);
});

test('Reasoning→Meta - contains expected fields', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.85 }
  };

  const reasoning = {
    reasoning_id: 'R_ARC_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    fired_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK'],
    conclusions: [{ type: 'RISK_ASSESSMENT', confidence: 0.75 }]
  };

  const result = engine.transform(cr, reasoning);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.meta_input.meta_input_id);
  assert.ok(result.meta_input.meta_input_hash);
  assert.ok(result.meta_input.cr_state_hash);
  assert.ok(result.meta_input.reasoning_hash);
  assert.ok(result.meta_input.arc_hash);
  assert.ok(typeof result.meta_input.ksi === 'number');
  assert.ok(typeof result.meta_input.conflict_density === 'number');
  assert.ok(typeof result.meta_input.confidence_drift === 'number');
  assert.ok(typeof result.meta_input.resource_load === 'number');
  assert.ok(result.meta_input.derived);
});

test('Reasoning→Meta - metrics are bounded [0, 1]', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.1, conflict_density: 0.9 }
  };

  const reasoning = {
    reasoning_id: 'R_ARC_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    fired_rule_ids: Array(20).fill('R_RULE'),
    conclusions: Array(50).fill({ type: 'CONFLICT' })
  };

  const result = engine.transform(cr, reasoning);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.meta_input.ksi >= 0 && result.meta_input.ksi <= 1);
  assert.ok(result.meta_input.conflict_density >= 0 && result.meta_input.conflict_density <= 1);
  assert.ok(result.meta_input.confidence_drift >= 0 && result.meta_input.confidence_drift <= 1);
  assert.ok(result.meta_input.resource_load >= 0 && result.meta_input.resource_load <= 1);
});

test('Reasoning→Meta - audit record has correct stage', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = { state_hash: 'CR_HASH_001', meta_state: {} };
  const reasoning = {
    reasoning_id: 'R_ARC_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    fired_rule_ids: [],
    conclusions: []
  };

  const result = engine.transform(cr, reasoning);

  assert.strictEqual(result.audit.stage, 'REASONING_TO_META');
  assert.ok(result.audit.input_hash);
  assert.ok(result.audit.output_hash);
  assert.ok(result.audit.timestamp);
});

test('Reasoning→Meta - derived counts are correct', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = { state_hash: 'CR_HASH_001', meta_state: {} };
  const reasoning = {
    reasoning_id: 'R_ARC_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    fired_rule_ids: ['R1', 'R2', 'R3'],
    conclusions: [
      { type: 'RISK_ASSESSMENT' },
      { type: 'RISK_ASSESSMENT' },
      { type: 'STRATEGY' },
      { type: 'CONFLICT' }
    ]
  };

  const result = engine.transform(cr, reasoning);

  assert.strictEqual(result.meta_input.derived.fired_rule_count, 3);
  assert.strictEqual(result.meta_input.derived.conclusion_count, 4);
  assert.strictEqual(result.meta_input.derived.risk_count, 2);
  assert.strictEqual(result.meta_input.derived.strategy_count, 1);
  assert.strictEqual(result.meta_input.derived.explicit_conflict_count, 1);
});
