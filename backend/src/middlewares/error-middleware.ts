import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/global-error-handler';
import multer from 'multer';
import { env } from '../config/env';

declare global {
	namespace Express {
		interface Request {
			requestId?: string;
		}
	}
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
	let error = { ...err };
	error.message = err.message;

	const statusCode = err.statusCode || 500;
	const message = err.message || 'Internal Server Error';

	logger.error(`Error occurred`, {
		message,
		statusCode,
		stack: err.stack,
		requestId: req.requestId,
		method: req.method,
		url: req.originalUrl,
		ip: req.ip,
		userAgent: req.get('user-agent'),
	});

	if (err.code === 'CastError' && err.kind === 'ObjectId') {
		const message = `Resource not found with id of ${err.value}`;
		error = new AppError(message, 404);
	}

	if (err.code === 11000) {
		const message = `Duplicate field value entered: ${JSON.stringify(err.keyValue)}`;
		error = new AppError(message, 400);
	}

	if (err.name === 'ValidationError') {
		const errMessages = Object.values(err.errors).map((val: any) => val.message);
		const errorMessage = `Validation error: ${errMessages.join(', ')}`;
		error = new AppError(errorMessage, 400);
	}

	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			error = new AppError('File size exceeds the limit of 10MB', 400);
		} else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			error = new AppError('Unexpected field in file upload', 400);
		} else {
			error = new AppError(err.message, 400);
		}
	}

	// JWT errors (if you add authentication later)
	if (err.name === 'JsonWebTokenError') {
		error = new AppError('Invalid token', 401);
	}

	if (err.name === 'TokenExpiredError') {
		error = new AppError('Token expired', 401);
	}

	const response: any = {
		success: false,
		error: message,
		requestId: req.requestId,
	};

	// Only send stack trace in development
	if (env.NODE_ENV === 'development') {
		response.stack = err.stack;
	}

	// For non-operational errors in production, send generic message
	if (env.NODE_ENV === 'production' && !error.isOperational) {
		response.error = 'Something went wrong';
	}

	res.status(statusCode).json(response);
};
