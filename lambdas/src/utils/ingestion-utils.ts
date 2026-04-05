export const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
	const chunks: Buffer[] = [];

	for await (const chunk of stream) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	return Buffer.concat(chunks);
};

export const chunkText = (text: string): string[] => {
	const CHUNK_SIZE = 500;
	const OVERLAP = 50;

	const chunks = [];

	let start = 0;

	while (start < text.length) {
		const end = start + CHUNK_SIZE;
		const chunk = text.slice(start, end);

		chunks.push(chunk);

		start += CHUNK_SIZE - OVERLAP;
	}

	return chunks;
};
