import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import { terser } from 'rollup-plugin-terser';

import packageJson from './package.json';

const env = process.env.NODE_ENV;
const projectRootDir = path.resolve(__dirname);

const config = {
  input: 'src/index.ts',
  onwarn: (warning) => {
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      warning.importer === 'node_modules/protobufjs/src/util/minimal.js'
    ) {
      return;
    }
    if (
      warning.code === 'EVAL' &&
      (warning.id || '').includes('node_modules/@protobufjs/inquire/index.js')
    ) {
      return;
    }
    if (warning.loc) {
      throw new Error(
        `${warning.message} (${warning.loc.file}):${warning.loc.line}:${warning.loc.column}`,
      );
    }
    throw new Error(warning.message);
  },
  plugins: [
    alias({
      entries: [
        { find: '@generated', replacement: path.resolve(projectRootDir, 'generated') },
        { find: '@types', replacement: path.resolve(projectRootDir, 'types') },
      ],
    }),
    typescript({ sourceMap: false }),
  ],
};

const external = Object.keys(packageJson.dependencies);

const globals = {
  '@improbable-eng/grpc-web': 'grpc-web',
  'google-protobuf': 'google-protobuf',
  'rxjs': 'rxjs',
};

// Build preserving environment variables
if (env === 'es' || env === 'cjs') {
  config.external = external;
  config.output = {
    exports: 'named',
    format: env,
    // globals,
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
    name: 'CloudvisionGrpcWeb',
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
  config.plugins.push(nodeResolve(), terser());
}

export default config;
