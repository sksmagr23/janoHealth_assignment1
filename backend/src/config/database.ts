import mongoose from 'mongoose';
import { MONGODB_URI } from './constants';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
