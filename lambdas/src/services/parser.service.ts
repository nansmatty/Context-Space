import { PDFParse } from 'pdf-parse';
export class ParserService {
	async parsePDF(buffer: Buffer): Promise<string> {
		const parser = new PDFParse({ data: buffer });
		try {
			const result = await parser.getText();
			return result.text?.trim() || '';
		} finally {
			await parser.destroy();
		}
	}

	async parseText(buffer: Buffer): Promise<string> {
		return buffer.toString('utf-8');
	}
}
