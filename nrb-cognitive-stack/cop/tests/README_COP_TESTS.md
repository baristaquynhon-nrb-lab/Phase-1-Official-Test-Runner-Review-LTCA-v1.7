# COP Testing Infrastructure

## Overview

This directory contains all unit and integration tests for the COP pipeline.

## Test Files

| File | Tests |
|------|-------|
| `test_cil_help_request.js` | Help request interpretation through CIL |
| `test_surface_no_new_facts.js` | Surface generator no-new-facts constraint |
| `test_urgency_escalation.js` | Urgency level escalation logic |
| `test_vi_disambiguation.js` | Vietnamese language disambiguation |

## Running Tests

```bash
# Run all COP tests
node run_cop_tests.js

# Run individual test
node test_cil_help_request.js
```

## Fixtures

Test data is located in `/fixtures/`:
- `test_inputs.json` — Standard test inputs
- `expected_outputs.json` — Expected outputs for validation
