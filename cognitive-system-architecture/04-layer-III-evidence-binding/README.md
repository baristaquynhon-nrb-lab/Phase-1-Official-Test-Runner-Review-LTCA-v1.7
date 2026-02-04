# 04 - LAYER III: EVIDENCE BINDING LAYER
## Forensic Chain Formation

---

## Layer Overview

| Property | Value |
|----------|-------|
| Layer Number | III |
| Name | Evidence Binding Layer |
| Primary Function | Forensic chain formation |
| Input | Structured traces (TRACE) from Layer II |
| Output | Evidence records (EVID) |

---

## Purpose

The Evidence Binding Layer creates **forensically valid** evidence records from traces. This layer establishes the **chain of custody** that enables all downstream reasoning to be auditable and legally defensible.

---

## Core Concept: EVID (Evidence)

```
EVID = Forensically bound evidence with complete provenance
```

### Evidence Properties

| Property | Description |
|----------|-------------|
| Trace Derivation | Derived from validated traces |
| Chain of Custody | Complete provenance record |
| Immutability | Cannot be altered after creation |
| Timestamping | Cryptographically timestamped |
| Non-repudiation | Cannot deny creation |

---

## Evidence Formation Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                  EVIDENCE BINDING LAYER                      │
│                                                              │
│  TRACE Input  ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│    ──────▶    │Validate │ ─▶ │ Bind    │ ─▶ │ Seal    │     │
│               └─────────┘    └─────────┘    └─────────┘     │
│                    │              │              │           │
│                    ▼              ▼              ▼           │
│               ┌─────────┐   ┌─────────┐    ┌─────────┐      │
│               │ Integ.  │   │ Chain   │    │ Crypto  │      │
│               │ Check   │   │ Build   │    │ Sign    │      │
│               └─────────┘   └─────────┘    └─────────┘      │
│                                                  │           │
│                                                  ▼           │
│                                            ┌──────────┐      │
│                                            │   EVID   │      │
│                                            │  Output  │      │
│                                            └──────────┘      │
│                                                  │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                                   ▼
                                           To Layer IV (CB)
```

---

## Forensic Requirements

### Chain of Custody Elements

| Element | Purpose | Implementation |
|---------|---------|----------------|
| Origin | Where evidence came from | Trace reference |
| Handler | Who/what processed it | Component ID |
| Timestamp | When each step occurred | Logical + physical |
| Action | What was done | Operation log |
| Integrity | Proof of non-tampering | Hash chain |

### Legal Defensibility Criteria

```
Criteria 1: Authenticity
  - Evidence is what it claims to be
  - Verified through cryptographic signatures

Criteria 2: Reliability
  - Collection method is scientifically valid
  - Processing is deterministic and reproducible

Criteria 3: Completeness
  - All relevant information preserved
  - No selective omission

Criteria 4: Chain Integrity
  - Unbroken custody chain
  - Every handler documented
```

---

## Evidence Schema

### EVID Record Structure

```json
{
  "schema_version": "1.0",
  "type": "EVID",
  "evidence_id": "UUID",
  "timestamp": {
    "logical": "lamport_clock_value",
    "physical": "ISO8601",
    "trusted_timestamp": {
      "authority": "string",
      "token": "RFC3161_token"
    }
  },
  "source_traces": [
    {
      "trace_id": "UUID",
      "trace_hash": "SHA256",
      "relationship": "primary|corroborating|contextual"
    }
  ],
  "chain_of_custody": [
    {
      "step": 1,
      "handler_id": "UUID",
      "handler_type": "component_type",
      "action": "string",
      "timestamp": "ISO8601",
      "input_hash": "SHA256",
      "output_hash": "SHA256",
      "signature": "ED25519"
    }
  ],
  "evidence_content": {
    "type": "string",
    "payload": {},
    "encoding": "string"
  },
  "forensic_metadata": {
    "collection_method": "string",
    "processing_version": "string",
    "quality_score": 0.0
  },
  "integrity": {
    "content_hash": "SHA256",
    "chain_hash": "SHA256",
    "root_hash": "SHA256",
    "signatures": [
      {
        "signer_id": "UUID",
        "algorithm": "ED25519",
        "signature": "base64"
      }
    ]
  }
}
```

---

## Binding Operations

### Validation Stage

```python
class TraceValidator:
    """Validate incoming traces before binding"""

    def validate(self, trace):
        checks = [
            self.verify_integrity(trace),
            self.verify_source_chain(trace),
            self.verify_temporal_order(trace),
            self.verify_pattern_validity(trace)
        ]

        if not all(checks):
            raise ValidationError("Trace validation failed")

        return ValidationResult(
            trace_id=trace.trace_id,
            validated_at=logical_clock.now(),
            validation_signature=self.sign(trace)
        )
