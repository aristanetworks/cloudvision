import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

import packageJson from './package.json';

const env = process.env.NODE_ENV;

const config = {
  input: 'src/index.ts',
  onwarn: (warning) => {
    throw new Error(warning.message);
  },
  plugins: [typescript({ sourceMap: false })],
};

const external = Object.keys(packageJson.dependencies);

const globals = {
  'a-msgpack': 'msgpack',
  'base64-js': 'base64-js',
  'uuid': 'uuid',
  'jsbi': 'JSBI',
};

// Build preserving environment variables
if (env === 'es' || env === 'cjs') {
  config.external = external;
  config.output = {
    exports: 'named',
    format: env,
    globals,
    indent: false,
  };
  config.plugins.push(nodeResolve(), commonjs());
}

// Replace NODE_ENV variable
if (env === 'development' || env === 'production') {
  if (!process.env.INCLUDE_EXTERNAL) {
    config.external = external;
    config.plugins.push(nodeResolve());
  } else {
    config.plugins.push(nodeResolve({ browser: true }));
  }
  config.output = {
    exports: 'named',
    format: 'umd',
    globals,
    indent: false,
    name: 'CloudvisionConnector',
  };
  config.plugins.push(
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
      'process.env.TEXT_ENCODING': JSON.stringify('always'),
      'process.env.TEXT_DECODER': JSON.stringify('always'),
    }),
    commonjs(),
  );
}

if (env === 'production') {
  config.plugins.push(nodeResolve(), terser());
}

export default config;
