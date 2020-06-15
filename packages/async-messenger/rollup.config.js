import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const env = process.env.NODE_ENV;

const config = {
  input: 'src/index.ts',
  onwarn: (warning) => {
    throw Error(warning.message);
  },
  plugins: [nodeResolve(), typescript({ sourceMap: false })],
};

// Build preserving environment variables
if (env === 'es' || env === 'cjs') {
  config.output = {
    exports: 'named',
    format: env,
    indent: false,
  };
  config.plugins.push(commonjs());
}

// Replace `NODE_ENV` variable
if (env === 'development' || env === 'production' || env === 'try') {
  config.output = {
    exports: 'named',
    format: 'umd',
    indent: false,
    name: 'AsyncMessenger',
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
  config.plugins.push(terser());
}

export default config;
