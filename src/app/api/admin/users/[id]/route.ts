import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/users/[id]
export async function GET(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const { id } = await params;
  const user = await User.findById(id).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/admin/users/[id]  — edit name, email, role, isActive
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    const body = await request.json();

    // Whitelist: only these fields may be updated via this endpoint
    const allowed = ['name', 'email', 'role', 'isActive'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
