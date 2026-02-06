'use strict';

/**
 * Emergency Detection — Example of emergency signal processing.
 */

const { runPipeline } = require('../../cop/cil_runtime/cil_runtime_engine');
const lexicon = require('../../cop/cil_runtime/lexicons/lexicon_en.json');
const urgencyCues = require('../../cop/cil_runtime/lexicons/urgency_cues_en.json');

const emergencyInputs = [
  'help me please',
  'emergency danger now',
  'I am hurt badly',
  'hello how are you'
];

console.log('Emergency Detection Examples\n');

for (const input of emergencyInputs) {
  const result = runPipeline(input, { lexicon, urgencyCues });
  const isEmergency = result.urgency >= 4;
  console.log(`Input: "${input}"`);
  console.log(`  Urgency: ${result.urgency} ${isEmergency ? '*** EMERGENCY ***' : ''}`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log('');
}
