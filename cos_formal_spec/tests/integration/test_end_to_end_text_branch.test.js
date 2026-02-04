/**
 * End-to-end integration test for text branch
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CRStateReducerEngine } from '../../src/engines/cr_state_reducer_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCRState = JSON.parse(
  fs.readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

const helpPositiveCase = JSON.parse(
  fs.readFileSync(join(__dirname, '../../cases/help_positive.json'), 'utf8')
);

test('End-to-end: Help positive case', () => {
  const engine = new CRStateReducerEngine();
  let currentState = JSON.parse(JSON.stringify(initialCRState));
  const auditLog = [];

  // Process all events
  for (const event of helpPositiveCase.ase_events) {
    const result = engine.reduce(currentState, event);
    assert.strictEqual(result.verdict, 'APPLIED', `Event ${event.event_id} should be applied`);

    auditLog.push(result.audit);
    currentState = result.crNext;
  }

  // Verify final state
  assert.strictEqual(currentState.memory_state.index, 3);
  assert.strictEqual(currentState.world_state.task_A.status, 'COMPLETED');
  assert.strictEqual(currentState.agent_state.last_action, 'provide_help');

  // Verify audit log structure
  assert.strictEqual(auditLog.length, 3);
  auditLog.forEach((entry, i) => {
    assert.ok(entry.timestamp);
    assert.ok(entry.input_hash);
    assert.ok(entry.output_hash);
    assert.strictEqual(entry.stage, 'CR_TRANSITION');
  });

  console.log('  ✓ All events processed');
  console.log(`  ✓ Final state hash: ${currentState.state_hash.substring(0, 16)}...`);
});

test('End-to-end: State hash chain integrity', () => {
  const engine = new CRStateReducerEngine();
  let currentState = JSON.parse(JSON.stringify(initialCRState));
  const stateHashes = [currentState.state_hash];

  for (const event of helpPositiveCase.ase_events) {
    const result = engine.reduce(currentState, event);
    assert.strictEqual(result.verdict, 'APPLIED');

    // Each new state hash should be different from previous
    const newHash = result.crNext.state_hash;
    assert.ok(!stateHashes.includes(newHash), 'State hash should be unique');
    stateHashes.push(newHash);

    currentState = result.crNext;
  }

  console.log(`  ✓ ${stateHashes.length} unique state hashes generated`);
});

test('End-to-end: Memory event recording', () => {
  const engine = new CRStateReducerEngine();
  let currentState = JSON.parse(JSON.stringify(initialCRState));

  for (const event of helpPositiveCase.ase_events) {
    const result = engine.reduce(currentState, event);
    currentState = result.crNext;
  }

  // Verify all events are recorded in memory
  const recordedEvents = currentState.memory_state.events;
  assert.strictEqual(recordedEvents.length, 3);

  // Verify event IDs match
  const eventIds = recordedEvents.map(e => e.event_id);
  assert.deepStrictEqual(eventIds, ['E_001', 'E_002', 'E_003']);

  console.log('  ✓ All events recorded in memory');
});
