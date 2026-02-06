'use strict';

/**
 * BCPL Aligner — Bilingual sentence/phrase alignment for EN/VI corpora.
 */

function parseBilingualPair(line) {
  const parts = line.split('\t');
  if (parts.length !== 2) {
    return null;
  }
  return { en: parts[0].trim(), vi: parts[1].trim() };
}

function alignCorpus(lines) {
  const aligned = [];
  for (const line of lines) {
    const pair = parseBilingualPair(line);
    if (pair) {
      aligned.push(pair);
    }
  }
  return aligned;
}

function validateAlignment(pair) {
  return pair && pair.en && pair.vi && pair.en.length > 0 && pair.vi.length > 0;
}

module.exports = { parseBilingualPair, alignCorpus, validateAlignment };
