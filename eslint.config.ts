import { defineConfig } from "eslint/config";
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
    includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
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
    eslintPluginPrettierRecommended,
]);
