import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import unusedImports from 'eslint-plugin-unused-imports';
import reactPlugin from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        setTimeout: 'readonly',
        WebSocket: 'readonly',
        // DOM Element types
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLFormElement: 'readonly',
        Window: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        // Fetch API types
        RequestInit: 'readonly',
        // Jest testing globals
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'unused-imports': unusedImports,
      'react': reactPlugin
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'unused-imports/no-unused-imports': 'error'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];
