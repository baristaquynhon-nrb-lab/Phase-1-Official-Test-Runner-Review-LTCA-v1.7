# 05 - LAYER IV: CB FORMATION LAYER
## Cognitive Block Meaning Assembly

---

## Layer Overview

| Property | Value |
|----------|-------|
| Layer Number | IV |
| Name | CB Formation Layer |
| Primary Function | Cognitive block meaning assembly |
| Input | Evidence records (EVID) from Layer III |
| Output | Cognitive blocks (CB) |

---

## Purpose

The CB Formation Layer assembles **meaning units** from evidence. This is where raw evidence transforms into **semantic content** that can participate in reasoning. CBs are the fundamental units of meaning in the system.

---

## Core Concept: CB (Cognitive Block)

```
CB = Atomic unit of meaning derived from evidence
```

### CB Properties

| Property | Description |
|----------|-------------|
| Evidence Derivation | Must derive from EVID records |
| Semantic Content | Contains extractable meaning |
| Atomic Nature | Cannot be subdivided without loss |
| Composability | Can combine with other CBs |
| Context Independence | Meaning is self-contained |

---

## CB Formation Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                  CB FORMATION LAYER                          │
│                                                              │
│  EVID Input   ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│    ──────▶    │ Analyze │ ─▶ │ Extract │ ─▶ │ Form    │     │
│               └─────────┘    └─────────┘    └─────────┘     │
│                    │              │              │           │
│                    ▼              ▼              ▼           │
│               ┌─────────┐   ┌─────────┐    ┌─────────┐      │
│               │ Semantic│   │ Meaning │    │   CB    │      │
│               │ Parse   │   │ Isolate │    │ Struct  │      │
│               └─────────┘   └─────────┘    └─────────┘      │
│                                                  │           │
│              ┌───────────────────────────────────┘           │
│              │                                               │
│              ▼                                               │
│         ┌──────────┐      ┌──────────┐                      │
│         │ Validate │  ──▶ │    CB    │                      │
│         │ Meaning  │      │  Output  │                      │
│         └──────────┘      └──────────┘                      │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
                          To Layer V (Gene)
```

---

## Semantic Analysis

### Evidence Analysis Stage

```python
class EvidenceAnalyzer:
    """Analyze evidence for semantic content"""

    def analyze(self, evid):
        return SemanticAnalysis(
            evidence_type=self.classify_evidence(evid),
            content_structure=self.parse_structure(evid),
            semantic_markers=self.extract_markers(evid),
            relationship_hints=self.detect_relationships(evid),
            confidence=self.assess_semantic_confidence(evid)
        )
```

### Meaning Extraction Stage

```python
class MeaningExtractor:
    """Extract atomic meaning units from analysis"""

    def extract(self, analysis):
        meaning_units = []

        for marker in analysis.semantic_markers:
            unit = MeaningUnit(
                content=marker.content,
                type=marker.semantic_type,
                evidence_ref=analysis.evidence_ref,
                confidence=marker.confidence
            )
            meaning_units.append(unit)

        return meaning_units
```

### CB Formation Stage

```python
class CBFormer:
    """Form cognitive blocks from meaning units"""

    def form(self, meaning_units, source_evidence):
        cb = CognitiveBlock(
            cb_id=generate_uuid(),
            semantic_content=self.assemble_content(meaning_units),
            evidence_refs=[e.evidence_id for e in source_evidence],
            formation_timestamp=logical_clock.now(),
            meaning_type=self.classify_meaning(meaning_units),
            integrity=self.compute_integrity(meaning_units)
        )

        return cb
