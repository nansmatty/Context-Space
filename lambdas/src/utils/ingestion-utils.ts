export const streamToString = async (stream: any): Promise<string> => {
	return await new Promise((resolve, reject) => {
		const chunks: any[] = [];
		stream.on('data', (chunk: any) => chunks.push(chunk));
		stream.on('error', (err: any) => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
	});
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
