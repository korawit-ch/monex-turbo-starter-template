#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook for the Bash tool.
 *
 * Denies or asks about commands an agent must not run on its own: the rules in
 * guard-rules.json, plus database-changing commands whose DATABASE_URL points
 * at a non-local host. Prints a hook decision as JSON, or nothing to let the
 * normal permission flow continue. Fails open on unreadable input, because a
 * guard that crashes must not block every command.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const hookDir = path.dirname(fileURLToPath(import.meta.url));
const { rules } = JSON.parse(
  readFileSync(path.join(hookDir, 'guard-rules.json'), 'utf8'),
);

const statefulDatabaseCommand =
  /\b(db:push|db:migrate|db:seed|prisma\s+(migrate|db\s+(push|seed|execute))|psql|pg_restore)\b/i;

/** Hosts treated as local: loopback, Docker's host alias, and dotless Compose service names. */
function isLocalHost(host) {
  const normalized = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(normalized)) {
    return true;
  }
  if (normalized === 'host.docker.internal') return true;
  return !normalized.includes('.');
}

/** Reads DATABASE_URL from a dotenv file without evaluating it. */
function readDatabaseUrlFromEnvFile(filePath) {
  try {
    const line = readFileSync(filePath, 'utf8')
      .split('\n')
      .find((entry) => /^\s*DATABASE_URL\s*=/.test(entry));
    return line
      ?.replace(/^\s*DATABASE_URL\s*=\s*/, '')
      .trim()
      .replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

function hostOfUrl(url) {
  return url.match(
    /^postgres(?:ql)?:\/\/(?:[^@/\s]*@)?(\[[^\]]+\]|[^:/?\s]+)/i,
  )?.[1];
}

/**
 * Lists the database hosts a command would reach: hosts in inline URLs and
 * psql host flags, else the DATABASE_URL from the environment or the root .env.
 */
function databaseHosts(command, { env, projectDir }) {
  const inline = [...command.matchAll(/postgres(?:ql)?:\/\/[^\s'"]+/gi)].map(
    ([url]) => hostOfUrl(url),
  );
  const flags = [
    ...command.matchAll(/(?:^|\s)(?:-h\s*|--host[=\s])(\S+)/g),
  ].map(([, host]) => host);
  const explicit = [...inline, ...flags].filter(Boolean);
  if (explicit.length > 0) return explicit;

  const url =
    env.DATABASE_URL ??
    (projectDir
      ? readDatabaseUrlFromEnvFile(path.join(projectDir, '.env'))
      : undefined);
  const host = url ? hostOfUrl(url) : undefined;
  return host ? [host] : [];
}

/**
 * Returns `{ decision, reason }` for a Bash command, or undefined when the
 * guard has no opinion. Deny outranks ask.
 */
export function evaluate(command, { env = {}, projectDir } = {}) {
  const normalized = command.replace(/\s+/g, ' ').trim();

  if (statefulDatabaseCommand.test(normalized)) {
    const remote = databaseHosts(normalized, { env, projectDir }).filter(
      (host) => !isLocalHost(host),
    );
    if (remote.length > 0) {
      return {
        decision: 'deny',
        reason: `This command changes database state on ${remote.join(', ')}. Agents run migrations, pushes and seeds against the local database only.`,
      };
    }
  }

  for (const decision of ['deny', 'ask']) {
    const rule = rules.find(
      (candidate) =>
        candidate.decision === decision &&
        new RegExp(candidate.pattern, 'i').test(normalized),
    );
    if (rule) return { decision, reason: rule.reason };
  }
  return undefined;
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const command = input?.tool_input?.command;
  if (typeof command !== 'string' || command.length === 0) return;

  const result = evaluate(command, {
    env: process.env,
    projectDir: process.env.CLAUDE_PROJECT_DIR ?? input.cwd,
  });
  if (!result) return;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: result.decision,
        permissionDecisionReason: `Repository guard (.claude/hooks/guard-rules.json): ${result.reason}`,
      },
    }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
