# LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0

**Full Verification Scenario (End-to-End) for LTCA/CAS v1.7**

Status: NORMATIVE -- Deterministic -- Forensic-Logged -- Repo-Seal Ready
Date: 2026-02-02

---

## 0) Scope & Goal

This document defines the **entire full verification scenario** as one coherent,
executable-grade specification, covering:

- **Phase 0**: Genesis bootstrap (GRTM + Operator Registry)
- **Phase 1**: Single-Law Reconstruction -- `G-DRIFT_ANOMALY_001`
- **Phase 2**: Multi-Law Stress Test -- `ELECTRO_GRAVITY_SHOCK_001`
- Mandatory enforcement: **REB-T Checker**, **CAD**, **MLR**, **iOSp**, **CG**, **CLP-X**
- System viability: **HSC (Homeostasis Controller)**

**Non-goals:**
- This is not a probabilistic training loop.
- No stochastic search.
- No "trial-and-error" without deterministic ordering + invariant filtering.

---

## 1) Normative Preconditions

### 1.1 Determinism

All steps MUST be deterministic:
- identical inputs -> identical candidates -> identical verdicts -> identical hashes.

### 1.2 Enforcement Order (Hard Constraint)

The following order is mandatory:

```text
SRO/SRT Candidate Generation
  -> REB-T Checker (operator boundary)
  -> CAD (sequence curvature)
  -> MLR (set-level conflicts; if multi-law)
  -> iOSp (intervention validation)
  -> CG (final approval)
  -> CLP-X Repo Seal
```

### 1.3 Execution Freeze Rule

If `CG = LAW-UNCERTAIN` AND `LSSM < threshold`, EP operations MUST be frozen
and scheduled only via HSC.

---

## 2) Global Inputs

### 2.1 Global Configuration

See `tests/fixtures/global_config.json`

### 2.2 Module Availability (Must Exist)

| Module | Version |
|--------|---------|
| TSSP | v1.0 |
| SRT | v1.x |
| SRO | v1.0 |
| REB-T Checker | v1.0 |
| CAD | v1.0 |
| MLR | v1.0 |
| iOSp | v1.x |
| CG | v1.x |
| CLP-X | v1.x |
| HSC | v1.0 |

---

## 3) Phase 0 -- Genesis Bootstrap

### 3.1 Load Genesis Root Token Map (GRTM v1.0)

See `tests/fixtures/genesis_registry.json`

Defines:
- **Terminals**: m, r, G, q, epsilon0 with dimensional vectors and symmetry classes
- **Operators**: OP_ADD, OP_MUL, OP_DIV, OP_POW, SRO_FL, SRO_TA, SRO_OM, SRO_DE
- **Invariants**: DIMENSIONAL_CONSISTENCY, ISOTROPY_PRESERVATION, ASYMPTOTIC_RECOVERY

### 3.2 CLP-X Bootstrap Log

Genesis block initializes the commit chain with registry hash and runner version.

---

## 4) Phase 1 -- Single-Law Reconstruction

**Scenario**: `G-DRIFT_ANOMALY_001`

See `tests/fixtures/phase1_g_drift.json` for full fixture data.
See `tests/expected/phase1_expected.json` for expected outputs.

### 4.1 Initial LawVault State

Active law `L_g_old`:
```
F = G * (m1 * m2) / r^2
```

### 4.2 Observed Drift Event

Zone Z_001: F_obs = 1.05 * F_calc_standard (systematic scale drift).

### 4.3 CG Freeze Trigger

LSI drops to 0.20 -> CG state = LAW_UNCERTAIN.
HSC enters MODE-3 (LSSM = 0.50).

### 4.4 Step A -- TSSP / Structural Parsing

Parse law text + anomaly into AST. Output: PROPOSAL_ONLY status.

### 4.5 Step B -- SRO Candidate Generation

Deterministic order (MINIMALITY_FIRST):

| # | Operator | Candidate | Result | Reason |
|---|----------|-----------|--------|--------|
| C1 | SRO_OM | r exponent mutation | REJECT | Symmetry baseline violated |
| C2 | SRO_TA | Additive constant | REJECT | Dimensional inconsistency |
| C3 | SRO_FL | G -> G_eff(Z_001) | KEEP | All invariants pass |

