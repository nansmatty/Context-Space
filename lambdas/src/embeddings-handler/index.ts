export const handler = async (event: any) => {
	console.log('Received event:', JSON.stringify(event, null, 2));
	// Process the event and generate embeddings
	// For demonstration, we will just return a success message
	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Embeddings generated successfully!' }),
	};
};
