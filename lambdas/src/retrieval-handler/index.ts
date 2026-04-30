import { generateEmbeddings } from '../services/bedrock.service';
import { performSimilaritySearch } from '../services/retrieval.service';
import { AskRequestBody } from '../utils/shared_types';

export const handler = async (event: any) => {
	console.log('Retrieval Lambda Invoked', event);

	try {
		const body: AskRequestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

		const { question, workspace_id, user_id } = body || {};

		if (!question?.trim() || !workspace_id || !user_id) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing required fields: question, workspace_id, user_id' }),
			};
		}

		console.log('Parsed Retrieval Request:', {
			workspace_id,
			user_id,
			questionLength: question.length,
		});

		const embeddingOfQuestion = await generateEmbeddings(question);

		const searchResults = await performSimilaritySearch({
			questionEmbedding: embeddingOfQuestion,
			workspaceId: workspace_id,
			userId: user_id,
			limit: 5,
		});

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Retrieval completed successfully',
				data: { question, matches: searchResults },
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
