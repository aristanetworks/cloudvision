export const WRITE_ONLY_HEADER = 'WRITE_ONLY_HEADER';

/**
 * ExtData is used to handle Extension Types that are not registered to ExtensionCodec.
 */
export class ExtData {
  constructor(readonly type: number, readonly data: Uint8Array | typeof WRITE_ONLY_HEADER) {
    this.type = type;
    this.data = data;
  }
}
