# CIL Runtime Engine Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

The CIL Runtime Engine performs real-time semantic interpretation of input symbols. It is the core processing layer (L1) of the Cognitive Operating Pipeline.

## 2. Pipeline Stages

### Stage 1: Tokenizer
- Segments raw input into tokens
- Normalizes Unicode, whitespace
- Identifies language (EN/VI)

### Stage 2: Potential Generator (POTENTIAL_GENERATOR_v1.0)
- Generates candidate interpretations for each token
- Consults lexicons and MWE dictionaries
- Produces a potential set (ordered by likelihood)

### Stage 3: Hypothesis Builder (HYPOTHESIS_BUILDER_v1.0)
- Combines token potentials into structured hypotheses
- Considers MWE spans, syntactic patterns
- Produces ranked hypothesis list

### Stage 4: Constraint Evaluator (CONSTRAINT_EVALUATOR_v1.0)
- Applies linguistic and semantic constraints
- Filters incompatible hypotheses
- Adjusts urgency scoring based on urgency cues

### Stage 5: Meaning Frame Builder (MEANING_FRAME_BUILDER_v1.0)
- Constructs the final Meaning_Frame from the top hypothesis
- Validates against schema (L2)
- Computes trace_hash for audit

## 3. Determinism

All stages are pure functions over their inputs. No randomness, no external state.

## 4. Error Handling

If no valid hypothesis survives constraint evaluation, the engine produces an UNKNOWN_INTENT frame with full trace evidence.
