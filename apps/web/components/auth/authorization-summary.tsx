'use client';

import { useAuth } from '../../providers/auth-provider';

/** App-wide presentation of the sanitized authorization context. */
export function AuthorizationSummary() {
  const { auth } = useAuth();

  return (
    <dl className="border-surface my-6 grid gap-2 rounded-xl border p-4 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="font-medium">User</dt>
      <dd className="text-foreground/70 break-all">{auth.userId}</dd>
      <dt className="font-medium">Tenant</dt>
      <dd className="text-foreground/70 break-all">{auth.tenantId}</dd>
      <dt className="font-medium">Permissions</dt>
      <dd className="text-foreground/70">
        {auth.permissions.length > 0 ? auth.permissions.join(', ') : 'None'}
      </dd>
    </dl>
  );
}
