import axios from 'axios';
import * as cheerio from 'cheerio';
import {logger} from './utils/logger';

export async function scrapeContent(url: string): Promise<string> {
    try {
        logger.info(`Fetching article content from: ${url}`);
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);

        // BBC-specific handling
        if (url.includes('bbc.com/news')) {
            // First try to get content from article-body blocks
            let content = $('[data-component="text-block"]').map(function () {
                return $(this).text().trim();
            }).get().join('\n\n');

            // If no text blocks found, try alternative BBC selectors
            if (!content) {
                content = $('.article__body-content').text().trim() ||
                    $('.story-body__inner').text().trim();
            }

            if (content) {
                return content;
            }
        }

        // General article content extraction fallbacks
        const contentSelectors = [
            'article',                    // Generic article tag
            '.article-body',             // Common article body class
            '.story-content',            // Common story content class
            '.main-content',             // Common main content class
            '[role="main"]',             // Main content role
            '.content',                  // Generic content class
            '#main-content'              // Common main content ID
        ];

        for (const selector of contentSelectors) {
            const content = $(selector).text().trim();
            if (content && content.length > 100) { // Basic validation that we got real content
                return content;
            }
        }

        // If no content found with specific selectors, try getting all paragraph text
        const paragraphContent = $('p').map(function () {
            return $(this).text().trim();
        }).get().join('\n\n');

        if (paragraphContent && paragraphContent.length > 100) {
            return paragraphContent;
        }

        logger.warn(`No content found for URL: ${url}`);
        return 'No content extracted.';
    } catch (error) {
        logger.error({error, url}, 'Error scraping content');
        return 'Failed to extract content.';
    }
}