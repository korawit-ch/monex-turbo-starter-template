#!/usr/bin/env node

import console from 'node:console';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const rootDir = path.resolve(scriptDir, '..');
const assetsDir = path.join(scriptDir, 'auth-removal');
const manifestPath = path.join(assetsDir, 'manifest.json');
const authenticatedDir = path.join(assetsDir, 'versions', 'authenticated');
const withoutAuthDir = path.join(assetsDir, 'versions', 'without-auth');
const apply = process.argv.includes('--apply');
const skipInstall = process.argv.includes('--skip-install');

function git(args) {
  return execFileSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function resolveInside(baseDir, relativePath) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Invalid removal manifest path: ${relativePath}`);
  }

  const resolved = path.resolve(baseDir, relativePath);
  if (resolved !== baseDir && !resolved.startsWith(`${baseDir}${path.sep}`)) {
    throw new Error(`Removal manifest path escapes its root: ${relativePath}`);
  }
  return resolved;
}

async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function readRequired(target, description) {
  try {
    return await readFile(target);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        `Missing ${description}: ${path.relative(rootDir, target)}`,
      );
    }
    throw error;
  }
}

function requireCleanTree() {
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (status.trim()) {
    throw new Error(
      'Authentication removal requires a clean working tree. Commit or stash changes first.',
    );
  }
}

function mergeWithoutAuth(current, authenticated, withoutAuth, relativePath) {
  const result = spawnSync(
    'git',
    ['merge-file', '--diff3', '-p', current, authenticated, withoutAuth],
    { cwd: rootDir, encoding: null, maxBuffer: 20 * 1024 * 1024 },
  );

  if (result.error) throw result.error;
  if (result.status === 1) {
    throw new Error(
      `Authentication removal conflicts with later edits in ${relativePath}`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `Unable to prepare authentication removal for ${relativePath}: ${String(result.stderr)}`,
    );
  }
  return result.stdout;
}

async function walkFiles(root, ignoredNames = new Set()) {
  if (!(await exists(root))) return [];
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredNames.has(entry.name)) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target);
      } else if (entry.isFile()) {
        files.push(target);
      } else {
        throw new Error(
          `Unexpected non-file entry in auth-owned path: ${path.relative(rootDir, target)}`,
        );
      }
    }
  }

  await visit(root);
  return files.sort();
}

async function planTreeRemoval(relativeRoot, ignoredNames) {
  const workspaceRoot = resolveInside(rootDir, relativeRoot);
  const snapshotRoot = resolveInside(authenticatedDir, relativeRoot);
  const workspaceFiles = await walkFiles(workspaceRoot, ignoredNames);
  const snapshotFiles = await walkFiles(snapshotRoot);
  const workspaceRelative = workspaceFiles.map((file) =>
    path.relative(workspaceRoot, file),
  );
  const snapshotRelative = snapshotFiles.map((file) =>
    path.relative(snapshotRoot, file),
  );

  if (workspaceRelative.join('\n') !== snapshotRelative.join('\n')) {
    throw new Error(
      `Auth-owned directory changed since the removal assets were captured: ${relativeRoot}`,
    );
  }

  for (const relativeFile of workspaceRelative) {
    const current = await readFile(path.join(workspaceRoot, relativeFile));
    const expected = await readFile(path.join(snapshotRoot, relativeFile));
    if (!current.equals(expected)) {
      throw new Error(
        `Auth-owned file changed since the removal assets were captured: ${path.join(relativeRoot, relativeFile)}`,
      );
    }
  }

  return { root: workspaceRoot, files: workspaceFiles };
}

async function captureFiles(paths) {
  const backups = new Map();
  for (const target of new Set(paths)) {
    if (await exists(target)) {
      const targetStat = await stat(target);
      backups.set(target, {
        exists: true,
        contents: await readFile(target),
        mode: targetStat.mode,
      });
    } else {
      backups.set(target, { exists: false });
    }
  }
  return backups;
}

async function restoreFiles(backups) {
  for (const [target, backup] of backups) {
    if (!backup.exists) {
      await rm(target, { force: true });
      continue;
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, backup.contents, { mode: backup.mode });
  }
}

async function verifyPlan(
  transformPlans,
  relocationPlans,
  restorePlans,
  removalFiles,
) {
  for (const plan of transformPlans) {
    const actual = await readRequired(plan.output, 'transformed file');
    if (!actual.equals(plan.contents)) {
      throw new Error(`Failed to transform ${plan.relativePath}`);
    }
    if (plan.source !== plan.output && (await exists(plan.source))) {
      throw new Error(`Failed to remove moved source ${plan.relativePath}`);
    }
  }
  for (const plan of relocationPlans) {
    const actual = await readRequired(plan.output, 'relocated file');
    if (!actual.equals(plan.contents)) {
      throw new Error(`Failed to relocate ${plan.relativePath}`);
    }
    if (await exists(plan.source)) {
      throw new Error(`Failed to remove relocated source ${plan.relativePath}`);
    }
  }
  for (const plan of restorePlans) {
    const actual = await readRequired(plan.output, 'restored file');
    if (!actual.equals(plan.contents)) {
      throw new Error(`Failed to restore ${plan.relativePath}`);
    }
  }
  for (const target of removalFiles) {
    if (await exists(target)) {
      throw new Error(`Failed to remove ${path.relative(rootDir, target)}`);
    }
  }
}

async function removeLockfileEntries(entries) {
  const lockfilePath = path.join(rootDir, 'package-lock.json');
  const lockfile = JSON.parse(await readFile(lockfilePath, 'utf8'));
  if (!lockfile.packages || typeof lockfile.packages !== 'object') {
    throw new Error('package-lock.json does not contain a packages map');
  }
  for (const entry of entries) delete lockfile.packages[entry];
  await writeFile(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.version !== 1) {
  throw new Error('Unsupported authentication removal manifest version');
}

requireCleanTree();

const transformPlans = [];
for (const transform of manifest.transforms) {
  const relativePath = transform.path;
  const outputRelativePath = transform.outputPath ?? relativePath;
  const source = resolveInside(rootDir, relativePath);
  const output = resolveInside(rootDir, outputRelativePath);
  const authenticated = resolveInside(authenticatedDir, relativePath);
  const withoutAuth = resolveInside(withoutAuthDir, relativePath);

  await readRequired(source, 'current integration file');
  await readRequired(authenticated, 'authenticated file version');
  await readRequired(withoutAuth, 'without-auth file version');
  if (source !== output && (await exists(output))) {
    throw new Error(
      `Cannot restore ${outputRelativePath} because that path already exists`,
    );
  }

  transformPlans.push({
    relativePath,
    source,
    output,
    contents: mergeWithoutAuth(
      source,
      authenticated,
      withoutAuth,
      relativePath,
    ),
    mode: (await stat(source)).mode,
  });
}

const relocationPlans = [];
for (const relocation of manifest.relocate ?? []) {
  const relativePath = relocation.path;
  const outputRelativePath = relocation.outputPath;
  const source = resolveInside(rootDir, relativePath);
  const output = resolveInside(rootDir, outputRelativePath);
  const contents = await readRequired(source, 'file to relocate');
  if (source === output) {
    throw new Error(`Relocation must change the path: ${relativePath}`);
  }
  if (await exists(output)) {
    throw new Error(
      `Cannot relocate ${relativePath} because ${outputRelativePath} already exists`,
    );
  }
  relocationPlans.push({
    relativePath,
    source,
    output,
    contents,
    mode: (await stat(source)).mode,
  });
}

const restorePlans = [];
for (const relativePath of manifest.restore) {
  const output = resolveInside(rootDir, relativePath);
  const template = resolveInside(withoutAuthDir, relativePath);
  const contents = await readRequired(template, 'restored file version');
  if (await exists(output)) {
    const current = await readFile(output);
    if (!current.equals(contents)) {
      throw new Error(
        `Cannot restore ${relativePath} because that path already exists with different content`,
      );
    }
  }
  restorePlans.push({ relativePath, output, contents });
}

const removalFiles = [];
for (const relativePath of manifest.removeFiles) {
  const current = resolveInside(rootDir, relativePath);
  const snapshot = resolveInside(authenticatedDir, relativePath);
  const currentContents = await readRequired(current, 'auth-owned file');
  const expectedContents = await readRequired(snapshot, 'auth-owned snapshot');
  if (!currentContents.equals(expectedContents)) {
    throw new Error(
      `Auth-owned file changed since the removal assets were captured: ${relativePath}`,
    );
  }
  removalFiles.push(current);
}

const ignoredTreeEntries = new Set(manifest.generatedTreeEntries);
const removalTrees = [];
for (const relativeRoot of manifest.removeTrees) {
  const tree = await planTreeRemoval(relativeRoot, ignoredTreeEntries);
  removalTrees.push(tree);
  removalFiles.push(...tree.files);
}

if (!apply) {
  console.info('Dry run: authentication can be removed safely.');
  console.info(`- transform ${transformPlans.length} shared integration files`);
  console.info(`- relocate ${relocationPlans.length} auth-neutral files`);
  console.info(
    `- restore ${restorePlans.length} files removed by authentication`,
  );
  console.info(`- remove ${removalFiles.length} auth-owned source files`);
  console.info('- preserve compatible changes made after authentication');
  console.info('- leave PostgreSQL schema/data unchanged');
  console.info('Run the same command with --apply to perform the removal.');
  process.exit(0);
}

const affectedPaths = [
  ...transformPlans.flatMap((plan) => [plan.source, plan.output]),
  ...relocationPlans.flatMap((plan) => [plan.source, plan.output]),
  ...restorePlans.map((plan) => plan.output),
  ...removalFiles,
  path.join(rootDir, 'package-lock.json'),
];
const backups = await captureFiles(affectedPaths);
const quarantineDir = await mkdtemp(path.join(tmpdir(), 'monex-auth-removal-'));
const quarantinedTrees = [];

try {
  for (const plan of transformPlans) {
    await mkdir(path.dirname(plan.output), { recursive: true });
    await writeFile(plan.output, plan.contents, { mode: plan.mode });
    if (plan.source !== plan.output) await rm(plan.source);
  }
  for (const plan of relocationPlans) {
    await mkdir(path.dirname(plan.output), { recursive: true });
    await writeFile(plan.output, plan.contents, { mode: plan.mode });
    await rm(plan.source);
  }
  for (const plan of restorePlans) {
    await mkdir(path.dirname(plan.output), { recursive: true });
    await writeFile(plan.output, plan.contents, { mode: 0o644 });
  }
  for (const target of removalFiles) await rm(target);

  await verifyPlan(transformPlans, relocationPlans, restorePlans, removalFiles);

  for (const [index, tree] of removalTrees.entries()) {
    const quarantine = path.join(quarantineDir, String(index));
    await rename(tree.root, quarantine);
    quarantinedTrees.push({ original: tree.root, quarantine });
  }

  if (!skipInstall) {
    execFileSync('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
  }
  await removeLockfileEntries(manifest.lockfileEntries);
} catch (error) {
  for (const tree of quarantinedTrees.reverse()) {
    await rm(tree.original, { recursive: true, force: true });
    await mkdir(path.dirname(tree.original), { recursive: true });
    await rename(tree.quarantine, tree.original);
  }
  await restoreFiles(backups);
  await rm(quarantineDir, { recursive: true, force: true });
  throw error;
}

await rm(quarantineDir, { recursive: true, force: true });
for (const relativeDirectory of manifest.pruneDirectories) {
  const directory = resolveInside(rootDir, relativeDirectory);
  try {
    await rmdir(directory);
  } catch (error) {
    if (!['ENOENT', 'ENOTEMPTY'].includes(error?.code)) throw error;
  }
}

await rm(assetsDir, { recursive: true, force: true });
await rm(scriptPath);

console.info('Authentication source was removed successfully.');
console.info(
  'Compatible later changes were preserved through three-way merges.',
);
console.info(
  'Database state was not changed; create and review a separate schema migration if needed.',
);
