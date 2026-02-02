# Phase-1-Official-Test-Runner-Review-LTCA-v1.7

**LTCA Official Test Runner -- Full Verification Scenario v1.0**

Status: NORMATIVE | LTCA/CAS v1.7 | Deterministic | Forensic-Logged | Repo-Seal Ready

---

## Overview

This repository contains the official test runner specification and fixtures for the
**Law Theory Consistency Architecture (LTCA)** verification pipeline. It implements
a deterministic, enforcement-first pipeline that validates physics law reconstruction
when fundamental constants exhibit drift anomalies.

**Core Pipeline:**
```
Genesis -> SRO -> REB-T Checker -> CAD -> (MLR if multi-law) -> iOSp -> CG -> CLP-X
```

with **HSC** (Homeostasis Controller) governing compute budgets throughout.

---

## Verification Scenarios

| Phase | Scenario ID | Description |
|-------|-------------|-------------|
| 0 | Genesis Bootstrap | Load GRTM v1.0 + Operator Registry |
| 1 | `G-DRIFT_ANOMALY_001` | Single-law reconstruction: Newton gravity with drifting G in zone Z_001 |
| 2 | `ELECTRO_GRAVITY_SHOCK_001` | Multi-law stress test: simultaneous gravity + Coulomb drift in zone Z_007 |

---

## Repository Structure

```
.
├── README.md
├── RUNBOOK.md                          # Step-by-step execution guide
├── spec/
│   └── LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0.md   # Normative specification
├── tests/
│   ├── fixtures/
│   │   ├── global_config.json                  # Runner config, thresholds, determinism settings
│   │   ├── genesis_registry.json               # GRTM v1.0 + operator registry
│   │   ├── phase1_g_drift.json                 # Phase 1 scenario: full input + step definitions
│   │   └── phase2_electro_gravity_shock.json   # Phase 2 scenario: multi-law stress test
│   └── expected/
│       ├── phase1_expected.json                # Expected outputs for Phase 1
│       └── phase2_expected.json                # Expected outputs for Phase 2
└── .github/
    └── workflows/
        └── ltca_test_runner.yml                # CI/CD workflow (workflow_dispatch)
```

---

## Quick Start

### Run via GitHub Actions

1. Navigate to **Actions** tab in this repository
2. Select **LTCA_G_Drift_Test** workflow
3. Click **Run workflow**
4. Choose scenario: `all`, `phase1_g_drift`, or `phase2_electro_gravity`

### Manual Verification

Follow the step-by-step instructions in [RUNBOOK.md](RUNBOOK.md).

---

## Key Modules

| Module | Role |
|--------|------|
| **TSSP** | Text/Structure Semantic Parser -- converts law text to AST |
| **SRO** | Structural Rewrite Operators -- generates candidate law rewrites |
| **REB-T Checker** | Validates operator boundary preservation |
| **CAD** | Monitors sequence curvature to detect drift in rewrite paths |
| **MLR** | Multi-Law Resolver -- checks set-level constitutional consistency |
| **iOSp** | Interventional Observation Space -- causal grounding via do-operator |
| **CG** | Coherence Gate -- final approval authority |
| **CLP-X** | Commit Log Protocol -- forensic-grade repo sealing |
| **HSC** | Homeostasis Controller -- manages compute budgets under low LSSM |

---

## Determinism Guarantee

All pipeline runs are strictly deterministic:
- No randomness at any step
- IEEE 754 floating-point arithmetic
- Canonical JSON serialization (RFC 8785 subset)
- Identical inputs produce identical hashes across runs

---

## Normative Reference

Full specification: [spec/LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0.md](spec/LTCA_OFFICIAL_TEST_RUNNER_FULL_SCENARIO_v1_0.md)
