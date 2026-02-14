"use strict";

/**
 * FORENSIC REPORT FORMATTER
 * NRB Forensic Reflex Benchmark
 *
 * Generates canonical forensic reports with:
 * - Deterministic JSON canonicalization
 * - SHA-256 signature (excluding signature field)
 * - Physiological metrics
 * - Invariant validation results
 */

const crypto = require("crypto");

/**
 * Canonicalize object for deterministic hashing
 * RFC 8785-like minimal implementation
 *
 * @param {any} obj - Object to canonicalize
 * @returns {any} Canonicalized object
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }

  if (typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        const value = obj[key];
        // Skip undefined values
        if (value !== undefined) {
          acc[key] = canonicalize(value);
        }
        return acc;
      }, {});
  }

  // Primitives pass through
  return obj;
}

/**
 * Generate SHA-256 hash of canonicalized object
 *
 * @param {object} obj - Object to hash
 * @returns {string} Hash with sha256: prefix
 */
function sha256Canonical(obj) {
  const canonicalized = canonicalize(obj);
  const json = JSON.stringify(canonicalized);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return `sha256:${hash}`;
}

/**
 * Format statistics for report
 *
 * @param {object} stats - Statistics object
 * @returns {object} Formatted statistics
 */
function formatStats(stats) {
  if (!stats) return null;

  return {
    avg_ms: parseFloat(stats.avg?.toFixed(4) || 0),
    min_ms: parseFloat(stats.min?.toFixed(4) || 0),
    max_ms: parseFloat(stats.max?.toFixed(4) || 0),
    p50_ms: parseFloat(stats.p50?.toFixed(4) || 0),
    p90_ms: parseFloat(stats.p90?.toFixed(4) || 0),
    p95_ms: parseFloat(stats.p95?.toFixed(4) || 0),
    p99_ms: parseFloat(stats.p99?.toFixed(4) || 0),
    stddev_ms: parseFloat(stats.stddev?.toFixed(4) || 0)
  };
}

/**
 * Build complete forensic report
 *
 * @param {object} params - Report parameters
 * @returns {object} Complete forensic report with signature
 */
function buildForensicReport({
  iterations,
  tau_pft,
  tau_cop,
  tau_gsra,
  tau_action,
  tau_total,
  invariantResult,
  metadata = {}
}) {
  // Build report without signature first
  const report = {
    type: "reflex_forensic_report",
    version: "v1.1",
    spec: "NRB_REFLEX_LOOP_SPEC",

    // Execution metadata
    iterations: iterations,
    generated_at_logical: metadata.logical_time || null,

    // Physiological measurements (dual-time model)
    physiology: {
      tau_pft: formatStats(tau_pft),
      tau_cop: formatStats(tau_cop),
      tau_gsra: formatStats(tau_gsra),
      tau_action: formatStats(tau_action),
      total_reflex: formatStats(tau_total)
    },

    // Forensic validation results
    forensic: {
      determinism_pass: !(invariantResult?.invariant_failures || [])
        .some(f => f.includes("I1")),
      hash_chain_integrity: !(invariantResult?.invariant_failures || [])
        .some(f => f.includes("I2")),
      timestamp_independence: !(invariantResult?.invariant_failures || [])
        .some(f => f.includes("I4")),
      replay_stability: !(invariantResult?.invariant_failures || [])
        .some(f => f.includes("I8")),
      invariants_checked: invariantResult?.invariants_checked || 0,
      invariants_passed: invariantResult?.invariants_passed || 0,
      invariant_failures: invariantResult?.invariant_failures || []
    },

    // Performance thresholds
    thresholds: {
      critical_p95_ms: 500,
      warning_p95_ms: 200,
      target_p95_ms: 200,
      status: getThresholdStatus(tau_total?.p95)
    }
  };

  // Generate signature from canonicalized report
  const signature = sha256Canonical(report);

  return {
    ...report,
    signature
  };
}

/**
 * Get threshold status based on P95 latency
 *
 * @param {number} p95 - P95 latency in ms
 * @returns {string} Status string
 */
function getThresholdStatus(p95) {
  if (p95 === undefined || p95 === null) return "UNKNOWN";
  if (p95 > 500) return "CRITICAL";
  if (p95 > 200) return "WARNING";
  return "PASS";
}

