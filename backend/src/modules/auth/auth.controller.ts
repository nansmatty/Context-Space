import { NextFunction, Request, Response } from 'express';
import { asyncHandler, AppError } from '../../utils/global-error-handler';
import { logger } from '../../utils/logger';
import { registerSchema, verifyOtpSchema } from '../../validations/auth.validation';
import { UserModel } from '../../models/user.model';
import { compareData, hashData } from '../../services/auth.services';
import { otpGeneration } from '../../utils/auth.utils';
import { env } from '../../config/env';

export const registerController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const validatedData = registerSchema.parse(req.body);
	logger.info('User registration data validated', { email: validatedData.email, requestId: req.requestId });
	const { name, email, password } = validatedData;

	const userExists = await UserModel.findOne({ email });

	if (userExists) {
		logger.warn('Registration attempt with existing email', { email, requestId: req.requestId });
		throw new AppError('Email is already registered', 400);
	}

	const otp = otpGeneration();
	const otpHash = await hashData(otp);
	const passwordHash = await hashData(password);

	const newUser = new UserModel({
		name,
		email,
		passwordHash,
		emailVerificationOtpHash: otpHash,
		emailVerificationOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
	});
	await newUser.save();
	logger.info('New user registered successfully', { email, requestId: req.requestId });

	res.status(201).json({ success: true, email, message: 'User registered successfully' });
});

export const verifyOTPController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const validatedData = verifyOtpSchema.parse(req.body);
	logger.info('OTP verification data validated', { email: validatedData.email, requestId: req.requestId });
	const { email, otp } = validatedData;

	const currentTime = new Date();

	const user = await UserModel.findOne({
		email,
	}).select('+emailVerificationOtpHash +emailVerificationOtpExpiresAt');

	if (!user) {
		logger.warn('OTP verification attempt for non-existent email', { email, requestId: req.requestId });
		throw new AppError('Invalid email or OTP', 400);
	}

	if (user.isEmailVerified) {
		logger.warn('OTP verification attempt for already verified email', { email, requestId: req.requestId });
		throw new AppError('Email is already verified', 400);
	}

	if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
		logger.warn('OTP verification attempt with missing OTP data', { email, requestId: req.requestId });
		throw new AppError('OTP verification data is missing. Please request a new OTP.', 400);
	}

	if (user.emailVerificationOtpExpiresAt < currentTime) {
		logger.warn('OTP verification attempt with expired OTP', { email, requestId: req.requestId });
		throw new AppError('OTP has expired. Please request a new one.', 400);
	}

	const isOtpValid = await compareData(otp, user.emailVerificationOtpHash);

	if (!isOtpValid) {
		logger.warn('OTP verification attempt with invalid OTP', { email, requestId: req.requestId });
		throw new AppError('Invalid email or OTP', 400);
	}

	user.isEmailVerified = true;
	user.emailVerificationOtpHash = null;
	user.emailVerificationOtpExpiresAt = null;
	await user.save();
	logger.info('Email verified successfully', { email, requestId: req.requestId });

	res.status(200).json({ success: true, email, message: 'Email verified successfully. Please login to continue.' });
});

export const resendOTPController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {});

export const loginController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {});

export const logoutController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	res.clearCookie('accessToken', {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
	});

	res.status(200).json({ success: true, message: 'Logged out successfully' });
});
