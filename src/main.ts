import { fetchNews } from './fetchNews';
import { scrapeContent } from './scrapeContent';
import { loadModel, embedText, initialiseReferenceEmbeddings, getReferenceEmbeddings } from './download-model';
import { logger } from './utils/logger';
import axios from 'axios';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

export type Sentiment = 'Left' | 'Right' | 'Centre' | 'Unknown';

interface OllamaResponse {
  response?: string;
  error?: string;
}

async function analyzeSentiment(text: string): Promise<{ sentiment: Sentiment; method: '🤖 Ollama' | '🧮 Local Model' }> {
  if (!text?.trim()) {
    return { sentiment: 'Unknown', method: '🧮 Local Model' };
  }

  const prompt = `Analyze the following news article and categorize its political sentiment as:
- 'Left' if it leans progressive/liberal.
- 'Right' if it leans conservative.
- 'Centre' if it is neutral or balanced.

Text: ${text}

Respond with only one word: 'Left', 'Right', or 'Centre'.`;

  try {
    const response = await axios.post<OllamaResponse>(OLLAMA_API_URL, {
      model: 'mistral',
      prompt,
      temperature: 0.1,
    });

    const sentiment = response.data?.response?.trim();
    if (sentiment && ['Left', 'Right', 'Centre'].includes(sentiment)) {
      return { 
        sentiment: sentiment as Sentiment, 
        method: '🤖 Ollama'
      };
    }

    return await fallbackAnalysis(text);
  } catch (error) {
    return await fallbackAnalysis(text);
  }
}

async function fallbackAnalysis(text: string): Promise<{ sentiment: Sentiment; method: '🧮 Local Model' }> {
  try {
    const embedding = await embedText(text);
    const references = getReferenceEmbeddings();
    
    // Calculate cosine similarity with each reference
    const similarities = Object.entries(references).map(([sentiment, refEmbedding]) => ({
      sentiment,
      similarity: cosineSimilarity(embedding, new Float32Array(refEmbedding))
    }));
    
    // Return the sentiment with highest similarity
    const bestMatch = similarities.reduce((a, b) => 
      a.similarity > b.similarity ? a : b
    );
    
    return { 
      sentiment: bestMatch.sentiment as Sentiment,
      method: '🧮 Local Model'
    };
  } catch (error) {
    logger.error({ error }, '❌ Error in local sentiment analysis');
    return { 
      sentiment: 'Unknown',
      method: '🧮 Local Model'
    };
  }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function processNewsItems(newsItems: NewsItem[]): Promise<void> {
  logger.info({ count: newsItems.length }, '📊 Starting news analysis');

  for (const item of newsItems) {
    try {
      logger.debug({ title: item.title }, '📰 Processing article');
      
      // Scrape full content if needed
      if (item.link) {
        const content = await scrapeContent(item.link);
        if (content) {
          item.content = content;
        }
      }

      // Analyze sentiment if we have content
      if (item.content) {
        const { sentiment, method } = await analyzeSentiment(item.content);
        logger.info({
          title: item.title,
          sentiment,
          method,
          link: item.link
        }, `${method === '🤖 Ollama' ? '🤖' : '🧮'} Analysis complete`);
      }
    } catch (error) {
      logger.error({ 
        error, 
        title: item.title 
      }, '❌ Error processing article');
    }
  }
}

async function main() {
  try {
    // Initialize the model and reference embeddings
    logger.info('🚀 Starting news sentiment analyser');
    await loadModel();
    await initialiseReferenceEmbeddings();

    // Fetch news
    const newsItems = await fetchNews();
    await processNewsItems(newsItems);
    
    logger.info('✨ Analysis complete');
  } catch (error) {
    logger.error({ error }, '❌ Error in main process');
  }
}

// Run the application
if (import.meta.main) {
  main().catch((error) => logger.error({ error }, '❌ Fatal error'));
}