'use strict';

/**
 * Signal Classifier — Classifies raw sensor signals by type and urgency.
 */

function classifySignal(sensorOutput) {
  const classification = {
    source: sensorOutput.source,
    signal_class: 'UNKNOWN',
    urgency: 0,
    confidence: 0
  };

  // Classify based on features
  if (sensorOutput.features) {
    if (sensorOutput.features.distress_sound) {
      classification.signal_class = 'DISTRESS';
      classification.urgency = 4;
      classification.confidence = 0.8;
    } else if (sensorOutput.features.fall_detected) {
      classification.signal_class = 'FALL';
      classification.urgency = 5;
      classification.confidence = 0.7;
    } else if (sensorOutput.features.gesture_detected) {
      classification.signal_class = 'GESTURE';
      classification.urgency = 1;
      classification.confidence = 0.6;
    } else if (sensorOutput.features.speech_detected) {
      classification.signal_class = 'SPEECH';
      classification.urgency = 2;
      classification.confidence = 0.9;
    }
  }

  return classification;
}

module.exports = { classifySignal };
