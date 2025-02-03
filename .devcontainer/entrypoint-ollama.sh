#!/bin/bash

# Start Ollama in the background.
/bin/ollama serve &
# Record Process ID.
pid=$!

# Pause for Ollama to start.
sleep 5

echo "🔴 Retrieve deepseek-r1:14b model..."
ollama pull deepseek-r1:14b
echo "🟢 Done!"

# Some Pause.
sleep 5
ollama run deepseek-r1:14b

# Wait for Ollama process to finish.
wait $pid


