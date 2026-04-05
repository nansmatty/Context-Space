import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
export class ParserService {
	async extractTextFromPDF(buffer: Buffer): Promise<string> {
		const parser = new PDFParse({ data: buffer, CanvasFactory });
		try {
			const result = await parser.getText();
			return result.text?.trim() || '';
		} finally {
			await parser.destroy();
		}
	}

	async extractTextFromBuffer(buffer: Buffer): Promise<string> {
		return buffer.toString('utf-8');
	}
}
