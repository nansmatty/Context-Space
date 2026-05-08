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
    SELECT c.id, c.document_id, c.chunk_index, c.content, 1 - (c.embedding <=> $1::vector) AS similarity
    FROM chunks c
		JOIN documents d ON c.document_id = d.id
    WHERE c.workspace_id = $2 AND c.user_id = $3 AND d.status = 'completed' AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> $1::vector
    LIMIT $4
  `;

		// Execute the query using your database client (e.g., pg for PostgreSQL)

		const results = await dbClient.query(query, [vectorString, workspaceId, userId, limit]);
		return results.rows;
	} catch (error) {
		console.error('Error performing similarity search:', error);
		throw error;
	} finally {
		await dbClient.end();
	}
}
