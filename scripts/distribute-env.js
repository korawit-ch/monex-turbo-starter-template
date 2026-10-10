#!/usr/bin/env node

/* global __dirname, require */
/* eslint-disable @typescript-eslint/no-require-imports */

const console = require('node:console');
const fs = require('fs');
const path = require('path');
const process = require('node:process');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const force = process.argv.includes('--force');

// Packages to exclude (config packages)
const excludedPackages = ['eslint-config', 'jest-config', 'typescript-config'];

// Check if root .env exists
if (!fs.existsSync(envPath)) {
  console.error(
    '❌ Root .env file not found. Please create it from .env.example',
  );
  process.exit(1);
}

// Get all apps
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

const targets = [];

// Add apps
if (fs.existsSync(appsDir)) {
  const apps = fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) =>
      fs.existsSync(path.join(appsDir, dirent.name, 'package.json')),
    )
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(appsDir, dirent.name),
    }));
  targets.push(...apps);
}

// Add packages (excluding config packages)
if (fs.existsSync(packagesDir)) {
  const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) =>
      fs.existsSync(path.join(packagesDir, dirent.name, 'package.json')),
    )
    .filter((dirent) => !excludedPackages.includes(dirent.name))
    .map((dirent) => ({
      name: dirent.name,
      path: path.join(packagesDir, dirent.name),
    }));
  targets.push(...packages);
}

// Distribute .env to each target
let distributed = 0;
let preserved = 0;
let failures = 0;
for (const target of targets) {
  const targetEnvPath = path.join(target.path, '.env');
  const relativePath = path.relative(rootDir, target.path);

  // Create symlink to root .env
  try {
    let stats;
    try {
      stats = fs.lstatSync(targetEnvPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (stats && !stats.isSymbolicLink()) {
      if (!force) {
        console.warn(
          `⚠️  Preserved regular file ${relativePath}/.env (use --force only after backing it up)`,
        );
        preserved++;
        continue;
      }
      fs.unlinkSync(targetEnvPath);
      stats = undefined;
    }

    if (!stats) {
      const relativeEnvPath = path.relative(target.path, envPath);
      fs.symlinkSync(relativeEnvPath, targetEnvPath, 'file');
      console.info(`✅ Linked .env to ${relativePath}/`);
      distributed++;
    } else {
      console.info(`⏭️  ${relativePath}/.env already exists (symlink)`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to create symlink for ${relativePath}:`,
      error.message,
    );
    failures++;
  }
}

if (distributed > 0) {
  console.info(`\n✨ Distributed .env to ${distributed} target(s)`);
} else {
  console.info('\n✨ All targets already have .env symlinks');
}

if (preserved > 0) {
  console.warn(
    `\n⚠️  Preserved ${preserved} regular workspace .env file(s). Merge their values into the root .env, back them up, then run npm run env:distribute -- --force if replacement is intended.`,
  );
}
if (preserved > 0 || failures > 0) process.exitCode = 1;
