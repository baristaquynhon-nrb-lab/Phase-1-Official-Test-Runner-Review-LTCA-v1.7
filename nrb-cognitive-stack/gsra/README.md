# GSRA — Law-Tracking Cognitive Core

## Overview

GSRA (Governance, Safety, and Regulatory Architecture) is the law enforcement and safety governance subsystem of the NRB Cognitive Stack. It evaluates Meaning Frames from COP against a vault of safety, ethical, and intervention laws, and produces verdicts with action policies.

## Components

### Core Engine
| File | Purpose |
|------|---------|
| `core/evidence_binder.js` | Binds evidence from Meaning Frame to law conditions |
| `core/law_evaluator.js` | LEAE engine — evaluates laws against evidence |
| `core/coherence_gate.js` | Ensures coherence of evaluation results |
| `core/intervention_planner.js` | IPA engine — plans interventions |
| `core/gsra_engine.js` | Main GSRA coordinator |

### Law Vault
| File | Purpose |
|------|---------|
| `law_vault/safety_laws.json` | Safety-related laws |
| `law_vault/ethical_laws.json` | Ethical constraint laws |
| `law_vault/intervention_laws.json` | Intervention trigger laws |
| `law_vault/domain_policies.json` | Domain-specific policies |
| `law_vault/law_validator.js` | Law format validator |

### Adapters
| File | Purpose |
|------|---------|
| `adapters/cop_to_gsra_adapter.js` | COP → GSRA envelope processor |
| `adapters/gsra_response_formatter.js` | GSRA response formatting |

## Interface Contract

See `COP_GSRA_INTERFACE_SPEC_v1.0.md` for the formal contract between COP and GSRA.
