import { generateAnswerFromContext, generateEmbeddings } from '../services/bedrock.service';
import { performSimilaritySearch } from '../services/retrieval.service';
import { askRequestSchema } from '../utils/validation';

export const handler = async (event: any) => {
	try {
		const parsed = askRequestSchema.safeParse(JSON.parse(event.body));
		if (!parsed.success) {
			console.error('Validation failed', { errors: parsed.error.message });
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Invalid request body', errors: parsed.error.message }),
			};
		}

		const { question, workspace_id, user_id } = parsed.data;

		if (!question?.trim() || !workspace_id || !user_id) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing required fields: question, workspace_id, user_id' }),
			};
		}

		const embeddingOfQuestion = await generateEmbeddings(question);
		const TOP_K = 3;
		const MIN_SIMILARITY_THRESHOLD = 0.25;
		const HIGH_SIMILARITY_THRESHOLD = 0.45;

		const searchResults = await performSimilaritySearch({
			questionEmbedding: embeddingOfQuestion,
			workspaceId: workspace_id,
			userId: user_id,
			limit: TOP_K,
		});

		// Filter results based on similarity threshold and determine retrieval status and also adding low confidence retrieval with status and confidence level in the response.

		const filtered = searchResults.filter((r) => r.similarity >= MIN_SIMILARITY_THRESHOLD);
		const topSimilarity = filtered.length > 0 ? Number(filtered[0].similarity) : null;

		const retrievalMeta = {
			status: filtered.length === 0 ? 'empty' : topSimilarity !== null && topSimilarity < HIGH_SIMILARITY_THRESHOLD ? 'low_confidence' : 'success',
			confidence: filtered.length === 0 ? 'none' : topSimilarity !== null && topSimilarity < HIGH_SIMILARITY_THRESHOLD ? 'low' : 'high',
			topSimilarity,
		};

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
						retrieval: retrievalMeta,
						grounded: false,
					},
				}),
			};
		}

		if (retrievalMeta.status === 'low_confidence') {
			return {
				statusCode: 200,
				body: JSON.stringify({
					message: 'Low confidence in retrieved context. Answer may be inaccurate.',
					data: {
						question,
						answer: "I found some information that might be relevant, but I'm not very confident about it.",
						sources: filtered.map((chunk) => ({
							document_id: chunk.document_id,
							chunk_index: chunk.chunk_index,
							similarity: chunk.similarity,
						})),
						retrieval: retrievalMeta,
						grounded: false,
					},
				}),
			};
		}

		let answer: string;
		let generationStatus: 'success' | 'failed' = 'success';

		try {
			answer = await generateAnswerFromContext(question, filtered);
		} catch (error) {
			console.error('Error generating answer:', error);
			answer = 'I found relevant document context, but the AI model failed to generate an answer. Please try again.';
			generationStatus = 'failed';
		}

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: generationStatus === 'success' ? 'Answer generated successfully' : 'Relevant context found, but answer generation failed',
				data: {
					question,
					answer,
					sources: filtered.map((chunk) => ({
						document_id: chunk.document_id,
						chunk_index: chunk.chunk_index,
						similarity: chunk.similarity,
					})),
					retrieval: retrievalMeta,
					generation: {
						status: generationStatus,
					},
					grounded: generationStatus === 'success',
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
