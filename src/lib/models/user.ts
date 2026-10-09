import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isActive: boolean;
  avatar?: string;
  addresses?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { 
    type: String, 
    required: [true, 'Please provide your name'] 
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Don't include password in queries by default
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
  },
  addresses: [{
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

if (mongoose.models.User && !mongoose.models.User.schema.path('isActive')) {
  delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
