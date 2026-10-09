import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

// GET /api/admin/users  — list all users (no password)
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const role = searchParams.get('role') ?? '';
    const status = searchParams.get('status') ?? ''; // 'active' | 'inactive'

    const filter: Record<string, unknown> = {};
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    if (role === 'admin' || role === 'user') filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
