import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // =====================
  // Ignore
  // =====================
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.json', // ⛔ jangan lint JSON (paling aman)
    ],
  },

  // =====================
  // JS & TS (Node.js / Express)
  // =====================
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
      // Lebih realistis untuk existing project
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },

  // JS recommended
  js.configs.recommended,

  // TS recommended
  ...tseslint.configs.recommended,
]);
