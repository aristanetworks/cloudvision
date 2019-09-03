/* eslint-disable react/no-this-in-sfc */

import { concat, subarray } from './buffer-util';

const MIN_BUFFER_SIZE = 2048;
const MAX_BUFFER_SIZE = 65536;

const Paper = function Paper(codec, useJSBI) {
  this.codec = codec;
  this.useJSBI = useJSBI;
};
Paper.prototype.push = function push(chunk) {
  const buffers = this.buffers || (this.buffers = []);
  buffers.push(chunk);
};
Paper.prototype.read = function read() {
  this.flush();
  const buffers = this.buffers;
  if (buffers) {
    const chunk = buffers.length > 1 ? concat(buffers) : buffers[0];
    buffers.length = 0;
    return chunk;
  }

  return null;
};
Paper.prototype.flush = function flush() {
  if (this.start < this.offset) {
    this.push(subarray(this.buffer, this.start, this.offset));
    this.start = this.offset;
  }
};
Paper.prototype.reserve = function reserve(length) {
  if (!this.buffer) {
    return this.alloc(length);
  }
  const size = this.buffer.byteLength;
  // Does it need to be resized?
  if (this.offset + length > size) {
    // Flush current buffer.
    if (this.offset) {
      this.flush();
    }
    // Resize it to 2x current length.
    this.alloc(Math.max(length, Math.min(size * 2, MAX_BUFFER_SIZE)));
  }
  return null;
};
Paper.prototype.alloc = function alloc(length) {
  this.setBuffer(new Uint8Array(Math.max(length, MIN_BUFFER_SIZE)));
};
Paper.prototype.setBuffer = function setBuffer(buffer) {
  this.buffer = buffer;
  this.offset = 0;
  this.start = 0;
};
Paper.prototype.send = function send(buffer) {
  const end = this.offset + buffer.byteLength;
  if (this.buffer && end <= this.buffer.byteLength) {
    this.buffer.set(buffer, this.offset);
    this.offset = end;
  } else {
    this.flush();
    this.push(buffer);
  }
};

export default Paper;
