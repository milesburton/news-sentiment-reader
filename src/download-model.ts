import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs-node';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(__dirname, '../models/embeddings-cache');
const REFERENCE_EMBEDDINGS_PATH = join(CACHE_DIR, 'reference-embeddings.json');

let model: use.UniversalSentenceEncoder | null = null;
let referenceEmbeddings: { [key: string]: number[] } | null = null;

// Initialise TensorFlow backend
tf.setBackend('tensorflow');

export async function loadModel(): Promise<use.UniversalSentenceEncoder> {
  if (!model) {
    logger.info('Loading Universal Sentence Encoder...');
    model = await use.load();
    logger.info('Model loaded successfully');
  }
  return model;
}

export async function embedText(text: string): Promise<Float32Array> {
  const model = await loadModel();
  const embeddings = await model.embed(text);
  const result = await embeddings.array();
  embeddings.dispose(); // Clean up tensor
  return new Float32Array(result[0]);
}

export async function initialiseReferenceEmbeddings(): Promise<void> {
  // Create cache directory if it doesn't exist
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    if (existsSync(REFERENCE_EMBEDDINGS_PATH)) {
      logger.info('Loading cached reference embeddings...');
      const cached = JSON.parse(readFileSync(REFERENCE_EMBEDDINGS_PATH, 'utf-8'));
      referenceEmbeddings = cached;
    } else {
      logger.info('Computing reference embeddings...');
      referenceEmbeddings = {
        Left: Array.from(await embedText("Progressive policies focusing on social welfare and environmental protection")),
        Right: Array.from(await embedText("Conservative values emphasising free market and traditional principles")),
        Centre: Array.from(await embedText("Balanced approach considering multiple viewpoints and moderate policies"))
      };

      // Cache the embeddings
      writeFileSync(REFERENCE_EMBEDDINGS_PATH, JSON.stringify(referenceEmbeddings));
      logger.info('Reference embeddings cached successfully');
    }
  } catch (error) {
    logger.error({ error }, 'Error initialising reference embeddings');
    throw error;
  }
}

export function getReferenceEmbeddings(): { [key: string]: number[] } {
  if (!referenceEmbeddings) {
    throw new Error('Reference embeddings not initialised. Call initialiseReferenceEmbeddings() first.');
  }
  return referenceEmbeddings;
}