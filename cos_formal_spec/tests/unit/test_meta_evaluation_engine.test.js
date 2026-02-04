/**
 * Unit tests for META_EVALUATION_ENGINE_v1
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { MetaEvaluationEngine } from '../../src/engines/meta_evaluation_engine.js';

test('MetaEvaluation - refuses invalid CR state (null)', () => {
  const engine = new MetaEvaluationEngine();
  const result = engine.evaluate(null, {});
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_CR_STATE/);
});

test('MetaEvaluation - refuses invalid meta_input (null)', () => {
  const engine = new MetaEvaluationEngine();
  const result = engine.evaluate({ state_hash: 'CR_HASH' }, null);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_META_INPUT/);
});

test('MetaEvaluation - refuses meta_input without hash', () => {
  const engine = new MetaEvaluationEngine();
  const result = engine.evaluate(
    { state_hash: 'CR_HASH' },
    { meta_input_id: 'MI_001' }
  );
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_META_INPUT/);
});

test('MetaEvaluation - deterministic meta_hash', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.80, conflict_density: 0.10, drift_level: 0.05, cognitive_stress: 0.10 }
  };

  const meta_input = {
    meta_input_id: 'MI_R_ARC_001',
    meta_input_hash: 'MI_HASH_001',
    cr_state_hash: 'CR_HASH_001',
    reasoning_hash: 'REASON_HASH_001',
    arc_hash: 'ARC_HASH_001',
    ksi: 0.40,
    conflict_density: 0.35,
    confidence_drift: 0.50,
    resource_load: 0.80,
    derived: { fired_rule_count: 2, conclusion_count: 2, risk_count: 1, explicit_conflict_count: 0 }
  };

  const a = engine.evaluate(cr, meta_input);
  const b = engine.evaluate(cr, meta_input);

  assert.strictEqual(a.verdict, 'SUPPORTED');
  assert.strictEqual(b.verdict, 'SUPPORTED');
  assert.strictEqual(a.meta_state_update.meta_hash, b.meta_state_update.meta_hash);
});

test('MetaEvaluation - alert_flags are sorted (deterministic)', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.80, conflict_density: 0.10, drift_level: 0.05, cognitive_stress: 0.10 }
  };

  const meta_input = {
    meta_input_id: 'MI_R_ARC_001',
    meta_input_hash: 'MI_HASH_001',
    ksi: 0.40,
    conflict_density: 0.35,
    confidence_drift: 0.50,
    resource_load: 0.80
  };

  const result = engine.evaluate(cr, meta_input);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  const alerts = result.meta_state_update.alert_flags;
  const sortedAlerts = [...alerts].sort();
  assert.deepStrictEqual(alerts, sortedAlerts);
});

test('MetaEvaluation - contains expected fields', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.85 }
  };

  const meta_input = {
    meta_input_id: 'MI_001',
    meta_input_hash: 'MI_HASH_001',
    ksi: 0.70,
    conflict_density: 0.15,
    confidence_drift: 0.20,
    resource_load: 0.30
  };

  const result = engine.evaluate(cr, meta_input);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.meta_state_update.meta_state_id);
  assert.ok(result.meta_state_update.meta_hash);
  assert.ok(result.meta_state_update.source_meta_input_hash);
  assert.ok(result.meta_state_update.cr_state_hash);
  assert.ok(typeof result.meta_state_update.knowledge_stability_index === 'number');
  assert.ok(typeof result.meta_state_update.conflict_density === 'number');
  assert.ok(typeof result.meta_state_update.drift_level === 'number');
  assert.ok(typeof result.meta_state_update.cognitive_stress === 'number');
  assert.ok(Array.isArray(result.meta_state_update.alert_flags));
  assert.ok(result.meta_state_update.regulation);
  assert.ok(result.meta_state_update.delta);
});

test('MetaEvaluation - metrics are bounded [0, 1]', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.1, conflict_density: 0.9, drift_level: 0.9, cognitive_stress: 0.9 }
  };

  const meta_input = {
    meta_input_id: 'MI_001',
    meta_input_hash: 'MI_HASH_001',
    ksi: 0.0,
    conflict_density: 1.0,
    confidence_drift: 1.0,
    resource_load: 1.0
  };

  const result = engine.evaluate(cr, meta_input);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  const update = result.meta_state_update;
  assert.ok(update.knowledge_stability_index >= 0 && update.knowledge_stability_index <= 1);
  assert.ok(update.conflict_density >= 0 && update.conflict_density <= 1);
  assert.ok(update.drift_level >= 0 && update.drift_level <= 1);
  assert.ok(update.cognitive_stress >= 0 && update.cognitive_stress <= 1);
});

test('MetaEvaluation - generates KNOWLEDGE_INSTABILITY alert when KSI low', () => {
  const engine = new MetaEvaluationEngine();

  const cr = {
    state_hash: 'CR_HASH_001',
    meta_state: { ksi: 0.50 }
  };

  const meta_input = {
    meta_input_id: 'MI_001',
    meta_input_hash: 'MI_HASH_001',
    ksi: 0.30,
    conflict_density: 0.10,
    confidence_drift: 0.10,
    resource_load: 0.10
  };

  const result = engine.evaluate(cr, meta_input);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.meta_state_update.alert_flags.includes('KNOWLEDGE_INSTABILITY'));
});

test('MetaEvaluation - regulation escalates with alerts', () => {
  const engine = new MetaEvaluationEngine();

  // No alerts
  const cr1 = { state_hash: 'CR_HASH', meta_state: { ksi: 0.9 } };
  const mi1 = { meta_input_id: 'MI', meta_input_hash: 'MIH', ksi: 0.8, conflict_density: 0.1, confidence_drift: 0.1, resource_load: 0.1 };
  const r1 = engine.evaluate(cr1, mi1);
  assert.strictEqual(r1.meta_state_update.regulation, 'NONE');

  // Multiple alerts
  const cr2 = { state_hash: 'CR_HASH', meta_state: { ksi: 0.4, conflict_density: 0.3 } };
  const mi2 = { meta_input_id: 'MI', meta_input_hash: 'MIH', ksi: 0.3, conflict_density: 0.5, confidence_drift: 0.6, resource_load: 0.8 };
  const r2 = engine.evaluate(cr2, mi2);
  assert.ok(['THROTTLE', 'HALT'].includes(r2.meta_state_update.regulation));
});

test('MetaEvaluation - audit record has correct stage', () => {
  const engine = new MetaEvaluationEngine();

  const cr = { state_hash: 'CR_HASH_001', meta_state: {} };
  const meta_input = {
    meta_input_id: 'MI_001',
    meta_input_hash: 'MI_HASH_001',
    ksi: 0.70,
    conflict_density: 0.15,
    confidence_drift: 0.20,
    resource_load: 0.30
  };

  const result = engine.evaluate(cr, meta_input);

  assert.strictEqual(result.audit.stage, 'META_EVALUATION');
  assert.ok(result.audit.input_hash);
  assert.ok(result.audit.output_hash);
  assert.ok(result.audit.timestamp);
});
