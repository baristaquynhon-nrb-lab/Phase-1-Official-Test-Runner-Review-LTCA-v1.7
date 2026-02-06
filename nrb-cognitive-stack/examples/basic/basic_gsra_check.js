'use strict';

/**
 * Basic GSRA Check — Simple GSRA law evaluation example.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const { createEnvelope } = require('../../gsra/adapters/cop_to_gsra_adapter');
const { processEnvelope } = require('../../gsra/core/gsra_engine');
const { formatResponse } = require('../../gsra/adapters/gsra_response_formatter');
const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');

// Process input through COP
const input = 'I need help';
const meaningFrame = runPipeline(input, { lexicon });

// Create GSRA envelope
const envelope = createEnvelope(meaningFrame);

// Evaluate against law vault
const lawVault = {
  safety_laws: require('../../gsra/law_vault/safety_laws.json'),
  ethical_laws: require('../../gsra/law_vault/ethical_laws.json'),
  intervention_laws: require('../../gsra/law_vault/intervention_laws.json'),
  domain_policies: require('../../gsra/law_vault/domain_policies.json')
};

const response = processEnvelope(envelope, lawVault);
const formatted = formatResponse(response);

console.log(`Input: "${input}"`);
console.log(`Verdict: ${formatted.verdict}`);
console.log(`Action: ${formatted.action}`);
console.log(`Priority: ${formatted.priority}`);
console.log(`Rationale: ${formatted.rationale}`);
