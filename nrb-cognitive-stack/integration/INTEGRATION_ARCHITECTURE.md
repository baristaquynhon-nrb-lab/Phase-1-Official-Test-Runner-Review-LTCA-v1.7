# Integration Architecture

**Version:** 1.0
**Date:** February 6, 2026

---

## System Connections

```
PFT ──→ COP ──→ GSRA ──→ Action
          ↕
        GeneDB
```

## Interface Contracts

### PFT → COP
- **Input**: Pseudo-symbols from PFT signal processing
- **Output**: Text-like tokens for COP tokenizer
- **Contract File**: `interfaces/PFT_COP_interface.js`

### COP → GSRA
- **Input**: Validated Meaning Frame with trace_hash
- **Output**: GSRA envelope for law evaluation
- **Contract File**: `interfaces/COP_GSRA_interface.js`
- **Spec**: `gsra/COP_GSRA_INTERFACE_SPEC_v1.0.md`

### GSRA → Action
- **Input**: GSRA verdict with action policy
- **Output**: Executable action commands
- **Contract File**: `interfaces/GSRA_ACTION_interface.js`

### COP ↔ GeneDB
- **Operations**: Recall (read) and Store (write) genes
- **Contract File**: `interfaces/COP_GENEDB_interface.js`

## Testing Strategy

- Unit tests per subsystem in respective `/tests/` directories
- Integration tests in `integration/tests/` for cross-system flows
- CI/CD pipelines in `.github/workflows/`
