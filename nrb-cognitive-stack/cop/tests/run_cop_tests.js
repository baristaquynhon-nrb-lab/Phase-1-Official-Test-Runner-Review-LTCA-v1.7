'use strict';

/**
 * COP Test Runner — Runs all COP unit tests.
 */

const path = require('path');

const testFiles = [
  './test_cil_help_request.js',
  './test_surface_no_new_facts.js',
  './test_urgency_escalation.js',
  './test_vi_disambiguation.js'
];

let allPassed = true;

console.log('=== COP Test Suite ===\n');

for (const testFile of testFiles) {
  console.log(`Running: ${testFile}`);
  try {
    const testModule = require(testFile);
    if (typeof testModule.run === 'function') {
      const result = testModule.run();
      if (!result) allPassed = false;
    }
  } catch (err) {
    console.log(`  ERROR: ${err.message}`);
    allPassed = false;
  }
  console.log('');
}

console.log('=== COP Test Suite Complete ===');
console.log(allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
process.exit(allPassed ? 0 : 1);
