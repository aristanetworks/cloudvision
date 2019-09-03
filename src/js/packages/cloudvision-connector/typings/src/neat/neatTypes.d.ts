import JSBI from 'jsbi';
import { PathElements } from '../../types/neat';
export declare class Float32 {
    static type: 'float32';
    type: 'float32';
    value: number;
    constructor(value: unknown);
    toString(): string;
}
export declare class Float64 {
    static type: 'float64';
    type: 'float64';
    value: number;
    constructor(value: unknown);
    toString(): string;
}
export declare class Int {
    static type: 'int';
    type: 'int';
    value: number | bigint | JSBI;
    constructor(value: unknown, forceJSBI?: boolean);
    toString(): string;
}
export declare class Bool {
    static type: 'bool';
    type: 'bool';
    value: boolean;
    constructor(value: unknown);
    toString(): string;
}
export declare class Nil {
    static type: 'nil';
    type: 'nil';
    value: null;
    constructor();
    toString(): string;
}
export declare class Str {
    static type: 'str';
    type: 'str';
    value: string;
    constructor(value: unknown);
    toString(): string;
}
export declare class Pointer {
    static type: 'ptr';
    value: PathElements;
    type: 'ptr';
    delimiter: string;
    constructor(value?: PathElements | string);
    toString(): string;
}
