'use strict';

const { ForensicLogger } = require('./forensic_logger');

/**
 * Audit Trail — High-level audit trail generator and exporter.
 */

function createAuditTrail() {
  return new ForensicLogger();
}

function exportTrail(logger, format) {
  const entries = logger.getEntries();
  const verification = logger.verifyChain();

  if (format === 'json') {
    return JSON.stringify({
      trail: entries,
      chain_valid: verification.valid,
      total_entries: entries.length,
      exported_at: new Date().toISOString()
    }, null, 2);
  }

  // Default: text format
  let output = `Audit Trail — ${entries.length} entries\n`;
  output += `Chain Valid: ${verification.valid}\n`;
  output += '---\n';
  for (const entry of entries) {
    output += `[${entry.sequence}] ${entry.event} | ${entry.timestamp} | ${entry.hash.slice(0, 16)}...\n`;
  }
  return output;
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--export')) {
    const trail = createAuditTrail();
    trail.log('SYSTEM_START', { message: 'Audit trail initialized' });
    console.log(exportTrail(trail, 'json'));
  }
}

module.exports = { createAuditTrail, exportTrail };
