import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import flow from 'rollup-plugin-flow';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

const env = process.env.NODE_ENV;

const external = ['imurmurhash', 'jsbi'];

const globals = {
  imurmurhash: 'MurmurHash3',
  jsbi: 'JSBI',
};

const config = {
  input: 'src/index.js',
  plugins: [flow({ all: true }), nodeResolve()],
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
  config.plugins.push(
    babel({
      externalHelpers: true,
    }),
    commonjs(),
  );
}

// Replace NODE_ENV variable
if (env === 'development' || env === 'production' || env === 'try') {
  if (!process.env.INCLUDE_EXTERNAL) {
    config.external = external;
  }
  config.output = {
    exports: 'named',
    format: 'umd',
    globals,
    indent: false,
    name: 'CloudVisionConnector',
  };
  config.plugins.push(
    babel({
      exclude: 'node_modules/**',
      externalHelpers: true,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    commonjs(),
  );
}

if (env === 'production') {
  config.plugins.push(terser());
}

export default config;
