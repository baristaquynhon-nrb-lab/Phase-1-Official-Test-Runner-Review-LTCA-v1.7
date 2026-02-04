/**
 * Unit tests for CR State Reducer Engine
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { CRStateReducerEngine } from '../../src/engines/cr_state_reducer_engine.js';
import { hashObject } from '../../src/canon/hash.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCRState = JSON.parse(
  readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

test('CR Reducer - deterministic state transition', () => {
  const engine = new CRStateReducerEngine();

  const aseEvent = {
    event_id: 'E_001',
    schema_id: 'TEST_EVENT',
    dynamics: {
      world_delta: { test_value: 42 },
      agent_delta: {}
    },
    scope: { branch: 'TEXT' }
  };

  const result1 = engine.reduce(initialCRState, aseEvent);
  const result2 = engine.reduce(initialCRState, aseEvent);

  assert.strictEqual(result1.verdict, 'APPLIED');
  assert.strictEqual(result2.verdict, 'APPLIED');
  assert.strictEqual(result1.crNext.state_hash, result2.crNext.state_hash);
});

test('CR Reducer - memory monotonicity', () => {
  const engine = new CRStateReducerEngine();

  let currentState = JSON.parse(JSON.stringify(initialCRState));

  for (let i = 0; i < 5; i++) {
    const aseEvent = {
      event_id: `E_${i.toString().padStart(3, '0')}`,
      schema_id: 'TEST_EVENT',
      dynamics: { world_delta: {}, agent_delta: {} },
      scope: { branch: 'TEXT' }
    };

    const result = engine.reduce(currentState, aseEvent);
    assert.strictEqual(result.verdict, 'APPLIED');
    assert.strictEqual(result.crNext.memory_state.index, i + 1);

    currentState = result.crNext;
  }
});

test('CR Reducer - constitutional guard refusal', () => {
  const engine = new CRStateReducerEngine();

  const invalidEvent = {
    event_id: 'E_INVALID',
    schema_id: 'TEST_EVENT',
    dynamics: { world_delta: {}, agent_delta: {} },
    scope: { branch: 'PERCEPTION' } // Not TEXT!
  };

  const result = engine.reduce(initialCRState, invalidEvent);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /SCOPE_VIOLATION/);
});

test('CR Reducer - invalid input refusal', () => {
  const engine = new CRStateReducerEngine();

  // Missing event_id
  const invalidEvent = {
    schema_id: 'TEST_EVENT',
    dynamics: { world_delta: {}, agent_delta: {} },
    scope: { branch: 'TEXT' }
  };

  const result = engine.reduce(initialCRState, invalidEvent);
  assert.strictEqual(result.verdict, 'REFUSE');
  assert.match(result.reason, /INVALID_ASE_EVENT/);
});

test('CR Reducer - resource depletion', () => {
  const engine = new CRStateReducerEngine();

  let currentState = JSON.parse(JSON.stringify(initialCRState));
  const initialResource = currentState.agent_state.resource_level;

  const aseEvent = {
    event_id: 'E_001',
    schema_id: 'TEST_EVENT',
    dynamics: { world_delta: {}, agent_delta: {} },
    scope: { branch: 'TEXT' }
  };

  const result = engine.reduce(currentState, aseEvent);
  assert.strictEqual(result.verdict, 'APPLIED');
  assert.ok(result.crNext.agent_state.resource_level < initialResource);
});

test('CR Reducer - audit record creation', () => {
  const engine = new CRStateReducerEngine();

  const aseEvent = {
    event_id: 'E_001',
    schema_id: 'TEST_EVENT',
    dynamics: { world_delta: { key: 'value' }, agent_delta: {} },
    scope: { branch: 'TEXT' }
  };

  const result = engine.reduce(initialCRState, aseEvent);
  assert.strictEqual(result.verdict, 'APPLIED');

  const audit = result.audit;
  assert.strictEqual(audit.stage, 'CR_TRANSITION');
  assert.ok(audit.timestamp);
  assert.ok(audit.input_hash);
  assert.ok(audit.output_hash);
  assert.strictEqual(audit.payload.event_id, 'E_001');
  assert.strictEqual(audit.runtime.engine_version, 'cr_state_reducer_v1.0');
});
