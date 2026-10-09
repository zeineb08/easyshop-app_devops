import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/easyshop';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached: MongooseCache = (global.mongoose as MongooseCache) || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .catch(async (err) => {
        // If easyshop-mongodb fails to resolve on local development host, fallback to localhost
        if (
          MONGODB_URI.includes('easyshop-mongodb') &&
          (err?.code === 'ENOTFOUND' || err?.message?.includes('ENOTFOUND'))
        ) {
          console.warn('easyshop-mongodb host not found, falling back to localhost:27017');
          return mongoose.connect('mongodb://localhost:27017/easyshop', opts);
        }
        throw err;
      })
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
