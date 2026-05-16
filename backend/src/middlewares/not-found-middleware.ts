import { Request, Response } from 'express';
import { AppError } from '../utils/global-error-handler';

export const notFoundHandler = (req: Request, res: Response) => {
	throw new AppError(`Route ${req.originalUrl} not found`, 404);
};
