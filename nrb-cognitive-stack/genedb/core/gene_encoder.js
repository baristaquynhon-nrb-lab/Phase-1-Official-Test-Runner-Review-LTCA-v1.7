'use strict';

const crypto = require('crypto');

/**
 * Gene Encoder — NRB-256 gene encoding for GeneDB storage.
 */

function canonicalJson(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function encodeGene(data, source) {
  const canonical = canonicalJson(data);
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');

  return {
    type: 'nrb256_gene',
    hash,
    data,
    encoded_at: new Date().toISOString(),
    source: source || 'runtime',
    access_count: 0,
    last_accessed: null
  };
}

function computeHash(data) {
  return crypto.createHash('sha256').update(canonicalJson(data)).digest('hex');
}

module.exports = { encodeGene, computeHash, canonicalJson };
