import { NeatType, PathElements } from 'a-msgpack';

export type DatasetCommand = 'DEVICES_DATASET_ID';
type get = 'get';
type subscribe = 'subscribe';
type close = 'close';
type getDatasets = 'getDatasets';
type publish = 'publish';
type search = 'alpha/search';
type searchSubscribe = 'alpha/searchSubscribe';
type pause = 'pause';
type resume = 'resume';
type serviceRequest = 'serviceRequest';
export type WsCommand =
  | GetCommands
  | StreamCommands
  | close
  | publish
  | pause
  | resume
  | serviceRequest;
export type GetCommands = get | getDatasets | search;
export type StreamCommands = subscribe | searchSubscribe | serviceRequest;
export type DatasetTypes = 'device' | 'app';
export type SearchType = 'MAC' | 'IP' | 'ANY';

export interface PathObject {
  path_elements: PathElements;
  keys?: readonly NeatType[];
}

export interface SearchOptions {
  search: string;
  searchType?: SearchType;
}

export interface DatasetObject {
  type: DatasetTypes;
  name: string;
}

export interface QueryObject {
  dataset: DatasetObject;
  paths: PathObject[];
}

/**
 * A query is a list of one or more objects. Each of these objects has two keys:
 * **dataset** (an object with keys **type** and **name**), and **paths**
 * (an array of path objects (with keys **type**, **path** and **keys**).
 *
 * Dataset object:
 *   type (string): can be 'device' or 'app'. The 'device' type is for physical
 *         devices (switches), whereas 'app' is for any analytics engines.
 *   name (string): the name of the dataset.
 *
 * Path object:
 *   path_elements (array): An array of path elements representing the path to
 *         the requested data.
 *   keys (object): an optional property so that only data with such keys are returned.
 *   Sample keys object: { 'any_custom_key': { key: 'speed'} }
 *
 * @example
 * ```typescript
 *
 * [{
 *   dataset: {
 *     type: 'app',
 *     name: 'analytics'
 *   },
 *   paths: [{
 *     path_elements: ['events', 'activeEvents'],
 *   }],
 * }, {
 *   dataset: {
 *     type: 'device',
 *     name: 'JAS11070002'
 *   },
 *   paths: [{
 *     path_elements: ['Logs', 'var', 'log', 'messages'],
 *     keys: {
 *       logMessage: {
 *         key: 'text',
 *       },
 *     },
 *   }],
 * }]
 * ```
 */
export type Query = QueryObject[];

export interface QueryParams {
  query: Query;
  start?: number;
  end?: number;
  versions?: number;
}

export interface AppParams {
  types?: DatasetTypes[];
}

export interface SearchParams {
  end?: number;
  query: Query;
  search: string;
  searchType: SearchType;
  start?: number;
}

/**
 * Parameters passed to the [[Connector.close]] request.
 */
export interface CloseParams {
  [token: string]: boolean;
}

export interface PauseParams {
  pauseStreams: boolean;
}

export interface ResumeParams {
  token: string;
}

export type CloudVisionParams =
  | QueryParams
  | AppParams
  | CloseParams
  | SearchParams
  | PauseParams
  | ResumeParams;
