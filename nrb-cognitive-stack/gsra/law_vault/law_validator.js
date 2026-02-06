'use strict';

/**
 * Law Validator — Validates law format in the law vault.
 */

const REQUIRED_FIELDS = ['id', 'category', 'name', 'conditions', 'verdict'];
const VALID_VERDICTS = ['ALLOW', 'BLOCK', 'MODIFY'];
const VALID_CATEGORIES = ['safety', 'ethical', 'intervention', 'domain'];

function validateLaw(law) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!(field in law)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (law.verdict && !VALID_VERDICTS.includes(law.verdict)) {
    errors.push(`Invalid verdict: ${law.verdict}. Must be one of: ${VALID_VERDICTS.join(', ')}`);
  }

  if (law.category && !VALID_CATEGORIES.includes(law.category)) {
    errors.push(`Invalid category: ${law.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (law.conditions && !Array.isArray(law.conditions)) {
    errors.push('conditions must be an array');
  }

  return { valid: errors.length === 0, errors };
}

function validateLawVault(laws) {
  const results = laws.map((law, i) => ({
    index: i,
    law_id: law.id || `unknown_${i}`,
    ...validateLaw(law)
  }));
  const allValid = results.every(r => r.valid);
  return { valid: allValid, results };
}

module.exports = { validateLaw, validateLawVault };
