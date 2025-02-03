# Use an Ubuntu base for better compatibility
FROM ubuntu:22.04
# Prevent timezone prompt during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/London
# Install essential packages and Node.js
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    python3 \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_current.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# Install bun
RUN curl -fsSL https://bun.sh/install | bash
# Set up working directory
WORKDIR /app
# Copy package files
COPY package.json bun.lockb ./
# Add bun and node to PATH
ENV PATH="/root/.bun/bin:/usr/local/bin/node:${PATH}"
# Install dependencies
RUN bun install
# Copy the rest of the application
COPY . .
# Create models directory
RUN mkdir -p models/embeddings-cache
# Set default environment variables
ENV OLLAMA_HOST=http://ollama
ENV OLLAMA_PORT=11434
ENV RSS_FEED_URL=https://feeds.bbci.co.uk/news/rss.xml
ENV LOG_LEVEL=info
# Start the application
CMD ["bun", "run", "start"]