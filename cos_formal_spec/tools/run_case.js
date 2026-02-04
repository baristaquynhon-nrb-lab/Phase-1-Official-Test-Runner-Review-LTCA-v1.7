#!/usr/bin/env node
/**
 * Run a single cognitive case from JSON definition
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CRStateReducerEngine } from '../src/engines/cr_state_reducer_engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initialCRState = JSON.parse(
  fs.readFileSync(join(__dirname, '../fixtures/initial_cr_state.json'), 'utf8')
);

const caseFile = process.argv[2];
if (!caseFile) {
  console.error('Usage: node tools/run_case.js <case.json>');
  process.exit(1);
}

const caseData = JSON.parse(fs.readFileSync(caseFile, 'utf8'));

console.log(`Running case: ${caseData.case_id}`);
console.log(`Description: ${caseData.description}\n`);

const engine = new CRStateReducerEngine();
let currentState = JSON.parse(JSON.stringify(initialCRState));
const auditLog = [];

for (const event of caseData.ase_events) {
  console.log(`Processing event: ${event.event_id}`);

  const result = engine.reduce(currentState, event);

  if (result.verdict === 'REFUSE') {
    console.error(`  ✗ REFUSED: ${result.reason}`);
    break;
  }

  console.log(`  ✓ Applied`);
  console.log(`    State hash: ${result.crNext.state_hash.substring(0, 16)}...`);

  auditLog.push(result.audit);
  currentState = result.crNext;
}

console.log(`\nFinal state hash: ${currentState.state_hash}`);
console.log(`Memory events: ${currentState.memory_state.index}`);
console.log(`Meta KSI: ${currentState.meta_state.ksi.toFixed(3)}`);

// Write audit log
const logsDir = join(__dirname, '../logs');
fs.mkdirSync(logsDir, { recursive: true });
const logFile = join(logsDir, `${caseData.case_id}.jsonl`);
fs.writeFileSync(
  logFile,
  auditLog.map(entry => JSON.stringify(entry)).join('\n')
);
console.log(`\nAudit log written to: ${logFile}`);
