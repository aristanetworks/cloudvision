module.exports = {
  extends: ['airbnb', 'arista-base-js'],
  globals: {
    BigInt: 'readonly',
  },
  rules: {
    camelcase: [
      'error',
      {
        allow: ['^UNSAFE_'],
        properties: 'never',
      },
    ],
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        controlComponents: ['MultiSelect'],
      },
    ],
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/mouse-events-have-key-events': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-quotes': ['error', 'prefer-single'],
    'react/destructuring-assignment': 'off',
    'react/forbid-prop-types': 'off',
    'react/jsx-boolean-value': ['error', 'always'],
    'react/jsx-curly-newline': 'error',
    'react/jsx-filename-extension': 'off',
    'react/jsx-indent': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-wrap-multilines': 'off',
    'react/no-access-state-in-setstate': 'error',
    'react/no-array-index-key': 'off',
    'react/no-find-dom-node': 'error',
    'react/no-string-refs': 'error',
    'react/no-unused-prop-types': 'off',
    'react/prefer-stateless-function': 'off',
    'react/require-default-props': 'off',
    'react/sort-comp': 'off',
    'react/sort-prop-types': [
      'error',
      {
        callbacksLast: true,
        ignoreCase: false,
        requiredFirst: true,
      },
    ],
  },
};
