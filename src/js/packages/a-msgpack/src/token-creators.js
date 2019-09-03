// Creates a readToken function that returns a constant value.
export function constant(value) {
  return () => {
    return value;
  };
}

// Transforms the given method to always receive a second argument, which is
// a number constant.
export function fix(len, method) {
  return (decoder) => {
    return method(decoder, len);
  };
}

// Transforms the given method to always receive a second argument, which is
// a number returned by lenFunc when given a Paper.
export function flex(lenFunc, method) {
  return (decoder) => {
    return method(decoder, lenFunc(decoder));
  };
}
