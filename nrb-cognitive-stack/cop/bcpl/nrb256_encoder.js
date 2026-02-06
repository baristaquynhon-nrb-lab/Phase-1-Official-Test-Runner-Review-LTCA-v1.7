'use strict';

const crypto = require('crypto');

/**
 * BCPL NRB-256 Encoder — Encodes proto-frames as NRB-256 gene objects.
 */

function canonicalJson(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function computeHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function encodeGene(protoFrame) {
  const canonical = canonicalJson(protoFrame);
  const hash = computeHash(canonical);
  return {
    type: 'nrb256_gene',
    hash,
    data: protoFrame,
    encoded_at: new Date().toISOString()
  };
}

function encodeBatch(protoFrames) {
  return protoFrames.map(encodeGene);
}

module.exports = { encodeGene, encodeBatch, canonicalJson, computeHash };
