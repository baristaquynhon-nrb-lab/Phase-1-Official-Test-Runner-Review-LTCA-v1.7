# Integration — Cross-System Integration

## Overview

This directory contains the formal interface contracts and integration tests that connect the four subsystems of the NRB Cognitive Stack.

## Interfaces

| File | Connection | Direction |
|------|-----------|-----------|
| `PFT_COP_interface.js` | PFT → COP | Perception signals to language pipeline |
| `COP_GSRA_interface.js` | COP → GSRA | Meaning frames to law evaluator |
| `GSRA_ACTION_interface.js` | GSRA → Action | Verdicts to action execution |
| `COP_GENEDB_interface.js` | COP ↔ GeneDB | Bidirectional memory access |

## Integration Tests

| File | Scope |
|------|-------|
| `test_full_pipeline.js` | End-to-end: PFT → COP → GSRA → Action |
| `test_emergency_flow.js` | Emergency scenario: detection through intervention |
