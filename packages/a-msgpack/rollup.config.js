import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
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
  plugins: [resolve(), commonjs(), typescript({ sourceMap: false })],
};

const external = Object.keys(packageJson.dependencies);

const globals = {
  'base64-js': 'base64Js',
  'jsbi': 'jsbi',
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
    name: 'a-msgpack',
  };
  config.plugins.push(
    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify(env),
        'process.env.TEXT_ENCODING': JSON.stringify('always'),
        'process.env.TEXT_DECODER': JSON.stringify('always'),
      },
    }),
    commonjs(),
  );
}

if (env === 'production') {
  config.plugins.push(terser());
}

export default config;
