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
