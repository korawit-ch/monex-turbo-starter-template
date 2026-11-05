/**
 * Tests for the Bash guard hook: every rule in guard-rules.json has a blocked
 * and an allowed case, the remote-database check covers each source of
 * DATABASE_URL, and the CLI path prints valid hook output.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { URL, fileURLToPath } from 'node:url';

import { evaluate } from './guard-bash.mjs';

const hookPath = fileURLToPath(new URL('./guard-bash.mjs', import.meta.url));

const decisionOf = (command, options) => evaluate(command, options)?.decision;

const cases = [
  ['deny', 'git push --force origin feat/x'],
  ['deny', 'git push --force-with-lease'],
  ['deny', 'git push -f'],
  ['deny', 'git push origin +feat/x'],
  ['deny', 'git push origin main'],
  ['deny', 'git push origin HEAD:develop'],
  ['deny', 'git reset --hard origin/develop'],
  ['deny', 'git clean -fd'],
  ['deny', 'git add -A'],
  ['deny', 'git add .'],
  ['deny', 'git add --all && git commit -m "x"'],
  ['deny', 'git commit --no-verify -m "x"'],
  ['deny', 'npx prisma migrate reset'],
  ['deny', 'npx prisma db push --force-reset'],
  ['deny', 'npx prisma db push --accept-data-loss'],
  ['deny', 'docker-compose down -v'],
  ['deny', 'cd apps/db && docker compose down --volumes'],
  ['deny', 'docker volume rm monex_postgres_data'],
  ['deny', 'docker system prune -a'],
  ['ask', 'git commit -m "docs(readme): fix link"'],
  ['ask', 'git push -u origin feat/develop-banner'],
  ['ask', 'npm run auth:remove -- --apply'],
  ['ask', 'npm run template:finalize -- --apply'],
  ['ask', 'npm run app:duplicate -- --source web --name admin --apply'],
  ['ask', 'node scripts/localize-prisma-in-api.mjs --apply'],
  ['ask', 'npm run env:distribute -- --force'],
  [undefined, 'git status'],
  [undefined, 'git add apps/web/app/page.tsx'],
  [undefined, 'git diff --stat origin/develop...HEAD'],
  [undefined, 'npm run auth:remove'],
  [undefined, 'npm run app:duplicate -- --source web --name admin'],
  [undefined, 'docker-compose down'],
  [undefined, 'npm run lint'],
  [undefined, 'npm run db:validate'],
];

for (const [expected, command] of cases) {
  test(`${expected ?? 'no decision'}: ${command}`, () => {
    assert.equal(decisionOf(command), expected);
  });
}

test('denies a database change when an inline URL is remote', () => {
  assert.equal(
    decisionOf(
      'DATABASE_URL=postgresql://app:secret@db.example.com:5432/app npm run db:push',
    ),
    'deny',
  );
});

test('allows a database change when an inline URL is local', () => {
  assert.equal(
    decisionOf(
      'DATABASE_URL=postgresql://app:secret@localhost:5433/app npm run db:migrate',
    ),
    undefined,
  );
});

test('denies psql against a remote host flag', () => {
  assert.equal(decisionOf('psql -h prod.internal.example.com -U app'), 'deny');
});

test('treats a Compose service name as local', () => {
  assert.equal(decisionOf('psql -h postgres -U app'), undefined);
});

test('uses DATABASE_URL from the environment', () => {
  const env = { DATABASE_URL: 'postgresql://app@staging.example.com/app' };
  assert.equal(decisionOf('npm run db:seed', { env }), 'deny');
});

test('falls back to the root .env file', () => {
  const projectDir = mkdtempSync(path.join(tmpdir(), 'guard-bash-'));
  try {
    writeFileSync(
      path.join(projectDir, '.env'),
      'DB_PORT=5433\nDATABASE_URL="postgresql://app:pw@[::1]:5433/app"\n',
    );
    assert.equal(decisionOf('npm run db:push', { projectDir }), undefined);

    writeFileSync(
      path.join(projectDir, '.env'),
      'DATABASE_URL=postgres://app:pw@aurora.cluster.example.com/app\n',
    );
    assert.equal(decisionOf('npm run db:push', { projectDir }), 'deny');
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test('ignores the database URL for commands that change no state', () => {
  const env = { DATABASE_URL: 'postgresql://app@db.example.com/app' };
  assert.equal(decisionOf('npm run db:validate', { env }), undefined);
});

test('prints a PreToolUse decision when run as a hook', () => {
  const output = execFileSync('node', [hookPath], {
    input: JSON.stringify({ tool_input: { command: 'git add -A' } }),
    encoding: 'utf8',
  });
  const { hookSpecificOutput } = JSON.parse(output);
  assert.equal(hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(hookSpecificOutput.permissionDecision, 'deny');
});

test('prints nothing for unreadable input', () => {
  const output = execFileSync('node', [hookPath], {
    input: 'not json',
    encoding: 'utf8',
  });
  assert.equal(output, '');
});
