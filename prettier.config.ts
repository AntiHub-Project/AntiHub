// prettier.config.ts, .prettierrc.ts, prettier.config.mts, or .prettierrc.mts
import { type PluginConfig } from "@trivago/prettier-plugin-sort-imports";
import { type Config } from "prettier";

const config: Config & PluginConfig = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  requirePragma: false,
  insertPragma: false,
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  endOfLine: "lf",
  rangeStart: 0,
  rangeEnd: Infinity,

  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  importOrder: ["^react", "<THIRD_PARTY_MODULES>", "^@antihub/(.*)$", "^[./]"],
  importOrderSeparation: true,
};

export default config;
