# RAG Chat System

[한국어](README.md) | English

A **Retrieval-Augmented Generation (RAG)** chat system that enables users to upload PDF documents and ask questions through an intelligent conversational interface. Built with modern web technologies and designed for one-command deployment.

## Quick Start

See [QUICKSTART.md](QUICKSTART.en.md) for detailed setup instructions.

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

**Performance comparison** (varies by hardware):
- CPU mode: ~10-30 tokens/sec
- **GPU (Linux with NVIDIA)**: ~50-150+ tokens/sec ⚡ (Default)
- **Metal (macOS Native)**: ~30-80+ tokens/sec ⚡ (Recommended for Mac)

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

## LLM Serving Framework Selection

### Why Ollama?

After evaluating multiple LLM serving frameworks, I chose **Ollama** for this project.

**Key Benefits:**
- **Local Deployment**: No external API keys or network dependencies
- **Privacy**: All data stays on your infrastructure
- **Cost**: No per-token charges
- **Speed**: Direct access without network latency

### Model Selection

| Model | Purpose | Size | Features |
|-------|---------|------|----------|
| **qwen3-embedding:0.6b** | Embedding | ~400MB | Optimized for retrieval, fast inference |
| **qwen3:8b** | LLM | ~5GB | Balanced performance/quality, strong multilingual support |

Alternative models can be easily swapped by changing the `.env` configuration.

Here's the detailed comparison and rationale:

#### Framework Comparison

| Framework | Pros | Cons | Use Case |
|-----------|------|------|----------|
| **Ollama** | - Simple API<br>- Built-in model management<br>- Docker-friendly<br>- Good documentation | - Limited optimization options<br>- Less control over inference | Small-medium deployments, rapid prototyping |
| **vLLM** | - Excellent throughput<br>- PagedAttention optimization<br>- Batch processing | - Complex setup<br>- Higher resource requirements<br>- GPU-focused | High-throughput production systems |
| **Text Generation Inference (TGI)** | - Production-ready<br>- Advanced features<br>- HuggingFace integration | - Steep learning curve<br>- Heavyweight | Enterprise deployments |
| **LocalAI** | - OpenAI-compatible API<br>- Multi-modal support | - Less mature<br>- Community-driven | API compatibility needs |

#### Decision Rationale

**1. Deployment Simplicity** (High Priority)
- **Requirement**: One-command deployment (`docker-compose up`)
- **Ollama Advantage**: Pre-built Docker images, automatic model pulling, zero configuration
- **Impact**: Model download + environment setup + service start all in a single command

**2. Development Speed** (High Priority)
- **Ollama's Simple API**: Direct HTTP calls, no complex client setup
- **Model Management**: `ollama pull` vs manual model downloads + configuration
- **Iteration Speed**: Fast model switching for experimentation

**3. Resource Efficiency** (Medium Priority)
- **Memory Footprint**: Ollama's efficient model loading (shared across requests)
- **CPU Fallback**: Automatically switches to CPU inference when GPU unavailable
- **Comparison** (qwen3:8b):
  - Ollama: ~6GB (GPU VRAM or system RAM, auto-selected based on environment)
  - vLLM: ~16GB GPU VRAM at FP16, ~5-8GB with quantization (GPU required)
  - TGI: ~16GB GPU VRAM at FP16 (GPU required)

**4. Feature Requirements**
- **Streaming**: ✅ Ollama supports NDJSON streaming natively (converted to SSE in backend)
- **Embeddings**: ✅ Built-in embedding endpoint
- **Conversation Context**: ✅ Stateless design fits RAG pattern
- **Advanced Optimizations**: ⚠️ Not needed for this scale (5-10 concurrent users)

#### Trade-offs

**What We Gain:**
- Fast deployment and iteration
- Simple debugging and monitoring
- Easy model experimentation
- Good developer experience

**What We Sacrifice:**
- vLLM's continuous batching and PagedAttention (KV cache memory optimization)
- Fine-grained control over inference parameters
- Maximum theoretical throughput

**Why It's Worth It:**
For a RAG system with expected load of 5-10 concurrent users, deployment simplicity and development speed outweigh raw performance. If scaling to 100+ concurrent users, migrating to vLLM would be the next step.

#### Production Considerations

**When to Switch:**
- **User Load**: >50 concurrent users → Consider vLLM
- **Response Time**: Current 2-3s is acceptable; if <1s needed → vLLM's optimized inference
- **Cost Optimization**: High GPU utilization needed → vLLM's better batching

