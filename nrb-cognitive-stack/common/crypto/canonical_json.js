'use strict';

/**
 * Canonical JSON — Deterministic JSON serialization.
 */

function canonicalJson(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalJson(obj[k]));
  return '{' + pairs.join(',') + '}';
}

function parse(str) {
  return JSON.parse(str);
}

function isCanonical(str) {
  try {
    const obj = JSON.parse(str);
    return canonicalJson(obj) === str;
  } catch {
    return false;
  }
}

module.exports = { canonicalJson, parse, isCanonical };
