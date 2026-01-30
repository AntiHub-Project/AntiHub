import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packagesRoot = path.join(repoRoot, "packages");

async function safeRemove(targetPath) {
  try {
    await rm(targetPath, { recursive: true, force: true });
  } catch {
    // Ignore missing paths.
  }
}

async function cleanPackages() {
  let entries = [];
  try {
    entries = await readdir(packagesRoot, { withFileTypes: true });
  } catch {
    entries = [];
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const distPath = path.join(packagesRoot, entry.name, "dist");
    await safeRemove(distPath);
  }
}

async function main() {
  await cleanPackages();
  console.log("Cleaned package dist directories.");
}

main().catch((error) => {
  console.error("Clean failed.");
  console.error(error);
  process.exitCode = 1;
});
