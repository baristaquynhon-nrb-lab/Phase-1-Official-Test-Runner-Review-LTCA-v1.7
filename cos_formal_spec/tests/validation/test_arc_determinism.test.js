/**
 * Determinism validation tests for CR→ARC transformation
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

test('ARC Determinism: Multiple runs produce identical hashes', () => {
  const engine = new CRStateToARCEngine();
  const runs = 20;
  const hashes = [];

  for (let i = 0; i < runs; i++) {
    const result = engine.transform(initialCR);
    assert.strictEqual(result.verdict, 'SUPPORTED');
    hashes.push(result.arc.arc_hash);
  }

  const uniqueHashes = new Set(hashes);
  assert.strictEqual(uniqueHashes.size, 1, `Expected 1 unique hash, got ${uniqueHashes.size}`);

  console.log(`  ✓ ${runs} runs produced identical hash: ${hashes[0].substring(0, 16)}...`);
});

test('ARC Determinism: Complex CR state produces consistent hash', () => {
  const engine = new CRStateToARCEngine();

  const complexCR = {
    state_hash: 'COMPLEX_CR_001',
    world_state: {
      entity_A: { dependency_level: 0.45, status: 'active' },
      entity_B: { harm_risk: 0.25, status: 'pending' }
    },
    agent_state: {
      active_goals: ['goal_1', 'goal_2'],
      resource_level: 0.67,
      last_action: 'assist',
      awaiting_input: false
    },
    memory_state: {
      index: 3,
      events: [
        { event_id: 'E_001', schema_id: 'HELP_REQUEST' },
        { event_id: 'E_002', schema_id: 'HELP_PROVIDED' },
        { event_id: 'E_003', schema_id: 'SOCIAL_SUPPORT_EVENT', dynamics: { world_delta: { 'x.y': 1 } } }
      ]
    },
    meta_state: {
      ksi: 0.72,
      conflict_density: 0.23,
      drift_level: 0.11,
      cognitive_stress: 0.34,
      alert_flags: [],
      regulation: 'NONE'
    }
  };

  const hashes = [];
  for (let i = 0; i < 10; i++) {
    const result = engine.transform(complexCR);
    assert.strictEqual(result.verdict, 'SUPPORTED');
    hashes.push(result.arc.arc_hash);
  }

  assert.strictEqual(new Set(hashes).size, 1);
  console.log(`  ✓ Complex CR produces consistent ARC hash`);
});

test('ARC Determinism: Trigger facts are deterministically derived', () => {
  const engine = new CRStateToARCEngine();

  const crWithLowKSI = {
    ...initialCR,
    state_hash: 'CR_LOW_KSI_001',
    meta_state: {
      ksi: 0.5,
      conflict_density: 0.3,
      drift_level: 0.1,
      cognitive_stress: 0.2,
      alert_flags: [],
      regulation: 'NONE'
    },
    agent_state: {
      ...initialCR.agent_state,
      resource_level: 0.3
    },
    memory_state: {
      index: 1,
      events: [{ event_id: 'E_001', schema_id: 'TEST_EVENT' }]
    }
  };

  const results = [];
  for (let i = 0; i < 5; i++) {
    const result = engine.transform(crWithLowKSI);
    results.push(result.arc.trigger_facts);
  }

  // All trigger_facts arrays should be identical
  for (let i = 1; i < results.length; i++) {
    assert.deepStrictEqual(results[i], results[0]);
  }

  console.log(`  ✓ Trigger facts are deterministic`);
});

test('ARC Determinism: Eligible ruleset is deterministically computed', () => {
  const engine = new CRStateToARCEngine();

  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_RULESET_001',
    memory_state: {
      index: 1,
      events: [{ event_id: 'E_001', schema_id: 'SOCIAL_SUPPORT_EVENT' }]
    }
  };

  const rulesets = [];
  for (let i = 0; i < 10; i++) {
    const result = engine.transform(crWithEvent);
    rulesets.push(result.arc.eligible_ruleset);
  }

  // All rulesets should be identical
  for (let i = 1; i < rulesets.length; i++) {
    assert.deepStrictEqual(rulesets[i], rulesets[0]);
  }

  // Eligible rule IDs should be sorted
  const ids = rulesets[0].eligible_rule_ids;
  const sortedIds = [...ids].sort();
  assert.deepStrictEqual(ids, sortedIds);

  console.log(`  ✓ Eligible ruleset is deterministic and sorted`);
});
