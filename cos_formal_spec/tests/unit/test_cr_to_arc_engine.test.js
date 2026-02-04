/**
 * Unit tests for CR_STATE_TO_ARC_ENGINE_v1
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CRStateToARCEngine } from '../../src/engines/cr_state_to_arc_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCR = JSON.parse(
  fs.readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

test('CR→ARC - refuses invalid CR state (null)', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(null);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_CR_STATE/);
});

test('CR→ARC - refuses CR state without state_hash', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform({ world_state: {} });
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_CR_STATE/);
});

test('CR→ARC - deterministic transformation (same input → same hash)', () => {
  const engine = new CRStateToARCEngine();

  const result1 = engine.transform(initialCR);
  const result2 = engine.transform(initialCR);

  assert.strictEqual(result1.verdict, 'SUPPORTED');
  assert.strictEqual(result2.verdict, 'SUPPORTED');
  assert.strictEqual(result1.arc.arc_hash, result2.arc.arc_hash);
});

test('CR→ARC - contains expected fields', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(initialCR);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.arc.arc_id);
  assert.ok(result.arc.arc_hash);
  assert.ok(result.arc.cr_state_hash);
  assert.ok(result.arc.state_features);
  assert.ok(result.arc.execution_budget);
  assert.ok(Array.isArray(result.arc.trigger_facts));
  assert.ok(result.arc.eligible_ruleset);
});

test('CR→ARC - state_features has correct branch', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(initialCR);

  assert.strictEqual(result.arc.state_features.branch, 'TEXT');
});

test('CR→ARC - execution_budget is DETERMINISTIC mode', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(initialCR);

  assert.strictEqual(result.arc.execution_budget.mode, 'DETERMINISTIC');
  assert.ok(result.arc.execution_budget.max_rules > 0);
  assert.ok(result.arc.execution_budget.max_steps > 0);
});

test('CR→ARC - audit record has correct stage', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(initialCR);

  assert.strictEqual(result.audit.stage, 'CR_TO_ARC');
  assert.ok(result.audit.input_cr_hash);
  assert.ok(result.audit.output_arc_hash);
  assert.ok(result.audit.timestamp);
});

test('CR→ARC - focus_event is null when no events in memory', () => {
  const engine = new CRStateToARCEngine();
  const result = engine.transform(initialCR);

  // Initial CR has no events
  assert.strictEqual(result.arc.event_focus, null);
});

test('CR→ARC - focus_event extracted from last memory event', () => {
  const engine = new CRStateToARCEngine();

  const crWithEvents = {
    ...initialCR,
    memory_state: {
      index: 2,
      events: [
        { event_id: 'E_001', schema_id: 'HELP_REQUEST' },
        { event_id: 'E_002', schema_id: 'SOCIAL_SUPPORT_EVENT' }
      ]
    }
  };

  const result = engine.transform(crWithEvents);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.deepStrictEqual(result.arc.event_focus, {
    event_id: 'E_002',
    schema_id: 'SOCIAL_SUPPORT_EVENT'
  });
});

test('CR→ARC - eligible rules based on schema_id', () => {
  const engine = new CRStateToARCEngine();

  const crWithSupportEvent = {
    ...initialCR,
    memory_state: {
      index: 1,
      events: [
        { event_id: 'E_001', schema_id: 'SOCIAL_SUPPORT_EVENT' }
      ]
    }
  };

  const result = engine.transform(crWithSupportEvent);

  assert.strictEqual(result.verdict, 'SUPPORTED');
  assert.ok(result.arc.eligible_ruleset.eligible_rule_ids.includes('R_SUPPORT_DEPENDENCY_RISK'));
  assert.ok(result.arc.eligible_ruleset.eligible_rule_ids.includes('R_CALIBRATE_SUPPORT'));
});
