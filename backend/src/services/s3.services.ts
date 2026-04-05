import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { AppError } from '../utils/global-error-handler';
import path from 'path';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const uploadToS3 = async (file: Buffer, originalName: string, contentType: string) => {
	try {
		const ext = path.extname(originalName);
		const baseName = path.basename(originalName, ext).replace(/\s+/g, '-');
		const uniqueKey = `upload/${baseName}-${randomUUID()}${ext}`;

		const params = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME!,
			Key: uniqueKey,
			Body: file,
			ContentType: contentType,
		});

		await s3.send(params);

		logger.info(`File uploaded successfully to S3 with key: ${uniqueKey}`);

		return { key: uniqueKey, url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}` };
	} catch (error: any) {
		logger.error(`Error uploading file to S3`, {
			error: error.message,
			originalName,
		});
		throw new AppError('Failed to upload file to S3', 500);
	}
};
