'use strict';

/**
 * Test: Gene Encoding — Tests NRB-256 gene encoding.
 */

const { encodeGene, computeHash } = require('../core/gene_encoder');

function run() {
  console.log('  [test_gene_encoding]');

  const data = { word: 'help', sense: 'REQUEST_ASSISTANCE', language: 'en' };
  const gene = encodeGene(data, 'bcpl');

  let passed = true;

  if (gene.type !== 'nrb256_gene') {
    console.log('  FAIL: gene type should be nrb256_gene');
    passed = false;
  }

  if (!gene.hash || gene.hash.length !== 64) {
    console.log('  FAIL: gene hash should be 64-char hex');
    passed = false;
  }

  // Determinism check
  const hash2 = computeHash(data);
  if (gene.hash !== hash2) {
    console.log('  FAIL: encoding should be deterministic');
    passed = false;
  }

  if (passed) console.log('  PASS: Gene encoding works correctly');
  return passed;
}

module.exports = { run };

if (require.main === module) {
  const passed = run();
  process.exit(passed ? 0 : 1);
}
