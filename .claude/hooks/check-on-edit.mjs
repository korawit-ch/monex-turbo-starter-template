#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook for Edit, Write and MultiEdit.
 *
 * Runs the repository's own ESLint (--fix, with the nearest workspace
 * eslint.config, the same rules `npm run lint` applies in CI) and Prettier on
 * the edited file. When ESLint still reports errors, the hook blocks with
 * them so the agent fixes the file before moving on, instead of CI finding
 * them later. Fails open: missing dependencies, files outside the repository
 * or a crashing tool never block the edit.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Keep these in step with lint-staged in the root package.json.
const eslintExtensions = new Set(['.ts', '.tsx', '.mjs']);
const prettierExtensions = new Set([
  ...eslintExtensions,
  '.json',
  '.md',
  '.css',
  '.yml',
  '.yaml',
  '.js',
]);
const MAX_REPORT_CHARS = 4000;

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  return {
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

/**
 * Formats and lints one file. Returns `{ reason }` when errors remain that
 * the agent must fix, or undefined.
 */
export function checkEditedFile(filePath, { projectDir, run = runCommand }) {
  const absolute = path.resolve(projectDir, filePath);
  const relative = path.relative(projectDir, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return undefined;

  const extension = path.extname(absolute);
  if (!prettierExtensions.has(extension)) return undefined;

  const bin = (name) => path.join(projectDir, 'node_modules', '.bin', name);
  const problems = [];

  if (eslintExtensions.has(extension) && existsSync(bin('eslint'))) {
    const eslint = run(
      bin('eslint'),
      [
        '--fix',
        '--flag',
        'v10_config_lookup_from_file',
        '--no-warn-ignored',
        relative,
      ],
      projectDir,
    );
    // 1 = lint errors remain; 2 = ESLint itself failed, which is not the
    // agent's edit to fix, so it is left to the normal checks.
    if (eslint.status === 1) {
      problems.push(`ESLint (workspace config, same as CI):\n${eslint.output}`);
    }
  }

  if (existsSync(bin('prettier'))) {
    const prettier = run(
      bin('prettier'),
      ['--write', '--ignore-unknown', '--log-level', 'warn', relative],
      projectDir,
    );
    if (prettier.status !== 0 && prettier.output) {
      problems.push(`Prettier:\n${prettier.output}`);
    }
  }

  if (problems.length === 0) return undefined;
  const report = problems.join('\n\n').slice(0, MAX_REPORT_CHARS);
  return {
    reason: `${relative} still fails the repository's lint or format check after auto-fix. Fix these before continuing:\n\n${report}`,
  };
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return;
  }
  const filePath =
    input?.tool_input?.file_path ?? input?.tool_response?.filePath;
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input?.cwd;
  if (typeof filePath !== 'string' || typeof projectDir !== 'string') return;

  let result;
  try {
    result = checkEditedFile(filePath, { projectDir });
  } catch {
    return;
  }
  if (!result) return;

  process.stdout.write(
    JSON.stringify({ decision: 'block', reason: result.reason }),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
