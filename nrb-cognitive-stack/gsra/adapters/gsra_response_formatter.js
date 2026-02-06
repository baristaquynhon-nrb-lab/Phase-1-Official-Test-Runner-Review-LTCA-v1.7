'use strict';

/**
 * GSRA Response Formatter — Formats GSRA verdicts for downstream consumers.
 */

function formatResponse(gsraResponse) {
  return {
    verdict: gsraResponse.verdict,
    action: gsraResponse.action_policy.action,
    priority: gsraResponse.action_policy.priority,
    rationale: gsraResponse.action_policy.rationale,
    requires_human: gsraResponse.action_policy.requires_human || false,
    trace_hash: gsraResponse.trace_hash,
    timestamp: gsraResponse.timestamp
  };
}

function formatForLog(gsraResponse) {
  return `[GSRA] Verdict=${gsraResponse.verdict} Priority=${gsraResponse.action_policy.priority} Hash=${gsraResponse.trace_hash}`;
}

module.exports = { formatResponse, formatForLog };
