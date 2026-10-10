#!/usr/bin/env node

import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const apply = process.argv.includes('--apply');
const skipInstall = process.argv.includes('--skip-install');

if (process.argv.includes('--help')) {
  console.info(
    'Usage: npm run template:finalize -- [--apply] [--skip-install]',
  );
  console.info('The command is a dry run unless --apply is provided.');
  process.exit(0);
}

const removalPaths = [
  'apps/api/src/links',
  'apps/web/app/api/links',
  'apps/web/app/(protected)/(home)/_components/links-demo.tsx',
  'apps/web/app/(home)/_components/links-demo.tsx',
  'apps/web/data-access/links.client.ts',
  'apps/web/data-access/links.server.ts',
  'packages/api-contract/src/links.ts',
  'scripts/auth-removal',
  'scripts/duplicate-app.mjs',
  'scripts/localize-prisma-in-api.mjs',
  'scripts/localize-web-assets.mjs',
  'scripts/remove-auth.mjs',
  'scripts/setup-project.mjs',
  'scripts/finalize-template.mjs',
];

const optionalRemovalPaths = ['.monex-setup.json'];

const requiredPaths = [
  'apps/api/src/links',
  'apps/web/data-access/links.client.ts',
  'apps/web/data-access/links.server.ts',
  'packages/api-contract/src/links.ts',
  'scripts/setup-project.mjs',
  'scripts/finalize-template.mjs',
  'apps/api/src/app.module.ts',
  'packages/api-contract/src/index.ts',
];

function absolute(relativePath) {
  return path.join(rootDir, relativePath);
}

