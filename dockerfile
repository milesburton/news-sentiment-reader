# Use VSCode development container as base
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:latest

# Install Fish shell and other tools
USER root
RUN apt-get update && apt-get install -y \
    fish \
    gh \
    docker.io \
    docker-compose \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set Fish as default shell
SHELL ["/usr/bin/fish", "-c"]
ENV SHELL=/usr/bin/fish

# Install bun as root and make it available system-wide
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Set up Fish config for node user
RUN mkdir -p /home/node/.config/fish \
    && echo "set -x EDITOR code" >> /home/node/.config/fish/config.fish \
    && echo "set -x VISUAL code" >> /home/node/.config/fish/config.fish \
    && echo "alias g='git'" >> /home/node/.config/fish/config.fish \
    && echo "alias d='docker'" >> /home/node/.config/fish/config.fish \
    && echo "alias dc='docker-compose'" >> /home/node/.config/fish/config.fish \
    && echo "alias gh='gh'" >> /home/node/.config/fish/config.fish \
    && echo "gh completion -s fish | source" >> /home/node/.config/fish/config.fish \
    && chown -R node:node /home/node/.config

# Switch to node user
USER node
WORKDIR /workspace

# Set default environment variables
ENV OLLAMA_HOST=http://ollama
ENV OLLAMA_PORT=11434
ENV RSS_FEED_URL=https://feeds.bbci.co.uk/news/rss.xml
ENV LOG_LEVEL=info