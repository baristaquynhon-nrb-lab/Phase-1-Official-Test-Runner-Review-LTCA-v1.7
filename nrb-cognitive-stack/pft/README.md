# PFT — Perception Field Tracking

## Overview

PFT processes raw sensor signals (camera, microphone, motion) and converts them into pseudo-symbols suitable for input to the COP pipeline.

## Components

### Sensors
| File | Purpose |
|------|---------|
| `sensors/camera_processor.js` | Visual signal processing |
| `sensors/mic_processor.js` | Audio signal processing |
| `sensors/motion_processor.js` | Motion/accelerometer processing |

### Signal Layer
| File | Purpose |
|------|---------|
| `signal_layer/signal_classifier.js` | Classifies raw signals by type |
| `signal_layer/gesture_frame_builder.js` | Builds gesture frames from signals |
| `signal_layer/pseudo_symbol_generator.js` | Converts signals to COP-compatible input |

## Data Flow

```
Sensors → Signal Classifier → Gesture Frame Builder → Pseudo Symbol Generator → COP
```
