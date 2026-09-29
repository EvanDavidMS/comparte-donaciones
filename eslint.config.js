'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**', 'reports/**', 'data/**', 'docs/**', '.scannerwork/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { ...globals.node, ...globals.jest } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], eqeqeq: 'error', 'no-eval': 'error' },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': 'error', eqeqeq: 'error', 'no-eval': 'error' },
  },
];
