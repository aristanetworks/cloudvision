import { DEVICE_DATASET_TYPE } from '../src/constants';

export const path1 = ['some', 'other', { path: 'here' }];
export const path2 = ['some', 'path'];
export const path3 = ['some', 'path', { path: 'here' }];
export const encodedPath1 = ['xARzb21l', 'xAVvdGhlcg==', 'gcQEcGF0aMQEaGVyZQ=='];
export const encodedPath2 = ['xARzb21l', 'xARwYXRo'];
export const encodedPath3 = ['xARzb21l', 'xARwYXRo', 'gcQEcGF0aMQEaGVyZQ=='];

export const key1 = 'firstKey';
export const encodedKey1 = 'xAhmaXJzdEtleQ==';

export const rootNotif = {
  timestamp: { seconds: 1539822611, nanos: 883496 },
  updates: [{
    key: 'xA1CYXNlYmFsbCBUZWFt',
    value: 'xAdEb2RnZXJz',
  }, {
    key: 'xA1CYXkgQXJlYSBUZWFt',
    value: 'xAlBdGhsZXRpY3M=',
  }],
};

export const firstNotif = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822611, nanos: 883496678 },
  updates: [{
    key: 'xA1CYXNlYmFsbCBUZWFt',
    value: 'xAdEb2RnZXJz',
  }, {
    key: 'xA1CYXkgQXJlYSBUZWFt',
    value: 'xAlBdGhsZXRpY3M=',
  }],
};
export const secondNotif = {
  path_elements: encodedPath2,
  timestamp: { seconds: 1539822631, nanos: 883496 },
  updates: [{
    key: 'xApCYXNrZXRiYWxs',
    value: 'xANOQkE=',
  }],
};
export const thirdNotif = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822611 },
  updates: [{
    key: 'gcQFc3BvcnTECGJhc2ViYWxs',
    value: 'ksQCTkzEAkFM',
  }],
  deletes: [
    'xA1CYXkgQXJlYSBUZWFt',
  ],
};
export const fourthNotif = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539822631, nanos: 9934968754 },
  deletes: [
    'xA1CYXNlYmFsbCBUZWFt',
  ],
};
export const fifthNotif = {
  path_elements: encodedPath3,
  timestamp: { seconds: 1539822631, nanos: 993496 },
  updates: [{
    key: 'xApCYXNrZXRiYWxs',
    value: 'xANOQkE=',
  }],
};
export const sixthNotif = {
  path_elements: encodedPath1,
  timestamp: { seconds: 1539832611, nanos: 883496678 },
  delete_all: true,
};

export const expectedRootNotif = {
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
export const expectedFirstNotif = {
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
export const expectedSecondNotif = {
  path_elements: path2,
  timestamp: 1539822631000,
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedThirdNotif = {
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
export const expectedFourthNotif = {
  path_elements: path1,
  timestamp: 1539822631993,
  deletes: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
    },
  },
};

export const expectedFifthNotif = {
  path_elements: path3,
  timestamp: 1539822631000,
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const expectedSixthNotif = {
  path_elements: path1,
  timestamp: 1539832611883,
  deletes: {},
};

export const firstNotifPublishRaw = {
  path_elements: path1,
  timestamp: { seconds: 1539822611, nanos: 883496678 },
  updates: [{
    key: 'Baseball Team',
    value: 'Dodgers',
  }, {
    key: 'Bay Area Team',
    value: 'Athletics',
  }],
};
export const secondNotifPublishRaw = {
  path_elements: path2,
  timestamp: { seconds: 1539822631, nanos: 883496 },
  updates: [{
    key: 'Basketball',
    value: 'NBA',
  }],
};
export const thirdNotifPublishRaw = {
  path_elements: path1,
  timestamp: { seconds: 1539822611 },
  updates: [{
    key: { sport: 'baseball' },
    value: ['NL', 'AL'],
  }],
  deletes: [
    'Bay Area Team',
  ],
};
export const fourthNotifPublishRaw = {
  path_elements: path1,
  timestamp: { seconds: 1539822631, nanos: 9934968754 },
  deletes: ['Baseball Team'],
};
export const sixthNotifPublishRaw = {
  path_elements: path1,
  timestamp: { seconds: 1539832611, nanos: 883496678 },
  deletes: {},
};
export const rootNotifPublishRaw = {
  path_elements: [],
  timestamp: { seconds: 1539822611, nanos: 883496 },
  updates: [{
    key: 'Baseball Team',
    value: 'Dodgers',
  }, {
    key: 'Bay Area Team',
    value: 'Athletics',
  }],
};

export const firstNotifPublishBatched = {
  path_elements: path1,
  timestamp: { seconds: 1539822611, nanos: 883496678 },
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
export const secondNotifPublishBatched = {
  path_elements: path2,
  timestamp: { seconds: 1539822631, nanos: 883496 },
  updates: {
    xApCYXNrZXRiYWxs: {
      key: 'Basketball',
      value: 'NBA',
    },
  },
};
export const thirdNotifPublishBatched = {
  path_elements: path1,
  timestamp: { seconds: 1539822611 },
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
export const fourthNotifPublishBatched = {
  path_elements: path1,
  timestamp: { seconds: 1539822631, nanos: 9934968754 },
  deletes: {
    xA1CYXNlYmFsbCBUZWFt: {
      key: 'Baseball Team',
    },
  },
};
export const sixthNotifPublishBatched = {
  path_elements: path1,
  timestamp: { seconds: 1539832611, nanos: 883496678 },
  deletes: {},
};
export const rootNotifPublishBatched = {
  path_elements: [],
  timestamp: { seconds: 1539822611, nanos: 883496 },
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

export const query = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: path2,
  }],
}, {
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device2',
  },
  paths: [{
    path_elements: path1,
  }, {
    path_elements: path2,
  }],
}];

export const queryWithKeys = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: path2,
    keys: [key1],
  }],
}, {
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device2',
  },
  paths: [{
    path_elements: path1,
  }, {
    path_elements: path2,
  }],
}];

export const encodedQuery = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: encodedPath2,
  }],
}, {
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device2',
  },
  paths: [{
    path_elements: encodedPath1,
  }, {
    path_elements: encodedPath2,
  }],
}];

export const encodedQueryWithKeys = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: encodedPath2,
    keys: [encodedKey1],
  }],
}, {
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device2',
  },
  paths: [{
    path_elements: encodedPath1,
  }, {
    path_elements: encodedPath2,
  }],
}];

export const queryOneDeviceMultiplePaths = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: path1,
  }, {
    path_elements: path2,
  }],
}];

export const encodedQueryOneDeviceMultiplePaths = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device2',
  },
  paths: [{
    path_elements: encodedPath1,
  }, {
    path_elements: encodedPath2,
  }],
}];

export const queryOneDeviceOnePath = [{
  dataset: {
    type: DEVICE_DATASET_TYPE,
    name: 'device1',
  },
  paths: [{
    path_elements: path1,
  }],
}];
