import path from "node:path";
import { fileURLToPath } from "node:url";
import { rollup } from "rollup";

import { createRollupConfig, listPackageDirs } from "./buildBase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = new Map();
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (!arg.startsWith("-")) {
      continue;
    }
    const next = process.argv[i + 1];
    if (next && !next.startsWith("-")) {
      args.set(arg, next);
      i += 1;
    } else {
      args.set(arg, true);
    }
  }
  return args;
}

function formatPackageName(pkgDir) {
  return path.basename(pkgDir);
}

async function resolveTargets() {
  const args = parseArgs();
  const target = args.get("--package") ?? args.get("-p");
  const allPackages = await listPackageDirs();

  if (!target) {
    return allPackages;
  }

  const byName = allPackages.find((pkgDir) => formatPackageName(pkgDir) === target);

  if (byName) {
    return [byName];
  }

  const absoluteTarget = path.isAbsolute(target) ? target : path.resolve(__dirname, "..", target);

  return [absoluteTarget];
}

async function buildPackage(pkgDir) {
  const config = await createRollupConfig(pkgDir);
  if (!config) {
    console.log(`Skipping ${pkgDir}. No package.json found.`);
    return;
  }

  if (!config.entry) {
    console.log(`Skipping ${pkgDir}. No entry file found.`);
    return;
  }

  console.log(`Building ${formatPackageName(pkgDir)}...`);
  const bundle = await rollup(config.inputOptions);

  try {
    for (const output of config.outputOptions) {
      await bundle.write(output);
    }
  } finally {
    await bundle.close();
  }

  console.log(`Finished ${formatPackageName(pkgDir)}.`);
}

async function main() {
  const targets = await resolveTargets();

  if (targets.length === 0) {
    console.log("No packages found under packages/. Nothing to build.");
    return;
  }

  for (const pkgDir of targets) {
    await buildPackage(pkgDir);
  }
}

main().catch((error) => {
  console.error("Build failed.");
  console.error(error);
  process.exitCode = 1;
});
