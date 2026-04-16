export interface EmbeddingsQueueMessage {
	document_id: string;
	user_id: string;
	chunk_index: string;
	total_chunks: string;
	text: string;
	s3_key: string;
	file_type: string;
}

export interface EmbeddingsQueueEnvelope {
	type: 'EMBEDDINGS_REQUEST';
	payload: EmbeddingsQueueMessage;
}
