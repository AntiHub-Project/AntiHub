import path from "node:path";
import { fileURLToPath } from "node:url";
import { watch } from "rollup";

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

function logWatcherEvent(event, pkgDir) {
  const name = formatPackageName(pkgDir);

  switch (event.code) {
    case "START":
      console.log(`Watching ${name}...`);
      break;
    case "BUNDLE_START":
      console.log(`Rebuilding ${name}...`);
      break;
    case "BUNDLE_END":
      console.log(`Rebuild finished for ${name}.`);
      break;
    case "END":
      console.log(`Waiting for changes in ${name}.`);
      break;
    case "ERROR":
      console.error(`Build error in ${name}.`);
      if (event.error) {
        console.error(event.error);
      }
      break;
    default:
      break;
  }
}

async function watchPackage(pkgDir) {
  const config = await createRollupConfig(pkgDir);
  if (!config) {
    console.log(`Skipping ${pkgDir}. No package.json found.`);
    return null;
  }

  if (!config.entry) {
    console.log(`Skipping ${pkgDir}. No entry file found.`);
    return null;
  }

  const watcher = watch({
    ...config.inputOptions,
    output: config.outputOptions,
    watch: {
      clearScreen: false,
    },
  });

  watcher.on("event", (event) => logWatcherEvent(event, pkgDir));
  watcher.on("change", (file) => {
    console.log(`File changed: ${file}`);
  });

  return watcher;
}

async function main() {
  const targets = await resolveTargets();

  if (targets.length === 0) {
    console.log("No packages found under packages/. Nothing to watch.");
    return;
  }

  const watchers = [];
  for (const pkgDir of targets) {
    const watcher = await watchPackage(pkgDir);
    if (watcher) {
      watchers.push(watcher);
    }
  }

  if (watchers.length === 0) {
    console.log("No watch targets were configured.");
  }
}

main().catch((error) => {
  console.error("Watch mode failed.");
  console.error(error);
  process.exitCode = 1;
});
