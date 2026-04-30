import { generateAnswerFromContext, generateEmbeddings } from '../services/bedrock.service';
import { performSimilaritySearch } from '../services/retrieval.service';
import { AskRequestBody } from '../utils/shared_types';

export const handler = async (event: any) => {
	try {
		const body: AskRequestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

		const { question, workspace_id, user_id } = body || {};

		if (!question?.trim() || !workspace_id || !user_id) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing required fields: question, workspace_id, user_id' }),
			};
		}

		const embeddingOfQuestion = await generateEmbeddings(question);

		const searchResults = await performSimilaritySearch({
			questionEmbedding: embeddingOfQuestion,
			workspaceId: workspace_id,
			userId: user_id,
			limit: 5,
		});

		const answer = await generateAnswerFromContext(question, searchResults);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Answer generated successfully',
				data: {
					question,
					answer,
					sources: searchResults.map((chunk) => ({
						document_id: chunk.document_id,
						chunk_index: chunk.chunk_index,
						similarity: chunk.similarity,
					})),
				},
			}),
		};
	} catch (error) {
		console.error('Error in Retrieval Lambda:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Retrieval Lambda failed' }),
		};
	}
};
