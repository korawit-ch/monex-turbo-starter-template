#!/usr/bin/env node

import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const appsDir = path.join(rootDir, 'apps');
const apply = process.argv.includes('--apply');
const skipInstall = process.argv.includes('--skip-install');

const excludedDirectoryNames = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'test-results',
]);
const excludedFileNames = new Set([
  '.env',
  '.env.development.local',
  '.env.local',
  '.env.production.local',
  '.env.test.local',
  'next-env.d.ts',
]);

function readOption(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function printUsage() {
  console.info(
    'Usage: npm run app:duplicate -- --source <web|api> --name <new-app> [--port <port>] [--apply]',
  );
  console.info('The command is a dry run unless --apply is provided.');
}

async function pathExists(targetPath) {
  try {
    await readFile(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'EISDIR') return true;
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function directoryHasEntries(directory) {
  try {
    return (await readdir(directory)).length > 0;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function validateAppName(appName) {
  if (!appName) throw new Error('Missing required --name option.');
  if (appName.length > 214) throw new Error('App name is too long.');
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(appName)) {
    throw new Error(
      'App name must be a lowercase, unscoped npm name using letters, numbers, dots, hyphens, or underscores.',
    );
  }
}

function parsePort(value) {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new Error('--port must be an integer between 1 and 65535.');
  }

  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new Error('--port must be an integer between 1 and 65535.');
  }
  return port;
}

async function findWorkspacePackageNames() {
  const names = new Map();

  for (const workspaceRoot of ['apps', 'packages']) {
    const directory = path.join(rootDir, workspaceRoot);
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(directory, entry.name, 'package.json');
      if (!(await pathExists(manifestPath))) continue;
      const manifest = await readJson(manifestPath);
      if (manifest.name) {
        names.set(manifest.name, path.relative(rootDir, manifestPath));
      }
    }
  }

  return names;
}

function copyFilter(sourcePath) {
  const relativePath = path.relative(sourceDir, sourcePath);
  if (!relativePath) return true;

  const segments = relativePath.split(path.sep);
  const basename = path.basename(sourcePath);
  if (segments.some((segment) => excludedDirectoryNames.has(segment))) {
    return false;
  }
  if (excludedFileNames.has(basename)) return false;
  if (basename.endsWith('.log') || basename.endsWith('.tsbuildinfo')) {
    return false;
  }
  if (
    relativePath === path.join('assets', 'icons', 'generated') ||
    relativePath.startsWith(
      `${path.join('assets', 'icons', 'generated')}${path.sep}`,
    )
  ) {
    return false;
  }
  return true;
}

async function rewriteDocumentation(sourceName, sourcePackageName, targetName) {
  for (const fileName of ['AGENTS.md', 'README.md']) {
    const filePath = path.join(targetDir, fileName);
    if (!(await pathExists(filePath))) continue;

    const current = await readFile(filePath, 'utf8');
    const updated = current
      .replaceAll(`apps/${sourceName}`, `apps/${targetName}`)
      .replaceAll(
        `--workspace=${sourcePackageName}`,
        `--workspace=${targetName}`,
      );
    await writeFile(filePath, updated);
  }
}

function updateWebPort(manifest, port) {
  const devScript = manifest.scripts?.dev;
  if (typeof devScript !== 'string' || !/--port(?:=|\s+)\d+/.test(devScript)) {
    throw new Error(
      'Cannot apply --port because the web dev script has no numeric --port option.',
    );
  }
  manifest.scripts.dev = devScript.replace(
    /--port(?:=|\s+)\d+/,
    `--port ${port}`,
  );
}

async function updateApiPort(port) {
  const bootstrapPath = path.join(targetDir, 'src/main.ts');
  const current = await readFile(bootstrapPath, 'utf8');
  const pattern = /(process\.env\.API_PORT\s*\|\|\s*)\d+/;
  if (!pattern.test(current)) {
    throw new Error(
      'Cannot apply --port because src/main.ts has no numeric API_PORT fallback.',
    );
  }
  await writeFile(bootstrapPath, current.replace(pattern, `$1${port}`));
}

async function updatePortDocumentation(previousPort, port) {
  for (const fileName of ['AGENTS.md', 'README.md']) {
    const filePath = path.join(targetDir, fileName);
    if (!(await pathExists(filePath))) continue;
    const current = await readFile(filePath, 'utf8');
    await writeFile(
      filePath,
      current.replaceAll(String(previousPort), String(port)),
    );
  }
}

async function describeArchitecture(manifest) {
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  };
  const localAssets = await directoryHasEntries(path.join(sourceDir, 'assets'));
  const localPrisma =
    (await pathExists(path.join(sourceDir, 'prisma.config.ts'))) ||
    (await pathExists(path.join(sourceDir, 'prisma/schema.prisma'))) ||
    (await pathExists(path.join(sourceDir, 'src/prisma/prisma.client.ts')));

  let assets = 'not present';
  if (dependencies['@repo/assets']) assets = 'shared through @repo/assets';
  if (localAssets) assets = 'localized in the source app';

  let prisma = 'not present';
  if (dependencies['@repo/prisma']) prisma = 'shared through @repo/prisma';
  if (localPrisma) prisma = 'localized in the source app';

  return { assets, prisma };
}

