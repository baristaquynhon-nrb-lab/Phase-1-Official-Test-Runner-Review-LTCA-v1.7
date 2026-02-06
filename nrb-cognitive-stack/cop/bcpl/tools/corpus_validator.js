'use strict';

/**
 * Corpus Validator — Validates corpus format and completeness.
 */

function validateFormat(lines) {
  const errors = [];
  lines.forEach((line, i) => {
    if (line.split('\t').length !== 2) {
      errors.push({ line: i + 1, error: 'Expected tab-separated bilingual pair' });
    }
  });
  return { valid: errors.length === 0, errors };
}

function validateCompleteness(alignedPairs) {
  const issues = [];
  alignedPairs.forEach((pair, i) => {
    if (!pair.en || pair.en.length === 0) {
      issues.push({ index: i, issue: 'Missing English text' });
    }
    if (!pair.vi || pair.vi.length === 0) {
      issues.push({ index: i, issue: 'Missing Vietnamese text' });
    }
  });
  return { complete: issues.length === 0, issues };
}

module.exports = { validateFormat, validateCompleteness };
