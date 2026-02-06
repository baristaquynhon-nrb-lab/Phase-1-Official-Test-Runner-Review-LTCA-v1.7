'use strict';

const { assertEqual, assertTruthy, summary, reset } = require('./_assert');
const { runPipeline } = require('../cil_runtime/cil_runtime_engine');
const lexicon = require('../cil_runtime/lexicons/lexicon_en.json');

function run() {
  reset();
  console.log('  [test_cil_help_request]');

  const result = runPipeline('please help me', { lexicon });

  assertEqual(result.type, 'meaning_frame', 'Output is a meaning_frame');
  assertTruthy(result.trace_hash, 'trace_hash is present');
  assertTruthy(result.tokens.length > 0, 'Tokens are populated');
  assertEqual(result.language, 'en', 'Language detected as English');
  assertTruthy(result.confidence > 0, 'Confidence is positive');

  return summary();
}

module.exports = { run };
