/**
 * Cognitive Operating System - Formal Specification
 * Main entry point
 */

export { canonicalJSON, canonicalize } from './canon/canonical_json.js';
export { sha256, hashObject, verifyHash, createHashChain, verifyHashChain } from './canon/hash.js';
export { CRStateReducerEngine } from './engines/cr_state_reducer_engine.js';
export { checkConstitutionalGuard } from './guards/constitutional_guard.js';
export { validateCRState } from './guards/invariant_checker.js';
