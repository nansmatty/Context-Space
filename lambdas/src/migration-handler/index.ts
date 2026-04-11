export const handler = async () => {
	console.log('Migration Lambda invoked');
	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Migration Lambda is working' }),
	};
};
