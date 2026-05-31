import { NextFunction, Request, Response } from 'express';
import { asyncHandler, AppError } from '../../utils/global-error-handler';
import { logger } from '../../utils/logger';
import { loginSchema, registerSchema, resendOtpSchema, verifyOtpSchema } from '../../validations/auth.validation';
import { UserModel } from '../../models/user.model';
import { compareData, hashData } from '../../services/auth.services';
import { generateAccessToken, otpGeneration, setAuthCookie } from '../../utils/auth.utils';
import { env } from '../../config/env';
import { sendOtpEmail } from '../../services/email.services';
import { WorkspaceModel } from '../../models/workspace.model';
import { MembershipModel } from '../../models/membership.model';
import mongoose from 'mongoose';

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

	await sendOtpEmail(email, otp);

	res.status(201).json({ success: true, email, message: 'User registered successfully. OTP has been sent to your email.' });
});

export const verifyOTPController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const validatedData = verifyOtpSchema.parse(req.body);
	logger.info('OTP verification data validated', { email: validatedData.email, requestId: req.requestId });
	const { email, otp } = validatedData;
	const currentTime = new Date();

	// Session declaration for transaction management during OTP verification to ensure data consistency and integrity
	const session = await mongoose.startSession();

	try {
		// Start a transaction to ensure atomicity of the OTP verification process

		session.startTransaction();
		const user = await UserModel.findOne({
			email,
		}).select('+emailVerificationOtpHash');

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
		await user.save({ session });

		const [workspace] = await WorkspaceModel.create(
			[
				{
					name: `${user.name}'s Personal Workspace`,
					ownerId: user._id,
					workspaceType: 'personal',
				},
			],
			{ session },
		);

		await MembershipModel.create(
			[
				{
					userId: user._id,
					workspaceId: workspace._id,
					role: 'owner',
					status: 'active',
				},
			],
			{ session },
		);

		await session.commitTransaction();

		logger.info('Email verified and default workspace created successfully', {
			email,
			userId: user._id.toString(),
			workspaceId: workspace._id.toString(),
			requestId: req.requestId,
		});

		res.status(200).json({ success: true, email, message: 'Email verified successfully. Please login to continue.' });
	} catch (error) {
		await session.abortTransaction();
		logger.error('Error during OTP verification transaction', { email, requestId: req.requestId, error });
		throw new AppError('An error occurred while verifying OTP. Please try again.', 500);
	} finally {
		session.endSession();
	}
});

export const resendOTPController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const validatedData = resendOtpSchema.parse({ email: req.body.email });
	const { email } = validatedData;
	logger.info('Resend OTP request received', { email, requestId: req.requestId });

	const user = await UserModel.findOne({ email });

	if (!user) {
		logger.warn('Resend OTP attempt for non-existent email', { email, requestId: req.requestId });
		throw new AppError('Email not found', 404);
	}

	if (user.isEmailVerified) {
		logger.warn('Resend OTP attempt for already verified email', { email, requestId: req.requestId });
		throw new AppError('Email is already verified', 400);
	}

	const otp = otpGeneration();
	const otpHash = await hashData(otp);

	user.emailVerificationOtpHash = otpHash;
	user.emailVerificationOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
	await user.save();
	logger.info('New OTP generated and saved successfully', { email, requestId: req.requestId });

	await sendOtpEmail(email, otp);

	res.status(200).json({ success: true, email, message: 'A new OTP has been sent to your email address' });
});

export const loginController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const validatedData = loginSchema.parse(req.body);
	const { email, password } = validatedData;
	logger.info('Login attempt received', { email, requestId: req.requestId });

	const user = await UserModel.findOne({ email }).select('+passwordHash');

	if (!user) {
		logger.warn('Login attempt with non-existent email', { email, requestId: req.requestId });
		throw new AppError('Invalid email or password', 401);
	}

	if (!user.isEmailVerified) {
		logger.warn('Login attempt with unverified email', { email, requestId: req.requestId });
		throw new AppError('Email is not verified. Please verify your email before logging in.', 403);
	}

	const isPasswordValid = await compareData(password, user.passwordHash);

	if (!isPasswordValid) {
		logger.warn('Login attempt with invalid password', { email, requestId: req.requestId });
		throw new AppError('Invalid email or password', 401);
	}

	const tokenPayload = { userId: user._id.toString(), email: user.email };
	const accessToken = generateAccessToken(tokenPayload);
	setAuthCookie(res, accessToken);
	logger.info('User logged in successfully', { email, requestId: req.requestId });

	res.status(200).json({
		success: true,
		message: 'Logged in successfully',
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			isEmailVerified: user.isEmailVerified,
		},
	});
});

export const logoutController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	res.clearCookie('accessToken', {
		httpOnly: true,
		secure: env.NODE_ENV === 'production',
		sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	});

	res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Temporary endpoint for testing protected routes
export const protectedTestController = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	res.status(200).json({ success: true, message: 'You have accessed a protected route', user: req.user });
});
