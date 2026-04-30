import { AskRequestBody } from '../utils/shared_types';

export const handler = async (event: any) => {
	console.log('Retrieval Lambda Invoked', event);

	try {
		const body: AskRequestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

		const { question, workspace_id, user_id } = body || {};

		console.log('Parsed Retrieval Request:', { question, workspace_id, user_id });

		if (!question || !workspace_id || !user_id) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing required fields: question, workspace_id, user_id' }),
			};
		}

		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Retrieval Lambda executed successfully!' }),
		};
	} catch (error: any) {
		console.error('Error in Retrieval Lambda:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Retrieval Lambda failed', error: error.message }),
		};
	}
};
