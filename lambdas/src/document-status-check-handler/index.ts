import { createDbClient } from '../db/db';
import { documentStatusCheckMessageSchema } from '../utils/validation';

export const handler = async (event: any) => {
	const client = await createDbClient();

	try {
		const body = event.body ? JSON.parse(event.body) : {};
		const parsed = documentStatusCheckMessageSchema.safeParse(body);

		if (!parsed.success) {
			console.error('Validation failed', { errors: parsed.error.message });
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Invalid request body', errors: parsed.error.message }),
			};
		}

		const { document_id, user_id, workspace_id } = parsed.data;

		if (!document_id || !user_id || !workspace_id) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing required fields: document_id, user_id, workspace_id' }),
			};
		}

		const getDocumentQuery = `
      SELECT id, status, error_message, chunk_count, created_at, updated_at FROM documents
      WHERE id = $1 AND user_id = $2 AND workspace_id = $3
    `;
		const result = await client.query(getDocumentQuery, [document_id, user_id, workspace_id]);

		if (result.rowCount === 0) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: 'Document not found' }),
			};
		}

		const row = result.rows[0];
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Document status fetched successfully',
				data: {
					document_id: row.id,
					status: row.status,
					error_message: row.error_message,
					chunk_count: row.chunk_count,
					created_at: row.created_at,
					updated_at: row.updated_at,
				},
			}),
		};
	} catch (error) {
		console.error('Error in document status check handler', { error });
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: 'Document status check failed',
			}),
		};
	} finally {
		await client.end();
	}
};
