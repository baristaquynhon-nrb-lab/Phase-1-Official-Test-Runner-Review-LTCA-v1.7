'use strict';

/**
 * Test: Emergency Flow — Tests emergency detection through intervention.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { copToGsra } = require('../interfaces/COP_GSRA_interface');
const { processEnvelope } = require('../../gsra/core/gsra_engine');

function run() {
  console.log('  [test_emergency_flow]');

  try {
    const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
    const urgencyCues = require('../../cop/cil_runtime/lexicons/urgency_cues_en.json');

    // Simulate emergency input
    const meaningFrame = runPipeline('emergency help danger now', { lexicon, urgencyCues });
    const envelope = copToGsra(meaningFrame);

    const lawVault = {
      safety_laws: [
        {
          id: 'EMERGENCY_BLOCK',
          category: 'safety',
          conditions: [{ field: 'urgency', operator: 'gte', value: 4 }],
          verdict: 'MODIFY'
        }
      ]
    };

    const response = processEnvelope(envelope, lawVault);
    const passed = meaningFrame.urgency > 0 && response.verdict;

    console.log(`  ${passed ? 'PASS' : 'FAIL'}: Emergency flow processed`);
    console.log(`    Urgency: ${meaningFrame.urgency}, Verdict: ${response.verdict}`);
    return !!passed;
  } catch (err) {
    console.log(`  FAIL: Emergency flow error — ${err.message}`);
    return false;
  }
}

module.exports = { run };

if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
