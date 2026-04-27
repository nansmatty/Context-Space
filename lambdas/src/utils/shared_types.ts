export interface EmbeddingsQueueMessage {
	document_id: string;
	workspace_id: string;
	user_id: string;
	chunk_index: number;
	chunk_count: number;
	content: string;
	s3_key: string;
	mime_type: string;
	file_name: string;
	file_size: number;
}

export interface EmbeddingsQueueEnvelope {
	type: 'EMBEDDINGS_REQUEST';
	payload: EmbeddingsQueueMessage;
}

export interface DbInsertionPayload {
	payload: EmbeddingsQueueMessage;
	embedding: number[];
}
