export interface NewsItem {
  title: string;
  link?: string;
  content?: string;
  pubDate?: string;
  contentSnippet?: string;
}

export interface ScrapedContent {
  title?: string;
  content: string;
}

export type Sentiment = 'Left' | 'Right' | 'Centre' | 'Unknown';