# RAG Chat System

[한국어](README.ko.md) | English

A production-ready **Retrieval-Augmented Generation (RAG)** chat system that enables users to upload PDF documents and ask questions through an intelligent conversational interface. Built with modern web technologies and designed for one-command deployment.

## Features

- **PDF Upload & Processing**
  - Drag-and-drop interface for PDF uploads
  - Automatic text extraction and processing
  - Real-time status updates (Processing → Ready → Failed)
  - Support for multiple document uploads

- **Intelligent Search**
  - Semantic search using vector embeddings
  - ChromaDB vector database with persistence
  - Page-aware chunking (no cross-page chunks)
  - Source attribution with page numbers

- **Conversational Chat**
  - Streaming responses via Server-Sent Events (SSE)
  - Multi-turn conversation support with context
  - Document filtering (search specific or all documents)
  - Real-time typing indicators

- **Source Citations**
  - Clickable sources with relevance scores
  - Direct navigation to PDF viewer at specific pages
  - Text snippets from relevant sections
  - Visual relevance indicators

- **PDF Viewer**
  - Built-in PDF viewer with react-pdf
  - Page navigation (previous/next/jump to page)
  - Direct linking from chat sources
  - Responsive design

- **One-Command Deployment**
  - Complete system runs with `docker-compose up`
  - No manual configuration required
  - Persistent data storage
  - Production-ready setup

## Technology Stack

### Backend
- **Python 3.9+** - Core language
- **FastAPI** - Modern async web framework
- **PyMuPDF (fitz)** - PDF text extraction
- **ChromaDB** - Vector database for embeddings
- **SQLite + SQLModel** - Session and conversation storage
- **Ollama** - Local LLM and embeddings

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - Component library
- **TailwindCSS** - Styling
- **react-pdf** - PDF viewer component
- **Axios** - HTTP client

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **Nginx** - Frontend server and API proxy
- **Ollama** - LLM inference server

## GPU Support

This system supports GPU acceleration for different platforms:

### For Linux with NVIDIA GPU (Default)
Requires NVIDIA GPU with drivers and `nvidia-container-toolkit` installed.

```bash
docker-compose up
```

### For macOS (Metal GPU via Native Ollama)
**⚠️ Important**: macOS users MUST use this method. The default `docker-compose up` will fail on macOS due to NVIDIA driver configuration.

```bash
# 1. Install Ollama natively
brew install ollama

# 2. Start Ollama and pull models
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 3. Start backend and frontend (without Docker Ollama)
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up
```

### For Other Systems (CPU Mode)
If you're on Windows or Linux without NVIDIA GPU, you'll need to use CPU mode. Contact the maintainer for CPU-only docker-compose configuration.

**Performance comparison:**
- CPU mode: ~10-20 tokens/sec
- **GPU (Linux with NVIDIA)**: ~50-100+ tokens/sec ⚡ (Default)
- **Metal (macOS Native)**: ~80-150+ tokens/sec ⚡ (Best for Mac)

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### TL;DR

**Linux with NVIDIA GPU:**
```bash
# 1. Start services
docker-compose up --build

# 2. Models download automatically with GPU acceleration
#    Wait for "All models ready!"

# 3. Open browser
open http://localhost
```

**macOS with Native Ollama (Metal GPU):**
```bash
# 1. Install and start native Ollama
brew install ollama
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 2. Start backend and frontend
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build

# 3. Open browser
open http://localhost
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Nginx      │───▶│   Backend   │
│ React+Vite  │◀───│ (SSE proxy)  │◀───│   FastAPI   │
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
                   ┌──────────────────────────┼────────────┐
                   │                          │            │
                   ▼                          ▼            ▼
            ┌──────────┐              ┌──────────┐  ┌──────────┐
            │  Ollama  │              │ ChromaDB │  │  SQLite  │
            │ qwen3:8b │              │ (vectors)│  │(sessions)│
            └──────────┘              └──────────┘  └──────────┘
```

### Data Flow

1. **Upload**: PDF → PyMuPDF → Text Extraction → Normalization → Chunking
2. **Indexing**: Chunks → Ollama Embedding → ChromaDB Storage
3. **Query**: User Question → Embedding → Semantic Search → Context Building
4. **Response**: Context + History → LLM → SSE Streaming → Frontend
5. **Citation**: Source Click → PDF Viewer (specific page)

## Why Ollama?

### Benefits
- **Local Deployment**: No external API keys or network dependencies
- **Privacy**: All data stays on your infrastructure
- **Cost**: No per-token charges
- **Control**: Full control over model selection and parameters
- **Speed**: Direct access without network latency

### Model Selection

**qwen3-embedding:0.6b** (Embedding Model)
- Small footprint (~400MB)
- Fast inference
- Good quality embeddings for semantic search
- Optimized for retrieval tasks

