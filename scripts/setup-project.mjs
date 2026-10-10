#!/usr/bin/env node

import console from 'node:console';
import { spawnSync } from 'node:child_process';
import { lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const statePath = path.join(rootDir, '.monex-setup.json');
const dryRun = process.argv.includes('--dry-run');
const input = process.stdin;
const output = process.stdout;

function relative(relativePath) {
  return path.join(rootDir, relativePath);
}

async function exists(targetPath) {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}.`,
    );
  }
  return result.status ?? 1;
}

async function askYesNo(rl, question, defaultValue) {
  const suffix = defaultValue ? ' [Y/n] ' : ' [y/N] ';
  while (true) {
    const answer = (await rl.question(`${question}${suffix}`))
      .trim()
      .toLowerCase();
    if (!answer) return defaultValue;
    if (['y', 'yes'].includes(answer)) return true;
    if (['n', 'no'].includes(answer)) return false;
    console.info('Enter yes or no.');
  }
}

async function askChoice(rl, question, choices, defaultValue) {
  console.info(`\n${question}`);
  for (const choice of choices) {
    console.info(`  ${choice.value}. ${choice.label}`);
  }

  while (true) {
    const answer = (await rl.question(`Choose [${defaultValue}]: `)).trim();
    const value = answer || defaultValue;
    if (choices.some((choice) => choice.value === value)) return value;
    console.info(
      `Choose one of: ${choices.map(({ value }) => value).join(', ')}`,
    );
  }
}

async function askCount(rl, question, defaultValue = 0) {
  while (true) {
    const answer = (
      await rl.question(`${question} [${defaultValue}]: `)
    ).trim();
    const value = answer || String(defaultValue);
    if (/^(?:0|[1-9]\d*)$/.test(value) && Number.isSafeInteger(Number(value))) {
      return Number(value);
    }
    console.info('Enter a non-negative whole number.');
  }
}

async function confirmApply(rl, label, risk, phrase = 'APPLY') {
  console.warn(`\nRisk: ${risk}`);
  const answer = await rl.question(
    `Type ${phrase} to ${label}, or press Enter to keep the preview only: `,
  );
  return answer.trim() === phrase;
}

async function architectureStatus() {
  const authIncluded = await exists(relative('apps/api/src/auth'));
  const sharedPrisma = await exists(relative('packages/prisma/package.json'));
  const localizedPrisma = await exists(
    relative('apps/api/prisma/schema.prisma'),
  );
  const sharedAssets = await exists(relative('packages/assets/package.json'));
  const localizedAssets = await exists(relative('apps/web/assets'));

  let prisma = 'not detected';
  if (sharedPrisma) prisma = 'shared through @repo/prisma';
  else if (localizedPrisma) prisma = 'localized in apps/api';

  let assets = 'not detected';
  if (sharedAssets) assets = 'shared through @repo/assets';
  else if (localizedAssets) assets = 'localized in apps/web';

  return {
    authentication: authIncluded ? 'included' : 'removed',
    prisma,
    assets,
  };
}

async function printStatus() {
  const status = await architectureStatus();
  console.info('\nCurrent project architecture:');
  console.info(`- authentication: ${status.authentication}`);
  console.info(`- Prisma: ${status.prisma}`);
  console.info(`- assets: ${status.assets}`);
  console.info(
    `- guided setup: ${(await exists(statePath)) ? 'completed previously' : 'not completed'}`,
  );
}

async function runGuardedMigration(
  rl,
  { label, script, risk, confirmation = 'APPLY' },
) {
  if (!(await exists(relative(script)))) {
    console.info(`\nSkipping ${label}: ${script} is no longer present.`);
    return false;
  }

  console.info(`\nPreviewing ${label}...`);
  run('node', [script]);
  if (dryRun) {
    console.info(`Dry run: ${label} was not applied.`);
    return false;
  }
  if (!(await confirmApply(rl, label, risk, confirmation))) {
    console.info(`Kept ${label} as a preview only.`);
    return false;
  }

  run('node', [script, '--apply', '--skip-install']);
  return true;
}

async function promptForDuplicate(rl) {
  const duplicates = [];

  console.info(
    '\nThe starter already includes apps/web and apps/api. Plan any additional applications before duplication.',
  );
  const frontendCount = await askCount(
    rl,
    'How many additional frontend applications should this project have?',
  );
  const backendCount = await askCount(
    rl,
    'How many additional backend applications should this project have?',
  );

  const plannedNames = new Set();
  for (const { source, label, count } of [
    { source: 'web', label: 'Frontend', count: frontendCount },
    { source: 'api', label: 'Backend', count: backendCount },
  ]) {
    for (let index = 1; index <= count; index += 1) {
      let name;
      while (!name) {
        const answer = (
          await rl.question(`${label} application ${index} name: `)
        ).trim();
        if (!answer) {
          console.info('Enter an application name.');
        } else if (
          !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(answer) ||
          answer.length > 214
        ) {
          console.info(
            'Use a lowercase, unscoped npm name with letters, numbers, dots, hyphens, or underscores.',
          );
        } else if (plannedNames.has(answer)) {
          console.info('Each application must have a unique name.');
        } else if (await exists(relative(path.join('apps', answer)))) {
          console.info(`apps/${answer} already exists. Choose another name.`);
        } else {
          name = answer;
          plannedNames.add(answer);
        }
      }

      const port = (
        await rl.question(
          `${label} application ${index} development port (optional, press Enter to keep it): `,
        )
      ).trim();
      duplicates.push({ source, name, port });
    }
  }
  return duplicates;
}

async function applyDuplicates(rl, duplicates) {
  let changed = false;
  for (const duplicate of duplicates) {
    const args = [
      'scripts/duplicate-app.mjs',
      '--source',
      duplicate.source,
      '--name',
      duplicate.name,
    ];
    if (duplicate.port) args.push('--port', duplicate.port);

    console.info(`\nPreviewing creation of apps/${duplicate.name}...`);
    run('node', args);
    if (dryRun) continue;
    if (
      !(await confirmApply(
        rl,
        `create apps/${duplicate.name}`,
        'The new app is copied from the source app as it exists now. Review copied examples, credentials, ports, and ownership before committing.',
        'CREATE',
      ))
    ) {
      console.info(`Did not create apps/${duplicate.name}.`);
      continue;
    }

    run('node', [...args, '--apply', '--skip-install']);
    changed = true;
  }
  return changed;
}

async function configureArchitecture(rl, { initial }) {
  let changed = false;
  const status = await architectureStatus();

  let removeAuth = false;
  if (status.authentication === 'included') {
    removeAuth = initial
      ? !(await askYesNo(
          rl,
          'Does this project need the included authentication and authorization flow?',
          true,
        ))
      : await askYesNo(
          rl,
          'Remove the included authentication and authorization flow?',
          false,
        );
  }

  let localizePrisma = false;
  if (status.prisma === 'shared through @repo/prisma') {
    const prismaOwnership = await askChoice(
      rl,
      'How should Prisma schema/client ownership work?',
      [
        {
          value: '1',
          label:
            'Shared server-only package (recommended when backends share one database schema)',
        },
        {
          value: '2',
          label:
            'Localize into apps/api (use before duplicating APIs that need independent schema copies)',
        },
      ],
      '1',
    );
    localizePrisma = prismaOwnership === '2';
  }

  let localizeAssets = false;
  if (status.assets === 'shared through @repo/assets') {
    const assetOwnership = await askChoice(
      rl,
      'How should visual assets and generated icons be owned?',
      [
        {
          value: '1',
          label: 'Shared through @repo/assets (recommended for multiple apps)',
        },
        {
          value: '2',
          label: 'Localize into apps/web for a single web application',
        },
      ],
      '1',
    );
    localizeAssets = assetOwnership === '2';
  }

  const duplicates = await promptForDuplicate(rl);

  // Auth removal runs first because its versioned integration snapshots describe
  // the shared starter layout. Ownership localization and duplication then copy
  // the selected no-auth/authenticated state.
  if (removeAuth) {
    changed =
      (await runGuardedMigration(rl, {
        label: 'remove authentication',
        script: 'scripts/remove-auth.mjs',
        risk: 'Auth-owned files are deleted and shared files are three-way merged. Modified auth-owned files cause the preflight to fail rather than being overwritten.',
        confirmation: 'REMOVE AUTH',
      })) || changed;
  }
  if (localizePrisma) {
    changed =
      (await runGuardedMigration(rl, {
        label: 'localize Prisma into apps/api',
        script: 'scripts/localize-prisma-in-api.mjs',
        risk: 'packages/prisma is removed after its schema, seed, client, and CLI configuration move into apps/api. External consumers or destination collisions stop the migration.',
        confirmation: 'LOCALIZE PRISMA',
      })) || changed;
  }
  if (localizeAssets) {
    changed =
      (await runGuardedMigration(rl, {
        label: 'localize assets into apps/web',
        script: 'scripts/localize-web-assets.mjs',
        risk: 'packages/assets is removed after raw files and generated icon support move into apps/web. External consumers stop the migration.',
        confirmation: 'LOCALIZE ASSETS',
      })) || changed;
  }

  changed = (await applyDuplicates(rl, duplicates)) || changed;
  return changed;
}

async function distributeEnvironment(rl, automatic) {
  if (dryRun) {
    console.info(
      '\nDry run: environment creation and distribution were skipped.',
    );
    return;
  }

  run('node', ['scripts/setup-env.js']);
  console.info(
    automatic
      ? '\nFirst run: distributing the root .env to eligible workspaces.'
      : '\nDistributing the root .env to eligible workspaces.',
  );
  const status = run('node', ['scripts/distribute-env.js'], {
    allowFailure: true,
  });
  if (status === 0) return;

  console.warn(
    '\nOne or more workspace .env files are regular files. Replacing them can permanently discard project-specific values.',
  );
  if (
    await confirmApply(
      rl,
      'replace regular workspace .env files with links to the root .env',
      'Existing workspace .env contents will be deleted. Back them up or merge their values into the root .env first.',
      'REPLACE ENV FILES',
    )
  ) {
    run('node', ['scripts/distribute-env.js', '--force']);
  } else {
    console.info('Workspace .env files were preserved.');
  }
}

async function saveState() {
  const state = {
    version: 1,
    completedAt: new Date().toISOString(),
    architecture: await architectureStatus(),
  };
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function runFinalization(rl) {
  if (!(await exists(relative('scripts/finalize-template.mjs')))) {
    console.info(
      'Template finalization is no longer available or was already run.',
    );
    return;
  }

  console.info('\nPreviewing template finalization...');
  run('node', ['scripts/finalize-template.mjs']);
  if (dryRun) return;

  if (
    !(await confirmApply(
      rl,
      'finalize the starter template',
      'This deletes the Link example and all one-time setup/localization/removal scripts, including npm run setup. It requires a clean tree and exact recognizable example integration. Duplicated apps are not cleaned.',
      'FINALIZE TEMPLATE',
    ))
  ) {
    console.info('Kept template finalization as a preview only.');
    return;
  }

  // Do not skip installation here: this child removes the setup assistant itself.
  run('node', ['scripts/finalize-template.mjs', '--apply']);
}

function printHelp() {
  console.info('Usage: npm run setup -- [--dry-run] [--status] [--help]');
  console.info('');
  console.info(
    'Interactive by default. First run initializes environment links and',
  );
  console.info(
    'guides auth, Prisma, asset, and app-duplication choices. Later runs',
  );
  console.info(
    'offer individual migrations plus optional template finalization.',
  );
  console.info('');
  console.info(
    '--dry-run  Preview selected actions without changing files or setup state',
  );
  console.info(
    '--status   Print detected ownership/authentication state and exit',
  );
  console.info('--help     Print this help and exit');
}

async function createPrompter() {
  if (input.isTTY) return createInterface({ input, output });

  let contents = '';
  input.setEncoding('utf8');
  for await (const chunk of input) contents += chunk;
  const answers = contents.split(/\r?\n/);
  return {
    async question(question) {
      output.write(question);
      if (answers.length === 0) {
        throw new Error(
          'Setup needs more answers than were provided on standard input.',
        );
      }
      const answer = answers.shift() ?? '';
      output.write(`${answer}\n`);
      return answer;
    },
    close() {},
  };
}

if (process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}
if (process.argv.includes('--status')) {
  await printStatus();
  process.exit(0);
}

const rl = await createPrompter();
try {
  const initial = !(await exists(statePath));
  console.info('Monex project setup assistant');
  console.info(
    'Every architecture migration is previewed before it can be applied.',
  );
  console.info(
    'The Link example is intentionally retained during initial setup so the team can use it as a working reference.',
  );
  if (dryRun)
    console.info('Dry-run mode: no files or setup state will change.');
  await printStatus();

  if (initial) {
    const changed = await configureArchitecture(rl, { initial: true });
    if (changed) run('npm', ['install']);
    await distributeEnvironment(rl, true);
    if (!dryRun) await saveState();
    console.info(
      dryRun
        ? '\nInitial setup preview complete.'
        : '\nInitial setup complete.',
    );
    console.info(
      'Keep the Link example while learning the architecture. Run npm run setup later and choose template finalization only after replacing it.',
    );
  } else {
    const action = await askChoice(
      rl,
      'What would you like to do?',
      [
        {
          value: '1',
          label: 'Review/change architecture and optionally duplicate apps',
        },
        { value: '2', label: 'Duplicate an app only' },
        { value: '3', label: 'Create/distribute environment files' },
        { value: '4', label: 'Preview or apply final template cleanup' },
        { value: '5', label: 'Show status and exit' },
        { value: '0', label: 'Exit' },
      ],
      '0',
    );

    if (action === '1') {
      const changed = await configureArchitecture(rl, { initial: false });
      if (changed) {
        run('npm', ['install']);
        await distributeEnvironment(rl, false);
        await saveState();
      }
    } else if (action === '2') {
      const changed = await applyDuplicates(rl, await promptForDuplicate(rl));
      if (changed) {
        run('npm', ['install']);
        await distributeEnvironment(rl, false);
        await saveState();
      }
    } else if (action === '3') {
      await distributeEnvironment(rl, false);
      await saveState();
    } else if (action === '4') {
      await runFinalization(rl);
    } else if (action === '5') {
      await printStatus();
    }
  }
} finally {
  rl.close();
}
