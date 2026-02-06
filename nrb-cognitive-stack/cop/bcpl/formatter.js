'use strict';

/**
 * BCPL Formatter — Normalizes corpus text format for downstream processing.
 */

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeUnicode(text) {
  return text.normalize('NFC');
}

function formatCorpusLine(line) {
  const normalized = normalizeUnicode(normalizeWhitespace(line));
  return normalized;
}

function formatCorpus(lines) {
  return lines.map(formatCorpusLine).filter(line => line.length > 0);
}

module.exports = { formatCorpusLine, formatCorpus, normalizeWhitespace, normalizeUnicode };
