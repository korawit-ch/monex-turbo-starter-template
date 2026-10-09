import 'server-only';

function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error(`${name} must contain at least 32 bytes`);
  }
  return value;
}

export function getAuthVerificationConfig() {
  return {
    secret: requireSecret('AUTH_JWT_SECRET'),
    issuer: process.env.AUTH_JWT_ISSUER || 'monex-api',
    audience: process.env.AUTH_JWT_AUDIENCE || 'monex-web',
  };
}

export function getApiInternalUrl(): string {
  const value = process.env.API_INTERNAL_URL;
  if (!value) throw new Error('API_INTERNAL_URL is required');
  return value.replace(/\/$/, '');
}

export function getWebOrigin(): string {
  return (process.env.WEB_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
}
