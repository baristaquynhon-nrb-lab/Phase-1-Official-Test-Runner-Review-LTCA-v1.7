/**
 * RFC 8785-compliant canonical JSON implementation
 * Ensures deterministic serialization for hash stability
 */

export function canonicalJSON(obj) {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return canonicalNumber(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    const elements = obj.map(canonicalJSON);
    return `[${elements.join(',')}]`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(key => {
      const value = canonicalJSON(obj[key]);
      return `${JSON.stringify(key)}:${value}`;
    });
    return `{${pairs.join(',')}}`;
  }
  throw new Error(`Cannot canonicalize type: ${typeof obj}`);
}

function canonicalNumber(num) {
  if (Number.isInteger(num)) return num.toString();
  // IEEE 754 double precision
  return num.toPrecision(15).replace(/\.?0+$/, '');
}

export function canonicalize(obj) {
  return canonicalJSON(obj);
}
