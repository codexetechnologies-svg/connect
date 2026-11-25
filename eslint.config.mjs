import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      '.next/**',
      'dist/**',
      'public/assets/vendor/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.browser
    }
  },
  {
    files: ['server/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    }
  }
];
