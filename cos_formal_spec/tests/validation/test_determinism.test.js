/**
 * Determinism validation tests
 * Ensures identical inputs produce identical outputs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CRStateReducerEngine } from '../../src/engines/cr_state_reducer_engine.js';
import { hashObject } from '../../src/canon/hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCRState = JSON.parse(
  fs.readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

test('Determinism: Multiple runs produce identical hashes', () => {
  const engine = new CRStateReducerEngine();
  const runs = 10;
  const hashes = [];

  const aseEvent = {
    event_id: 'E_DETERMINISM_TEST',
    schema_id: 'TEST_EVENT',
    dynamics: {
      world_delta: { determinism_test: true, value: 123.456 },
      agent_delta: { test_action: 'verify_determinism' }
    },
    scope: { branch: 'TEXT' }
  };

  for (let i = 0; i < runs; i++) {
    const result = engine.reduce(initialCRState, aseEvent);
    assert.strictEqual(result.verdict, 'APPLIED');
    hashes.push(result.crNext.state_hash);
  }

  // All hashes should be identical
  const uniqueHashes = new Set(hashes);
  assert.strictEqual(uniqueHashes.size, 1, `Expected 1 unique hash, got ${uniqueHashes.size}`);

  console.log(`  ✓ ${runs} runs produced identical hash: ${hashes[0].substring(0, 16)}...`);
});

test('Determinism: Event sequence produces consistent chain', () => {
  const engine = new CRStateReducerEngine();
  const runs = 5;
  const finalHashes = [];

  for (let run = 0; run < runs; run++) {
    let currentState = JSON.parse(JSON.stringify(initialCRState));

    for (let i = 0; i < 10; i++) {
      const aseEvent = {
        event_id: `E_SEQ_${i.toString().padStart(3, '0')}`,
        schema_id: 'SEQUENCE_TEST',
        dynamics: {
          world_delta: { step: i, data: `step_${i}` },
          agent_delta: {}
        },
        scope: { branch: 'TEXT' }
      };

      const result = engine.reduce(currentState, aseEvent);
      assert.strictEqual(result.verdict, 'APPLIED');
      currentState = result.crNext;
    }

    finalHashes.push(currentState.state_hash);
  }

  const uniqueHashes = new Set(finalHashes);
  assert.strictEqual(uniqueHashes.size, 1, `Expected 1 unique final hash, got ${uniqueHashes.size}`);

  console.log(`  ✓ ${runs} sequence runs produced identical final hash`);
});

test('Determinism: Canonical JSON ordering', () => {
  // Test that object key ordering doesn't affect hash
  const obj1 = { z: 1, a: 2, m: 3 };
  const obj2 = { a: 2, m: 3, z: 1 };
  const obj3 = { m: 3, z: 1, a: 2 };

  const hash1 = hashObject(obj1);
  const hash2 = hashObject(obj2);
  const hash3 = hashObject(obj3);

  assert.strictEqual(hash1, hash2);
  assert.strictEqual(hash2, hash3);

  console.log(`  ✓ Key ordering produces identical hashes`);
});

test('Determinism: Nested object consistency', () => {
  const engine = new CRStateReducerEngine();

  const complexEvent = {
    event_id: 'E_NESTED',
    schema_id: 'NESTED_TEST',
    dynamics: {
      world_delta: {
        level1: {
          level2: {
            level3: {
              data: [1, 2, 3],
              nested_obj: { key: 'value' }
            }
          }
        }
      },
      agent_delta: {}
    },
    scope: { branch: 'TEXT' }
  };

  const result1 = engine.reduce(initialCRState, complexEvent);
  const result2 = engine.reduce(initialCRState, complexEvent);

  assert.strictEqual(result1.crNext.state_hash, result2.crNext.state_hash);

  console.log(`  ✓ Nested objects produce consistent hashes`);
});
