/**
 * TEXT_RULE_LIBRARY_v1
 * Deterministic rules over ARC.trigger_facts + ARC.state_features + ARC.event_focus
 *
 * All rules are pure functions: no IO, no random, no time dependency
 */

/**
 * Helper: find fact value by type
 */
function factValue(arc, factType) {
  const f = (arc.trigger_facts || []).find(x => x.fact_type === factType);
  return f ? f.value : null;
}

/**
 * Helper: check if fact exists
 */
function hasFact(arc, factType) {
  return (arc.trigger_facts || []).some(x => x.fact_type === factType);
}

/**
 * Helper: clamp value to [0, 1]
 */
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export const TEXT_RULES_V1 = {
  /**
   * R_SUPPORT_DEPENDENCY_RISK
   * Detect risk: repeated support → dependency → agent harm
   */
  R_SUPPORT_DEPENDENCY_RISK: {
    rule_id: 'R_SUPPORT_DEPENDENCY_RISK',
    description: 'Detect risk: repeated support may create dependency and potential agent harm',
    precondition: (arc) => {
      const schema = arc.event_focus?.schema_id || null;
      // Only fires for support-related events
      return (
        schema === 'SOCIAL_SUPPORT_EVENT' ||
        schema === 'HELP_REQUEST' ||
        schema === 'HELP_PROVIDED'
      );
    },
    apply: (arc) => {
      // Deterministic: derive a risk score from meta_ksi/conflict/resource
      const ksi = arc.state_features?.meta_ksi ?? 1.0;
      const conflict = arc.state_features?.meta_conflict_density ?? 0.0;
      const resource = arc.state_features?.agent_resource_level ?? 1.0;

      // Simple bounded mapping (deterministic)
      // risk = clamp((1 - ksi) + conflict + (1 - resource) * 0.3, 0, 1)
      const raw = (1 - ksi) + conflict + (1 - resource) * 0.3;
      const risk = clamp01(raw);

      // Check for explicit dependency/harm facts
      const hasDependencyRisk = hasFact(arc, 'DEPENDENCY_RISK_PRESENT');
      const hasHarmRisk = hasFact(arc, 'AGENT_HARM_RISK_PRESENT');

      // Adjust risk if explicit facts present
      const adjustedRisk = clamp01(
        risk + (hasDependencyRisk ? 0.15 : 0) + (hasHarmRisk ? 0.10 : 0)
      );

      const conclusion = {
        conclusion_id: 'C_DEPENDENCY_RISK',
        type: 'RISK_ASSESSMENT',
        claim: 'Over-support may increase dependency and harm risk',
        confidence: clamp01(0.5 + 0.5 * (1 - adjustedRisk)),
        metrics: {
          risk_score: adjustedRisk,
          ksi_factor: ksi,
          conflict_factor: conflict,
          dependency_flag: hasDependencyRisk,
          harm_flag: hasHarmRisk
        }
      };

      return {
        verdict: 'FIRED',
        outputs: [conclusion]
      };
    }
  },

  /**
   * R_CALIBRATE_SUPPORT
   * Propose calibrated support strategy when dependency risk exists
   */
  R_CALIBRATE_SUPPORT: {
    rule_id: 'R_CALIBRATE_SUPPORT',
    description: 'Propose calibrated support strategy when dependency risk exists',
    precondition: (arc) => {
      const schema = arc.event_focus?.schema_id || null;
      return (
        schema === 'SOCIAL_SUPPORT_EVENT' ||
        schema === 'HELP_REQUEST' ||
        schema === 'HELP_PROVIDED' ||
        schema === 'FEEDBACK_EVENT'
      );
    },
    apply: (arc) => {
      const ksi = arc.state_features?.meta_ksi ?? 1.0;
      const conflict = arc.state_features?.meta_conflict_density ?? 0.0;
      const resource = arc.state_features?.agent_resource_level ?? 1.0;

      const raw = (1 - ksi) + conflict + (1 - resource) * 0.3;
      const risk = clamp01(raw);

      // Deterministic branching on risk thresholds
      let strategy;
      let strategyType;

      if (risk >= 0.5) {
        // High risk: aggressive calibration
        strategy = [
          'LIMIT_DIRECT_ASSIST',
          'PROMPT_RESPONSIBILITY',
          'GRADUAL_WITHDRAWAL',
          'MONITOR_DEPENDENCY_SIGNALS'
        ];
        strategyType = 'HIGH_RISK_CALIBRATION';
      } else if (risk >= 0.3) {
        // Moderate risk: cautious approach
        strategy = [
          'LIMIT_DIRECT_ASSIST',
          'PROMPT_RESPONSIBILITY',
          'GRADUAL_WITHDRAWAL'
        ];
        strategyType = 'MODERATE_RISK_CALIBRATION';
      } else {
        // Low risk: continue with monitoring
        strategy = [
          'CONTINUE_SUPPORT',
          'MONITOR_AUTONOMY_SIGNAL'
        ];
        strategyType = 'LOW_RISK_CONTINUATION';
      }

      return {
        verdict: 'FIRED',
        outputs: [{
          conclusion_id: 'C_SUPPORT_STRATEGY',
          type: 'STRATEGY',
          claim: 'Support should be calibrated to preserve autonomy',
          strategy,
          strategy_type: strategyType,
          confidence: clamp01(0.6 + 0.4 * (1 - risk)),
          metrics: {
            risk_score: risk,
            strategy_count: strategy.length
          }
        }]
      };
    }
  },

  /**
   * R_RESOURCE_CONSERVATION
   * Recommend resource conservation when agent resources are low
   */
  R_RESOURCE_CONSERVATION: {
    rule_id: 'R_RESOURCE_CONSERVATION',
    description: 'Recommend resource conservation when agent resources are low',
    precondition: (arc) => {
      const resourceLevel = arc.state_features?.agent_resource_level ?? 1.0;
      return resourceLevel < 0.4;
    },
    apply: (arc) => {
      const resource = arc.state_features?.agent_resource_level ?? 1.0;
      const urgency = clamp01(1 - resource * 2); // Higher urgency when lower resources

      return {
        verdict: 'FIRED',
        outputs: [{
          conclusion_id: 'C_RESOURCE_ALERT',
          type: 'RESOURCE_RECOMMENDATION',
          claim: 'Agent resources are low; conservation recommended',
          urgency,
          recommendations: [
            'REDUCE_COMPLEXITY',
            'DEFER_NON_CRITICAL',
            'REQUEST_RESOURCE_REPLENISHMENT'
          ],
          confidence: 0.85,
          metrics: {
            current_resource: resource,
            urgency_level: urgency
          }
        }]
      };
    }
  }
};

export default TEXT_RULES_V1;
