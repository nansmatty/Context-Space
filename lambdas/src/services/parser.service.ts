import * as pdfParse from 'pdf-parse';

export class ParserService {
	async parsePDF(buffer: Buffer): Promise<string> {
		const data = await (pdfParse as any)(buffer);
		return data.text;
	}

	async parseText(buffer: Buffer): Promise<string> {
		return buffer.toString('utf-8');
	}
}
