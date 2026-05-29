import { Resend } from 'resend';
import { env } from '../config/env';

if (!env.RESEND_API_KEY) {
	throw new Error('Resend API key is not set');
}

export const resend = new Resend(env.RESEND_API_KEY);
export const EMAIL_FROM = 'onboarding@resend.dev';
