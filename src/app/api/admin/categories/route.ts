import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/lib/models/category';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

// GET /api/admin/categories?shopSlug=xxx
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const shopSlug = new URL(request.url).searchParams.get('shopSlug') ?? '';
  const filter = shopSlug ? { shopSlug } : {};
  const categories = await Category.find(filter)
    .sort({ order: 1 })
    .lean();
  return NextResponse.json({ categories });
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();
    const body = await request.json();
    const { shopSlug, name, slug, parent, order, icon } = body;

    if (!shopSlug || !name || !slug) {
      return NextResponse.json(
        { error: 'shopSlug, name and slug are required' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      shopSlug,
      name,
      slug,
      parent: parent ?? null,
      order: order ?? 0,
      icon: icon ?? '',
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isDuplicate = message.includes('E11000');
    return NextResponse.json(
      { error: isDuplicate ? 'Category slug already exists in this shop' : message },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
