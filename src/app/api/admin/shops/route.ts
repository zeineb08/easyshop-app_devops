import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Shop from '@/lib/models/shop';
import { requireAdmin, isNextResponse } from '@/lib/auth/adminGuard';

// GET /api/admin/shops  — list all shops
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  await dbConnect();
  const shops = await Shop.find().sort({ order: 1, createdAt: 1 });
  return NextResponse.json({ shops });
}

// POST /api/admin/shops  — create a shop
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (isNextResponse(guard)) return guard;

  try {
    await dbConnect();
    const body = await request.json();
    const { slug, title, icon, order } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: 'slug and title are required' }, { status: 400 });
    }

    const shop = await Shop.create({ slug, title, icon: icon ?? '', order: order ?? 0 });
    return NextResponse.json({ shop }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isDuplicate = message.includes('E11000');
    return NextResponse.json(
      { error: isDuplicate ? 'A shop with that slug already exists' : message },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
