/* eslint-disable @typescript-eslint/naming-convention */

import { PathElements } from '../../types/neat';

import { Bool, Float32, Float64, Int, Nil, Pointer, Str } from './NeatTypes';

interface SerializedNeatType {
  __neatTypeClass: string;
  value: unknown;
}

interface BasicNeatType {
  type: Bool['type'] | Float32['type'] | Float64['type'] | Int['type'] | Nil['type'] | Str['type'];
  value: unknown;
}

interface PointerNeatType {
  type: Pointer['type'];
  value: PathElements;
  delimiter: string;
}

export function isBaseNeatType(value: unknown): boolean {
  if (typeof value === 'object' && value !== null) {
    if (Object.keys(value).length === 2 && 'type' in value && 'value' in value) {
      const neatValue = value as BasicNeatType;
      return [Bool.type, Float32.type, Float64.type, Int.type, Nil.type, Str.type].includes(
        neatValue.type,
      );
    }
  }
  return false;
}

export function isNeatType(value: unknown): boolean {
  if (typeof value === 'object' && value !== null) {
    if (isBaseNeatType(value)) {
      return true;
    }
    if (
      Object.keys(value).length === 3 &&
      'type' in value &&
      'value' in value &&
      'delimiter' in value
    ) {
      const neatValue = value as PointerNeatType;
      return neatValue.type === Pointer.type;
    }
  }
  return false;
}

function sortByBinaryValue(a: Uint8Array, b: Uint8Array): number {
  const len = Math.min(a.length, b.length);

  if (a === b) {
    return 0;
  }

  for (let i = 0; i < len; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }

  return a.length - b.length;
}

export function sortMapByKey(a: [Uint8Array, unknown], b: [Uint8Array, unknown]): number {
  const aVal = a[0];
  const bVal = b[0];

  return sortByBinaryValue(aVal, bVal);
}

export class NeatTypeSerializer {
  private static NEAT_TYPE_MAP: {
    [type: string]:
      | typeof Float32
      | typeof Float64
      | typeof Int
      | typeof Pointer
      | typeof Str
      | typeof Nil
      | typeof Bool;
  } = {
    float32: Float32,
    float64: Float64,
    int: Int,
    ptr: Pointer,
    str: Str,
    nil: Nil,
    bool: Bool,
  };

  public static serialize(neatTypeInstance: BasicNeatType | PointerNeatType): SerializedNeatType {
    return {
      __neatTypeClass: neatTypeInstance.type,
      value: neatTypeInstance.value,
    };
  }

  public static deserialize(
    serializedNeatType: SerializedNeatType,
  ): BasicNeatType | PointerNeatType {
    // eslint-disable-next-line no-underscore-dangle
    return new NeatTypeSerializer.NEAT_TYPE_MAP[serializedNeatType.__neatTypeClass](
      serializedNeatType.value,
    );
  }
}
