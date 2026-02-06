'use strict';

const { assertTruthy, summary, reset } = require('./_assert');
const { runPipeline } = require('../cil_runtime/cil_runtime_engine');
const lexicon = require('../cil_runtime/lexicons/lexicon_en.json');
const urgencyCues = require('../cil_runtime/lexicons/urgency_cues_en.json');

function run() {
  reset();
  console.log('  [test_urgency_escalation]');

  const normalResult = runPipeline('hello there', { lexicon, urgencyCues });
  const urgentResult = runPipeline('emergency help now', { lexicon, urgencyCues });

  assertTruthy(
    urgentResult.urgency >= normalResult.urgency,
    'Emergency input has higher or equal urgency than normal input'
  );

  return summary();
}

module.exports = { run };
