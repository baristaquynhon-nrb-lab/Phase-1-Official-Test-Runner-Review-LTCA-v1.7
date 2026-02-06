'use strict';

/**
 * Test: Signal to COP — Tests PFT signal processing to COP input conversion.
 */

const { classifySignal } = require('../signal_layer/signal_classifier');
const { buildGestureFrame } = require('../signal_layer/gesture_frame_builder');
const { generatePseudoSymbol } = require('../signal_layer/pseudo_symbol_generator');

function run() {
  console.log('  [test_signal_to_cop]');

  // Simulate a distress audio signal
  const sensorOutput = {
    source: 'mic',
    features: { distress_sound: true, speech_detected: true }
  };

  const classified = classifySignal(sensorOutput);
  const gestureFrame = buildGestureFrame(classified);
  const pseudoSymbol = generatePseudoSymbol(gestureFrame);

  const passed = pseudoSymbol.type === 'pseudo_symbol'
    && pseudoSymbol.signal_class === 'DISTRESS'
    && pseudoSymbol.urgency >= 4;

  console.log(`  ${passed ? 'PASS' : 'FAIL'}: Distress signal correctly converted to pseudo-symbol`);
  return passed;
}

module.exports = { run };

if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
