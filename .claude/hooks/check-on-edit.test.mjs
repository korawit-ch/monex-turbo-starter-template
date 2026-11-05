/**
 * Tests for the format-and-lint edit hook: which tools run for which files,
 * when the hook blocks, and one real run of ESLint and Prettier on a
 * temporary file inside the repository.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { URL, fileURLToPath } from 'node:url';

import { checkEditedFile } from './check-on-edit.mjs';

const hookPath = fileURLToPath(new URL('./check-on-edit.mjs', import.meta.url));
const projectDir = path.resolve(path.dirname(hookPath), '..', '..');

function recorder(results = {}) {
  const calls = [];
  const run = (command, args) => {
    const tool = path.basename(command);
    calls.push({ tool, args });
    return results[tool] ?? { status: 0, output: '' };
  };
  return { calls, run };
}

test('lints with the per-file config lookup, then formats, a TypeScript file', () => {
  const { calls, run } = recorder();
  const result = checkEditedFile('apps/web/lib/fetch/client.ts', {
    projectDir,
    run,
  });

  assert.equal(result, undefined);
  assert.deepEqual(
    calls.map((call) => call.tool),
    ['eslint', 'prettier'],
  );
  assert.ok(calls[0].args.includes('--fix'));
  assert.ok(calls[0].args.includes('v10_config_lookup_from_file'));
  assert.ok(calls[1].args.includes('--write'));
});

test('only formats files ESLint does not cover', () => {
  const { calls, run } = recorder();
  checkEditedFile('docs/engineering/README.md', { projectDir, run });

  assert.deepEqual(
    calls.map((call) => call.tool),
    ['prettier'],
  );
});

test('blocks with the ESLint report when errors remain after --fix', () => {
  const { run } = recorder({
    eslint: { status: 1, output: '42:28  error  Unnecessary assertion' },
  });
  const result = checkEditedFile('apps/web/app/page.tsx', { projectDir, run });

  assert.match(result.reason, /apps\/web\/app\/page\.tsx/);
  assert.match(result.reason, /42:28 {2}error {2}Unnecessary assertion/);
});

test('does not block when ESLint itself fails to run', () => {
  const { run } = recorder({ eslint: { status: 2, output: 'config error' } });

  assert.equal(
    checkEditedFile('apps/web/app/page.tsx', { projectDir, run }),
    undefined,
  );
});

test('ignores files outside the repository and unsupported types', () => {
  const { calls, run } = recorder();
  checkEditedFile('/etc/hosts.ts', { projectDir, run });
  checkEditedFile('packages/assets/src/icons/check.svg', { projectDir, run });

  assert.equal(calls.length, 0);
});

test('formats and reports a real lint error through the CLI', () => {
  const dir = mkdtempSync(path.join(path.dirname(hookPath), '.tmp-check-'));
  const file = path.join(dir, 'sample.mjs');
  try {
    writeFileSync(file, 'const   unused=1\nexport const kept  = 2\n');

    const output = execFileSync('node', [hookPath], {
      input: JSON.stringify({ tool_input: { file_path: file } }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });

    const decision = JSON.parse(output);
    assert.equal(decision.decision, 'block');
    assert.match(decision.reason, /no-unused-vars/);
    assert.equal(
      readFileSync(file, 'utf8'),
      'const unused = 1;\nexport const kept = 2;\n',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('prints nothing for a clean file', () => {
  const dir = mkdtempSync(path.join(path.dirname(hookPath), '.tmp-check-'));
  const file = path.join(dir, 'clean.mjs');
  try {
    writeFileSync(file, 'export const kept = 2;\n');

    const output = execFileSync('node', [hookPath], {
      input: JSON.stringify({ tool_input: { file_path: file } }),
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    });

    assert.equal(output, '');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
