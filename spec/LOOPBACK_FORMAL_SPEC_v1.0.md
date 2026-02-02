# LOOPBACK_FORMAL_SPEC_v1.0

**Loopback as Constrained Hypothesis Revision under Constitutional Law Set Control**

Status: NORMATIVE | LTCA/CAS v1.7 | Deterministic | Invariant-Governed
Date: 2026-02-02
Depends: LTCA_FIXTURE_SCHEMA_v1.0, LTCA_NUMERIC_PROFILE_v1

---

## 1. Abstract

Loopback is a deterministic, invariant-governed mechanism for hypothesis revision
within a law-tracking runtime. It operates when a candidate law (or law set) fails
constitutional invariants at the set level. The mechanism enforces constrained
reconstruction under budgeted search, preserving boundary, geometric, and cross-law
consistency before promotion.

---

## 2. Problem Setting

Given a current active law set:

```
L_active = {L_1, L_2, ..., L_n}
```

and an observed anomaly producing proposal set:

```
Pi = {pi_1, pi_2, ..., pi_k}
```

the system must determine whether a subset:

```
Pi* <= Pi
```

can replace affected laws without violating constitutional constraints.

A conflict arises when:

```
exists C in C_set : C(Pi*) = false
```

where `C_set` denotes set-level invariants (conservation, symmetry compatibility,
cross-field consistency).

---

## 3. Loopback Trigger Condition

Loopback is activated iff:

```
MLR(Pi*) = REJECT  AND  LSSM in [tau_halt, tau_mode2)
```

where:
- `MLR` = Multi-Law Resolution module
- `LSSM` = Law-Set Stability Metric
- `tau_mode2`, `tau_halt` = constitutional thresholds (from HSC)

This ensures revision occurs **before** epistemic collapse.

### 3.1 Trigger Predicate (Executable Form)

```json
{
  "trigger_predicate": {
    "mlr_verdict": "REJECT",
    "lssm_range": {
      "lower_bound": { "lit": "0.40" },
      "upper_bound": { "lit": "0.80" },
      "lower_bound_semantic": "tau_halt",
      "upper_bound_semantic": "tau_mode2"
    }
  }
}
```

---

## 4. Formal Model

Loopback defines a constrained search operator:

```
Loopback : (L_active, Pi, Gamma_constraints) -> Pi_revised
```

subject to:

```
Gamma_constraints = {
  Gamma_dimensional,
  Gamma_symmetry,
  Gamma_conservation,
  Gamma_intervention_consistency
}
```

Search space is restricted by:

```
Omega_allowed < Omega_SRO
```

where `Omega_SRO` is the full rewrite operator space and `Omega_allowed` excludes
operators known to violate prior invariants.

### 4.1 Constraint Set (Executable Form)

```json
{
  "gamma_constraints": {
    "gamma_dimensional": "DIMENSIONAL_CONSISTENCY",
    "gamma_symmetry": "ISOTROPY_PRESERVATION",
    "gamma_conservation": "CONSERVATION_FIRST",
    "gamma_intervention": "INTERVENTION_CONSISTENCY"
  },
  "omega_allowed": ["SRO_FL", "SRO_TA_DIMENSIONED_ONLY"],
  "omega_forbidden": ["SRO_OM_ISOTROPY_BREAKING"],
  "omega_sro_full": ["SRO_FL", "SRO_TA", "SRO_OM", "SRO_DE"]
}
```

---

## 5. Hypothesis Revision as Constrained Optimization

Each candidate `pi` has a minimality cost:

```
cost(pi) = lambda_1 * Delta_structure
          + lambda_2 * Delta_parameter
          + lambda_3 * Delta_operator_class
```

Loopback seeks:

```
pi* = argmin_{pi in feasible(Gamma_constraints)} cost(pi)
```

Feasibility requires ALL gates pass:

```
REB-T(pi) = PASS
CAD(pi) = RP_INVARIANT
iOSp(pi) = VERIFIED
MLR_set(pi, L_active) = ACCEPT
```

### 5.1 Cost Function (Executable Form)

```json
{
  "cost_function": {
    "components": [
      { "name": "delta_structure",      "weight": { "lit": "0.50" } },
      { "name": "delta_parameter",      "weight": { "lit": "0.30" } },
      { "name": "delta_operator_class", "weight": { "lit": "0.20" } }
    ],
    "optimization": "MINIMIZE",
    "ordering": "MINIMALITY_FIRST"
  }
}
```

### 5.2 Feasibility Gate Chain

```
candidate -> REB-T -> CAD -> iOSp -> MLR_set -> {ACCEPT | REJECT}
```

