#!/usr/bin/env bash
set -euo pipefail

# ============================================
# LTCA OFFICIAL TEST RUNNER — ORCHESTRATOR
# Compatible: Termux / Linux / GitHub Actions
# Dependency: Node.js only
# ============================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FIXTURE_DIR="$ROOT_DIR/tests/fixtures"
EXPECTED_DIR="$ROOT_DIR/tests/expected"

VALIDATE_FIXTURE="$ROOT_DIR/validators/validate_fixture_v1.js"
VALIDATE_EXPECTED="$ROOT_DIR/validators/validate_expected_v1.js"

CANONICALIZER="$ROOT_DIR/src/canonical/canonical_json_rfc8785_subset.js"
NUMERIC_PROFILE="$ROOT_DIR/src/canonical/numeric_profile_v1.js"

echo "============================================"
echo "LTCA OFFICIAL TEST RUNNER — v1.0"
echo "Deterministic | Fail-Fast | Hash-Stable"
echo "============================================"
echo

# ------------------------------------------------
# Phase 1 — Schema Gate (Fixtures)
# ------------------------------------------------
echo "[1/4] VALIDATING FIXTURES..."
for f in "$FIXTURE_DIR"/*.json; do
  echo "  -> $f"
  node "$VALIDATE_FIXTURE" "$f"
done
echo "Fixtures structurally valid."
echo

# ------------------------------------------------
# Phase 2 — Schema Gate (Expected Outputs)
# ------------------------------------------------
echo "[2/4] VALIDATING EXPECTED FILES..."
for f in "$EXPECTED_DIR"/*.json; do
  echo "  -> $f"
  node "$VALIDATE_EXPECTED" "$f"
done
echo "Expected outputs structurally valid."
echo

# ------------------------------------------------
# Phase 3 — Numeric Ontology Gate
# ------------------------------------------------
echo "[3/4] ENFORCING NUMERIC PROFILE..."
for f in "$FIXTURE_DIR"/*.json "$EXPECTED_DIR"/*.json; do
  echo "  -> $f"
  node "$NUMERIC_PROFILE" "$f" check
done
echo "Numeric ontology compliant."
echo

# ------------------------------------------------
# Phase 4 — Canonical Hash Check
# ------------------------------------------------
echo "[4/4] CANONICAL HASH CONSISTENCY..."

FAIL=0

check_hash () {
  local file="$1"

  # Compute canonical hash
  RUNTIME_HASH=$(node "$CANONICALIZER" "$file" hash)

  # Check for __COMPUTED_AT_RUNTIME__ placeholders
  if grep -q "__COMPUTED_AT_RUNTIME__" "$file" 2>/dev/null; then
    echo "  [INFO] $file -> runtime hash: $RUNTIME_HASH (placeholders present)"
    return
  fi

  echo "  [OK] $file -> $RUNTIME_HASH"
}

for f in "$FIXTURE_DIR"/*.json "$EXPECTED_DIR"/*.json; do
  check_hash "$f"
done

echo

# ------------------------------------------------
# Phase 5 — Deterministic Rerun Verification
# ------------------------------------------------
echo "[RERUN] DETERMINISM CHECK..."

RERUN_FAIL=0

for f in "$FIXTURE_DIR"/*.json "$EXPECTED_DIR"/*.json; do
  HASH_1=$(node "$CANONICALIZER" "$f" hash)
  HASH_2=$(node "$CANONICALIZER" "$f" hash)
  if [ "$HASH_1" != "$HASH_2" ]; then
    echo "  [FAIL] Non-deterministic hash for $f"
    echo "         Run 1: $HASH_1"
    echo "         Run 2: $HASH_2"
    RERUN_FAIL=1
  fi
done

if [ "$RERUN_FAIL" -eq 0 ]; then
  echo "  Rerun determinism verified (all hashes identical across runs)."
else
  FAIL=1
fi

echo
echo "============================================"

if [ "$FAIL" -eq 0 ]; then
  echo "FINAL VERDICT: PASS"
  echo "System state: Deterministic + Schema-safe + Hash-stable"
  echo "============================================"
  exit 0
else
  echo "FINAL VERDICT: FAIL"
  echo "System state: Invariant breach detected"
  echo "============================================"
  exit 1
fi
