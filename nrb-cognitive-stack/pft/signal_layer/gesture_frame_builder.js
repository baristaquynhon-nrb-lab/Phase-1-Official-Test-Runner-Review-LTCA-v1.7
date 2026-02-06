'use strict';

/**
 * Gesture Frame Builder — Builds gesture frames from classified signals.
 */

function buildGestureFrame(classifiedSignal) {
  return {
    type: 'gesture_frame',
    signal_class: classifiedSignal.signal_class,
    source: classifiedSignal.source,
    urgency: classifiedSignal.urgency,
    confidence: classifiedSignal.confidence,
    timestamp: Date.now()
  };
}

function mergeGestureFrames(frames) {
  if (frames.length === 0) return null;

  // Use highest urgency signal as primary
  const sorted = frames.sort((a, b) => b.urgency - a.urgency);
  return {
    type: 'merged_gesture_frame',
    primary: sorted[0],
    all_signals: sorted,
    max_urgency: sorted[0].urgency,
    timestamp: Date.now()
  };
}

module.exports = { buildGestureFrame, mergeGestureFrames };
