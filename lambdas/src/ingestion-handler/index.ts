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

		const parserService = new ParserService();

		switch (extension) {
			case 'pdf':
				console.log('Starting PDF extraction');
				const extractionStart = Date.now();
				extractedText = await parserService.extractTextFromPDF(streamedText);
				console.log('PDF extraction completed', {
					durationMs: Date.now() - extractionStart,
					extractedLength: extractedText.length,
				});
				break;
			case 'txt':
				console.log('Starting TXT extraction');
				const extractionTextStart = Date.now();
				extractedText = await parserService.extractTextFromBuffer(streamedText);
				console.log('TXT extraction completed', {
					durationMs: Date.now() - extractionTextStart,
					extractedLength: extractedText.length,
				});
				break;
			default:
				throw new Error(`Unsupported file type: ${extension}`);
		}

		const chunks = chunkText(extractedText);

		console.log('Text chunking completed');

		console.log({
			fileName: key,
			extension,
			extractedLength: extractedText.length,
			chunkCount: chunks.length,
			bufferSizeBytes: streamedText.length,
			bufferSizeKB: Math.round(streamedText.length / 1024),
		});

		return {
			success: true,
		};
	} catch (error) {
		console.error('Error processing S3 event:', error);
		throw error;
	}
};
