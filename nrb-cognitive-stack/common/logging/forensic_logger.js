'use strict';

const { sha256 } = require('../crypto/hash_utils');
const { canonicalJson } = require('../crypto/canonical_json');

/**
 * Forensic Logger — Immutable audit logging for all pipeline decisions.
 */

class ForensicLogger {
  constructor() {
    this.entries = [];
  }

  log(event, data) {
    const entry = {
      sequence: this.entries.length,
      event,
      data,
      timestamp: new Date().toISOString(),
      hash: sha256(canonicalJson({ event, data, sequence: this.entries.length }))
    };

    // Chain hash to previous entry
    if (this.entries.length > 0) {
      entry.prev_hash = this.entries[this.entries.length - 1].hash;
    }

    this.entries.push(entry);
    return entry;
  }

  getEntries() {
    return [...this.entries];
  }

  verifyChain() {
    for (let i = 1; i < this.entries.length; i++) {
      if (this.entries[i].prev_hash !== this.entries[i - 1].hash) {
        return { valid: false, broken_at: i };
      }
    }
    return { valid: true };
  }

  size() {
    return this.entries.length;
  }
}

module.exports = { ForensicLogger };
