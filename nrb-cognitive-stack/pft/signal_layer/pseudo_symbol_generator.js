'use strict';

/**
 * Pseudo Symbol Generator — Converts gesture frames to COP-compatible input.
 */

const SIGNAL_TO_SYMBOL = {
  'DISTRESS': 'help emergency',
  'FALL': 'fall detected danger',
  'GESTURE': 'gesture signal',
  'SPEECH': 'speech input',
  'UNKNOWN': 'unknown signal'
};

function generatePseudoSymbol(gestureFrame) {
  const symbolText = SIGNAL_TO_SYMBOL[gestureFrame.signal_class] || SIGNAL_TO_SYMBOL['UNKNOWN'];

  return {
    type: 'pseudo_symbol',
    source: gestureFrame.source,
    signal_class: gestureFrame.signal_class,
    symbol_text: symbolText,
    confidence: gestureFrame.confidence,
    urgency: gestureFrame.urgency,
    timestamp: Date.now()
  };
}

module.exports = { generatePseudoSymbol };
