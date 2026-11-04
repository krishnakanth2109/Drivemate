import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[MongoDB] No MONGO_URI provided in .env. Skipping MongoDB connection.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'drivemate',
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`🍃 [MongoDB Atlas] Connected successfully to database: "${conn.connection.name}"`);
    return conn;
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Connection failed:', error.message);
    return null;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ [MongoDB Atlas] Disconnected from MongoDB cluster.');
});

export { mongoose };
export default connectMongoDB;