**Migration Path:**
Ollama's stateless API design makes migration straightforward - only `ollama_service.py` needs updating, keeping business logic intact.

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

- `GET /api/chat/stream` - Streaming chat endpoint (SSE)
- `GET /api/chat/sessions` - List all chat sessions
- `GET /api/chat/sessions/{session_id}` - Get specific session
- `DELETE /api/chat/sessions/{session_id}` - Delete session
- `PUT /api/chat/sessions/{session_id}/title` - Update session title
- `GET /api/chat/sessions/{session_id}/messages` - Get session messages

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

## Proposed Improvements

### 1. Embedding Generation Parallelization
**Current State:** Embeddings are generated sequentially per chunk (~100ms each)

**Proposed:** Use Ollama's batch API to embed multiple chunks in a single request

**Expected Impact:**
- Processing Time: 1000ms (10 chunks) → 150ms (85% reduction)
- PDF Indexing: 30s (100 pages) → 7s

**Why Not Implemented:**
- Ollama's batch API has limited documentation
- Risk of memory issues with large batches
- Diminishing returns for current load (1-2 concurrent uploads)

### 2. Query Embedding Caching
**Current State:** Identical queries re-compute embeddings every time (~100ms)

**Proposed:** In-memory cache keyed by query string to reuse embeddings for repeated queries

**Expected Impact:**
- Cache Hit Rate: ~40% (estimated from typical usage)
- Avg Response Time: 3.5s → 2.8s (20% improvement)
- Cost: ~50MB RAM for 1000 cached queries

**Why Not Implemented:**
- Need to handle cache invalidation on model changes
- Session-specific queries reduce hit rate
- **Priority:** Medium (nice-to-have for better UX)

### 3. Hybrid Search (Dense + Sparse)
**Current State:** Pure semantic search (cosine similarity) only, which can miss exact keyword matches

**Proposed:** Combine dense embeddings (ChromaDB) + sparse retrieval (BM25), merge results via Reciprocal Rank Fusion (RRF)

**Expected Impact:**
- Retrieval Accuracy: +10-15% (especially for technical terms, names)
- Example: Query "API endpoints" better matches "REST API" sections
- Latency: +30ms (BM25 is fast)

**Why Not Implemented:**
- Additional dependency (rank-bm25)
- Increased complexity in result merging
- Need to maintain separate BM25 index
- **Benefit/Cost Ratio:** Moderate (good improvement but complex)

### 4. Model Quantization
**Current:** Q4_K_M quantized model (Ollama default, ~5GB for qwen3:8b)
**Proposed:** Higher precision quantization (Q8_0) or FP16 model

**Expected Impact:**
- Q8_0: Quality +2-3%, model size ~8.5GB, inference speed -10-20%
- FP16: Maximum quality, model size ~16GB, inference speed -30-50%
- Improved accuracy for complex reasoning and multilingual processing

**Why Not Implemented:**
- Current Q4_K_M provides sufficient quality for most RAG queries
- Higher precision significantly increases memory requirements
- May not be viable in GPU VRAM-constrained environments
- **Priority:** Low (current quality acceptable for POC)

### 5. Task Queue for PDF Processing
**Current State:** FastAPI's `BackgroundTasks` handles background processing, but runs in the same process, so CPU-intensive work (text extraction, embedding generation) can indirectly affect the event loop

**Proposed:** Offload PDF processing to separate worker processes via Celery/RQ for complete isolation

**Expected Impact:**
- Backend Responsiveness: Full isolation of CPU-intensive tasks
- Scalability: Can queue 100+ documents
- Monitoring: Better job status tracking

**Why Not Implemented:**
- Adds infrastructure complexity (Redis/RabbitMQ)
- Overkill for current load (<10 concurrent uploads)
- Current `BackgroundTasks` approach sufficient
- **When Needed:** >50 concurrent uploads or >100MB PDF files

### 6. Monitoring & Observability
**Current State:** Basic logging only

**Proposed:** Add timers to each component (embedding, search, LLM) to track P50/P95/P99 latencies, error rates, and resource utilization (Prometheus + Grafana, etc.)

**Expected Impact:**
- Quantitative identification of bottlenecks
- Anomaly detection and alerting
- Data-driven performance optimization

**Why Not Implemented:**
- Adds observability stack and infrastructure complexity
- Focus on core functionality for interview scope

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
