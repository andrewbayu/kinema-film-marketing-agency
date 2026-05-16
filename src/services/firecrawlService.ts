import { apiClient } from './apiClient';

export interface SearchResult {
  title?: string;
  description?: string;
  markdown?: string;
  url?: string;
}

export const firecrawlService = {
  /**
   * Search and Scrape multiple pages into markdown
   */
  async searchAndScrape(query: string, limit: number = 5): Promise<string> {
    try {
      const data = await apiClient.post<{ markdown: string }>('/api/firecrawl/search', { query, limit });
      return data.markdown || "";
    } catch (error) {
      console.error("Firecrawl Search Error:", error);
      return "";
    }
  },

  /**
   * Scrape a specific URL
   */
  async scrapeUrl(url: string): Promise<string> {
    try {
      const data = await apiClient.post<{ markdown: string }>('/api/firecrawl/scrape', { url });
      return data.markdown || "";
    } catch (error) {
      console.error("Firecrawl Scrape Error:", error);
      return "";
    }
  }
};
