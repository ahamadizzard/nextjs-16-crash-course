import mongoose, { Connection } from 'mongoose';

/**
 * Global interface to extend the global object with our mongoose connection cache
 */
interface GlobalWithMongoose {
  mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

/**
 * Declare the global variable with our custom interface
 * This prevents TypeScript errors when accessing global.mongoose
 */
declare const global: GlobalWithMongoose;

/**
 * MongoDB connection URI from environment variables
 * Make sure to set MONGODB_URI in your .env.local file
 */
const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global cache for the mongoose connection
 * This prevents multiple connections during development hot reloads
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * @returns Promise<Connection> - The mongoose connection object
 */
async function connectToDatabase(): Promise<Connection> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection exists but a promise is pending, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Create new connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ Connected to MongoDB');
        return mongoose.connection;
      })
      .catch((error) => {
        console.error('❌ Error connecting to MongoDB:', error);
        // Reset the promise so we can try again
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Wait for the connection to be established
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset both promise and connection on error
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

export default connectToDatabase;