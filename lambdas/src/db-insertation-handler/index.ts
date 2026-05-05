import { createDbClient } from '../db/db';
import { toPGVector } from '../utils/general-utils';
import { DbInsertionPayload } from '../utils/shared_types';
import type { SQSEvent, SQSRecord } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
	const client = await createDbClient();

	try {
		for (const record of event.Records) {
			const body = parseSqsRecord(record) as DbInsertionPayload;

			const { document_id, workspace_id, user_id, chunk_index, chunk_count, content, s3_key, mime_type, file_name, file_size } = body.payload;
			const embedding: number[] = body.embedding;

			if (embedding.length !== 1024) {
				throw new Error(`Invalid embedding length: ${embedding.length}`);
			}

			const vectorString = toPGVector(embedding);
			const token_count = Math.round(content.length / 4); // Rough estimate: 1 token ~ 4 characters

			// Insert the data into documents table
			const docInsertQuery = `
				INSERT INTO documents (id, user_id, workspace_id, s3_key, file_name, mime_type, file_size, status, chunk_count )
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING
			`;
			await client.query(docInsertQuery, [document_id, user_id, workspace_id, s3_key, file_name, mime_type, file_size, 'processing', chunk_count]);

			// Insert the data into chunks table
			const chunkInsertQuery = `
				INSERT INTO chunks (document_id, user_id, workspace_id, chunk_index, content, token_count, embedding)
				VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (document_id, chunk_index) DO NOTHING
			`;
			await client.query(chunkInsertQuery, [document_id, user_id, workspace_id, chunk_index, content, token_count, vectorString]);

			const countChunksQuery = `SELECT COUNT(*)::int AS inserted_count FROM chunks WHERE document_id = $1`;
			const countResult = await client.query(countChunksQuery, [document_id]);
			const insertedChunks = countResult.rows[0].inserted_count;

			if (insertedChunks === chunk_count) {
				const updateDocStatusQuery = `UPDATE documents SET status = 'completed', updated_at = NOW() WHERE id = $1`;
				await client.query(updateDocStatusQuery, [document_id]);
			}
		}
	} catch (error) {
		console.error('DB insertion failed:', error);
		throw error;
	} finally {
		await client.end();
	}
};

function parseSqsRecord(record: SQSRecord) {
	try {
		return JSON.parse(record.body);
	} catch (error) {
		console.error('Failed to parse SQS record body', {
			bodyId: record.messageId,
			body: record.body,
			error,
		});

		throw error;
	}
}
