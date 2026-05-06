export const handler = async (event: any) => {
	try {
		console.log('Received event:', JSON.stringify(event, null, 2));
	} catch (error) {
		console.error('Error processing event:', error);
		throw error;
	}
};
