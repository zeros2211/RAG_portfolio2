# RAG Chat System - Quick Start Guide

[한국어](QUICKSTART.ko.md) | English

This guide will help you get the RAG Chat System up and running in minutes.

## Prerequisites

### Common Requirements
- Docker and Docker Compose installed
- At least 8GB RAM available (12GB+ recommended)
- Port 80 available (or modify docker-compose.yml)
- Good internet connection (will download ~5.4GB of models)

### Platform-Specific Requirements

**For Linux with NVIDIA GPU:**
- NVIDIA GPU with recent drivers
- `nvidia-container-toolkit` installed
- Use: `docker-compose up`

**For macOS:**
- Homebrew installed
- Native Ollama (installed via brew)
- Use: `docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up`

## Step 1: Start the Services

Choose the appropriate method for your system:

### For Linux with NVIDIA GPU

**Prerequisites:**
1. NVIDIA GPU with recent drivers
2. Install nvidia-container-toolkit:
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
     sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

**Start services:**
```bash
# From the project root directory
docker-compose up --build
```

Performance: ~50-100+ tokens/sec with GPU acceleration

### For macOS (Metal GPU via Native Ollama)

**⚠️ Important**: macOS users MUST use this method. Running `docker-compose up` on macOS will fail with:
```
Error response from daemon: could not select device driver "nvidia" with capabilities: [[gpu]]
```

**Setup and start:**
```bash
# 1. Install and start Ollama natively
brew install ollama
ollama serve &
ollama pull qwen3-embedding:0.6b
ollama pull qwen3:8b

# 2. Start backend and frontend (without Docker Ollama)
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build
```

Performance: ~80-150+ tokens/sec with Metal GPU acceleration

This will:
1. Build and start Ollama server
2. **Automatically download required AI models** (~5.4GB total)
   - qwen3-embedding:0.6b (~400MB) for text embeddings
   - qwen3:8b (~5GB) for chat responses
3. Start Backend API (FastAPI)
4. Start Frontend (React + Nginx)

**Note**: The first startup will take 5-10 minutes to download models depending on your internet connection. Subsequent starts will be much faster as models are cached.

## Step 2: Wait for Models to Download

Watch the logs for these messages:
```
ollama  | ✅ Embedding model downloaded!
ollama  | ✅ LLM model downloaded!
ollama  | 🎉 All models ready!
```

Or check model status:
```bash
docker exec -it rag_ollama ollama list
```

You should see both models listed:
- qwen3-embedding:0.6b
- qwen3:8b

### Verify GPU Usage (GPU mode only)

Check if GPU is being used:
```bash
# Check GPU detection in logs
docker logs rag_ollama 2>&1 | grep -i "gpu\|metal\|cuda"

# You should see something like:
# "offloaded 37/37 layers to GPU"
# "device=GPU size=4.9 GiB"
```

If you see "offloaded 0/37 layers to GPU" or "device=CPU", GPU is not being used.

## Step 3: Access the Application

Once you see "All models ready!" in the logs, open your browser:
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

### Models Not Downloading
If models aren't downloading automatically:
```bash
# Check Ollama logs
docker logs rag_ollama

# Manually pull models if needed
docker exec -it rag_ollama ollama pull qwen3-embedding:0.6b
docker exec -it rag_ollama ollama pull qwen3:8b
```

### Port Already in Use
If port 80 is already in use, edit `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "8080:80"  # Change to 8080 or any available port
```

Then access at `http://localhost:8080`

### Restart Everything

**Default mode:**
```bash
docker-compose down
docker-compose up --build
```

**Native Ollama mode:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml down
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up --build
```

To also clear all data (uploaded PDFs, chat history):
```bash
docker-compose down -v
# Then use the appropriate up command for your mode
```

### Error on macOS: "could not select device driver nvidia"

This is expected! macOS users should use the Native Ollama method instead:
```bash
# Stop any running containers first
docker-compose down

# Use Native Ollama method
docker-compose -f docker-compose.yml -f docker-compose.native_ollama.yml up
```

See the "For macOS" section in Step 1 for full setup instructions.

### GPU Not Working (Linux)

If GPU is not being detected on Linux:

1. **Check NVIDIA drivers:**
   ```bash
   nvidia-smi
   ```
   Should show your GPU.

2. **Check nvidia-container-toolkit:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
   ```
   Should show GPU inside container.

3. **Check Ollama logs:**
   ```bash
   docker logs rag_ollama | grep -i gpu
   ```
   Look for "offloaded X/Y layers to GPU" where X should equal Y.

4. **Verify nvidia-container-toolkit is properly configured:**
   Ensure nvidia-container-toolkit is installed and Docker daemon was restarted after installation.

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
