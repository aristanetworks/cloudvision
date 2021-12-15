import { PathElements } from 'a-msgpack';

import { DEVICE_DATASET_TYPE } from '../src/constants';
import { ConvertedNotification, PublishNotification, Query, RawNotification } from '../types';

export const path1: PathElements = ['some', 'other', { path: 'here' }];
export const path2: PathElements = ['some', 'path'];
export const path3: PathElements = ['some', 'path', { path: 'here' }];
export const encodedPath1 = ['xARzb21l', 'xAVvdGhlcg==', 'gcQEcGF0aMQEaGVyZQ=='];
export const encodedPath2 = ['xARzb21l', 'xARwYXRo'];
export const encodedPath3 = ['xARzb21l', 'xARwYXRo', 'gcQEcGF0aMQEaGVyZQ=='];

export const key1 = 'firstKey';
export const encodedKey1 = 'xAhmaXJzdEtleQ==';

export const rootNotif: RawNotification = {
  timestamp: { seconds: 1539822611, nanos: 883496 },
  updates: [
    {
      key: 'xA1CYXNlYmFsbCBUZWFt',
      value: 'xAdEb2RnZXJz',
    },
    {
      key: 'xA1CYXkgQXJlYSBUZWFt',
      value: 'xAlBdGhsZXRpY3M=',
    },
  ],
};

export const firstNotif: RawNotification = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822611, nanos: 883496678 },
  updates: [
    {
      key: 'xA1CYXNlYmFsbCBUZWFt',
      value: 'xAdEb2RnZXJz',
    },
    {
      key: 'xA1CYXkgQXJlYSBUZWFt',
      value: 'xAlBdGhsZXRpY3M=',
    },
  ],
};
export const secondNotif: RawNotification = {
  path_elements: encodedPath2,
  timestamp: { seconds: 1539822631, nanos: 883496 },
  updates: [
    {
      key: 'xApCYXNrZXRiYWxs',
      value: 'xANOQkE=',
    },
  ],
};
export const thirdNotif: RawNotification = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822611 },
  updates: [
    {
      key: 'gcQFc3BvcnTECGJhc2ViYWxs',
      value: 'ksQCTkzEAkFM',
    },
  ],
  deletes: ['xA1CYXkgQXJlYSBUZWFt'],
};
export const fourthNotif: RawNotification = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822631, nanos: 9934968754 },
  deletes: ['xA1CYXNlYmFsbCBUZWFt'],
};
export const fifthNotif: RawNotification = {
  path_elements: encodedPath3,
  timestamp: { seconds: 1539822631, nanos: 993496 },
  updates: [
    {
      key: 'xApCYXNrZXRiYWxs',
      value: 'xANOQkE=',
    },
  ],
};
export const sixthNotif: RawNotification = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539832611, nanos: 883496678 },
  delete_all: true,
};

