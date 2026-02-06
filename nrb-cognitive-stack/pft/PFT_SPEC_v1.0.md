# PFT Specification v1.0

**Version:** 1.0
**Date:** February 6, 2026
**Status:** NORMATIVE

---

## 1. Purpose

PFT (Perception Field Tracking) converts raw sensor data into structured pseudo-symbols that the COP pipeline can process.

## 2. Sensor Types

- **Camera**: Visual scene analysis, gesture recognition
- **Microphone**: Audio analysis, speech detection, distress sounds
- **Motion**: Physical movement patterns, fall detection

## 3. Processing Pipeline

```
Raw Sensor Data → Signal Classifier → Gesture Frame Builder → Pseudo Symbol Generator
```

## 4. Output Format

Pseudo-symbols are structured objects compatible with the COP tokenizer:

```json
{
  "type": "pseudo_symbol",
  "source": "camera|mic|motion",
  "signal_class": "...",
  "confidence": 0.0-1.0,
  "raw_features": { ... }
}
```

## 5. Integration

PFT output feeds into `integration/interfaces/PFT_COP_interface.js`.
