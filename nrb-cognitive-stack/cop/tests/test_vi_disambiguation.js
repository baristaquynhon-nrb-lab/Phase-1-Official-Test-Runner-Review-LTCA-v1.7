'use strict';

const { assertEqual, assertTruthy, summary, reset } = require('./_assert');
const { runPipeline } = require('../cil_runtime/cil_runtime_engine');
const lexicon = require('../cil_runtime/lexicons/lexicon_vi.json');

function run() {
  reset();
  console.log('  [test_vi_disambiguation]');

  const result = runPipeline('giúp tôi', { lexicon });

  assertEqual(result.type, 'meaning_frame', 'Output is a meaning_frame');
  assertEqual(result.language, 'vi', 'Language detected as Vietnamese');
  assertTruthy(result.trace_hash, 'trace_hash is present');

  return summary();
}

module.exports = { run };
