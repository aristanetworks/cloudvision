/* eslint-disable no-console */

import { LogLevels } from '../types';
import { CloudVisionStatus } from '../types/notifications';

import { ERROR, WARN } from './constants';

/**
 * Logs nicely formatted console log errors or wandings
 */
export function log(
  level: LogLevels,
  message: string | null,
  status?: CloudVisionStatus,
  token?: string,
): void {
  const contextualizedMessage = message ? `${level}: ${message}` : `${level}: No message provided`;
  const statusMessage = status
    ? `Status Code: ${status.code}, Status Message: ${status.message}`
    : undefined;
  const tokenMessage = token ? `Request Token: ${token}` : undefined;

  console.groupCollapsed('[[ CloudVision Connector ]]');
  switch (level) {
    case ERROR:
      if (tokenMessage) {
        console.error(tokenMessage);
      }
      console.error(contextualizedMessage);
      if (statusMessage) {
        console.error(statusMessage);
      }
      break;
    case WARN:
      if (tokenMessage) {
        console.warn(tokenMessage);
      }
      console.warn(contextualizedMessage);
      if (statusMessage) {
        console.warn(statusMessage);
      }
      break;
    default:
      if (tokenMessage) {
        console.log(tokenMessage);
      }
      console.log(contextualizedMessage);
      if (statusMessage) {
        console.log(statusMessage);
      }
      break;
  }
  console.groupEnd();
}
