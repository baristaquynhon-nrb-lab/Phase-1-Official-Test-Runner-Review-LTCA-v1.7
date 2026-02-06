# GSRA Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

GSRA acts as an independent safety governor for the NRB Cognitive Stack. It receives Meaning Frames from COP, evaluates them against a structured law vault, and produces verdicts that control downstream actions.

## 2. Architecture

```
Meaning_Frame → Evidence Binder → Law Evaluator (LEAE)
    → Coherence Gate → Intervention Planner (IPA) → Verdict
```

## 3. Verdict Types

| Verdict | Meaning |
|---------|---------|
| `ALLOW` | Action permitted, no intervention needed |
| `BLOCK` | Action blocked, safety law violated |
| `MODIFY` | Action permitted with modifications |

## 4. Law Categories

- **Safety Laws**: Physical safety, harm prevention
- **Ethical Laws**: Ethical constraints, dignity preservation
- **Intervention Laws**: When and how to intervene
- **Domain Policies**: Context-specific rules

## 5. Determinism

GSRA evaluation is fully deterministic: same Meaning Frame + same law vault = same verdict.

## 6. Audit Trail

Every verdict includes:
- Input frame trace_hash
- Laws evaluated
- Evidence bindings
- Decision rationale
- Output verdict trace_hash
