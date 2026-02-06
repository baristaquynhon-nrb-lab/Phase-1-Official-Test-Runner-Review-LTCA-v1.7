'use strict';

/**
 * GSRA Throughput Benchmark — Measures law evaluation throughput.
 */

const { processEnvelope } = require('../gsra/core/gsra_engine');

const ITERATIONS = 1000;

const envelope = {
  envelope_type: 'cop_to_gsra',
  version: '1.0',
  meaning_frame: {
    type: 'meaning_frame',
    intent: 'HELP_REQUEST',
    urgency: 3,
    confidence: 0.8,
    trace_hash: 'benchmark_hash'
  }
};

const lawVault = {
  safety_laws: require('../gsra/law_vault/safety_laws.json'),
  ethical_laws: require('../gsra/law_vault/ethical_laws.json'),
  intervention_laws: require('../gsra/law_vault/intervention_laws.json'),
  domain_policies: require('../gsra/law_vault/domain_policies.json')
};

console.log(`GSRA Throughput Benchmark — ${ITERATIONS} iterations\n`);

const start = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  processEnvelope(envelope, lawVault);
}
const end = process.hrtime.bigint();

const totalMs = Number(end - start) / 1e6;
const throughput = (ITERATIONS / totalMs) * 1000;

console.log(`Total time: ${totalMs.toFixed(1)} ms`);
console.log(`Throughput: ${throughput.toFixed(0)} evaluations/sec`);
console.log(`Avg latency: ${(totalMs / ITERATIONS).toFixed(3)} ms`);
