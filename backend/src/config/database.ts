import mongoose from 'mongoose';
import { MONGODB_URI } from './constants';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.VITEST_WORKER_ID;
    if (!isTestEnv) {
      process.exit(1);
    }
    throw error;
  }
};
