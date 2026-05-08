import { SQSRecord } from 'aws-lambda/trigger/sqs';

export function toPGVector(embedding: number[]): string {
	return `[${embedding.join(',')}]`;
}

export function cleanModelAnswer(text: string): string {
	return text
		.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
		.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
		.trim();
}

export const extractDocumentIdFromKey = (key: string): string | undefined => {
	const parts = key.split('/');

	// For key format: upload/<documentId>/<filename>
	if (parts[0] === 'upload' && parts[1]) {
		return parts[1];
	}

	return undefined;
};

export function parseSqsRecord(record: SQSRecord) {
	try {
		return JSON.parse(record.body);
	} catch (error) {
		console.error('Failed to parse SQS record body', {
			messageId: record.messageId,
			body: record.body,
			error,
		});

		throw error;
	}
}
