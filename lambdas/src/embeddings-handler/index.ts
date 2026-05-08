import { SQSEvent, SQSRecord } from 'aws-lambda';
import { generateEmbeddings } from '../services/bedrock.service';
import { DbInsertionPayload, EmbeddingsQueueEnvelope } from '../utils/shared_types';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { embeddingsQueueMessageSchema } from '../utils/validation';
const sqs = new SQSClient({});

const queueUrl = process.env.DATABASE_DATA_QUEUE_URL!;
const finalizerQueueUrl = process.env.FINALIZE_QUEUE_URL!;

if (!queueUrl) {
	throw new Error('DATABASE_DATA_QUEUE_URL is missing');
}

if (!finalizerQueueUrl) {
	throw new Error('FINALIZE_QUEUE_URL is missing');
}

export const handler = async (event: SQSEvent) => {
	for (const record of event.Records as SQSRecord[]) {
		const rawBody = JSON.parse(record.body) as EmbeddingsQueueEnvelope;
		let body = embeddingsQueueMessageSchema.parse(rawBody);

		try {
			if (body.type !== 'EMBEDDINGS_REQUEST') {
				console.warn(`Skipping message with unsupported type: ${body.type}`);
				continue;
			}

			const { chunk_index, content } = body.payload;

			if (!Number.isInteger(chunk_index)) {
				throw new Error(`Invalid chunk_index: ${chunk_index}`);
			}

			if (!content?.trim()) {
				throw new Error('Chunk content is empty');
			}

			const embedding = await generateEmbeddings(content);

			const dbPayload: DbInsertionPayload = {
				payload: body.payload,
				embedding: embedding,
			};

			const sendMessageCommand = new SendMessageCommand({
				QueueUrl: queueUrl,
				MessageBody: JSON.stringify(dbPayload),
			});

			await sqs.send(sendMessageCommand);

			console.log('Embedding generated and forwarded to DB queue:', {
				document_id: body.payload.document_id,
				chunk_index: body.payload.chunk_index,
				embedding_length: embedding.length,
			});
		} catch (error) {
			console.error('Error processing SQS message:', error);

			if (body.type === 'EMBEDDINGS_REQUEST') {
				await sendProcessingFailedMessage({
					document_id: body.payload.document_id,
					user_id: body.payload.user_id,
					workspace_id: body.payload.workspace_id,
					stage: 'embeddings',
					error_message: error instanceof Error ? error.message : 'Embeddings generation failed',
				});
			}

			throw error;
		}
	}

	return { success: true };
};

async function sendProcessingFailedMessage(params: {
	document_id: string;
	user_id: string;
	workspace_id: string;
	stage: string;
	error_message: string;
}) {
	await sqs.send(
		new SendMessageCommand({
			QueueUrl: finalizerQueueUrl,
			MessageBody: JSON.stringify({
				type: 'DOCUMENT_PROCESSING_FAILED',
				payload: params,
			}),
		}),
	);
}
