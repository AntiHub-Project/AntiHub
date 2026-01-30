import { defineConfig } from "cz-git";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const getScopes = () => {
  const folders = ["apps", "packages"];
  const scopes: string[] = ["repo", "deps", "dx"];

  for (const folder of folders) {
    try {
      const dirents = readdirSync(join(process.cwd(), folder), {
        withFileTypes: true,
      });
      const subDirs = dirents.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name);
      scopes.push(...subDirs);
    } catch (e) {
      // Ignore if folder doesn't exist
    }
  }
  return scopes;
};

export default defineConfig({
  extends: ["@commitlint/config-conventional"],
  prompt: {
    messages: {
      type: "Select the type of change that you're committing:",
      scope: "Select the SCOPE of this change (optional):",
      customScope: "Indicate the SCOPE of this change:",
      subject: "Write a SHORT, IMPERATIVE tense description of the change:\n",
      body: 'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
      breaking: 'List any BREAKING CHANGES (optional). Use "|" to break new line:\n',
      footerPrefixesSelect: "Select the ISSUES type of change by priority (optional):",
      customFooterPrefix: "Input custom issue prefix:",
      footer: "List any ISSUES CLOSED by this change (optional) e.g.: #31, #34:\n",
      confirmCommit: "Are you sure you want to proceed with the commit above?",
    },
    types: [
      {
        value: "feat",
        name: "feat:     ✨  A new feature",
        emoji: ":sparkles:",
      },
      { value: "fix", name: "fix:      🐛  A bug fix", emoji: ":bug:" },
      {
        value: "docs",
        name: "docs:     📝  Documentation only changes",
        emoji: ":memo:",
      },
      {
        value: "style",
        name: "style:    💄  Changes that do not affect the meaning of the code",
        emoji: ":lipstick:",
      },
      {
        value: "refactor",
        name: "refactor: ♻️   A code change that neither fixes a bug nor adds a feature",
        emoji: ":recycle:",
      },
      {
        value: "perf",
        name: "perf:     ⚡️  A code change that improves performance",
        emoji: ":zap:",
      },
      {
        value: "test",
        name: "test:     ✅  Adding missing tests or correcting existing tests",
        emoji: ":white_check_mark:",
      },
      {
        value: "build",
        name: "build:    📦️  Changes that affect the build system or external dependencies",
        emoji: ":package:",
      },
      {
        value: "ci",
        name: "ci:       🎡  Changes to our CI configuration files and scripts",
        emoji: ":ferris_wheel:",
      },
      {
        value: "chore",
        name: "chore:    🔨  Other changes that don't modify src or test files",
        emoji: ":hammer:",
      },
      {
        value: "revert",
        name: "revert:   ⏪️  Reverts a previous commit",
        emoji: ":rewind:",
      },
    ],
    useEmoji: true,
    emojiAlign: "center",
    scopes: getScopes(),
    allowCustomScopes: true,
    allowEmptyScopes: true,
    upperCaseSubject: false,
    markBreakingChangeMode: false,
    allowBreakingChanges: ["feat", "fix"],
    breaklineNumber: 100,
    breaklineChar: "|",
    skipQuestions: ["body", "breaking", "footer"],
    confirmColorize: true,
    maxHeaderLength: Infinity,
    maxSubjectLength: Infinity,
    minSubjectLength: 0,
  },
});
