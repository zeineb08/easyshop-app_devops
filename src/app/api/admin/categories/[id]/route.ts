import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/category';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/categories/[id]
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const allowed = ['name', 'slug', 'parent', 'order', 'icon'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const category = await Category.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ category });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id]
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const { id } = await params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  // Also remove any child categories
  await Category.deleteMany({ parent: id });

  return NextResponse.json({ success: true });
}
