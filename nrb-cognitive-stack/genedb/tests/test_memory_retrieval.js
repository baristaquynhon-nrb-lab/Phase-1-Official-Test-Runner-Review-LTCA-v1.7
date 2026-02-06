'use strict';

/**
 * Test: Memory Retrieval — Tests gene retrieval from GeneDB.
 */

const { encodeGene } = require('../core/gene_encoder');
const { retrieveByHash } = require('../core/gene_retriever');

function run() {
  console.log('  [test_memory_retrieval]');

  const data = { word: 'emergency', sense: 'URGENT_SITUATION', language: 'en' };
  const gene = encodeGene(data, 'bcpl');
  const store = [gene];

  const retrieved = retrieveByHash(store, gene.hash);
  let passed = true;

  if (!retrieved) {
    console.log('  FAIL: should retrieve gene by hash');
    passed = false;
  }

  if (retrieved && retrieved.access_count !== 1) {
    console.log('  FAIL: access_count should be 1 after retrieval');
    passed = false;
  }

  const notFound = retrieveByHash(store, 'nonexistent_hash');
  if (notFound !== null) {
    console.log('  FAIL: should return null for missing hash');
    passed = false;
  }

  if (passed) console.log('  PASS: Memory retrieval works correctly');
  return passed;
}

module.exports = { run };

if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
