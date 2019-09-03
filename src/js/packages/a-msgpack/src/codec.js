import baseDecode from './decode';
import baseEncode from './encode';
import { generateDefaultReadToken } from './read-token';
import { generateDefaultWriteType } from './write-type';

// This is isolated for optimization purposes.
function getPacker(constructor, classes, packers) {
  for (let i = 0, len = classes.length; i < len; ++i) {
    if (constructor === classes[i]) {
      return packers[i];
    }
  }

  return null;
}

function join(filters) {
  const slicedFilters = filters.slice();
  const iterator = function iterator(value, filter) {
    return filter(value);
  };
  return (value) => {
    return slicedFilters.reduce(iterator, value);
  };
}

const ExtensionBuffer = function ExtensionBuffer(buffer, etype) {
  this.buffer = buffer;
  this.etype = etype;
};

function Codec() {
  if (!(this instanceof Codec)) {
    throw new TypeError('Codecs must be constructed with the "new" keyword.');
  }
  this._packers = [];
  this._packerClasses = [];
  this._unpackers = {};
  this.writeType = generateDefaultWriteType(baseEncode);
  this.readToken = generateDefaultReadToken(baseDecode);
}
Codec.prototype.replaceWriteType = function replaceWriteType(type, func, includeEncode = false) {
  this.writeType[type] = includeEncode ? (...m) => func(baseEncode, ...m) : func;
};
Codec.prototype.replaceReadToken = function replaceReadToken(
  token,
  creator,
  len,
  func,
  includeDecode = false,
) {
  this.readToken[token] = includeDecode
    ? creator(len, (...m) => func(baseDecode, ...m))
    : creator(len, func);
};
Codec.prototype.register = function register(etype, Class, packer, unpacker) {
  if (Array.isArray(packer)) {
    packer = join(packer); // eslint-disable-line no-param-reassign
  }
  if (Array.isArray(unpacker)) {
    unpacker = join(unpacker); // eslint-disable-line no-param-reassign
  }
  if (~~etype !== etype || !(etype >= 0 && etype < 128)) {
    throw new TypeError('Invalid extension type (must be between 0 and 127).');
  }
  if (typeof Class !== 'function') {
    throw new TypeError('Expected second argument to be a constructor function.');
  }
  this._packers.push((value) => {
    const buffer = packer(value);
    if (!(buffer instanceof Uint8Array)) {
      throw new TypeError('Codec must return a Uint8Array (encoding "' + Class.name + '").');
    }
    return new ExtensionBuffer(buffer, etype);
  });
  this._packerClasses.push(Class);
  this._unpackers[etype] = unpacker;
  return this;
};
Codec.prototype._packerFor = function _packerFor(value) {
  return getPacker(value.constructor, this._packerClasses, this._packers);
};
Codec.prototype._unpackerFor = function _unpackerFor(etype) {
  return this._unpackers[etype];
};

export default Codec;
