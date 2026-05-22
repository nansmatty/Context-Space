// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

	PORT: z.coerce.number().default(5241),

	MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

	AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
	AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
	AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
	S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),

	ASK_API_GATEWAY_URL: z.url('ASK_API_GATEWAY_URL must be a valid URL'),
	CLIENT_URL: z.url('CLIENT_URL must be a valid URL'),

	JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
	JWT_EXPIRES_IN: z.string().min(1, 'JWT_EXPIRES_IN is required'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error('❌ Invalid environment variables');

	console.error(
		parsedEnv.error.issues.map((issue) => ({
			path: issue.path.join('.'),
			message: issue.message,
		})),
	);

	process.exit(1);
}

export const env = parsedEnv.data;
