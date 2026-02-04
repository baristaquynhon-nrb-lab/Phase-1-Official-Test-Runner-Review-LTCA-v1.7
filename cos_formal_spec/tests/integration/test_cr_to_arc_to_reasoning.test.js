/**
 * Integration test: CR → ARC → Reasoning (Text branch)
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { CRStateToARCEngine } from '../../src/engines/cr_state_to_arc_engine.js';
import { ReasoningExecutionEngine } from '../../src/engines/reasoning_execution_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCR = JSON.parse(
  fs.readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

test('Integration: CR → ARC → Reasoning with initial state (no events)', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();

  // Step 1: CR → ARC
  const arcResult = arcEngine.transform(initialCR);
  assert.strictEqual(arcResult.verdict, 'SUPPORTED');
  assert.strictEqual(arcResult.arc.event_focus, null);

  // Step 2: ARC → Reasoning
  const reasoningResult = reasoningEngine.execute(arcResult.arc);
  assert.strictEqual(reasoningResult.verdict, 'SUPPORTED');

  // With no events, no rules should fire
  assert.strictEqual(reasoningResult.reasoning.fired_rule_ids.length, 0);
  assert.strictEqual(reasoningResult.reasoning.conclusions.length, 0);
});

test('Integration: CR → ARC → Reasoning with SOCIAL_SUPPORT_EVENT', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();

  // CR with a support event
  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_WITH_EVENT_001',
    memory_state: {
      index: 1,
      events: [{
        event_id: 'E_KINDNESS_001',
        schema_id: 'SOCIAL_SUPPORT_EVENT',
        dynamics: {
          world_delta: { 'Other.dependency_level': 0.4 }
        }
      }]
    },
    meta_state: {
      ...initialCR.meta_state,
      ksi: 0.73,
      conflict_density: 0.18
    }
  };

  // Step 1: CR → ARC
  const arcResult = arcEngine.transform(crWithEvent);
  assert.strictEqual(arcResult.verdict, 'SUPPORTED');
  assert.strictEqual(arcResult.arc.event_focus.schema_id, 'SOCIAL_SUPPORT_EVENT');
  assert.ok(arcResult.arc.eligible_ruleset.eligible_rule_ids.includes('R_SUPPORT_DEPENDENCY_RISK'));

  // Step 2: ARC → Reasoning
  const reasoningResult = reasoningEngine.execute(arcResult.arc);
  assert.strictEqual(reasoningResult.verdict, 'SUPPORTED');

  // Rules should fire and produce conclusions
  assert.ok(reasoningResult.reasoning.fired_rule_ids.length > 0);
  assert.ok(reasoningResult.reasoning.conclusions.length > 0);

  // Should have both RISK_ASSESSMENT and STRATEGY conclusions
  assert.ok(reasoningResult.reasoning.summary.has_risk);
  assert.ok(reasoningResult.reasoning.summary.has_strategy);

  console.log(`  ✓ Fired rules: ${reasoningResult.reasoning.fired_rule_ids.join(', ')}`);
  console.log(`  ✓ Conclusions: ${reasoningResult.reasoning.conclusions.length}`);
});

test('Integration: CR → ARC → Reasoning - hash chain integrity', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();

  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_CHAIN_TEST_001',
    memory_state: {
      index: 1,
      events: [{
        event_id: 'E_001',
        schema_id: 'HELP_REQUEST'
      }]
    }
  };

  const arcResult = arcEngine.transform(crWithEvent);
  const reasoningResult = reasoningEngine.execute(arcResult.arc);

  // Verify hash chain
  assert.strictEqual(arcResult.arc.cr_state_hash, crWithEvent.state_hash);
  assert.strictEqual(reasoningResult.reasoning.arc_hash, arcResult.arc.arc_hash);
  assert.strictEqual(reasoningResult.reasoning.cr_state_hash, crWithEvent.state_hash);

  console.log(`  ✓ CR hash: ${crWithEvent.state_hash}`);
  console.log(`  ✓ ARC hash: ${arcResult.arc.arc_hash.substring(0, 16)}...`);
  console.log(`  ✓ Reasoning hash: ${reasoningResult.reasoning.reasoning_hash.substring(0, 16)}...`);
});

test('Integration: CR → ARC → Reasoning - deterministic across runs', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();

  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_DET_TEST_001',
    memory_state: {
      index: 1,
      events: [{
        event_id: 'E_001',
        schema_id: 'SOCIAL_SUPPORT_EVENT'
      }]
    }
  };

  const hashes = [];
  for (let i = 0; i < 5; i++) {
    const arcResult = arcEngine.transform(crWithEvent);
    const reasoningResult = reasoningEngine.execute(arcResult.arc);
    hashes.push(reasoningResult.reasoning.reasoning_hash);
  }

  assert.strictEqual(new Set(hashes).size, 1);
  console.log(`  ✓ 5 runs produced identical reasoning hash`);
});
