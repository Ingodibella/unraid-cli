import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": pluginTs,
    },
    rules: {
      ...pluginTs.configs["eslint-recommended"].overrides?.[0]?.rules,
      ...pluginTs.configs["recommended"].rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
];
