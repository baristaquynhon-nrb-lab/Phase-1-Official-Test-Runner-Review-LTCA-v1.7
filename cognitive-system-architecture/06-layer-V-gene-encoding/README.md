# 06 - LAYER V: GENE ENCODING LAYER
## Semantic DNA Encoding

---

## Layer Overview

| Property | Value |
|----------|-------|
| Layer Number | V |
| Name | Gene Encoding Layer |
| Primary Function | Semantic DNA encoding |
| Input | Cognitive blocks (CB) from Layer IV |
| Output | Cognitive genes (GENE) |

---

## Purpose

The Gene Encoding Layer encodes cognitive blocks into **semantic DNA** - a compact, composable representation that captures the essential meaning structure. Genes are the hereditary units of meaning that can be transmitted, combined, and evolved.

---

## Core Concept: GENE

```
GENE = Encoded semantic DNA from cognitive block(s)
```

### Gene Properties

| Property | Description |
|----------|-------------|
| CB Derivation | Encoded from one or more CBs |
| Compact Form | Optimized representation |
| Composability | Can recombine with other genes |
| Heritability | Can be passed to descendants |
| Expression | Can be decoded back to meaning |

---

## Gene Encoding Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                  GENE ENCODING LAYER                         │
│                                                              │
│  CB Input     ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│    ──────▶    │ Parse   │ ─▶ │ Encode  │ ─▶ │ Package │     │
│               └─────────┘    └─────────┘    └─────────┘     │
│                    │              │              │           │
│                    ▼              ▼              ▼           │
│               ┌─────────┐   ┌─────────┐    ┌─────────┐      │
│               │Semantic │   │  DNA    │    │ Gene    │      │
│               │Structure│   │ Mapping │    │ Struct  │      │
│               └─────────┘   └─────────┘    └─────────┘      │
│                                                  │           │
│              ┌───────────────────────────────────┘           │
│              │                                               │
│              ▼                                               │
│         ┌──────────┐      ┌──────────┐                      │
│         │ Validate │  ──▶ │   GENE   │                      │
│         │ Encoding │      │  Output  │                      │
│         └──────────┘      └──────────┘                      │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
                          To Layer VI (MODE-A)
```

---

## Encoding System

### Semantic DNA Alphabet

```
Base Elements (Semantic Nucleotides):
┌────────┬────────────────────────────────────┐
│ Symbol │ Meaning                            │
├────────┼────────────────────────────────────┤
│   E    │ Entity (noun/subject)              │
│   A    │ Action (verb/predicate)            │
│   P    │ Property (adjective/attribute)     │
│   R    │ Relation (connector/preposition)   │
│   Q    │ Quantity (number/measurement)      │
│   T    │ Temporal (time reference)          │
│   L    │ Location (spatial reference)       │
│   M    │ Modality (possibility/necessity)   │
│   C    │ Condition (if/when)                │
│   N    │ Negation (not/absence)             │
└────────┴────────────────────────────────────┘
```

### Gene Codon Structure

```
Codon = 3 base elements encoding semantic unit

Example Codons:
┌─────────┬──────────────────────────────────┐
│ Codon   │ Meaning                          │
├─────────┼──────────────────────────────────┤
│ EAE     │ Entity acts on Entity            │
│ EPQ     │ Entity has Property of Quantity  │
│ ERT     │ Entity in Relation at Time       │
│ CEA     │ Condition: Entity Action         │
│ NEP     │ Not Entity Property              │
└─────────┴──────────────────────────────────┘
```

---

## Gene Schema

### GENE Record Structure

```json
{
  "schema_version": "1.0",
  "type": "GENE",
  "gene_id": "UUID",
  "timestamp": {
    "logical": "lamport_clock_value",
    "encoded_at": "ISO8601"
  },
  "source_cbs": [
    {
      "cb_id": "UUID",
      "cb_hash": "SHA256",
      "encoding_map": {}
    }
  ],
  "dna_sequence": {
    "codons": ["EAE", "EPQ", "..."],
    "sequence_string": "string",
    "length": 0
  },
  "semantic_map": {
    "entities": {},
    "actions": {},
    "properties": {},
    "relations": {}
  },
  "expression_rules": {
    "decode_order": [],
    "combination_rules": [],
    "constraints": []
  },
  "properties": {
    "composable": true,
    "expressible": true,
    "heritable": true
  },
  "confidence": {
    "encoding_fidelity": 0.0,
    "semantic_preservation": 0.0,
    "overall": 0.0
  },
  "integrity": {
    "dna_hash": "SHA256",
    "cb_chain_hash": "SHA256",
    "signature": "ED25519"
  }
}
```

---

## Encoding Operations

### Semantic Parsing Stage

```python
class SemanticParser:
    """Parse CB for encoding"""

    def parse(self, cb):
        return SemanticStructure(
            entities=self.extract_entities(cb),
            actions=self.extract_actions(cb),
            properties=self.extract_properties(cb),
            relations=self.extract_relations(cb),
            modifiers=self.extract_modifiers(cb)
        )
