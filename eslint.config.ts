import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import typescriptEslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
  },
  // @ts-expect-error ???
  tseslint.configs.recommended,
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    plugins: {
      // @ts-expect-error ???
      "@typescript-eslint": typescriptEslint.plugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn", // or "error"
        {
          argsIgnorePattern: "^_", // Ignore unused function arguments like `_arg`
          varsIgnorePattern: "^_", // Ignore unused variables like `_var`
          caughtErrorsIgnorePattern: "^_", // Ignore unused catch params like `_err`
        },
      ],
    },
  },
]);
