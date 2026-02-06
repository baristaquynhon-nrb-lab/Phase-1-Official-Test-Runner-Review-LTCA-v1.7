# BCPL — Bilingual Corpus Processing Layer (L0)

## Overview

BCPL is the offline processing layer that builds proto-NRB genes from bilingual (English/Vietnamese) corpora. These genes are stored in GeneDB and used by the CIL Runtime during real-time processing.

## Components

| File | Purpose |
|------|---------|
| `formatter.js` | Normalize corpus text format |
| `aligner.js` | Bilingual sentence/phrase alignment |
| `tagger.js` | POS and semantic tagging |
| `proto_frame_builder.js` | Build proto-frames from aligned data |
| `nrb256_encoder.js` | Encode proto-frames as NRB-256 genes |

## Tools

| File | Purpose |
|------|---------|
| `tools/corpus_validator.js` | Validate corpus format and completeness |
| `tools/alignment_inspector.js` | Inspect and debug alignment quality |

## Output

Proto-NRB genes → `genedb/storage/proto_nrb_genes/`
