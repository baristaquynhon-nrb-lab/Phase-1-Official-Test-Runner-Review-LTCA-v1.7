# GeneDB Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

GeneDB provides persistent memory storage for the NRB Cognitive Stack. It manages NRB-256 encoded genes that represent learned linguistic patterns, semantic associations, and frame priors.

## 2. Gene Format

```json
{
  "type": "nrb256_gene",
  "hash": "SHA-256",
  "data": { ... },
  "encoded_at": "ISO-8601",
  "source": "bcpl|runtime",
  "access_count": 0,
  "last_accessed": null
}
```

## 3. Operations

### Store
- Encode data as NRB-256 gene
- Compute hash for deduplication
- Write to appropriate storage directory

### Retrieve
- Look up by hash or semantic query
- Update access metadata
- Return gene data

### Consolidate
- Merge duplicate genes
- Prune stale entries
- Recompute hashes after modifications

## 4. Storage Organization

- `proto_nrb_genes/`: Immutable genes from BCPL offline processing
- `runtime_genes/`: Mutable genes added during COP runtime

## 5. Determinism

Gene retrieval is deterministic: same query → same result set (ordered by hash).
