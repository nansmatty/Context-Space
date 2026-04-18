export interface EmbeddingsQueueMessage {
	document_id: string;
	workspace_id: string;
	user_id: string;
	chunk_index: number;
	total_chunks: number;
	text: string;
	s3_key: string;
	file_type: string;
}

export interface EmbeddingsQueueEnvelope {
	type: 'EMBEDDINGS_REQUEST';
	payload: EmbeddingsQueueMessage;
}

export interface DbInsertionPayload {
	payload: EmbeddingsQueueMessage;
	embedding: number[];
}
