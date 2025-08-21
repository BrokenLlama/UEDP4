import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';

export class PDFProcessor {
  static async downloadPDF(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error(`Failed to download PDF from ${url}`);
    }
  }

  static async downloadAndSavePDF(url: string, filename?: string): Promise<string> {
    try {
      // Create downloads directory if it doesn't exist
      const downloadsDir = path.join(process.cwd(), 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Generate filename if not provided
      const safeFilename = filename || `paper_${Date.now()}.pdf`;
      const filePath = path.join(downloadsDir, safeFilename);

      // Download the PDF
      const pdfBuffer = await this.downloadPDF(url);
      
      // Save to local file
      fs.writeFileSync(filePath, pdfBuffer);
      
      console.log(`PDF downloaded and saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error downloading and saving PDF:', error);
      throw new Error(`Failed to download and save PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async extractTextFromLocalFile(filePath: string): Promise<string> {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from local PDF:', error);
      throw new Error(`Failed to extract text from local PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  static async processPDF(url: string): Promise<{
    text: string;
    pageCount: number;
    metadata: any;
    localFilePath?: string;
  }> {
    try {
      // First, download and save the PDF locally
      const localFilePath = await this.downloadAndSavePDF(url);
      
      // Then process the local file
      const pdfBuffer = fs.readFileSync(localFilePath);
      
      // Try to parse with different options
      let data;
      try {
        data = await pdfParse(pdfBuffer);
      } catch (parseError) {
        // If standard parsing fails, try with different options
        console.log('Standard PDF parsing failed, trying with alternative options...');
        data = await pdfParse(pdfBuffer, {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
      }
      
      return {
        text: data.text || '',
        pageCount: data.numpages || 0,
        metadata: data.info || {},
        localFilePath
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // Return a fallback response instead of throwing
      return {
        text: `PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a different PDF or contact support.`,
        pageCount: 0,
        metadata: {},
        localFilePath: undefined
      };
    }
  }

  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  static extractAbstract(text: string): string | null {
    // Common patterns for abstract sections
    const abstractPatterns = [
      /abstract\s*:?\s*(.*?)(?=\n\s*\n|\n\s*introduction|\n\s*1\.\s*introduction)/is,
      /abstract\s*:?\s*(.*?)(?=\n\s*\n|\n\s*keywords|\n\s*1\.)/is,
      /abstract\s*:?\s*(.*?)(?=\n\s*\n|\n\s*introduction)/is
    ];

    for (const pattern of abstractPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanText(match[1]);
      }
    }

    return null;
  }

  static extractIntroduction(text: string): string | null {
    const introPatterns = [
      /introduction\s*:?\s*(.*?)(?=\n\s*\n|\n\s*2\.|\n\s*methodology|\n\s*methods)/is,
      /1\.\s*introduction\s*:?\s*(.*?)(?=\n\s*\n|\n\s*2\.|\n\s*methodology|\n\s*methods)/is
    ];

    for (const pattern of introPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanText(match[1]);
      }
    }

    return null;
  }

  static extractConclusion(text: string): string | null {
    const conclusionPatterns = [
      /conclusion\s*:?\s*(.*?)(?=\n\s*\n|\n\s*references|\n\s*bibliography|\n\s*acknowledgments)/is,
      /conclusions\s*:?\s*(.*?)(?=\n\s*\n|\n\s*references|\n\s*bibliography|\n\s*acknowledgments)/is,
      /discussion\s*:?\s*(.*?)(?=\n\s*\n|\n\s*references|\n\s*bibliography|\n\s*acknowledgments)/is
    ];

    for (const pattern of conclusionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanText(match[1]);
      }
    }

    return null;
  }

  static cleanupLocalFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up local file: ${filePath}`);
      }
    } catch (error) {
      console.error('Error cleaning up local file:', error);
    }
  }
}
