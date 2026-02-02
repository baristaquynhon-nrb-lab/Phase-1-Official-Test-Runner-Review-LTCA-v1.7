# LTCA_FIXTURE_SCHEMA_v1.0

**Status**: NORMATIVE -- Deterministic -- Hash-Stable
**Applies to**: `tests/fixtures/*`, `tests/expected/*`, runner `LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0`
**Date**: 2026-02-02
**Compatibility**: LTCA/CAS v1.7, canonical JSON = RFC8785_subset, IEEE754 constraints

---

## Section 0 -- Core Goals

- **Schema-stable**: same fixture always parses to same internal model.
- **Hash-stable**: canonicalization produces same hash across reruns.
- **Executable-grade**: no ambiguous "math strings" for verification steps.
- **Witness-required**: all claims at MLR/REB-T/CAD/iOSp must carry minimum witness.

---

## Section 1 -- Global Envelope

Required for every fixture and expected output file.

### 1.1 Required Top-Level Fields

```json
{
  "schema_id": "LTCA_FIXTURE_SCHEMA_v1.0",
  "doc_type": "fixture | expected",
  "runner": {
    "runner_id": "LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0",
    "runner_version": "1.0",
    "ltca_version": "1.7"
  },
  "case": {
    "scenario_id": "STRING",
    "phase": 0,
    "description": "STRING"
  },
  "determinism": {
    "canonical_json": "RFC8785_subset",
    "fp_mode": "IEEE754",
    "numeric_profile": "LTCA_NUMERIC_PROFILE_v1"
  },
  "payload": {}
}
```

### 1.2 Deterministic Canonicalization Contract

- **Objects**: keys MUST be unique; canonicalized by lexicographic key order (UTF-8 codepoint).
- **Arrays**: order is semantically meaningful; MUST NOT be reordered by validators.
- **Numbers**: MUST use LTCA_NUMERIC_PROFILE_v1 (Section 2).
- **No NaN/Inf** permitted.

---

## Section 2 -- LTCA_NUMERIC_PROFILE_v1

### 2.1 Numeric Encoding Rules

| Rule | Description |
|------|-------------|
| R1 | All non-integer literals MUST be encoded as strings (decimal) to prevent JSON float drift. |
| R2 | Integers MAY be JSON numbers if `abs(value) <= 2^53-1`; else MUST be string. |
| R3 | Scientific notation MUST be string form (e.g., `"1e-12"`). |
| R4 | Any tolerance/threshold fields MUST be strings, never binary floats. |

### 2.2 Numeric Object Form (Recommended)

```json
{ "num": "1e-12" }
```

Or minimum:

```json
"tolerance_used": "1e-12"
```

---

## Section 3 -- Symbol & Token Model (GRTM Interop)

### 3.1 Symbol Reference

```json
{ "sym": "G" }
```

### 3.2 Literal

```json
{ "lit": "2" }
{ "lit": "1.05" }
```

### 3.3 Zone / Region Identifier

```json
{ "zone": "Z_001" }
```

Zone id is a string, not a physics variable.

---

## Section 4 -- Typed AST Schema

Required in place of array-form or math-string ASTs.

### 4.1 AST Node

```json
{
  "op": "OP_* | SRO_* | DEF | APPLY",
  "args": [ "AST_NODE | SYMBOL | LITERAL | ZONE" ],
  "meta": {
    "dim": [0,0,0,0,0,0,0],
    "symmetry": "Scalar | Vector | Vector_Norm | Liftable_Constant | ...",
    "source": "GRTM"
  }
}
```

### 4.2 Operator Namespace Rules

- All algebraic operators MUST be `OP_*` (OP_ADD, OP_MUL, OP_DIV, OP_POW, OP_EQ, ...).
- All rewrite operators MUST be `SRO_*` (SRO_FL, SRO_TA, SRO_OM, SRO_DE).
- Equality MUST be `OP_EQ` (not `"EQ"`).

### 4.3 Law Expression Dual Form (Text + AST)

Law MAY have `expression` (string) for readability, but MUST have `ast` (typed) for execution.

```json
{
  "law_id": "L_g_old",
  "expression": "F = G * (m1*m2) / r^2",
  "ast": { "...typed ast..." }
}
```

