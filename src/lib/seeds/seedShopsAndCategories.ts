/**
 * Seed script: populates Shop and Category collections from the canonical
 * data in the requirements.  Run with:
 *   npx tsx src/lib/seeds/seedShopsAndCategories.ts
 *
 * It is idempotent – safe to re-run; existing documents are left untouched.
 */

import mongoose from 'mongoose';
import dbConnect from '../db';
import Shop, { IShop } from '../models/shop';
import Category, { ICategory } from '../models/category';

// ─── Canonical data ────────────────────────────────────────────────────────────

interface SeedCategory {
  name: string;
  slug: string;
  icon?: string;
  children?: SeedCategory[];
}

interface SeedShop {
  slug: string;
  title: string;
  icon: string;
  order: number;
  categories: SeedCategory[];
}

const SHOPS: SeedShop[] = [
  {
    slug: 'books',
    title: 'Books Shop',
    icon: '/icons/books.png',
    order: 1,
    categories: [
      { name: 'Comic books',     slug: 'comic-books' },
      { name: 'Science Fiction', slug: 'science-fiction' },
      { name: 'Literature',      slug: 'literature' },
      { name: 'Horror Fiction',  slug: 'horror-fiction' },
      { name: 'Novels',          slug: 'novels' },
      { name: 'Romantic Poetry', slug: 'romantic-poetry' },
      { name: 'Thriller',        slug: 'thriller' },
    ],
  },
  {
    slug: 'bakery',
    title: 'Bakery Shop',
    icon: '/icons/bakery.png',
    order: 2,
    categories: [
      { name: 'Juice',         slug: 'juice',        icon: '/bakeryImages/juice.png' },
      { name: 'Coffee',        slug: 'coffee',       icon: '/bakeryImages/coffee.png' },
      { name: 'Cookies',       slug: 'cookies',      icon: '/bakeryImages/cookies.png' },
      { name: 'Rounded Cake',  slug: 'rounded-cake', icon: '/bakeryImages/roundedCake.png' },
      { name: 'Feeter Pies',   slug: 'feeter-pies',  icon: '/bakeryImages/danish.png' },
      { name: 'Pita Bread',    slug: 'pita-bread',   icon: '/bakeryImages/pitabread.png' },
      { name: 'Sliced Cake',   slug: 'sliced-cake',  icon: '/bakeryImages/slicedcake.png' },
      { name: 'Soft Bread',    slug: 'soft-bread',   icon: '/bakeryImages/softbread.png' },
      { name: 'Toast',         slug: 'toast',        icon: '/bakeryImages/toast.png' },
      { name: 'Croissant',     slug: 'croissant',    icon: '/bakeryImages/cross.png' },
    ],
  },
  {
    slug: 'bags',
    title: 'Bags Shop',
    icon: '/icons/bag.png',
    order: 3,
    categories: [
      { name: 'Hand Bags',     slug: 'hand-bags' },
      { name: 'Laptop Bags',   slug: 'laptop-bags' },
      { name: 'Shoulder Bags', slug: 'shoulder-bags' },
      { name: 'Purse',         slug: 'purse' },
      { name: 'Wallet',        slug: 'wallet' },
    ],
  },
  {
    slug: 'clothing',
    title: 'Clothing Shop',
    icon: '/icons/clothing.png',
    order: 4,
    categories: [
      {
        name: 'Women', slug: 'women',
        children: [
          { name: 'Floral', slug: 'floral' },
          { name: 'Tops',   slug: 'tops' },
          { name: 'Skirts', slug: 'skirts' },
        ],
      },
      {
        name: 'Men', slug: 'men',
        children: [
          { name: 'Hoodie',     slug: 'hoodie' },
          { name: 'Jackets',    slug: 'jackets' },
          { name: 'Blazers',    slug: 'blazers' },
          { name: 'Waist Coat', slug: 'waist-coat' },
          {
            name: 'Pants', slug: 'pants',
            children: [
              { name: 'Jeans',  slug: 'jeans' },
              { name: 'Chinos', slug: 'chinos' },
              { name: 'Sports', slug: 'sports' },
            ],
          },
          { name: 'Shirts', slug: 'shirts' },
        ],
      },
    ],
  },
  {
    slug: 'furniture',
    title: 'Furnitures Shop',
    icon: '/icons/furniture.png',
    order: 5,
    categories: [
      { name: 'Beds',   slug: 'beds',   icon: '/icons/bed.png' },
      { name: 'Tables', slug: 'tables', icon: '/icons/tables.png' },
      { name: 'Sofa',   slug: 'sofa',   icon: '/icons/sofa.png' },
      { name: 'Chairs', slug: 'chairs', icon: '/icons/chairs.png' },
    ],
  },
  {
    slug: 'gadgets',
    title: 'Gadgets Shop',
    icon: '/icons/gadgets.png',
    order: 6,
    categories: [],
  },
  {
    slug: 'grocery',
    title: 'Grocery Shop',
    icon: '/icons/grocery.png',
    order: 7,
    categories: [
      {
        name: 'Fruits & Vegetables', slug: 'fruits-and-vegetables',
        children: [
          { name: 'Fruits',     slug: 'fruits' },
          { name: 'Vegetables', slug: 'vegetables' },
        ],
      },
      {
        name: 'Dairy & Eggs', slug: 'dairy-and-eggs',
        children: [
          { name: 'Milk',   slug: 'milk' },
          { name: 'Butter', slug: 'butter' },
          { name: 'Eggs',   slug: 'eggs' },
        ],
      },
      {
        name: 'Meat & Fish', slug: 'meat-and-fish',
        children: [
          { name: 'Meat', slug: 'meat' },
          { name: 'Fish', slug: 'fish' },
        ],
      },
      {
        name: 'Snacks', slug: 'snacks',
        children: [
          { name: 'Nuts & Biscuits', slug: 'nuts-and-biscuits' },
          { name: 'Chocolates',      slug: 'chocolates' },
          { name: 'Crisps',         slug: 'crisps' },
        ],
      },
      {
        name: 'Noodles & Pasta', slug: 'noodles-and-pasta',
        children: [
          { name: 'Sauce', slug: 'sauce' },
          { name: 'Soup',  slug: 'soup' },
        ],
      },
    ],
  },
  {
    slug: 'makeup',
    title: 'Makeup Shop',
    icon: '/icons/makeup.png',
    order: 8,
    categories: [],
  },
  {
    slug: 'medicine',
    title: 'Medicine Shop',
    icon: '/icons/medicine.png',
    order: 9,
    categories: [],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function upsertCategory(
  shopSlug: string,
  cat: SeedCategory,
  parentId: mongoose.Types.ObjectId | null,
  order: number
): Promise<mongoose.Types.ObjectId> {
  const doc = await Category.findOneAndUpdate(
    { shopSlug, slug: cat.slug },
    {
      $setOnInsert: {
        shopSlug,
        name: cat.name,
        slug: cat.slug,
        parent: parentId,
        order,
        icon: cat.icon ?? '',
      },
    },
    { upsert: true, new: true }
  );
  return doc._id as mongoose.Types.ObjectId;
}

async function seedCategories(
  shopSlug: string,
  cats: SeedCategory[],
  parentId: mongoose.Types.ObjectId | null = null
) {
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const id = await upsertCategory(shopSlug, cat, parentId, i);
    if (cat.children?.length) {
      await seedCategories(shopSlug, cat.children, id);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await dbConnect();
  console.log('🔗 Connected to MongoDB');

  for (const shop of SHOPS) {
    await Shop.findOneAndUpdate(
      { slug: shop.slug },
      { $setOnInsert: { slug: shop.slug, title: shop.title, icon: shop.icon, order: shop.order } },
      { upsert: true, new: true }
    );
    console.log(`✅ Shop: ${shop.title}`);

    if (shop.categories.length) {
      await seedCategories(shop.slug, shop.categories);
      console.log(`   ↳ Seeded ${shop.categories.length} top-level categories`);
    }
  }

  console.log('🎉 Seed complete');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
