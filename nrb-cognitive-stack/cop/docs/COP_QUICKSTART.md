# COP Quick Start Guide

## Prerequisites

- Node.js 18+
- No external dependencies required

## Running the CIL Runtime

```javascript
const { runPipeline } = require('./cil_runtime/cil_runtime_engine');
const lexicon = require('./cil_runtime/lexicons/lexicon_en.json');

const result = runPipeline('please help me', { lexicon });
console.log(result);
// → { type: 'meaning_frame', intent: '...', trace_hash: '...', ... }
```

## Running Tests

```bash
node tests/run_cop_tests.js
```

## Pipeline Stages

1. **Tokenize** — Break input into tokens
2. **Generate Potentials** — Look up candidate meanings
3. **Build Hypotheses** — Combine into interpretation candidates
4. **Evaluate Constraints** — Filter and score
5. **Build Meaning Frame** — Produce final output with trace hash
