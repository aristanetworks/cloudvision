import { ERROR, INFO, WARN } from '../src/constants';

export type LogLevel = typeof ERROR | typeof INFO | typeof WARN;

/** @deprecated: Use `LogLevel`. */
export type LogLevels = LogLevel;
