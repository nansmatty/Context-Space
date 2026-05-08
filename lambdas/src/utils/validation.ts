import { z } from 'zod';

export const askRequestSchema = z.object({
	question: z.string().min(1, 'Question is required').max(1000, 'Question is too long'),
	workspace_id: z.string().trim().min(1, 'Workspace ID is required'),
	user_id: z.string().trim().min(1, 'User ID is required'),
});

export const finalizerMessageSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('DOCUMENT_FINALIZE_CHECK'),
		payload: z.object({
			document_id: z.uuid(),
			user_id: z.string().trim().min(1, 'User ID is required'),
			workspace_id: z.string().trim().min(1, 'Workspace ID is required'),
			chunk_count: z.number().int().positive('Chunk count must be a positive integer'),
		}),
	}),
	z.object({
		type: z.literal('DOCUMENT_PROCESSING_FAILED'),
		payload: z.object({
			document_id: z.uuid(),
			user_id: z.string().trim().min(1, 'User ID is required'),
			workspace_id: z.string().trim().min(1, 'Workspace ID is required'),
			stage: z.string().trim().min(1, 'Stage is required'),
			error_message: z.string().trim().min(1, 'Error message is required'),
		}),
	}),
]);

export const embeddingsQueueMessageSchema = z.object({
	type: z.literal('EMBEDDINGS_REQUEST'),
	payload: z.object({
		document_id: z.uuid(),
		workspace_id: z.string().trim().min(1, 'Workspace ID is required'),
		user_id: z.string().trim().min(1, 'User ID is required'),
		chunk_index: z.number().int().nonnegative('Chunk index must be 0 or greater'),
		chunk_count: z.number().int().positive('Chunk count must be a positive integer'),
		content: z.string().trim().min(1, 'Content is required'),
		s3_key: z.string().trim().min(1, 'S3 key is required'),
		mime_type: z.string().trim().min(1, 'MIME type is required'),
		file_name: z.string().trim().min(1, 'File name is required'),
		file_size: z.number().int().positive('File size must be a positive integer'),
	}),
});
