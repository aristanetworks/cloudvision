/* eslint-env jest */

import { ERROR, INFO, WARN } from '../src/constants';
import { log } from '../src/logger';
import { LogLevel } from '../types';

describe.each<[LogLevel, string]>([
  [ERROR, 'error'],
  [INFO, 'log'],
  [WARN, 'warn'],
])('log', (level, fn) => {
  const groupSpy = jest.spyOn(console, 'groupCollapsed');
  // @ts-ignore spyOn uses the string name of the function
  const consoleSpy = jest.spyOn(console, fn);
  const message = 'Dodgers rule';
  const status = { code: 0, message: 'Giants not that great' };
  const token = 'MLB';

  beforeEach(() => {
    groupSpy.mockReset();
    consoleSpy.mockReset();
  });

  test(`${level} should log a console group for just a message`, () => {
    log(level, message);
    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, `${level}: ${message}`);
  });

  test(`${level} should log a console group for a message and status`, () => {
    log(level, message, status);
    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, `${level}: ${message}`);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      `Status Code: ${status.code}, Status Message: ${status.message}`,
    );
  });

  test(`${level} should log a console group for a message, status and token`, () => {
    log(level, message, status, token);
    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, `Request Token: ${token}`);
    expect(consoleSpy).toHaveBeenNthCalledWith(2, `${level}: ${message}`);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      3,
      `Status Code: ${status.code}, Status Message: ${status.message}`,
    );
  });
});
