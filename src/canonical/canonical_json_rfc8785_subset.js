#!/usr/bin/env node
"use strict";

/*
 LTCA Canonical JSON Serializer — RFC 8785 Subset

 Implements the deterministic JSON serialization required by LTCA_FIXTURE_SCHEMA_v1.0.

 Rules:
   - Object keys: lexicographic order (UTF-8 codepoint sort)
   - Array order: preserved (semantically meaningful)
   - Numbers: integers as JSON numbers (if |val| <= 2^53-1), else string
   - No NaN, no Infinity
   - No whitespace between tokens
   - Strings: minimal escape sequences per RFC 8785
   - Output: deterministic UTF-8 byte sequence

 Usage:
   const { canonicalize, canonicalHash } = require("./canonical_json_rfc8785_subset");
   const canonical = canonicalize(obj);
   const hash = canonicalHash(obj);  // sha256 hex
*/

const crypto = require("crypto");

/**
 * Canonicalize a value to deterministic JSON string (RFC 8785 subset).
 * @param {*} value - Any JSON-serializable value
 * @returns {string} Canonical JSON string
 */
function canonicalize(value) {
  if (value === null) return "null";
  if (value === undefined) return undefined;

  const type = typeof value;

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (type === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`canonicalize: NaN/Infinity not permitted (got ${value})`);
    }
    // RFC 8785: use JSON number serialization
    // For integers within safe range, this is exact
    return JSON.stringify(value);
  }

  if (type === "string") {
    return canonicalString(value);
  }

  if (Array.isArray(value)) {
    // Array order is semantically meaningful — preserve it
    const items = value.map(item => canonicalize(item));
    return "[" + items.join(",") + "]";
  }

  if (type === "object") {
    // Sort keys lexicographically by UTF-8 codepoint
    const keys = Object.keys(value).sort();
    const pairs = [];
    for (const key of keys) {
      const val = canonicalize(value[key]);
      if (val !== undefined) {
        pairs.push(canonicalString(key) + ":" + val);
      }
    }
    return "{" + pairs.join(",") + "}";
  }

  throw new Error(`canonicalize: unsupported type '${type}'`);
}

/**
 * Canonical string encoding with minimal escapes per RFC 8785.
 */
function canonicalString(str) {
  let result = '"';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    switch (code) {
      case 0x08: result += "\\b"; break;
      case 0x09: result += "\\t"; break;
      case 0x0A: result += "\\n"; break;
      case 0x0C: result += "\\f"; break;
      case 0x0D: result += "\\r"; break;
      case 0x22: result += '\\"'; break;
      case 0x5C: result += "\\\\"; break;
      default:
        if (code < 0x20) {
          result += "\\u" + code.toString(16).padStart(4, "0");
        } else {
          result += str[i];
        }
    }
  }
  return result + '"';
}

/**
 * Compute SHA-256 hash of the canonical JSON form.
 * @param {*} value - Any JSON-serializable value
 * @returns {string} "sha256:<hex>"
 */
function canonicalHash(value) {
  const canonical = canonicalize(value);
  const hash = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  return "sha256:" + hash;
}

module.exports = { canonicalize, canonicalHash, canonicalString };

// CLI mode: canonicalize a JSON file
if (require.main === module) {
  const fs = require("fs");
  const path = process.argv[2];
  const mode = process.argv[3] || "canonical"; // "canonical" or "hash"

  if (!path) {
    console.error("Usage: canonical_json_rfc8785_subset.js <file.json> [canonical|hash]");
    process.exit(1);
  }

  const doc = JSON.parse(fs.readFileSync(path, "utf8"));

  if (mode === "hash") {
    console.log(canonicalHash(doc));
  } else {
    console.log(canonicalize(doc));
  }
}
