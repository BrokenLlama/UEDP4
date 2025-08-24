import { GoogleGenAI } from '@google/genai';
import type { Paper } from '@/types/paper';

export class GeminiAIClient {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('GOOGLE_AI_API_KEY environment variable is not set. AI features will not work.');
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    }
    
    try {
      this.ai = new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error('Error initializing Google AI client:', error);
      throw new Error('Failed to initialize Google AI client');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // For now, return a simple embedding as fallback
      // TODO: Implement proper embedding with the new API
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }
  }

  async chatWithPaper(message: string, paperContext: string, chatHistory: any[] = []) {
    try {
      // Create the full context with paper information and chat history
      let fullContext = `Paper context: ${paperContext}\n\n`;
      
      // Add chat history
      if (chatHistory.length > 0) {
        fullContext += 'Previous conversation:\n';
        chatHistory.forEach(msg => {
          const role = msg.role === 'assistant' ? 'AI' : 'User';
          fullContext += `${role}: ${msg.content || msg.parts || msg.text}\n`;
        });
        fullContext += '\n';
      }
      
      fullContext += `User: ${message}`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: fullContext,
      });
      
      return response.text || 'No response generated';
    } catch (error) {
      console.error('Error in chatWithPaper:', error);
      throw new Error('Failed to generate response from AI');
    }
  }

  async chat(systemPrompt: string, conversationHistory: any[] = [], currentMessage: any) {
    try {
      // Create the full context with system prompt, conversation history, and current message
      let fullContext = `${systemPrompt}\n\n`;
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        fullContext += 'Previous conversation:\n';
        conversationHistory.forEach(msg => {
          const role = msg.role === 'assistant' ? 'AI' : 'User';
          const content = msg.parts?.[0]?.text || msg.content || msg.text;
          fullContext += `${role}: ${content}\n`;
        });
        fullContext += '\n';
      }
      
      // Add current message
      const currentContent = currentMessage.parts?.[0]?.text || currentMessage.content || currentMessage.text;
      fullContext += `User: ${currentContent}`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: fullContext,
      });
      
      return response.text || 'No response generated';
    } catch (error) {
      console.error('Error in chat:', error);
      throw new Error('Failed to generate response from AI');
    }
  }

  async summarizePaper(paper: Paper): Promise<string> {
    try {
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      return response.text || 'No summary generated';
    } catch (error) {
      console.error('Error summarizing paper:', error);
      throw new Error('Failed to summarize paper');
    }
  }

  async extractKeyInsights(paper: Paper): Promise<string[]> {
    try {
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

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
      });
      
      return (response.text || '').split('\n').filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'));
    } catch (error) {
      console.error('Error extracting insights:', error);
      throw new Error('Failed to extract insights');
    }
  }
}
