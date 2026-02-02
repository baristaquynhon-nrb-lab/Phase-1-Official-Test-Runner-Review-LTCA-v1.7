# LTCA Official Test Runner — RUNBOOK v1.0

**Status**: NORMATIVE
**LTCA/CAS Version**: 1.7
**Date**: 2026-02-02

---

## 1. Overview

This runbook describes the step-by-step execution procedure for the LTCA Official
Test Runner. It covers two verification scenarios:

| Phase | Scenario ID | Description |
|-------|-------------|-------------|
| 1 | `G-DRIFT_ANOMALY_001` | Single-law reconstruction (Newton gravity, G drift) |
| 2 | `ELECTRO_GRAVITY_SHOCK_001` | Multi-law stress test (gravity + Coulomb simultaneous drift) |

Both phases share a common **Genesis Bootstrap** (Phase 0) and enforce the same
deterministic pipeline order.

---

## 2. Prerequisites

### 2.1 Required Modules

All modules listed in `tests/fixtures/global_config.json` → `module_requirements`
must be available before execution begins:

- TSSP v1.0 — Text/Structure Semantic Parser
- SRT v1.x — Symbolic Representation Transformer
- SRO v1.0 — Structural Rewrite Operators
- REB-T Checker v1.0 — Operator Boundary Checker
- CAD v1.0 — Curvature/Anomaly Detector
- MLR v1.0 — Multi-Law Resolver
- iOSp v1.x — Interventional Observation Space
- CG v1.x — Coherence Gate
- CLP-X v1.x — Commit Log Protocol (eXtended)
- HSC v1.0 — Homeostasis Controller

### 2.2 Determinism Requirements

- No randomness in any step
- IEEE 754 floating-point mode
- Canonical JSON serialization (RFC 8785 subset)
- Identical inputs MUST produce identical outputs across runs

---

## 3. Execution Steps

### Phase 0 — Genesis Bootstrap

```text
Step 0.1  Load GRTM (Genesis Root Token Map)
          Input:  tests/fixtures/genesis_registry.json
          Action: Parse terminal definitions, operator registry, invariants
          Output: REGISTRY_LOADED event with registry_hash

Step 0.2  Initialize CLP-X Chain
          Action: Create genesis block for the commit log
          Output: CLP_X_GENESIS event with hash_head
```

### Phase 1 — Single-Law Reconstruction (`G-DRIFT_ANOMALY_001`)

```text
Step 1.1  Load Scenario
          Input:  tests/fixtures/phase1_g_drift.json
          Action: Ingest initial law vault, observed drift, CG freeze trigger

Step 1.2  TSSP Parse (Step A)
          Input:  Law text + anomaly observation
          Action: Parse into AST; mark epistemic_status = PROPOSAL_ONLY
          Gate:   Output must have status=OK, ase=[]

Step 1.3  SRO Candidate Generation (Step B)
          Order:  SRO_OM → SRO_TA → SRO_FL → SRO_DE (MINIMALITY_FIRST)
          Action: Generate candidates deterministically
          Gate:   Each candidate checked against invariants
          Output: Proposal set PI_L_G_001 with kept/rejected lists

Step 1.4  REB-T Checker (Step C)
          Input:  Each KEEP candidate
          Action: Validate operator boundary preservation
          Gate:   verdict == RP, tolerance <= 1e-12
          Fail:   REFUSE + quarantine candidate

Step 1.5  CAD Curvature (Step D)
          Input:  Rewrite path L_g_old → L_g_new
          Action: Compute omega estimate
          Gate:   omega_est < cad_omega threshold (1e-10)
          Output: RP_INVARIANT verdict

Step 1.6  iOSp Intervention (Step E)
          Input:  do(m3=10kg) at Z_001
          Action: Execute causal intervention, compare measured vs predicted
          Gate:   match >= 0.999
          Output: VERIFIED verdict

Step 1.7  CG Final Decision (Step F)
          Input:  REB-T, CAD, iOSp results
          Action: Evaluate evidence chain
          Gate:   All inputs PASS/VERIFIED
          Output: PROMOTE_ACTIVE_LAW

Step 1.8  CLP-X Repo Seal (Step G)
          Action: Commit new law hash + full trace
          Output: CLP_X_COMMIT with RECONSTRUCT_G_001 tag
```

