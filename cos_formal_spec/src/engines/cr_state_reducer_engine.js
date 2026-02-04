/**
 * CR State Reducer Engine v1.0
 * Implements deterministic state transition: δ_CR(S_t, ASE_event) → S_{t+1}
 */

import { hashObject } from '../canon/hash.js';
import { validateCRState } from '../guards/invariant_checker.js';
import { checkConstitutionalGuard } from '../guards/constitutional_guard.js';

export class CRStateReducerEngine {
  constructor(config = {}) {
    this.config = config;
    this.version = 'cr_state_reducer_v1.0';
  }

  /**
   * Main state transition function
   * @param {Object} crPrev - Previous CR state
   * @param {Object} aseEvent - ASE event
   * @param {Object} context - Runtime context
   * @returns {Object} - { verdict, crNext, delta, audit }
   */
  reduce(crPrev, aseEvent, context = {}) {
    // Step 1: Validate inputs
    const inputValidation = this.validateInputs(crPrev, aseEvent);
    if (!inputValidation.valid) {
      return this.refuse(inputValidation.reason);
    }

    // Step 2: Derive deltas
    const delta = this.deriveDeltas(crPrev, aseEvent);

    // Step 3: Constitutional guard check
    const guardVerdict = checkConstitutionalGuard(crPrev, aseEvent, delta, context);
    if (guardVerdict !== 'ALLOW') {
      return this.refuse(`CONSTITUTIONAL_GUARD_REFUSE: ${guardVerdict}`);
    }

    // Step 4: Apply deltas
    const crNext = this.applyDeltas(crPrev, delta);

    // Step 5: Canonicalize and hash
    const crNextHash = hashObject(crNext);
    crNext.state_hash = crNextHash;

    // Step 6: Validate invariants
    const invariantCheck = validateCRState(crNext);
    if (!invariantCheck.valid) {
      return this.refuse(`INVARIANT_VIOLATION: ${invariantCheck.reason}`);
    }

    // Step 7: Create audit record
    const audit = this.createAuditRecord(crPrev, crNext, aseEvent, delta, context);

    return {
      verdict: 'APPLIED',
      crNext,
      delta,
      audit
    };
  }

  validateInputs(crPrev, aseEvent) {
    if (!crPrev || typeof crPrev !== 'object') {
      return { valid: false, reason: 'INVALID_CR_STATE' };
    }
    if (!aseEvent || !aseEvent.event_id || !aseEvent.schema_id) {
      return { valid: false, reason: 'INVALID_ASE_EVENT' };
    }
    return { valid: true };
  }

  deriveDeltas(crPrev, aseEvent) {
    const delta = {
      world_delta: {},
      agent_delta: {},
      memory_commit: {},
      resource_delta: {}
    };

    // World delta (from ASE dynamics)
    if (aseEvent.dynamics && aseEvent.dynamics.world_delta) {
      delta.world_delta = aseEvent.dynamics.world_delta;
    }

    // Agent delta
    if (aseEvent.dynamics && aseEvent.dynamics.agent_delta) {
      delta.agent_delta = aseEvent.dynamics.agent_delta;
    }

    // Memory commit (always append event)
    // Use event timestamp if provided for determinism, otherwise use current time
    // Note: For deterministic replay, events should include timestamps
    delta.memory_commit = {
      event_id: aseEvent.event_id,
      schema_id: aseEvent.schema_id,
      timestamp: aseEvent.timestamp || 'DETERMINISTIC'
    };

    // Resource delta (simple cost model)
    delta.resource_delta = {
      cost: 0.01 // minimal cost per event
    };

    return delta;
  }

  applyDeltas(crPrev, delta) {
    const crNext = JSON.parse(JSON.stringify(crPrev)); // deep copy

    // Apply world delta
    Object.assign(crNext.world_state, delta.world_delta);

    // Apply agent delta
    Object.assign(crNext.agent_state, delta.agent_delta);

    // Update resources
    if (delta.resource_delta.cost) {
      crNext.agent_state.resource_level = Math.max(
        0,
        crNext.agent_state.resource_level - delta.resource_delta.cost
      );
    }

    // Commit to memory (append-only)
    crNext.memory_state.events.push(delta.memory_commit);
    crNext.memory_state.index += 1;

    return crNext;
  }

  createAuditRecord(crPrev, crNext, aseEvent, delta, context) {
    return {
      stage: 'CR_TRANSITION',
      timestamp: new Date().toISOString(),
      input_hash: hashObject({ crPrev, aseEvent }),
      output_hash: crNext.state_hash,
      payload: {
        event_id: aseEvent.event_id,
        schema_id: aseEvent.schema_id,
        delta,
        cr_prev_hash: crPrev.state_hash,
        cr_next_hash: crNext.state_hash
      },
      runtime: {
        engine_version: this.version,
        ...context
      }
    };
  }

  refuse(reason) {
    return {
      verdict: 'REFUSE',
      reason,
      crNext: null,
      delta: null,
      audit: {
        stage: 'CR_TRANSITION',
        timestamp: new Date().toISOString(),
        verdict: 'REFUSE',
        reason
      }
    };
  }
}
