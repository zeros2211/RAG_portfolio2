#!/bin/bash

# Start Ollama server in background
/usr/bin/ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama server to start..."
sleep 5

# Check if models are already downloaded
EMBEDDING_MODEL="qwen3-embedding:0.6b"
LLM_MODEL="qwen3:8b"

echo "Checking if models are downloaded..."

# Check embedding model
if ! ollama list | grep -q "$EMBEDDING_MODEL"; then
    echo "Downloading embedding model: $EMBEDDING_MODEL"
    echo "This may take a few minutes (~400MB)..."
    ollama pull "$EMBEDDING_MODEL"
    echo "✅ Embedding model downloaded!"
else
    echo "✅ Embedding model already exists"
fi

# Check LLM model
if ! ollama list | grep -q "$LLM_MODEL"; then
    echo "Downloading LLM model: $LLM_MODEL"
    echo "This may take 5-10 minutes (~5GB)..."
    ollama pull "$LLM_MODEL"
    echo "✅ LLM model downloaded!"
else
    echo "✅ LLM model already exists"
fi

echo "🎉 All models ready!"
echo "Ollama is now running and ready to use."

# Keep the container running (wait for the background process)
wait
