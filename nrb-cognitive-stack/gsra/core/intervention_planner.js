'use strict';

/**
 * IPA (Intervention Planning Architecture) — Plans interventions based on verdicts.
 */

function planIntervention(verdict, meaningFrame) {
  const plan = {
    action: 'NONE',
    priority: 0,
    rationale: '',
    requires_human: false
  };

  if (verdict === 'BLOCK') {
    plan.action = 'BLOCK_AND_NOTIFY';
    plan.priority = 5;
    plan.rationale = 'Safety law triggered — action blocked';
    plan.requires_human = true;
  } else if (verdict === 'MODIFY') {
    plan.action = 'MODIFY_AND_PROCEED';
    plan.priority = 3;
    plan.rationale = 'Policy modification required before proceeding';
  } else {
    plan.action = 'ALLOW';
    plan.priority = 0;
    plan.rationale = 'No laws triggered — action permitted';
  }

  // Escalate if urgency is high
  if (meaningFrame.urgency >= 4) {
    plan.priority = Math.max(plan.priority, 4);
    plan.requires_human = true;
  }

  return plan;
}

module.exports = { planIntervention };
