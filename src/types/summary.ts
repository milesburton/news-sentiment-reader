import { Sentiment } from './news';

export interface AnalysisResult {
  title: string;
  sentiment: Sentiment;
  method: '🤖 Ollama' | '🧮 Local Model';
  link?: string;
}

export interface AnalysisSummary {
  totalArticles: number;
  processedArticles: number;
  failedArticles: number;
  sentimentDistribution: {
    [key in Sentiment]: number;
  };
  methodDistribution: {
    ollama: number;
    local: number;
  };
  timeElapsed: number;
}