import mongoose from 'mongoose';

export interface ICategory {
  shopSlug: string;     // matches Shop.slug
  name: string;
  slug: string;         // URL-safe slug used in product.categories[] field
  parent: mongoose.Types.ObjectId | null; // null = top-level category
  order: number;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    shopSlug: {
      type: String,
      required: [true, 'shopSlug is required'],
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// compound uniqueness: same shop can't have duplicate slugs
categorySchema.index({ shopSlug: 1, slug: 1 }, { unique: true });

export default mongoose.models.Category ||
  mongoose.model<ICategory>('Category', categorySchema);
