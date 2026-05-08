import { SQSEvent, SQSRecord } from 'aws-lambda';
import { createDbClient } from '../db/db';
import { parseSqsRecord } from '../utils/general-utils';

type FinalizerMessage = {
	type: 'DOCUMENT_FINALIZE_CHECK';
	payload: {
		document_id: string;
		user_id: string;
		workspace_id: string;
		chunk_count: number;
	};
};

export const handler = async (event: SQSEvent) => {
	const client = await createDbClient();

	try {
		for (const record of event.Records) {
			const body = parseSqsRecord(record) as FinalizerMessage;

			if (body.type !== 'DOCUMENT_FINALIZE_CHECK') {
				throw new Error(`Invalid finalizer message type: ${body.type}`);
			}

			const { document_id, user_id, workspace_id, chunk_count } = body.payload;

			if (!document_id || !user_id || !workspace_id || !chunk_count) {
				throw new Error('Missing required fields in finalizer message payload');
			}

			const countQuery = `SELECT COUNT(*)::int AS inserted_count FROM chunks WHERE document_id = $1`;

			const countResult = await client.query(countQuery, [document_id]);
			const insertedCount = countResult.rows[0].inserted_count;

			console.log({
				document_id,
				insertedCount,
				expectedCount: chunk_count,
			});

			if (insertedCount !== chunk_count) {
				console.log(`Document not complete yet: ${document_id}`);
				continue;
			}

			const updateDocStatusQuery = `
				UPDATE documents
				SET status = 'completed',
					updated_at = now()
				WHERE id = $1
				  AND status != 'completed'
				RETURNING id, status
			`;

			const updateResult = await client.query(updateDocStatusQuery, [document_id]);

			if (updateResult.rowCount === 0) {
				console.log(`Document already finalized: ${document_id}`);
				continue;
			}

			console.log(`Document finalized: ${document_id}`);
		}
	} catch (error) {
		console.error('Error processing event:', error);
		throw error;
	} finally {
		await client.end();
	}
};
