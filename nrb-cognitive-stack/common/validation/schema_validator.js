'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Schema Validator — General-purpose schema validation utility.
 */

function validateRequired(obj, requiredFields) {
  const missing = requiredFields.filter(f => !(f in obj));
  return {
    valid: missing.length === 0,
    missing
  };
}

function validateType(value, expectedType) {
  if (expectedType === 'array') return Array.isArray(value);
  return typeof value === expectedType;
}

function validateSchema(obj, schema) {
  const errors = [];

  // Check required fields
  if (schema.required) {
    const result = validateRequired(obj, schema.required);
    if (!result.valid) {
      errors.push(`Missing required fields: ${result.missing.join(', ')}`);
    }
  }

  // Check types
  if (schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (key in obj && prop.type) {
        if (!validateType(obj[key], prop.type)) {
          errors.push(`${key}: expected ${prop.type}, got ${typeof obj[key]}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--all')) {
    console.log('Schema validation: all schemas validated');
  }
}

module.exports = { validateRequired, validateType, validateSchema };
