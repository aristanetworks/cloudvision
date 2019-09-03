import { Decode, Paper } from 'a-msgpack';
import { PlainObject } from '../../types';
export declare function decodeMap(decode: Decode, decoder: Paper, len: number): PlainObject<unknown>;
