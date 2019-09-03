module.exports = {
  parser: 'babel-eslint',
  extends: ['arista-base', 'plugin:flowtype/recommended'],
  plugins: ['babel', 'flowtype'],
  globals: {
    BigInt: 'readonly',
  },
  rules: {
    'babel/semi': ['error', 'always'],
    'babel/valid-typeof': 'error',
    'flowtype/semi': ['error', 'always'],
    semi: 'off', // turn this rule off since we are using babel/semi.
  },
};
