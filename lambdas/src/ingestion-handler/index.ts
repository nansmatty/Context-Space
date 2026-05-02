import 'dotenv/config';
import { GetObjectCommand, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { chunkText, streamToBuffer } from '../utils/ingestion-utils';
import { ParserService } from '../services/parser.service';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { EmbeddingsQueueEnvelope, EmbeddingsQueueMessage } from '../utils/shared_types';
import { extractDocumentIdFromKey } from '../utils/general-utils';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const sqs = new SQSClient({});

const queueUrl = process.env.EMBEDDINGS_QUEUE_URL!;
if (!queueUrl) {
	throw new Error('EMBEDDINGS_QUEUE_URL is missing');
}

export const handler = async (event: any) => {
	try {
		const record = event.Records[0];
		const bucket = record.s3.bucket.name;
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

		// extract the metadata from s3 object
		const headCommand = new HeadObjectCommand({
			Bucket: bucket,
			Key: key,
		});
		const headResponse = await s3Client.send(headCommand);

		const getCommand = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const response = await s3Client.send(getCommand);

		const metadataDocumentId = headResponse.Metadata?.documentid;
		const keyDocumentId = extractDocumentIdFromKey(key);

		const documentId = metadataDocumentId ?? keyDocumentId;

		if (!documentId) {
			throw new Error(`Missing documentId from both metadata and S3 key: ${key}`);
		}

		const streamedText = await streamToBuffer(response.Body as NodeJS.ReadableStream);
		const extension = key.split('.').pop()?.toLowerCase();

		let extractedText = '';
		const parserService = new ParserService();

		switch (extension) {
			case 'pdf':
				extractedText = await parserService.extractTextFromPDF(streamedText);
				break;
			case 'txt':
				extractedText = await parserService.extractTextFromBuffer(streamedText);
				break;
			default:
				throw new Error(`Unsupported file type: ${extension}`);
		}

		const chunks = chunkText(extractedText);

		for (let i = 0; i < chunks.length; i++) {
			const message: EmbeddingsQueueMessage = {
				document_id: documentId,
				user_id: 'unknown', // Placeholder, replace with actual user ID if available
				workspace_id: 'unknown', // Placeholder, replace with actual workspace ID if available
				chunk_index: i,
				chunk_count: chunks.length,
				content: chunks[i],
				s3_key: key,
				mime_type: response.ContentType ?? 'application/octet-stream',
				file_name: key.split('/').pop() ?? 'unknown',
				file_size: streamedText.length,
			};

			const envelope: EmbeddingsQueueEnvelope = {
				type: 'EMBEDDINGS_REQUEST',
				payload: message,
			};

			await sqs.send(
				new SendMessageCommand({
					QueueUrl: queueUrl,
					MessageBody: JSON.stringify(envelope),
				}),
			);
		}

		return {
			success: true,
			message: `Successfully processed ${chunks.length} chunks for document ${key}`,
			documentId: documentId,
			chunksProcessed: chunks.length,
		};
	} catch (error) {
		console.error('Error processing S3 event:', error);
		throw error;
	}
};
