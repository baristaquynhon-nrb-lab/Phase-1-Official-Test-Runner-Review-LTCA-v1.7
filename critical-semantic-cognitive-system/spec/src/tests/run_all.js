const { bindEvidence } = require("../index");

const input = {
  type: "canonical_input",
  version: "v1.0",
  timestamp: "2026-02-08T00:00:00Z",
  payload: { a: 1 }
};

const result = bindEvidence(input);
const pass = result.type === "evidence_unit" && typeof result.input_hash === "string" && result.input_hash.length === 64;
console.log("Test:", pass);
