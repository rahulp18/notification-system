// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // 1. Global Ignores
  {
    ignores: ['eslint.config.mjs', 'dist/', 'node_modules/'],
  },

  // 2. Base Configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  // 3. Environment and Project Settings
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 4. Custom Rules (Supporting 'any' and 'unsafe arguments')
  {
    rules: {
      // Disables the warning for using the 'any' type
      '@typescript-eslint/no-explicit-any': 'off',

      // Allows passing 'any' values into functions (Unsafe Arguments)
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Fully support 'any' by also allowing assignments and member access
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',

      // Keep this as a warning to prevent unhandled async operations
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },
];