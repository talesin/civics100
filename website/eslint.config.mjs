import tseslint from 'typescript-eslint'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from "eslint-config-prettier/flat"

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
      '.next/**',
      'e2e/**',
      'playwright.config.ts',
      'postcss.config.mjs'
    ]
  },
  { files: ['**/*.ts', '**/*.tsx'] },

  // eslint-config-next/core-web-vitals provides: react, react-hooks, import,
  // jsx-a11y, @next/next, @typescript-eslint plugins with recommended rules
  ...nextCoreWebVitals,

  // typescript-eslint recommended (extends the next config's @typescript-eslint)
  ...tseslint.configs.recommended,

  {
    plugins: {
      prettier
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
      // New rules from eslint-config-next@16 — disabled to maintain status quo
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
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
  },

  // Relax strict-boolean-expressions in test files (not linted by old next lint)
  {
    files: ['test/**/*.ts', 'test/**/*.tsx'],
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'off'
    }
  }
)
