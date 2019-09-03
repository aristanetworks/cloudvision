import writeFormat from './write-format';

export function generateDefaultWriteType(encode) {
  const writeType = {};

  writeType.bin = writeFormat.bin;
  writeType.boolean = writeFormat.boolean;
  writeType.function = writeFormat.nil;
  writeType.int = writeFormat.int;
  writeType.null = writeFormat.nil;
  writeType.number = writeFormat.number;
  writeType.string = writeFormat.string;
  writeType.symbol = writeFormat.nil;
  writeType.undefined = writeFormat.nil;
  writeType.jsBi = writeFormat.jsBi;

  writeType.array = (...m) => writeFormat.array(encode, ...m);
  writeType.bigint = (...m) => writeFormat.bigint(encode, ...m);
  writeType.map = (...m) => writeFormat.map(encode, ...m);
  writeType.object = (...m) => writeFormat.object(encode, writeType, ...m);

  return writeType;
}
