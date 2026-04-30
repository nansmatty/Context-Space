export function toPGVector(embedding: number[]): string {
	return `[${embedding.join(',')}]`;
}

export function cleanModelAnswer(text: string): string {
	return text
		.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
		.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
		.trim();
}
