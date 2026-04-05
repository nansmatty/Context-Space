import 'dotenv/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { chunkText, streamToBuffer } from '../utils/ingestion-utils';
import { ParserService } from '../services/parser.service';

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

		const streamedText = await streamToBuffer(response.Body as NodeJS.ReadableStream);

		const extension = key.split('.').pop()?.toLowerCase();

		let extractedText = '';

		switch (extension) {
			case 'pdf':
				extractedText = await new ParserService().parsePDF(streamedText);
				break;
			case 'txt':
				extractedText = await new ParserService().parseText(streamedText);
				break;
			default:
				throw new Error(`Unsupported file type: ${extension}`);
		}

		const chunks = chunkText(extractedText);

		console.log({
			fileName: key,
			extension,
			extractedLength: extractedText.length,
			chunkCount: chunks.length,
		});

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error processing S3 event:', error);
		throw error;
	}
};
