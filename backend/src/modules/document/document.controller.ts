import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/global-error-handler';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from '../../services/s3.services';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		const file = req.file;
		const key = `uploads/${uuidv4()}-${file.originalname}`;

		const fileUrl = await uploadToS3(file.buffer, key, file.mimetype);

		res.status(200).json({
			success: true,
			fileUrl,
			key,
		});
	} catch (error) {
		next(error);
	}
};
