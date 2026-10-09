import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth/utils';

/**
 * Verifies the request carries a valid JWT for a user with role "admin".
 * Returns the payload on success, or a 401/403 Response on failure.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string; role: string } | NextResponse> {
  const auth = await isAuthenticated(request);

  if (!auth) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return auth;
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