```

### Chain Building Stage

```python
class ChainBuilder:
    """Build forensic chain of custody"""

    def build_chain(self, validated_trace, processing_steps):
        chain = []
        current_hash = validated_trace.hash

        for step in processing_steps:
            chain_entry = ChainEntry(
                step=len(chain) + 1,
                handler_id=step.handler.id,
                handler_type=step.handler.type,
                action=step.action,
                timestamp=step.timestamp,
                input_hash=current_hash,
                output_hash=step.output_hash,
                signature=step.handler.sign(step)
            )
            chain.append(chain_entry)
            current_hash = step.output_hash

        return chain
```

### Sealing Stage

```python
class EvidenceSealer:
    """Seal evidence with cryptographic binding"""

    def seal(self, content, chain):
        # Compute content hash
        content_hash = sha256(content)

        # Compute chain hash (merkle root of chain)
        chain_hash = merkle_root([e.signature for e in chain])

        # Compute root hash binding everything
        root_hash = sha256(content_hash + chain_hash)

        # Get trusted timestamp
        tst = self.get_trusted_timestamp(root_hash)

        # Create final signatures
        signatures = self.collect_signatures(root_hash)

        return SealedEvidence(
            content_hash=content_hash,
            chain_hash=chain_hash,
            root_hash=root_hash,
            trusted_timestamp=tst,
            signatures=signatures
        )
```

---

## Layer Invariants

### Invariant 1: Trace Derivation

```
∀ EVID E: ∃ TRACE set T such that E ← T
```
Every evidence must derive from traces.

### Invariant 2: Chain Completeness

```
∀ EVID E: chain_of_custody(E) is complete ∧ unbroken
```
No gaps in custody chain.

### Invariant 3: Cryptographic Binding

```
∀ EVID E: verify(signatures(E), content(E)) = true
```
All signatures must verify.

### Invariant 4: Temporal Proof

```
∀ EVID E: ∃ trusted_timestamp T such that E existed at T
```
Existence proven by trusted timestamp.

### Invariant 5: Immutability

```
∀ EVID E: once sealed, hash(E) is constant
```
Evidence cannot be modified after sealing.

---

## Evidence Quality Scoring

### Quality Factors

| Factor | Weight | Criteria |
|--------|--------|----------|
| Source Quality | 0.25 | Trace confidence scores |
| Chain Integrity | 0.25 | All signatures valid |
| Corroboration | 0.20 | Multiple trace support |
| Temporal Precision | 0.15 | Timestamp accuracy |
| Collection Method | 0.15 | Method reliability |

---

## Interface Contracts

### Input Contract (from Layer II)

```
Layer III expects from Layer II:
1. Valid TRACE records with integrity
2. Pattern confidence scores
3. Source signal references
4. Processing metadata
```

### Output Contract (to Layer IV)

```
Layer III guarantees to Layer IV:
1. All EVID records have forensic chain
2. All EVID records are cryptographically sealed
3. All EVID records have trusted timestamps
4. All EVID records are immutable
```

---

## Navigation

- **Previous**: [Layer II: Trace Structuring](../03-layer-II-trace-structuring/README.md)
- **Next**: [Layer IV: CB Formation](../05-layer-IV-cb-formation/README.md)
- **Index**: [Main Specification](../README.md)
