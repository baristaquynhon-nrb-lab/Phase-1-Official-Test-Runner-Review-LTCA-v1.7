'use strict';

/**
 * GSRA → Action Interface — Converts GSRA verdicts to executable actions.
 */

function gsraToAction(gsraResponse) {
  if (!gsraResponse || gsraResponse.response_type !== 'gsra_verdict') {
    throw new Error('Invalid GSRA response');
  }

  return {
    action_type: gsraResponse.action_policy.action,
    priority: gsraResponse.action_policy.priority,
    requires_human: gsraResponse.action_policy.requires_human || false,
    rationale: gsraResponse.action_policy.rationale,
    verdict: gsraResponse.verdict,
    source_trace_hash: gsraResponse.trace_hash,
    timestamp: new Date().toISOString()
  };
}

module.exports = { gsraToAction };
