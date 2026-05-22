import { z } from 'zod';

export const registerSchema = z.object({
	name: z.string().min(3).max(80).trim(),
	email: z.email().trim().toLowerCase(),
	password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
});

export const loginSchema = z.object({
	email: z.email().trim().toLowerCase(),
	password: z.string().min(1, 'Password is required').max(128),
});
