# COP Pipeline Flow

## Complete Processing Flow

```
┌─────────────────────────────────────────────────────┐
│                    INPUT SYMBOL                      │
│              (text or pseudo-symbol)                 │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              L1: CIL RUNTIME ENGINE                  │
│                                                      │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │Tokenizer │→ │Potential Generator│→ │Hypothesis │ │
│  └──────────┘  └──────────────────┘  │  Builder   │ │
│                                       └─────┬─────┘ │
│                                             │       │
│  ┌──────────────────┐  ┌────────────────────┘       │
│  │Meaning Frame     │← │Constraint Evaluator│       │
│  │  Builder         │  └────────────────────┘       │
│  └────────┬─────────┘                               │
└───────────┼─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────┐
│           L2: SCHEMA VALIDATION                      │
│       Validate against Meaning Frame Schema          │
└───────────┬─────────────────────────────────────────┘
            │
            ├──────────────────────┐
            ▼                      ▼
┌───────────────────┐  ┌──────────────────────────────┐
│   L3: SURFACE     │  │      → GSRA                   │
│   GENERATOR       │  │   (Law Evaluation)            │
│                   │  │                               │
│ Meaning Frame →   │  │ Meaning Frame →               │
│   Natural Lang    │  │   Verdict + Policy             │
└───────────────────┘  └──────────────────────────────┘
```

## Data Flow Summary

1. **Input** → Raw text or pseudo-symbols from PFT
2. **Tokenizer** → Segments into normalized tokens with language detection
3. **Potential Generator** → Candidate meanings from lexicons
4. **Hypothesis Builder** → Structured interpretation candidates
5. **Constraint Evaluator** → Filtered, scored hypotheses
6. **Meaning Frame Builder** → Final semantic frame with trace hash
7. **Schema Validation** → Validates against canonical schema
8. **Surface Generator** → Natural language output (to user)
9. **GSRA** → Law evaluation (parallel path for safety)
