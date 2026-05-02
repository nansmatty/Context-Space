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
		const TOP_K = 3;
		const SIMILARITY_THRESHOLD = 0.25;

		const searchResults = await performSimilaritySearch({
			questionEmbedding: embeddingOfQuestion,
			workspaceId: workspace_id,
			userId: user_id,
			limit: TOP_K,
		});

		const filtered = searchResults.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);

		console.log({
			totalResults: searchResults.length,
			filteredResults: filtered.length,
			similarityScores: searchResults.map((r) => r.similarity),
		});

		if (filtered.length === 0) {
			return {
				statusCode: 200,
				body: JSON.stringify({
					message: 'No relevant context found for the question',
					data: {
						question,
						answer: "I couldn't find relevant information in the uploaded documents.",
						sources: [],
					},
				}),
			};
		}

		const answer = await generateAnswerFromContext(question, filtered);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Answer generated successfully',
				data: {
					question,
					answer,
					sources: filtered.map((chunk) => ({
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
