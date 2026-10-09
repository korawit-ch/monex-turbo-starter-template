import type { NextRequest } from 'next/server';

import { proxyProtectedRequest } from '../../../../lib/auth/bff';

type RouteContext = { params: Promise<{ id: string }> };

function validId(id: string): boolean {
  return /^\d+$/.test(id);
}

async function proxy(
  request: NextRequest,
  context: RouteContext,
  permission: 'link.read' | 'link.update' | 'link.delete',
) {
  const { id } = await context.params;
  if (!validId(id))
    return Response.json({ message: 'Invalid link ID' }, { status: 400 });
  return proxyProtectedRequest(request, `/links/${id}`, permission);
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'link.read');
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'link.update');
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context, 'link.delete');
}
