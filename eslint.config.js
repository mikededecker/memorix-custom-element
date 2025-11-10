// ESLint Flat Config for Vue 3 + TypeScript (ESLint v9)
// Docs: https://eslint.org/docs/latest/use/configure/configuration-files-new

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import pluginImport from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      "dist",
      "public",
      "node_modules",
      "*.min.*",
      "*.d.ts",
      "coverage",
      "eslint.config.js",
      "vite.config.*",
      "*.config.*",
    ],
  },

  // Base recommended rules from ESLint
  eslint.configs.recommended,

  // Vue recommended rules (includes vue-eslint-parser)
  ...pluginVue.configs["flat/recommended"],

  // TypeScript support with type-aware rules
  ...tseslint.configs.recommendedTypeChecked,

  // Provide TypeScript project info for type-aware rules in .ts/.tsx files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  // Provide parserOptions for <script lang="ts"> blocks inside .vue files
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },

  // Disable type-aware linting for config files not in tsconfig include
  {
    files: [
      "vite.config.*",
      "vite.config.ts",
      "*.config.{js,cjs,mjs,ts}",
      "*.config.ts",
      "eslint.config.js"
    ],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
  },

  // Project-specific plugins, settings and rules (apply to TS + Vue)
  {
    files: ["**/*.{ts,tsx,vue}"],
    languageOptions: {
      globals: {
        fetch: "readonly",
      },
    },
    plugins: {
      import: pluginImport,
      "unused-imports": unusedImports,
    },
    settings: {
      // Allow eslint-plugin-import to resolve TS path aliases like @/*
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.json"],
        },
      },
    },
    rules: {
      // General best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",

      // TypeScript
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Handled by unused-imports
      "@typescript-eslint/no-unused-vars": "off",

      // Unused imports/vars cleanup
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Import hygiene
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index", "object", "type"],
          ],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "import/no-unresolved": ["error", { ignore: ["^@/"] }],

      // Vue tweaks (adjust to your preference)
      "vue/multi-word-component-names": "off", // allow single-word names
    },
  },

  // Disable rules that would conflict with Prettier formatting if you use it
  eslintConfigPrettier,

  // Formatting preferences
  // Note: Placed AFTER eslintConfigPrettier so these rules are enforced even if Prettier is present.
  {
    files: ["**/*.{ts,tsx,vue}"],
    rules: {
      // Trailing commas
      // Require trailing commas where possible on multi-line to keep diffs minimal
      // If you prefer trailing commas in single-line objects too, change "objects" to "always"
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
        },
      ],

      // Indentation
      indent: ["error", 2, { SwitchCase: 1 }],
      // Vue template indentation
      "vue/html-indent": [
        "error",
        2,
        {
          baseIndent: 1,
          alignAttributesVertically: true,
          ignores: [],
        },
      ],
    },
  },
];
