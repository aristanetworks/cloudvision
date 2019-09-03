/* eslint-env jest */

import Parser, {
  decodeNotifications,
  decodePathElements,
  encodeNotifications,
  encodePathElementsAndKeysInQuery,
} from '../src/parser';

import {
  encodedPath1,
  encodedPath2,
  encodedQuery,
  encodedQueryWithKeys,
  expectedFirstNotif,
  expectedFourthNotif,
  expectedRootNotif,
  expectedSecondNotif,
  expectedSixthNotif,
  expectedThirdNotif,
  firstNotif,
  firstNotifPublishBatched,
  firstNotifPublishRaw,
  fourthNotif,
  fourthNotifPublishBatched,
  fourthNotifPublishRaw,
  path1,
  path2,
  query,
  queryWithKeys,
  rootNotif,
  rootNotifPublishRaw,
  secondNotif,
  secondNotifPublishBatched,
  secondNotifPublishRaw,
  sixthNotif,
  sixthNotifPublishBatched,
  sixthNotifPublishRaw,
  thirdNotif,
  thirdNotifPublishBatched,
  thirdNotifPublishRaw,
} from './fixtures';

describe('encode/decode path elements', () => {
  test('encodePathElementsAndKeysInQuery just path elements', () => {
    const clonedQuery = JSON.parse(JSON.stringify(query));
    expect(encodePathElementsAndKeysInQuery(clonedQuery)).toEqual(encodedQuery);
    expect(clonedQuery).toEqual(query);
  });

  test('encodePathElementsAndKeysInQuery with keys', () => {
    const clonedQuery = JSON.parse(JSON.stringify(queryWithKeys));
    expect(encodePathElementsAndKeysInQuery(clonedQuery)).toEqual(encodedQueryWithKeys);
    expect(clonedQuery).toEqual(queryWithKeys);
  });

  test('decodePathElements', () => {
    const clonedEncodedPath1 = JSON.parse(JSON.stringify(encodedPath1));
    const clonedEncodedPath2 = JSON.parse(JSON.stringify(encodedPath2));
    expect(decodePathElements(clonedEncodedPath2)).toEqual(path2);
    expect(decodePathElements(clonedEncodedPath1)).toEqual(path1);
    expect(clonedEncodedPath2).toEqual(encodedPath2);
    expect(clonedEncodedPath1).toEqual(encodedPath1);
    expect(decodePathElements([])).toEqual([]);
  });
});

describe('Parser', () => {
  const encodedData = {
    dataset: { type: 'device', name: 'Dodgers' },
    notifications: [firstNotif, secondNotif, thirdNotif, fourthNotif, sixthNotif],
  };

  describe('parse', () => {
    const batchedResult = {
      dataset: { type: 'device', name: 'Dodgers' },
      notifications: {
        [JSON.stringify(path1)]: [
          expectedFirstNotif,
          expectedThirdNotif,
          expectedFourthNotif,
          expectedSixthNotif,
        ],
        [JSON.stringify(path2)]: [
          expectedSecondNotif,
        ],
      },
    };

    const rawResult = {
      dataset: { type: 'device', name: 'Dodgers' },
      notifications: [
        expectedFirstNotif,
        expectedSecondNotif,
        expectedThirdNotif,
        expectedFourthNotif,
        expectedSixthNotif,
      ],
    };
    const data = {
      result: encodedData,
      status: {},
      token: 'someToken',
    };
    const expectedBatchData = {
      result: batchedResult,
      status: {},
      token: 'someToken',
    };
    const expectedRawFormat = {
      result: rawResult,
      status: {},
      token: 'someToken',
    };

    test('decode messages in batch format', () => {
      expect(Parser.parse(JSON.stringify(data), true)).toEqual(expectedBatchData);
    });

    test('decode messages in raw format', () => {
      expect(Parser.parse(JSON.stringify(data))).toEqual(expectedRawFormat);
    });
  });

  describe('stringify', () => {
    const batchedResult = {
      dataset: { type: 'device', name: 'Dodgers' },
      notifications: {
        [JSON.stringify(path1)]: [
          firstNotifPublishBatched,
          secondNotifPublishBatched,
          thirdNotifPublishBatched,
          fourthNotifPublishBatched,
          sixthNotifPublishBatched,
        ],
      },
    };

    const rawResult = {
      dataset: { type: 'device', name: 'Dodgers' },
      notifications: [
        firstNotifPublishRaw,
        secondNotifPublishRaw,
        thirdNotifPublishRaw,
        fourthNotifPublishRaw,
        sixthNotifPublishRaw,
      ],
    };

    const expectedPublishData = {
      token: 'someToken',
      params: {
        sync: true,
        batch: encodedData,
      },
    };

    test('encode messages given in batch format', () => {
      const publishBatchParams = {
        token: 'someToken',
        params: {
          sync: true,
          batch: batchedResult,
        },
      };
      expect(JSON.parse(Parser.stringify(publishBatchParams))).toEqual(expectedPublishData);
    });

    test('encode messages given in raw format', () => {
      const publishRawParams = {
        token: 'someToken',
        params: {
          sync: true,
          batch: rawResult,
        },
      };
      expect(JSON.parse(Parser.stringify(publishRawParams))).toEqual(expectedPublishData);
    });
  });
});

