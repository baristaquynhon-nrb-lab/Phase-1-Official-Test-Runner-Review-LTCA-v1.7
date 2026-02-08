"use strict";

/*
================================================
 FORENSIC INVARIANTS ENGINE v1.0
 Deterministic Integrity Enforcement Layer
================================================
*/

const crypto = require("crypto");

/* =================================================
   1. Canonicalization
================================================= */

function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);

  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        if (obj[k] !== undefined) acc[k] = canonicalize(obj[k]);
        return acc;
      }, {});
  }

  return obj;
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function hashCanonical(obj) {
  return sha256(JSON.stringify(canonicalize(obj)));
}

/* =================================================
   2. Evidence Binding
================================================= */

function bindEvidence(canonicalInput) {
  if (!canonicalInput || canonicalInput.type !== "canonical_input") {
    throw new Error("INVALID_INPUT: canonical_input required");
  }

  const input_hash = hashCanonical(canonicalInput);
  const evidence_hash = sha256(input_hash);

  return {
    type: "evidence_unit",
    input_hash,
    evidence_hash,
    timestamp_bound: new Date().toISOString()
  };
}

/* =================================================
   3. System Invariant Enforcement
================================================= */

function enforceSystemInvariants(ctx) {
  const { evidenceUnit, meaningState, lawVerdict, actionPolicy } = ctx;

  // ---- Evidence invariants
  if (evidenceUnit) {
    if (evidenceUnit.type !== "evidence_unit") {
      throw new Error("INV_FAIL: evidence_unit.type");
    }
    if (evidenceUnit.input_hash.length !== 64) {
      throw new Error("INV_FAIL: evidence_unit.input_hash");
    }
    if (evidenceUnit.evidence_hash.length !== 64) {
      throw new Error("INV_FAIL: evidence_unit.evidence_hash");
    }
  }

  // ---- Meaning invariants
  if (meaningState) {
    if (meaningState.type !== "meaning_state") {
      throw new Error("INV_FAIL: meaning_state.type");
    }
    if (meaningState.evidence_hash !== evidenceUnit.evidence_hash) {
      throw new Error("INV_FAIL: meaning_state.evidence_binding");
    }
  }

  // ---- Law invariants
  if (lawVerdict) {
    if (lawVerdict.type !== "law_verdict") {
      throw new Error("INV_FAIL: law_verdict.type");
    }
    if (lawVerdict.meaning_fingerprint !== meaningState.semantic_fingerprint) {
      throw new Error("INV_FAIL: law.meaning_binding");
    }
  }

  // ---- Action invariants
  if (actionPolicy) {
    if (actionPolicy.type !== "action_policy") {
      throw new Error("INV_FAIL: action_policy.type");
    }
    if (actionPolicy.verdict !== lawVerdict.verdict) {
      throw new Error("INV_FAIL: action.verdict_binding");
    }
  }

  return true;
}

/* =================================================
   4. End-to-End Pipeline
================================================= */

const { stabilizeMeaning } = require("../meaning");
const { evaluateLaw } = require("../law");
const { generateActionPolicy } = require("../action");
const evidence = require("../evidence");

function runE2E() {
  console.log("E2E: Running full pipeline...");

  const canonicalInput = {
    type: "canonical_input",
    version: "v1.0",
    timestamp: "2026-02-08T00:00:00Z",
    payload: { data: "e2e_test" }
  };

  // Layer 1: Evidence Binding
  const ev = evidence.bindEvidence(canonicalInput);
  console.log("  [1] Evidence bound:", ev.input_hash.slice(0, 16) + "...");

  // Layer 2: Meaning Stabilization
  const ms = stabilizeMeaning(ev, null);
  console.log("  [2] Meaning stabilized, drift:", ms.drift_score);

  // Layer 3: Law Evaluation
  const lv = evaluateLaw(ms);
  console.log("  [3] Law verdict:", lv.verdict);

  // Layer 4: Action Policy
  const ap = generateActionPolicy(lv);
  console.log("  [4] Action:", ap.action, "Safety:", ap.safety_level);

  // Cross-layer invariant enforcement
  enforceSystemInvariants({
    evidenceUnit: ev,
    meaningState: ms,
    lawVerdict: lv,
    actionPolicy: ap
  });
  console.log("  [5] System invariants enforced.");

  console.log("E2E: Pipeline completed successfully.");
  return { status: "OK", verdict: lv.verdict, action: ap.action };
}

/* =================================================
   EXPORTS
================================================= */

module.exports = {
  canonicalize,
  hashCanonical,
  bindEvidence,
  enforceSystemInvariants,
  runE2E
};
