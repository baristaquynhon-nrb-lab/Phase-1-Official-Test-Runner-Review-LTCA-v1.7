# NRB Cognitive Stack — System Overview

## What is the NRB Cognitive Stack?

The NRB Cognitive Stack is a modular, deterministic cognitive architecture designed for safe, auditable human-AI interaction. It processes perceptual inputs through a structured pipeline that ensures every decision is traceable, every output is grounded, and every action is governed by explicit safety laws.

## Core Subsystems

### COP (Cognitive Operating Pipeline)
The "language brain" — transforms input symbols into semantically grounded Meaning Frames and generates surface-level natural language responses.

### GSRA (Governance, Safety, and Regulatory Architecture)
The "safety governor" — evaluates all Meaning Frames against a structured vault of safety, ethical, and intervention laws before allowing actions.

### PFT (Perception Field Tracking)
The "perception processor" — converts raw sensor data (camera, microphone, motion) into pseudo-symbols that COP can process.

### GeneDB (Gene Database)
The "memory system" — stores and retrieves NRB-256 encoded genes that serve as cognitive priors, lexicons, and frame hints.

## Design Principles

1. **Determinism by Default**: Identical inputs always produce identical outputs
2. **Separation of Concerns**: Each subsystem has exactly one responsibility
3. **Contract-First Design**: All inter-system communication via formal interfaces
4. **Safety as Governance**: GSRA is independent, not embedded in COP
5. **Bilingual Native**: English/Vietnamese at the architectural level
6. **Full Auditability**: Every decision traceable via forensic logging
