#!/usr/bin/env node
"use strict";

/*
 LTCA_NUMERIC_PROFILE_v1 — Numeric Normalization Module

 Implements the numeric encoding contract from LTCA_FIXTURE_SCHEMA_v1.0 Section 2.

 Rules:
   R1. Non-integer literals → string (decimal) to prevent JSON float drift
   R2. Integers |val| <= 2^53-1 → JSON number; else → string
   R3. Scientific notation → string form (e.g., "1e-12")
   R4. Tolerance/threshold fields → always string, never binary float

 This module provides:
   - normalizeNumeric(value, fieldName): normalize a single value
   - normalizeDocument(doc): deep-walk a document and normalize all numerics
   - isCompliant(doc): check if a document already complies (no mutation)

 Usage:
   const { normalizeDocument, isCompliant } = require("./numeric_profile_v1");
   const normalized = normalizeDocument(doc);
   const { compliant, violations } = isCompliant(doc);
*/

const SAFE_INT_MAX = Number.MAX_SAFE_INTEGER; // 2^53 - 1

// Fields that MUST always be string-encoded per R4
const MANDATORY_STRING_FIELDS = new Set([
  "epsilon", "threshold", "tolerance", "tolerance_used",
  "omega_est_max", "omega_est", "cad_omega",
  "rebt_epsilon", "scale", "lssm",
  "lssm_mode2", "lssm_emergency", "lssm_halt",
  "minimality_cost"
]);

/**
 * Check if a field name requires mandatory string encoding (R4).
 */
function isMandatoryStringField(fieldName) {
  const lk = fieldName.toLowerCase();
  return MANDATORY_STRING_FIELDS.has(lk) ||
    lk.includes("epsilon") ||
    lk.includes("threshold") ||
    lk.includes("tolerance") ||
    lk.includes("omega");
}

/**
 * Normalize a single numeric value according to LTCA_NUMERIC_PROFILE_v1.
 * @param {*} value - The value to normalize
 * @param {string} fieldName - The field name (for R4 context)
 * @returns {*} Normalized value (string or number or {lit:string})
 */
function normalizeNumeric(value, fieldName) {
  if (value === null || value === undefined) return value;

  // Already in {lit: "..."} form — compliant
  if (typeof value === "object" && value !== null && typeof value.lit === "string") {
    return value;
  }

  // Already in {num: "..."} form — compliant
  if (typeof value === "object" && value !== null && typeof value.num === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`NaN/Infinity not permitted in field '${fieldName}'`);
    }

    // R4: mandatory string fields
    if (isMandatoryStringField(fieldName)) {
      return { "lit": numToString(value) };
    }

    // R2: safe integers stay as numbers
    if (Number.isInteger(value) && Math.abs(value) <= SAFE_INT_MAX) {
      return value;
    }

    // R1/R3: non-integer or large → string
    return { "lit": numToString(value) };
  }

  // String value for a numeric field — wrap in lit
  if (typeof value === "string" && isNumericString(value)) {
    if (isMandatoryStringField(fieldName)) {
      return { "lit": value };
    }
    return { "lit": value };
  }

  return value;
}

/**
 * Convert a number to its canonical string representation.
 */
function numToString(n) {
  // Use exponential form if the number was likely expressed that way
  const s = String(n);
  if (s.includes("e") || s.includes("E")) {
    // Normalize: lowercase e, no leading zeros in exponent
    return n.toExponential().replace(/\.?0+e/, "e").replace("e+", "e");
  }
  return s;
}

/**
 * Check if a string looks like a numeric literal.
 */
function isNumericString(s) {
  return /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s);
}

/**
 * Deep-walk a document and normalize all numeric values.
 * Returns a new object (does not mutate input).
 */
function normalizeDocument(doc) {
  return walk(doc, "");
}

function walk(node, path) {
  if (node === null || node === undefined) return node;

  if (typeof node === "number") {
    return normalizeNumeric(node, path);
  }

  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item, i) => walk(item, `${path}[${i}]`));
  }

  if (typeof node === "object") {
    const result = {};
    for (const [key, val] of Object.entries(node)) {
      result[key] = walk(val, key);
    }
    return result;
  }

  return node;
}

/**
 * Check compliance without mutation. Returns {compliant, violations}.
 */
function isCompliant(doc) {
  const violations = [];
  checkCompliance(doc, "", violations);
  return { compliant: violations.length === 0, violations };
}

function checkCompliance(node, path, violations) {
  if (node === null || node === undefined) return;

  if (typeof node === "number") {
    if (!Number.isFinite(node)) {
      violations.push({ path, issue: "NaN/Infinity" });
      return;
    }
    if (isMandatoryStringField(path)) {
      violations.push({ path, issue: `R4: field '${path}' must be string-encoded, got number ${node}` });
    } else if (!Number.isInteger(node)) {
      violations.push({ path, issue: `R1: non-integer ${node} should be string-encoded` });
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => checkCompliance(item, `${path}[${i}]`, violations));
    return;
  }

  if (typeof node === "object") {
    for (const [key, val] of Object.entries(node)) {
      checkCompliance(val, key, violations);
    }
  }
}

module.exports = {
  normalizeNumeric,
  normalizeDocument,
  isCompliant,
  isMandatoryStringField,
  MANDATORY_STRING_FIELDS
};

// CLI mode: check or normalize a JSON file
if (require.main === module) {
  const fs = require("fs");
  const filePath = process.argv[2];
  const mode = process.argv[3] || "check"; // "check" or "normalize"

  if (!filePath) {
    console.error("Usage: numeric_profile_v1.js <file.json> [check|normalize]");
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (mode === "check") {
    const { compliant, violations } = isCompliant(doc);
    if (compliant) {
      console.log("NUMERIC PROFILE COMPLIANT:", filePath);
    } else {
      console.error("NUMERIC PROFILE VIOLATIONS:", filePath);
      violations.forEach(v => console.error(`  ${v.path}: ${v.issue}`));
      process.exit(1);
    }
  } else if (mode === "normalize") {
    const normalized = normalizeDocument(doc);
    console.log(JSON.stringify(normalized, null, 2));
  }
}