describe('decodeNotifications', () => {
  test('should properly batch requests for multiple paths', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        firstNotif,
        secondNotif,
        thirdNotif,
        fourthNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        [JSON.stringify(path1)]: [
          expectedFirstNotif,
          expectedThirdNotif,
          expectedFourthNotif,
        ],
        [JSON.stringify(path2)]: [
          expectedSecondNotif,
        ],
      },
    };

    const decodedNotif = decodeNotifications(notif, true);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for one path', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        firstNotif,
        thirdNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        [JSON.stringify(path1)]: [
          expectedFirstNotif,
          expectedThirdNotif,
        ],
      },
    };

    const batchedNotif = decodeNotifications(notif, true);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly batch requests for the root path', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        rootNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        [JSON.stringify([])]: [
          expectedRootNotif,
        ],
      },
    };

    const batchedNotif = decodeNotifications(notif, true);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for multiple paths', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        firstNotif,
        secondNotif,
        thirdNotif,
        fourthNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: [
        expectedFirstNotif,
        expectedSecondNotif,
        expectedThirdNotif,
        expectedFourthNotif,
      ],
    };

    const decodedNotif = decodeNotifications(notif);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode non batch requests for for one path', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        firstNotif,
        thirdNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: [
        expectedFirstNotif,
        expectedThirdNotif,
      ],
    };

    const batchedNotif = decodeNotifications(notif);

    expect(batchedNotif).toEqual(expectedNotif);
    expect(batchedNotif).not.toBe(expectedNotif);
  });

  test('should properly decode delete all', () => {
    const notif = {
      dataset: 'device1',
      notifications: [
        firstNotif,
        sixthNotif,
      ],
    };
    const expectedNotif = {
      dataset: 'device1',
      notifications: {
        [JSON.stringify(path1)]: [
          expectedFirstNotif,
          expectedSixthNotif,
        ],
      },
    };

    const decodedNotif = decodeNotifications(notif, true);

    expect(decodedNotif).toEqual(expectedNotif);
    expect(decodedNotif).not.toBe(expectedNotif);
  });
});

describe('encodeNotifications', () => {
  const rawNotifs = {
    dataset: { type: 'device', name: 'Dodgers' },
    notifications: [
      rootNotifPublishRaw,
      firstNotifPublishRaw,
      secondNotifPublishRaw,
      thirdNotifPublishRaw,
      fourthNotifPublishRaw,
    ],
  };

  const batchedNotifs = {
    dataset: { type: 'device', name: 'Dodgers' },
    notifications: {
      [JSON.stringify(path1)]: [
        rootNotifPublishRaw,
        firstNotifPublishRaw,
        secondNotifPublishRaw,
        thirdNotifPublishRaw,
        fourthNotifPublishRaw,
      ],
    },
  };

  const encodedNotifs = {
    dataset: { type: 'device', name: 'Dodgers' },
    notifications: [
      rootNotif,
      firstNotif,
      secondNotif,
      thirdNotif,
      fourthNotif,
    ],
  };

  test('should properly encode raw CloudVision notifications', () => {
    expect(encodeNotifications(rawNotifs)).toEqual(encodedNotifs);
  });

  test('should properly encode batched CloudVision notifications', () => {
    expect(encodeNotifications(batchedNotifs)).toEqual(encodedNotifs);
  });
});
