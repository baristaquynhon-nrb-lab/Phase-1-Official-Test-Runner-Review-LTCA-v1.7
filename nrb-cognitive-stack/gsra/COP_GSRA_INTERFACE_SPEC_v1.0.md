# COP → GSRA Interface Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

This document defines the formal contract between COP and GSRA. It specifies the envelope format for Meaning Frames sent from COP to GSRA, and the verdict format returned.

## 2. COP → GSRA Envelope

```json
{
  "envelope_type": "cop_to_gsra",
  "version": "1.0",
  "meaning_frame": { ... },
  "metadata": {
    "source": "cop_cil_runtime",
    "timestamp": "ISO-8601",
    "trace_hash": "SHA-256"
  }
}
```

## 3. GSRA → Response

```json
{
  "response_type": "gsra_verdict",
  "version": "1.0",
  "verdict": "ALLOW | BLOCK | MODIFY",
  "action_policy": {
    "action": "...",
    "priority": 0-5,
    "rationale": "..."
  },
  "laws_evaluated": ["..."],
  "evidence_bindings": { ... },
  "trace_hash": "SHA-256"
}
```

## 4. Contract Rules

1. COP MUST include a valid `trace_hash` in every envelope
2. GSRA MUST evaluate ALL applicable laws (no short-circuiting)
3. GSRA MUST return a verdict for every envelope received
4. Both sides MUST use canonical JSON for hash computation
