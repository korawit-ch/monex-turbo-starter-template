#!/usr/bin/env node

import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const assetsPackageDir = path.join(rootDir, 'packages/assets');
const webDir = path.join(rootDir, 'apps/web');
const webAssetsDir = path.join(webDir, 'assets');
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
        filePath.startsWith(webDir) ||
        filePath.startsWith(assetsPackageDir)
      ) {
        continue;
      }

      const contents = await readFile(filePath, 'utf8');
      if (contents.includes('@repo/assets')) {
        consumers.push(path.relative(rootDir, filePath));
      }
    }
  }

  return consumers;
}

async function copyDirectoryIfPresent(source, destination) {
  if (!(await pathExists(source))) return;
  await cp(source, destination, { recursive: true });
}

async function rewriteWebImports() {
  for (const filePath of await collectFiles(webDir)) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) continue;

    const current = await readFile(filePath, 'utf8');
    const updated = current
      .replaceAll('@repo/assets/icons', '@/assets/icons')
      .replaceAll('@repo/assets/', '@/assets/');

    if (updated !== current) {
      await writeFile(filePath, updated);
    }
  }
}

async function updateWebManifest() {
  const manifestPath = path.join(webDir, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const assetsManifest = JSON.parse(
    await readFile(path.join(assetsPackageDir, 'package.json'), 'utf8'),
  );

  delete manifest.dependencies?.['@repo/assets'];
  manifest.devDependencies = {
    ...manifest.devDependencies,
    '@svgr/cli': assetsManifest.devDependencies['@svgr/cli'],
    '@svgr/core': assetsManifest.dependencies['@svgr/core'],
  };

  const buildAssets =
    'svgr --out-dir assets/icons/generated --typescript --config-file assets/.svgrrc.cjs assets/icons/source && node scripts/generate-web-icons-index.mjs';
  manifest.scripts = {
    ...manifest.scripts,
    'assets:build': buildAssets,
    predev: 'npm run assets:build',
    prebuild: 'npm run assets:build',
    prelint: 'npm run assets:build',
    'precheck-types': 'npm run assets:build',
    pretest: 'npm run assets:build',
    'pretest:watch': 'npm run assets:build',
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function updateWebTypeScriptConfig() {
  const configPath = path.join(webDir, 'tsconfig.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  config.compilerOptions = {
    ...config.compilerOptions,
    baseUrl: '.',
    paths: {
      ...config.compilerOptions?.paths,
      '@/*': ['./*'],
    },
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function createLocalIconGenerator() {
  const generatorPath = path.join(
    webDir,
    'scripts/generate-web-icons-index.mjs',
  );
  const generator = `import console from 'node:console';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(scriptDir, '../assets/icons/source');
const indexPath = path.join(scriptDir, '../assets/icons/index.ts');
const iconNames = (await readdir(iconsDir))
  .filter((file) => file.endsWith('.svg'))
  .map((file) => file.slice(0, -4))
  .sort();
const exports = iconNames
  .map((name) => {
    const componentName = name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return \`export { default as \${componentName} } from './generated/\${componentName}';\`;
  })
  .join('\\n');

await writeFile(
  indexPath,
  \`// Auto-generated by scripts/generate-web-icons-index.mjs. Do not edit.\\n\\n\${exports}\\n\\nexport type { SVGProps } from 'react';\\n\`,
);
console.info(\`Generated web icon index with \${iconNames.length} icons\`);
`;

  await mkdir(path.dirname(generatorPath), { recursive: true });
  await writeFile(generatorPath, generator);
}

async function updateGitignore() {
  const gitignorePath = path.join(rootDir, '.gitignore');
  const entry = 'apps/web/assets/icons/generated/';
  const current = await readFile(gitignorePath, 'utf8');
  if (!current.includes(entry)) {
    await writeFile(gitignorePath, `${current.trimEnd()}\n${entry}\n`);
  }
}

async function localizeAssets() {
  execFileSync('npm', ['run', 'build', '--workspace=@repo/assets'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  await mkdir(webAssetsDir, { recursive: true });
  for (const category of ['brand', 'illustrations', 'images']) {
    await copyDirectoryIfPresent(
      path.join(assetsPackageDir, 'src', category),
      path.join(webAssetsDir, category),
    );
  }
  await copyDirectoryIfPresent(
    path.join(assetsPackageDir, 'src/icons'),
    path.join(webAssetsDir, 'icons/source'),
  );
  await rm(path.join(webAssetsDir, 'icons/source/index.ts'), { force: true });
  await copyDirectoryIfPresent(
    path.join(assetsPackageDir, 'dist/icons'),
    path.join(webAssetsDir, 'icons/generated'),
  );
  await cp(
    path.join(assetsPackageDir, '.svgrrc.js'),
    path.join(webAssetsDir, '.svgrrc.cjs'),
  );

  await createLocalIconGenerator();
  await updateWebManifest();
  await updateWebTypeScriptConfig();
  await rewriteWebImports();
  await updateGitignore();
  await rm(assetsPackageDir, { recursive: true });

  if (!skipInstall) {
    execFileSync('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
  }
}

for (const requiredPath of [
  path.join(assetsPackageDir, 'package.json'),
  path.join(assetsPackageDir, 'src/icons'),
  path.join(webDir, 'package.json'),
]) {
  if (!(await pathExists(requiredPath))) {
    throw new Error(
      `Expected path is missing: ${path.relative(rootDir, requiredPath)}`,
    );
  }
}

const externalConsumers = await findExternalConsumers();
if (externalConsumers.length > 0) {
  throw new Error(
    `Cannot localize @repo/assets while other workspaces consume it:\n${externalConsumers
      .map((consumer) => `- ${consumer}`)
      .join('\n')}`,
  );
}

if (!apply) {
  console.info('Dry run: @repo/assets can be localized safely.');
  console.info('The script will:');
  console.info('- keep @repo/ui and @repo/design-system as shared packages');
  console.info(
    '- move raw assets and generated icon components into apps/web/assets',
  );
  console.info('- rewrite web imports to use the @/* alias');
  console.info('- remove packages/assets and refresh the root lockfile');
  console.info('Run with --apply to perform the migration.');
} else {
  await localizeAssets();
  console.info('Localized @repo/assets into apps/web/assets.');
  console.info('Review root architecture documentation before committing.');
}
