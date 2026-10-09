import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Shop from '@/lib/models/shop';
import Category from '@/lib/models/category';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/admin/shops/[slug]
export async function GET(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const { slug } = await params;
  const shop = await Shop.findOne({ slug });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const categories = await Category.find({ shopSlug: slug })
    .sort({ order: 1 })
    .lean();

  return NextResponse.json({ shop, categories });
}

// PATCH /api/admin/shops/[slug]
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();
    const { slug } = await params;
    const body = await request.json();

    const allowed = ['title', 'icon', 'order', 'isActive', 'slug'] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const shop = await Shop.findOneAndUpdate({ slug }, update, {
      new: true,
      runValidators: true,
    });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    return NextResponse.json({ shop });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/shops/[slug]
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const { slug } = await params;
  const shop = await Shop.findOneAndDelete({ slug });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // cascade-delete all categories for this shop
  await Category.deleteMany({ shopSlug: slug });

  return NextResponse.json({ success: true });
}
