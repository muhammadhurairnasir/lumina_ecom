import mongoose from 'mongoose';
import logger from '../utils/logger';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI as string, { serverSelectionTimeoutMS: 2000 });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
      logger.error(`MongoDB connection to ${process.env.MONGO_URI} failed: ${error.message}`);
      logger.info('Attempting to start fallback in-memory MongoDB server...');
      
      try {
        const mongoServer = await MongoMemoryServer.create({
          binary: {
            version: '7.0.14',
            downloadDir: './mongo-bin'
          }
        });
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        logger.info(`Fallback InMemory MongoDB Connected: ${mongoUri}`);
      } catch (fallbackError: any) {
        logger.error(`Fatal: Fallback MongoDB also failed: ${fallbackError.message}`);
        process.exit(1);
      }
    }
  };

  await connectWithRetry();

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed. Exiting process.');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectDB;