A candidate is feasible iff it passes ALL four gates. No partial pass is accepted.

---

## 6. Constitutional Law Set Control

Define constitutional set:

```
C_set = {C_1, C_2, ..., C_m}
```

Each `C_i` is a predicate over the law set state:

```
C_i : L_state -> {true, false}
```

Promotion is atomic:

```
ACCEPT_SET <=> forall C_i in C_set : C_i(L_new) = true
```

Loopback ensures revision is **constitutionally admissible**, not merely locally valid.

### 6.1 Constitutional Predicate Classes

| ID | Predicate | Scope |
|----|-----------|-------|
| C1 | Dimensional compatibility across set | Per-law + cross-law |
| C2 | Symmetry consistency (colocated fields) | Cross-law |
| C3 | Conservation constraints (global) | Set-level |
| C4 | Gauge / potential continuity | Cross-law boundary |
| C5 | Intervention contradiction check | Cross-law causal |

### 6.2 Atomicity Invariant

```
PROMOTE_LAW_SET is atomic:
  - Either ALL laws in Pi_revised are promoted together
  - Or NONE are promoted
  - No partial law-set state is ever visible to the system
```

---

## 7. Determinism and Termination

Loopback execution is deterministic under:

```
canonical_json       = RFC8785_subset
numeric_profile      = LTCA_NUMERIC_PROFILE_v1
operator_ordering    = MINIMALITY_FIRST
iteration_ordering   = DETERMINISTIC_SEQUENTIAL
```

### 7.1 Termination Conditions

| Condition | Action |
|-----------|--------|
| `exists Pi_revised s.t. ACCEPT_SET` | SUCCESS: promote and seal |
| `iteration_count >= max_iterations` | FAILURE: REFUSE + HALT |
| `B_RP exhausted OR B_EP exhausted` | FAILURE: REFUSE + HALT |
| `LSSM < tau_halt` | EMERGENCY: HALT (epistemic collapse) |

### 7.2 Iteration Trace Contract

Every loopback iteration MUST produce a trace record:

```json
{
  "iteration": 1,
  "candidate_id": "E_CAND_REVISED_1",
  "cost": { "lit": "1.40" },
  "gate_results": {
    "rebt": "PASS | FAIL",
    "cad": "PASS | FAIL",
    "iosp": "VERIFIED | REFUTED",
    "mlr_set": "ACCEPT | REJECT"
  },
  "outcome": "PROCEED | REJECT_RETRY | HALT"
}
```

---

## 8. Interpretation

Loopback is the computational analogue of **constrained scientific hypothesis revision**
but differs from human practice by:

| Property | Human Revision | Loopback Revision |
|----------|---------------|-------------------|
| Governance | Heuristic, informal | Invariant-governed |
| Determinism | Non-deterministic | Deterministic |
| Validation | Narrative validation | Formal gate validation |
| Update scope | Partial theory updates | Atomic law-set replacement |
| Budget | Unlimited (time-bound) | Explicit resource budgets |
| Trace | Optional lab notebooks | Mandatory forensic trace |

---

## 9. Epistemic Significance

Loopback transforms theory change from:

> ad hoc adjustment

into:

> constitutionally regulated state transition

Scientific evolution becomes a **law-tracking dynamical system** rather than a
sequence of informal paradigm shifts. Each revision is:

1. **Triggered** by measurable invariant failure (not opinion)
2. **Constrained** by constitutional predicates (not heuristics)
3. **Optimized** under minimality (not aesthetic preference)
4. **Verified** through gate chain (not peer consensus alone)
5. **Sealed** with forensic trace (not narrative summary)

---

## 10. Integration with LTCA Modules

| Module | Role in Loopback |
|--------|-----------------|
| **MLR** | Triggers loopback on REJECT; validates ACCEPT_SET |
| **HSC** | Provides LSSM thresholds and compute budgets |
| **SRO** | Generates revision candidates under Omega_allowed |
| **REB-T** | Gate 1: operator boundary preservation |
| **CAD** | Gate 2: sequence curvature invariant |
| **iOSp** | Gate 3: causal intervention verification |
| **CG** | Final atomic promotion authority |
| **CLP-X** | Forensic seal of revision trace + outcome |

---

## 11. Conclusion

Loopback establishes that hypothesis revision can be formalized as **constrained search
under invariant law-set governance**, providing:

- Deterministic reproducibility
- Cross-law consistency enforcement
- Budget-aware adaptive reconstruction

It is a core mechanism enabling stable evolution of law representations within
the LTCA/CAS framework.

---

*End of LOOPBACK_FORMAL_SPEC_v1.0*
