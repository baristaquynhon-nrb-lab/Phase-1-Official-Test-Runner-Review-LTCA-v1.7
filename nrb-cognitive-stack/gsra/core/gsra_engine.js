'use strict';

const crypto = require('crypto');
const { evaluateAllLaws } = require('./law_evaluator');
const { checkCoherence } = require('./coherence_gate');
const { planIntervention } = require('./intervention_planner');

/**
 * GSRA Engine — Main coordinator for the GSRA subsystem.
 */

function processEnvelope(envelope, lawVault) {
  const meaningFrame = envelope.meaning_frame;
  const allLaws = [
    ...(lawVault.safety_laws || []),
    ...(lawVault.ethical_laws || []),
    ...(lawVault.intervention_laws || []),
    ...(lawVault.domain_policies || [])
  ];

  // Evaluate all laws
  const evaluation = evaluateAllLaws(meaningFrame, allLaws);

  // Check coherence
  const coherence = checkCoherence(evaluation);

  // Plan intervention
  const intervention = planIntervention(evaluation.final_verdict, meaningFrame);

  // Build response
  const response = {
    response_type: 'gsra_verdict',
    version: '1.0',
    verdict: evaluation.final_verdict,
    action_policy: intervention,
    laws_evaluated: allLaws.map(l => l.id),
    coherence_check: coherence,
    evidence_bindings: evaluation.triggered.map(r => r.binding),
    timestamp: new Date().toISOString()
  };

  // Compute trace hash
  const canonical = JSON.stringify(response, Object.keys(response).sort());
  response.trace_hash = crypto.createHash('sha256').update(canonical).digest('hex');

  return response;
}

module.exports = { processEnvelope };
