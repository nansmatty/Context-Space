import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { AppError } from '../utils/global-error-handler';
import path from 'path';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const uploadToS3 = async (file: Buffer, originalName: string, contentType: string, documentId: string) => {
	try {
		const ext = path.extname(originalName);
		const baseName = path
			.basename(originalName, ext)
			.replace(/[^a-zA-Z0-9-_]/g, '-')
			.replace(/-+/g, '-')
			.toLowerCase();

		const uniqueKey = `upload/${documentId}/${baseName}${ext}`;

		const params = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME!,
			Key: uniqueKey,
			Body: file,
			ContentType: contentType,
			Metadata: {
				originalname: originalName,
				documentid: documentId,
			},
		});

		await s3.send(params);

		logger.info(`File uploaded successfully to S3 with key: ${uniqueKey}`);

		return { key: uniqueKey, url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`, documentId };
	} catch (error: any) {
		logger.error(`Error uploading file to S3`, {
			error: error.message,
			originalName,
			documentId,
		});
		throw new AppError('Failed to upload file to S3', 500);
	}
};
