import { Request, Response } from 'express';
import { AppError } from '../utils/global-error-handler';

declare global {
	namespace Express {
		interface Request {
			requestId?: string;
		}
	}
}

export const notFoundHandler = (req: Request, res: Response) => {
	throw new AppError(`Route ${req.originalUrl} not found`, 404);
};
