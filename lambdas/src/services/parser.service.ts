// import { CanvasFactory } from 'pdf-parse/worker';
// import { PDFParse } from 'pdf-parse';
import { extractText } from 'unpdf';
export class ParserService {
	// this version is for pdf-parser package.
	// async extractTextFromPDF(buffer: Buffer): Promise<string> {
	// 	const parser = new PDFParse({ data: buffer, CanvasFactory });
	// 	try {
	// 		const result = await parser.getText();
	// 		return result.text?.trim() || '';
	// 	} finally {
	// 		await parser.destroy();
	// 	}
	// }

	// this version is for unpdf package.
	async extractTextFromPDF(buffer: Buffer): Promise<string> {
		try {
			const { text } = await extractText(new Uint8Array(buffer), {
				mergePages: true,
			});

			return text;
		} catch (error) {
			console.error('UNPDF: error extracting text', error);
			throw error;
		}
	}

	async extractTextFromBuffer(buffer: Buffer): Promise<string> {
		return buffer.toString('utf-8');
	}
}
