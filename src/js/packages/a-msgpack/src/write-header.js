function type(encoder, encodingType) {
  encoder.reserve(1);
  encoder.buffer[encoder.offset++] = encodingType;
}
function int8(encoder, encodingType, value) {
  encoder.reserve(2);
  const buffer = encoder.buffer;
  buffer[encoder.offset++] = encodingType;
  buffer[encoder.offset++] = value;
}
function int16(encoder, encodingType, value) {
  encoder.reserve(3);
  const buffer = encoder.buffer;
  buffer[encoder.offset++] = encodingType;
  buffer[encoder.offset++] = value >>> 8;
  buffer[encoder.offset++] = value;
}
function int32(encoder, encodingType, value) {
  encoder.reserve(5);
  const buffer = encoder.buffer;
  buffer[encoder.offset++] = encodingType;
  buffer[encoder.offset++] = value >>> 24;
  buffer[encoder.offset++] = value >>> 16;
  buffer[encoder.offset++] = value >>> 8;
  buffer[encoder.offset++] = value;
}
function int64(encoder, encodingType) {
  encoder.reserve(8);
  encoder.buffer[encoder.offset++] = encodingType;
}
function float32(encoder, value) {
  encoder.reserve(5);
  const buffer = encoder.buffer;
  buffer[encoder.offset++] = 0xca;
  new DataView(buffer.buffer).setFloat32(buffer.byteOffset + encoder.offset, value);
  encoder.offset += 4;
}
function float64(encoder, value) {
  encoder.reserve(9);
  const buffer = encoder.buffer;
  buffer[encoder.offset++] = 0xcb;
  new DataView(buffer.buffer).setFloat64(buffer.byteOffset + encoder.offset, value);
  encoder.offset += 8;
}

export default {
  type,
  int8,
  int16,
  int32,
  int64,
  float32,
  float64,
};
