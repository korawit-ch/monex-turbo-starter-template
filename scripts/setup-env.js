#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');

// Fallbacks for placeholders that .env.example does not assign itself.
const defaults = {
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'monex-turbo-starter-template-db',
  DB_PORT: '5433',
  DB_CONTAINER_NAME: 'monex-turbo-starter-template-db',
};

/** Reads KEY=value assignments so placeholders resolve from the same file. */
function readAssignments(content) {
  const values = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

// Create .env from .env.example if it doesn't exist
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📝 Creating .env from .env.example...');

  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  const assigned = readAssignments(envContent);

  // Replace ${VAR} and ${VAR:-fallback}: an inline fallback first, then the
  // value assigned in .env.example, then the defaults above.
  envContent = envContent.replace(
    /\$\{(\w+)(?::-([^}]+))?\}/g,
    (match, varName, defaultValue) =>
      defaultValue ?? assigned[varName] ?? defaults[varName] ?? match,
  );

  // Never start with the publicly known example secrets: replace every
  // *_SECRET placeholder with a fresh random value.
  envContent = envContent.replace(
    /^(\s*\w+_SECRET\s*=\s*)(['"]?)replace-with-[^'"\n]*\2\s*$/gm,
    (match, assignment) =>
      `${assignment}"${crypto.randomBytes(32).toString('base64url')}"`,
  );

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
} else if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
} else {
  console.warn('⚠️  .env.example not found, skipping .env creation');
}
