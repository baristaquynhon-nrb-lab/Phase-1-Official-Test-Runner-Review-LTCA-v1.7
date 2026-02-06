# Surface Generator Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

The Surface Generator (L3) converts Meaning Frames into natural language text. It is the final output stage of the COP pipeline.

## 2. Generation Strategy

### Template-Based (Primary)
1. Look up intent in `template_map.json`
2. Select template matching language and urgency level
3. Fill template slots from Meaning Frame fields

### Transformer-Based (Optional)
1. Pass Meaning Frame to transformer adapter
2. Apply constraint enforcer to validate output
3. Reject output if it introduces new facts

## 3. No New Facts Constraint

The surface output MUST NOT contain:
- Information not present in the Meaning Frame
- Inferences not explicitly grounded in evidence
- Fabricated details or embellishments

## 4. Output Format

```json
{
  "surface_text": "...",
  "language": "en|vi",
  "template_used": "...",
  "trace_hash": "...",
  "no_new_facts_verified": true
}
```
