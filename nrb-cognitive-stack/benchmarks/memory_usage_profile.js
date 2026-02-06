'use strict';

/**
 * Memory Usage Profile — Profiles memory usage of stack components.
 */

const { runPipeline } = require('../cop/cil_runtime/cil_runtime_engine');
const { encodeGene } = require('../genedb/core/gene_encoder');
const lexicon = require('../cop/cil_runtime/lexicons/lexicon_en.json');

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

console.log('Memory Usage Profile\n');

// Baseline
const baseline = process.memoryUsage();
console.log('Baseline:');
console.log(`  RSS: ${formatBytes(baseline.rss)}`);
console.log(`  Heap Used: ${formatBytes(baseline.heapUsed)}`);

// After COP processing
for (let i = 0; i < 100; i++) {
  runPipeline('help me please', { lexicon });
}
const afterCop = process.memoryUsage();
console.log('\nAfter 100 COP runs:');
console.log(`  RSS: ${formatBytes(afterCop.rss)} (+${formatBytes(afterCop.rss - baseline.rss)})`);
console.log(`  Heap Used: ${formatBytes(afterCop.heapUsed)} (+${formatBytes(afterCop.heapUsed - baseline.heapUsed)})`);

// After GeneDB encoding
for (let i = 0; i < 1000; i++) {
  encodeGene({ word: `word_${i}`, sense: 'TEST' }, 'runtime');
}
const afterGene = process.memoryUsage();
console.log('\nAfter 1000 gene encodings:');
console.log(`  RSS: ${formatBytes(afterGene.rss)} (+${formatBytes(afterGene.rss - afterCop.rss)})`);
console.log(`  Heap Used: ${formatBytes(afterGene.heapUsed)} (+${formatBytes(afterGene.heapUsed - afterCop.heapUsed)})`);
