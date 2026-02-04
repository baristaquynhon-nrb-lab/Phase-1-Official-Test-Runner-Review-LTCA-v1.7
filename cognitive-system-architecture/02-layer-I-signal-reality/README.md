# 02 - LAYER I: SIGNAL REALITY LAYER
## Physical Measurement Capture

---

## Layer Overview

| Property | Value |
|----------|-------|
| Layer Number | I |
| Name | Signal Reality Layer |
| Primary Function | Physical measurement capture |
| Input | Physical world phenomena |
| Output | Raw signal data (ΔC) |

---

## Purpose

The Signal Reality Layer is responsible for capturing physical reality as measurable signals. This layer forms the **ground truth** for all subsequent cognitive processing.

---

## Core Concept: ΔC (Delta-C)

```
ΔC = Change in physical state captured as signal
```

### ΔC Properties

| Property | Description |
|----------|-------------|
| Physical Grounding | Must correspond to real measurement |
| Temporal Precision | Timestamped with high accuracy |
| Sensor Identity | Source sensor identified |
| Calibration State | Sensor calibration recorded |
| Uncertainty Bounds | Measurement uncertainty specified |

---

## Signal Capture Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                  SIGNAL REALITY LAYER                        │
│                                                              │
│  Physical      ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  World    ──▶  │ Sensor  │ ─▶ │ Sampler │ ─▶ │ Encoder │   │
│                └─────────┘    └─────────┘    └─────────┘   │
│                     │              │              │          │
│                     ▼              ▼              ▼          │
│               ┌─────────┐    ┌─────────┐    ┌─────────┐     │
│               │ Calib.  │    │ Time-   │    │ Format  │     │
│               │ Data    │    │ stamp   │    │ Spec    │     │
│               └─────────┘    └─────────┘    └─────────┘     │
│                     │              │              │          │
│                     └──────────────┴──────────────┘          │
│                                    │                         │
│                                    ▼                         │
│                              ┌──────────┐                    │
│                              │    ΔC    │                    │
│                              │  Output  │                    │
│                              └──────────┘                    │
│                                    │                         │
└────────────────────────────────────┼─────────────────────────┘
                                     │
                                     ▼
                              To Layer II (Trace)
```

---

## Signal Schema

### ΔC Record Structure

```json
{
  "schema_version": "1.0",
  "type": "SIGNAL_DC",
  "signal_id": "UUID",
  "timestamp": {
    "logical": "lamport_clock_value",
    "physical": "ISO8601_timestamp",
    "precision_ns": 1000
  },
  "source": {
    "sensor_id": "UUID",
    "sensor_type": "string",
    "calibration_ref": "UUID",
    "location": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "reference_frame": "string"
    }
  },
  "measurement": {
    "value": "any",
    "unit": "string",
    "uncertainty": {
      "type": "gaussian|uniform|bounded",
      "params": {}
    }
  },
  "integrity": {
    "hash": "SHA256",
    "signature": "ED25519"
  }
}
```

---

## Signal Types

### Supported Signal Categories

| Category | Examples | Encoding |
|----------|----------|----------|
| Scalar | Temperature, Pressure | Float64 |
| Vector | Position, Velocity | Float64[3] |
| Tensor | Stress, Strain | Float64[3][3] |
| Image | Visual capture | PNG/RAW |
| Audio | Sound capture | WAV/PCM |
| Event | Discrete occurrence | JSON |
| Stream | Continuous data | Binary |

---

## Layer Invariants

### Invariant 1: Physical Grounding

```
∀ ΔC: ∃ physical_measurement P such that ΔC ← P
```
Every signal must originate from a physical measurement.

### Invariant 2: Temporal Ordering

```
∀ ΔC₁, ΔC₂: timestamp(ΔC₁) < timestamp(ΔC₂) ⟹ capture(ΔC₁) < capture(ΔC₂)
```
Timestamps must preserve capture order.

### Invariant 3: Sensor Traceability

```
∀ ΔC: ∃ sensor S such that calibration(S) is valid at time(ΔC)
```
Every signal must have valid sensor calibration.

### Invariant 4: Integrity Verification

```
∀ ΔC: verify(hash(ΔC), signature(ΔC)) = true
```
Every signal must pass integrity verification.

---

## Calibration Management

### Calibration Record

```json
{
  "calibration_id": "UUID",
  "sensor_id": "UUID",
  "timestamp": "ISO8601",
  "valid_until": "ISO8601",
  "parameters": {
    "offset": 0.0,
    "scale": 1.0,
    "nonlinearity": []
  },
  "reference_standard": "string",
  "certification": {
    "authority": "string",
    "certificate_id": "string"
  }
}
```

---

## Error Handling

### Signal Capture Errors

| Error Type | Response | Recovery |
|------------|----------|----------|
| Sensor Failure | Mark invalid | Use backup sensor |
| Calibration Expired | Block signal | Request recalibration |
| Timestamp Anomaly | Quarantine | Manual review |
| Integrity Failure | Reject | Alert and log |

---

## Interface with Layer II

### Output Contract

```
Layer I guarantees to Layer II:
1. All ΔC records are physically grounded
2. All ΔC records have valid timestamps
3. All ΔC records have verified integrity
4. All ΔC records have calibration references
```

---

## Navigation

- **Previous**: [Architectural Principles](../01-architectural-principles/README.md)
- **Next**: [Layer II: Trace Structuring](../03-layer-II-trace-structuring/README.md)
- **Index**: [Main Specification](../README.md)
