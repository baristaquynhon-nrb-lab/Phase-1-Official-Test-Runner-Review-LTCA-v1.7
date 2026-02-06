# GeneDB — Memory Architecture

## Overview

GeneDB is the memory subsystem of the NRB Cognitive Stack. It stores and retrieves NRB-256 encoded genes that serve as the cognitive priors, lexicons, and frame hints used by the COP pipeline during runtime.

## Components

### Core
| File | Purpose |
|------|---------|
| `core/gene_encoder.js` | NRB-256 gene encoding |
| `core/gene_retriever.js` | Gene retrieval and lookup |
| `core/memory_consolidator.js` | Memory consolidation and deduplication |
| `core/genedb_engine.js` | Main GeneDB coordinator |

### Storage
| Directory | Purpose |
|-----------|---------|
| `storage/proto_nrb_genes/` | Pre-built genes from BCPL (offline) |
| `storage/runtime_genes/` | Dynamically added genes (runtime) |

## Data Flow

```
BCPL (offline) → Proto-NRB genes → storage/proto_nrb_genes/
COP (runtime) ↔ GeneDB Engine ↔ storage/runtime_genes/
```
