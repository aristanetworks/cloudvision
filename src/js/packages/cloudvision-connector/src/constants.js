/* @flow */

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
 * Status code for Paused (when the incoming results for a request have been paused).
 */
export const PAUSED_CODE = 1002;

/**
 * Error status sent when a request has finished streaming data.
 */
export const RESPONSE_COMPLETED = 'RESPONSE_COMPLETED';

export const CLOSE = 'close';
export const DEVICES_DATASET_ID = 'DEVICES_DATASET_ID';
export const GET = 'get';
export const GET_DATASETS = 'getDatasets';
export const PAUSE = 'pause';
export const PUBLISH = 'publish';
export const RESUME = 'resume';
export const SUBSCRIBE = 'subscribe';
export const SEARCH = 'alpha/search';
export const SEARCH_SUBSCRIBE = 'alpha/searchSubscribe';

export const APP_DATASET_TYPE = 'app';
export const DEVICE_DATASET_TYPE = 'device';

export const SEARCH_TYPE_ANY = 'ANY';
export const SEARCH_TYPE_IP = 'IP';
export const SEARCH_TYPE_MAC = 'MAC';
export const ALL_SEARCH_TYPES: Set<string> = new Set([
  SEARCH_TYPE_ANY,
  SEARCH_TYPE_MAC,
  SEARCH_TYPE_IP,
]);

export const CONNECTED = 'connected';
export const DISCONNECTED = 'disconnected';
