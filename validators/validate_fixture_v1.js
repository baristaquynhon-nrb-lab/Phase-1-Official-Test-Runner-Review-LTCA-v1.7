#!/usr/bin/env node
"use strict";

/*
 LTCA_FIXTURE_SCHEMA_v1.0 — Fixture Validator
 Scope: tests/fixtures/*.json
 Deterministic, fail-fast
*/

const fs = require("fs");

function fail(msg) {
  console.error("FIXTURE INVALID:", msg);
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

function checkAST(node, path) {
  assert(isObject(node), `${path}: AST node must be object`);
  assert(isString(node.op), `${path}.op missing or not string`);
  assert(Array.isArray(node.args), `${path}.args must be array`);
  if (node.meta) {
    assert(isObject(node.meta), `${path}.meta must be object`);
    if (node.meta.dim) assert(Array.isArray(node.meta.dim), `${path}.meta.dim must be vector`);
  }
  node.args.forEach((a, i) => {
    if (isObject(a) && a.op) checkAST(a, `${path}.args[${i}]`);
    // sym, lit, zone references are leaf nodes — allowed as objects without op
  });
}

function validateEnvelope(doc) {
  assert(doc.schema_id === "LTCA_FIXTURE_SCHEMA_v1.0", "schema_id mismatch or missing");
  assert(doc.doc_type === "fixture", "doc_type must be 'fixture'");

  assert(isObject(doc.runner), "runner block missing");
  assert(isString(doc.runner.runner_id), "runner.runner_id missing");
  assert(isString(doc.runner.runner_version), "runner.runner_version missing");
  assert(isString(doc.runner.ltca_version), "runner.ltca_version missing");

  assert(isObject(doc.case), "case block missing");
  assert(isString(doc.case.scenario_id), "case.scenario_id missing");
  assert(typeof doc.case.phase === "number", "case.phase must be number");
  assert(isString(doc.case.description), "case.description missing");

  assert(isObject(doc.determinism), "determinism block missing");
  assert(doc.determinism.canonical_json === "RFC8785_subset", "determinism.canonical_json mismatch");
  assert(doc.determinism.fp_mode === "IEEE754", "determinism.fp_mode mismatch");
  assert(doc.determinism.numeric_profile === "LTCA_NUMERIC_PROFILE_v1", "determinism.numeric_profile mismatch");

  assert(isObject(doc.payload), "payload missing");
}

function validateFixturePayload(payload) {
  // ---- Genesis Registry (optional but validated if present)
  if (payload.grtm) {
    const g = payload.grtm;
    assert(isObject(g.terminals), "GRTM terminals missing");
    Object.entries(g.terminals).forEach(([name, t]) => {
      assert(Array.isArray(t.dim), `terminal '${name}' dim must be array`);
      assert(t.dim.length === 7, `terminal '${name}' dim must have 7 elements`);
      assert(isString(t.symmetry), `terminal '${name}' symmetry missing`);
    });
    if (g.operators) {
      assert(isObject(g.operators), "GRTM operators must be object");
    }
    if (g.invariants) {
      assert(Array.isArray(g.invariants), "GRTM invariants must be array");
    }
  }

  // ---- Laws (initial_law_vault)
  if (payload.initial_law_vault) {
    const law = payload.initial_law_vault;
    assert(isString(law.law_id), "law_id missing");
    assert(law.ast, "law.ast required (typed AST)");
    checkAST(law.ast, "initial_law_vault.ast");
  }

  // ---- Drift
  if (payload.observed_drift) {
    const d = payload.observed_drift;
    assert(isString(d.event_id), "drift.event_id missing");
    assert(isString(d.zone), "drift.zone missing");
    assert(isObject(d.deltaS), "drift.deltaS missing");
    assert(isString(d.deltaS.type), "drift.deltaS.type missing");
    if (d.measurement_model) {
      assert(isObject(d.measurement_model), "measurement_model must be object");
      assert(isString(d.measurement_model.type), "measurement_model.type missing");
    }
    if (d.residual_metric) {
      assert(isObject(d.residual_metric), "residual_metric must be object");
    }
  }

  // ---- SRO Candidates
  if (payload.step_b_sro_candidates) {
    const s = payload.step_b_sro_candidates;
    assert(isString(s.proposal_set_id), "proposal_set_id missing");
    assert(isString(s.ordering), "ordering missing");
    assert(Array.isArray(s.deterministic_order), "deterministic_order must be array");
    assert(Array.isArray(s.candidates), "candidates must be array");
    s.candidates.forEach((c, i) => {
      assert(isString(c.id), `candidate[${i}].id missing`);
      assert(isString(c.rewrite), `candidate[${i}].rewrite missing`);
      assert(c.law_new && isObject(c.law_new), `candidate[${i}].law_new missing`);
      assert(c.law_new.ast, `candidate[${i}].law_new.ast required (typed AST)`);
      checkAST(c.law_new.ast, `candidate[${i}].law_new.ast`);
      if (c.minimality_cost) checkNumericProfile(c.minimality_cost, `candidate[${i}].minimality_cost`);
      if (c.derivation) {
        assert(isObject(c.derivation), `candidate[${i}].derivation must be object`);
        assert(isString(c.derivation.rule_id), `candidate[${i}].derivation.rule_id missing`);
      }
      if (c.rebt_prechecks) {
        assert(isObject(c.rebt_prechecks), `candidate[${i}].rebt_prechecks must be object`);
      }
    });
  }

  // ---- REB-T
  if (payload.step_c_rebt_checker) {
    const r = payload.step_c_rebt_checker;
    assert(isString(r.operator_id), "rebt.operator_id missing");
    assert(isString(r.target_candidate), "rebt.target_candidate missing");
    if (r.tolerance) checkNumericProfile(r.tolerance, "rebt.tolerance");
  }

  // ---- CAD
  if (payload.step_d_cad_curvature) {
    const c = payload.step_d_cad_curvature;
    assert(isString(c.trace_id), "cad.trace_id missing");
  }

  // ---- iOSp
  if (payload.step_e_iosp_intervention) {
    const io = payload.step_e_iosp_intervention;
    if (io.intervention) {
      assert(isObject(io.intervention), "iosp.intervention must be object");
      assert(isString(io.intervention.intervention_id), "iosp.intervention.intervention_id missing");
      assert(Array.isArray(io.intervention.do), "iosp.intervention.do must be array");
      assert(isString(io.intervention.zone), "iosp.intervention.zone missing");
    }
  }

  // ---- HSC
  if (payload.hsc_initial_mode || payload.hsc_reaction) {
    const h = payload.hsc_initial_mode || payload.hsc_reaction;
    assert(h.event === "HSC_WINDOW_DECISION", "HSC event mismatch");
    assert(isString(h.mode), "HSC mode missing");
    if (h.lssm) checkNumericProfile(h.lssm, "hsc.lssm");
  }

  // ---- Numeric profile sweep: check all tolerance/threshold/omega/scale/epsilon/lssm fields
  // Only check leaf values (numbers, strings, {lit:...} objects), skip container objects/arrays
  JSON.stringify(payload, (k, v) => {
    const lk = k.toLowerCase();
    if (lk.includes("epsilon") ||
        lk.includes("threshold") ||
        lk.includes("omega") ||
        lk.includes("tolerance") ||
        lk === "scale" ||
        lk === "lssm" ||
        lk === "minimality_cost") {
      if (v !== null && v !== undefined && !Array.isArray(v)) {
        // Skip container objects (those without lit/num keys) — they hold sub-fields
        if (isObject(v) && !isString(v.lit) && !isString(v.num)) return v;
        checkNumericProfile(v, k);
      }
    }
    return v;
  });
}

function main() {
  const path = process.argv[2];
  if (!path) fail("Usage: validate_fixture_v1.js <file.json>");

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
  validateFixturePayload(doc.payload);

  console.log("FIXTURE VALID:", path);
  process.exit(0);
}

main();
