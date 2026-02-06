# Design Principles

## 1. Determinism by Default

Every processing step in the NRB Cognitive Stack is deterministic. Given the same input and the same configuration, the output (including trace hashes) is always identical. This enables:
- Reproducible debugging
- Audit trail verification
- Regression testing

## 2. Separation of Concerns

Each subsystem has exactly one, well-defined responsibility:
- COP: Language understanding and generation
- GSRA: Safety governance
- PFT: Perception processing
- GeneDB: Memory management

No subsystem encroaches on another's domain.

## 3. Contract-First Design

All inter-system communication is defined by formal interface contracts. Changes to one subsystem cannot break another unless the interface contract is modified (which requires explicit versioning).

## 4. Safety as Governance

GSRA operates as an independent governor, not as a component embedded within COP. This ensures safety evaluation cannot be bypassed or influenced by the language processing pipeline.

## 5. Bilingual Native

English and Vietnamese are supported at the architectural level, not as an afterthought. Lexicons, MWE dictionaries, urgency cues, and surface templates exist for both languages.

## 6. Full Auditability

Every decision in the stack produces a forensic audit trail entry with:
- Canonical JSON representation
- SHA-256 trace hash
- Chain hashing to previous entries
- Human-readable event labels
