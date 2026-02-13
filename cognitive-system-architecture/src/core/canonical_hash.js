/**
 * CANONICAL HASH MODULE
 * LTCA-NRBPL Cognitive Operating System
 *
 * LAW-005 Compliance: Deterministic hashing
 * LAW-004 Compliance: Provenance chain integrity
 *
 * Uses SHA-256 with canonical JSON serialization
 * Guarantees: same input → same hash (always)
 */

const crypto = require('crypto');

/**
 * Canonical JSON serialization
 * Ensures deterministic string representation regardless of key order
 * @param {any} obj - Object to serialize
 * @returns {string} Canonical JSON string
 */
function canonicalSerialize(obj) {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalSerialize(item));
    return '[' + items.join(',') + ']';
  }

  // Sort keys deterministically
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    const value = canonicalSerialize(obj[key]);
    return JSON.stringify(key) + ':' + value;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * Compute canonical SHA-256 hash
 * LAW-005: Deterministic - same input always produces same hash
 *
 * @param {any} data - Data to hash
 * @returns {string} SHA-256 hash in hex format
 */
function canonicalHash(data) {
  const canonical = canonicalSerialize(data);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Compute hash chain (for forensic linking)
 * LAW-004: Provenance chain
 *
 * @param {string} previousHash - Previous hash in chain
 * @param {any} currentData - Current data to hash
 * @returns {string} Chained hash
 */
function chainHash(previousHash, currentData) {
  const chainInput = {
    previous: previousHash,
    current: currentData
  };
  return canonicalHash(chainInput);
}

/**
 * Verify hash integrity
 * @param {any} data - Original data
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} True if hash matches
 */
function verifyHash(data, expectedHash) {
  const computedHash = canonicalHash(data);
  return computedHash === expectedHash;
}

/**
 * Generate merkle root from array of hashes
 * @param {string[]} hashes - Array of hash strings
 * @returns {string} Merkle root hash
 */
function merkleRoot(hashes) {
  if (hashes.length === 0) {
    return canonicalHash('EMPTY_MERKLE');
  }

  if (hashes.length === 1) {
    return hashes[0];
  }

  const nextLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left; // Duplicate last if odd
    nextLevel.push(canonicalHash({ left, right }));
  }

  return merkleRoot(nextLevel);
}

module.exports = {
  canonicalSerialize,
  canonicalHash,
  chainHash,
  verifyHash,
  merkleRoot
};
