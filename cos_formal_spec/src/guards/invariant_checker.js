/**
 * Invariant Checker
 * Validates CR state invariants
 */

export function validateCRState(crState) {
  // I1: State hash matches canonical state
  // (checked after hashing in reducer)

  // I2: Memory append-only (index monotonic)
  if (crState.memory_state.index < 0) {
    return { valid: false, reason: 'MEMORY_INDEX_NEGATIVE' };
  }
  if (crState.memory_state.events.length !== crState.memory_state.index) {
    return { valid: false, reason: 'MEMORY_LENGTH_MISMATCH' };
  }

  // I3: No contradictory state assignments (simplified)
  // (deeper checks would validate schema constraints)

  // I4: Meta-state bounds respected
  const meta = crState.meta_state;
  if (meta.ksi < 0 || meta.ksi > 1) {
    return { valid: false, reason: 'META_KSI_OUT_OF_BOUNDS' };
  }
  if (meta.conflict_density < 0 || meta.conflict_density > 1) {
    return { valid: false, reason: 'META_CONFLICT_OUT_OF_BOUNDS' };
  }
  if (meta.drift_level < 0 || meta.drift_level > 1) {
    return { valid: false, reason: 'META_DRIFT_OUT_OF_BOUNDS' };
  }
  if (meta.cognitive_stress < 0 || meta.cognitive_stress > 1) {
    return { valid: false, reason: 'META_STRESS_OUT_OF_BOUNDS' };
  }

  return { valid: true };
}