---

## Section 5 -- Measurement & Drift Model

### 5.1 Drift Event Minimum

```json
{
  "event_id": "OBS_*",
  "zone": "Z_*",
  "deltaS": {
    "type": "SYSTEMATIC_SCALE | ADDITIVE_BIAS | NONLINEAR_RESIDUAL | STRUCTURAL_MISMATCH",
    "params": {}
  },
  "measurement_model": {
    "type": "SCALE_RELATIVE_TO_BASELINE",
    "baseline": "F_calc_standard",
    "scale": { "lit": "1.05" }
  }
}
```

### 5.2 iOSp-Ready Residual Definition

```json
{
  "residual_metric": {
    "metric": "RELATIVE_ERROR | MAE | MSE | LOG_LIKELIHOOD_FORBIDDEN",
    "epsilon": { "lit": "1e-12" }
  }
}
```

NORMATIVE: iOSp MUST NOT accept `"match=0.9999"` without metric and `computed_from`.

---

## Section 6 -- SRO Candidate Set Schema

### 6.1 Proposal Set

```json
{
  "proposal_set_id": "PI_*",
  "ordering": "MINIMALITY_FIRST",
  "deterministic_order": ["SRO_OM","SRO_TA","SRO_FL","SRO_DE"],
  "candidates": [
    {
      "id": "C1",
      "rewrite": "SRO_OM",
      "minimality_cost": { "lit": "1.20" },
      "law_new": {
        "expression": "OPTIONAL",
        "ast": { "...typed ast..." }
      },
      "derivation": {
        "rule_id": "SRO_OM_POWER_MUTATION_v1",
        "inputs": {},
        "justification": "OPTIONAL"
      },
      "rebt_prechecks": {
        "dimensional_consistency": "PASS|FAIL|UNKNOWN",
        "symmetry_baseline": "PASS|FAIL|UNKNOWN",
        "asymptotic_recovery": "PASS|FAIL|UNKNOWN"
      }
    }
  ]
}
```

### 6.2 Candidate Verdict Object

```json
{
  "candidate_id": "C3",
  "status": "KEEP | REJECT",
  "reason": "ENUM_STRING",
  "witness_refs": ["W_*"]
}
```

---

## Section 7 -- REB-T Checker Output Schema

```json
{
  "event": "REBT_BOUNDARY_CHECK",
  "operator_id": "SRO_FL",
  "candidate": "C3",
  "verdict": "RP | REFUSE",
  "reason": "BOUNDARY_PRESERVED | DIM_FAIL | SYM_FAIL | ASYMPTOTIC_FAIL",
  "tolerance_used": { "lit": "1e-12" },
  "witness": {
    "type": "INVARIANT_PROOF_STUB",
    "invariants": ["DIMENSIONAL_CONSISTENCY","ISOTROPY_PRESERVATION","ASYMPTOTIC_RECOVERY"],
    "details_ref": "W_REBT_*"
  }
}
```

---

## Section 8 -- CAD Curvature Output Schema

```json
{
  "event": "CAD_CURVATURE_CHECK",
  "trace_id": "CAD_*",
  "verdict": "RP_INVARIANT | CURVATURE_BREACH",
  "omega_est_max": { "lit": "1e-12" },
  "threshold": { "lit": "1e-10" },
  "within_bounds": true,
  "witness": {
    "type": "CURVATURE_ESTIMATE",
    "path": ["L_old","SRO_FL","L_new"],
    "omega_series_ref": "W_CAD_*"
  }
}
```

---

## Section 9 -- iOSp Intervention Output Schema

### 9.1 Intervention Spec

```json
{
  "intervention_id": "INT_*",
  "do": [{ "var": "m3", "set": { "lit": "10" }, "unit": "kg" }],
  "zone": "Z_001",
  "observables": ["F"]
}
```

### 9.2 iOSp Result

```json
{
  "event": "IOSP_RESULT",
  "proposal_id": "C3",
  "intervention_id": "INT_*",
  "metric": {
    "name": "RELATIVE_ERROR",
    "value": { "lit": "1e-4" },
    "threshold": { "lit": "1e-3" }
  },
  "match": { "lit": "0.9999" },
  "verdict": "VERIFIED | REFUTED",
  "computed_from": {
    "measured_ref": "W_IOSP_MEAS_*",
    "predicted_ref": "W_IOSP_PRED_*"
  }
}
```

