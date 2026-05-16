import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.splat(),
	winston.format.json(),
);

const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
		return `${timestamp} [${level}]: ${message} ${metaStr}`;
	}),
);

export const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.Console({
			format: isProduction ? logFormat : consoleFormat,
		}),
	],
});

// Add file transports in production for error and combined logs
if (isProduction) {
	logger.add(
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	);

	logger.add(
		new winston.transports.File({
			filename: 'logs/combined.log',
			maxsize: 5242880, // 5MB
			maxFiles: 5,
		}),
	);
}
