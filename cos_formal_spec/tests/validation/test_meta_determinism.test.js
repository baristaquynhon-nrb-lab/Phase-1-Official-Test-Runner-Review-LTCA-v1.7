/**
 * Determinism validation tests for Meta pipeline
 * ReasoningToMetaEngine + MetaEvaluationEngine
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ReasoningToMetaEngine } from '../../src/engines/reasoning_to_meta_engine.js';
import { MetaEvaluationEngine } from '../../src/engines/meta_evaluation_engine.js';

test('Meta Determinism: ReasoningToMeta produces consistent hashes', () => {
  const engine = new ReasoningToMetaEngine();

  const cr = {
    state_hash: 'CR_META_DET_001',
    meta_state: { ksi: 0.85, conflict_density: 0.08, drift_level: 0.02, cognitive_stress: 0.10 }
  };

  const reasoning = {
    reasoning_id: 'R_ARC_DET',
    reasoning_hash: 'REASON_HASH_DET',
    arc_hash: 'ARC_HASH_DET',
    fired_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK', 'R_CALIBRATE_SUPPORT'],
    conclusions: [
      { type: 'RISK_ASSESSMENT', confidence: 0.81 },
      { type: 'STRATEGY', confidence: 0.72 }
    ]
  };

  const hashes = [];
  for (let i = 0; i < 20; i++) {
    const result = engine.transform(cr, reasoning);
    assert.strictEqual(result.verdict, 'SUPPORTED');
    hashes.push(result.meta_input.meta_input_hash);
  }

  assert.strictEqual(new Set(hashes).size, 1);
  console.log(`  ✓ 20 ReasoningToMeta runs produced identical hash`);
});

test('Meta Determinism: MetaEvaluation produces consistent hashes', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_EVAL_DET_001',
    meta_state: { ksi: 0.75, conflict_density: 0.15, drift_level: 0.08, cognitive_stress: 0.20 }
  };

  const meta_input = {
    meta_input_id: 'MI_DET_001',
    meta_input_hash: 'MI_HASH_DET_001',
    ksi: 0.60,
    conflict_density: 0.25,
    confidence_drift: 0.30,
    resource_load: 0.40
  };

  const hashes = [];
  for (let i = 0; i < 20; i++) {
    const result = engine.evaluate(cr, meta_input);
    assert.strictEqual(result.verdict, 'SUPPORTED');
    hashes.push(result.meta_state_update.meta_hash);
  }

  assert.strictEqual(new Set(hashes).size, 1);
  console.log(`  ✓ 20 MetaEvaluation runs produced identical hash`);
});

test('Meta Determinism: Full meta chain produces stable output', () => {
  const r2m = new ReasoningToMetaEngine();
  const meta = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_CHAIN_DET',
    meta_state: { ksi: 0.80, conflict_density: 0.12, drift_level: 0.05, cognitive_stress: 0.15 }
  };

  const reasoning = {
    reasoning_id: 'R_CHAIN_DET',
    reasoning_hash: 'REASON_CHAIN_HASH',
    arc_hash: 'ARC_CHAIN_HASH',
    fired_rule_ids: ['R_SUPPORT_DEPENDENCY_RISK'],
    conclusions: [{ type: 'RISK_ASSESSMENT', confidence: 0.75 }]
  };

  const finalHashes = [];
  for (let i = 0; i < 10; i++) {
    const metaInputResult = r2m.transform(cr, reasoning);
    assert.strictEqual(metaInputResult.verdict, 'SUPPORTED');

    const metaUpdateResult = meta.evaluate(cr, metaInputResult.meta_input);
    assert.strictEqual(metaUpdateResult.verdict, 'SUPPORTED');

    finalHashes.push(metaUpdateResult.meta_state_update.meta_hash);
  }

  assert.strictEqual(new Set(finalHashes).size, 1);
  console.log(`  ✓ 10 full meta chain runs produced identical final hash`);
});

test('Meta Determinism: Alert flags are consistently sorted', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_ALERT_SORT',
    meta_state: { ksi: 0.40, conflict_density: 0.30, drift_level: 0.40, cognitive_stress: 0.70 }
  };

  const meta_input = {
    meta_input_id: 'MI_ALERT_SORT',
    meta_input_hash: 'MI_HASH_ALERT_SORT',
    ksi: 0.30,
    conflict_density: 0.50,
    confidence_drift: 0.60,
    resource_load: 0.80
  };

  const alertLists = [];
  for (let i = 0; i < 10; i++) {
    const result = engine.evaluate(cr, meta_input);
    alertLists.push(result.meta_state_update.alert_flags);
  }

  // All alert lists should be identical and sorted
  for (let i = 1; i < alertLists.length; i++) {
    assert.deepStrictEqual(alertLists[i], alertLists[0]);
  }

  // Verify sorted
  const sorted = [...alertLists[0]].sort();
  assert.deepStrictEqual(alertLists[0], sorted);

  console.log(`  ✓ Alert flags are consistently sorted across runs`);
});

test('Meta Determinism: Metric bounds are respected', () => {
  const r2m = new ReasoningToMetaEngine();
  const meta = new MetaEvaluationEngine();

  // Extreme input values
  const cr = {
    state_hash: 'CR_BOUNDS',
    meta_state: { ksi: 0.0, conflict_density: 1.0, drift_level: 1.0, cognitive_stress: 1.0 }
  };

  const reasoning = {
    reasoning_id: 'R_BOUNDS',
    reasoning_hash: 'REASON_BOUNDS',
    arc_hash: 'ARC_BOUNDS',
    fired_rule_ids: Array(100).fill('R_RULE'),
    conclusions: Array(200).fill({ type: 'CONFLICT' })
  };

  const metaInputResult = r2m.transform(cr, reasoning);
  assert.strictEqual(metaInputResult.verdict, 'SUPPORTED');

  // All metrics should be in [0, 1]
  const mi = metaInputResult.meta_input;
  assert.ok(mi.ksi >= 0 && mi.ksi <= 1, `ksi=${mi.ksi} out of bounds`);
  assert.ok(mi.conflict_density >= 0 && mi.conflict_density <= 1, `conflict=${mi.conflict_density} out of bounds`);
  assert.ok(mi.confidence_drift >= 0 && mi.confidence_drift <= 1, `drift=${mi.confidence_drift} out of bounds`);
  assert.ok(mi.resource_load >= 0 && mi.resource_load <= 1, `load=${mi.resource_load} out of bounds`);

  const metaUpdateResult = meta.evaluate(cr, metaInputResult.meta_input);
  assert.strictEqual(metaUpdateResult.verdict, 'SUPPORTED');

  const update = metaUpdateResult.meta_state_update;
  assert.ok(update.knowledge_stability_index >= 0 && update.knowledge_stability_index <= 1);
  assert.ok(update.conflict_density >= 0 && update.conflict_density <= 1);
  assert.ok(update.drift_level >= 0 && update.drift_level <= 1);
  assert.ok(update.cognitive_stress >= 0 && update.cognitive_stress <= 1);

  console.log(`  ✓ Metric bounds respected under extreme inputs`);
});
