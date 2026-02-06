'use strict';

/**
 * Test: Law Evaluation — Tests LEAE engine law evaluation.
 */

const { evaluateAllLaws } = require('../core/law_evaluator');

function run() {
  console.log('  [test_law_evaluation]');

  const frame = {
    intent: 'HELP_REQUEST',
    urgency: 2,
    confidence: 0.8,
    trace_hash: 'test_hash_003'
  };

  const laws = [
    {
      id: 'LAW_ALLOW',
      category: 'intervention',
      conditions: [{ field: 'intent', operator: 'eq', value: 'HELP_REQUEST' }],
      verdict: 'ALLOW'
    },
    {
      id: 'LAW_BLOCK',
      category: 'safety',
      conditions: [{ field: 'urgency', operator: 'gte', value: 5 }],
      verdict: 'BLOCK'
    }
  ];

  const result = evaluateAllLaws(frame, laws);
  const passed = result.final_verdict === 'ALLOW' && result.laws_evaluated_count === 2;
  console.log(`  ${passed ? 'PASS' : 'FAIL'}: Laws evaluated correctly (verdict: ${result.final_verdict})`);
  return passed;
}

module.exports = { run };

// Allow direct execution
if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
