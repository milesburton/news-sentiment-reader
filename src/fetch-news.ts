import Parser from 'rss-parser';
import dotenv from 'dotenv';
import type { NewsItem } from './types/news';

dotenv.config();

// Configuration
const CONFIG = {
  MAX_ITEMS: 10,
  RSS_FEED: process.env.RSS_FEED_URL ?? 'https://feeds.bbci.co.uk/news/rss.xml',
  TIMEOUT: 10000, // 10 seconds
} as const;

// Initialize parser with timeout
const parser = new Parser({
  timeout: CONFIG.TIMEOUT,
  customFields: {
    item: ['contentSnippet']
  }
});

/**
 * Fetches news headlines from the configured RSS feed
 * @param limit Optional number of items to fetch (defaults to CONFIG.MAX_ITEMS)
 * @returns Promise<NewsItem[]>
 */
export async function fetchNews(limit: number = CONFIG.MAX_ITEMS): Promise<NewsItem[]> {
  try {
    console.log(`Fetching news headlines from ${CONFIG.RSS_FEED}...`);
    
    const feed = await parser.parseURL(CONFIG.RSS_FEED);
    
    return feed.items
      .slice(0, limit)
      .map(item => ({
        title: item.title ?? 'Untitled',
        link: item.link ?? '',
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet
      }));
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching news headlines:', error.message);
    } else {
      console.error('Unknown error fetching news headlines');
    }
    return [];
  }
}