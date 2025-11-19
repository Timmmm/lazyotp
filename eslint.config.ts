import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig(
    includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    eslintPluginPrettierRecommended,
    {
        rules: {
            "no-implicit-coercion": "error",
            // TODO: This still isn't working.
            "@typescript-eslint/strict-boolean-expressions": "error",
            eqeqeq: "error",
            curly: ["error", "all"],
        },
    }
);
