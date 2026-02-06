# BCPL Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

The Bilingual Corpus Processing Layer (BCPL) transforms raw bilingual corpora into proto-NRB genes suitable for storage in GeneDB.

## 2. Processing Pipeline

```
Raw Corpus → Formatter → Aligner → Tagger → Proto Frame Builder → NRB-256 Encoder → GeneDB
```

## 3. Input Format

- Bilingual text pairs (EN/VI)
- UTF-8 encoded
- One sentence per line, tab-separated pairs

## 4. Output Format

- NRB-256 encoded gene objects
- Canonical JSON serialization
- SHA-256 hash for each gene

## 5. Determinism

BCPL processing is fully deterministic: identical corpora produce identical gene sets with identical hashes.
