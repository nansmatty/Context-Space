import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI!);
		logger.info(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		logger.error(`Error: ${error}`);
		process.exit(1);
	}
};
