'use strict';

/**
 * Test: Evidence Binding — Tests evidence binder correctness.
 */

const { bindEvidence } = require('../core/evidence_binder');

function run() {
  console.log('  [test_evidence_binding]');

  const frame = {
    intent: 'HELP_REQUEST',
    urgency: 3,
    trace_hash: 'test_hash_002'
  };

  const law = {
    id: 'TEST_LAW',
    conditions: [
      { field: 'intent', operator: 'eq', value: 'HELP_REQUEST' },
      { field: 'urgency', operator: 'gte', value: 2 }
    ]
  };

  const binding = bindEvidence(frame, law);
  const passed = binding.all_satisfied === true;
  console.log(`  ${passed ? 'PASS' : 'FAIL'}: Evidence correctly bound to law conditions`);
  return passed;
}

module.exports = { run };