```

---

## CB Schema

### CB Record Structure

```json
{
  "schema_version": "1.0",
  "type": "CB",
  "cb_id": "UUID",
  "timestamp": {
    "logical": "lamport_clock_value",
    "formed_at": "ISO8601"
  },
  "evidence_refs": [
    {
      "evidence_id": "UUID",
      "evidence_hash": "SHA256",
      "contribution": "primary|supporting|contextual"
    }
  ],
  "semantic_content": {
    "meaning_type": "string",
    "content": {},
    "encoding": "string",
    "language": "string"
  },
  "properties": {
    "atomicity": true,
    "composable": true,
    "context_independent": true
  },
  "confidence": {
    "semantic": 0.0,
    "evidence_support": 0.0,
    "overall": 0.0
  },
  "integrity": {
    "content_hash": "SHA256",
    "evidence_chain_hash": "SHA256",
    "signature": "ED25519"
  }
}
```

---

## Meaning Types

### CB Classification

| Type | Description | Example |
|------|-------------|---------|
| Assertion | Statement of fact | "Temperature is 25°C" |
| Relation | Connection between entities | "A causes B" |
| Property | Attribute of entity | "Object is red" |
| Event | Occurrence in time | "Sensor activated at T" |
| State | Condition at moment | "System is running" |
| Measurement | Quantified observation | "Distance = 10m" |
| Category | Classification | "Object is type X" |

---

## Layer Invariants

### Invariant 1: Evidence Derivation

```
∀ CB C: ∃ EVID set E such that C ← E
```
Every CB must derive from evidence.

### Invariant 2: Meaning Preservation

```
∀ CB C: meaning(C) ⊆ information(evidence_refs(C))
```
No meaning can exceed evidence content.

### Invariant 3: Atomicity

```
∀ CB C: ¬∃ CB C₁, C₂ such that C = merge(C₁, C₂) ∧ meaningful(C₁) ∧ meaningful(C₂)
```
CBs cannot be split into smaller meaningful units.

### Invariant 4: Context Independence

```
∀ CB C, context K₁, K₂: meaning(C, K₁) = meaning(C, K₂)
```
CB meaning does not depend on external context.

### Invariant 5: Deterministic Formation

```
∀ EVID set E: form_cb(E) = deterministic_CB
```
Same evidence always produces same CB.

---

## Confidence Calculation

### CB Confidence Components

| Component | Weight | Source |
|-----------|--------|--------|
| Semantic Clarity | 0.35 | Meaning extraction confidence |
| Evidence Support | 0.35 | Evidence quality scores |
| Formation Validity | 0.20 | Process verification |
| Consistency | 0.10 | Cross-reference check |

### Confidence Formula

```python
def calculate_cb_confidence(cb):
    semantic = assess_semantic_clarity(cb)
    evidence = aggregate_evidence_quality(cb.evidence_refs)
    formation = verify_formation_process(cb)
    consistency = check_consistency(cb)

    return (0.35 * semantic +
            0.35 * evidence +
            0.20 * formation +
            0.10 * consistency)
```

---

## CB Relationships

### Relationship Types

```
┌──────────┐                    ┌──────────┐
│   CB_A   │ ─── supports ────▶ │   CB_B   │
└──────────┘                    └──────────┘

┌──────────┐                    ┌──────────┐
│   CB_A   │ ─── contradicts ──▶│   CB_B   │
└──────────┘                    └──────────┘

┌──────────┐                    ┌──────────┐
│   CB_A   │ ─── implies ──────▶│   CB_B   │
└──────────┘                    └──────────┘

┌──────────┐                    ┌──────────┐
│   CB_A   │ ─── composes ─────▶│   CB_B   │
└──────────┘      with          └──────────┘
```

---

## Interface Contracts

### Input Contract (from Layer III)

```
Layer IV expects from Layer III:
1. Valid EVID records with forensic chain
2. Cryptographically sealed evidence
3. Trusted timestamps
4. Quality scores
```

### Output Contract (to Layer V)

```
Layer IV guarantees to Layer V:
1. All CB records derive from evidence
2. All CB records have valid semantic content
3. All CB records are atomic and context-independent
4. All CB records have confidence scores
```

---

## Navigation

- **Previous**: [Layer III: Evidence Binding](../04-layer-III-evidence-binding/README.md)
- **Next**: [Layer V: Gene Encoding](../06-layer-V-gene-encoding/README.md)
- **Index**: [Main Specification](../README.md)
