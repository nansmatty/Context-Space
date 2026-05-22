import { InferSchemaType, model, Schema } from 'mongoose';

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minLength: 3,
			maxLength: 80,
		},

		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			index: true,
		},

		passwordHash: {
			type: String,
			required: true,
			select: false, // Don't return password hash by default
		},

		isEmailVerified: {
			type: Boolean,
			default: false,
		},

		emailVerificationOtpHash: {
			type: String,
			select: false,
			default: null,
		},

		emailVerificationOtpExpiresAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model<User>('User', userSchema, 'users');
