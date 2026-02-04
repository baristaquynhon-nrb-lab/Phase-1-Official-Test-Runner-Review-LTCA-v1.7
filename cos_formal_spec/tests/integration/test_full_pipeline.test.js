/**
 * Integration test: Full Pipeline
 * CR → ARC → Reasoning → Meta_Input → Meta_State_Update
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { CRStateToARCEngine } from '../../src/engines/cr_state_to_arc_engine.js';
import { ReasoningExecutionEngine } from '../../src/engines/reasoning_execution_engine.js';
import { ReasoningToMetaEngine } from '../../src/engines/reasoning_to_meta_engine.js';
import { MetaEvaluationEngine } from '../../src/engines/meta_evaluation_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCR = JSON.parse(
  fs.readFileSync(join(__dirname, '../../fixtures/initial_cr_state.json'), 'utf8')
);

test('Full Pipeline: CR → ARC → Reasoning → Meta_Input → Meta_State_Update', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();
  const reasoningToMetaEngine = new ReasoningToMetaEngine();
  const metaEvaluationEngine = new MetaEvaluationEngine();

  // Create CR with a meaningful event
  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_FULL_PIPELINE_001',
    memory_state: {
      index: 1,
      events: [{
        event_id: 'E_KINDNESS_001',
        schema_id: 'SOCIAL_SUPPORT_EVENT',
        dynamics: {
          world_delta: { 'Other.dependency_level': 0.5 }
        }
      }]
    },
    meta_state: {
      ksi: 0.85,
      conflict_density: 0.10,
      drift_level: 0.05,
      cognitive_stress: 0.15,
      alert_flags: [],
      regulation: 'NONE'
    }
  };

  // Step 1: CR → ARC
  const arcResult = arcEngine.transform(crWithEvent);
  assert.strictEqual(arcResult.verdict, 'SUPPORTED');
  console.log(`  Step 1: CR → ARC`);
  console.log(`    ARC ID: ${arcResult.arc.arc_id}`);
  console.log(`    Focus: ${arcResult.arc.event_focus?.schema_id}`);

  // Step 2: ARC → Reasoning
  const reasoningResult = reasoningEngine.execute(arcResult.arc);
  assert.strictEqual(reasoningResult.verdict, 'SUPPORTED');
  console.log(`  Step 2: ARC → Reasoning`);
  console.log(`    Fired rules: ${reasoningResult.reasoning.fired_rule_ids.join(', ')}`);
  console.log(`    Conclusions: ${reasoningResult.reasoning.conclusions.length}`);

  // Step 3: Reasoning → Meta_Input
  const metaInputResult = reasoningToMetaEngine.transform(crWithEvent, reasoningResult.reasoning);
  assert.strictEqual(metaInputResult.verdict, 'SUPPORTED');
  console.log(`  Step 3: Reasoning → Meta_Input`);
  console.log(`    KSI: ${metaInputResult.meta_input.ksi.toFixed(3)}`);
  console.log(`    Conflict: ${metaInputResult.meta_input.conflict_density.toFixed(3)}`);

  // Step 4: Meta_Input → Meta_State_Update
  const metaUpdateResult = metaEvaluationEngine.evaluate(crWithEvent, metaInputResult.meta_input);
  assert.strictEqual(metaUpdateResult.verdict, 'SUPPORTED');
  console.log(`  Step 4: Meta_Input → Meta_State_Update`);
  console.log(`    New KSI: ${metaUpdateResult.meta_state_update.knowledge_stability_index.toFixed(3)}`);
  console.log(`    Alerts: ${metaUpdateResult.meta_state_update.alert_flags.join(', ') || 'none'}`);
  console.log(`    Regulation: ${metaUpdateResult.meta_state_update.regulation}`);

  // Verify hash chain integrity
  assert.strictEqual(arcResult.arc.cr_state_hash, crWithEvent.state_hash);
  assert.strictEqual(reasoningResult.reasoning.arc_hash, arcResult.arc.arc_hash);
  assert.strictEqual(metaInputResult.meta_input.reasoning_hash, reasoningResult.reasoning.reasoning_hash);
  assert.strictEqual(metaUpdateResult.meta_state_update.source_meta_input_hash, metaInputResult.meta_input.meta_input_hash);

  console.log(`  ✓ Hash chain verified`);
});

test('Full Pipeline: Deterministic across multiple runs', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();
  const reasoningToMetaEngine = new ReasoningToMetaEngine();
  const metaEvaluationEngine = new MetaEvaluationEngine();

  const crWithEvent = {
    ...initialCR,
    state_hash: 'CR_DET_FULL_001',
    memory_state: {
      index: 1,
      events: [{
        event_id: 'E_001',
        schema_id: 'SOCIAL_SUPPORT_EVENT'
      }]
    },
    meta_state: {
      ksi: 0.75,
      conflict_density: 0.15,
      drift_level: 0.10,
      cognitive_stress: 0.20,
      alert_flags: [],
      regulation: 'NONE'
    }
  };

  const finalHashes = [];
  for (let i = 0; i < 10; i++) {
    const arcResult = arcEngine.transform(crWithEvent);
    const reasoningResult = reasoningEngine.execute(arcResult.arc);
    const metaInputResult = reasoningToMetaEngine.transform(crWithEvent, reasoningResult.reasoning);
    const metaUpdateResult = metaEvaluationEngine.evaluate(crWithEvent, metaInputResult.meta_input);
    finalHashes.push(metaUpdateResult.meta_state_update.meta_hash);
  }

  assert.strictEqual(new Set(finalHashes).size, 1);
  console.log(`  ✓ 10 full pipeline runs produced identical final hash`);
});

test('Full Pipeline: Multi-event sequence processing', () => {
  const arcEngine = new CRStateToARCEngine();
  const reasoningEngine = new ReasoningExecutionEngine();
  const reasoningToMetaEngine = new ReasoningToMetaEngine();
  const metaEvaluationEngine = new MetaEvaluationEngine();

  // Start with initial CR
  let currentCR = JSON.parse(JSON.stringify(initialCR));
  currentCR.state_hash = 'CR_SEQ_000';

  const auditTrail = [];

  // Process a sequence of events
  const eventSequence = [
    { event_id: 'E_001', schema_id: 'HELP_REQUEST' },
    { event_id: 'E_002', schema_id: 'SOCIAL_SUPPORT_EVENT' },
    { event_id: 'E_003', schema_id: 'FEEDBACK_EVENT' }
  ];

  for (let i = 0; i < eventSequence.length; i++) {
    const event = eventSequence[i];

    // Add event to memory
    currentCR.memory_state.events.push(event);
    currentCR.memory_state.index += 1;
    currentCR.state_hash = `CR_SEQ_${(i + 1).toString().padStart(3, '0')}`;

    // Run pipeline
    const arcResult = arcEngine.transform(currentCR);
    assert.strictEqual(arcResult.verdict, 'SUPPORTED');

    const reasoningResult = reasoningEngine.execute(arcResult.arc);
    assert.strictEqual(reasoningResult.verdict, 'SUPPORTED');

    const metaInputResult = reasoningToMetaEngine.transform(currentCR, reasoningResult.reasoning);
    assert.strictEqual(metaInputResult.verdict, 'SUPPORTED');

    const metaUpdateResult = metaEvaluationEngine.evaluate(currentCR, metaInputResult.meta_input);
    assert.strictEqual(metaUpdateResult.verdict, 'SUPPORTED');

    // Update CR meta_state for next iteration
    currentCR.meta_state = {
      ksi: metaUpdateResult.meta_state_update.knowledge_stability_index,
      conflict_density: metaUpdateResult.meta_state_update.conflict_density,
      drift_level: metaUpdateResult.meta_state_update.drift_level,
      cognitive_stress: metaUpdateResult.meta_state_update.cognitive_stress,
      alert_flags: metaUpdateResult.meta_state_update.alert_flags,
      regulation: metaUpdateResult.meta_state_update.regulation
    };

    auditTrail.push({
      step: i + 1,
      event_id: event.event_id,
      schema_id: event.schema_id,
      arc_hash: arcResult.arc.arc_hash,
      reasoning_hash: reasoningResult.reasoning.reasoning_hash,
      meta_hash: metaUpdateResult.meta_state_update.meta_hash,
      ksi: currentCR.meta_state.ksi,
      regulation: currentCR.meta_state.regulation
    });
  }

  console.log(`  Processed ${eventSequence.length} events:`);
  for (const entry of auditTrail) {
    console.log(`    ${entry.step}. ${entry.schema_id} → KSI=${entry.ksi.toFixed(3)}, regulation=${entry.regulation}`);
  }

  assert.strictEqual(auditTrail.length, 3);
  console.log(`  ✓ Multi-event sequence completed`);
});
