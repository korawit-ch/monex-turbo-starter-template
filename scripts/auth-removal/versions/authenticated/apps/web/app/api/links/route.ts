import type { NextRequest } from 'next/server';

import { proxyProtectedRequest } from '../../../lib/auth/bff';

export function GET(request: NextRequest) {
  return proxyProtectedRequest(request, '/links', 'link.read');
}

export function POST(request: NextRequest) {
  return proxyProtectedRequest(request, '/links', 'link.create');
}
