import {fetchNews} from './fetch-news';
import {scrapeContent} from './scrape-contents';
import {embedText, getReferenceEmbeddings, initialiseReferenceEmbeddings, loadModel} from './download-model';
import {logger} from './utils/logger';
import axios from 'axios';
import {checkRequiredModel, OllamaConnectionError, validateOllamaUrl} from './ollama-checks';
import type {AnalysisResult, AnalysisSummary} from './types/summary';
import type {NewsItem, Sentiment} from './types/news';

const OLLAMA_API_URL = 'http://ollama:11434';
const REQUIRED_MODEL = 'deepseek-r1:14b';

const STATUS = {
    INIT: '🎯 Initialising',
    FETCH: '📡 Fetching',
    PROCESS: '⚡ Processing',
    ANALYSIS: '🔍 Analysing',
    SUCCESS: '✅ Success',
    ERROR: '❌ Error',
    WARNING: '⚠️ Warning',
    INFO: 'ℹ️ Info',
    COMPLETE: '🎉 Complete',
    MODELS: {
        OLLAMA: '🤖 Ollama',
        LOCAL: '🧮 Local Model'
    }
} as const;

async function analyzeSentiment(text: string, ollamaUrl: string): Promise<{
    sentiment: Sentiment;
    method: '🤖 Ollama' | '🧮 Local Model'
}> {
    if (!text?.trim()) {
        return {sentiment: 'Unknown', method: STATUS.MODELS.LOCAL};
    }

    const prompt = `Analyze the following news article and categorize its political sentiment as:
- 'Left' if it leans progressive/liberal.
- 'Right' if it leans conservative.
- 'Centre' if it is neutral or balanced.

Text: ${text}

Respond with only one word: 'Left', 'Right', or 'Centre'.`;

    try {
        const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model: REQUIRED_MODEL,
            prompt,
            temperature: 0.1,
        }, {
            responseType: 'text'
        });

        // Split into lines and parse each JSON object
        const lines = response.data.trim().split('\n');
        let fullResponse = '';
        let isDone = false;

        for (const line of lines) {
            try {
                const jsonResponse = JSON.parse(line);

                // Add to full response if there's content
                if (jsonResponse.response) {
                    fullResponse += jsonResponse.response;
                }
                // Check if this is the final message
                if (jsonResponse.done) {
                    isDone = true;
                }
            } catch (e) {
                logger.warn({
                    error: e,
                    line
                }, 'Failed to parse response line');
            }
        }

        // Debug logging
        logger.debug({
            fullResponse,
            isDone,
            responseLength: fullResponse.length
        }, 'Parsed Ollama response');

        if (!isDone) {
            logger.warn('Ollama response was incomplete');
            return await fallbackAnalysis(text);
        }

        // Clean up the response
        const cleanResponse = fullResponse
            .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking process
            .trim();

        logger.debug({
            cleanResponse,
            length: cleanResponse.length
        }, 'Cleaned response');

        if (cleanResponse && ['Left', 'Right', 'Centre'].includes(cleanResponse)) {
            return {
                sentiment: cleanResponse as Sentiment,
                method: STATUS.MODELS.OLLAMA
            };
        }

        // If we didn't get a valid sentiment, use fallback
        logger.warn({
            cleanResponse
        }, 'Invalid sentiment from Ollama, falling back to local model');
        return await fallbackAnalysis(text);
    } catch (error) {
        logger.warn({error}, `${STATUS.WARNING} Ollama analysis failed, falling back to local model`);
        return await fallbackAnalysis(text);
    }
}

