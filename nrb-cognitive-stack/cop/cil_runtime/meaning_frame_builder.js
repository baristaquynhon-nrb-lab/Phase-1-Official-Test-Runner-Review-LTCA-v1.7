'use strict';

const crypto = require('crypto');

/**
 * MEANING_FRAME_BUILDER_v1.0 — Constructs validated Meaning Frames.
 */

function canonicalJson(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function computeTraceHash(frame) {
  const canonical = canonicalJson(frame);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function buildMeaningFrame(hypothesis, metadata) {
  const frame = {
    type: 'meaning_frame',
    version: '1.0',
    intent: hypothesis.intent || 'UNCLASSIFIED',
    tokens: hypothesis.tokens,
    confidence: hypothesis.confidence,
    urgency: hypothesis.urgency || 0,
    language: metadata.language || 'en',
    evidence: {
      source_text: metadata.original || '',
      hypothesis_id: hypothesis.id,
      constraints_applied: hypothesis.constraints_applied || false
    },
    timestamp: new Date().toISOString()
  };

  frame.trace_hash = computeTraceHash(frame);
  return frame;
}

module.exports = { buildMeaningFrame, computeTraceHash, canonicalJson };
