## Docker Setup 🐳

You can run the entire application using Docker, without needing to install any dependencies locally.

### Using Docker Compose (Recommended)

1. Build and start the services:
```bash
docker-compose up --build
```

This will:
- Start Ollama service
- Download the Mistral model
- Build and start the sentiment analyzer
- Handle all networking between services

### Environment Variables 🔧

You can customize the behavior using environment variables in docker-compose.yml:

- `OLLAMA_HOST`: Ollama service host (default: http://ollama)
- `OLLAMA_PORT`: Ollama service port (default: 11434)
- `RSS_FEED_URL`: News feed URL (default: BBC News)
- `LOG_LEVEL`: Logging verbosity (default: info)

### Manual Docker Build 🏗️

If you prefer to run the containers separately:

1. Build the image:
```bash
docker build -t news-sentiment-analyzer .
```

2. Run Ollama:
```bash
docker run -d --name ollama -p 11434:11434 ollama/ollama
```

3. Run the analyzer:
```bash
docker run --link ollama:ollama news-sentiment-analyzer
```

### Persistent Storage 💾

Ollama models are stored in a named volume `ollama_data` and will persist between container restarts.