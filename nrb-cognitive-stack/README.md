# NRB Cognitive Stack

## Architecture Overview

The NRB Cognitive Stack is a modular cognitive architecture composed of four primary subsystems:

| Component | Full Name | Role |
|-----------|-----------|------|
| **COP** | Cognitive Operating Pipeline | Language ↔ Meaning Brain |
| **GSRA** | Law-Tracking Cognitive Core | Law & Safety Governor |
| **PFT** | Perception Field Tracking | Perception Processor |
| **GeneDB** | Gene Database | Memory & Priors |

**Together = NRB Cognitive Organism**

## Directory Structure

```
/nrb-cognitive-stack/
├── /cop/          # COP: Cognitive Operating Pipeline (L0-L3)
├── /gsra/         # GSRA: Law-Tracking Cognitive Core
├── /pft/          # PFT: Perception Field Tracking
├── /genedb/       # GeneDB: Memory Architecture
├── /integration/  # Cross-System Integration & Interfaces
├── /common/       # Shared Utilities (crypto, validation, logging)
├── /docs/         # System-Level Documentation
├── /examples/     # Usage Examples
├── /benchmarks/   # Performance Benchmarks
└── package.json   # Node.js project configuration
```

## Quick Start

```bash
# 1. Run COP-only tests
node cop/tests/run_cop_tests.js

# 2. Run GSRA law evaluation tests
node gsra/tests/test_law_evaluation.js

# 3. Run full integration test (PFT→COP→GSRA→Action)
node integration/tests/test_full_pipeline.js

# 4. Validate all schemas
node common/validation/schema_validator.js --all

# 5. Generate forensic audit trail
node common/logging/audit_trail.js --export
```

## Implementation Priority

- **Phase 1: COP Core** (Current) — `/cop/cil_runtime/`, `/cop/schemas/`, `/cop/surface/`, `/cop/tests/`
- **Phase 2: GSRA Integration** (Next) — `/gsra/core/`, `/gsra/adapters/`, `/integration/interfaces/`
- **Phase 3: Full Stack** — `/pft/`, `/genedb/`, `/integration/tests/`

## Determinism Guarantees

All modules maintain:

1. **Hash Stability**: Same input → Same `trace_hash`
2. **Canonical JSON**: All objects serializable deterministically
3. **No Hidden State**: All state explicit in contracts
4. **Audit Trails**: Every decision traceable to source

## Documentation Hierarchy

```
System Level: /docs/SYSTEM_OVERVIEW.md
    ↓
Component Level: /cop/COP_ARCHITECTURE_v1.0.md
    ↓
Module Level: /cop/cil_runtime/CIL_RUNTIME_SPEC_v1.0.md
    ↓
Interface Level: /gsra/COP_GSRA_INTERFACE_SPEC_v1.0.md
```

## License

See [LICENSE](./LICENSE) for details.
