import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';
import { AppError } from '../utils/global-error-handler';

const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const uploadToS3 = async (file: Buffer, key: string, contentType: string) => {
	try {
		const params = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME!,
			Key: key,
			Body: file,
			ContentType: contentType,
		});

		await s3.send(params);

		logger.info(`File uploaded successfully to S3 with key: ${key}`);

		return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
	} catch (error: any) {
		logger.error(`Error uploading file to S3`, {
			error: error.message,
			key,
		});
		throw new AppError('Failed to upload file to S3', 500);
	}
};
