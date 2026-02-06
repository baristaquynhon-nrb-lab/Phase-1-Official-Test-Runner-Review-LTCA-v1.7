# Surface Generation Layer (L3)

## Overview

The Surface Generation Layer converts validated Meaning Frames back into natural language output. It ensures that generated text does not introduce facts not present in the source Meaning Frame.

## Components

| File | Purpose |
|------|---------|
| `template_map.json` | Maps intents to response templates |
| `surface_generator_adapter.js` | Main generation adapter |
| `template_selector.js` | Selects appropriate template based on frame |

## Transformers

| File | Purpose |
|------|---------|
| `transformers/transformer_adapter.js` | Optional LLM wrapper for complex generation |
| `transformers/constraint_enforcer.js` | Ensures output fidelity to Meaning Frame |

## Key Constraint

**No New Facts Rule**: Surface output must only express information present in the Meaning Frame. No hallucination, no inference beyond what is explicitly grounded.
