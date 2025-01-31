# News Sentiment Analyser 📰 🤖

Analyse the political sentiment of news articles using AI, powered by Ollama and TensorFlow. This tool automatically fetches news from RSS feeds and determines if articles lean Left, Right, or Centre in their political perspective.

## Features 🌟

- 🔄 Real-time RSS feed processing
- 🧠 Local AI analysis using Ollama (Mistral model)
- 📊 Visual sentiment statistics
- 🚀 High-performance processing with Bun
- 💾 Model caching for improved performance
- 📈 Beautiful console output with sentiment distribution

## How It Works 🛠️

1. Fetches latest news from your chosen RSS feed
2. Uses Ollama (Mistral) to analyse political sentiment
3. Falls back to TensorFlow embeddings if Ollama is unavailable
4. Generates a visual summary of political leanings

Example output:
```
=========================
📊 Analysis Summary
=========================
📚 Total Articles: 10
✅ Successfully Processed: 9
❌ Failed: 1

📈 Sentiment Distribution:
  Left: 🟦🟦🟦 (3)
  Right: 🟥🟥 (2)
  Centre: ⬜⬜⬜⬜ (4)

🔄 Processing Method:
  Ollama: 🤖🤖🤖🤖🤖 (5)
  Local: 🧮🧮🧮🧮 (4)

⏱️ Time Elapsed: 12.34s
=========================
```

## Quick Start with Docker 🐳

The easiest way to run the analyser is using Docker Compose:

```bash
docker-compose up --build
```

This will:
- 📦 Set up all required dependencies
- 🤖 Start Ollama with the Mistral model
- 🚀 Launch the sentiment analyser
- 📊 Begin processing the latest news

## Configuration Options ⚙️

Customise the behaviour using environment variables:

```bash
# Basic usage with custom RSS feed (default: BBC News feed)
RSS_FEED_URL=https://your-news-source.com/feed.xml docker-compose up

# Enable debug logging
LOG_LEVEL=debug docker-compose up

# Custom Ollama settings
OLLAMA_HOST=http://custom-host OLLAMA_PORT=11434 docker-compose up
```

## Manual Setup 🔧

If you prefer to run without Docker, you'll need:

1. Prerequisites:
   - [Bun](https://bun.sh) installed
   - [Ollama](https://ollama.ai) running locally
   - Node.js 18+ (for TensorFlow)

2. Installation:
   ```bash
   # Clone the repository
   git clone https://github.com/milesburton/news-sentiment-reader.git
   cd news-sentiment-reader

   # Install dependencies
   bun install

   # Run the analyser
   bun run start
   ```

## Project Structure 📁

```
src/
  ├── types/          # TypeScript type definitions
  ├── utils/          # Utility functions and logger
  ├── download-model  # TensorFlow model management
  ├── fetchNews      # RSS feed handling
  ├── scrapeContent  # Article content extraction
  └── main           # Application entry point
```

## Error Handling 🔧

The analyser is designed to be resilient:
- ✅ Automatic fallback to TensorFlow if Ollama is unavailable
- 🔄 Continues processing even if some articles fail
- 📝 Detailed logging of any issues
- 🛡️ Graceful handling of network errors

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## Troubleshooting 🔍

Common issues and solutions:

1. **Ollama Connection Failed**
   - Ensure Ollama is running
   - Check the OLLAMA_HOST and OLLAMA_PORT settings
   - The analyser will automatically fall back to TensorFlow

2. **RSS Feed Issues**
   - Verify the RSS_FEED_URL is accessible
   - Check your internet connection
   - Ensure the feed is properly formatted RSS

3. **Performance Issues**
   - Adjust LOG_LEVEL to reduce output
   - Ensure sufficient system resources
   - Check Docker resource allocation

## Licence 📄

[MIT](LICENSE)

## Acknowledgements 🙏

- Ollama team for the local AI capabilities
- TensorFlow.js team for the embeddings model
- Bun team for the high-performance runtime