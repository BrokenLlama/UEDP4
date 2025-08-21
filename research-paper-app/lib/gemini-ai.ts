import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiAI {
  private static model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  private static embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

  // Generate embeddings for text (paper title + abstract)
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      const embedding = await result.embedding;
      return embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  // Generate paper summary using Gemini
  static async generateSummary(paper: { title: string; abstract?: string }): Promise<string> {
    try {
      const prompt = `
        Please provide a concise summary of this research paper in 2-3 sentences:
        
        Title: ${paper.title}
        Abstract: ${paper.abstract || 'No abstract available'}
        
        Focus on the main contributions and key findings.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary generation failed';
    }
  }

  // Generate research insights and connections
  static async generateInsights(papers: Array<{ title: string; abstract?: string }>): Promise<string> {
    try {
      const papersText = papers.map((paper, index) => 
        `${index + 1}. ${paper.title}\n   ${paper.abstract || 'No abstract'}\n`
      ).join('\n');

      const prompt = `
        Analyze these research papers and provide insights on:
        1. Common themes and connections
        2. Research gaps and opportunities
        3. Potential future directions
        
        Papers:
        ${papersText}
        
        Provide a structured analysis with clear sections.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating insights:', error);
      return 'Insight generation failed';
    }
  }

  // Generate search suggestions based on query
  static async generateSearchSuggestions(query: string): Promise<string[]> {
    try {
      const prompt = `
        Based on this research query: "${query}"
        
        Generate 5 related search terms or phrases that would help find relevant papers.
        Return only the search terms, one per line, without numbering or additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestions = response.text().split('\n').filter(s => s.trim());
      
      return suggestions.slice(0, 5);
    } catch (error) {
      console.error('Error generating search suggestions:', error);
      return [];
    }
  }

  // Classify paper by research area
  static async classifyPaper(paper: { title: string; abstract?: string }): Promise<string[]> {
    try {
      const prompt = `
        Classify this research paper into relevant research areas:
        
        Title: ${paper.title}
        Abstract: ${paper.abstract || 'No abstract available'}
        
        Return only the research areas, separated by commas, without additional text.
        Examples: Machine Learning, Computer Vision, Natural Language Processing, etc.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const classifications = response.text().split(',').map(c => c.trim());
      
      return classifications;
    } catch (error) {
      console.error('Error classifying paper:', error);
      return ['Unclassified'];
    }
  }

  // Generate paper recommendations based on user interests
  static async generateRecommendations(
    userInterests: string[],
    recentPapers: Array<{ title: string; abstract?: string }>
  ): Promise<string[]> {
    try {
      const interestsText = userInterests.join(', ');
      const papersText = recentPapers.map(p => p.title).join('\n- ');

      const prompt = `
        Based on these user interests: ${interestsText}
        And their recent paper history:
        - ${papersText}
        
        Generate 5 specific research paper search queries that would likely interest this user.
        Return only the search queries, one per line, without numbering or additional text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = response.text().split('\n').filter(s => s.trim());
      
      return recommendations.slice(0, 5);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
}
