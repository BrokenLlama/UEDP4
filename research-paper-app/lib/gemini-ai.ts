import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Paper } from '@/types/paper';

export class GeminiAIClient {
  private genAI!: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_AI_API_KEY environment variable is not set. AI features will not work.');
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (error) {
      console.error('Error initializing Google AI client:', error);
      throw new Error('Failed to initialize Google AI client');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.genAI) {
      throw new Error('Google AI client not initialized. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    
    const embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  async chatWithPaper(message: string, paperContext: string, chatHistory: any[] = []) {
    if (!this.genAI) {
      throw new Error('Google AI client not initialized. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Format chat history correctly
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,  // Map assistant → model
      parts: [{ text: msg.content || msg.parts || msg.text }]  // Ensure array format
    }));
    
    // Add paper context as system message
    const contextMessage = {
      role: "user",
      parts: [{ text: `Paper context: ${paperContext}` }]
    };
    
    const chat = model.startChat({
      history: [contextMessage, ...formattedHistory]
    });
    
    const result = await chat.sendMessage([{ text: message }]);
    return result.response.text();
  }

  async summarizePaper(paper: Paper): Promise<string> {
    if (!this.model) {
      throw new Error('Google AI client not initialized. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    const prompt = `
Please provide a comprehensive summary of the following research paper:

Title: ${paper.title}
Authors: ${paper.authors?.map(a => a.name).join(', ') || 'Unknown'}
Year: ${paper.year || 'Unknown'}
Abstract: ${paper.abstract || 'No abstract available'}
${paper.fullText ? `Full Text: ${paper.fullText.substring(0, 3000)}...` : ''}

Please include:
1. Main research question or objective
2. Methodology used
3. Key findings
4. Implications and significance
5. Limitations (if any)

Keep the summary clear and accessible to a general academic audience.
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async extractKeyInsights(paper: Paper): Promise<string[]> {
    if (!this.model) {
      throw new Error('Google AI client not initialized. Please set GOOGLE_AI_API_KEY environment variable.');
    }
    const prompt = `
Extract the key insights and main points from this research paper:

Title: ${paper.title}
Abstract: ${paper.abstract || 'No abstract available'}
${paper.fullText ? `Full Text: ${paper.fullText.substring(0, 2000)}...` : ''}

Please provide 5-7 key insights as bullet points. Focus on:
- Main findings
- Novel contributions
- Important implications
- Key methodologies
- Significant results

Format as a simple list of insights.
`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text().split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }
}
