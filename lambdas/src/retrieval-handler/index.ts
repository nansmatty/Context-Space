export const handler = async (event: any) => {
	console.log('Retrieval Lambda Invoked', event);

	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Retrieval Lambda executed successfully!' }),
	};
};
