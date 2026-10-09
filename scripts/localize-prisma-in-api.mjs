#!/usr/bin/env node

import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const prismaPackageDir = path.join(rootDir, 'packages/prisma');
const apiDir = path.join(rootDir, 'apps/api');
const apply = process.argv.includes('--apply');
const skipInstall = process.argv.includes('--skip-install');

const ignoredDirectoryNames = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);
const consumerExtensions = new Set([
  '.css',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
]);

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

async function collectFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoredDirectoryNames.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
    } else if (consumerExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

async function findExternalConsumers() {
  const consumers = [];

  for (const workspaceRoot of ['apps', 'packages']) {
    const directory = path.join(rootDir, workspaceRoot);
    for (const filePath of await collectFiles(directory)) {
      if (
        filePath.startsWith(apiDir) ||
        filePath.startsWith(prismaPackageDir)
      ) {
        continue;
      }

      const contents = await readFile(filePath, 'utf8');
      if (contents.includes('@repo/prisma')) {
        consumers.push(path.relative(rootDir, filePath));
      }
    }
  }

  return consumers;
}

async function rewriteFile(filePath, transform) {
  const current = await readFile(filePath, 'utf8');
  const updated = transform(current);
  if (updated !== current) {
    await writeFile(filePath, updated);
  }
}

async function updateApiManifest(prismaManifest) {
  const manifestPath = path.join(apiDir, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  delete manifest.dependencies?.['@repo/prisma'];
  manifest.dependencies = {
    ...manifest.dependencies,
    '@prisma/adapter-pg': prismaManifest.dependencies['@prisma/adapter-pg'],
    '@prisma/client': prismaManifest.dependencies['@prisma/client'],
    pg: prismaManifest.dependencies.pg,
  };
  manifest.devDependencies = {
    ...manifest.devDependencies,
    '@types/pg': prismaManifest.devDependencies['@types/pg'],
    dotenv: prismaManifest.devDependencies.dotenv,
    prisma: prismaManifest.devDependencies.prisma,
    tsx: prismaManifest.devDependencies.tsx,
  };
  manifest.scripts = {
    prebuild: 'prisma generate',
    ...manifest.scripts,
    'db:generate': 'prisma generate',
    'db:validate': 'prisma validate',
    'db:push': 'prisma db push',
    'db:migrate': 'prisma migrate dev',
    'db:studio': 'prisma studio',
    'db:seed': 'tsx --tsconfig tsconfig.json prisma/seed.ts',
    postinstall: 'prisma generate',
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function updateApiBuildConfig() {
  const configPath = path.join(apiDir, 'tsconfig.build.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const exclusions = new Set(config.exclude ?? []);
  exclusions.add('prisma.config.ts');
  exclusions.add('prisma/**/*.ts');
  config.exclude = [...exclusions];
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function updateRootManifest() {
  const manifestPath = path.join(rootDir, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.scripts = {
    ...manifest.scripts,
    'db:generate': 'npm run db:generate --workspace=api',
    'db:validate': 'npm run db:validate --workspace=api',
    'db:push': 'npm run db:push --workspace=api',
    'db:migrate': 'npm run db:migrate --workspace=api',
    'db:seed': 'npm run db:seed --workspace=api',
    'db:studio': 'npm run db:studio --workspace=api',
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function localizePrisma() {
  execFileSync('npm', ['run', 'build', '--workspace=@repo/prisma'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  const prismaManifest = JSON.parse(
    await readFile(path.join(prismaPackageDir, 'package.json'), 'utf8'),
  );
  await cp(
    path.join(prismaPackageDir, 'prisma.config.ts'),
    path.join(apiDir, 'prisma.config.ts'),
  );
  await cp(path.join(prismaPackageDir, 'prisma'), path.join(apiDir, 'prisma'), {
    recursive: true,
  });
  await cp(
    path.join(prismaPackageDir, 'src/index.ts'),
    path.join(apiDir, 'src/prisma/prisma.client.ts'),
  );

  await rewriteFile(path.join(apiDir, 'prisma/seed.ts'), (contents) =>
    contents.replace('../src/index', '../src/prisma/prisma.client'),
  );
  await rewriteFile(
    path.join(apiDir, 'src/prisma/prisma.service.ts'),
    (contents) =>
      contents.replace("from '@repo/prisma'", "from './prisma.client'"),
  );
  for (const filePath of await collectFiles(path.join(apiDir, 'src'))) {
    if (filePath.endsWith('prisma.service.ts')) continue;
    await rewriteFile(filePath, (contents) =>
      contents.replaceAll("from '@repo/prisma'", "from '@prisma/client'"),
    );
  }

  await updateApiManifest(prismaManifest);
  await updateApiBuildConfig();
  await updateRootManifest();
  await rm(prismaPackageDir, { recursive: true });

  if (!skipInstall) {
    execFileSync('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
  }
}

for (const requiredPath of [
  path.join(prismaPackageDir, 'package.json'),
  path.join(prismaPackageDir, 'prisma/schema.prisma'),
  path.join(prismaPackageDir, 'src/index.ts'),
  path.join(apiDir, 'package.json'),
]) {
  if (!(await pathExists(requiredPath))) {
    throw new Error(
      `Expected path is missing: ${path.relative(rootDir, requiredPath)}`,
    );
  }
}

for (const collisionPath of [
  path.join(apiDir, 'prisma.config.ts'),
  path.join(apiDir, 'src/prisma/prisma.client.ts'),
]) {
  if (await pathExists(collisionPath)) {
    throw new Error(
      `Refusing to overwrite existing API persistence path: ${path.relative(rootDir, collisionPath)}`,
    );
  }
}

const apiPrismaDirectory = path.join(apiDir, 'prisma');
if (await directoryHasEntries(apiPrismaDirectory)) {
  throw new Error(
    `Refusing to overwrite existing API persistence path: ${path.relative(rootDir, apiPrismaDirectory)}`,
  );
}

const externalConsumers = await findExternalConsumers();
if (externalConsumers.length > 0) {
  throw new Error(
    `Cannot localize @repo/prisma while other workspaces consume it:\n${externalConsumers
      .map((consumer) => `- ${consumer}`)
      .join('\n')}`,
  );
}

if (!apply) {
  console.info('Dry run: @repo/prisma can be localized safely.');
  console.info('The script will:');
  console.info('- keep Prisma database types out of frontend contracts');
  console.info(
    '- move the schema, seed, CLI config, and runtime client into apps/api',
  );
  console.info('- rewrite API imports and database scripts');
  console.info('- remove packages/prisma and refresh the root lockfile');
  console.info('Run with --apply to perform the migration.');
} else {
  await localizePrisma();
  console.info('Localized @repo/prisma into apps/api.');
  console.info(
    'Review root and API architecture documentation before committing.',
  );
}