```

### DNA Mapping Stage

```python
class DNAMapper:
    """Map semantic structure to DNA sequence"""

    def map(self, structure):
        codons = []

        # Encode each semantic element
        for entity in structure.entities:
            codons.extend(self.encode_entity(entity))

        for action in structure.actions:
            codons.extend(self.encode_action(action))

        for relation in structure.relations:
            codons.extend(self.encode_relation(relation))

        return DNASequence(codons=codons)
```

### Gene Packaging Stage

```python
class GenePackager:
    """Package DNA into Gene structure"""

    def package(self, dna_sequence, source_cbs):
        gene = Gene(
            gene_id=generate_uuid(),
            dna_sequence=dna_sequence,
            source_cbs=[cb.cb_id for cb in source_cbs],
            semantic_map=self.build_semantic_map(dna_sequence),
            expression_rules=self.derive_expression_rules(dna_sequence),
            timestamp=logical_clock.now(),
            integrity=self.compute_integrity(dna_sequence)
        )

        return gene
```

---

## Gene Operations

### Gene Composition

```python
def compose_genes(gene_a, gene_b, composition_rule):
    """Combine two genes into new gene"""

    # Validate compatibility
    if not compatible(gene_a, gene_b):
        raise IncompatibleGenesError()

    # Apply composition rule
    new_dna = composition_rule.apply(
        gene_a.dna_sequence,
        gene_b.dna_sequence
    )

    # Create composite gene
    return Gene(
        gene_id=generate_uuid(),
        dna_sequence=new_dna,
        source_cbs=gene_a.source_cbs + gene_b.source_cbs,
        parent_genes=[gene_a.gene_id, gene_b.gene_id],
        composition_type=composition_rule.type
    )
```

### Gene Expression

```python
def express_gene(gene):
    """Decode gene back to semantic content"""

    meaning = SemanticContent()

    for codon in gene.dna_sequence.codons:
        element = decode_codon(codon, gene.semantic_map)
        meaning.add(element)

    # Apply expression rules
    for rule in gene.expression_rules:
        meaning = rule.apply(meaning)

    return meaning
```

---

## Layer Invariants

### Invariant 1: CB Derivation

```
∀ GENE G: ∃ CB set C such that G ← C
```
Every gene must derive from cognitive blocks.

### Invariant 2: Encoding Fidelity

```
∀ GENE G: express(G) ≈ meaning(source_cbs(G))
```
Expression must approximate source meaning.

### Invariant 3: Deterministic Encoding

```
∀ CB set C: encode(C) = deterministic_GENE
```
Same CBs always produce same gene.

### Invariant 4: Composition Validity

```
∀ GENE G₁, G₂: compose(G₁, G₂) valid ⟺ compatible(G₁, G₂)
```
Only compatible genes can compose.

---

## Expression Rules

### Rule Types

| Rule Type | Purpose |
|-----------|---------|
| Sequence | Order of element activation |
| Binding | How elements connect |
| Constraint | Limits on expression |
| Default | Missing element handling |
| Priority | Conflict resolution |

---

## Interface Contracts

### Input Contract (from Layer IV)

```
Layer V expects from Layer IV:
1. Valid CB records with semantic content
2. Atomic and context-independent CBs
3. Evidence derivation chain
4. Confidence scores
```

### Output Contract (to Layer VI)

```
Layer V guarantees to Layer VI:
1. All GENE records derive from CBs
2. All GENE records have valid DNA sequences
3. All GENE records are expressible
4. All GENE records have semantic maps
```

---

## Navigation

- **Previous**: [Layer IV: CB Formation](../05-layer-IV-cb-formation/README.md)
- **Next**: [Layer VI: MODE-A Immune Gate](../07-layer-VI-mode-a-immune-gate/README.md)
- **Index**: [Main Specification](../README.md)
