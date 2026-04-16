export interface EmbeddingsQueueMessage {
	documentId: string;
	userId: string;
	chunkIndex: string;
	totalChunks: string;
	text: string;
}
