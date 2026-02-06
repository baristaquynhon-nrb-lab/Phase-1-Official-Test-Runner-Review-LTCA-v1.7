# Deployment Guide

## Prerequisites

- Node.js 18 or later
- No external npm dependencies required (zero-dependency architecture)

## Installation

```bash
git clone <repository-url>
cd nrb-cognitive-stack
```

## Running Tests

```bash
# COP unit tests
node cop/tests/run_cop_tests.js

# GSRA law evaluation tests
node gsra/tests/test_law_evaluation.js

# Full integration test
node integration/tests/test_full_pipeline.js

# All tests
npm test
```

## Schema Validation

```bash
node common/validation/schema_validator.js --all
```

## Audit Trail

```bash
node common/logging/audit_trail.js --export
```

## Benchmarks

```bash
node benchmarks/cop_latency_test.js
node benchmarks/gsra_throughput_test.js
node benchmarks/memory_usage_profile.js
```

## Configuration

The stack uses no environment variables or external configuration files. All configuration is embedded in the lexicons, law vault, and schema definitions.
