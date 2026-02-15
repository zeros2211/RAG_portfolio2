# RAG Chat System - Quick Start Guide

This guide will help you get the RAG Chat System up and running in minutes.

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM available
- Port 80 available (or modify docker-compose.yml)

## Step 1: Start the Services

```bash
# From the project root directory
docker-compose up --build
```

This will start:
- Ollama server (for embeddings and LLM)
- Backend API (FastAPI)
- Frontend (React + Nginx)

## Step 2: Pull Ollama Models

In a new terminal, pull the required models:

```bash
# Pull embedding model (small, ~400MB)
docker exec -it rag_ollama ollama pull qwen3-embedding:0.6b

# Pull LLM model (~5GB - this may take a few minutes)
docker exec -it rag_ollama ollama pull qwen3:8b
```

**Note**: The first pull will take some time depending on your internet connection.

## Step 3: Verify Models

```bash
docker exec -it rag_ollama ollama list
```

You should see both models listed:
- qwen3-embedding:0.6b
- qwen3:8b

## Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost
```

## Using the System

### 1. Upload Documents

- Drag and drop PDF files onto the upload zone, or click "Select Files"
- Wait for the status to change from "Processing" to "Ready"
- Select specific documents to chat with, or leave all selected

### 2. Start Chat

- Click "Start Chat" button
- You'll be redirected to the chat interface
- Ask questions about your uploaded documents

### 3. View Sources

- After each response, sources will appear in the right panel
- Click on any source to view the PDF at the specific page

## Troubleshooting

### Models Not Found
If you see warnings about missing models in the logs:
```bash
docker logs rag_backend
```

Pull the models again as shown in Step 2.

### Port Already in Use
If port 80 is already in use, edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Change to 8080 or any available port
```

Then access at `http://localhost:8080`

### Restart Everything
To do a clean restart:
```bash
docker-compose down
docker-compose up --build
```

To also clear all data (uploaded PDFs, chat history):
```bash
docker-compose down -v
docker-compose up --build
```

## Next Steps

- See `README.md` for full documentation
- Check `ai_logs/README.md` for AI development notes
- Explore the API at `http://localhost/docs` (FastAPI Swagger UI)

## Development Mode

To run in development mode with hot reload:

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then access frontend at `http://localhost:5173`
