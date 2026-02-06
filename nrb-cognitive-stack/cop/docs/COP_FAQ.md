# COP Frequently Asked Questions

## Q: What is a Meaning Frame?
A Meaning Frame is a structured semantic representation of understood input. It contains the detected intent, confidence, urgency level, evidence chain, and a trace hash for audit.

## Q: What does "No New Facts" mean?
The Surface Generator (L3) must not introduce information that is not grounded in the Meaning Frame. This prevents hallucination and ensures output fidelity.

## Q: How is determinism guaranteed?
All CIL Runtime stages are pure functions. Given identical input and lexicons, the output (including trace_hash) is always identical.

## Q: What languages are supported?
English (en) and Vietnamese (vi) are supported natively at the architecture level.

## Q: What happens when intent can't be determined?
The pipeline produces an `UNKNOWN_INTENT` frame with full trace evidence, allowing downstream systems to handle gracefully.

## Q: How does COP interact with GSRA?
COP produces a Meaning Frame which is wrapped in an envelope and sent to GSRA via the `cop_to_gsra_adapter.js`. GSRA evaluates it against safety laws and returns a verdict.
