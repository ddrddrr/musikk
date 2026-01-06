import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

import pluginQuery from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const reactHooksRecommended = reactHooks.configs?.["flat/recommended"] ?? [
    {
        plugins: { "react-hooks": reactHooks },
        rules: reactHooks.configs?.recommended?.rules ?? {},
    },
];

const reactRefreshRecommended = reactRefresh.configs?.vite ?? {
    plugins: { "react-refresh": reactRefresh },
    rules: { "react-refresh/only-export-components": "warn" },
};

export default tseslint.config(
    { ignores: ["dist", "eslint.config.js", "vite.config.ts"] },

    {
        files: ["src/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: { version: "detect" },
            "import/resolver": {
                node: {
                    paths: ["src"],
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
                alias: {
                    map: [
                        ["@", "./src"],
                        ["@app", "./src/app"],
                        ["@assets", "./src/assets"],
                        ["@components", "./src/components"],
                        ["@config", "./src/config"],
                        ["@hooks", "./src/hooks"],
                        ["@locales", "./src/locales"],
                        ["@pages", "./src/pages"],
                        ["@reducers", "./src/reducers"],
                        ["@styles", "./src/styles"],
                        ["@tests", "./src/tests"],
                        ["@types", "./src/types"],
                        ["@utils", "./src/utils"],
                    ],
                    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
                },
            },
        },
    },

    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    ...tseslint.configs.recommended,

    reactPlugin.configs.flat.recommended,

    ...reactHooksRecommended,

    jsxA11y.flatConfigs.recommended,

    {
        plugins: { import: importPlugin },
        rules: { ...(importPlugin.configs?.recommended?.rules ?? {}) },
    },

    ...pluginQuery.configs["flat/recommended"],

    reactRefreshRecommended,

    {
        rules: {
            "react/react-in-jsx-scope": "off",
            "import/no-named-as-default": "off",
            "react-refresh/only-export-components": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    varsIgnorePattern: "^_",
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
        },
    },

    eslintConfigPrettier,
);
