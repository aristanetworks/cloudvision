import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

import packageJson from './package.json';

const env = process.env.NODE_ENV;

const config = {
  input: 'src/index.ts',
  onwarn: (warning) => {
    throw new Error(
      `${warning.message} (${warning.loc.file}):${warning.loc.line}:${warning.loc.column}`,
    );
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
  config.plugins.push(commonjs());
}

if (env === 'production') {
  config.plugins.push(nodeResolve(), terser());
}

export default config;
