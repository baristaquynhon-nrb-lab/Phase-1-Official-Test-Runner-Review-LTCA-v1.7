'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Schema Validator — Validates Meaning Frames against the canonical schema.
 */

function loadSchema(schemaPath) {
  const raw = fs.readFileSync(schemaPath, 'utf-8');
  return JSON.parse(raw);
}

function validateField(frame, field, schema) {
  const prop = schema.properties[field];
  if (!prop) return { valid: true };

  const value = frame[field];
  if (schema.required && schema.required.includes(field) && value === undefined) {
    return { valid: false, error: `Missing required field: ${field}` };
  }

  if (prop.type === 'string' && typeof value !== 'string') {
    return { valid: false, error: `${field} must be a string` };
  }

  if (prop.type === 'number' && typeof value !== 'number') {
    return { valid: false, error: `${field} must be a number` };
  }

  if (prop.enum && !prop.enum.includes(value)) {
    return { valid: false, error: `${field} must be one of: ${prop.enum.join(', ')}` };
  }

  return { valid: true };
}

function validateMeaningFrame(frame) {
  const schemaPath = path.join(__dirname, 'MEANING_FRAME_SCHEMA_v1.0.json');
  const schema = loadSchema(schemaPath);
  const errors = [];

  for (const field of schema.required) {
    const result = validateField(frame, field, schema);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateMeaningFrame, loadSchema };
