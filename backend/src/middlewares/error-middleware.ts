import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
	const statusCode = err.statusCode || 500;

	logger.error(err.message, { stack: err.stack });
	const message = err.message || 'Internal Server Error';

	res.status(statusCode).json({
		success: false,
		error: message,
	});
};
