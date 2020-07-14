import JSBI from 'jsbi';

/**
 * Check if a value looks like a JSBI value.
 */
export function isJsbi(value: unknown): value is JSBI {
  // if it has __clzmsd it's probably jsbi
  return Array.isArray(value) && '__clzmsd' in value;
}

export function isPlainObject(object: {}): boolean {
  if (Object.getPrototypeOf(object) === null) {
    return true;
  }
  let proto = object;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(object) === proto;
}
