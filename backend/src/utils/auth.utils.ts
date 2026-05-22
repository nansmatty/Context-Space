import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Response } from 'express';

export const generateAccessToken = (payload: Record<string, unknown>) => {
	const secret: Secret = env.JWT_SECRET;
	const options: SignOptions = {
		expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
	};

	return jwt.sign(payload, secret, options);
};

export const otpGeneration = (): string => {
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	return otp;
};

export const setAuthCookie = (res: Response, token: string) => {
	res.cookie('accessToken', token, {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};
