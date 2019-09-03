import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const env = process.env.NODE_ENV;

const external = ['jsbi'];
const globals = {
  jsbi: 'jsbi',
};

const config = {
  input: 'src/index.js',
  plugins: [resolve(), commonjs()],
};

if (env === 'es' || env === 'cjs') {
  config.external = external;
  config.output = {
    exports: 'named',
    format: env,
    globals,
    indent: false,
  };
}

if (env === 'development' || env === 'production') {
  config.external = external;
  config.output = {
    exports: 'named',
    format: 'umd',
    indent: false,
    globals,
    name: 'MsgPack',
  };
}

if (env === 'production') {
  config.plugins.push(terser());
}

export default config;
