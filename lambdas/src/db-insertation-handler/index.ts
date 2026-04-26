import { DbInsertionPayload } from '../utils/shared_types';

import type { SQSEvent, SQSRecord } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
	console.log(`Received ${event.Records.length} SQS records`);

	for (const record of event.Records) {
		const message = parseSqsRecord(record) as DbInsertionPayload;

		console.log('Received message for DB insertion:', {
			document_id: message.payload.document_id,
			workspace_id: message.payload.workspace_id,
			chunk_index: message.payload.chunk_index,
			text: message.payload.text,
			embedding_length: message.embedding.length,
		});
	}
};

function parseSqsRecord(record: SQSRecord) {
	try {
		return JSON.parse(record.body);
	} catch (error) {
		console.error('Failed to parse SQS record body', {
			messageId: record.messageId,
			body: record.body,
			error,
		});

		throw error;
	}
}
