/**
 * COGNITIVE PIPELINE
 * LTCA-NRBPL Cognitive Operating System
 *
 * End-to-end deterministic cognitive processing pipeline
 *
 * Pipeline Flow:
 * ΔC → TRACE → EVID → CB → GENE → MODE-A → ASE → CR
 *
 * LAW-001: Evidence Required (enforced at each stage)
 * LAW-004: Provenance Chain (linked throughout)
 * LAW-005: Determinism (same input = same output)
 * LAW-007: Authority Chain (MODE-A gate)
 */

const { canonicalHash } = require('../core/canonical_hash');
const { deterministicTime, resetClock } = require('../core/deterministic_clock');
const { auditLog, resetAuditLogger, verifyAuditChain, getAuditTrail } = require('../core/audit_logger');

// Layer imports
const { captureSignal, validateSignal, SignalType } = require('../layers/layer1_signal');
const { extractTrace, validateTrace } = require('../layers/layer2_trace');
const { bindEvidence, sealEvidence, verifyEvidence, resetEvidenceChain } = require('../layers/layer3_evidence');
const { formCognitiveBlock, validateCB, CBType } = require('../layers/layer4_cb');
const { encodeGene, validateGene, clearGenePool } = require('../layers/layer5_gene');
const { modeAGate, VerificationStatus } = require('../layers/layer6_mode_a');
const { generateASE, commitASE, validateASE, resetASEState } = require('../layers/layer7_ase');
const { executeCognitiveState, getState, resetRuntime, generateFeedback, CognitiveState } = require('../layers/layer8_runtime');

// Constitutional imports
const { checkCompliance, generateComplianceReport, clearViolations } = require('../constitutional/law_engine');

/**
 * Pipeline execution result
 */
class PipelineResult {
  constructor() {
    this.success = false;
    this.stages = [];
    this.artifacts = {};
    this.execution_time = null;
    this.pipeline_hash = null;
    this.feedback = null;
    this.errors = [];
  }

  addStage(name, artifact, duration) {
    this.stages.push({
      stage: name,
      artifact_type: artifact?.type || 'UNKNOWN',
      artifact_id: artifact?.signal_id || artifact?.trace_id || artifact?.evid_id ||
                   artifact?.cb_id || artifact?.gene_id || artifact?.ase_id || null,
      artifact_hash: artifact?.hash || artifact?.trace_hash || artifact?.evid_hash ||
                     artifact?.cb_hash || artifact?.gene_hash || artifact?.ase_hash || null,
      duration_ms: duration,
      timestamp: deterministicTime()
    });
  }

  addError(stage, error) {
    this.errors.push({
      stage,
      error: error.message || String(error),
      timestamp: deterministicTime()
    });
  }

  finalize() {
    this.success = this.errors.length === 0;
    // LAW-005: Exclude non-deterministic values (duration_ms) from hash
    const deterministicStages = this.stages.map(s => ({
      stage: s.stage,
      artifact_type: s.artifact_type,
      artifact_id: s.artifact_id,
      artifact_hash: s.artifact_hash
      // Exclude: duration_ms, timestamp (non-deterministic)
    }));
    this.pipeline_hash = canonicalHash({
      stages: deterministicStages,
      artifacts: Object.keys(this.artifacts).sort(),
      success: this.success
    });
  }
}

/**
 * Execute full cognitive pipeline
 * ΔC → TRACE → EVID → CB → GENE → MODE-A → ASE → CR
 *
 * @param {any} input - Raw input data
 * @param {object} options - Pipeline options
 * @returns {PipelineResult} Pipeline execution result
 */
