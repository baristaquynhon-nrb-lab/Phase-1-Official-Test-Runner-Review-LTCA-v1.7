/**
 * COGNITIVE PIPELINE TEST SUITE
 * LTCA-NRBPL Cognitive Operating System
 *
 * Verification tests for:
 * 1. Deterministic rerun = same hash (LAW-005)
 * 2. Constitutional pass (7 Laws)
 * 3. Provenance chain intact (LAW-004)
 * 4. Replay identical state (LAW-005)
 */

const path = require('path');

// Import modules
const { canonicalHash } = require('../src/core/canonical_hash');
const { resetClock, deterministicTime } = require('../src/core/deterministic_clock');
const { resetAuditLogger, verifyAuditChain, getAuditTrail } = require('../src/core/audit_logger');

const { captureSignal, validateSignal } = require('../src/layers/layer1_signal');
const { extractTrace, validateTrace } = require('../src/layers/layer2_trace');
const { bindEvidence, sealEvidence, verifyEvidence, resetEvidenceChain } = require('../src/layers/layer3_evidence');
const { formCognitiveBlock, validateCB, CBType } = require('../src/layers/layer4_cb');
const { encodeGene, validateGene, clearGenePool } = require('../src/layers/layer5_gene');
const { modeAGate, VerificationStatus } = require('../src/layers/layer6_mode_a');
const { generateASE, commitASE, validateASE, resetASEState } = require('../src/layers/layer7_ase');
const { executeCognitiveState, resetRuntime, getState } = require('../src/layers/layer8_runtime');

const { executePipeline, resetPipeline, verifyPipelineDeterminism, getPipelineStatus, getProvenanceChain } = require('../src/pipeline/cognitive_pipeline');
const { verifyReplay, batchVerify } = require('../src/pipeline/replay_engine');
const { generateComplianceReport, clearViolations } = require('../src/constitutional/law_engine');
const { verifyDeterminism, verifyHashStability } = require('../src/constitutional/law_005_determinism');

/**
 * Test result tracking
 */
let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

/**
 * Assert helper
 */
function assert(condition, testName, details = '') {
  if (condition) {
    testsPassed++;
    testResults.push({ test: testName, status: 'PASS', details });
    console.log(`  ✓ ${testName}`);
  } else {
    testsFailed++;
    testResults.push({ test: testName, status: 'FAIL', details });
    console.log(`  ✗ ${testName} ${details ? `- ${details}` : ''}`);
  }
}

/**
 * Reset all state before each test group
 */
