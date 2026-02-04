/**
 * Cognitive Operating System - Formal Specification
 * Main entry point
 *
 * Pipeline: CR_state → ARC → Reasoning → Meta_Input → Meta_State_Update
 */

// Canon utilities
export { canonicalJSON, canonicalize } from './canon/canonical_json.js';
export { sha256, hashObject, verifyHash, createHashChain, verifyHashChain } from './canon/hash.js';

// Core engines
export { CRStateReducerEngine } from './engines/cr_state_reducer_engine.js';
export { CRStateToARCEngine } from './engines/cr_state_to_arc_engine.js';
export { ReasoningExecutionEngine } from './engines/reasoning_execution_engine.js';
export { ReasoningToMetaEngine } from './engines/reasoning_to_meta_engine.js';
export { MetaEvaluationEngine } from './engines/meta_evaluation_engine.js';

// Guards
export { checkConstitutionalGuard } from './guards/constitutional_guard.js';
export { validateCRState } from './guards/invariant_checker.js';

// Rules
export { TEXT_RULES_V1 } from './rules/text_rules_v1.js';
