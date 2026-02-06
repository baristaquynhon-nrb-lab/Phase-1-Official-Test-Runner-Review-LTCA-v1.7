'use strict';

/**
 * Test: GSRA Refusal — Tests that GSRA correctly blocks unsafe actions.
 */

const { processEnvelope } = require('../core/gsra_engine');

function run() {
  console.log('  [test_gsra_refusal]');

  const envelope = {
    envelope_type: 'cop_to_gsra',
    version: '1.0',
    meaning_frame: {
      type: 'meaning_frame',
      intent: 'EMERGENCY_DISTRESS',
      urgency: 5,
      confidence: 0.9,
      trace_hash: 'test_hash_001'
    }
  };

  const lawVault = {
    safety_laws: [
      {
        id: 'SAFETY_TEST',
        category: 'safety',
        name: 'Block on max urgency',
        conditions: [
          { field: 'urgency', operator: 'gte', value: 5 }
        ],
        verdict: 'BLOCK'
      }
    ]
  };

  const result = processEnvelope(envelope, lawVault);
  const passed = result.verdict === 'BLOCK';
  console.log(`  ${passed ? 'PASS' : 'FAIL'}: High urgency triggers BLOCK verdict`);
  return passed;
}

module.exports = { run };
