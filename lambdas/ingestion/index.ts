import 'dotenv/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { chunkText, streamToString } from '../utils/ingestion-utils';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
	try {
		const record = event.Records[0];

		const bucket = record.s3.bucket.name;
		const key = decodeURIComponent(record.s3.object.key);

		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const response = await s3Client.send(command);

		const streamedText = await streamToString(response.Body);

		const chunks = chunkText(streamedText);

		console.log({ chunks });

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error processing S3 event:', error);
		throw error;
	}
};
