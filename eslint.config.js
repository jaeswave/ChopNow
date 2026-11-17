import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off', // plain JavaScript project, no PropTypes
      'react/no-unescaped-entities': 'off', // apostrophes and quotes in plain English copy render fine
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Vercel Functions and config files run in Node
  { files: ['api/**/*.js', '*.config.js'], languageOptions: { globals: { ...globals.node } } },
  // Tests
  { files: ['**/*.test.{js,jsx}', 'src/test/**'], languageOptions: { globals: { ...globals.node } } },
];
