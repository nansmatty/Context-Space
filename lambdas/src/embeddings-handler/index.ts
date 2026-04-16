export const handler = async (event: any) => {
	try {
		console.log('Received SQS event:', JSON.stringify(event, null, 2));

		for (const record of event.Records) {
			const envelope = JSON.parse(record.body);

			console.log('Message type:', envelope.type);
			console.log('Payload:', envelope.payload);
		}

		return { success: true };
	} catch (error) {
		console.error('Error processing SQS message:', error);
		throw error;
	}
};
