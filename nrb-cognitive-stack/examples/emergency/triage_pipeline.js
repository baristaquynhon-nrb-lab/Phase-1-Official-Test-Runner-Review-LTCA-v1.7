'use strict';

/**
 * Triage Pipeline — Example of emergency triage flow.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { createEnvelope } = require('../../gsra/adapters/cop_to_gsra_adapter');
const { processEnvelope } = require('../../gsra/core/gsra_engine');
const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
const urgencyCues = require('../../cop/cil_runtime/lexicons/urgency_cues_en.json');

const input = 'emergency help I am hurt and in danger';
console.log(`Triage Pipeline — Input: "${input}"\n`);

// Step 1: COP processing
const meaningFrame = runPipeline(input, { lexicon, urgencyCues });
console.log(`Step 1 — COP: Urgency=${meaningFrame.urgency}, Confidence=${meaningFrame.confidence}`);

// Step 2: GSRA evaluation
const envelope = createEnvelope(meaningFrame);
const lawVault = {
  safety_laws: require('../../gsra/law_vault/safety_laws.json'),
  intervention_laws: require('../../gsra/law_vault/intervention_laws.json')
};
const response = processEnvelope(envelope, lawVault);
console.log(`Step 2 — GSRA: Verdict=${response.verdict}`);
console.log(`  Action: ${response.action_policy.action}`);
console.log(`  Priority: ${response.action_policy.priority}`);
console.log(`  Requires Human: ${response.action_policy.requires_human}`);
