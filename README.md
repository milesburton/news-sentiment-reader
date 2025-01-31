# News Sentiment Analyzer 📰 🤖

Analyze the political sentiment of BBC news articles using AI. Built with Bun, TypeScript, and TensorFlow.js.

## Features 🌟

- 📊 Real-time news sentiment analysis
- 🔄 RSS feed integration
- 🧠 Local AI model caching
- ⚡ High-performance text processing
- 🔍 Fallback sentiment analysis using embeddings

## Prerequisites 📋

- [Bun](https://bun.sh) installed on your system
- [Ollama](https://ollama.ai) running locally with Mistral model
- Node.js 18+ (for TensorFlow.js dependencies)

## Setup 🛠️

1. Clone the repository:
```bash
git clone <repository-url>
cd news-sentiment-analyser
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
RSS_FEED_URL=https://feeds.bbci.co.uk/news/rss.xml
```

4. Download the AI model:
```bash
bun run download-model
```

## Usage 🚀

Run the analyzer:
```bash
bun run start
```

## Project Structure 📁

```
src/
  ├── types/          # Type definitions
  ├── download-model  # Model management
  ├── fetchNews      # RSS feed handling
  ├── scrapeContent  # Article scraping
  └── main           # Application entry point
```

## Error Handling 🔧

- The application will fallback to embedding-based analysis if Ollama is unavailable
- Failed article fetches are logged but won't stop the application
- Network timeouts are handled gracefully

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

[MIT](LICENSE)

## Acknowledgments 🙏

- BBC News for their RSS feed
- Ollama team for the local AI model
- TensorFlow.js team for their embeddings model