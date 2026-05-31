import { NextFunction, Request, Response } from 'express';
import { AppError, asyncHandler } from '../../utils/global-error-handler';
import { uploadToS3 } from '../../services/s3.services';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { getDefaultWorkspaceForUser } from '../../services/membership.service';

export const uploadDocument = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	if (!req.file) {
		throw new AppError('No file uploaded', 400);
	}
	const file = req.file;
	const userId = req.user?.id;

	if (!userId) {
		throw new AppError('User not authenticated', 401);
	}

	const documentId = randomUUID();
	const workspace = await getDefaultWorkspaceForUser(userId);
	const workspaceId = workspace._id.toString();
	const uploadData = await uploadToS3(file.buffer, file.originalname, file.mimetype, documentId, workspaceId);

	logger.info('Document uploaded successfully', {
		documentId,
		fileName: file.originalname,
		requestId: req.requestId,
	});

	res.status(200).json({
		success: true,
		uploadData: uploadData.url,
		key: uploadData.key,
	});
});

export const askQuestion = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
	const { question, user_id, workspace_id } = req.body;

	if (!question || !user_id || !workspace_id) {
		throw new AppError('Missing required fields', 400);
	}

	if (!env.ASK_API_GATEWAY_URL) {
		throw new AppError('ASK_API_GATEWAY_URL not configured', 500);
	}

	const response = await fetch(env.ASK_API_GATEWAY_URL!, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			question,
			user_id,
			workspace_id,
		}),
	});

	// Check if response is ok
	if (!response.ok) {
		const errorText = await response.text();
		logger.error('External API error', {
			status: response.status,
			statusText: response.statusText,
			error: errorText,
			requestId: req.requestId,
		});
		throw new AppError(`External API returned error: ${response.statusText}`, response.status);
	}

	const data = await response.json();

	logger.info('Question answered successfully', {
		user_id,
		workspace_id,
		requestId: req.requestId,
	});

	res.status(200).json(data);
});
