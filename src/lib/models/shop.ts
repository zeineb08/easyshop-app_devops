import mongoose from 'mongoose';

export interface IShop {
  slug: string;         // e.g. "bakery" — matches the URL segment and layoutSettings key
  title: string;        // e.g. "Bakery Shop"
  icon: string;         // public path e.g. "/icons/bakery.png"
  order: number;        // display sort order
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new mongoose.Schema<IShop>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Shop ||
  mongoose.model<IShop>('Shop', shopSchema);
