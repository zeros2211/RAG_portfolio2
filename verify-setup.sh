#!/bin/bash

# RAG Chat System - Setup Verification Script

echo "========================================"
echo "RAG Chat System - Setup Verification"
echo "========================================"
echo ""

# Check Docker
echo "1. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker not found. Please install Docker."
    exit 1
else
    echo "   ✅ Docker installed: $(docker --version)"
fi

# Check Docker Compose
echo ""
echo "2. Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "   ❌ Docker Compose not found. Please install Docker Compose."
    exit 1
else
    echo "   ✅ Docker Compose installed: $(docker-compose --version)"
fi

# Check if services are running
echo ""
echo "3. Checking running services..."
if docker ps | grep -q rag_ollama; then
    echo "   ✅ Ollama service is running"
else
    echo "   ⚠️  Ollama service not running. Run: docker-compose up -d"
fi

if docker ps | grep -q rag_backend; then
    echo "   ✅ Backend service is running"
else
    echo "   ⚠️  Backend service not running. Run: docker-compose up -d"
fi

if docker ps | grep -q rag_frontend; then
    echo "   ✅ Frontend service is running"
else
    echo "   ⚠️  Frontend service not running. Run: docker-compose up -d"
fi

# Check Ollama models
echo ""
echo "4. Checking Ollama models..."
if docker ps | grep -q rag_ollama; then
    MODELS=$(docker exec rag_ollama ollama list 2>/dev/null)

    if echo "$MODELS" | grep -q "qwen3-embedding:0.6b"; then
        echo "   ✅ Embedding model installed"
    else
        echo "   ❌ Embedding model missing. Run:"
        echo "      docker exec -it rag_ollama ollama pull qwen3-embedding:0.6b"
    fi

    if echo "$MODELS" | grep -q "qwen3:8b"; then
        echo "   ✅ LLM model installed"
    else
        echo "   ❌ LLM model missing. Run:"
        echo "      docker exec -it rag_ollama ollama pull qwen3:8b"
    fi
else
    echo "   ⚠️  Ollama container not running. Start services first."
fi

# Check data directories
echo ""
echo "5. Checking data directories..."
if [ -d "data/pdfs" ]; then
    echo "   ✅ PDFs directory exists"
else
    echo "   ❌ PDFs directory missing"
fi

if [ -d "data/chroma" ]; then
    echo "   ✅ ChromaDB directory exists"
else
    echo "   ❌ ChromaDB directory missing"
fi

# Check if port 80 is available
echo ""
echo "6. Checking port availability..."
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    if docker ps | grep -q rag_frontend; then
        echo "   ✅ Port 80 in use by RAG frontend"
    else
        echo "   ⚠️  Port 80 in use by another service"
        echo "      You may need to change the port in docker-compose.yml"
    fi
else
    echo "   ✅ Port 80 available"
fi

# Summary
echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. If services aren't running: docker-compose up -d"
echo "2. If models are missing: Pull them with ollama pull commands"
echo "3. Access the application: http://localhost"
echo ""
echo "For detailed setup: See QUICKSTART.md"
echo "For documentation: See README.md"