async function fallbackAnalysis(text: string): Promise<{ sentiment: Sentiment; method: '🧮 Local Model' }> {
    try {
        const embedding = await embedText(text);
        const references = getReferenceEmbeddings();

        const similarities = Object.entries(references).map(([sentiment, refEmbedding]) => ({
            sentiment,
            similarity: cosineSimilarity(embedding, new Float32Array(refEmbedding))
        }));

        const bestMatch = similarities.reduce((a, b) =>
            a.similarity > b.similarity ? a : b
        );

        return {
            sentiment: bestMatch.sentiment as Sentiment,
            method: STATUS.MODELS.LOCAL
        };
    } catch (error) {
        logger.error({error}, `${STATUS.ERROR} Error in local sentiment analysis`);
        return {
            sentiment: 'Unknown',
            method: STATUS.MODELS.LOCAL
        };
    }
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

async function processNewsItems(newsItems: NewsItem[], ollamaUrl: string): Promise<AnalysisResult[]> {
    logger.info({count: newsItems.length}, `${STATUS.PROCESS} Processing news items`);
    const results: AnalysisResult[] = [];

    for (const item of newsItems) {
        try {
            logger.debug({title: item.title}, `${STATUS.PROCESS} Processing article`);

            if (item.link) {
                const content = await scrapeContent(item.link);
                // Check for failed content extraction cases
                if (content === 'No content extracted.' || content === 'Failed to extract content.') {
                    logger.warn({title: item.title}, `${STATUS.WARNING} Failed to extract content, skipping sentiment analysis`);
                    results.push({
                        title: item.title,
                        sentiment: 'Unknown',
                        method: STATUS.MODELS.LOCAL,
                        link: item.link
                    });
                    continue;  // Skip to next item
                }

                if (content) {
                    item.content = content;
                }
            }

            if (item.content) {
                const {sentiment, method} = await analyzeSentiment(item.content, ollamaUrl);
                const result: AnalysisResult = {
                    title: item.title,
                    sentiment,
                    method,
                    link: item.link
                };
                results.push(result);

                logger.info({
                    title: item.title,
                    sentiment,
                    method,
                    link: item.link
                }, `${method === STATUS.MODELS.OLLAMA ? '🤖' : '🧮'} Analysis complete`);
            } else {
                // Handle case where no content is available
                logger.warn({title: item.title}, `${STATUS.WARNING} No content available for analysis`);
                results.push({
                    title: item.title,
                    sentiment: 'Unknown',
                    method: STATUS.MODELS.LOCAL,
                    link: item.link
                });
            }
        } catch (error) {
            logger.error({
                error,
                title: item.title
            }, `${STATUS.ERROR} Error processing article`);

            results.push({
                title: item.title,
                sentiment: 'Unknown',
                method: STATUS.MODELS.LOCAL,
                link: item.link
            });
        }
    }

    return results;
}

function generateSummary(results: AnalysisResult[], startTime: number): AnalysisSummary {
    const summary: AnalysisSummary = {
        totalArticles: results.length,
        processedArticles: results.filter(r => r.sentiment !== 'Unknown').length,
        failedArticles: results.filter(r => r.sentiment === 'Unknown').length,
        sentimentDistribution: {
            Left: results.filter(r => r.sentiment === 'Left').length,
            Right: results.filter(r => r.sentiment === 'Right').length,
            Centre: results.filter(r => r.sentiment === 'Centre').length,
            Unknown: results.filter(r => r.sentiment === 'Unknown').length
        },
        methodDistribution: {
            ollama: results.filter(r => r.method === STATUS.MODELS.OLLAMA).length,
            local: results.filter(r => r.method === STATUS.MODELS.LOCAL).length
        },
        timeElapsed: Date.now() - startTime
    };

    logger.info('\n=========================');
    logger.info(`📊 Analysis Summary`);
    logger.info('=========================');
    logger.info(`📚 Total Articles: ${summary.totalArticles}`);
    logger.info(`✅ Successfully Processed: ${summary.processedArticles}`);
    logger.info(`❌ Failed: ${summary.failedArticles}`);
    logger.info('\n📈 Sentiment Distribution:');
    logger.info(`  Left: ${'🟦'.repeat(summary.sentimentDistribution.Left)} (${summary.sentimentDistribution.Left})`);
    logger.info(`  Right: ${'🟥'.repeat(summary.sentimentDistribution.Right)} (${summary.sentimentDistribution.Right})`);
    logger.info(`  Centre: ${'⬜'.repeat(summary.sentimentDistribution.Centre)} (${summary.sentimentDistribution.Centre})`);
    logger.info('\n🔄 Processing Method:');
    logger.info(`  Ollama: ${'🤖'.repeat(summary.methodDistribution.ollama)} (${summary.methodDistribution.ollama})`);
    logger.info(`  Local: ${'🧮'.repeat(summary.methodDistribution.local)} (${summary.methodDistribution.local})`);
    logger.info(`\n⏱️ Time Elapsed: ${(summary.timeElapsed / 1000).toFixed(2)}s`);
    logger.info('=========================\n');

    return summary;
}

async function main() {
    const startTime = Date.now();
    try {
        logger.info(`${STATUS.INIT} Starting news sentiment analyser`);

        // Validate Ollama connection and model availability
        const ollamaUrl = await validateOllamaUrl(OLLAMA_API_URL);
        const hasLLM = await checkRequiredModel(ollamaUrl, REQUIRED_MODEL);

        if (!hasLLM) {
            logger.warn(`${STATUS.WARNING} Required model "${REQUIRED_MODEL}" not available - will use local model only`);
        }

        // Initialize models and embeddings
        await loadModel();
        await initialiseReferenceEmbeddings();

        // Fetch and process news
        const newsItems = await fetchNews();
        const results = await processNewsItems(newsItems, ollamaUrl);
        generateSummary(results, startTime);

        logger.info(`${STATUS.COMPLETE} Analysis complete`);
    } catch (error) {
        if (error instanceof OllamaConnectionError) {
            logger.error({error}, `${STATUS.ERROR} Ollama connection error: ${error.message}`);
        } else {
            logger.error({error}, `${STATUS.ERROR} Error in main process`);
        }
        process.exit(1);
    }
}

// Run the application
if (import.meta.main) {
    main().catch((error) => {
        logger.error({error}, `${STATUS.ERROR} Fatal error`);
        process.exit(1);
    });
}