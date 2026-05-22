import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { connectDB } from './config/dbConfig';
import { env } from './config/env';

const PORT = env.PORT || 5241;

process.on('uncaughtException', (error: Error) => {
	logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
	process.exit(1);
});

let server: any;

const startServer = async () => {
	try {
		await connectDB();

		server = app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
			logger.info(`Environment: ${env.NODE_ENV}`);
		});

		// Handle unhandled promise rejections
		process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
			logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
				reason: reason.message || reason,
				stack: reason.stack,
			});

			server.close(() => {
				process.exit(1);
			});
		});

		// Graceful shutdown on SIGTERM
		process.on('SIGTERM', () => {
			logger.info('SIGTERM received. Shutting down gracefully...');
			server.close(() => {
				logger.info('Process terminated!');
			});
		});
	} catch (error) {
		logger.error('Failed to start server', error);
		process.exit(1);
	}
};

startServer();
