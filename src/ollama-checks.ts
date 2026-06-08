import axios from 'axios';
import {logger} from './utils/logger';
import {setTimeout} from 'timers/promises';

export class OllamaConnectionError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
        this.name = 'OllamaConnectionError';
    }
}

export interface OllamaTagsResponse {
    models: Array<{
        name: string;
        model: string;
        modified_at: string;
        size: number;
        digest: string;
    }>;
}

async function checkOllamaConnection(url: string, attempt = 1, maxRetries = 3): Promise<boolean> {
    try {
        logger.info(`Attempting to connect to Ollama (attempt ${attempt}/${maxRetries}): ${url}`);

        const response = await axios.get<OllamaTagsResponse>(`${url}/api/tags`, {
            timeout: 5000,  // 5 second timeout
            validateStatus: null  // Allow any status code for debugging
        });

        logger.info({
            status: response.status,
            data: response.data,
            headers: response.headers
        }, 'Ollama response details');

        if (response.status === 200 && Array.isArray(response.data?.models)) {
            logger.info('Successfully connected to Ollama');
            return true;
        }

        logger.warn({
            status: response.status,
            data: response.data
        }, 'Unexpected response from Ollama');
        return false;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error({
                error: error.message,
                status: error.response?.status,
                url,
                config: error.config,
                response: error.response?.data
            }, '❌ Ollama connection check failed');

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                logger.info(`Retrying in ${delay}ms...`);
                await setTimeout(delay);
                return checkOllamaConnection(url, attempt + 1, maxRetries);
            }

            throw new OllamaConnectionError(
                `Failed to connect to Ollama server at ${url}: ${error.message}`,
                error.response?.status
            );
        }
        throw error;
    }
}

export async function validateOllamaUrl(url: string): Promise<string> {
    logger.info(`Validating Ollama URL: ${url}`);

    // Remove trailing slashes
    const sanitizedUrl = url.replace(/\/+$/, '');

    // Check if URL is valid
    try {
        new URL(sanitizedUrl);
    } catch (error) {
        throw new OllamaConnectionError(`Invalid Ollama URL: ${url}`);
    }

    // Check if URL is accessible
    try {
        const isConnected = await checkOllamaConnection(sanitizedUrl);
        if (!isConnected) {
            throw new OllamaConnectionError(`Ollama server at ${sanitizedUrl} is not responding correctly`);
        }
        return sanitizedUrl;
    } catch (error) {
        if (error instanceof OllamaConnectionError) {
            throw error;
        }
        throw new OllamaConnectionError(`Failed to validate Ollama URL: ${error.message}`);
    }
}

export async function checkRequiredModel(url: string, modelName: string): Promise<boolean> {
    try {
        logger.info(`Checking for required model: ${modelName}`);
        const response = await axios.get<{ models: Array<{ name: string }> }>(`${url}/api/tags`);
        const availableModels = response.data.models.map(model => model.name);
        const hasModel = availableModels.includes(modelName);

        logger.info({
            availableModels,
            requiredModel: modelName,
            found: hasModel
        }, 'Model check results');

        if (!hasModel) {
            logger.warn({
                modelName,
                availableModels
            }, `⚠️ Required model "${modelName}" not found in Ollama installation`);
        }
        return hasModel;
    } catch (error) {
        logger.error({
            error: error.message,
            modelName,
            url
        }, '❌ Failed to check Ollama model availability');
        return false;
    }
}