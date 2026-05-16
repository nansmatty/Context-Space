import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { connectDB } from './config/dbConfig';
import { uptime } from 'node:process';

const PORT = process.env.PORT || 5601;

const requiredEnvVars = ['MONGO_URI', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
	logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
	process.exit(1);
}

process.on('uncaughtException', (error: Error) => {
	logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
	process.exit(1);
});

let server: any;

const startServer = async () => {
	try {
		await connectDB();

		app.get('/health', (req, res) => {
			const { checkDBHealth } = require('./config/dbConfig');
			const dbHealth = checkDBHealth();

			res.status(dbHealth ? 200 : 503).json({
				status: dbHealth ? 'healthy' : 'unhealthy',
				timestamp: new Date().toISOString(),
				uptime: uptime(),
				database: dbHealth ? 'connected' : 'disconnected',
			});
		});

		server = app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
			logger.info(`Environment: ${process.env.NODE_ENV}`);
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
