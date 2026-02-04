#!/usr/bin/env node
/**
 * Run all test cases in the cases directory
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

const casesDir = join(__dirname, '../cases');
const logsDir = join(__dirname, '../logs');

// Ensure logs directory exists
fs.mkdirSync(logsDir, { recursive: true });

// Get all JSON files in cases directory
const caseFiles = fs.readdirSync(casesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => join(casesDir, f));

console.log(`Found ${caseFiles.length} test case(s)\n`);
console.log('='.repeat(60));

let passed = 0;
let failed = 0;
const results = [];

for (const caseFile of caseFiles) {
  const caseData = JSON.parse(fs.readFileSync(caseFile, 'utf8'));
  console.log(`\nCase: ${caseData.case_id}`);
  console.log(`Description: ${caseData.description}`);

  const engine = new CRStateReducerEngine();
  let currentState = JSON.parse(JSON.stringify(initialCRState));
  const auditLog = [];
  let caseSuccess = true;

  for (const event of caseData.ase_events) {
    const result = engine.reduce(currentState, event);

    if (result.verdict === 'REFUSE') {
      console.log(`  ✗ Event ${event.event_id} REFUSED: ${result.reason}`);
      caseSuccess = false;
      break;
    }

    auditLog.push(result.audit);
    currentState = result.crNext;
  }

  if (caseSuccess) {
    console.log(`  ✓ All ${caseData.ase_events.length} events processed`);
    console.log(`  ✓ Final hash: ${currentState.state_hash.substring(0, 16)}...`);
    passed++;

    // Write audit log
    const logFile = join(logsDir, `${caseData.case_id}.jsonl`);
    fs.writeFileSync(
      logFile,
      auditLog.map(entry => JSON.stringify(entry)).join('\n')
    );
  } else {
    failed++;
  }

  results.push({
    case_id: caseData.case_id,
    success: caseSuccess,
    events_processed: caseSuccess ? caseData.ase_events.length : 0,
    final_hash: caseSuccess ? currentState.state_hash : null
  });
}

console.log('\n' + '='.repeat(60));
console.log(`\nSUMMARY: ${passed} passed, ${failed} failed`);

// Write summary
const summaryFile = join(logsDir, 'suite_summary.json');
fs.writeFileSync(summaryFile, JSON.stringify({
  timestamp: new Date().toISOString(),
  total_cases: caseFiles.length,
  passed,
  failed,
  results
}, null, 2));

console.log(`Summary written to: ${summaryFile}`);
process.exit(failed > 0 ? 1 : 0);
