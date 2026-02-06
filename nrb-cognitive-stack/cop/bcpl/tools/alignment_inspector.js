'use strict';

/**
 * Alignment Inspector — Inspects and debugs alignment quality.
 */

function inspectAlignment(pair) {
  const enWords = pair.en.split(/\s+/).length;
  const viWords = pair.vi.split(/\s+/).length;
  const ratio = enWords / viWords;
  return {
    en_word_count: enWords,
    vi_word_count: viWords,
    ratio: Math.round(ratio * 100) / 100,
    suspicious: ratio > 3.0 || ratio < 0.33
  };
}

function inspectBatch(pairs) {
  return pairs.map((pair, i) => ({
    index: i,
    ...inspectAlignment(pair)
  }));
}

module.exports = { inspectAlignment, inspectBatch };
