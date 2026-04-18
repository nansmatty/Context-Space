import { generateEmbeddings } from '../services/bedrock.service';
import { DbInsertationPayload, EmbeddingsQueueEnvelope } from '../utils/shared_types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

const queueUrl = process.env.DATABASE_DATA_QUEUE_URL!;
if (!queueUrl) {
	throw new Error('DATABASE_DATA_QUEUE_URL is missing');
}

export const handler = async (event: any) => {
	for (const record of event.Records) {
		try {
			const message = JSON.parse(record.body) as EmbeddingsQueueEnvelope;

			if (message.type !== 'EMBEDDINGS_REQUEST') {
				console.warn(`Skipping message with unsupported type: ${message.type}`);
				continue;
			}

			const { chunk_index, text } = message.payload;

			if (Number.isNaN(chunk_index)) {
				throw new Error(`Invalid chunk_index: ${chunk_index}`);
			}

			const embedding = await generateEmbeddings(text);

			const dbPayload: DbInsertationPayload = {
				payload: message.payload,
				embedding: embedding,
			};

			const sendMessageCommand = new SendMessageCommand({
				QueueUrl: queueUrl,
				MessageBody: JSON.stringify(dbPayload),
			});

			await sqs.send(sendMessageCommand);

			return { success: true };
		} catch (error) {
			console.error('Error processing SQS message:', error);
			throw error;
		}
	}
};