function executePipeline(input, options = {}) {
  const {
    cbType = CBType.FACT,
    aseOperation = 'CREATE',
    asePayload = {},
    signalSource = 'PIPELINE',
    signalType = SignalType.SYSTEM
  } = options;

  const result = new PipelineResult();
  const startTime = process.hrtime.bigint();

  try {
    // ═══════════════════════════════════════════════════════════
    // STAGE 1: SIGNAL CAPTURE (Layer I)
    // ═══════════════════════════════════════════════════════════
    let stageStart = process.hrtime.bigint();
    const signal = captureSignal(input, {
      source: signalSource,
      type: signalType
    });
    result.addStage('LAYER_I_SIGNAL', signal, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.signal = signal;

    // Validate
    const signalValidation = validateSignal(signal);
    if (!signalValidation.valid) {
      throw new Error(`Signal validation failed: ${signalValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 2: TRACE EXTRACTION (Layer II)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    const trace = extractTrace(signal);
    result.addStage('LAYER_II_TRACE', trace, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.trace = trace;

    // Validate
    const traceValidation = validateTrace(trace);
    if (!traceValidation.valid) {
      throw new Error(`Trace validation failed: ${traceValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 3: EVIDENCE BINDING (Layer III)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    let evidence = bindEvidence(trace, { authority: 'PIPELINE' });
    evidence = sealEvidence(evidence);
    result.addStage('LAYER_III_EVIDENCE', evidence, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.evidence = evidence;

    // Validate
    const evidenceValidation = verifyEvidence(evidence);
    if (!evidenceValidation.valid) {
      throw new Error(`Evidence validation failed: ${evidenceValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 4: CB FORMATION (Layer IV)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    const cb = formCognitiveBlock(evidence, { cbType });
    result.addStage('LAYER_IV_CB', cb, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.cb = cb;

    // Validate
    const cbValidation = validateCB(cb);
    if (!cbValidation.valid) {
      throw new Error(`CB validation failed: ${cbValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 5: GENE ENCODING (Layer V)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    const gene = encodeGene(cb);
    result.addStage('LAYER_V_GENE', gene, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.gene = gene;

    // Validate
    const geneValidation = validateGene(gene);
    if (!geneValidation.valid) {
      throw new Error(`Gene validation failed: ${geneValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 6: MODE-A GATE (Layer VI) - CONSTITUTIONAL CHECK
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    const verification = modeAGate(gene, cb, evidence);
    result.addStage('LAYER_VI_MODE_A', verification, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.verification = verification;

    // Check MODE-A pass
    if (verification.status !== VerificationStatus.PASS) {
      throw new Error(`MODE-A gate rejected: ${verification.violations.map(v => v.law).join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 7: ASE GENERATION (Layer VII)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    let ase = generateASE(verification, gene, {
      operation: aseOperation,
      payload: asePayload
    });
    ase = commitASE(ase);
    result.addStage('LAYER_VII_ASE', ase, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.ase = ase;

    // Validate
    const aseValidation = validateASE(ase);
    if (!aseValidation.valid) {
      throw new Error(`ASE validation failed: ${aseValidation.errors.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE 8: COGNITIVE RUNTIME (Layer VIII)
    // ═══════════════════════════════════════════════════════════
    stageStart = process.hrtime.bigint();
    const executionResult = executeCognitiveState(ase);
    result.addStage('LAYER_VIII_RUNTIME', executionResult, Number(process.hrtime.bigint() - stageStart) / 1e6);
    result.artifacts.execution = executionResult;

    if (!executionResult.success) {
      throw new Error(`Runtime execution failed: ${executionResult.error}`);
    }

    // Generate feedback for closed-loop
    result.feedback = generateFeedback(executionResult);

    // Calculate total execution time
    result.execution_time = Number(process.hrtime.bigint() - startTime) / 1e6;

  } catch (error) {
    result.addError(result.stages.length > 0 ? result.stages[result.stages.length - 1].stage : 'INIT', error);
    result.execution_time = Number(process.hrtime.bigint() - startTime) / 1e6;
  }

  result.finalize();

  // Audit the pipeline execution
  auditLog({
    layer: 'PIPELINE',
    operation: result.success ? 'EXECUTE_SUCCESS' : 'EXECUTE_FAILURE',
    input_hash: canonicalHash(input),
    output_hash: result.pipeline_hash,
    metadata: {
      stages_completed: result.stages.length,
      execution_time_ms: result.execution_time,
      success: result.success
    }
  });

  return result;
}

/**
 * Execute pipeline batch
 * @param {any[]} inputs - Array of inputs
 * @param {object} options - Shared options
 * @returns {PipelineResult[]} Array of results
 */
function executePipelineBatch(inputs, options = {}) {
  return inputs.map((input, index) => {
    return executePipeline(input, {
      ...options,
      signalSource: options.signalSource ? `${options.signalSource}_${index}` : `BATCH_${index}`
    });
  });
}

/**
 * Reset entire pipeline state
 * For testing and replay
 */
function resetPipeline() {
  resetClock();
  resetAuditLogger();
  resetEvidenceChain();
  clearGenePool();
  resetASEState();
  resetRuntime();
  clearViolations();
}

/**
 * Get pipeline status
 * @returns {object} Current pipeline state
 */
function getPipelineStatus() {
  const auditChain = verifyAuditChain();
  const cognitiveState = getState();

  return {
    type: 'PIPELINE_STATUS',
    timestamp: deterministicTime(),
    audit_chain: {
      valid: auditChain.valid,
      length: auditChain.chain_length,
      head_hash: auditChain.head_hash
    },
    cognitive_state: {
      version: cognitiveState.version,
      state_hash: cognitiveState.state_hash
    },
    compliance: generateComplianceReport()
  };
}

/**
 * Verify pipeline determinism
 * Runs same input twice and compares results
 *
 * @param {any} input - Test input
 * @param {object} options - Pipeline options
 * @returns {object} Determinism verification result
 */
function verifyPipelineDeterminism(input, options = {}) {
  // First run
  resetPipeline();
  const result1 = executePipeline(input, options);

  // Second run
  resetPipeline();
  const result2 = executePipeline(input, options);

  // Compare
  const hashesMatch = result1.pipeline_hash === result2.pipeline_hash;
  const stagesMatch = result1.stages.length === result2.stages.length &&
    result1.stages.every((s, i) => s.artifact_hash === result2.stages[i].artifact_hash);

  return {
    deterministic: hashesMatch && stagesMatch,
    run1_hash: result1.pipeline_hash,
    run2_hash: result2.pipeline_hash,
    pipeline_hash_match: hashesMatch,
    stages_match: stagesMatch,
    stages_compared: result1.stages.length
  };
}

/**
 * Get full provenance chain for an artifact
 * @param {object} pipelineResult - Pipeline result
 * @returns {object[]} Provenance chain
 */
function getProvenanceChain(pipelineResult) {
  const chain = [];

  for (const stage of pipelineResult.stages) {
    chain.push({
      layer: stage.stage,
      type: stage.artifact_type,
      id: stage.artifact_id,
      hash: stage.artifact_hash,
      timestamp: stage.timestamp
    });
  }

  return chain;
}

// Export main execution for CLI
if (require.main === module) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  LTCA-NRBPL COGNITIVE PIPELINE v1.0                          ║');
  console.log('║  Closed-Loop Constitutional Forensic Cognitive System        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Test execution
  const testInput = {
    message: 'Hello, Cognitive System!',
    data: { value: 42, flag: true }
  };

  console.log('► Executing pipeline with test input...');
  console.log('  Input:', JSON.stringify(testInput));
  console.log('');

  resetPipeline();
  const result = executePipeline(testInput, {
    cbType: CBType.FACT,
    aseOperation: 'CREATE',
    asePayload: { key: 'test_fact', value: testInput }
  });

  console.log('► Pipeline Result:');
  console.log('  Success:', result.success);
  console.log('  Stages completed:', result.stages.length);
  console.log('  Execution time:', result.execution_time.toFixed(2), 'ms');
  console.log('  Pipeline hash:', result.pipeline_hash);
  console.log('');

  if (result.success) {
    console.log('► Stage Summary:');
    for (const stage of result.stages) {
      console.log(`  [${stage.stage}] ${stage.artifact_type} → ${stage.artifact_hash?.substring(0, 16)}...`);
    }
    console.log('');

    // Verify determinism
    console.log('► Verifying determinism...');
    const deterministicCheck = verifyPipelineDeterminism(testInput);
    console.log('  Deterministic:', deterministicCheck.deterministic);
    console.log('  Hash match:', deterministicCheck.pipeline_hash_match);
    console.log('');

    // Check compliance
    console.log('► Compliance Report:');
    const status = getPipelineStatus();
    console.log('  System compliant:', status.compliance.system_compliant);
    console.log('  Total violations:', status.compliance.total_violations);
    console.log('  Audit chain valid:', status.audit_chain.valid);
    console.log('  Audit entries:', status.audit_chain.length);
  } else {
    console.log('► Errors:');
    for (const err of result.errors) {
      console.log(`  [${err.stage}] ${err.error}`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Pipeline execution complete.');
}

module.exports = {
  PipelineResult,
  executePipeline,
  executePipelineBatch,
  resetPipeline,
  getPipelineStatus,
  verifyPipelineDeterminism,
  getProvenanceChain
};
