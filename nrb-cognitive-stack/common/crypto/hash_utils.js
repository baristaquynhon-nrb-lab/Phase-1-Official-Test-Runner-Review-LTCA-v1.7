'use strict';

const crypto = require('crypto');

/**
 * Hash Utilities — SHA-256 trace hashing for audit trails.
 */

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hashObject(obj) {
  const canonical = canonicalStringify(obj);
  return sha256(canonical);
}

function canonicalStringify(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

function verifyHash(data, expectedHash) {
  const actualHash = sha256(data);
  return actualHash === expectedHash;
}

module.exports = { sha256, hashObject, canonicalStringify, verifyHash };
