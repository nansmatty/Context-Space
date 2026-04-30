import 'dotenv/config';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
	region: process.env.AWS_REGION,
});

type TitanEmbeddingsResponse = {
	embedding: number[];
	inputTextTokenCount?: number;
};

export async function generateEmbeddings(text: string): Promise<number[]> {
	if (!text || text.trim() === '') {
		throw new Error('Cannot generate embeddings for empty text.');
	}

	const command = new InvokeModelCommand({
		modelId: 'amazon.titan-embed-text-v2:0',
		contentType: 'application/json',
		accept: 'application/json',
		body: JSON.stringify({
			inputText: text,
		}),
	});

	const response = await bedrockClient.send(command);

	if (!response.body) {
		throw new Error('No response body received from Bedrock.');
	}

	const rawBody = new TextDecoder().decode(response.body);
	const parsedBody = JSON.parse(rawBody) as TitanEmbeddingsResponse;

	if (parsedBody.embedding.length !== 1024) {
		throw new Error(`Invalid embedding dimension: expected 1024, got ${parsedBody.embedding.length}`);
	}

	if (!parsedBody.embedding || !Array.isArray(parsedBody.embedding)) {
		throw new Error('Invalid response format: embedding not found or is not an array.');
	}

	return parsedBody.embedding;
}
