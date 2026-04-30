import { createDbClient } from '../db/db';
import { toPGVector } from '../utils/general-utils';

type SimilaritySearchChunk = {
	questionEmbedding: number[];
	workspaceId: string;
	userId: string;
	limit?: number;
};

export async function performSimilaritySearch({ questionEmbedding, workspaceId, userId, limit = 5 }: SimilaritySearchChunk) {
	const vectorString = toPGVector(questionEmbedding);
	const dbClient = await createDbClient();

	try {
		// Construct the SQL query for similarity search
		const query = `
    SELECT id, document_id, chunk_index, content, 1 - (embedding <=> $1::vector) AS similarity
    FROM chunks
    WHERE workspace_id = $2 AND user_id = $3 AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $4
  `;

		// Execute the query using your database client (e.g., pg for PostgreSQL)

		const results = await dbClient.query(query, [vectorString, workspaceId, userId, limit]);
		return results.rows;
	} catch (error) {
		console.error('Error performing similarity search:', error);
		throw error;
	}
}
