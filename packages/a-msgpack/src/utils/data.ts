import JSBI from 'jsbi';

/**
 * Check if a value looks like a JSBI value.
 */
export function isJsbi(value: unknown): value is JSBI {
  // if it has __clzmsd it's probably jsbi
  return Array.isArray(value) && '__clzmsd' in value;
}
