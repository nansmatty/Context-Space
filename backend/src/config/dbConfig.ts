import mongoose, { mongo } from 'mongoose';
import { logger } from '../utils/logger';

const MONGO_OPTIONS = {
	maxPoolSize: 10,
	minPoolSize: 5,
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
	connectTimeoutMS: 10000,
	family: 4,
	retryWrites: true,
	retryReads: true,
	autoIndex: process.env.NODE_ENV !== 'production',
};

export const connectDB = async () => {
	try {
		if (!process.env.MONGO_URI) {
			throw new Error('MONGO_URI is not defined in environment variables');
		}
		const conn = await mongoose.connect(process.env.MONGO_URI!, MONGO_OPTIONS);
		logger.info(`MongoDB Connected: ${conn.connection.host}`);
		logger.info(`Database: ${conn.connection.name}`);

		mongoose.connection.on('connected', () => {
			logger.info('MongoDB connection established');
		});

		mongoose.connection.on('error', (err) => {
			logger.error(`MongoDB connection error: ${err}`);
		});

		mongoose.connection.on('disconnected', () => {
			logger.warn('MongoDB connection lost');
		});

		// Graceful shutdown handler
		process.on('SIGINT', async () => {
			await mongoose.connection.close();
			logger.info('MongoDB connection closed due to app termination');
			process.exit(0);
		});

		return conn;
	} catch (error) {
		logger.error(`MongoDB connection failed: ${error}`);
		setTimeout(() => process.exit(1), 1000);
	}
};

export const checkDBHealth = async (): Promise<boolean> => {
	try {
		await mongoose.connection.db.admin().ping();
		return true;
	} catch (error) {
		logger.error('Database health check failed:', error);
		return false;
	}
};
