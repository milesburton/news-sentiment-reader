// Extract full article content
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeContent(url: string): Promise<string> {
  try {
    console.log("Fetching article content from: " + url);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    return $('article').text().trim() || 'No content extracted.';
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error);
    return 'Failed to extract content.';
  }
}