/**
 * Format report for console output
 *
 * @param {object} report - Forensic report
 * @returns {string} Formatted console output
 */
function formatConsoleOutput(report) {
  const lines = [];

  lines.push("");
  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push("║  NRB FORENSIC REFLEX BENCHMARK                               ║");
  lines.push("║  " + report.spec.padEnd(60) + "║");
  lines.push("╚══════════════════════════════════════════════════════════════╝");
  lines.push("");

  // Iterations
  lines.push(`Iterations: ${report.iterations}`);
  lines.push("");

  // Physiological measurements
  lines.push("► Physiological Measurements:");
  if (report.physiology.total_reflex) {
    const tr = report.physiology.total_reflex;
    lines.push(`  Total Avg:  ${tr.avg_ms.toFixed(4)} ms`);
    lines.push(`  P50:        ${tr.p50_ms.toFixed(4)} ms`);
    lines.push(`  P95:        ${tr.p95_ms.toFixed(4)} ms`);
    lines.push(`  P99:        ${tr.p99_ms.toFixed(4)} ms`);
    lines.push(`  Max:        ${tr.max_ms.toFixed(4)} ms`);
  }
  lines.push("");

  // Stage breakdown
  lines.push("► Stage Breakdown (avg ms):");
  if (report.physiology.tau_pft) {
    lines.push(`  τ_PFT:    ${report.physiology.tau_pft.avg_ms.toFixed(4)}`);
  }
  if (report.physiology.tau_cop) {
    lines.push(`  τ_COP:    ${report.physiology.tau_cop.avg_ms.toFixed(4)}`);
  }
  if (report.physiology.tau_gsra) {
    lines.push(`  τ_GSRA:   ${report.physiology.tau_gsra.avg_ms.toFixed(4)}`);
  }
  if (report.physiology.tau_action) {
    lines.push(`  τ_Action: ${report.physiology.tau_action.avg_ms.toFixed(4)}`);
  }
  lines.push("");

  // Forensic status
  lines.push("► Forensic Validation:");
  lines.push(`  Determinism:     ${report.forensic.determinism_pass ? "PASS" : "FAIL"}`);
  lines.push(`  Hash Chain:      ${report.forensic.hash_chain_integrity ? "PASS" : "FAIL"}`);
  lines.push(`  Timestamp Indep: ${report.forensic.timestamp_independence ? "PASS" : "FAIL"}`);
  lines.push(`  Replay Stable:   ${report.forensic.replay_stability ? "PASS" : "FAIL"}`);
  lines.push(`  Invariants:      ${report.forensic.invariants_passed}/${report.forensic.invariants_checked}`);
  lines.push("");

  // Threshold status
  lines.push("► Threshold Status:");
  lines.push(`  P95 Status: ${report.thresholds.status}`);
  lines.push(`  (Critical: >${report.thresholds.critical_p95_ms}ms, Warning: >${report.thresholds.warning_p95_ms}ms)`);
  lines.push("");

  // Signature
  lines.push("► Report Signature:");
  lines.push(`  ${report.signature}`);
  lines.push("");

  // Final status
  const allPass = report.forensic.determinism_pass &&
                  report.forensic.hash_chain_integrity &&
                  report.thresholds.status !== "CRITICAL";

  lines.push("═══════════════════════════════════════════════════════════════");
  if (allPass) {
    lines.push("✓ BENCHMARK PASSED - FORENSIC GRADE COMPLIANCE VERIFIED");
  } else {
    lines.push("✗ BENCHMARK FAILED - INVARIANT OR THRESHOLD VIOLATION");
    if (report.forensic.invariant_failures.length > 0) {
      lines.push("  Failures: " + report.forensic.invariant_failures.join(", "));
    }
  }
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");

  return lines.join("\n");
}

/**
 * Export report as JSON file content
 *
 * @param {object} report - Forensic report
 * @returns {string} JSON string
 */
function exportReportJSON(report) {
  return JSON.stringify(canonicalize(report), null, 2);
}

module.exports = {
  canonicalize,
  sha256Canonical,
  buildForensicReport,
  formatStats,
  formatConsoleOutput,
  exportReportJSON,
  getThresholdStatus
};
