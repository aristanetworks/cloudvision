export default function encode(encoder, value) {
  encoder.codec.writeType[typeof value](encoder, value);
}
