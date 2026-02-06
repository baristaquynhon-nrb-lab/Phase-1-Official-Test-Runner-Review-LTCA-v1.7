'use strict';

/**
 * PFT → COP Interface — Converts PFT pseudo-symbols to COP input format.
 */

function pftToCop(pseudoSymbol) {
  if (!pseudoSymbol || pseudoSymbol.type !== 'pseudo_symbol') {
    throw new Error('Invalid pseudo-symbol: must have type "pseudo_symbol"');
  }

  return {
    input_type: 'pft_signal',
    text: pseudoSymbol.symbol_text,
    source: pseudoSymbol.source,
    signal_class: pseudoSymbol.signal_class,
    pre_urgency: pseudoSymbol.urgency,
    confidence: pseudoSymbol.confidence,
    timestamp: pseudoSymbol.timestamp
  };
}

module.exports = { pftToCop };