async function duplicateApp(sourceManifest, port) {
  await cp(sourceDir, targetDir, {
    recursive: true,
    errorOnExist: true,
    force: false,
    filter: copyFilter,
  });

  const targetManifestPath = path.join(targetDir, 'package.json');
  const targetManifest = { ...sourceManifest, name: targetName };
  const previousPort =
    sourceKind === 'web'
      ? Number(sourceManifest.scripts?.dev?.match(/--port(?:=|\s+)(\d+)/)?.[1])
      : Number(
          (await readFile(path.join(sourceDir, 'src/main.ts'), 'utf8')).match(
            /process\.env\.API_PORT\s*\|\|\s*(\d+)/,
          )?.[1],
        );

  if (port !== undefined && sourceKind === 'web') {
    updateWebPort(targetManifest, port);
  }
  await writeFile(
    targetManifestPath,
    `${JSON.stringify(targetManifest, null, 2)}\n`,
  );

  if (port !== undefined && sourceKind === 'api') {
    await updateApiPort(port);
  }
  await rewriteDocumentation(sourceKind, sourceManifest.name, targetName);
  if (port !== undefined && Number.isInteger(previousPort)) {
    await updatePortDocumentation(previousPort, port);
  }

  if (!skipInstall) {
    execFileSync('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
  }
}

if (process.argv.includes('--help')) {
  printUsage();
  process.exit(0);
}

const sourceKind = readOption('source');
const targetName = readOption('name');
const port = parsePort(readOption('port'));

if (!['web', 'api'].includes(sourceKind)) {
  printUsage();
  throw new Error('--source must be either web or api.');
}
validateAppName(targetName);

const sourceDir = path.join(appsDir, sourceKind);
const targetDir = path.join(appsDir, targetName);
const sourceManifestPath = path.join(sourceDir, 'package.json');

if (!(await pathExists(sourceManifestPath))) {
  throw new Error(`Source app is missing: apps/${sourceKind}`);
}
if (await pathExists(targetDir)) {
  throw new Error(`Destination already exists: apps/${targetName}`);
}

const sourceManifest = await readJson(sourceManifestPath);
const workspacePackageNames = await findWorkspacePackageNames();
if (workspacePackageNames.has(targetName)) {
  throw new Error(
    `Package name ${targetName} is already used by ${workspacePackageNames.get(targetName)}.`,
  );
}

if (port !== undefined) {
  if (sourceKind === 'web') {
    updateWebPort(
      { ...sourceManifest, scripts: { ...sourceManifest.scripts } },
      port,
    );
  }
  if (sourceKind === 'api') {
    const bootstrap = await readFile(
      path.join(sourceDir, 'src/main.ts'),
      'utf8',
    );
    if (!/process\.env\.API_PORT\s*\|\|\s*\d+/.test(bootstrap)) {
      throw new Error(
        'Cannot apply --port because src/main.ts has no numeric API_PORT fallback.',
      );
    }
  }
}

const architecture = await describeArchitecture(sourceManifest);
if (!apply) {
  console.info(
    `Dry run: apps/${sourceKind} can be duplicated to apps/${targetName}.`,
  );
  console.info(`- assets: ${architecture.assets}`);
  console.info(`- Prisma: ${architecture.prisma}`);
  console.info(
    '- generated output, caches, local environments, and coverage are excluded',
  );
  console.info(`- package name becomes ${targetName}`);
  if (port !== undefined)
    console.info(`- default development port becomes ${port}`);
  console.info('Run the same command with --apply to create the app.');
} else {
  await duplicateApp(sourceManifest, port);
  console.info(`Duplicated apps/${sourceKind} to apps/${targetName}.`);
  console.info(
    `Preserved source architecture: assets ${architecture.assets}; Prisma ${architecture.prisma}.`,
  );
}
