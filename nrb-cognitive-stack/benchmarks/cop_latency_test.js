'use strict';

/**
 * COP Latency Benchmark — Measures CIL Runtime processing latency.
 */

const { runPipeline } = require('../cop/cil_runtime/cil_runtime_engine');
const lexicon = require('../cop/cil_runtime/lexicons/lexicon_en.json');

const ITERATIONS = 1000;
const input = 'please help me now';

console.log(`COP Latency Benchmark — ${ITERATIONS} iterations\n`);

const times = [];
for (let i = 0; i < ITERATIONS; i++) {
  const start = process.hrtime.bigint();
  runPipeline(input, { lexicon });
  const end = process.hrtime.bigint();
  times.push(Number(end - start) / 1e6); // Convert to ms
}

times.sort((a, b) => a - b);
const avg = times.reduce((a, b) => a + b, 0) / times.length;
const p50 = times[Math.floor(times.length * 0.5)];
const p95 = times[Math.floor(times.length * 0.95)];
const p99 = times[Math.floor(times.length * 0.99)];

console.log(`Average: ${avg.toFixed(3)} ms`);
console.log(`P50:     ${p50.toFixed(3)} ms`);
console.log(`P95:     ${p95.toFixed(3)} ms`);
console.log(`P99:     ${p99.toFixed(3)} ms`);
console.log(`Min:     ${times[0].toFixed(3)} ms`);
console.log(`Max:     ${times[times.length - 1].toFixed(3)} ms`);
