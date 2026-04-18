import { DbInsertionPayload } from '../utils/shared_types';

export const handler = async (event: any) => {
	try {
		for (const record of event.Records) {
			const message = JSON.parse(record.body) as DbInsertionPayload;

			console.log('Received message for DB insertion:', {
				document_id: message.payload.document_id,
				workspace_id: message.payload.workspace_id,
				chunk_index: message.payload.chunk_index,
				text: message.payload.text,
				embedding_length: message.embedding.length,
			});
		}

		return { success: true };
	} catch (error) {
		console.error('Error processing event:', error);
		throw error;
	}
};
