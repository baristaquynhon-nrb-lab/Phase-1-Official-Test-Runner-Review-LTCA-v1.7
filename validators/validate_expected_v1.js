#!/usr/bin/env node
"use strict";

/*
 LTCA_FIXTURE_SCHEMA_v1.0 — Expected Output Validator
 Scope: tests/expected/*.json
 Deterministic, fail-fast
*/

const fs = require("fs");

function fail(msg) {
  console.error("EXPECTED INVALID:", msg);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

function isObject(x) {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isString(x) {
  return typeof x === "string";
}

function checkNumericProfile(val, path) {
  if (typeof val === "number") {
    if (!Number.isFinite(val)) fail(`${path}: NaN/Inf not allowed`);
    return;
  }
  if (isString(val)) return;
  if (isObject(val) && isString(val.lit)) return;
  if (isObject(val) && isString(val.num)) return;
  fail(`${path}: violates LTCA_NUMERIC_PROFILE_v1`);
}

function validateEnvelope(doc) {
  assert(doc.schema_id === "LTCA_FIXTURE_SCHEMA_v1.0", "schema_id mismatch or missing");
  assert(doc.doc_type === "expected", "doc_type must be 'expected'");

  assert(isObject(doc.runner), "runner block missing");
  assert(isString(doc.runner.runner_id), "runner.runner_id missing");
  assert(isString(doc.runner.runner_version), "runner.runner_version missing");
  assert(isString(doc.runner.ltca_version), "runner.ltca_version missing");

  assert(isObject(doc.case), "case block missing");
  assert(isString(doc.case.scenario_id), "case.scenario_id missing");
  assert(typeof doc.case.phase === "number", "case.phase must be number");

  assert(isObject(doc.determinism), "determinism block missing");
  assert(doc.determinism.canonical_json === "RFC8785_subset", "determinism.canonical_json mismatch");
  assert(doc.determinism.fp_mode === "IEEE754", "determinism.fp_mode mismatch");
  assert(doc.determinism.numeric_profile === "LTCA_NUMERIC_PROFILE_v1", "determinism.numeric_profile mismatch");

  assert(isObject(doc.payload), "payload missing");
}

function validateExpectedPayload(payload) {
  // ---- REB-T Checker
  if (payload.rebt_checker) {
    const r = payload.rebt_checker;
    assert(r.event === "REBT_BOUNDARY_CHECK", "REB-T event mismatch");
    assert(["RP", "REFUSE"].includes(r.verdict), "REB-T verdict must be RP or REFUSE");
    if (r.tolerance_used) checkNumericProfile(r.tolerance_used, "rebt_checker.tolerance_used");
    if (r.witness) {
      assert(isObject(r.witness), "rebt_checker.witness must be object");
      assert(isString(r.witness.type), "rebt_checker.witness.type missing");
    }
  }

  // ---- CAD Curvature
  if (payload.cad_curvature) {
    const c = payload.cad_curvature;
    assert(c.event === "CAD_CURVATURE_CHECK", "CAD event mismatch");
    assert(["RP_INVARIANT", "CURVATURE_BREACH"].includes(c.verdict), "CAD verdict invalid");
    if (c.omega_est_max) checkNumericProfile(c.omega_est_max, "cad_curvature.omega_est_max");
    if (c.threshold) checkNumericProfile(c.threshold, "cad_curvature.threshold");
    if (c.witness) {
      assert(isObject(c.witness), "cad_curvature.witness must be object");
    }
  }

  // ---- iOSp Intervention
  if (payload.iosp_intervention) {
    const io = payload.iosp_intervention;
    assert(io.event === "IOSP_RESULT", "iOSp event mismatch");
    assert(["VERIFIED", "REFUTED"].includes(io.verdict), "iOSp verdict must be VERIFIED or REFUTED");
    if (io.metric) {
      assert(isObject(io.metric), "iosp.metric must be object");
      assert(isString(io.metric.name), "iosp.metric.name missing");
      if (io.metric.value) checkNumericProfile(io.metric.value, "iosp.metric.value");
      if (io.metric.threshold) checkNumericProfile(io.metric.threshold, "iosp.metric.threshold");
    }
    if (io.match) checkNumericProfile(io.match, "iosp.match");
    if (io.computed_from) {
      assert(isObject(io.computed_from), "iosp.computed_from must be object");
    }
  }

  // ---- MLR
  if (payload.mlr_round_1) {
    const m = payload.mlr_round_1;
    assert(m.event === "MLR_RESOLVE", "MLR event mismatch");
    if (m.lssm) checkNumericProfile(m.lssm, "mlr_round_1.lssm");
    if (m.conflicts) {
      assert(Array.isArray(m.conflicts), "mlr.conflicts must be array");
      m.conflicts.forEach((c, i) => {
        assert(isString(c.class), `mlr.conflicts[${i}].class missing`);
        if (c.witness) {
          assert(isObject(c.witness), `mlr.conflicts[${i}].witness must be object`);
          assert(isString(c.witness.type), `mlr.conflicts[${i}].witness.type missing`);
        }
      });
    }
  }

  // ---- MLR Round Final
  if (payload.mlr_round_final) {
    const m = payload.mlr_round_final;
    assert(m.event === "MLR_RESOLVE", "MLR final event mismatch");
    if (m.lssm) checkNumericProfile(m.lssm, "mlr_round_final.lssm");
  }

  // ---- CG Decision
  if (payload.cg_decision) {
    const cg = payload.cg_decision;
    assert(cg.event === "CG_EVALUATE", "CG event mismatch");
    assert(isString(cg.decision), "cg.decision missing");
  }

  // ---- CLP-X Seal
  if (payload.clp_x_seal) {
    const cl = payload.clp_x_seal;
    assert(cl.event === "CLP_X_COMMIT", "CLP-X event mismatch");
    assert(isString(cl.commit_tag), "clp_x.commit_tag missing");
    assert(["SUCCESS", "FAIL"].includes(cl.status), "clp_x.status must be SUCCESS or FAIL");
  }

  // ---- HSC
  if (payload.hsc_mode_switch) {
    const h = payload.hsc_mode_switch;
    assert(h.event === "HSC_WINDOW_DECISION", "HSC event mismatch");
    if (h.lssm) checkNumericProfile(h.lssm, "hsc.lssm");
  }

  // ---- Report
  if (payload.report) {
    const rp = payload.report;
    assert(isString(rp.runner), "report.runner missing");
    assert(isString(rp.case_id), "report.case_id missing");
    assert(["PASS", "FAIL"].includes(rp.verdict), "report.verdict must be PASS or FAIL");
    if (rp.artifacts) {
      assert(isObject(rp.artifacts), "report.artifacts must be object");
    }
  }
}

function main() {
  const path = process.argv[2];
  if (!path) fail("Usage: validate_expected_v1.js <file.json>");

  let raw;
  try {
    raw = fs.readFileSync(path, "utf8");
  } catch (e) {
    fail(`Cannot read file: ${e.message}`);
  }

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    fail(`Invalid JSON: ${e.message}`);
  }

  validateEnvelope(doc);
  validateExpectedPayload(doc.payload);

  console.log("EXPECTED VALID:", path);
  process.exit(0);
}

main();
