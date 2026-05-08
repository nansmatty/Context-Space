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

export type FinalizerMessage =
	| {
			type: 'DOCUMENT_FINALIZE_CHECK';
			payload: {
				document_id: string;
				user_id: string;
				workspace_id: string;
				chunk_count: number;
			};
	  }
	| {
			type: 'DOCUMENT_PROCESSING_FAILED';
			payload: {
				document_id: string;
				user_id: string;
				workspace_id: string;
				stage: string;
				error_message: string;
			};
	  };

export interface EmbeddingsQueueEnvelope {
	type: 'EMBEDDINGS_REQUEST';
	payload: EmbeddingsQueueMessage;
}

export interface DbInsertionPayload {
	payload: EmbeddingsQueueMessage;
	embedding: number[];
}

export interface AskRequestBody {
	question?: string;
	workspace_id?: string;
	user_id?: string;
}
