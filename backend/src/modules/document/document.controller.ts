import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/global-error-handler';
import { uploadToS3 } from '../../services/s3.services';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		const file = req.file;

		const uploadData = await uploadToS3(file.buffer, file.originalname, file.mimetype);

		res.status(200).json({
			success: true,
			uploadData: uploadData.url,
			key: uploadData.key,
		});
	} catch (error) {
		next(error);
	}
};
