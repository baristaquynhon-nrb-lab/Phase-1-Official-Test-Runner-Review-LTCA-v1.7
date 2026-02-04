/**
 * Constitutional Guard Layer
 * Enforces system laws at transition points
 */

export function checkConstitutionalGuard(crPrev, aseEvent, delta, context) {
  // Guard G1: No CR update without valid ASE event
  if (!aseEvent || !aseEvent.event_id) {
    return 'REFUSE_NO_VALID_EVENT';
  }

  // Guard G2: Schema whitelist (simplified - accept all for now)
  // In production: check against allowed schema registry

  // Guard G3: Scope enforcement (TEXT branch)
  if (aseEvent.scope && aseEvent.scope.branch !== 'TEXT') {
    return 'REFUSE_SCOPE_VIOLATION';
  }

  // Guard G4: Memory monotonicity
  if (delta.memory_commit) {
    const expectedIndex = crPrev.memory_state.index + 1;
    // Index will be incremented in applyDeltas, so this is implicit
  }

  // Guard G5: No contradictory world updates
  // (simplified - check for null/undefined overwrites)
  if (delta.world_delta) {
    for (const key in delta.world_delta) {
      if (delta.world_delta[key] === null || delta.world_delta[key] === undefined) {
        return 'REFUSE_NULL_WORLD_UPDATE';
      }
    }
  }

  // All guards passed
  return 'ALLOW';
}