NORMATIVE: `match` MAY exist as human-friendly scalar, but `verdict` MUST be based on `metric`.

---

## Section 10 -- MLR Schema

```json
{
  "event": "MLR_RESOLVE",
  "case_id": "MLR_*",
  "zone": "Z_*",
  "strategy": "P1_CONSERVATION_FIRST",
  "law_set_proposals": ["G_CAND_3","E_CAND_4"],
  "conflicts": [
    {
      "class": "C1_DIMENSION | C2_SYMMETRY | C3_CONSERVATION_BREACH | C4_GAUGE_MISMATCH | C5_INTERVENTION_CONTRADICTION",
      "law": "E_CAND_4",
      "detail": "STRING",
      "witness": {
        "type": "CLOSED_LOOP_WORK_NONZERO | POTENTIAL_DISCONTINUITY | CROSS_LAW_CONTRADICTION",
        "quantity": "W_loop",
        "sign": "!=0",
        "boundary": "Z_007",
        "evidence_ref": "W_MLR_*"
      }
    }
  ],
  "resolution": {
    "action": "ACCEPT_SET | REJECT | REPAIR_REQUIRED",
    "rejected": ["E_CAND_4"],
    "required": "RECONSTRUCT_E_WITH_CONSERVATION"
  },
  "lssm": { "lit": "0.78" }
}
```

---

## Section 11 -- HSC Schema

```json
{
  "event": "HSC_WINDOW_DECISION",
  "mode": "MODE-0 | MODE-1 | MODE-2 | MODE-3",
  "lssm": { "lit": "0.78" },
  "budgets": {
    "B_RP": { "lit": "0.30" },
    "B_EP": { "lit": "0.30" },
    "B_INT": { "lit": "0.80" }
  },
  "caps": {
    "max_candidates": 24,
    "max_depth": 4,
    "max_iterations": 4
  },
  "freeze_policy": {
    "condition": "CG == LAW_UNCERTAIN AND LSSM < threshold",
    "action": "FREEZE_EP_OPERATIONS"
  }
}
```

---

## Section 12 -- CG & CLP-X Schemas

### 12.1 CG Evaluate

```json
{
  "event": "CG_EVALUATE",
  "decision": "PROMOTE_ACTIVE_LAW | PROMOTE_LAW_SET | REFUSE | HALT",
  "atomic": true,
  "inputs": ["REB-T:PASS","CAD:PASS","IOSP:VERIFIED","MLR:ACCEPT_SET"],
  "promoted": ["C3"],
  "rejected": ["C1","C2"]
}
```

### 12.2 CLP-X Commit (Repo Seal)

```json
{
  "event": "CLP_X_COMMIT",
  "commit_tag": "STRING",
  "status": "SUCCESS | FAIL",
  "payload_hashes": {
    "registry_hash": "sha256:__COMPUTED_AT_RUNTIME__",
    "proposal_set_hash": "sha256:__COMPUTED_AT_RUNTIME__",
    "mlr_log_hash": "sha256:__COMPUTED_AT_RUNTIME__",
    "cg_decision_hash": "sha256:__COMPUTED_AT_RUNTIME__"
  }
}
```

NORMATIVE: CLP-X MUST commit append-only chain; payload hashes MUST reference canonical JSON, not raw JSON.

---

## Section 13 -- PASS/FAIL Report Schema

```json
{
  "runner": "LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0",
  "case_id": "STRING",
  "verdict": "PASS | FAIL",
  "artifacts": {
    "registry_hash": "sha256:*",
    "proposal_set_hash": "sha256:*",
    "rebt_log_hash": "sha256:*",
    "cad_log_hash": "sha256:*",
    "iosp_log_hash": "sha256:*",
    "mlr_log_hash": "sha256:*",
    "cg_decision_hash": "sha256:*",
    "clp_x_commit_hash": "sha256:*"
  },
  "determinism": {
    "rerun_hash_equal": true
  }
}
```

---

*End of LTCA_FIXTURE_SCHEMA_v1.0*
