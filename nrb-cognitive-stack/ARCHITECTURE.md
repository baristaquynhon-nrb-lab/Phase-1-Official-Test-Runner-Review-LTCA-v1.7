# NRB Cognitive Stack — Complete System Architecture

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE SPECIFICATION

---

## 1. System Overview

The NRB Cognitive Stack implements a deterministic, auditable cognitive processing pipeline. It transforms raw perceptual signals into semantically grounded meaning frames, evaluates them against law-based safety constraints, and generates appropriate surface-level responses.

## 2. Core Pipeline Flow

```
PFT (Perception) → COP (Understanding) → GSRA (Governance) → Action
         ↕                   ↕
       GeneDB            GeneDB
      (Memory)           (Memory)
```

## 3. Subsystem Contracts

### 3.1 PFT → COP Interface
- **Input**: Raw sensor signals (camera, mic, motion)
- **Output**: Pseudo-symbols suitable for COP tokenizer
- **Contract**: `integration/interfaces/PFT_COP_interface.js`

### 3.2 COP Internal Pipeline (L0–L3)
- **L0 (BCPL)**: Bilingual Corpus Processing Layer — offline memory formation
- **L1 (CIL Runtime)**: Tokenizer → Potential Generator → Hypothesis Builder → Constraint Evaluator → Meaning Frame Builder
- **L2 (Schemas)**: Canonical Meaning Frame definitions
- **L3 (Surface)**: Meaning Frame → natural language output

### 3.3 COP → GSRA Interface
- **Input**: Complete Meaning_Frame with trace_hash
- **Output**: Verdict (ALLOW/BLOCK/MODIFY) + action policy
- **Contract**: `gsra/COP_GSRA_INTERFACE_SPEC_v1.0.md`

### 3.4 COP ↔ GeneDB Interface
- **Operations**: Recall (retrieve priors), Store (consolidate new genes)
- **Contract**: `integration/interfaces/COP_GENEDB_interface.js`

## 4. Determinism Architecture

Every processing step produces:
- Canonical JSON output
- SHA-256 trace hash
- Forensic audit trail entry

No hidden state. No non-deterministic operations. Every decision traceable to source evidence.

## 5. Key Design Principles

1. **Separation of Concerns**: Each subsystem has a single, well-defined responsibility
2. **Contract-First**: All inter-system communication defined by formal interfaces
3. **Determinism by Default**: Reproducible behavior is a system invariant
4. **Safety as Governance**: GSRA acts as an independent safety governor, not embedded in COP
5. **Bilingual Native**: English/Vietnamese support at the architectural level
