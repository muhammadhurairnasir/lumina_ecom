import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (retries = 5): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI environment variable is not set');
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (error: any) {
    if (retries > 0) {
      logger.warn(`MongoDB connection failed. Retrying... (${retries} attempts left): ${error.message}`);
      await new Promise((res) => setTimeout(res, 3000));
      return connectDB(retries - 1);
    }
    logger.error('MongoDB connection failed after all retries:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

process.on('SIGINT',  () => mongoose.connection.close().then(() => { logger.info('MongoDB closed on SIGINT');  process.exit(0); }));
process.on('SIGTERM', () => mongoose.connection.close().then(() => { logger.info('MongoDB closed on SIGTERM'); process.exit(0); }));

export default connectDB;