**qwen3:8b** (LLM Model)
- Balanced performance/quality (~5GB)
- Strong reasoning capabilities
- Good multilingual support
- Efficient for conversational AI

Alternative models can be easily swapped by changing the `.env` configuration.

## Project Structure

```
RAG_portfolio/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   │   ├── documents.py # Upload & document management
│   │   │   └── chat.py      # SSE streaming chat
│   │   ├── services/        # Business logic
│   │   │   ├── pdf_service.py
│   │   │   └── ollama_service.py
│   │   ├── db/              # Database clients
│   │   │   ├── chroma_client.py
│   │   │   └── sqlite_client.py
│   │   ├── models/          # Data models
│   │   ├── utils/           # Utilities
│   │   │   ├── text_normalizer.py
│   │   │   └── chunker.py
│   │   ├── config.py        # Configuration
│   │   └── main.py          # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── upload/      # Upload interface
│   │   │   ├── chat/        # Chat interface
│   │   │   └── viewer/      # PDF viewer
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks (useSSE)
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── data/                    # Persistent data (gitignored)
│   ├── pdfs/               # Uploaded PDFs
│   ├── chroma/             # Vector database
│   └── sessions.db         # Chat sessions
├── docker-compose.yml
├── QUICKSTART.md
└── README.md
```

## API Endpoints

### Documents

- `POST /api/documents` - Upload PDF files
- `GET /api/documents` - List all documents
- `GET /api/documents/{doc_id}` - Get document details
- `GET /api/documents/{doc_id}/file` - Download PDF

### Chat

- `POST /api/chat/stream` - Streaming chat endpoint (SSE)
  - Query params: `message`, `session_id`, `doc_ids`
  - Events: `session`, `token`, `sources`, `done`, `error`

### Health

- `GET /health` - Health check
- `GET /` - API info

## Configuration

Edit `backend/.env` to customize:

```env
# Ollama
OLLAMA_URL=http://ollama:11434
EMBEDDING_MODEL=qwen3-embedding:0.6b
LLM_MODEL=qwen3:8b

# RAG Parameters
CHUNK_SIZE=1000           # Characters per chunk
CHUNK_OVERLAP=150         # Overlap between chunks
TOP_K=5                   # Number of results to retrieve
MAX_CONTEXT_TURNS=5       # Conversation history turns
```

## Performance Optimizations

### Current Optimizations
- **Async Processing**: Background tasks for PDF processing
- **Sentence-Aware Chunking**: Better context preservation
- **Persistent ChromaDB**: Avoids re-indexing on restart
- **SSE Streaming**: Immediate response feedback
- **Page-Aware Chunking**: Accurate source attribution

### Future Improvements
1. **Batch Embeddings**: Process multiple chunks in parallel
2. **Caching**: Cache frequent queries and embeddings
3. **Hybrid Search**: Combine dense + sparse retrieval
4. **Model Quantization**: Faster inference with quantized models
5. **Async Queue**: Job queue for heavy processing
6. **Multi-GPU Support**: Distribute LLM inference

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Access API docs at `http://localhost:8000/docs`

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Access frontend at `http://localhost:5173`

### Environment Setup

1. Copy `.env.example` to `.env` in backend directory
2. Adjust settings as needed
3. Ensure Ollama is running and models are pulled

## Troubleshooting

### Ollama Connection Failed
```bash
# Check if Ollama container is running
docker ps | grep ollama

# Check Ollama logs
docker logs rag_ollama

# Verify models
docker exec -it rag_ollama ollama list
```

### Backend Errors
```bash
# View backend logs
docker logs rag_backend

# Check database files
ls -lh data/
```

### Frontend Not Loading
```bash
# Check nginx logs
docker logs rag_frontend

# Rebuild frontend
docker-compose up --build frontend
```

### SSE Streaming Issues
- Ensure nginx has `proxy_buffering off` in config
- Check browser console for EventSource errors
- Verify CORS settings in backend

### GPU Not Detected (Linux)
```bash
# Verify NVIDIA drivers
nvidia-smi

# Check if Docker can access GPU
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Check Ollama is using GPU
docker logs rag_ollama | grep -i "offloaded.*gpu"
# Should show: "offloaded 37/37 layers to GPU"

# Ensure you're using the GPU compose file
docker-compose -f docker-compose.yml -f docker-compose.nvidia.yml up
```

## Security Considerations

- **Production Deployment**:
  - Change CORS settings from `allow_origins=["*"]`
  - Use environment variables for sensitive config
  - Add authentication/authorization
  - Enable HTTPS with SSL certificates
  - Rate limiting for API endpoints

- **Data Privacy**:
  - All processing happens locally
  - No data sent to external services
  - Uploaded PDFs stored in local filesystem
