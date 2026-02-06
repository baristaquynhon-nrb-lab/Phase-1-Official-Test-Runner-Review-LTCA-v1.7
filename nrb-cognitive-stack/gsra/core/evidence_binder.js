'use strict';

/**
 * Evidence Binder — Binds evidence from Meaning Frame to law conditions.
 */

function bindEvidence(meaningFrame, law) {
  const bindings = {};

  for (const condition of law.conditions || []) {
    const value = extractValue(meaningFrame, condition.field);
    bindings[condition.field] = {
      expected: condition.value,
      actual: value,
      satisfied: evaluateCondition(value, condition)
    };
  }

  return {
    law_id: law.id,
    bindings,
    all_satisfied: Object.values(bindings).every(b => b.satisfied),
    frame_hash: meaningFrame.trace_hash
  };
}

function extractValue(frame, fieldPath) {
  const parts = fieldPath.split('.');
  let current = frame;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

function evaluateCondition(value, condition) {
  if (condition.operator === 'eq') return value === condition.value;
  if (condition.operator === 'gte') return value >= condition.value;
  if (condition.operator === 'lte') return value <= condition.value;
  if (condition.operator === 'in') return condition.value.includes(value);
  return false;
}

module.exports = { bindEvidence, extractValue, evaluateCondition };
