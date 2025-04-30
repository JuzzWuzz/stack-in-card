import { defineConfig, globalIgnores } from "eslint/config";
import eslintJs from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores([
    "**/dist/",
    "**/node_modules",
    "**/rollup.config.js",
  ]),
  eslintJs.configs.recommended,
  typescriptEslint.configs.recommended,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parser: typescriptEslint.parser,
      ecmaVersion: 2022,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          modules: true,
        },

        experimentalDecorators: true,
        project: "./tsconfig.json",
      },
    },

    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      camelcase: 0,
      "no-console": 0,

      // Sort the actual imports of packages: { c, b, a } => { a, b, c }
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: [
            "none",
            "all",
            "multiple",
            "single",
          ],
          allowSeparatedGroups: true,
        },
      ],

      // Turn on errors for missing imports
      "import/no-unresolved": "error",

      // 'import/no-named-as-default-member': 'off',
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Built-in imports (come from NodeJS native) go first
            "external", // <- External imports
            "internal", // <- Absolute imports
            [
              "sibling",
              "parent",
            ], // <- Relative imports, the sibling and parent types they can be mingled together
            "index", // <- index imports
            "unknown", // <- unknown
          ],

          "newlines-between": "always",

          alphabetize: {
            /* Sort in ascending order. Options: ["ignore", "asc", "desc"] */
            order: "asc",
            /* Ignore case. Options: [true, false] */
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]);
