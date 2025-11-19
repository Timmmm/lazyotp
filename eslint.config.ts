import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import type { Linter } from "eslint";

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";


const config: Linter.Config[] = [
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser,
            parserOptions: { ecmaVersion: 2020, sourceType: "module" },
        },
        plugins: {
            "@typescript-eslint": tseslint.rules,
        },
        rules: {
            "no-implicit-coercion": "error",
        },
    },
    // eslintPluginPrettierRecommended,
];

export default config;
