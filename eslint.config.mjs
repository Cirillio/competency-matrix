import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'supabase/**', 'e2e/**', 'playwright.config.ts', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}', 'tests/**/*.ts'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
        ecmaVersion: 'latest',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-useless-assignment': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/attributes-order': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  // Защита границ слоев (Layered Architecture Constraints)
  {
    files: ['src/utils/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/stores', '@/stores/**', '@/components/**', '@/pages/**', '@/composables/**', '@/services/**'],
          message: 'Utils must be pure and cannot import from stores, components, pages, composables, or services.',
        }],
      }],
    },
  },
  {
    files: ['src/types/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/stores/**', '@/components/**', '@/pages/**', '@/composables/**', '@/services/**', '@/utils/**'],
          message: 'Types cannot import from runtime layers.',
        }],
      }],
    },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/stores/**', '@/components/**', '@/pages/**', '@/composables/**'],
          message: 'Services cannot import from UI, stores, or composables.',
        }],
      }],
    },
  },
  {
    files: ['src/composables/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/pages/**', '@/components/**'],
          message: 'Composables cannot import from components or pages.',
        }],
      }],
    },
  },
  {
    files: ['src/components/**/*.vue', 'src/components/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/pages/**'],
          message: 'Components cannot import from pages.',
        }],
      }],
    },
  },
];
