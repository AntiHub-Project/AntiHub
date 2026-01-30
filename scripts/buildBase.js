import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readdir, readFile, stat } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packagesRoot = path.join(repoRoot, "packages");

const entryCandidates = ["src/index.ts", "src/index.tsx", "src/index.js", "src/index.jsx"];

const tsconfigCandidates = [
  "tsconfig.build.json",
  "tsconfig.json",
  path.join(repoRoot, "tsconfig.base.json"),
];

async function fileExists(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function listPackageDirs() {
  try {
    const entries = await readdir(packagesRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(packagesRoot, entry.name));
  } catch {
    return [];
  }
}

export async function readPackageJson(pkgDir) {
  const pkgPath = path.join(pkgDir, "package.json");
  if (!(await fileExists(pkgPath))) {
    return null;
  }
  return readJson(pkgPath);
}

async function resolveEntry(pkgDir, pkgJson) {
  if (pkgJson?.source) {
    const sourcePath = path.join(pkgDir, pkgJson.source);
    if (await fileExists(sourcePath)) {
      return sourcePath;
    }
  }

  for (const candidate of entryCandidates) {
    const entryPath = path.join(pkgDir, candidate);
    if (await fileExists(entryPath)) {
      return entryPath;
    }
  }

  return null;
}

async function resolveTsconfig(pkgDir) {
  for (const candidate of tsconfigCandidates) {
    const candidatePath = path.isAbsolute(candidate) ? candidate : path.join(pkgDir, candidate);
    if (await fileExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

function resolveOutputs(pkgDir, pkgJson) {
  const outputs = [];
  const distDir = path.join(pkgDir, "dist");
  const moduleField = pkgJson?.module;
  const mainField = pkgJson?.main;

  if (moduleField) {
    outputs.push({
      file: path.join(pkgDir, moduleField),
      format: "esm",
      sourcemap: true,
    });
  }

  if (mainField) {
    outputs.push({
      file: path.join(pkgDir, mainField),
      format: "cjs",
      exports: "named",
      sourcemap: true,
    });
  }

  if (outputs.length === 0) {
    outputs.push(
      {
        file: path.join(distDir, "index.mjs"),
        format: "esm",
        sourcemap: true,
      },
      {
        file: path.join(distDir, "index.cjs"),
        format: "cjs",
        exports: "named",
        sourcemap: true,
      },
    );
  }

  return outputs;
}

function createExternalMatcher(pkgDir, pkgJson) {
  const dependencyNames = Object.keys({
    ...(pkgJson?.dependencies ?? {}),
    ...(pkgJson?.peerDependencies ?? {}),
    ...(pkgJson?.optionalDependencies ?? {}),
  });

  const builtins = new Set([...builtinModules, ...builtinModules.map((mod) => `node:${mod}`)]);

  const packageName = path.basename(pkgDir);
  const forcedExternals = packageName === "components" ? ["react", "react-dom", "next"] : [];

  return (id) => {
    if (builtins.has(id)) {
      return true;
    }

    if (forcedExternals.some((dep) => id === dep || id.startsWith(`${dep}/`))) {
      return true;
    }

    return dependencyNames.some((dep) => id === dep || id.startsWith(`${dep}/`));
  };
}

function resolveTypesOutput(pkgDir, pkgJson, entryPath) {
  const typesField = pkgJson?.types ?? pkgJson?.typings;
  if (!typesField) {
    return { declaration: false };
  }

  const typesPath = path.join(pkgDir, typesField);
  const declarationDir = path.dirname(typesPath);
  const outDir = path.join(pkgDir, "dist");
  const srcRoot = path.join(pkgDir, "src");
  const rootDir = path.dirname(entryPath).startsWith(srcRoot) ? srcRoot : path.dirname(entryPath);

  return {
    declaration: true,
    declarationMap: true,
    declarationDir,
    outDir,
    rootDir,
  };
}

export async function createRollupConfig(pkgDir) {
  const pkgJson = await readPackageJson(pkgDir);
  if (!pkgJson) {
    return null;
  }

  const entry = await resolveEntry(pkgDir, pkgJson);
  if (!entry) {
    return { pkgJson, entry: null };
  }

  const outputs = resolveOutputs(pkgDir, pkgJson);
  const tsconfig = await resolveTsconfig(pkgDir);
  const typesOutput = resolveTypesOutput(pkgDir, pkgJson, entry);

  const inputOptions = {
    input: entry,
    external: createExternalMatcher(pkgDir, pkgJson),
    plugins: [
      nodeResolve({
        extensions: [".mjs", ".js", ".json", ".ts", ".tsx"],
      }),
      commonjs(),
      typescript({
        tsconfig: tsconfig ?? undefined,
        compilerOptions: {
          noEmit: false,
          sourceMap: true,
          allowImportingTsExtensions: false,
          ...typesOutput,
        },
      }),
    ],
  };

  return {
    pkgJson,
    entry,
    inputOptions,
    outputOptions: outputs,
  };
}
