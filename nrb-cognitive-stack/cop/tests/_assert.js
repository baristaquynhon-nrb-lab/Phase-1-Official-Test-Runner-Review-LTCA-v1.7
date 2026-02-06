'use strict';

/**
 * Minimal assertion library for COP tests.
 */

let passCount = 0;
let failCount = 0;

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passCount++;
    console.log(`  PASS: ${message}`);
  } else {
    failCount++;
    console.log(`  FAIL: ${message}`);
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, message) {
  if (value) {
    passCount++;
    console.log(`  PASS: ${message}`);
  } else {
    failCount++;
    console.log(`  FAIL: ${message} (got falsy value: ${JSON.stringify(value)})`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    passCount++;
    console.log(`  PASS: ${message}`);
  } else {
    failCount++;
    console.log(`  FAIL: ${message}`);
    console.log(`    Expected: ${expectedStr}`);
    console.log(`    Actual:   ${actualStr}`);
  }
}

function summary() {
  console.log(`\nResults: ${passCount} passed, ${failCount} failed`);
  return failCount === 0;
}

function reset() {
  passCount = 0;
  failCount = 0;
}

module.exports = { assertEqual, assertTruthy, assertDeepEqual, summary, reset };
