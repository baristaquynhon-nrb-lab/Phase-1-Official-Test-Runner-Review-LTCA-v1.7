'use strict';

/**
 * Test: Full Pipeline — End-to-end integration test (PFT → COP → GSRA → Action).
 */

const { classifySignal } = require('../../pft/signal_layer/signal_classifier');
const { buildGestureFrame } = require('../../pft/signal_layer/gesture_frame_builder');
const { generatePseudoSymbol } = require('../../pft/signal_layer/pseudo_symbol_generator');
const { pftToCop } = require('../interfaces/PFT_COP_interface');
const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { copToGsra } = require('../interfaces/COP_GSRA_interface');
const { processEnvelope } = require('../../gsra/core/gsra_engine');
const { gsraToAction } = require('../interfaces/GSRA_ACTION_interface');

function run() {
  console.log('  [test_full_pipeline]');

  try {
    // Step 1: PFT — Simulate distress signal
    const sensorOutput = {
      source: 'mic',
      features: { distress_sound: true, speech_detected: true }
    };
    const classified = classifySignal(sensorOutput);
    const gestureFrame = buildGestureFrame(classified);
    const pseudoSymbol = generatePseudoSymbol(gestureFrame);

    // Step 2: PFT → COP interface
    const copInput = pftToCop(pseudoSymbol);

    // Step 3: COP — Process through CIL Runtime
    const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
    const meaningFrame = runPipeline(copInput.text, { lexicon });

    // Step 4: COP → GSRA interface
    const envelope = copToGsra(meaningFrame);

    // Step 5: GSRA — Evaluate against laws
    const lawVault = {
      safety_laws: require('../../gsra/law_vault/safety_laws.json'),
      ethical_laws: require('../../gsra/law_vault/ethical_laws.json'),
      intervention_laws: require('../../gsra/law_vault/intervention_laws.json'),
      domain_policies: require('../../gsra/law_vault/domain_policies.json')
    };
    const gsraResponse = processEnvelope(envelope, lawVault);

    // Step 6: GSRA → Action interface
    const action = gsraToAction(gsraResponse);

    // Validate end-to-end
    const passed = action.action_type && action.verdict && action.source_trace_hash;
    console.log(`  ${passed ? 'PASS' : 'FAIL'}: Full pipeline executed successfully`);
    console.log(`    Verdict: ${action.verdict}, Action: ${action.action_type}`);
    return !!passed;
  } catch (err) {
    console.log(`  FAIL: Pipeline error — ${err.message}`);
    return false;
  }
}

module.exports = { run };

if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
