import { EMAIL_FROM, resend } from '../config/emailConfig';
import { logger } from '../utils/logger';

export const sendEmail = async (to: string, subject: string, html: string) => {
	const response = await resend.emails.send({
		from: EMAIL_FROM,
		to,
		subject,
		html,
	});

	logger.info('Email sent successfully', { to, subject });
	return response;
};
