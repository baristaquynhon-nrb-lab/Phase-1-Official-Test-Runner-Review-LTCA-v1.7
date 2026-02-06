# COP Architecture Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

The Cognitive Operating Pipeline (COP) converts input symbols into semantically grounded Meaning Frames and generates surface-level natural language. It is the "language brain" of the NRB Cognitive Stack.

## 2. Layer Architecture

### L0: BCPL (Bilingual Corpus Processing Layer)
- **Mode**: Offline batch processing
- **Purpose**: Build proto-NRB genes from bilingual corpora
- **Output**: Proto-NRB genes stored in GeneDB

### L1: CIL Runtime Engine
- **Mode**: Real-time processing
- **Components**:
  - `tokenizer.js` — Input segmentation
  - `potential_generator.js` — Generate candidate interpretations
  - `hypothesis_builder.js` — Build structured hypotheses
  - `constraint_evaluator.js` — Apply linguistic/semantic constraints
  - `meaning_frame_builder.js` — Construct validated Meaning Frames

### L2: Meaning Frame Schemas
- **Purpose**: Canonical definitions of all recognized semantic frames
- **Format**: JSON Schema with required fields, urgency levels, evidence chains

### L3: Surface Generation
- **Purpose**: Convert Meaning Frames back to natural language
- **Constraint**: Surface output must not introduce facts not present in the Meaning Frame

## 3. Determinism Contract

Every CIL runtime execution produces:
- Identical Meaning_Frame for identical input
- SHA-256 trace_hash for audit verification
- Complete evidence chain from token to frame

## 4. Interface Points

- **PFT → COP**: Via pseudo-symbol input to tokenizer
- **COP → GSRA**: Via Meaning_Frame envelope
- **COP ↔ GeneDB**: Via memory recall/store interface
