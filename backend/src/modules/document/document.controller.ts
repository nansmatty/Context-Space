import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/global-error-handler';
import { uploadToS3 } from '../../services/s3.services';
import { randomUUID } from 'crypto';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		const file = req.file;

		const documentId = randomUUID();
		const uploadData = await uploadToS3(file.buffer, file.originalname, file.mimetype, documentId);

		res.status(200).json({
			success: true,
			uploadData: uploadData.url,
			key: uploadData.key,
		});
	} catch (error) {
		next(error);
	}
};

export const askQuestion = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { question, user_id, workspace_id } = req.body;

		if (!question || !user_id || !workspace_id) {
			throw new AppError('Missing required fields', 400);
		}

		const response = await fetch(process.env.ASK_API_GATEWAY_URL!, {
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

		const data = await response.json();

		return res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};