export const expectedRootNotif: ConvertedNotification = {
  path_elements: [],
  timestamp: 1539822611000,
  updates: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  },
};
export const expectedRootNotifNanos: ConvertedNotification = {
  path_elements: [],
  timestamp: '1539822611000883496',
  updates: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  },
};
export const expectedFirstNotif: ConvertedNotification = {
  path_elements: path1,
  timestamp: 1539822611883,
  updates: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  },
};
export const expectedFirstNotifNanos: ConvertedNotification = {
  path_elements: path1,
  timestamp: '1539822611883496678',
  updates: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  },
};
export const expectedSecondNotif: ConvertedNotification = {
  path_elements: path2,
  timestamp: 1539822631000,
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedSecondNotifNanos: ConvertedNotification = {
  path_elements: path2,
  timestamp: '1539822631000883496',
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedThirdNotif: ConvertedNotification = {
  path_elements: path1,
  timestamp: 1539822611000,
  updates: {
    gcQFc3BvcnTECGJhc2ViYWxs: {
      key: { sport: 'baseball' },
      value: ['NL', 'AL'],
    },
  },
  deletes: {
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
    },
  },
};
export const expectedThirdNotifNanos: ConvertedNotification = {
  path_elements: path1,
  timestamp: '1539822611000000000',
  updates: {
    gcQFc3BvcnTECGJhc2ViYWxs: {
      key: { sport: 'baseball' },
      value: ['NL', 'AL'],
    },
  },
  deletes: {
    xA1CYXkgQXJlYSBUZWFt: {
      key: 'Bay Area Team',
    },
  },
};
export const expectedFourthNotif: ConvertedNotification = {
  path_elements: path1,
  timestamp: 1539822631993,
  deletes: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
    },
  },
};
export const expectedFourthNotifNanos: ConvertedNotification = {
  path_elements: path1,
  timestamp: '15398226319934968754',
  deletes: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
    },
  },
};
export const expectedFifthNotif: ConvertedNotification = {
  path_elements: path3,
  timestamp: 1539822631000,
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedFifthNotifNanos: ConvertedNotification = {
  path_elements: path3,
  timestamp: '1539822631000993496',
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedSixthNotif: ConvertedNotification = {
  path_elements: path1,
  timestamp: 1539832611883,
  deletes: {},
};
export const expectedSixthNotifNanos: ConvertedNotification = {
  path_elements: path1,
  timestamp: '1539832611883496678',
  deletes: {},
};

export const firstNotifPublishRaw: PublishNotification = {
  path_elements: path1,
  timestamp: { seconds: 1539822611, nanos: 883496678 },
  updates: [
    {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  ],
};
export const secondNotifPublishRaw: PublishNotification = {
  path_elements: path2,
  timestamp: { seconds: 1539822631, nanos: 883496 },
  updates: [
    {
      key: 'Basketball',
      value: 'NBA',
    },
  ],
};
export const thirdNotifPublishRaw: PublishNotification = {
  path_elements: path1,
  timestamp: { seconds: 1539822611 },
  updates: [
    {
      key: { sport: 'baseball' },
      value: ['NL', 'AL'],
    },
  ],
  deletes: ['Bay Area Team'],
};
export const fourthNotifPublishRaw: PublishNotification = {
  path_elements: path1,
  timestamp: { seconds: 1539822631, nanos: 9934968754 },
  deletes: ['Baseball Team'],
};
export const sixthNotifPublishRaw: PublishNotification = {
  path_elements: path1,
  timestamp: { seconds: 1539832611, nanos: 883496678 },
  deletes: [],
};
export const rootNotifPublishRaw: PublishNotification = {
  path_elements: [],
  timestamp: { seconds: 1539822611, nanos: 883496 },
  updates: [
    {
      key: 'Baseball Team',
      value: 'Dodgers',
    },
    {
      key: 'Bay Area Team',
      value: 'Athletics',
    },
  ],
};

export const query: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: path2,
      },
    ],
  },
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device2',
    },
    paths: [
      {
        path_elements: path1,
      },
      {
        path_elements: path2,
      },
    ],
  },
];

export const queryWithKeys: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: path2,
        keys: [key1],
      },
    ],
  },
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device2',
    },
    paths: [
      {
        path_elements: path1,
      },
      {
        path_elements: path2,
      },
    ],
  },
];

export const encodedQuery: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: encodedPath2,
      },
    ],
  },
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device2',
    },
    paths: [
      {
        path_elements: encodedPath1,
      },
      {
        path_elements: encodedPath2,
      },
    ],
  },
];

export const encodedQueryWithKeys: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: encodedPath2,
        keys: [encodedKey1],
      },
    ],
  },
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device2',
    },
    paths: [
      {
        path_elements: encodedPath1,
      },
      {
        path_elements: encodedPath2,
      },
    ],
  },
];

export const queryOneDeviceMultiplePaths: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: path1,
      },
      {
        path_elements: path2,
      },
    ],
  },
];

export const encodedQueryOneDeviceMultiplePaths: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device2',
    },
    paths: [
      {
        path_elements: encodedPath1,
      },
      {
        path_elements: encodedPath2,
      },
    ],
  },
];

export const queryOneDeviceOnePath: Query = [
  {
    dataset: {
      type: DEVICE_DATASET_TYPE,
      name: 'device1',
    },
    paths: [
      {
        path_elements: path1,
      },
    ],
  },
];
