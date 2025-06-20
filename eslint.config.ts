import type { Linter } from 'eslint'
import type { ParserOptions } from '@typescript-eslint/parser'

const config: Linter.Config = {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 'latest' as const,
            sourceType: 'module' as const,
        } satisfies ParserOptions,
    },
    plugins: {
        '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
        ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
    },
}

export default [config]
