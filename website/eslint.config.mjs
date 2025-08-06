import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from "eslint-config-prettier/flat"
import next from '@next/eslint-plugin-next'
import react from 'eslint-plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: [
      '**/node_modules',
      '**/package-lock.json',
      '**/dist',
      '**/build',
      'eslint.config.mjs',
      'jest.config.ts',
      '**/coverage',
      '**/*.js',
      '.next/**'
    ]
  },
  { files: ['**/*.ts', '**/*.tsx'] },

  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    // 'plugin:prettier/recommended',
    'plugin:@next/next/recommended',
    'next/core-web-vitals',
    'next/typescript'
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier,
      'react': react,
      '@next/next': next
    },

    settings: {
      react: {
        version: 'detect'
      }
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  eslintConfigPrettier,

  {
    rules: {
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        "error",
        {
          "allowString": false,
          "allowNumber": false,
          "allowNullableObject": false,
          "allowNullableBoolean": false,
          "allowAny": false,
          "allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing": false
        }
      ]
    }
  }
)
