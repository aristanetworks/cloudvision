/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'arista.subscriptions';

export enum Operation {
  UNSPECIFIED = 0,
  /**
   * INITIAL - INITIAL indicates the associated notification is that of the
   * current state and a fully-specified Resource is provided.
   */
  INITIAL = 10,
  /**
   * INITIAL_SYNC_COMPLETE - INITIAL_SYNC_COMPLETE indicates all existing-state has been
   * streamed to the client. This status will be sent in an
   * otherwise-empty message and no subsequent INITIAL messages
   * should be expected.
   */
  INITIAL_SYNC_COMPLETE = 11,
  /**
   * UPDATED - UPDATED indicates the associated notification carries
   * modification to the last-streamed state. This indicates
   * the contained Resource may be a partial diff, though, it
   * may contain a fully-specified Resource.
   */
  UPDATED = 20,
  /**
   * DELETED - DETLETED indicates the associated notification carries
   * a deletion. The Resource's key will always be set in this case,
   * but no other fields should be expected.
   */
  DELETED = 30,
  UNRECOGNIZED = -1,
}

export function operationFromJSON(object: any): Operation {
  switch (object) {
    case 0:
    case 'UNSPECIFIED':
      return Operation.UNSPECIFIED;
    case 10:
    case 'INITIAL':
      return Operation.INITIAL;
    case 11:
    case 'INITIAL_SYNC_COMPLETE':
      return Operation.INITIAL_SYNC_COMPLETE;
    case 20:
    case 'UPDATED':
      return Operation.UPDATED;
    case 30:
    case 'DELETED':
      return Operation.DELETED;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return Operation.UNRECOGNIZED;
  }
}

export function operationToJSON(object: Operation): string {
  switch (object) {
    case Operation.UNSPECIFIED:
      return 'UNSPECIFIED';
    case Operation.INITIAL:
      return 'INITIAL';
    case Operation.INITIAL_SYNC_COMPLETE:
      return 'INITIAL_SYNC_COMPLETE';
    case Operation.UPDATED:
      return 'UPDATED';
    case Operation.DELETED:
      return 'DELETED';
    default:
      return 'UNKNOWN';
  }
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