**Phase 1 PASS Criteria:**
- Exactly one candidate promoted
- All log events present and complete
- Deterministic rerun produces identical hashes

### Phase 2 — Multi-Law Stress Test (`ELECTRO_GRAVITY_SHOCK_001`)

```text
Step 2.1  Shock Injection
          Input:  tests/fixtures/phase2_electro_gravity_shock.json
          Action: Inject simultaneous gravity (1.05x) + Coulomb (0.90x) drift at Z_007

Step 2.2  Parallel Reconstruction
          Action: Run independent SRO → REB-T → CAD → iOSp for each law
          Output: Two proposal sets (PI_L_G_007, PI_L_E_007)

Step 2.3  MLR Invocation (Round 1)
          Input:  Both proposal sets
          Strategy: P1_CONSERVATION_FIRST
          Checks: Dimensional compatibility, conservation constraints,
                  symmetry consistency, cross-law intervention contradictions
          Output: Verdict (may REJECT one or more proposals)

Step 2.4  HSC Mode Assessment
          Action: Evaluate LSSM after MLR verdict
          Gate:   LSSM < 0.80 → MODE-2 with adjusted budgets/caps

Step 2.5  Mandatory Loopback (if MLR REJECT)
          Trigger: MLR rejection forces SRO re-generation
          Constraints: CONSERVATION_FIRST + ISOTROPY_PRESERVATION
          Loop:   Until MLR ACCEPT_SET or budget exhaustion → HALT

Step 2.6  MLR Final Accept
          Gate:   LSSM recovered (target >= 0.90)
          Output: ACCEPT_SET

Step 2.7  CG Atomic Promote
          Action: Promote entire law set atomically (no partial promotion)

Step 2.8  CLP-X Set-Level Seal
          Action: Commit set-level hash
          Output: MULTI_LAW_EG_SHOCK_001 tag
```

**Phase 2 PASS Criteria:**
- No law promoted if set-level invariants fail
- Set-level commit is atomic
- Deterministic rerun produces identical hashes

---

## 4. LSSM / HSC Mode Reference

| LSSM Range | HSC Mode | EP Status | Budget Profile |
|------------|----------|-----------|----------------|
| >= 0.80 | MODE-1 (Normal) | Open | Full |
| 0.60–0.79 | MODE-2 (Caution) | Restricted | B_RP=0.30, B_EP=0.30, B_INT=0.80 |
| 0.40–0.59 | MODE-3 (Emergency) | Frozen | B_RP=0.15, B_EP=0.10, B_INT=1.00 |
| < 0.40 | HALT | All Frozen | System halt, manual intervention |

---

## 5. Failure Modes & Recovery

| Failure | Detection Point | Action |
|---------|----------------|--------|
| REB-T boundary violation | Step C / 1.4 | REFUSE candidate, quarantine, try next |
| CAD curvature exceeded | Step D / 1.5 | REFUSE candidate, escalate to HSC |
| iOSp mismatch | Step E / 1.6 | Mark UNVERIFIED, do not promote |
| MLR conservation breach | Step 2.3 | REJECT law, force loopback |
| Budget exhaustion | HSC check | HALT, emit forensic log, manual review |
| CG deadlock | Step F / 1.7 | Freeze EP, wait for new evidence |

---

## 6. Verification Outputs

After each run, the runner emits a report conforming to:

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

Compare against expected outputs in `tests/expected/`.

---

## 7. CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ltca_test_runner.yml`) automates
the full pipeline. Trigger manually via `workflow_dispatch`.

---

*End of RUNBOOK v1.0*
