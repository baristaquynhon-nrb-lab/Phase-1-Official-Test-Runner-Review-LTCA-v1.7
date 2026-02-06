'use strict';

const { assertEqual, assertTruthy, summary, reset } = require('./_assert');
const { generateSurface } = require('../surface/surface_generator_adapter');
const templateMap = require('../surface/template_map.json');

function run() {
  reset();
  console.log('  [test_surface_no_new_facts]');

  const mockFrame = {
    type: 'meaning_frame',
    intent: 'HELP_REQUEST',
    language: 'en',
    urgency: 2,
    trace_hash: 'abc123'
  };

  const result = generateSurface(mockFrame, templateMap);

  assertTruthy(result.surface_text, 'Surface text is generated');
  assertEqual(result.language, 'en', 'Language matches frame');
  assertEqual(result.no_new_facts_verified, true, 'No new facts constraint passed');
  assertEqual(result.template_used, 'HELP_REQUEST', 'Correct template used');

  return summary();
}

module.exports = { run };
