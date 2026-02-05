// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'class', next: '*' },
        { blankLine: 'always', prev: '*', next: 'class' },
        { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      'newline-before-return': 'error',

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      curly: ['error', 'all'],
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
);