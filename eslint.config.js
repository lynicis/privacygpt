//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import pluginSecurity from "eslint-plugin-security"

export default [
  ...tanstackConfig,
  pluginSecurity.configs.recommended,
  {
    rules: {
      "import/no-cycle": "off",
      "import/order": "off",
      "sort-imports": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/require-await": "off",
      "pnpm/json-enforce-catalog": "off",
      // Index access is type-checked throughout this codebase; this rule only
      // flags typed record lookups and literal-key registries as false positives.
      "security/detect-object-injection": "off",
    },
  },
  {
    // Local maintenance scripts read paths assembled from the repo root and
    // mkdtemp directories; there is no untrusted filename input.
    files: ["scripts/**/*.ts"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    ignores: ["eslint.config.js", ".prettierrc", "public/sw.js", ".gitnexus/"],
  },
]