async function exists(relativePath) {
  try {
    await readFile(absolute(relativePath));
    return true;
  } catch (error) {
    if (error.code === 'EISDIR') return true;
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function findRequiredPath(candidates, description) {
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error(
    `Cannot find ${description}. Checked: ${candidates.join(', ')}`,
  );
}

const homePagePath = await findRequiredPath(
  ['apps/web/app/(protected)/(home)/page.tsx', 'apps/web/app/(home)/page.tsx'],
  'the web home example',
);
const linksDemoPath = await findRequiredPath(
  [
    'apps/web/app/(protected)/(home)/_components/links-demo.tsx',
    'apps/web/app/(home)/_components/links-demo.tsx',
  ],
  'the web Link demo component',
);
const prismaSchemaPath = await findRequiredPath(
  ['packages/prisma/prisma/schema.prisma', 'apps/api/prisma/schema.prisma'],
  'the Prisma schema',
);
const prismaSeedPath = await findRequiredPath(
  ['packages/prisma/prisma/seed.ts', 'apps/api/prisma/seed.ts'],
  'the Prisma seed',
);

function git(args) {
  return execFileSync('git', args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function requireCleanTree() {
  if (git(['status', '--porcelain'])) {
    throw new Error(
      'Template finalization requires a clean working tree. Commit or stash changes first.',
    );
  }
}

async function replaceRequired(relativePath, search, replacement) {
  const filePath = absolute(relativePath);
  const current = await readFile(filePath, 'utf8');
  if (!current.includes(search)) {
    throw new Error(`Expected content is missing from ${relativePath}.`);
  }
  await writeFile(filePath, current.replace(search, replacement));
}

async function requireText(relativePath, fragments) {
  const current = await readFile(absolute(relativePath), 'utf8');
  for (const fragment of fragments) {
    if (!current.includes(fragment)) {
      throw new Error(`Expected content is missing from ${relativePath}.`);
    }
  }
}

async function validateFinalization() {
  await requireText('apps/api/src/app.module.ts', [
    "import { LinksModule } from './links/links.module';",
  ]);
  const apiModule = await readFile(
    absolute('apps/api/src/app.module.ts'),
    'utf8',
  );
  if (
    ![
      'imports: [PrismaModule, AuthModule, LinksModule]',
      'imports: [PrismaModule, LinksModule]',
    ].some((fragment) => apiModule.includes(fragment))
  ) {
    throw new Error(
      'Expected Link module registration is missing from apps/api/src/app.module.ts.',
    );
  }
  await requireText(homePagePath, [
    'data-access/links.server',
    "import { LinksDemo } from './_components/links-demo';",
    'const links = await getLinks();',
    '{/* Data */}',
    '{/* Client-side fetch demo */}',
  ]);
  await requireText('packages/api-contract/src/index.ts', [
    "export { linksApi } from './links.js';",
    "} from './links.js';",
  ]);
  await requireText('packages/api-contract/package.json', ['"./links"']);
  await requireText(prismaSchemaPath, ['model Link {']);
  await requireText(prismaSeedPath, ['const links = [', 'prisma.link.']);
  await requireText('package.json', ['"template:finalize"', '"setup"']);
  await requireText(linksDemoPath, ['useLinksQuery']);
}

async function updateJson(relativePath, update) {
  const filePath = absolute(relativePath);
  const value = JSON.parse(await readFile(filePath, 'utf8'));
  update(value);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function updatePage() {
  const relativePath = homePagePath;
  const filePath = absolute(relativePath);
  let current = await readFile(filePath, 'utf8');

  const requiredFragments = [
    "import { LinksDemo } from './_components/links-demo';\n",
    '  const links = await getLinks();\n\n',
    '        {/* Data */}',
    '        {/* Client-side fetch demo */}',
  ];
  for (const fragment of requiredFragments) {
    if (!current.includes(fragment)) {
      throw new Error(
        `Expected Link demo content is missing from ${relativePath}.`,
      );
    }
  }

  const getLinksImport = current
    .split('\n')
    .find(
      (line) =>
        line.startsWith("import { getLinks } from '") &&
        line.includes('data-access/links.server'),
    );
  if (!getLinksImport) {
    throw new Error(
      `Expected getLinks import is missing from ${relativePath}.`,
    );
  }

  current = current
    .replace(`${getLinksImport}\n`, '')
    .replace(requiredFragments[0], '')
    .replace(requiredFragments[1], '');

  const demoStart = current.indexOf('        {/* Data */}');
  const mainEnd = current.indexOf('      </main>', demoStart);
  if (demoStart === -1 || mainEnd === -1) {
    throw new Error(`Cannot locate the Link demo sections in ${relativePath}.`);
  }
  current = `${current.slice(0, demoStart)}${current.slice(mainEnd)}`;
  await writeFile(filePath, current);
}

async function updateSeed() {
  const relativePath = prismaSeedPath;
  const filePath = absolute(relativePath);
  const current = await readFile(filePath, 'utf8');
  const start = current.indexOf('  const links = [');
  const end = current.indexOf(
    "\n\n  console.log('Seed completed successfully!');",
    start,
  );
  if (start === -1 || end === -1) {
    throw new Error(`Cannot locate Link seed data in ${relativePath}.`);
  }
  await writeFile(
    filePath,
    `${current.slice(0, start)}${current.slice(end + 2)}`,
  );
}

async function applyFinalization() {
  await replaceRequired(
    'apps/api/src/app.module.ts',
    "import { LinksModule } from './links/links.module';\n",
    '',
  );
  const apiModulePath = 'apps/api/src/app.module.ts';
  const apiModuleFile = absolute(apiModulePath);
  const apiModule = await readFile(apiModuleFile, 'utf8');
  const registrations = [
    {
      current: 'imports: [PrismaModule, AuthModule, LinksModule]',
      updated: 'imports: [PrismaModule, AuthModule]',
    },
    {
      current: 'imports: [PrismaModule, LinksModule]',
      updated: 'imports: [PrismaModule]',
    },
  ];
  const registration = registrations.find(({ current }) =>
    apiModule.includes(current),
  );
  if (!registration) {
    throw new Error(`Expected content is missing from ${apiModulePath}.`);
  }
  await writeFile(
    apiModuleFile,
    apiModule.replace(registration.current, registration.updated),
  );

  await updatePage();

  await replaceRequired(
    'packages/api-contract/src/index.ts',
    "export { linksApi } from './links.js';\n\n",
    '',
  );
  await replaceRequired(
    'packages/api-contract/src/index.ts',
    "export type {\n  CreateLinkRequest,\n  LinkResponse,\n  UpdateLinkRequest,\n} from './links.js';\n",
    '',
  );
  await updateJson('packages/api-contract/package.json', (manifest) => {
    delete manifest.exports?.['./links'];
  });

  const schemaPath = prismaSchemaPath;
  const schema = await readFile(absolute(schemaPath), 'utf8');
  const schemaWithoutRelation = schema.replace(/^ {2}links Link\[\]\n/m, '');
  const modelStart = schemaWithoutRelation.indexOf('\nmodel Link {');
  const modelEnd = schemaWithoutRelation.indexOf('\n}\n', modelStart);
  if (modelStart === -1 || modelEnd === -1) {
    throw new Error(`Cannot locate the Link model in ${schemaPath}.`);
  }
  await writeFile(
    absolute(schemaPath),
    `${schemaWithoutRelation.slice(0, modelStart)}${schemaWithoutRelation.slice(modelEnd + 3)}`,
  );
  await updateSeed();

  await updateJson('package.json', (manifest) => {
    for (const scriptName of [
      'app:duplicate',
      'assets:localize:web',
      'auth:remove',
      'prisma:localize:api',
      'template:finalize',
      'setup',
    ]) {
      delete manifest.scripts?.[scriptName];
    }
  });

  for (const relativePath of removalPaths) {
    await rm(absolute(relativePath), { recursive: true, force: true });
  }
  for (const relativePath of optionalRemovalPaths) {
    await rm(absolute(relativePath), { recursive: true, force: true });
  }

  execFileSync(
    'npx',
    [
      'prettier',
      '--write',
      'apps/api/src/app.module.ts',
      homePagePath,
      'package.json',
      'packages/api-contract/package.json',
      'packages/api-contract/src/index.ts',
      prismaSeedPath,
    ],
    { cwd: rootDir, stdio: 'inherit' },
  );

  if (!skipInstall) {
    execFileSync('npm', ['install'], { cwd: rootDir, stdio: 'inherit' });
  }
}

for (const relativePath of requiredPaths) {
  if (!(await exists(relativePath))) {
    throw new Error(`Expected template path is missing: ${relativePath}`);
  }
}
await validateFinalization();

if (!apply) {
  console.info('Dry run: the starter template can be finalized safely.');
  console.info('The script will:');
  console.info('- remove the Link API/BFF/data-access/UI example');
  console.info('- remove the Link Prisma model and seed records from source');
  console.info('- remove the Link API contract and exports');
  console.info('- remove one-time template migration scripts and snapshots');
  console.info('- remove the interactive setup assistant and its local state');
  console.info('- keep operational environment/database scripts and docs');
  console.info('- leave PostgreSQL schema/data unchanged');
  console.info('Run with --apply to perform the cleanup.');
} else {
  requireCleanTree();
  await applyFinalization();
  console.info('Starter template finalization completed.');
  console.info(
    'Create and review a database migration for the removed Link model before changing persistent environments.',
  );
  console.info(
    'Replace the remaining sample link permissions when the first real domain permission is introduced.',
  );
  if (skipInstall) {
    console.info('Run npm install to refresh the workspace lockfile.');
  }
}
