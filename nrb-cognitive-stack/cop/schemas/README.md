# Meaning Frame Schemas (L2)

## Overview

This directory contains canonical Meaning Frame schema definitions used by the COP pipeline. All Meaning Frames produced by the CIL Runtime must validate against these schemas.

## Files

| File | Purpose |
|------|---------|
| `MEANING_FRAME_SCHEMA_v1.0.json` | Master schema definition |
| `schema_validator.js` | Runtime schema validator |

## Frame Definitions

Located in `/frame_definitions/`:
- `HELP_REQUEST.json` — Help/assistance request frame
- `TOILET_VISIT.json` — Restroom visit frame
- `PRAYER_ACT.json` — Prayer/religious act frame
- `EMERGENCY_DISTRESS.json` — Emergency distress signal frame

## Validators

Located in `/validators/`:
- `urgency_validator.js` — Validates urgency level assignments
- `evidence_validator.js` — Validates evidence chain completeness
