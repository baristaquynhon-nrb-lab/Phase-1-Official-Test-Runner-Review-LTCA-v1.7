"use strict";

/**
 * TIMING UTILITIES
 * NRB Forensic Reflex Benchmark
 *
 * Dual-Time Model (LAW-005 compliant):
 * - T_logical : Handled by core deterministic_clock (semantic, for hashes)
 * - T_physical: process.hrtime.bigint() (measurement ONLY, NEVER in hashes)
 *
 * CRITICAL: Physical time is for latency measurement only.
 * Semantic hashes MUST use logical time from deterministic_clock.
 */

/**
 * Get current physical time (high-resolution)
 * FOR BENCHMARKING ONLY - NOT FOR SEMANTIC HASHING
 * @returns {bigint} Nanosecond timestamp
 */
function nowPhysical() {
  return process.hrtime.bigint();
}

/**
 * Calculate millisecond difference between two physical timestamps
 * @param {bigint} tEnd - End timestamp
 * @param {bigint} tStart - Start timestamp
 * @returns {number} Duration in milliseconds
 */
function diffMs(tEnd, tStart) {
  return Number(tEnd - tStart) / 1e6;
}

/**
 * Calculate microsecond difference
 * @param {bigint} tEnd - End timestamp
 * @param {bigint} tStart - Start timestamp
 * @returns {number} Duration in microseconds
 */
function diffUs(tEnd, tStart) {
  return Number(tEnd - tStart) / 1e3;
}

/**
 * Calculate percentile value from sorted array
 * DETERMINISTIC: Uses consistent sorting and index calculation
 *
 * @param {number[]} arr - Array of values
 * @param {number} p - Percentile (0-1)
 * @returns {number} Percentile value
 */
function percentile(arr, p) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;

  // Deterministic sort (ascending)
  const sorted = [...arr].sort((a, b) => a - b);

  // Floor-based index for determinism
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

/**
 * Calculate comprehensive statistics
 * All calculations are deterministic
 *
 * @param {number[]} values - Array of measurements
 * @returns {object} Statistics object
 */
function stats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return {
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      stddev: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  // Calculate standard deviation (deterministic)
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(avgSquaredDiff);

  return {
    count: values.length,
    avg: avg,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 0.50),
    p90: percentile(sorted, 0.90),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    stddev: stddev
  };
}

/**
 * Format duration for display
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted string
 */
function formatDuration(ms) {
  if (ms < 0.001) {
    return `${(ms * 1000000).toFixed(2)} ns`;
  } else if (ms < 1) {
    return `${(ms * 1000).toFixed(2)} µs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  } else {
    return `${(ms / 1000).toFixed(2)} s`;
  }
}

/**
 * Create a timing context for measuring operations
 * @returns {object} Timing context with start/stop methods
 */
function createTimingContext() {
  let startTime = null;
  const marks = new Map();

  return {
    start() {
      startTime = nowPhysical();
      return this;
    },

    mark(name) {
      marks.set(name, nowPhysical());
      return this;
    },

    elapsed() {
      if (!startTime) return 0;
      return diffMs(nowPhysical(), startTime);
    },

    sinceMark(name) {
      const markTime = marks.get(name);
      if (!markTime) return 0;
      return diffMs(nowPhysical(), markTime);
    },

    betweenMarks(startMark, endMark) {
      const start = marks.get(startMark);
      const end = marks.get(endMark);
      if (!start || !end) return 0;
      return diffMs(end, start);
    },

    getMarks() {
      return new Map(marks);
    }
  };
}

module.exports = {
  nowPhysical,
  diffMs,
  diffUs,
  percentile,
  stats,
  formatDuration,
  createTimingContext
};
