# Determinism Guarantees

## Overview

The NRB Cognitive Stack provides the following determinism guarantees across all subsystems.

## 1. Hash Stability

Same input → Same `trace_hash`

Every processing stage produces a SHA-256 trace hash computed from the canonical JSON representation of its output. Identical inputs always produce identical hashes.

## 2. Canonical JSON

All objects are serialized deterministically using sorted key ordering. This ensures hash stability regardless of the order in which object properties are created.

## 3. No Hidden State

All state is explicit in the interface contracts. No subsystem maintains implicit state that could affect output. Every dependency is passed as an explicit parameter.

## 4. Audit Trails

Every decision is traceable to its source through chain-hashed forensic log entries. The audit chain can be independently verified by recomputing hashes from the logged data.

## 5. Verification

```javascript
const { checkDeterminism } = require('./common/validation/determinism_checker');

const result = checkDeterminism(myFunction, myInput, 100);
console.log(result.deterministic); // true
console.log(result.unique_hashes); // 1
```
