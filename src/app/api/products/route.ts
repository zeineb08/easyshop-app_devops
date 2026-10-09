import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/lib/models/product';
import { requireAuth } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query: any = {};
    
    // Search by title or description
    const searchVal = searchParams.get('search') || searchParams.get('q');
    if (searchVal && searchVal.trim()) {
      const searchRegex = new RegExp(searchVal.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Filter by shop category
    const shopCategory = searchParams.get('shop_category');
    if (shopCategory && shopCategory.trim()) {
      query.shop_category = decodeURIComponent(shopCategory.trim());
    }
    
    // Filter by categories
    const categoriesParam = searchParams.get('categories');
    if (categoriesParam && categoriesParam.trim()) {
      const categories = categoriesParam.split(',').map((c) => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        query.categories = { $in: categories };
      }
    }

    // Filter by price range
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if ((minPrice && !isNaN(parseFloat(minPrice))) || (maxPrice && !isNaN(parseFloat(maxPrice)))) {
      query.price = {};
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting
    let sort: any = { createdAt: -1 };
    const sortParam = searchParams.get('sort');
    if (sortParam && sortParam.trim()) {
      const [field, order] = sortParam.trim().split(':');
      if (field) {
        sort = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const product = await Product.create(body);

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
