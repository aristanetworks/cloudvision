import { PlainObject } from '../../types';
import { BaseType } from '../../types/neat';
export declare function createBaseType(value: unknown): BaseType;
export declare function createTypedMap(object: PlainObject<unknown>): Map<BaseType, BaseType>;