### 4.6 Step C -- REB-T Checker

For C3 (SRO_FL): verdict = RP, reason = BOUNDARY_PRESERVED.

### 4.7 Step D -- CAD Curvature Monitoring

Rewrite path L_g_old -> L_g_new: omega_est = 1e-12, below threshold 1e-10.
Verdict: RP_INVARIANT.

### 4.8 Step E -- iOSp Intervention Validation

Intervention: do(m3=10kg) at Z_001.
Match: 0.9999. Verdict: VERIFIED.

### 4.9 Step F -- CG Final Decision

All inputs pass -> Decision: PROMOTE_ACTIVE_LAW.

### 4.10 Step G -- CLP-X Repo Seal

Commit tag: RECONSTRUCT_G_001. Status: SUCCESS.

**Phase 1 PASS Criteria:**
- Exactly one candidate promoted
- All logs present
- Deterministic rerun produces identical hashes

---

## 5) Phase 2 -- Multi-Law Stress Test

**Scenario**: `ELECTRO_GRAVITY_SHOCK_001`

See `tests/fixtures/phase2_electro_gravity_shock.json` for full fixture data.
See `tests/expected/phase2_expected.json` for expected outputs.

### 5.1 Shock Injection

Zone Z_007: gravity 1.05x scale + Coulomb 0.90x scale (simultaneous).

### 5.2 Parallel Reconstruction

Two independent candidate sets run through SRO -> REB-T -> CAD -> iOSp:
- PI_L_G_007 (gravity) -> best: G_CAND_3
- PI_L_E_007 (coulomb) -> best: E_CAND_4

### 5.3 MLR Invocation

Strategy: P1_CONSERVATION_FIRST.

Round 1 verdict: REJECT E_CAND_4 (C3_CONSERVATION_BREACH).
Required: RECONSTRUCT_E_WITH_CONSERVATION. LSSM = 0.78.

### 5.4 HSC Reaction

LSSM = 0.78 < 0.80 -> MODE-2.
Budgets: B_RP=0.30, B_EP=0.30, B_INT=0.80.
Caps: max_candidates=24, max_depth=4.

### 5.5 Mandatory Loopback

MLR rejection forces SRO re-generation for Coulomb law:
- Constraints: CONSERVATION_FIRST + ISOTROPY_PRESERVATION
- Allowed: SRO_FL, SRO_TA (dimensioned only)
- Forbidden: SRO_OM (isotropy breaking without evidence)

Loop continues until MLR ACCEPT_SET or budget exhaustion -> HALT.

### 5.6 Finalization

MLR Round 2: ACCEPT_SET (LSSM = 0.92).
CG: Atomic promotion of entire law set.
CLP-X: Set-level commit MULTI_LAW_EG_SHOCK_001.

**Phase 2 PASS Criteria:**
- No law promoted if set-level invariants fail
- Set-level commit is atomic (no partial promotion)
- Deterministic rerun yields identical commit hashes

---

## 6) Official PASS/FAIL Report Schema

```json
{
  "runner": "LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0",
  "case_id": "<scenario_id>",
  "verdict": "PASS | FAIL",
  "artifacts": {
    "registry_hash": "sha256:...",
    "proposal_set_hash": "sha256:...",
    "rebt_log_hash": "sha256:...",
    "cad_log_hash": "sha256:...",
    "iosp_log_hash": "sha256:...",
    "cg_decision_hash": "sha256:...",
    "clp_x_commit_hash": "sha256:..."
  },
  "determinism": {
    "rerun_hash_equal": true
  }
}
```

---

## 7) Canonical Statement

The full LTCA verification scenario is an enforcement-first deterministic pipeline:

```
Genesis -> SRO -> REB-T Checker -> CAD -> (MLR if multi-law) -> iOSp -> CG -> CLP-X
```

with HSC controlling compute to preserve system-level viability under low LSSM.

---

*End of LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0*
