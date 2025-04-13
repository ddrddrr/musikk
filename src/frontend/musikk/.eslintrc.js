module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:import/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@tanstack/eslint-plugin-query/recommended",
        // This disables the formatting rules in ESLint
        // that Prettier is going to be responsible for handling.
        // Make sure this is always the last config,
        // so it gets the chance to override other configs.
        "eslint-config-prettier",
    ],
    plugins: ["@tanstack/query", "react-refresh"],
    settings: {
        react: {
            version: "detect",
        },
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
                extensions: [".ts", "./tsx", ".js", ".jsx", ".json"],
            },
        },
    },
    rules: {
        // suppress errors for missing 'import React' in files
        "react/react-in-jsx-scope": "off",
        "import/no-named-as-default": 0,
        "react-refresh/only-export-components": "warn",
        "no-unused-vars": ["warn", { varsIgnorePattern: "*" }],
    },
};
