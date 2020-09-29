import { NeatType, PathElements } from 'a-msgpack';

import {
  APP_DATASET_TYPE,
  CLOSE,
  CONFIG_DATASET_TYPE,
  DEVICE_DATASET_TYPE,
  GET,
  GET_AND_SUBSCRIBE,
  GET_DATASETS,
  PUBLISH,
  SEARCH,
  SEARCH_SUBSCRIBE,
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_IP,
  SEARCH_TYPE_MAC,
  SERVICE_REQUEST,
  SUBSCRIBE,
} from '../src/constants';

export type GetCommand = typeof GET | typeof GET_DATASETS | typeof SEARCH;

/** @deprecated: Use `GetCommand`. */
export type GetCommands = GetCommand;

export type StreamCommand =
  | typeof SERVICE_REQUEST
  | typeof SEARCH_SUBSCRIBE
  | typeof SUBSCRIBE
  | typeof GET_AND_SUBSCRIBE;

/** @deprecated: Use `StreamCommand`. */
export type StreamCommands = StreamCommand;

export type WsCommand = GetCommand | StreamCommand | typeof CLOSE | typeof PUBLISH;

export type DatasetType =
  | typeof APP_DATASET_TYPE
  | typeof CONFIG_DATASET_TYPE
  | typeof DEVICE_DATASET_TYPE;

/** @deprecated: Use `DatasetType`. */
export type DatasetTypes = DatasetType;

export type SearchType = typeof SEARCH_TYPE_ANY | typeof SEARCH_TYPE_IP | typeof SEARCH_TYPE_MAC;

export interface PathObject {
  path_elements: PathElements;

  keys?: readonly NeatType[];
}

export interface SearchOptions {
  search: string;
  searchType?: SearchType;
}

export interface DatasetObject {
  name: string;
  type: DatasetType;
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

export interface DatasetParams {
  types?: DatasetType[];
}

export interface SearchParams {
  query: Query;
  search: string;
  searchType: SearchType;

  end?: number;
  start?: number;
}

/**
 * Parameters passed to the [[Connector.close]] request.
 */
export interface CloseParams {
  [token: string]: boolean;
}

export type CloudVisionParams = CloseParams | DatasetParams | QueryParams | SearchParams;
