# Cognitive Operating System - Formal Specification Deployment

**Version**: 1.0.0
**Branch**: Text-Input Only (ΔC_text)
**Status**: Forensic-Grade, Deterministic, Replay-Verified

## Overview

This repository implements the complete ACOS-NRB cognitive architecture as a deterministic, auditable, replay-verifiable system.

### Key Properties
- **Deterministic**: Same input → Same output → Same hash
- **Forensic**: Complete audit trail (JSONL)
- **Replayable**: 100% state reconstruction from logs
- **Constitutional**: Law-governed at every layer
- **Convergent**: Gene evolution with structural stability

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run single case
node tools/run_case.js cases/help_positive.json

# Run full suite
node tools/run_suite.js

# Replay from logs
node tools/replay.js logs/help_positive_001.jsonl
```

## Architecture Layers

```
Surface (Text)
  ↓
CB (Content Binding)
  ↓
NRB-256 Gene Memory
  ↓
ASE Events
  ↓
CR State Dynamics
  ↓
Reasoning
  ↓
Meta Evaluation
  ↓
Goal Formation
  ↓
Intent Selection
  ↓
Action Planning
  ↓
Execution + Feedback
  ↓
Gene Evolution
  ↺ (loop)
```

## Directory Structure

```
cos_formal_spec/
├── spec/           # Formal specifications (normative)
├── schemas/        # JSON schemas
├── src/            # Source code
│   ├── canon/      # Canonicalization + hashing
│   ├── guards/     # Constitutional guards
│   └── engines/    # Cognitive engines
├── fixtures/       # Test data + configurations
├── tests/          # Test suites
├── tools/          # CLI utilities
├── cases/          # Test case definitions
└── logs/           # Generated audit logs
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Determinism validation
npm run test:determinism

# Multi-case convergence
npm run test:convergence
```

## Forensic Audit

Every step logged to JSONL with:
- Previous hash link
- Canonical payload hash
- Full state snapshot
- Timestamp

Example log entry:
```json
{
  "seq_no": 42,
  "stage": "CR_TRANSITION",
  "prev_hash": "sha256_of_entry_41",
  "input_hash": "sha256(CR_t + ASE_event)",
  "output_hash": "sha256(CR_{t+1})",
  "payload": {...},
  "timestamp": "2026-02-04T12:34:56.789Z"
}
```

## Replay Verification

```bash
node tools/replay.js logs/case_001.jsonl

Output:
  ✓ Replay complete
  ✓ Hash chain valid
  ✓ State match: 100%
  Final state hash: sha256_xyz...
```

## Core Components

### CR State Reducer Engine
The central state transition function implementing:
- δ_CR(S_t, ASE_event) → S_{t+1}
- Constitutional guard checks
- Invariant validation
- Audit logging

### Constitutional Guards
Enforce system laws at transition points:
- G1: No CR update without valid ASE event
- G2: Schema whitelist enforcement
- G3: Scope enforcement (TEXT branch)
- G4: Memory monotonicity
- G5: No contradictory world updates

### Invariant Checker
Validates CR state invariants:
- Memory append-only (index monotonic)
- Meta-state bounds respected
- No contradictory state assignments

## API

### CRStateReducerEngine

```javascript
import { CRStateReducerEngine } from './src/engines/cr_state_reducer_engine.js';

const engine = new CRStateReducerEngine();
const result = engine.reduce(crPrev, aseEvent, context);

// result = {
//   verdict: 'APPLIED' | 'REFUSE',
//   crNext: {...},      // New CR state
//   delta: {...},       // Applied deltas
//   audit: {...}        // Audit record
// }
```

### Hash Utilities

```javascript
import { sha256, hashObject, verifyHashChain } from './src/canon/hash.js';

const hash = hashObject(myObject);
const valid = verifyHashChain(entries);
```

## Phases

### Phase 1-4 (Complete)
- Canonical JSON (RFC 8785-compliant)
- SHA-256 hashing
- Hash chain utilities
- CR state schema
- State transition engine
- Delta derivation
- Constitutional guards
- Invariant checker
- Audit logging
- Unit tests
- Integration tests
- CLI tools

### Phase 5-8 (Future)
- Reasoning Layer
- Meta + Goal + Intent engines
- Action + Feedback systems
- NRB Gene Evolution

## License

MIT (open source, full transparency)
