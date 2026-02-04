/**
 * SHA-256 hashing utilities for forensic audit
 */

import crypto from 'crypto';
import { canonicalize } from './canonical_json.js';

export function sha256(data) {
  if (typeof data === 'object') {
    data = canonicalize(data);
  }
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export function hashObject(obj) {
  return sha256(obj);
}

export function verifyHash(obj, expectedHash) {
  const actualHash = hashObject(obj);
  return actualHash === expectedHash;
}

export function createHashChain(entries) {
  let prevHash = 'GENESIS';
  return entries.map((entry, i) => {
    const entryWithPrev = { ...entry, prev_hash: prevHash, seq_no: i };
    const hash = hashObject(entryWithPrev);
    prevHash = hash;
    return { ...entryWithPrev, hash };
  });
}

export function verifyHashChain(entries) {
  let prevHash = 'GENESIS';
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.prev_hash !== prevHash) {
      return { valid: false, failedAt: i, reason: 'prev_hash mismatch' };
    }
    const expectedHash = entry.hash;
    const actualHash = hashObject({
      ...entry,
      hash: undefined // exclude hash from hash computation
    });
    if (actualHash !== expectedHash) {
      return { valid: false, failedAt: i, reason: 'hash mismatch' };
    }
    prevHash = entry.hash;
  }
  return { valid: true };
}
