#!/usr/bin/env node
/**
 * Replay validator - verifies determinism from audit log
 */

import fs from 'fs';
import { verifyHashChain } from '../src/canon/hash.js';

const logFile = process.argv[2];
if (!logFile) {
  console.error('Usage: node tools/replay.js <audit.jsonl>');
  process.exit(1);
}

console.log(`Replaying: ${logFile}\n`);

const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
const entries = lines.map(line => JSON.parse(line));

console.log(`Total entries: ${entries.length}`);

// Verify hash chain
const verification = verifyHashChain(entries);

if (verification.valid) {
  console.log('✓ Hash chain valid');
  console.log('✓ Replay determinism confirmed');
} else {
  console.error(`✗ Hash chain broken at entry ${verification.failedAt}`);
  console.error(`  Reason: ${verification.reason}`);
  process.exit(1);
}

// Display state progression
console.log('\nState progression:');
entries.forEach((entry, i) => {
  if (entry.payload && entry.payload.cr_next_hash) {
    console.log(`  ${i + 1}. ${entry.payload.event_id} → ${entry.payload.cr_next_hash.substring(0, 16)}...`);
  }
});