function resetAll() {
  resetPipeline();
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 1: DETERMINISM (LAW-005)
// ═══════════════════════════════════════════════════════════════════════════
function testDeterminism() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 1: DETERMINISM (LAW-005)                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Test 1.1: Hash stability
  console.log('► Test 1.1: Hash Stability');
  const testData = { message: 'test', value: 42 };
  const hashResult = verifyHashStability(testData, 10);
  assert(hashResult.stable, 'Canonical hash is stable across iterations');

  // Test 1.2: Same input produces same output
  console.log('\n► Test 1.2: Pipeline Determinism');
  resetAll();
  const input1 = { test: 'determinism', data: [1, 2, 3] };
  const deterministicResult = verifyPipelineDeterminism(input1);
  assert(deterministicResult.deterministic, 'Pipeline is deterministic');
  assert(deterministicResult.pipeline_hash_match, 'Pipeline hash matches across runs');
  assert(deterministicResult.stages_match, 'All stage hashes match');

  // Test 1.3: Function determinism verification
  console.log('\n► Test 1.3: Layer Function Determinism');
  resetAll();

  const signalFn = (input) => {
    resetClock();
    return captureSignal(input);
  };
  const signalDeterminism = verifyDeterminism(signalFn, { test: 'signal' }, 3);
  assert(signalDeterminism.deterministic, 'Signal capture is deterministic');

  // Test 1.4: Trace extraction determinism
  resetAll();
  const signal = captureSignal({ test: 'trace' });
  const traceFn = () => extractTrace(signal);
  const traceResult1 = traceFn();
  resetClock(signal.timestamp.logical);
  const traceResult2 = traceFn();
  assert(traceResult1.trace_hash === traceResult2.trace_hash, 'Trace extraction is deterministic');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 2: CONSTITUTIONAL COMPLIANCE (7 Laws)
// ═══════════════════════════════════════════════════════════════════════════
function testConstitutionalCompliance() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 2: CONSTITUTIONAL COMPLIANCE (7 Laws)            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  resetAll();

  // Execute a valid pipeline
  const input = { test: 'constitutional', value: 100 };
  const result = executePipeline(input);

  console.log('► Test 2.1: LAW-001 Evidence Required');
  assert(result.artifacts.evidence !== undefined, 'Evidence was created');
  assert(result.artifacts.evidence.sealed, 'Evidence is sealed');
  assert(result.artifacts.cb.evidence_id === result.artifacts.evidence.evid_id, 'CB references evidence');

  console.log('\n► Test 2.2: LAW-002 Temporal Causality');
  const evidTime = result.artifacts.evidence.timestamp.logical;
  const cbTime = result.artifacts.cb.timestamp.logical;
  const geneTime = result.artifacts.gene.timestamp.logical;
  assert(cbTime >= evidTime, 'CB timestamp >= Evidence timestamp');
  assert(geneTime >= cbTime, 'Gene timestamp >= CB timestamp');

  console.log('\n► Test 2.3: LAW-003 Non-Contradiction');
  assert(!result.artifacts.cb.contradicts || result.artifacts.cb.contradicts.length === 0,
    'No contradictions in CB');

  console.log('\n► Test 2.4: LAW-004 Provenance Chain');
  const provenance = getProvenanceChain(result);
  assert(provenance.length === 8, `Provenance chain has 8 layers (got ${provenance.length})`);
  assert(result.artifacts.gene.cb_hash === result.artifacts.cb.cb_hash, 'Gene links to CB');
  assert(result.artifacts.cb.evidence_hash === result.artifacts.evidence.seal_hash, 'CB links to Evidence');

  console.log('\n► Test 2.5: LAW-005 Determinism');
  const deterministicCheck = verifyPipelineDeterminism(input);
  assert(deterministicCheck.deterministic, 'Pipeline execution is deterministic');

  console.log('\n► Test 2.6: LAW-006 Resource Bounds');
  assert(result.artifacts.gene.dna_length < 10000, 'Gene DNA within bounds');

  console.log('\n► Test 2.7: LAW-007 Authority Chain');
  assert(result.artifacts.verification.ase_authorized, 'ASE was authorized by MODE-A');
  assert(result.artifacts.ase.authorization.authorization_hash !== null, 'ASE has authorization hash');

  console.log('\n► Test 2.8: MODE-A Gate Verification');
  assert(result.artifacts.verification.status === VerificationStatus.PASS, 'MODE-A gate passed');
  assert(result.artifacts.verification.violations.length === 0, 'No constitutional violations');

  console.log('\n► Test 2.9: Full Compliance Report');
  const status = getPipelineStatus();
  assert(status.compliance.system_compliant, 'System is constitutionally compliant');
  assert(status.compliance.total_violations === 0, 'Zero violations recorded');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 3: PROVENANCE CHAIN (LAW-004)
// ═══════════════════════════════════════════════════════════════════════════
function testProvenanceChain() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 3: PROVENANCE CHAIN (LAW-004)                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  resetAll();

  const input = { test: 'provenance', data: { nested: true } };
  const result = executePipeline(input);

  console.log('► Test 3.1: Audit Chain Integrity');
  const auditChain = verifyAuditChain();
  assert(auditChain.valid, 'Audit chain is valid');
  assert(auditChain.chain_length > 0, `Audit chain has entries (${auditChain.chain_length})`);

  console.log('\n► Test 3.2: Full Provenance Trace');
  const provenance = getProvenanceChain(result);

  // Verify layer order
  const expectedLayers = [
    'LAYER_I_SIGNAL', 'LAYER_II_TRACE', 'LAYER_III_EVIDENCE',
    'LAYER_IV_CB', 'LAYER_V_GENE', 'LAYER_VI_MODE_A',
    'LAYER_VII_ASE', 'LAYER_VIII_RUNTIME'
  ];

  for (let i = 0; i < expectedLayers.length; i++) {
    assert(provenance[i].layer === expectedLayers[i],
      `Layer ${i + 1} is ${expectedLayers[i]}`);
  }

  console.log('\n► Test 3.3: Evidence Chain of Custody');
  const custody = result.artifacts.evidence.chain_of_custody;
  assert(custody.length >= 2, `Evidence has custody chain (${custody.length} entries)`);
  assert(custody[custody.length - 1].action === 'SEALED', 'Last custody action is SEALED');

  console.log('\n► Test 3.4: Hash Linkage');
  // Signal → Trace
  assert(result.artifacts.trace.source_hash === result.artifacts.signal.hash,
    'Trace links to Signal');
  // Trace → Evidence
  assert(result.artifacts.evidence.source_trace_hash === result.artifacts.trace.trace_hash,
    'Evidence links to Trace');
  // Evidence → CB
  assert(result.artifacts.cb.evidence_hash === result.artifacts.evidence.seal_hash,
    'CB links to Evidence');
  // CB → Gene
  assert(result.artifacts.gene.cb_hash === result.artifacts.cb.cb_hash,
    'Gene links to CB');
  // Gene → ASE
  assert(result.artifacts.ase.gene_hash === result.artifacts.gene.gene_hash,
    'ASE links to Gene');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 4: REPLAY VERIFICATION (LAW-005)
// ═══════════════════════════════════════════════════════════════════════════
function testReplayVerification() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 4: REPLAY VERIFICATION (LAW-005)                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('► Test 4.1: Single Input Replay');
  const input1 = { replay: 'test1', value: 42 };
  const replayResult1 = verifyReplay(input1, null);
  assert(replayResult1.verified, 'Replay produces identical state');
  assert(replayResult1.replay_deterministic, 'Replay is deterministic');
  assert(replayResult1.stage_hashes_match, 'All stage hashes match on replay');

  console.log('\n► Test 4.2: Complex Input Replay');
  const input2 = {
    complex: true,
    nested: { a: 1, b: 2, c: { d: 3 } },
    array: [1, 'two', { three: 3 }]
  };
  const replayResult2 = verifyReplay(input2, null);
  assert(replayResult2.verified, 'Complex input replay verified');

  console.log('\n► Test 4.3: Batch Replay Verification');
  const testCases = [
    { input: { batch: 1 }, expectedHash: null },
    { input: { batch: 2, data: 'test' }, expectedHash: null },
    { input: { batch: 3, nested: { value: true } }, expectedHash: null }
  ];
  const batchResult = batchVerify(testCases);
  assert(batchResult.passed === batchResult.total, `Batch verification: ${batchResult.passed}/${batchResult.total} passed`);
  assert(batchResult.pass_rate === 1, 'Batch pass rate is 100%');

  console.log('\n► Test 4.4: State Consistency After Replay');
  resetAll();
  const stateInput = { state: 'test', id: 123 };
  const result1 = executePipeline(stateInput);
  const state1Hash = getState().state_hash;

  resetAll();
  const result2 = executePipeline(stateInput);
  const state2Hash = getState().state_hash;

  assert(state1Hash === state2Hash, 'Cognitive state hash identical after replay');
  assert(result1.pipeline_hash === result2.pipeline_hash, 'Pipeline hash identical');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 5: LAYER VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
function testLayerValidation() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 5: LAYER VALIDATION                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  resetAll();

  console.log('► Test 5.1: Signal Validation');
  const signal = captureSignal({ test: 'validation' });
  const signalValidation = validateSignal(signal);
  assert(signalValidation.valid, 'Signal passes validation');

  console.log('\n► Test 5.2: Trace Validation');
  const trace = extractTrace(signal);
  const traceValidation = validateTrace(trace);
  assert(traceValidation.valid, 'Trace passes validation');

  console.log('\n► Test 5.3: Evidence Validation');
  let evidence = bindEvidence(trace);
  evidence = sealEvidence(evidence);
  const evidenceValidation = verifyEvidence(evidence);
  assert(evidenceValidation.valid, 'Evidence passes validation');

  console.log('\n► Test 5.4: CB Validation');
  const cb = formCognitiveBlock(evidence, { cbType: CBType.FACT });
  const cbValidation = validateCB(cb);
  assert(cbValidation.valid, 'Cognitive Block passes validation');

  console.log('\n► Test 5.5: Gene Validation');
  const gene = encodeGene(cb);
  const geneValidation = validateGene(gene);
  assert(geneValidation.valid, 'Gene passes validation');

  console.log('\n► Test 5.6: MODE-A Verification');
  const verification = modeAGate(gene, cb, evidence);
  assert(verification.status === VerificationStatus.PASS, 'MODE-A verification passes');
  assert(verification.checks_passed === verification.checks_performed, 'All constitutional checks passed');

  console.log('\n► Test 5.7: ASE Validation');
  let ase = generateASE(verification, gene);
  ase = commitASE(ase);
  const aseValidation = validateASE(ase);
  assert(aseValidation.valid, 'ASE passes validation');

  console.log('\n► Test 5.8: Runtime Execution');
  const executionResult = executeCognitiveState(ase);
  assert(executionResult.success, 'Runtime execution succeeds');
  assert(executionResult.new_state.state_hash !== null, 'New state has valid hash');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST GROUP 6: ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════
function testErrorHandling() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST GROUP 6: ERROR HANDLING                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('► Test 6.1: Invalid Signal Input');
  let errorCaught = false;
  try {
    extractTrace({ type: 'INVALID' }); // Not a valid signal
  } catch (e) {
    errorCaught = e.message.includes('Invalid signal');
  }
  assert(errorCaught, 'Invalid signal throws appropriate error');

  console.log('\n► Test 6.2: Unsealed Evidence Rejection');
  resetAll();
  errorCaught = false;
  try {
    const signal = captureSignal({ test: 'unsealed' });
    const trace = extractTrace(signal);
    const unsealedEvidence = bindEvidence(trace);
    formCognitiveBlock(unsealedEvidence); // Should fail - evidence not sealed
  } catch (e) {
    errorCaught = e.message.includes('sealed');
  }
  assert(errorCaught, 'Unsealed evidence is rejected for CB formation');

  console.log('\n► Test 6.3: Unauthorized ASE Rejection');
  resetAll();
  errorCaught = false;
  try {
    const signal = captureSignal({ test: 'unauth' });
    const trace = extractTrace(signal);
    let evidence = bindEvidence(trace);
    evidence = sealEvidence(evidence);
    const cb = formCognitiveBlock(evidence);
    const gene = encodeGene(cb);
    // Try to generate ASE without MODE-A pass
    generateASE({ status: 'REJECT' }, gene);
  } catch (e) {
    errorCaught = e.message.includes('MODE-A') || e.message.includes('LAW-007');
  }
  assert(errorCaught, 'Unauthorized ASE generation throws LAW-007 error');
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════
function runAllTests() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  LTCA-NRBPL COGNITIVE PIPELINE TEST SUITE                    ║');
  console.log('║  Constitutional Forensic Verification                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Running all verification tests...');
  console.log('');

  const startTime = Date.now();

  // Run test groups
  testDeterminism();
  testConstitutionalCompliance();
  testProvenanceChain();
  testReplayVerification();
  testLayerValidation();
  testErrorHandling();

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Print summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`  Total tests:  ${testsPassed + testsFailed}`);
  console.log(`  Passed:       ${testsPassed}`);
  console.log(`  Failed:       ${testsFailed}`);
  console.log(`  Pass rate:    ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log(`  Duration:     ${duration}ms`);
  console.log('');

  if (testsFailed === 0) {
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log('  ✓ ALL TESTS PASSED - SYSTEM CONSTITUTIONALLY COMPLIANT');
    console.log('  ═══════════════════════════════════════════════════════════');
  } else {
    console.log('  ═══════════════════════════════════════════════════════════');
    console.log('  ✗ SOME TESTS FAILED - REVIEW REQUIRED');
    console.log('  ═══════════════════════════════════════════════════════════');

    console.log('\n  Failed tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    - ${r.test}${r.details ? `: ${r.details}` : ''}`);
    });
  }

  console.log('');

  // Exit with appropriate code
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
