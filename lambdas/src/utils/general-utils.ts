export function toPGVector(embedding: number[]): string {
	return `[${embedding.join(',')}]`;
}
