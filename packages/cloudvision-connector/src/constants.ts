// Copyright (c) 2018, Arista Networks, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { RequestContext, SearchType } from '../types';

export const ERROR = 'ERROR';
export const INFO = 'INFO';
export const WARN = 'WARN';

export const EOF = 'EOF';

/**
 * Status code for EOF (End Of File).
 */
export const EOF_CODE = 1001;

/**
 * Status code for Active (when a subscription has been created and is active).
 */
export const ACTIVE_CODE = 3001;

/**
 * Error status sent when a request has finished streaming data.
 */
export const RESPONSE_COMPLETED = 'RESPONSE_COMPLETED';

export const GET_REQUEST_COMPLETED = 'GetRequest';

export const CLOSE = 'close';
export const DEVICES_DATASET_ID = 'DEVICES_DATASET_ID';
export const GET = 'get';
export const GET_DATASETS = 'getDatasets';
export const GET_AND_SUBSCRIBE = 'getAndSubscribe';
export const PUBLISH = 'publish';
export const SUBSCRIBE = 'subscribe';
export const SEARCH = 'alpha/search';
export const SEARCH_SUBSCRIBE = 'alpha/searchSubscribe';
export const SERVICE_REQUEST = 'serviceRequest';

export const APP_DATASET_TYPE = 'app';
export const CONFIG_DATASET_TYPE = 'config';
export const DEVICE_DATASET_TYPE = 'device';

export const SEARCH_TYPE_ANY = 'ANY';
export const SEARCH_TYPE_IP = 'IP';
export const SEARCH_TYPE_MAC = 'MAC';
export const ALL_SEARCH_TYPES = new Set<SearchType>([
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_IP,
  SEARCH_TYPE_MAC,
]);

export const CONNECTED = 'connected';
export const DISCONNECTED = 'disconnected';
export const ID = 'cloudvision-connector';

export const DEFAULT_CONTEXT: RequestContext = {
  command: 'NO_COMMAND',
  token: 'NO_TOKEN',
  encodedParams: 'NO_PARAMS',
};
