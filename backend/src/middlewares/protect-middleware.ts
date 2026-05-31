import { NextFunction, Request, Response } from 'express';
import { AppError, asyncHandler } from '../utils/global-error-handler';
import { env } from '../config/env';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
	const token = req.cookies?.accessToken;

	if (!token) {
		throw new AppError('Authentication required', 401);
	}

	const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
	const userId = decoded.userId;

	if (!userId) {
		throw new AppError('Invalid token payload', 401);
	}

	const user = await UserModel.findById(userId);

	if (!user) {
		throw new AppError('User no longer exists.', 404);
	}

	if (!user.isEmailVerified) {
		throw new AppError('Email not verified. Please verify your email to access this resource.', 403);
	}

	req.user = {
		id: user._id.toString(),
		email: user.email,
		name: user.name,
	};

	next();
});
