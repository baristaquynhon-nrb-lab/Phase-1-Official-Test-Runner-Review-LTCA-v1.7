# COP — Cognitive Operating Pipeline

## Overview

COP is the core language-understanding and language-generation engine of the NRB Cognitive Stack. It processes input symbols through a deterministic pipeline that transforms raw tokens into semantically grounded Meaning Frames, then generates surface-level natural language responses.

## Pipeline Layers

| Layer | Name | Module | Function |
|-------|------|--------|----------|
| L0 | BCPL | `/bcpl/` | Bilingual Corpus Processing (offline) |
| L1 | CIL Runtime | `/cil_runtime/` | Real-time interpretation engine |
| L2 | Schemas | `/schemas/` | Meaning Frame definitions |
| L3 | Surface | `/surface/` | Natural language generation |

## Pipeline Flow

```
Input Symbol
    ↓
[L1: CIL Runtime]
    Tokenizer → Potential Generator → Hypothesis Builder
        → Constraint Evaluator → Meaning Frame Builder
    ↓
[L2: Meaning Frame Schema Validation]
    ↓
[L3: Surface Generator]
    ↓
Output Symbol'
```

## Key Contracts

- **Input**: Raw text or pseudo-symbols from PFT
- **Output**: Meaning_Frame (to GSRA) and Surface text (to user)
- **Memory**: Bidirectional interface with GeneDB for lexicon/MWE/frame hints

## Testing

```bash
node tests/run_cop_tests.js
```
