'use strict';

const { selectTemplate } = require('./template_selector');
const { enforceConstraints } = require('./transformers/constraint_enforcer');

/**
 * Surface Generator Adapter — Main generation adapter for L3.
 */

function generateSurface(meaningFrame, templateMap) {
  const template = selectTemplate(meaningFrame, templateMap);
  const surfaceText = template || `[No template for intent: ${meaningFrame.intent}]`;

  const output = {
    surface_text: surfaceText,
    language: meaningFrame.language,
    template_used: meaningFrame.intent,
    source_frame_hash: meaningFrame.trace_hash,
    no_new_facts_verified: true
  };

  // Enforce no-new-facts constraint
  const enforcement = enforceConstraints(output, meaningFrame);
  output.no_new_facts_verified = enforcement.passed;

  return output;
}

module.exports = { generateSurface };
