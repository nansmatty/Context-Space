import { SQSEvent, SQSRecord } from 'aws-lambda';
import { generateEmbeddings } from '../services/bedrock.service';
import { DbInsertionPayload, EmbeddingsQueueEnvelope } from '../utils/shared_types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

const queueUrl = process.env.DATABASE_DATA_QUEUE_URL!;
if (!queueUrl) {
	throw new Error('DATABASE_DATA_QUEUE_URL is missing');
}

export const handler = async (event: SQSEvent) => {
	for (const record of event.Records as SQSRecord[]) {
		try {
			const message = JSON.parse(record.body) as EmbeddingsQueueEnvelope;

			if (message.type !== 'EMBEDDINGS_REQUEST') {
				console.warn(`Skipping message with unsupported type: ${message.type}`);
				continue;
			}

			const { chunk_index, text } = message.payload;

			if (!Number.isInteger(chunk_index)) {
				throw new Error(`Invalid chunk_index: ${chunk_index}`);
			}

			if (!text?.trim()) {
				throw new Error('Chunk text is empty');
			}

			const embedding = await generateEmbeddings(text);

			const dbPayload: DbInsertionPayload = {
				payload: message.payload,
				embedding: embedding,
			};

			const sendMessageCommand = new SendMessageCommand({
				QueueUrl: queueUrl,
				MessageBody: JSON.stringify(dbPayload),
			});

			await sqs.send(sendMessageCommand);

			console.log('Embedding generated and forwarded to DB queue:', {
				document_id: message.payload.document_id,
				chunk_index: message.payload.chunk_index,
				embedding_length: embedding.length,
			});
		} catch (error) {
			console.error('Error processing SQS message:', error);
			throw error;
		}
	}

	return { success: true };
};
