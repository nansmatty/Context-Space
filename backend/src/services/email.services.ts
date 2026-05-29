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

export const sendOtpEmail = async (to: string, otp: string) => {
	return sendEmail(
		to,
		'Verify your ContextSpace account',
		`
			<h2>Verify your ContextSpace account</h2>
			<p>Your OTP is:</p>
			<h1>${otp}</h1>
			<p>This OTP expires in 5 minutes.</p>
		`,
	);
};
