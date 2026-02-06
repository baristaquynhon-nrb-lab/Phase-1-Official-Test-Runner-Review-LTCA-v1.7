# CIL Runtime Engine (L1)

## Overview

The CIL (Cognitive Interpretation Layer) Runtime Engine is the real-time processing core of COP. It transforms input symbols into validated Meaning Frames through a deterministic pipeline.

## Components

| File | Module | Function |
|------|--------|----------|
| `tokenizer.js` | Tokenizer | Input segmentation and normalization |
| `potential_generator.js` | POTENTIAL_GENERATOR_v1.0 | Generate candidate interpretations |
| `hypothesis_builder.js` | HYPOTHESIS_BUILDER_v1.0 | Build structured hypotheses |
| `constraint_evaluator.js` | CONSTRAINT_EVALUATOR_v1.0 | Apply constraints to narrow hypotheses |
| `meaning_frame_builder.js` | MEANING_FRAME_BUILDER_v1.0 | Construct validated Meaning Frames |
| `cil_runtime_engine.js` | Main Coordinator | Orchestrates the full pipeline |

## Processing Flow

```
Input → Tokenizer → Potential Generator → Hypothesis Builder
    → Constraint Evaluator → Meaning Frame Builder → Output
```

## Lexicons

Located in `/lexicons/`:
- `lexicon_en.json` / `lexicon_vi.json` — Word-level lexicons
- `mwe_en.json` / `mwe_vi.json` — Multi-word expression dictionaries
- `urgency_cues_en.json` / `urgency_cues_vi.json` — Urgency signal cues
