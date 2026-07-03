import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ['**/*.ts'],

        languageOptions: {
            parser: tseslint.parser,

            parserOptions: {
                project: './tsconfig.json',
            },

            globals: {
                ...globals.node,
            },
        },

        plugins: {
            prettier,
        },

        rules: {
            'prettier/prettier': 'error',

            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            '@typescript-eslint/no-explicit-any': 'warn',

            'no-console': 'off',
        },
    },

    eslintConfigPrettier,
];
