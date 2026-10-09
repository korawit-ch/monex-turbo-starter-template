export function safeReturnTo(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const base = new URL('https://local.invalid');
    const destination = new URL(value, base);
    return destination.origin === base.origin ? value : '/';
  } catch {
    return '/';
  }
}
