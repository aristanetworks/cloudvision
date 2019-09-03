const decoder = new TextDecoder();
const encoder = new TextEncoder();

// The given argument must be an array of Uint8Arrays.
export function concat(buffers) {
  const bufferCount = buffers.length;
  let totalLength = 0;
  for (let i = 0; i < bufferCount; ++i) {
    totalLength += buffers[i].byteLength;
  }
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (let i = 0; i < bufferCount; ++i) {
    const buffer = buffers[i];
    output.set(buffer, offset);
    offset += buffer.byteLength;
  }
  return output;
}

// The first argument must be a Uint8Array.
// Start and end indices will be clamped to the range of the given Uint8Array.
export function subarray(buffer, start, end) {
  const newStart = Math.min(Math.max(0, start), buffer.byteLength);
  return new Uint8Array(
    buffer.buffer,
    buffer.byteOffset + newStart,
    Math.min(Math.max(newStart, end), buffer.byteLength) - newStart,
  );
}

export function toString(buffer, start, end) {
  return decoder.decode(subarray(buffer, start, end));
}

export function fromString(string) {
  return encoder.encode(string);
}
