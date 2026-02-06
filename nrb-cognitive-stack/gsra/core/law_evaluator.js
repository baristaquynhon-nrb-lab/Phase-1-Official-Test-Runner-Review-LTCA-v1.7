'use strict';

const { bindEvidence } = require('./evidence_binder');

/**
 * LEAE (Law Evaluation and Application Engine) — Evaluates laws against evidence.
 */

function evaluateLaw(meaningFrame, law) {
  const binding = bindEvidence(meaningFrame, law);
  return {
    law_id: law.id,
    category: law.category,
    triggered: binding.all_satisfied,
    verdict: binding.all_satisfied ? law.verdict : null,
    binding
  };
}

function evaluateAllLaws(meaningFrame, laws) {
  const results = laws.map(law => evaluateLaw(meaningFrame, law));
  const triggered = results.filter(r => r.triggered);

  // Determine final verdict (BLOCK takes priority over MODIFY, MODIFY over ALLOW)
  let finalVerdict = 'ALLOW';
  for (const result of triggered) {
    if (result.verdict === 'BLOCK') {
      finalVerdict = 'BLOCK';
      break;
    }
    if (result.verdict === 'MODIFY') {
      finalVerdict = 'MODIFY';
    }
  }

  return {
    results,
    triggered,
    final_verdict: finalVerdict,
    laws_evaluated_count: results.length,
    laws_triggered_count: triggered.length
  };
}

module.exports = { evaluateLaw, evaluateAllLaws };
