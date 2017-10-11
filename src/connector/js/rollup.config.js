import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';

const env = process.env.NODE_ENV;

const external = [
  'imurmurhash',
  'json-bignumber',
];

const babelPlugins = [
  'external-helpers',
  'transform-object-rest-spread',
];

const globals = {
  'json-bignumber': 'JSONBigNumber',
  imurmurhash: 'MurmurHash3',
};

const config = {
  input: 'src/index.js',
  plugins: [],
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
      plugins: babelPlugins,
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
    nodeResolve({
      jsnext: true,
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: babelPlugins,
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    commonjs(),
  );
}

if (env === 'production') {
  config.plugins.push(uglify({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      warnings: false,
    },
  }));
}

export default config;
