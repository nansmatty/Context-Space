import 'dotenv/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
	try {
		const record = event.Records[0];

		const bucket = record.s3.bucket.name;
		const key = decodeURIComponent(record.s3.object.key);

		console.log('Bucket:', bucket);
		console.log('Key:', key);

		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const response = await s3Client.send(command);

		console.log('File fetched from S3');

		const body = await streamToString(response.Body);

		console.log('File content preview:', { preview: body.slice(0, 200), length: body.length });

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error processing S3 event:', error);
		throw error;
	}
};

const streamToString = async (stream: any): Promise<string> => {
	return await new Promise((resolve, reject) => {
		const chunks: any[] = [];
		stream.on('data', (chunk: any) => chunks.push(chunk));
		stream.on('error', (err: any) => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
	});
};
