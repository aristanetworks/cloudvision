module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  plugins: ['arista'],
  globals: {
    BigInt: 'readonly',
  },
  rules: {
    'arista/import-order': 'error',
    'array-bracket-newline': ['error', 'consistent'],
    'arrow-body-style': 'off',
    'arrow-parens': 'off',
    'class-methods-use-this': 'off',
    curly: ['error', 'all'],
    'function-paren-newline': ['error', 'consistent'],
    'id-length': [
      'error',
      {
        min: 1,
      },
    ],
    'import/extensions': 'off',
    'import/no-cycle': 'error',
    'import/no-deprecated': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        optionalDependencies: false,
      },
    ],
    'import/no-named-as-default': 'error',
    'import/no-unresolved': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        FunctionDeclaration: { parameters: 'first' },
      },
    ],
    'max-len': 'off', // prettier will take care of line length
    'newline-per-chained-call': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'no-mixed-operators': [
      'error',
      {
        groups: [
          ['&', '|', '^', '~', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
      },
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxBOF: 0,
        maxEOF: 0,
      },
    ],
    'no-param-reassign': [
      'error',
      {
        props: false,
      },
    ],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'no-prototype-builtins': 'off',
    'no-restricted-globals': 'error',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_key', '_value'],
      },
    ],
    'object-curly-newline': [
      'error',
      {
        consistent: true,
      },
    ],
    'operator-linebreak': 'off',
    'prefer-destructuring': 'off',
    'prefer-template': 'off',
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'always',
        printWidth: 100,
        proseWrap: 'always',
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
    'quote-props': [
      'error',
      'as-needed',
      {
        numbers: true,
      },
    ],
    'valid-typeof': 'off',
  },
};
